import React, { useEffect, useRef } from 'react';
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

  const stopAllEngines = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.removeAttribute('src');
      audioRef.current.load();
    }
    youtubeAudio.pause();
    spotifyAudio.pause();
    spotifyAudio.setVisible(false);
    if (engineRef.current === 'synth-ambient') {
      sound.stopAmbient();
    }
    engineRef.current = 'none';
  };

  const startPlayback = (station: RadioStation) => {
    stopAllEngines();

    // 1. Synthesized ambient station
    if (station.stream_type === 'ambient' || station.url.startsWith('ambient:')) {
      const ambType = station.url.replace('ambient:', '') || 'rain';
      sound.startAmbient(ambType, radioVolume);
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
      const fallbackToBackendStream = () => {
        if (!audioRef.current) return;
        engineRef.current = 'youtube-stream';
        audioRef.current.src = api.getYouTubeAudioStreamUrl(station.url);
        audioRef.current.volume = radioVolume;
        audioRef.current
          .play()
          .then(() => {
            openNewHistory(station);
          })
          .catch((err) => {
            console.warn('Backend stream play failed:', err);
            handleAutoplayBlocked();
          });
      };

      if (!ytId) {
        fallbackToBackendStream();
        return;
      }

      engineRef.current = 'youtube-iframe';
      youtubeAudio.play(ytId, radioVolume, false, {
        onPlaying: () => {
          if (!currentHistoryIdRef.current) {
            openNewHistory(station);
          }
        },
        onFallbackNeeded: () => {
          youtubeAudio.stop();
          fallbackToBackendStream();
        },
      });
      return;
    }

    // 4. HTML5 Audio stream (MP3, Icecast)
    if (!audioRef.current) return;
    engineRef.current = 'html-audio';
    audioRef.current.src = station.url;
    audioRef.current.volume = radioVolume;
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

  const handleAutoplayBlocked = () => {
    if (userGesturePendingRef.current) return;
    userGesturePendingRef.current = true;

    const onUserGesture = () => {
      userGesturePendingRef.current = false;
      window.removeEventListener('pointerdown', onUserGesture);
      window.removeEventListener('keydown', onUserGesture);

      if (isPlaying && activeStation) {
        startPlayback(activeStation);
      }
    };

    window.addEventListener('pointerdown', onUserGesture, { once: true });
    window.addEventListener('keydown', onUserGesture, { once: true });
  };

  // Main sync effect: when isPlaying or activeStation changes
  useEffect(() => {
    if (isPlaying && activeStation) {
      startPlayback(activeStation);

      // Start ambient background sound if configured (and not already synth ambient)
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
      // Component unmount or station switch
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
  }, [ambientSound, ambientVolume, isPlaying, activeStation]);

  return (
    <audio
      ref={audioRef}
      preload="none"
      className="hidden"
      aria-hidden="true"
    />
  );
};
