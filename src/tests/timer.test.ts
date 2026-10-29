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
    breaksEnabled: true,
  };

  it('initializes timer state properly with breaks enabled', () => {
    const state = createInitialTimerState(sampleConfig);
    expect(state.phase).toBe('work');
    expect(state.totalDurationSeconds).toBe(1500);
    expect(state.remainingSeconds).toBe(1500);
    expect(state.isRunning).toBe(false);
    expect(state.completedCycles).toBe(0);
    expect(state.breaksEnabled).toBe(true);
  });

  it('ticks down seconds when running', () => {
    let state = createInitialTimerState(sampleConfig);
    state = { ...state, isRunning: true };

    const { nextState, didCompletePhase, completedWorkPhase } = tickTimer(state);
    expect(nextState.remainingSeconds).toBe(1499);
    expect(didCompletePhase).toBe(false);
    expect(completedWorkPhase).toBe(false);
  });

  it('does not tick when paused', () => {
    const state = createInitialTimerState(sampleConfig);
    const { nextState, didCompletePhase } = tickTimer(state);
    expect(nextState.remainingSeconds).toBe(1500);
    expect(didCompletePhase).toBe(false);
  });

  it('transitions from work phase to break phase when breaks are enabled', () => {
    let state = createInitialTimerState({ workMinutes: 40, breakMinutes: 8, breaksEnabled: true });
    state = { ...state, isRunning: true, remainingSeconds: 1 };

    const { nextState, didCompletePhase, completedWorkPhase } = tickTimer(state);
    expect(didCompletePhase).toBe(true);
    expect(completedWorkPhase).toBe(true);
    expect(nextState.phase).toBe('break');
    expect(nextState.remainingSeconds).toBe(8 * 60);
    expect(nextState.totalDurationSeconds).toBe(8 * 60);
    expect(nextState.isRunning).toBe(false);
    expect(nextState.completedCycles).toBe(1);
  });

  it('skips break phase and resets to custom focus duration when breaksEnabled is false', () => {
    let state = createInitialTimerState({ workMinutes: 45, breakMinutes: 0, breaksEnabled: false });
    expect(state.breaksEnabled).toBe(false);
    expect(state.breakMinutes).toBe(0);

    state = { ...state, isRunning: true, remainingSeconds: 1 };
    const { nextState, didCompletePhase, completedWorkPhase } = tickTimer(state);

    expect(didCompletePhase).toBe(true);
    expect(completedWorkPhase).toBe(true);
    expect(nextState.phase).toBe('work');
    expect(nextState.remainingSeconds).toBe(45 * 60);
    expect(nextState.totalDurationSeconds).toBe(45 * 60);
    expect(nextState.isRunning).toBe(false);
    expect(nextState.completedCycles).toBe(1);
  });

  it('returns from break phase back to work phase with full custom duration', () => {
    let state = createInitialTimerState({ workMinutes: 35, breakMinutes: 7, breaksEnabled: true });
    state = {
      ...state,
      phase: 'break',
      totalDurationSeconds: 420,
      remainingSeconds: 1,
      isRunning: true,
    };

    const { nextState, didCompletePhase, completedWorkPhase } = tickTimer(state);
    expect(didCompletePhase).toBe(true);
    expect(completedWorkPhase).toBe(false);
    expect(nextState.phase).toBe('work');
    expect(nextState.remainingSeconds).toBe(35 * 60);
  });

  it('calculates progress percentage correctly', () => {
    expect(calculateProgress(100, 100)).toBe(0);
    expect(calculateProgress(100, 50)).toBe(50);
    expect(calculateProgress(100, 0)).toBe(100);
    expect(calculateProgress(1500, 750)).toBe(50);
    expect(calculateProgress(0, 0)).toBe(0);
  });
});
