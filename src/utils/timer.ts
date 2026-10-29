export type TimerPhase = 'work' | 'break';

export interface TimerConfig {
  workMinutes: number;
  breakMinutes: number;
}

export interface TimerState {
  phase: TimerPhase;
  totalDurationSeconds: number;
  remainingSeconds: number;
  isRunning: boolean;
  completedCycles: number;
}

export function createInitialTimerState(config: TimerConfig): TimerState {
  const duration = Math.max(1, config.workMinutes) * 60;
  return {
    phase: 'work',
    totalDurationSeconds: duration,
    remainingSeconds: duration,
    isRunning: false,
    completedCycles: 0,
  };
}

export function tickTimer(state: TimerState): { nextState: TimerState; didCompletePhase: boolean } {
  if (!state.isRunning) {
    return { nextState: state, didCompletePhase: false };
  }

  if (state.remainingSeconds > 1) {
    return {
      nextState: {
        ...state,
        remainingSeconds: state.remainingSeconds - 1,
      },
      didCompletePhase: false,
    };
  }

  // Phase completed!
  const isWorkPhase = state.phase === 'work';
  const nextPhase: TimerPhase = isWorkPhase ? 'break' : 'work';
  const nextCycles = isWorkPhase ? state.completedCycles + 1 : state.completedCycles;

  return {
    nextState: {
      ...state,
      phase: nextPhase,
      remainingSeconds: 0,
      isRunning: false,
      completedCycles: nextCycles,
    },
    didCompletePhase: true,
  };
}

export function calculateProgress(total: number, remaining: number): number {
  if (total <= 0) return 0;
  const progress = ((total - remaining) / total) * 100;
  return Math.min(100, Math.max(0, Math.round(progress * 10) / 10));
}
