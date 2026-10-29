import React from 'react';
import { formatTime } from '../utils/format.js';
import { TimerState, calculateProgress } from '../utils/timer.js';
import { Play, Pause, RotateCcw, SkipForward } from 'lucide-react';
import { extractYouTubeId, isYouTubeUrl } from '../utils/youtube.js';
import { api } from '../services/api.js';

interface Props {
  timerState: TimerState;
  sessionGoal: string;
  onSessionGoalChange: (goal: string) => void;
  onToggleTimer: () => void;
  onResetTimer: () => void;
  onSkipPhase: () => void;
  soundtrackEnabled?: boolean;
  onToggleSoundtrack?: (enabled: boolean) => void;
  activeStationName?: string;
  onOpenSettings?: () => void;
}

export const Timer: React.FC<Props> = ({
  timerState,
  sessionGoal,
  onSessionGoalChange,
  onToggleTimer,
  onResetTimer,
  onSkipPhase,
}) => {
  const {
    phase,
    remainingSeconds,
    totalDurationSeconds,
    isRunning,
    completedCycles,
    workMinutes,
    breakMinutes,
    breaksEnabled,
  } = timerState;

  const radius = 104;
  const circumference = 2 * Math.PI * radius;
  const progressPercent = calculateProgress(totalDurationSeconds, remainingSeconds);
  const strokeDashoffset = circumference - (circumference * progressPercent) / 100;

  const handleGoalPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const text = e.clipboardData.getData('text').trim();
    if (isYouTubeUrl(text) || extractYouTubeId(text)) {
      api
        .getYouTubeMeta(text)
        .then((meta) => {
          if (meta?.title) {
            onSessionGoalChange(meta.title);
          }
        })
        .catch(() => {
          // If errored, leave it as it is
        });
    }
  };

  return (
    <section aria-label="Focus Timer" className="flex flex-col items-center justify-center w-full select-none">
      {/* Minimalist Study Intention */}
      <div className="w-full max-w-sm mb-3">
        <input
          type="text"
          value={sessionGoal}
          onChange={(e) => onSessionGoalChange(e.target.value)}
          onPaste={handleGoalPaste}
          placeholder="Write your study intention..."
          aria-label="Study intention"
          className="w-full text-center text-sm bg-transparent text-[var(--text-main)] placeholder-[var(--text-faint)] py-1 border-b border-transparent hover:border-[var(--border-hairline)] focus:border-[var(--border-hairline)] focus:outline-none transition-colors select-text"
        />
      </div>

      {/* Main Timer Dial Flanked by Quick Action Pills */}
      <div className="flex items-center justify-center gap-4 sm:gap-8 md:gap-12 w-full max-w-2xl">
        {/* LEFT QUICK ACTION: Reset Button */}
        <div className="w-24 sm:w-32 flex justify-end">
          <button
            type="button"
            onClick={onResetTimer}
            className="group flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-[var(--border-hairline)] bg-[var(--ink-wash)] hover:bg-[var(--ink-wash-strong)] text-[var(--text-muted)] hover:text-[var(--text-main)] transition-all text-xs font-medium active:scale-95 shadow-sm cursor-pointer"
            title="Reset timer"
            aria-label="Reset timer"
          >
            <RotateCcw className="w-3.5 h-3.5 transition-transform group-hover:-rotate-45" />
            <span>Reset</span>
          </button>
        </div>

        {/* CENTER: Breathing Aura & Progress Dial */}
        <div className="relative flex flex-col items-center">
          {/* Breathing Aura */}
          <div
            className={`absolute top-2 w-48 h-48 sm:w-56 sm:h-56 rounded-full pointer-events-none transition-opacity duration-1000 blur-2xl ${
              isRunning ? 'opacity-100 animate-breathe' : 'opacity-0'
            }`}
            style={{ background: 'var(--accent-aura)' }}
          />

          {/* Circular Progress Dial */}
          <div className="relative w-48 h-48 sm:w-56 sm:h-56 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 240 240">
              <circle
                cx="120"
                cy="120"
                r={radius}
                stroke="var(--border-hairline)"
                strokeWidth="2"
                fill="transparent"
              />
              <circle
                cx="120"
                cy="120"
                r={radius}
                stroke="var(--accent-main)"
                strokeWidth="2.5"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="transparent"
                className="transition-[stroke-dashoffset] duration-1000 ease-linear"
              />
            </svg>

            <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
              <span className="text-[10px] font-medium tracking-[0.22em] uppercase text-[var(--accent-main)] mb-1">
                {phase === 'work' ? (breaksEnabled ? 'Focus' : 'Deep Flow') : 'Rest'}
              </span>

              <span className="text-4xl sm:text-5xl font-mono font-light tracking-tight tabular-nums text-[var(--text-main)]">
                {formatTime(remainingSeconds)}
              </span>

              <span className="text-[11px] font-mono text-[var(--text-faint)] mt-1">
                {breaksEnabled
                  ? `${workMinutes}m · ${breakMinutes}m rest`
                  : `${workMinutes}m continuous`}
              </span>
            </div>
          </div>

          {/* Start / Pause / Resume Button */}
          <button
            type="button"
            onClick={onToggleTimer}
            className="mt-2.5 px-7 py-1.5 rounded-full bg-[var(--accent-main)] text-[var(--accent-fg)] hover:bg-[var(--accent-hover)] transition-all active:scale-[0.97] inline-flex items-center gap-2 text-xs font-medium tracking-wide shadow-sm cursor-pointer"
            aria-label={isRunning ? 'Pause' : remainingSeconds < totalDurationSeconds ? 'Resume' : 'Start Session'}
          >
            {isRunning ? (
              <>
                <Pause className="w-3.5 h-3.5 fill-current" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                <span>{remainingSeconds < totalDurationSeconds ? 'Resume' : 'Start Session'}</span>
              </>
            )}
          </button>
        </div>

        {/* RIGHT QUICK ACTION: Skip Phase & Cycle Count */}
        <div className="w-24 sm:w-32 flex flex-col items-start gap-1.5">
          {breaksEnabled ? (
            <button
              type="button"
              onClick={onSkipPhase}
              className="group flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[var(--border-hairline)] bg-[var(--ink-wash)] hover:bg-[var(--ink-wash-strong)] text-[var(--text-muted)] hover:text-[var(--text-main)] transition-all text-xs font-medium active:scale-95 shadow-sm cursor-pointer"
              title={phase === 'work' ? 'Skip to break' : 'Skip to focus'}
              aria-label={phase === 'work' ? 'Skip to break' : 'Skip to focus'}
            >
              <span>Skip</span>
              <SkipForward className="w-3.5 h-3.5" />
            </button>
          ) : (
            <div className="h-7" />
          )}

          <span className="text-[10px] font-mono text-[var(--text-faint)] pl-1">
            {completedCycles > 0
              ? `${completedCycles} ${completedCycles === 1 ? 'cycle' : 'cycles'}`
              : 'Cycle 0'}
          </span>
        </div>
      </div>
    </section>
  );
};
