import React, { useEffect } from 'react';
import { formatTime } from '../utils/format.js';
import { Minimize2, Play, Pause } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  remainingSeconds: number;
  totalSeconds: number;
  isRunning: boolean;
  onToggleTimer: () => void;
  sessionGoal: string;
  activeStationName?: string;
  phase: 'work' | 'break';
}

export const ZenMode: React.FC<Props> = ({
  isOpen,
  onClose,
  remainingSeconds,
  isRunning,
  onToggleTimer,
  sessionGoal,
  activeStationName,
  phase,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-between p-8 bg-[var(--bg-main)] text-[var(--text-main)] transition-colors duration-500 animate-fadeIn">
      {/* Top Header */}
      <div className="w-full flex items-center justify-between max-w-4xl">
        <div className="text-xs uppercase tracking-widest text-[var(--text-muted)] font-medium">
          {phase === 'work' ? 'Deep Focus' : 'Gentle Rest'}
        </div>
        <button
          onClick={onClose}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs text-[var(--text-muted)] hover:text-[var(--text-main)] bg-[var(--bg-card)] border border-[var(--border-subtle)] transition-colors"
          title="Exit Zen Mode (Esc)"
        >
          <Minimize2 className="w-3.5 h-3.5" />
          <span>Exit Zen</span>
        </button>
      </div>

      {/* Center Breathing Focus Ring */}
      <div className="flex flex-col items-center justify-center relative my-auto">
        {/* Breathing aura */}
        <div
          className={`absolute w-80 h-80 rounded-full border border-[var(--accent-main)] opacity-20 pointer-events-none ${
            isRunning ? 'animate-breathe' : ''
          }`}
        />

        <div className="relative z-10 flex flex-col items-center">
          <div className="text-7xl md:text-8xl font-mono font-medium tracking-tight mb-4 text-[var(--text-main)]">
            {formatTime(remainingSeconds)}
          </div>

          {sessionGoal && (
            <p className="text-sm md:text-base text-[var(--text-muted)] max-w-md text-center italic mb-6">
              "{sessionGoal}"
            </p>
          )}

          <button
            onClick={onToggleTimer}
            className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-[var(--accent-main)] text-white hover:bg-[var(--accent-hover)] transition-all shadow-sm active:scale-95"
          >
            {isRunning ? (
              <>
                <Pause className="w-4 h-4 fill-current" />
                <span className="text-xs font-medium">Pause</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current ml-0.5" />
                <span className="text-xs font-medium">Resume</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Footer info */}
      <div className="text-xs text-[var(--text-muted)] font-mono flex items-center gap-2">
        {activeStationName && (
          <span>Playing: {activeStationName}</span>
        )}
        <span className="opacity-40">•</span>
        <span>Press ESC to return</span>
      </div>
    </div>
  );
};
