import React, { useEffect, useRef, useCallback } from 'react';
import { RadioStation, AmbientSoundType } from '../types/index.js';
import { extractYouTubeId, isYouTubeUrl } from '../utils/youtube.js';
import { isSpotifyUrl } from '../utils/spotify.js';
import { youtubeAudio } from '../utils/youtubePlayer.js';
import { spotifyAudio } from '../utils/spotifyPlayer.js';
import { sound } from '../utils/sound.js';
import { api } from '../services/api.js';

interface Props {
  stations: RadioStation[];
  currentStationId: string | null;
  isPlaying: boolean;
  radioVolume: number;
  ambientSound: AmbientSoundType;
  ambientVolume: number;
  onHistoryUpdated?: () => void;
}

type ActiveEngine =
  | 'none'
  | 'html-audio'
  | 'youtube-iframe'
  | 'youtube-stream'
  | 'synth-ambient'
  | 'spotify-iframe';

export const SoundtrackEngine: React.FC<Props> = ({
  stations,
  currentStationId,
  isPlaying,
  radioVolume,
  ambientSound,
  ambientVolume,
  onHistoryUpdated,
}) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const currentHistoryIdRef = useRef<string | null>(null);
  const playStartTimeRef = useRef<number | null>(null);
  const engineRef = useRef<ActiveEngine>('none');
  const userGesturePendingRef = useRef<boolean>(false);

  const activeStation = stations.find((s) => s.id === currentStationId) || stations[0];

  // Up-to-date refs to prevent stale closure bugs during user gesture / async callbacks
  const isPlayingRef = useRef(isPlaying);
  isPlayingRef.current = isPlaying;

  const activeStationRef = useRef<RadioStation | undefined>(activeStation);
  activeStationRef.current = activeStation;

  const radioVolumeRef = useRef(radioVolume);
  radioVolumeRef.current = radioVolume;

  const ambientSoundRef = useRef(ambientSound);
  ambientSoundRef.current = ambientSound;

  const ambientVolumeRef = useRef(ambientVolume);
  ambientVolumeRef.current = ambientVolume;

  const closeActiveHistory = () => {
    if (currentHistoryIdRef.current && playStartTimeRef.current) {
      const elapsed = Math.max(1, Math.round((Date.now() - playStartTimeRef.current) / 1000));
      const histId = currentHistoryIdRef.current;
      currentHistoryIdRef.current = null;
      playStartTimeRef.current = null;
      api
        .updatePlayEnd(histId, elapsed)
        .then(() => onHistoryUpdated?.())
        .catch(console.error);
    }
  };

  const openNewHistory = async (station: RadioStation) => {
    try {
      playStartTimeRef.current = Date.now();
      const item = await api.recordPlayStart({
        radio_id: station.id,
        radio_name: station.name,
        room_id: null,
        started_at: new Date().toISOString(),
      });
      currentHistoryIdRef.current = item.id;
      onHistoryUpdated?.();
    } catch (err) {
      console.warn('Could not record play start:', err);
    }
  };

  const stopHtmlAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
  };

  const stopAllEngines = () => {
    stopHtmlAudio();
    youtubeAudio.pause();
    spotifyAudio.pause();
    spotifyAudio.setVisible(false);
    if (engineRef.current === 'synth-ambient') {
      sound.stopAmbient();
    }
    engineRef.current = 'none';
  };

  const handleAutoplayBlocked = useCallback(() => {
    if (userGesturePendingRef.current) return;
    userGesturePendingRef.current = true;

    const onUserGesture = () => {
      userGesturePendingRef.current = false;
      window.removeEventListener('pointerdown', onUserGesture);
      window.removeEventListener('keydown', onUserGesture);
      window.removeEventListener('click', onUserGesture);
      window.removeEventListener('touchstart', onUserGesture);

      // Revive suspended Web Audio context if necessary
      sound.resumeContext();

      if (isPlayingRef.current && activeStationRef.current) {
        startPlayback(activeStationRef.current);
        if (
          ambientSoundRef.current !== 'none' &&
          activeStationRef.current.stream_type !== 'ambient'
        ) {
          sound.startAmbient(ambientSoundRef.current, ambientVolumeRef.current);
        }
      }
    };

    window.addEventListener('pointerdown', onUserGesture, { once: true });
    window.addEventListener('keydown', onUserGesture, { once: true });
    window.addEventListener('click', onUserGesture, { once: true });
    window.addEventListener('touchstart', onUserGesture, { once: true });
  }, []);

  const startPlayback = (station: RadioStation) => {
    // 1. Synthesized ambient station
    if (station.stream_type === 'ambient' || station.url.startsWith('ambient:')) {
      stopHtmlAudio();
      youtubeAudio.pause();
      const ambType = station.url.replace('ambient:', '') || 'rain';
      sound.startAmbient(ambType, radioVolumeRef.current);
      engineRef.current = 'synth-ambient';
      openNewHistory(station);
      return;
    }

    // 2. Spotify audio stream
    if (station.stream_type === 'spotify' || isSpotifyUrl(station.url)) {
      engineRef.current = 'spotify-iframe';
      spotifyAudio.play(station.url, {
        onPlaying: () => {
          if (!currentHistoryIdRef.current) {
            openNewHistory(station);
          }
        },
        onError: (err) => {
          console.warn('Spotify play failed:', err);
          handleAutoplayBlocked();
        },
      });
      return;
    }

    // 3. YouTube audio
    const ytId = extractYouTubeId(station.url);
    if (ytId || station.stream_type === 'youtube' || isYouTubeUrl(station.url)) {
      stopHtmlAudio();
      if (engineRef.current === 'synth-ambient') {
        sound.stopAmbient();
      }

      if (!ytId) {
        console.warn('Unable to extract YouTube video ID from:', station.url);
        return;
      }

      engineRef.current = 'youtube-iframe';
      youtubeAudio.play(ytId, radioVolumeRef.current, false, {
        onPlaying: () => {
          if (!currentHistoryIdRef.current) {
            openNewHistory(station);
          }
        },
        onFallbackNeeded: (reason) => {
          console.warn('YouTube audio blocked or fallback needed:', reason);
          handleAutoplayBlocked();
        },
      });
      return;
    }

    // HTML5 Audio stream (MP3, Icecast)
    youtubeAudio.pause();
    spotifyAudio.pause();
    if (engineRef.current === 'synth-ambient') {
      sound.stopAmbient();
    }
    if (!audioRef.current) return;
    engineRef.current = 'html-audio';
    if (audioRef.current.src !== station.url) {
      audioRef.current.src = station.url;
    }
    audioRef.current.volume = radioVolumeRef.current;
    audioRef.current
      .play()
      .then(() => {
        openNewHistory(station);
      })
      .catch((err) => {
        console.warn('HTML audio play failed:', err);
        handleAutoplayBlocked();
      });
  };

  // Main sync effect: when isPlaying or activeStation changes
  useEffect(() => {
    if (isPlaying && activeStation) {
      startPlayback(activeStation);

      if (ambientSound !== 'none' && activeStation.stream_type !== 'ambient') {
        sound.startAmbient(ambientSound, ambientVolume);
      }
    } else {
      closeActiveHistory();
      stopAllEngines();
      if (ambientSound !== 'none') {
        sound.stopAmbient();
      }
    }

    return () => {
      closeActiveHistory();
      stopAllEngines();
      sound.stopAmbient();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying, activeStation?.id]);

  // Volume synchronization
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = radioVolume;
    }
    youtubeAudio.setVolume(radioVolume, false);
    if (engineRef.current === 'synth-ambient') {
      sound.setAmbientVolume(radioVolume);
    }
  }, [radioVolume]);

  // Ambient sound & volume synchronization
  useEffect(() => {
    if (isPlaying && activeStation && activeStation.stream_type !== 'ambient') {
      if (ambientSound !== 'none') {
        sound.startAmbient(ambientSound, ambientVolume);
      } else {
        sound.stopAmbient();
      }
    }
  }, [ambientSound, ambientVolume, isPlaying, activeStation?.id]);

  return (
    <audio
      ref={audioRef}
      preload="none"
      className="hidden"
      aria-hidden="true"
    />
  );
};
