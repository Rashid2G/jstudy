import { describe, it, expect } from 'vitest';
import {
  createInitialTimerState,
  tickTimer,
  calculateProgress,
  TimerConfig,
} from '../utils/timer.js';

describe('timer utility logic', () => {
  const sampleConfig: TimerConfig = {
    workMinutes: 25,
    breakMinutes: 5,
  };

  it('initializes timer state properly', () => {
    const state = createInitialTimerState(sampleConfig);
    expect(state.phase).toBe('work');
    expect(state.totalDurationSeconds).toBe(1500);
    expect(state.remainingSeconds).toBe(1500);
    expect(state.isRunning).toBe(false);
    expect(state.completedCycles).toBe(0);
  });

  it('ticks down seconds when running', () => {
    let state = createInitialTimerState(sampleConfig);
    state = { ...state, isRunning: true };

    const { nextState, didCompletePhase } = tickTimer(state);
    expect(nextState.remainingSeconds).toBe(1499);
    expect(didCompletePhase).toBe(false);
  });

  it('does not tick when paused', () => {
    const state = createInitialTimerState(sampleConfig);
    const { nextState, didCompletePhase } = tickTimer(state);
    expect(nextState.remainingSeconds).toBe(1500);
    expect(didCompletePhase).toBe(false);
  });

  it('transitions from work phase to break phase at 0', () => {
    let state = createInitialTimerState(sampleConfig);
    state = { ...state, isRunning: true, remainingSeconds: 1 };

    const { nextState, didCompletePhase } = tickTimer(state);
    expect(didCompletePhase).toBe(true);
    expect(nextState.phase).toBe('break');
    expect(nextState.isRunning).toBe(false);
    expect(nextState.completedCycles).toBe(1);
  });

  it('calculates progress percentage correctly', () => {
    expect(calculateProgress(100, 100)).toBe(0);
    expect(calculateProgress(100, 50)).toBe(50);
    expect(calculateProgress(100, 0)).toBe(100);
    expect(calculateProgress(1500, 750)).toBe(50);
    expect(calculateProgress(0, 0)).toBe(0);
  });
});
