import React, { useState, useEffect, useRef } from 'react';
import { RadioStation } from '../types/index.js';
import { Play, Pause, Volume2, VolumeX, Radio as RadioIcon, Plus, ExternalLink, Loader2 } from 'lucide-react';
import { api } from '../services/api.js';

interface Props {
  stations: RadioStation[];
  currentStationId: string | null;
  onSelectStation: (stationId: string) => void;
  onOpenAddModal: () => void;
  radioVolume: number;
  onVolumeChange: (volume: number) => void;
  activeRoomId: string | null;
}

export const RadioPlayer: React.FC<Props> = ({
  stations,
  currentStationId,
  onSelectStation,
  onOpenAddModal,
  radioVolume,
  onVolumeChange,
  activeRoomId,
}) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [streamError, setStreamError] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const currentHistoryIdRef = useRef<string | null>(null);
  const playStartTimeRef = useRef<number | null>(null);

  const activeStation = stations.find((s) => s.id === currentStationId) || stations[0];

  // Sync volume with audio element
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : radioVolume;
    }
  }, [radioVolume, isMuted]);

  // Handle station change
  useEffect(() => {
    if (!activeStation) return;

    setStreamError(null);

    // If currently playing, stop previous history item and start new
    if (currentHistoryIdRef.current && playStartTimeRef.current) {
      const elapsed = Math.round((Date.now() - playStartTimeRef.current) / 1000);
      api.updatePlayEnd(currentHistoryIdRef.current, elapsed).catch(console.error);
      currentHistoryIdRef.current = null;
      playStartTimeRef.current = null;
    }

    if (audioRef.current) {
      if (isPlaying) {
        setIsLoading(true);
        audioRef.current.src = activeStation.url;
        audioRef.current
          .play()
          .then(() => {
            setIsLoading(false);
            recordPlayStart();
          })
          .catch((err) => {
            console.warn('Playback error:', err);
            setIsPlaying(false);
            setIsLoading(false);
            setStreamError('Station stream connecting or currently offline.');
          });
      } else {
        audioRef.current.src = activeStation.url;
      }
    }
  }, [activeStation?.id]);

  const recordPlayStart = async () => {
    if (!activeStation) return;
    try {
      const startIso = new Date().toISOString();
      playStartTimeRef.current = Date.now();
      const item = await api.recordPlayStart({
        radio_id: activeStation.id,
        radio_name: activeStation.name,
        room_id: activeRoomId,
        started_at: startIso,
      });
      currentHistoryIdRef.current = item.id;
    } catch (err) {
      console.warn('Could not record play start:', err);
    }
  };

  const togglePlay = () => {
    if (!audioRef.current || !activeStation) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
      setIsLoading(false);

      if (currentHistoryIdRef.current && playStartTimeRef.current) {
        const elapsed = Math.round((Date.now() - playStartTimeRef.current) / 1000);
        api.updatePlayEnd(currentHistoryIdRef.current, elapsed).catch(console.error);
        currentHistoryIdRef.current = null;
        playStartTimeRef.current = null;
      }
    } else {
      setIsLoading(true);
      setStreamError(null);
      audioRef.current.src = activeStation.url;
      audioRef.current
        .play()
        .then(() => {
          setIsPlaying(true);
          setIsLoading(false);
          recordPlayStart();
        })
        .catch((err) => {
          console.warn('Playback failed:', err);
          setIsPlaying(false);
          setIsLoading(false);
          setStreamError('Could not start stream. Please check stream URL.');
        });
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  return (
    <div className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-subtle)] shadow-sm">
      <audio
        ref={audioRef}
        preload="none"
        onError={() => {
          setIsLoading(false);
          setIsPlaying(false);
          setStreamError('Audio stream unavailable or paused.');
        }}
        onWaiting={() => setIsLoading(true)}
        onPlaying={() => setIsLoading(false)}
      />

      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <RadioIcon className="w-4 h-4 text-[var(--accent-main)]" />
          <span className="text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">
            Focus Radio
          </span>
        </div>
        <button
          onClick={onOpenAddModal}
          className="text-xs text-[var(--text-muted)] hover:text-[var(--accent-main)] flex items-center gap-1 transition-colors"
          title="Add Custom Radio Link"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Stream</span>
        </button>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-3">
        {/* Station selector */}
        <div className="w-full sm:w-auto flex-1">
          <select
            value={activeStation?.id || ''}
            onChange={(e) => onSelectStation(e.target.value)}
            className="w-full text-sm font-medium bg-[var(--bg-card-subtle)] text-[var(--text-main)] border border-[var(--border-subtle)] rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[var(--accent-main)] cursor-pointer"
          >
            {stations.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.genre})
              </option>
            ))}
          </select>
          {activeStation && (
            <p className="text-[11px] text-[var(--text-muted)] mt-1 truncate">
              {activeStation.description}
            </p>
          )}
        </div>

        {/* Play/Pause Button */}
        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <button
            onClick={togglePlay}
            disabled={isLoading && !isPlaying}
            className="flex items-center justify-center w-11 h-11 rounded-full bg-[var(--accent-main)] text-white hover:bg-[var(--accent-hover)] transition-transform active:scale-95 shadow-sm"
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : isPlaying ? (
              <Pause className="w-5 h-5 fill-current" />
            ) : (
              <Play className="w-5 h-5 fill-current ml-0.5" />
            )}
          </button>
        </div>
      </div>

      {streamError && (
        <p className="text-xs text-amber-600/90 dark:text-amber-400/90 mb-2 bg-amber-500/10 p-2 rounded-lg">
          {streamError}
        </p>
      )}

      {/* Volume slider & mute */}
      <div className="flex items-center gap-3 pt-2 border-t border-[var(--border-subtle)]">
        <button
          onClick={toggleMute}
          className="text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors"
          title={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted || radioVolume === 0 ? (
            <VolumeX className="w-4 h-4" />
          ) : (
            <Volume2 className="w-4 h-4" />
          )}
        </button>
        <input
          type="range"
          min="0"
          max="1"
          step="0.05"
          value={isMuted ? 0 : radioVolume}
          onChange={(e) => {
            setIsMuted(false);
            onVolumeChange(parseFloat(e.target.value));
          }}
          className="flex-1"
        />
        <span className="text-[11px] font-mono text-[var(--text-muted)] w-8 text-right">
          {isMuted ? '0%' : `${Math.round(radioVolume * 100)}%`}
        </span>
      </div>
    </div>
  );
};
