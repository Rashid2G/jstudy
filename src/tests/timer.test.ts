import { describe, it, expect } from 'vitest';
import {
  createInitialTimerState,
  tickTimer,
  calculateProgress,
  calculateDefaultTotalSessionMinutes,
  TimerConfig,
} from '../utils/timer.js';

describe('timer utility logic', () => {
  const sampleConfig: TimerConfig = {
    workMinutes: 25,
    breakMinutes: 5,
    breaksEnabled: true,
  };

  it('initializes timer state properly with breaks enabled and loop on by default', () => {
    const state = createInitialTimerState(sampleConfig);
    expect(state.phase).toBe('work');
    expect(state.totalDurationSeconds).toBe(1500);
    expect(state.remainingSeconds).toBe(1500);
    expect(state.isRunning).toBe(false);
    expect(state.completedCycles).toBe(0);
    expect(state.breaksEnabled).toBe(true);
    expect(state.loopEnabled).toBe(true);
    expect(state.totalSessionMinutes).toBe(30); // 25 work + 5 break
    expect(state.totalSessionRemainingSeconds).toBe(1800);
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

  it('automatically starts break phase when work phase completes', () => {
    let state = createInitialTimerState({ workMinutes: 40, breakMinutes: 8, breaksEnabled: true });
    state = { ...state, isRunning: true, remainingSeconds: 1 };

    const { nextState, didCompletePhase, completedWorkPhase } = tickTimer(state);
    expect(didCompletePhase).toBe(true);
    expect(completedWorkPhase).toBe(true);
    expect(nextState.phase).toBe('break');
    expect(nextState.remainingSeconds).toBe(8 * 60);
    expect(nextState.totalDurationSeconds).toBe(8 * 60);
    // Break must start automatically!
    expect(nextState.isRunning).toBe(true);
    expect(nextState.completedCycles).toBe(1);
  });

  it('automatically loops from break back to work phase when loop is ON (default)', () => {
    let state = createInitialTimerState({ workMinutes: 35, breakMinutes: 7, breaksEnabled: true });
    state = {
      ...state,
      phase: 'break',
      totalDurationSeconds: 420,
      remainingSeconds: 1,
      isRunning: true,
      loopEnabled: true,
    };

    const { nextState, didCompletePhase, completedWorkPhase } = tickTimer(state);
    expect(didCompletePhase).toBe(true);
    expect(completedWorkPhase).toBe(false);
    expect(nextState.phase).toBe('work');
    expect(nextState.remainingSeconds).toBe(35 * 60);
    expect(nextState.isRunning).toBe(true); // Continuous loop is ON
  });

  it('defaults total duration to 1 full duration of session and break when loop is OFF', () => {
    const state = createInitialTimerState({
      workMinutes: 25,
      breakMinutes: 5,
      breaksEnabled: true,
      loopEnabled: false,
    });
    expect(state.loopEnabled).toBe(false);
    expect(state.totalSessionMinutes).toBe(30); // 1 full duration of 25m work + 5m break
    expect(state.totalSessionRemainingSeconds).toBe(1800);
  });

  it('automatically starts break and then stops when total duration completes with loop OFF', () => {
    // 1 full cycle: 25m work + 5m break = 30m total session duration
    let state = createInitialTimerState({
      workMinutes: 25,
      breakMinutes: 5,
      breaksEnabled: true,
      loopEnabled: false,
    });

    // 1. Complete work phase
    state = { ...state, isRunning: true, remainingSeconds: 1, totalSessionRemainingSeconds: 301 };
    const step1 = tickTimer(state);

    expect(step1.didCompletePhase).toBe(true);
    expect(step1.completedWorkPhase).toBe(true);
    expect(step1.nextState.phase).toBe('break');
    expect(step1.nextState.remainingSeconds).toBe(300);
    // Break starts automatically even when loop is off!
    expect(step1.nextState.isRunning).toBe(true);
    expect(step1.nextState.totalSessionRemainingSeconds).toBe(300);

    // 2. Complete break phase (which exhausts total duration)
    const breakRunningState = { ...step1.nextState, remainingSeconds: 1, totalSessionRemainingSeconds: 1 };
    const step2 = tickTimer(breakRunningState);

    expect(step2.didCompletePhase).toBe(true);
    expect(step2.completedWorkPhase).toBe(false);
    expect(step2.nextState.phase).toBe('work');
    // Total duration finished: stops timer cleanly!
    expect(step2.nextState.isRunning).toBe(false);
  });

  it('stops immediately after work phase if total duration only allowed for work phase', () => {
    // Total duration explicitly set to 25m with 5m breaks configured
    let state = createInitialTimerState({
      workMinutes: 25,
      breakMinutes: 5,
      breaksEnabled: true,
      loopEnabled: false,
      totalSessionMinutes: 25,
    });
    expect(state.totalSessionRemainingSeconds).toBe(1500);

    // Complete work phase
    state = { ...state, isRunning: true, remainingSeconds: 1, totalSessionRemainingSeconds: 1 };
    const { nextState, didCompletePhase, completedWorkPhase } = tickTimer(state);

    expect(didCompletePhase).toBe(true);
    expect(completedWorkPhase).toBe(true);
    // Since total duration (25m) was reached, break does not start; timer stops!
    expect(nextState.isRunning).toBe(false);
    expect(nextState.phase).toBe('work');
  });

  it('runs multiple cycles until custom total duration is reached when loop is OFF', () => {
    // 60m total duration with 25m work + 5m break (2 full cycles)
    let state = createInitialTimerState({
      workMinutes: 25,
      breakMinutes: 5,
      breaksEnabled: true,
      loopEnabled: false,
      totalSessionMinutes: 60,
    });

    // End of Cycle 1 break (30m elapsed, 30m / 1800s remaining)
    state = {
      ...state,
      phase: 'break',
      remainingSeconds: 1,
      totalDurationSeconds: 300,
      totalSessionRemainingSeconds: 1801,
      isRunning: true,
    };

    const { nextState, didCompletePhase } = tickTimer(state);
    expect(didCompletePhase).toBe(true);
    expect(nextState.phase).toBe('work');
    // Since 30m still remain, next work starts automatically
    expect(nextState.isRunning).toBe(true);
    expect(nextState.totalDurationSeconds).toBe(1500);
    expect(nextState.totalSessionRemainingSeconds).toBe(1800);
  });

  it('loops continuous session when breaksEnabled is false and loopEnabled is true', () => {
    let state = createInitialTimerState({ workMinutes: 45, breakMinutes: 0, breaksEnabled: false, loopEnabled: true });
    state = { ...state, isRunning: true, remainingSeconds: 1 };
    const { nextState, didCompletePhase, completedWorkPhase } = tickTimer(state);

    expect(didCompletePhase).toBe(true);
    expect(completedWorkPhase).toBe(true);
    expect(nextState.phase).toBe('work');
    expect(nextState.remainingSeconds).toBe(45 * 60);
    expect(nextState.isRunning).toBe(true); // Auto-loops
    expect(nextState.completedCycles).toBe(1);
  });

  it('stops continuous session after work when breaksEnabled is false and loopEnabled is false', () => {
    let state = createInitialTimerState({ workMinutes: 45, breakMinutes: 0, breaksEnabled: false, loopEnabled: false });
    state = { ...state, isRunning: true, remainingSeconds: 1, totalSessionRemainingSeconds: 1 };
    const { nextState, didCompletePhase, completedWorkPhase } = tickTimer(state);

    expect(didCompletePhase).toBe(true);
    expect(completedWorkPhase).toBe(true);
    expect(nextState.phase).toBe('work');
    expect(nextState.isRunning).toBe(false);
  });

  it('calculates progress percentage correctly', () => {
    expect(calculateProgress(100, 100)).toBe(0);
    expect(calculateProgress(100, 50)).toBe(50);
    expect(calculateProgress(100, 0)).toBe(100);
    expect(calculateProgress(1500, 750)).toBe(50);
    expect(calculateProgress(0, 0)).toBe(0);
  });

  it('computes default total session minutes correctly', () => {
    expect(calculateDefaultTotalSessionMinutes(25, 5, true)).toBe(30);
    expect(calculateDefaultTotalSessionMinutes(50, 10, true)).toBe(60);
    expect(calculateDefaultTotalSessionMinutes(45, 0, false)).toBe(45);
    expect(calculateDefaultTotalSessionMinutes(45, 15, false)).toBe(45);
  });
});
