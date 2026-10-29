import React from 'react';
import { TimerState } from '../../utils/timer.js';
import { CalmSwitch } from '../ui.js';
import { Clock, Minus, Plus, ChevronDown, X } from 'lucide-react';

interface Props {
  timerState: TimerState;
  onConfigureTimer: (updates: {
    workMinutes?: number;
    breakMinutes?: number;
    breaksEnabled?: boolean;
  }) => void;
  isExpanded?: boolean;
  isCompressed?: boolean;
  isTall?: boolean;
  isNarrow?: boolean;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  onToggleExpand?: () => void;
  onClose?: () => void;
  className?: string;
  style?: React.CSSProperties;
}

const PRESETS = [
  { label: '25 / 5', work: 25, brk: 5, breaks: true, name: 'Pomodoro' },
  { label: '50 / 10', work: 50, brk: 10, breaks: true, name: 'Deep' },
  { label: '90 / 15', work: 90, brk: 15, breaks: true, name: 'Wave' },
  { label: '45m flow', work: 45, brk: 0, breaks: false, name: 'Flow' },
];

export const TimerRhythmWidget: React.FC<Props> = ({
  timerState,
  onConfigureTimer,
  isExpanded = false,
  isCompressed = false,
  isTall = false,
  isNarrow = false,
  onMouseEnter,
  onMouseLeave,
  onToggleExpand,
  onClose,
  className = '',
  style,
}) => {
  const { workMinutes, breakMinutes, breaksEnabled } = timerState;

  const activePreset = PRESETS.find(
    (p) =>
      p.work === workMinutes &&
      p.breaks === breaksEnabled &&
      (!p.breaks || p.brk === breakMinutes)
  );

  return (
    <div
      className={`apple-widget group rounded-[22px] bg-[var(--bg-elevated)]/90 backdrop-blur-xl border select-none ${
        isExpanded
          ? 'is-expanded border-[var(--accent-main)] p-3.5 sm:p-4 flex flex-col justify-start'
          : isCompressed
          ? `is-compressed border-[var(--border-hairline)] ${
              isTall ? 'p-3 flex flex-col justify-center' : 'px-3 sm:px-3.5 py-0 flex items-center'
            }`
          : 'border-[var(--border-hairline)] p-3.5 sm:p-4 flex items-center'
      } ${className}`}
      style={style}
      tabIndex={0}
      role="region"
      aria-label="Timer Rhythm Widget"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {/* If compressed & tall (vertical column companion) */}
      {isCompressed && isTall ? (
        <div
          className="flex flex-col items-center justify-center text-center w-full h-full cursor-pointer gap-2 py-1 select-none"
          onClick={onToggleExpand}
          title="Click to expand"
        >
          <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-[var(--ink-wash-strong)] text-[var(--accent-main)] shadow-sm shrink-0 transition-transform group-hover:scale-105">
            <Clock className="w-4 h-4" />
          </div>
          <div className="min-w-0 max-w-full px-1">
            <span className="block text-[10px] font-semibold tracking-wider uppercase text-[var(--text-faint)]">
              Rhythm
            </span>
            <p className="text-xs font-semibold text-[var(--text-main)] truncate mt-0.5 max-w-[110px]">
              {breaksEnabled ? `${workMinutes}m / ${breakMinutes}m` : `${workMinutes}m flow`}
            </p>
          </div>
          <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-[var(--ink-wash)] text-[var(--accent-main)] border border-[var(--border-hairline)] shrink-0">
            {activePreset ? activePreset.name : `${workMinutes}m`}
          </span>
        </div>
      ) : (
        /* Standard Header Bar (for resting, compressed-short, and expanded) */
        <div
          className={`flex items-center justify-between cursor-pointer w-full ${!isExpanded ? 'h-full' : ''}`}
          onClick={onToggleExpand}
          title={isExpanded ? 'Click to collapse' : 'Click to expand'}
        >
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
            <div
              className={`${
                isCompressed ? 'w-7 h-7 sm:w-8 sm:h-8' : 'w-8 h-8 sm:w-9 sm:h-9'
              } rounded-xl flex items-center justify-center bg-[var(--ink-wash-strong)] text-[var(--accent-main)] shrink-0 transition-transform group-hover:scale-105`}
            >
              <Clock className={isCompressed ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
            </div>

            <div className="min-w-0">
              <span className="block text-[10px] font-semibold tracking-wider uppercase text-[var(--text-faint)] truncate">
                {isCompressed ? 'Rhythm' : 'Focus Rhythm'}
              </span>
              {!isCompressed ? (
                <p className="text-xs font-semibold text-[var(--text-main)] truncate mt-0.5">
                  {breaksEnabled
                    ? `${workMinutes}m focus · ${breakMinutes}m rest`
                    : `${workMinutes}m continuous`}
                </p>
              ) : !isNarrow ? (
                <p className="text-[11px] font-medium text-[var(--text-main)] truncate">
                  {breaksEnabled ? `${workMinutes}m / ${breakMinutes}m` : `${workMinutes}m`}
                </p>
              ) : null}
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-[var(--ink-wash)] text-[var(--accent-main)] border border-[var(--border-hairline)]">
              {activePreset ? activePreset.name : `${workMinutes}m`}
            </span>

            {isExpanded && onClose ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onClose();
                }}
                className="p-1 rounded-full text-[var(--text-faint)] hover:text-[var(--text-main)] hover:bg-[var(--ink-wash)] transition-colors"
                title="Close widget"
                aria-label="Close widget"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            ) : !isCompressed ? (
              <ChevronDown className="w-3.5 h-3.5 text-[var(--text-faint)] apple-widget-chevron" />
            ) : null}
          </div>
        </div>
      )}

      {/* Expandable Apple Controls Drawer */}
      <div className="apple-widget-drawer w-full">
        <div className="apple-widget-drawer-inner">
          <div className="pt-3.5 mt-3 border-t border-[var(--border-hairline)] space-y-3">
            {/* Quick Presets Grid */}
            <div>
              <span className="block text-[10px] font-semibold uppercase tracking-wider text-[var(--text-faint)] mb-1.5">
                Rhythm Presets
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {PRESETS.map((p) => {
                  const isSelected =
                    workMinutes === p.work &&
                    breaksEnabled === p.breaks &&
                    (!p.breaks || breakMinutes === p.brk);

                  return (
                    <button
                      key={p.label}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onConfigureTimer({
                          workMinutes: p.work,
                          breakMinutes: p.brk,
                          breaksEnabled: p.breaks,
                        });
                      }}
                      className={`px-2.5 py-2 rounded-xl text-center text-xs font-medium transition-all ${
                        isSelected
                          ? 'bg-[var(--accent-main)] text-[var(--accent-fg)] font-semibold shadow-sm'
                          : 'bg-[var(--ink-wash)] text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--ink-wash-strong)]'
                      }`}
                    >
                      <span className="block font-mono font-semibold">{p.label}</span>
                      <span className="block text-[10px] opacity-80 mt-0.5">{p.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Steppers: Focus Time & Breaks Duration */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              {/* Focus Stepper Card */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-[var(--ink-wash)] border border-[var(--border-hairline)]">
                <div>
                  <span className="text-xs font-medium text-[var(--text-main)]">Focus Time</span>
                  <p className="text-[10px] text-[var(--text-faint)]">Study interval</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onConfigureTimer({ workMinutes: Math.max(1, workMinutes - 5) });
                    }}
                    className="w-7 h-7 rounded-lg bg-[var(--bg-canvas)] border border-[var(--border-hairline)] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--ink-wash-strong)] active:scale-95 transition-all shadow-sm"
                    aria-label="Decrease focus time"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="font-mono text-xs w-10 text-center font-semibold text-[var(--text-main)]">
                    {workMinutes}m
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onConfigureTimer({ workMinutes: Math.min(240, workMinutes + 5) });
                    }}
                    className="w-7 h-7 rounded-lg bg-[var(--bg-canvas)] border border-[var(--border-hairline)] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--ink-wash-strong)] active:scale-95 transition-all shadow-sm"
                    aria-label="Increase focus time"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Breaks Switch & Stepper Card */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-3 rounded-xl bg-[var(--ink-wash)] border border-[var(--border-hairline)]">
                <div className="flex items-center justify-between sm:justify-start gap-3" onClick={(e) => e.stopPropagation()}>
                  <CalmSwitch
                    id="widget-breaks-toggle"
                    checked={breaksEnabled}
                    onCheckedChange={(checked) => onConfigureTimer({ breaksEnabled: checked })}
                    label="Rest Breaks"
                  />
                  {!breaksEnabled && (
                    <span className="text-[10px] font-mono text-[var(--text-faint)] sm:hidden">Continuous flow</span>
                  )}
                </div>

                {breaksEnabled ? (
                  <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0 pt-1.5 sm:pt-0 border-t sm:border-t-0 border-[var(--border-hairline)]/50">
                    <span className="text-[10px] text-[var(--text-faint)] sm:hidden">Duration</span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onConfigureTimer({ breakMinutes: Math.max(1, breakMinutes - 1) });
                        }}
                        className="w-7 h-7 rounded-lg bg-[var(--bg-canvas)] border border-[var(--border-hairline)] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--ink-wash-strong)] active:scale-95 transition-all shadow-sm"
                        aria-label="Decrease break time"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="font-mono text-xs w-9 text-center font-semibold text-[var(--text-main)]">
                        {breakMinutes}m
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onConfigureTimer({ breakMinutes: Math.min(90, breakMinutes + 1) });
                        }}
                        className="w-7 h-7 rounded-lg bg-[var(--bg-canvas)] border border-[var(--border-hairline)] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--ink-wash-strong)] active:scale-95 transition-all shadow-sm"
                        aria-label="Increase break time"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <span className="hidden sm:inline-block text-[10px] font-mono text-[var(--text-faint)]">
                    Continuous
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
