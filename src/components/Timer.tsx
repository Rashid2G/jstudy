import React from 'react';
import { formatTime } from '../utils/format.js';
import { TimerState, calculateProgress } from '../utils/timer.js';
import { CalmSwitch } from './ui.js';
import { Play, Pause, RotateCcw, SkipForward, Minus, Plus, Check } from 'lucide-react';

interface Props {
  timerState: TimerState;
  sessionGoal: string;
  onSessionGoalChange: (goal: string) => void;
  onToggleTimer: () => void;
  onResetTimer: () => void;
  onSkipPhase: () => void;
  onConfigureTimer: (updates: {
    workMinutes?: number;
    breakMinutes?: number;
    breaksEnabled?: boolean;
  }) => void;
  hasUnsavedRoomChanges?: boolean;
  onSaveTimerToRoom?: () => void;
}

const QUICK_PRESETS = [
  { label: '25 / 5', work: 25, brk: 5, breaks: true },
  { label: '50 / 10', work: 50, brk: 10, breaks: true },
  { label: '90 / 15', work: 90, brk: 15, breaks: true },
  { label: '45m flow', work: 45, brk: 0, breaks: false },
];

export const Timer: React.FC<Props> = ({
  timerState,
  sessionGoal,
  onSessionGoalChange,
  onToggleTimer,
  onResetTimer,
  onSkipPhase,
  onConfigureTimer,
  hasUnsavedRoomChanges,
  onSaveTimerToRoom,
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

  const radius = 116;
  const circumference = 2 * Math.PI * radius;
  const progressPercent = calculateProgress(totalDurationSeconds, remainingSeconds);
  const strokeDashoffset = circumference - (circumference * progressPercent) / 100;

  return (
    <section aria-label="Focus Timer" className="flex flex-col items-center py-4 sm:py-8 select-none">
      {/* Custom Pomodoro & Session Duration Bar — dims away when session runs */}
      <div className="focus-dimmable flex flex-col items-center gap-3 mb-6">
        {/* Preset Shortcuts */}
        <div className="flex flex-wrap items-center justify-center gap-1">
          {QUICK_PRESETS.map((preset) => {
            const isSelected =
              workMinutes === preset.work &&
              breaksEnabled === preset.breaks &&
              (!preset.breaks || breakMinutes === preset.brk);
            return (
              <button
                key={preset.label}
                type="button"
                onClick={() =>
                  onConfigureTimer({
                    workMinutes: preset.work,
                    breakMinutes: preset.brk,
                    breaksEnabled: preset.breaks,
                  })
                }
                className={`px-3 py-1 rounded-full text-xs font-mono transition-colors ${
                  isSelected
                    ? 'bg-[var(--ink-wash-strong)] text-[var(--text-main)] font-medium'
                    : 'text-[var(--text-faint)] hover:text-[var(--text-main)] hover:bg-[var(--ink-wash)]'
                }`}
              >
                {preset.label}
              </button>
            );
          })}
        </div>

        {/* Inline Custom Duration & Optional Breaks Controls */}
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-[var(--text-muted)]">
          {/* Custom Focus Duration */}
          <div className="inline-flex items-center gap-1.5">
            <span className="text-[var(--text-faint)]">Focus</span>
            <button
              type="button"
              onClick={() => onConfigureTimer({ workMinutes: Math.max(1, workMinutes - 5) })}
              className="p-1 rounded-full hover:bg-[var(--ink-wash)] text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors"
              aria-label="Decrease focus minutes"
            >
              <Minus className="w-3 h-3" />
            </button>
            <input
              type="number"
              min={1}
              max={240}
              value={workMinutes}
              onChange={(e) => {
                const v = parseInt(e.target.value, 10);
                if (!Number.isNaN(v)) {
                  onConfigureTimer({ workMinutes: v });
                }
              }}
              aria-label="Focus duration in minutes"
              className="w-10 text-center font-mono text-xs bg-[var(--ink-wash)] text-[var(--text-main)] rounded-md py-0.5 focus:outline-none focus:ring-1 focus:ring-[var(--accent-main)]"
            />
            <button
              type="button"
              onClick={() => onConfigureTimer({ workMinutes: Math.min(240, workMinutes + 5) })}
              className="p-1 rounded-full hover:bg-[var(--ink-wash)] text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors"
              aria-label="Increase focus minutes"
            >
              <Plus className="w-3 h-3" />
            </button>
            <span className="text-[var(--text-faint)]">m</span>
          </div>

          <span className="text-[var(--border-hairline)]">·</span>

          {/* Breaks Toggle */}
          <CalmSwitch
            id="breaks-toggle"
            checked={breaksEnabled}
            onCheckedChange={(checked) => onConfigureTimer({ breaksEnabled: checked })}
            label={breaksEnabled ? 'Breaks' : 'No breaks'}
          />

          {/* Custom Break Duration (shown when breaks are enabled) */}
          {breaksEnabled && (
            <div className="inline-flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => onConfigureTimer({ breakMinutes: Math.max(1, breakMinutes - 1) })}
                className="p-1 rounded-full hover:bg-[var(--ink-wash)] text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors"
                aria-label="Decrease break minutes"
              >
                <Minus className="w-3 h-3" />
              </button>
              <input
                type="number"
                min={1}
                max={90}
                value={breakMinutes}
                onChange={(e) => {
                  const v = parseInt(e.target.value, 10);
                  if (!Number.isNaN(v)) {
                    onConfigureTimer({ breakMinutes: v });
                  }
                }}
                aria-label="Break duration in minutes"
                className="w-9 text-center font-mono text-xs bg-[var(--ink-wash)] text-[var(--text-main)] rounded-md py-0.5 focus:outline-none focus:ring-1 focus:ring-[var(--accent-main)]"
              />
              <button
                type="button"
                onClick={() => onConfigureTimer({ breakMinutes: Math.min(90, breakMinutes + 1) })}
                className="p-1 rounded-full hover:bg-[var(--ink-wash)] text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors"
                aria-label="Increase break minutes"
              >
                <Plus className="w-3 h-3" />
              </button>
              <span className="text-[var(--text-faint)]">m break</span>
            </div>
          )}

          {hasUnsavedRoomChanges && onSaveTimerToRoom && (
            <>
              <span className="text-[var(--border-hairline)]">·</span>
              <button
                type="button"
                onClick={onSaveTimerToRoom}
                className="inline-flex items-center gap-1 text-xs text-[var(--accent-main)] hover:underline"
              >
                <Check className="w-3 h-3" />
                Save to room
              </button>
            </>
          )}
        </div>
      </div>

      {/* =========================================================
          UNDIMMED FOCUS CORE: Stays crisp & luminous during session
         ========================================================= */}
      <div className="relative flex flex-col items-center">
        {/* Soft radial breathing aura only when actively running */}
        <div
          className={`absolute top-6 w-64 h-64 rounded-full pointer-events-none transition-opacity duration-1000 blur-2xl ${
            isRunning ? 'opacity-100 animate-breathe' : 'opacity-0'
          }`}
          style={{ background: 'var(--accent-aura)' }}
        />

        {/* Delicate Hairline Progress Dial */}
        <div className="relative w-64 h-64 sm:w-72 sm:h-72 flex items-center justify-center">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 256 256">
            <circle
              cx="128"
              cy="128"
              r={radius}
              stroke="var(--border-hairline)"
              strokeWidth="2"
              fill="transparent"
            />
            <circle
              cx="128"
              cy="128"
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

          <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
            <span className="text-[10px] font-medium tracking-[0.22em] uppercase text-[var(--accent-main)] mb-2">
              {phase === 'work'
                ? breaksEnabled
                  ? 'Focus'
                  : 'Deep Flow'
                : 'Rest'}
            </span>

            <span className="text-6xl sm:text-7xl font-mono font-light tracking-tight tabular-nums text-[var(--text-main)]">
              {formatTime(remainingSeconds)}
            </span>

            <span className="text-[11px] font-mono text-[var(--text-faint)] mt-2.5">
              {breaksEnabled
                ? `${workMinutes}m · ${breakMinutes}m rest`
                : `${workMinutes}m continuous`}
            </span>
          </div>
        </div>

        {/* Minimalist Intention Line (blends seamlessly into canvas) */}
        <div className="w-full max-w-xs mt-2 mb-6">
          <input
            type="text"
            value={sessionGoal}
            onChange={(e) => onSessionGoalChange(e.target.value)}
            placeholder="Write your study intention..."
            aria-label="Study intention"
            className="w-full text-center text-sm bg-transparent text-[var(--text-main)] placeholder-[var(--text-faint)] py-1.5 border-b border-transparent focus:border-[var(--border-hairline)] hover:border-[var(--border-hairline)] focus:outline-none transition-colors select-text"
          />
        </div>

        {/* Calm Primary Controls */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onResetTimer}
            className="p-2.5 rounded-full text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--ink-wash)] transition-colors"
            title="Reset timer"
            aria-label="Reset timer"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={onToggleTimer}
            className="px-7 py-2.5 rounded-full bg-[var(--accent-main)] text-[var(--accent-fg)] hover:bg-[var(--accent-hover)] transition-all active:scale-[0.98] inline-flex items-center gap-2 text-xs font-medium tracking-wide"
          >
            {isRunning ? (
              <>
                <Pause className="w-3.5 h-3.5 fill-current" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                <span>
                  {remainingSeconds < totalDurationSeconds ? 'Resume' : 'Start Session'}
                </span>
              </>
            )}
          </button>

          {breaksEnabled ? (
            <button
              type="button"
              onClick={onSkipPhase}
              className="p-2.5 rounded-full text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--ink-wash)] transition-colors"
              title={phase === 'work' ? 'Skip to break' : 'Skip to focus'}
              aria-label={phase === 'work' ? 'Skip to break' : 'Skip to focus'}
            >
              <SkipForward className="w-4 h-4" />
            </button>
          ) : (
            <div className="w-9" aria-hidden="true" />
          )}
        </div>

        {completedCycles > 0 && (
          <p className="mt-4 text-[11px] font-mono text-[var(--text-faint)]">
            {completedCycles} {completedCycles === 1 ? 'session' : 'sessions'} completed
          </p>
        )}
      </div>
    </section>
  );
};
