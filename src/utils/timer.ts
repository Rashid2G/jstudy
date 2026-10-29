export type TimerPhase = 'work' | 'break';

export interface TimerConfig {
  workMinutes: number;
  breakMinutes: number;
  breaksEnabled?: boolean;
}

export interface TimerState {
  phase: TimerPhase;
  totalDurationSeconds: number;
  remainingSeconds: number;
  isRunning: boolean;
  completedCycles: number;
  breaksEnabled: boolean;
  workMinutes: number;
  breakMinutes: number;
}

export function clampMinutes(val: number, min: number, max: number, fallback: number): number {
  if (!Number.isFinite(val)) return fallback;
  return Math.max(min, Math.min(max, Math.round(val)));
}

export function createInitialTimerState(config: TimerConfig): TimerState {
  const workMinutes = clampMinutes(config.workMinutes, 1, 240, 25);
  const breaksEnabled = config.breaksEnabled ?? true;
  const breakMinutes = breaksEnabled
    ? clampMinutes(config.breakMinutes, 1, 90, 5)
    : clampMinutes(config.breakMinutes, 0, 90, 0);
  const duration = workMinutes * 60;

  return {
    phase: 'work',
    totalDurationSeconds: duration,
    remainingSeconds: duration,
    isRunning: false,
    completedCycles: 0,
    breaksEnabled,
    workMinutes,
    breakMinutes,
  };
}

export function tickTimer(
  state: TimerState
): { nextState: TimerState; didCompletePhase: boolean; completedWorkPhase: boolean } {
  if (!state.isRunning) {
    return { nextState: state, didCompletePhase: false, completedWorkPhase: false };
  }

  if (state.remainingSeconds > 1) {
    return {
      nextState: {
        ...state,
        remainingSeconds: state.remainingSeconds - 1,
      },
      didCompletePhase: false,
      completedWorkPhase: false,
    };
  }

  const isWorkPhase = state.phase === 'work';

  if (isWorkPhase) {
    const nextCycles = state.completedCycles + 1;

    if (state.breaksEnabled && state.breakMinutes > 0) {
      const breakDuration = Math.max(1, state.breakMinutes) * 60;
      return {
        nextState: {
          ...state,
          phase: 'break',
          totalDurationSeconds: breakDuration,
          remainingSeconds: breakDuration,
          isRunning: false,
          completedCycles: nextCycles,
        },
        didCompletePhase: true,
        completedWorkPhase: true,
      };
    }

    // Continuous / No-break session: stay on work phase, ready for next run
    const workDuration = Math.max(1, state.workMinutes) * 60;
    return {
      nextState: {
        ...state,
        phase: 'work',
        totalDurationSeconds: workDuration,
        remainingSeconds: workDuration,
        isRunning: false,
        completedCycles: nextCycles,
      },
      didCompletePhase: true,
      completedWorkPhase: true,
    };
  }

  // Break phase completed -> return to work phase
  const workDuration = Math.max(1, state.workMinutes) * 60;
  return {
    nextState: {
      ...state,
      phase: 'work',
      totalDurationSeconds: workDuration,
      remainingSeconds: workDuration,
      isRunning: false,
    },
    didCompletePhase: true,
    completedWorkPhase: false,
  };
}

export function calculateProgress(total: number, remaining: number): number {
  if (total <= 0) return 0;
  const progress = ((total - remaining) / total) * 100;
  return Math.min(100, Math.max(0, Math.round(progress * 10) / 10));
}
