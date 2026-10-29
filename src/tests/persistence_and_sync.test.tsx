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
