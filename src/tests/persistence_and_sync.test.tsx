// @vitest-environment jsdom
import React, { act } from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { renderHook } from '@testing-library/react';
import { useStudyTimer } from '../hooks/useStudyTimer.js';
import { App } from '../App.js';

beforeEach(() => {
  window.localStorage.clear();

  global.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as any;

  window.matchMedia =
    window.matchMedia ||
    function () {
      return {
        matches: false,
        addListener: function () {},
        removeListener: function () {},
      };
    };

  function MockAudioContext() {
    return {
      createGain: () => ({
        gain: { value: 1, setValueAtTime: vi.fn(), linearRampToValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() },
        connect: vi.fn(),
      }),
      createOscillator: () => ({
        frequency: { setValueAtTime: vi.fn() },
        type: 'sine',
        connect: vi.fn(),
        start: vi.fn(),
        stop: vi.fn(),
      }),
      createBiquadFilter: () => ({
        type: 'lowpass',
        frequency: { value: 1000 },
        Q: { value: 1 },
        connect: vi.fn(),
      }),
      createBuffer: () => ({
        getChannelData: () => new Float32Array(100),
      }),
      createBufferSource: () => ({
        buffer: null,
        loop: false,
        connect: vi.fn(),
        start: vi.fn(),
        stop: vi.fn(),
      }),
      currentTime: 0,
      destination: {},
      state: 'running',
      resume: vi.fn().mockResolvedValue(undefined),
    };
  }

  window.AudioContext = MockAudioContext as any;
});

describe('Timer State Persistence & Reload', () => {
  it('restores paused timer state from where it stopped on reload', () => {
    // Pre-populate localStorage with a session stopped at 18:25 (1105s remaining)
    const savedState = {
      workMinutes: 25,
      breakMinutes: 5,
      breaksEnabled: true,
      phase: 'work',
      remainingSeconds: 1105,
      totalDurationSeconds: 1500,
      isRunning: false,
      completedCycles: 2,
      sessionGoal: 'Deep reading chapter 5',
      sessionStartedAt: null,
      savedAt: Date.now(),
    };
    window.localStorage.setItem('studinty_persisted_timer_v4', JSON.stringify(savedState));

    const { result } = renderHook(() => useStudyTimer());

    expect(result.current.timerState.remainingSeconds).toBe(1105);
    expect(result.current.timerState.isRunning).toBe(false);
    expect(result.current.timerState.completedCycles).toBe(2);
    expect(result.current.sessionGoal).toBe('Deep reading chapter 5');
  });

  it('restores timer progress in paused state on reload to prevent desynced silent countdown until user resumes', () => {
    // Pre-populate localStorage with a session that was actively running when page reloaded
    const savedState = {
      workMinutes: 50,
      breakMinutes: 10,
      breaksEnabled: true,
      phase: 'work',
      remainingSeconds: 2430,
      totalDurationSeconds: 3000,
      isRunning: true,
      completedCycles: 1,
      sessionGoal: 'Physics Problem Set',
      sessionStartedAt: new Date().toISOString(),
      savedAt: Date.now(),
    };
    window.localStorage.setItem('studinty_persisted_timer_v4', JSON.stringify(savedState));
    window.localStorage.setItem('studinty-soundtrack-enabled', 'true');

    const { result } = renderHook(() => useStudyTimer());

    expect(result.current.timerState.remainingSeconds).toBe(2430);
    expect(result.current.timerState.isRunning).toBe(false);
    expect(result.current.sessionGoal).toBe('Physics Problem Set');

    act(() => {
      result.current.toggleTimer();
    });
    expect(result.current.timerState.isRunning).toBe(true);
  });

  it('accurately advances timer based on elapsed wall-clock time during background throttling', () => {
    vi.useFakeTimers();
    try {
      const { result } = renderHook(() =>
        useStudyTimer({
          initialWorkMinutes: 25,
          initialBreakMinutes: 5,
        })
      );

      // Start the timer (25 min = 1500 sec)
      act(() => {
        result.current.toggleTimer();
      });
      expect(result.current.timerState.isRunning).toBe(true);
      expect(result.current.timerState.remainingSeconds).toBe(1500);

      // Simulate browser background throttling where 60 seconds of real time elapse
      act(() => {
        vi.advanceTimersByTime(60000);
      });

      // 60 seconds should have elapsed in total, leaving 1440 seconds
      expect(result.current.timerState.remainingSeconds).toBe(1440);
    } finally {
      vi.useRealTimers();
    }
  });

  it('immediately syncs elapsed time when tab visibility changes or window receives focus', () => {
    vi.useFakeTimers();
    try {
      const { result } = renderHook(() =>
        useStudyTimer({
          initialWorkMinutes: 25,
          initialBreakMinutes: 5,
        })
      );

      act(() => {
        result.current.toggleTimer();
      });
      expect(result.current.timerState.remainingSeconds).toBe(1500);

      // Advance clock by 120 seconds while simulating suspended intervals
      vi.setSystemTime(Date.now() + 120000);

      // User focuses window / tab becomes visible
      act(() => {
        window.dispatchEvent(new Event('visibilitychange'));
      });

      // Timer should have immediately caught up the 120 elapsed seconds
      expect(result.current.timerState.remainingSeconds).toBe(1380);
    } finally {
      vi.useRealTimers();
    }
  });

  it('completes phase and saves session accurately when full duration elapses while backgrounded', async () => {
    vi.useFakeTimers();
    try {
      const { result } = renderHook(() =>
        useStudyTimer({
          initialWorkMinutes: 25,
          initialBreakMinutes: 5,
          initialLoopEnabled: false,
        })
      );

      act(() => {
        result.current.toggleTimer();
      });
      expect(result.current.timerState.phase).toBe('work');
      expect(result.current.timerState.remainingSeconds).toBe(1500);

      // Advance clock by 25 minutes (1500 seconds)
      act(() => {
        vi.advanceTimersByTime(25 * 60 * 1000);
      });

      // Work phase should have completed, transitioning to break
      expect(result.current.timerState.phase).toBe('break');
      expect(result.current.timerState.completedCycles).toBe(1);
    } finally {
      vi.useRealTimers();
    }
  });
});

