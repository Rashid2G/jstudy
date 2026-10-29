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
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-between p-8 bg-[var(--bg-canvas)] text-[var(--text-main)] transition-colors duration-500">
      {/* Top Bar — dims when session is running */}
      <div
        className={`w-full flex items-center justify-between max-w-3xl transition-opacity duration-500 ${
          isRunning ? 'opacity-20 hover:opacity-90' : 'opacity-80'
        }`}
      >
        <span className="text-[11px] uppercase tracking-[0.22em] text-[var(--text-muted)]">
          {phase === 'work' ? 'Focus' : 'Rest'}
        </span>
        <button
          type="button"
          onClick={onClose}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--ink-wash)] transition-colors"
          title="Exit Zen Mode (Esc)"
        >
          <Minimize2 className="w-3.5 h-3.5" />
          <span>Exit</span>
        </button>
      </div>

      {/* Center Breathing Clock */}
      <div className="flex flex-col items-center justify-center relative my-auto">
        <div
          className={`absolute w-80 h-80 rounded-full blur-3xl pointer-events-none transition-opacity duration-1000 ${
            isRunning ? 'opacity-100 animate-breathe' : 'opacity-0'
          }`}
          style={{ background: 'var(--accent-aura)' }}
        />

        <div className="relative z-10 flex flex-col items-center">
          <div className="text-7xl md:text-8xl font-mono font-light tabular-nums tracking-tight mb-4 text-[var(--text-main)]">
            {formatTime(remainingSeconds)}
          </div>

          {sessionGoal && (
            <p className="text-sm text-[var(--text-muted)] max-w-md text-center mb-6">
              {sessionGoal}
            </p>
          )}

          <button
            type="button"
            onClick={onToggleTimer}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[var(--accent-main)] text-[var(--accent-fg)] hover:bg-[var(--accent-hover)] transition-all active:scale-95 text-xs font-medium"
          >
            {isRunning ? (
              <>
                <Pause className="w-3.5 h-3.5 fill-current" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                <span>Start</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Subtle Footer */}
      <div
        className={`text-xs text-[var(--text-faint)] font-mono flex items-center gap-2 transition-opacity duration-500 ${
          isRunning ? 'opacity-20 hover:opacity-80' : 'opacity-70'
        }`}
      >
        {activeStationName && <span>{activeStationName}</span>}
        {activeStationName && <span>·</span>}
        <span>ESC to exit</span>
      </div>
    </div>
  );
};
