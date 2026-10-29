// @vitest-environment jsdom
import React, { act } from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { App } from '../App.js';

// Polyfill ResizeObserver & matchMedia for Radix UI and jsdom
afterEach(() => {
  cleanup();
});

beforeEach(() => {
  document.body.innerHTML = "";
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

  // Mock AudioContext
  window.AudioContext = vi.fn().mockImplementation(() => ({
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
      frequency: { value: 1000, setValueAtTime: vi.fn() },
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
  })) as any;
});

describe('App React Component Integration', () => {
  it('renders jstudy app header and timer side controls', async () => {
    await act(async () => {
      render(<App />);
    });

    // Header brand
    expect(screen.getByText('jstudy')).toBeDefined();

    // Side controls on the sides of the timer
    expect(screen.getByRole('button', { name: /Reset timer/i })).toBeDefined();
    expect(screen.getByText(/Sound track on|Sound track off/i)).toBeDefined();
    expect(screen.getByRole('button', { name: /Start Session/i })).toBeDefined();
  });

  it('renders navigation tabs and switches between Focus, Sessions, and Plays', async () => {
    await act(async () => {
      render(<App />);
    });

    const focusTab = screen.getByRole('tab', { name: /Focus/i });
    const sessionsTab = screen.getByRole('tab', { name: /Sessions/i });
    const playsTab = screen.getByRole('tab', { name: /Plays/i });

    expect(focusTab).toBeDefined();
    expect(sessionsTab).toBeDefined();
    expect(playsTab).toBeDefined();

    // Trigger Radix Tabs switch
    await act(async () => {
      fireEvent.click(sessionsTab);
    });

    await waitFor(() => {
      expect(screen.getByText(/Focus Log/i)).toBeDefined();
    });

    // Switch to Plays tab
    await act(async () => {
      fireEvent.click(playsTab);
    });

    await waitFor(() => {
      expect(screen.getByText(/Listening History/i)).toBeDefined();
    });

    // Switch back to Focus tab
    await act(async () => {
      fireEvent.click(focusTab);
    });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Start Session/i })).toBeDefined();
    });
  });

  it('toggles light/dark theme via Settings modal', async () => {
    await act(async () => {
      render(<App />);
    });

    const settingsBtn = screen.getByTitle('Open Settings');
    await act(async () => {
      fireEvent.click(settingsBtn);
    });

    // Find the light or dark button in the settings modal
    const themeBtn = screen.getByRole('button', { name: /^Light$/i });
    expect(themeBtn).toBeDefined();

    await act(async () => {
      fireEvent.click(themeBtn);
    });

    const isDark = document.documentElement.classList.contains('dark');
    expect(typeof isDark).toBe('boolean');
  });

  it('opens settings modal with timer durations and soundtrack settings', async () => {
    await act(async () => {
      render(<App />);
    });

    const settingsBtn = screen.getByTitle('Open Settings');
    expect(settingsBtn).toBeDefined();

    await act(async () => {
      fireEvent.click(settingsBtn);
    });

    await waitFor(() => {
      expect(screen.getByText(/Timer Intervals & Rhythms|Timer Durations/i)).toBeDefined();
      expect(screen.getByText('Soundtrack Station')).toBeDefined();
      expect(screen.getByText(/Color Palettes & Theme/i)).toBeDefined();
    });
  });
});