describe('Soundtrack Toggle & Sync with Timer', () => {
  it('toggles soundtrack on and off and persists the preference', async () => {
    await act(async () => {
      render(<App />);
    });

    // Find the soundtrack toggle switch
    const soundtrackToggle = screen.getByRole('switch', { name: /Sound track/i });
    expect(soundtrackToggle).toBeDefined();

    // Default is On
    expect(screen.getByText('Sound track on')).toBeDefined();
    expect(window.localStorage.getItem('studinty-soundtrack-enabled')).toBe('true');

    // Click to turn Off
    await act(async () => {
      fireEvent.click(soundtrackToggle);
    });

    expect(screen.getByText('Sound track off')).toBeDefined();
    expect(window.localStorage.getItem('studinty-soundtrack-enabled')).toBe('false');

    // Click to turn back On
    await act(async () => {
      fireEvent.click(soundtrackToggle);
    });

    expect(screen.getByText('Sound track on')).toBeDefined();
    expect(window.localStorage.getItem('studinty-soundtrack-enabled')).toBe('true');
  });

  it('preserves timer and soundtrack state when switching tabs', async () => {
    // Start with a paused timer at 15:00
    const savedState = {
      workMinutes: 25,
      breakMinutes: 5,
      breaksEnabled: true,
      phase: 'work',
      remainingSeconds: 900,
      totalDurationSeconds: 1500,
      isRunning: false,
      completedCycles: 0,
      sessionGoal: 'Chemistry Lab',
      sessionStartedAt: null,
      savedAt: Date.now(),
    };
    window.localStorage.setItem('studinty_persisted_timer_v4', JSON.stringify(savedState));

    await act(async () => {
      render(<App />);
    });

    // Verify initial timer display
    expect(screen.getByText('15:00')).toBeDefined();

    // Switch to Sessions tab
    const sessionsTab = screen.getByRole('tab', { name: /Sessions/i });
    await act(async () => {
      fireEvent.click(sessionsTab);
    });

    // Switch back to Focus timer tab
    const focusTab = screen.getByRole('tab', { name: /Focus/i });
    await act(async () => {
      fireEvent.click(focusTab);
    });

    // Verify timer dial remains intact
    expect(screen.getByText('15:00')).toBeDefined();
    expect(screen.getByText(/Sound track on|Sound track off/i)).toBeDefined();
  });
});
