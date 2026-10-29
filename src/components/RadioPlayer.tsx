import React, { useState, useEffect, useRef } from 'react';
import { RadioStation } from '../types/index.js';
import { extractYouTubeId, isYouTubeUrl } from '../utils/youtube.js';
import { youtubeAudio } from '../utils/youtubePlayer.js';
import { sound } from '../utils/sound.js';
import { api } from '../services/api.js';
import { CalmSlider } from './ui.js';
import { Play, Pause, Volume2, VolumeX, Plus, Trash2, Loader2 } from 'lucide-react';

interface Props {
  stations: RadioStation[];
  currentStationId: string | null;
  onSelectStation: (stationId: string) => void;
  onOpenAddModal: () => void;
  onDeleteStation?: (stationId: string) => void;
  radioVolume: number;
  onVolumeChange: (volume: number) => void;
  activeRoomId: string | null;
  onHistoryUpdated?: () => void;
}

type ActiveEngine = 'none' | 'html-audio' | 'youtube-iframe' | 'youtube-stream' | 'synth-ambient';

export const RadioPlayer: React.FC<Props> = ({
  stations,
  currentStationId,
  onSelectStation,
  onOpenAddModal,
  onDeleteStation,
  radioVolume,
  onVolumeChange,
  activeRoomId,
  onHistoryUpdated,
}) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [streamError, setStreamError] = useState<string | null>(null);
  const [engine, setEngine] = useState<ActiveEngine>('none');

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const currentHistoryIdRef = useRef<string | null>(null);
  const playStartTimeRef = useRef<number | null>(null);
  const isPlayingRef = useRef<boolean>(false);
  isPlayingRef.current = isPlaying;

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
        room_id: activeRoomId,
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
    if (engine === 'synth-ambient') {
      sound.stopAmbient();
    }
    setEngine('none');
  };

  const startStationPlayback = (station: RadioStation) => {
    setStreamError(null);
    setIsLoading(true);

    // 1. Built-in synthesized ambient station (e.g. ambient:rain)
    if (station.stream_type === 'ambient' || station.url.startsWith('ambient:')) {
      youtubeAudio.pause();
      if (audioRef.current) audioRef.current.pause();
      const ambType = station.url.replace('ambient:', '') || 'rain';
      sound.startAmbient(ambType, isMuted ? 0 : radioVolume);
      setEngine('synth-ambient');
      setIsPlaying(true);
      setIsLoading(false);
      openNewHistory(station);
      return;
    }

    // 2. YouTube video or 24/7 YouTube live stream -> pure audio stream
    const ytId = extractYouTubeId(station.url);
    if (ytId || station.stream_type === 'youtube' || isYouTubeUrl(station.url)) {
      if (audioRef.current) audioRef.current.pause();

      const fallbackToBackendAudioStream = () => {
        if (!audioRef.current) return;
        setEngine('youtube-stream');
        setIsLoading(true);
        audioRef.current.src = api.getYouTubeAudioStreamUrl(station.url);
        audioRef.current.volume = isMuted ? 0 : radioVolume;
        audioRef.current
          .play()
          .then(() => {
            setIsPlaying(true);
            setIsLoading(false);
            openNewHistory(station);
          })
          .catch(() => {
            setIsPlaying(false);
            setIsLoading(false);
            setStreamError('Unable to stream YouTube audio. Verify the video/live URL is public.');
          });
      };

      if (!ytId) {
        fallbackToBackendAudioStream();
        return;
      }

      setEngine('youtube-iframe');
      youtubeAudio.play(ytId, radioVolume, isMuted, {
        onPlaying: () => {
          setIsPlaying(true);
          setIsLoading(false);
          if (!currentHistoryIdRef.current) {
            openNewHistory(station);
          }
        },
        onBuffering: () => {
          setIsLoading(true);
        },
        onFallbackNeeded: () => {
          youtubeAudio.stop();
          fallbackToBackendAudioStream();
        },
      });
      return;
    }

    // 3. Standard Icecast / MP3 / Direct audio stream
    youtubeAudio.pause();
    if (!audioRef.current) return;
    setEngine('html-audio');
    audioRef.current.src = station.url;
    audioRef.current.volume = isMuted ? 0 : radioVolume;
    audioRef.current
      .play()
      .then(() => {
        setIsPlaying(true);
        setIsLoading(false);
        openNewHistory(station);
      })
      .catch(() => {
        setIsPlaying(false);
        setIsLoading(false);
        setStreamError('Could not connect to audio stream.');
      });
  };

  // Sync volume across whichever audio engine is active
  useEffect(() => {
    const effectiveVol = isMuted ? 0 : radioVolume;
    if (audioRef.current) {
      audioRef.current.volume = effectiveVol;
    }
    youtubeAudio.setVolume(radioVolume, isMuted);
    if (engine === 'synth-ambient') {
      sound.setAmbientVolume(effectiveVol);
    }
  }, [radioVolume, isMuted, engine]);

  // Switch station smoothly if user selects a different radio
  useEffect(() => {
    if (!activeStation) return;
    setStreamError(null);

    if (isPlayingRef.current) {
      closeActiveHistory();
      stopAllEngines();
      startStationPlayback(activeStation);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeStation?.id]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      closeActiveHistory();
      youtubeAudio.pause();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const togglePlay = () => {
    if (!activeStation) return;

    if (isPlaying) {
      setIsPlaying(false);
      setIsLoading(false);
      closeActiveHistory();
      stopAllEngines();
    } else {
      startStationPlayback(activeStation);
    }
  };

  const isYouTubeStation =
    activeStation &&
    (activeStation.stream_type === 'youtube' || isYouTubeUrl(activeStation.url));

  return (
    <div className="space-y-3">
      <audio
        ref={audioRef}
        preload="none"
        onError={() => {
          if (engine === 'html-audio' || engine === 'youtube-stream') {
            setIsLoading(false);
            setIsPlaying(false);
            setStreamError('Audio stream unavailable or offline.');
          }
        }}
        onWaiting={() => {
          if (engine === 'html-audio' || engine === 'youtube-stream') setIsLoading(true);
        }}
        onPlaying={() => {
          if (engine === 'html-audio' || engine === 'youtube-stream') setIsLoading(false);
        }}
      />

      {/* Top Row: Label + Add Stream */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-medium uppercase tracking-widest text-[var(--text-faint)]">
            Lofi & Audio Stream
          </span>
          {isYouTubeStation && (
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[var(--ink-wash)] text-[var(--text-muted)]">
              YT Audio
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={onOpenAddModal}
          className="text-xs text-[var(--text-muted)] hover:text-[var(--text-main)] inline-flex items-center gap-1 transition-colors"
          title="Add YouTube video, YouTube live stream, or MP3 radio URL"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add link</span>
        </button>
      </div>

      {/* Main Player Row: Play button + Blended Station Select + Volume */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={togglePlay}
          disabled={isLoading && !isPlaying}
          className="w-9 h-9 shrink-0 rounded-full bg-[var(--ink-wash-strong)] hover:bg-[var(--accent-main)] text-[var(--text-main)] hover:text-[var(--accent-fg)] flex items-center justify-center transition-colors active:scale-95"
          title={isPlaying ? 'Pause radio' : 'Play radio'}
          aria-label={isPlaying ? 'Pause radio' : 'Play radio'}
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : isPlaying ? (
            <Pause className="w-3.5 h-3.5 fill-current" />
          ) : (
            <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
          )}
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <select
              value={activeStation?.id || ''}
              onChange={(e) => onSelectStation(e.target.value)}
              aria-label="Select radio station"
              className="w-full text-sm font-medium bg-transparent text-[var(--text-main)] py-1 pr-2 rounded-lg hover:bg-[var(--ink-wash)] focus:bg-[var(--ink-wash)] focus:outline-none cursor-pointer truncate"
            >
              {stations.map((s) => (
                <option
                  key={s.id}
                  value={s.id}
                  className="bg-[var(--bg-elevated)] text-[var(--text-main)]"
                >
                  {s.name} · {s.genre}
                </option>
              ))}
            </select>

            {activeStation && activeStation.is_curated === 0 && onDeleteStation && (
              <button
                type="button"
                onClick={() => onDeleteStation(activeStation.id)}
                className="p-1 rounded-full text-[var(--text-faint)] hover:text-rose-500 transition-colors shrink-0"
                title="Remove custom station"
                aria-label="Remove custom station"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {activeStation?.description && (
            <p className="text-[11px] text-[var(--text-faint)] truncate">
              {activeStation.description}
            </p>
          )}
        </div>
      </div>

      {/* Subtle Volume Control */}
      <div className="flex items-center gap-2.5 pt-0.5">
        <button
          type="button"
          onClick={() => setIsMuted(!isMuted)}
          className="text-[var(--text-faint)] hover:text-[var(--text-main)] transition-colors"
          title={isMuted ? 'Unmute' : 'Mute'}
          aria-label={isMuted ? 'Unmute radio' : 'Mute radio'}
        >
          {isMuted || radioVolume === 0 ? (
            <VolumeX className="w-3.5 h-3.5" />
          ) : (
            <Volume2 className="w-3.5 h-3.5" />
          )}
        </button>

        <CalmSlider
          value={isMuted ? 0 : radioVolume}
          min={0}
          max={1}
          step={0.02}
          onChange={(val) => {
            setIsMuted(false);
            onVolumeChange(val);
          }}
          ariaLabel="Radio volume"
          className="flex-1"
        />

        <span className="text-[10px] font-mono text-[var(--text-faint)] w-7 text-right">
          {isMuted ? '0%' : `${Math.round(radioVolume * 100)}%`}
        </span>
      </div>

      {streamError && (
        <p className="text-[11px] text-[var(--text-muted)] italic">{streamError}</p>
      )}
    </div>
  );
};
