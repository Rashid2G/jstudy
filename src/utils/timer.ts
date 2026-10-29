export type TimerPhase = 'work' | 'break';

export interface TimerConfig {
  workMinutes: number;
  breakMinutes: number;
  breaksEnabled?: boolean;
  loopEnabled?: boolean;
  totalSessionMinutes?: number;
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
  loopEnabled: boolean;
  totalSessionMinutes: number;
  totalSessionRemainingSeconds: number;
}

export function clampMinutes(val: number, min: number, max: number, fallback: number): number {
  if (!Number.isFinite(val)) return fallback;
  return Math.max(min, Math.min(max, Math.round(val)));
}

export function calculateDefaultTotalSessionMinutes(
  workMinutes: number,
  breakMinutes: number,
  breaksEnabled: boolean
): number {
  return workMinutes + (breaksEnabled ? breakMinutes : 0);
}

export function createInitialTimerState(config: TimerConfig): TimerState {
  const workMinutes = clampMinutes(config.workMinutes, 1, 240, 25);
  const breaksEnabled = config.breaksEnabled ?? true;
  const breakMinutes = breaksEnabled
    ? clampMinutes(config.breakMinutes, 1, 90, 5)
    : clampMinutes(config.breakMinutes, 0, 90, 0);
  const loopEnabled = config.loopEnabled ?? true;

  const defaultTotal = calculateDefaultTotalSessionMinutes(workMinutes, breakMinutes, breaksEnabled);
  const totalSessionMinutes = config.totalSessionMinutes
    ? clampMinutes(config.totalSessionMinutes, 1, 1440, defaultTotal)
    : defaultTotal;

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
    loopEnabled,
    totalSessionMinutes,
    totalSessionRemainingSeconds: totalSessionMinutes * 60,
  };
}

export function tickTimer(
  state: TimerState
): { nextState: TimerState; didCompletePhase: boolean; completedWorkPhase: boolean } {
  if (!state.isRunning) {
    return { nextState: state, didCompletePhase: false, completedWorkPhase: false };
  }

  const nextTotalRemaining = !state.loopEnabled
    ? Math.max(0, state.totalSessionRemainingSeconds - 1)
    : state.totalSessionRemainingSeconds;

  if (state.remainingSeconds > 1) {
    return {
      nextState: {
        ...state,
        remainingSeconds: state.remainingSeconds - 1,
        totalSessionRemainingSeconds: nextTotalRemaining,
      },
      didCompletePhase: false,
      completedWorkPhase: false,
    };
  }

  const isWorkPhase = state.phase === 'work';

  if (isWorkPhase) {
    const nextCycles = state.completedCycles + 1;

    if (state.breaksEnabled && state.breakMinutes > 0) {
      // If loop is OFF and no total session duration remains, complete session without starting break
      if (!state.loopEnabled && nextTotalRemaining <= 0) {
        const workDuration = Math.max(1, state.workMinutes) * 60;
        return {
          nextState: {
            ...state,
            phase: 'work',
            totalDurationSeconds: workDuration,
            remainingSeconds: workDuration,
            totalSessionRemainingSeconds: state.totalSessionMinutes * 60,
            isRunning: false,
            completedCycles: nextCycles,
          },
          didCompletePhase: true,
          completedWorkPhase: true,
        };
      }

      // Break starts automatically
      const rawBreakDuration = Math.max(1, state.breakMinutes) * 60;
      const breakDuration = !state.loopEnabled
        ? Math.min(rawBreakDuration, nextTotalRemaining)
        : rawBreakDuration;

      return {
        nextState: {
          ...state,
          phase: 'break',
          totalDurationSeconds: breakDuration,
          remainingSeconds: breakDuration,
          totalSessionRemainingSeconds: nextTotalRemaining,
          isRunning: true,
          completedCycles: nextCycles,
        },
        didCompletePhase: true,
        completedWorkPhase: true,
      };
    }

    // Continuous / No-break session
    if (!state.loopEnabled && nextTotalRemaining <= 0) {
      const workDuration = Math.max(1, state.workMinutes) * 60;
      return {
        nextState: {
          ...state,
          phase: 'work',
          totalDurationSeconds: workDuration,
          remainingSeconds: workDuration,
          totalSessionRemainingSeconds: state.totalSessionMinutes * 60,
          isRunning: false,
          completedCycles: nextCycles,
        },
        didCompletePhase: true,
        completedWorkPhase: true,
      };
    }

    const rawWorkDuration = Math.max(1, state.workMinutes) * 60;
    const workDuration = !state.loopEnabled
      ? Math.min(rawWorkDuration, nextTotalRemaining)
      : rawWorkDuration;

    return {
      nextState: {
        ...state,
        phase: 'work',
        totalDurationSeconds: workDuration,
        remainingSeconds: workDuration,
        totalSessionRemainingSeconds: nextTotalRemaining,
        isRunning: true,
        completedCycles: nextCycles,
      },
      didCompletePhase: true,
      completedWorkPhase: true,
    };
  }

  // Break phase completed
  if (!state.loopEnabled && nextTotalRemaining <= 0) {
    // Total duration finished when loop is off -> stop cleanly
    const resetWorkDuration = Math.max(1, state.workMinutes) * 60;
    return {
      nextState: {
        ...state,
        phase: 'work',
        totalDurationSeconds: resetWorkDuration,
        remainingSeconds: resetWorkDuration,
        totalSessionRemainingSeconds: state.totalSessionMinutes * 60,
        isRunning: false,
      },
      didCompletePhase: true,
      completedWorkPhase: false,
    };
  }

  // Break finished -> next work phase starts automatically (loop or remaining total duration)
  const rawWorkDuration = Math.max(1, state.workMinutes) * 60;
  const workDuration = !state.loopEnabled
    ? Math.min(rawWorkDuration, nextTotalRemaining)
    : rawWorkDuration;

  return {
    nextState: {
      ...state,
      phase: 'work',
      totalDurationSeconds: workDuration,
      remainingSeconds: workDuration,
      totalSessionRemainingSeconds: nextTotalRemaining,
      isRunning: true,
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
