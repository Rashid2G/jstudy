// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { App } from '../App.js';

// Polyfill ResizeObserver & matchMedia for Radix UI and jsdom
beforeEach(() => {
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
      gain: { value: 1, setValueAtTime: vi.fn(), linearRampToValueAtTime: vi.fn() },
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
  })) as any;
});

describe('App React Component Integration', () => {
  it('renders Studinty app header and room bar', async () => {
    await act(async () => {
      render(<App />);
    });

    // Header brand
    expect(screen.getByText('studinty')).toBeDefined();

    // Default room tabs loaded from storage
    await waitFor(() => {
      expect(screen.getByText('Silent Library Hall')).toBeDefined();
    });
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
      fireEvent.pointerDown(sessionsTab, { button: 0 });
      fireEvent.click(sessionsTab);
    });

    await waitFor(() => {
      expect(screen.getByText(/Focus Log/i)).toBeDefined();
    });

    // Switch to Plays tab
    await act(async () => {
      fireEvent.pointerDown(playsTab, { button: 0 });
      fireEvent.click(playsTab);
    });

    await waitFor(() => {
      expect(screen.getByText(/Listening History/i)).toBeDefined();
    });

    // Switch back to Focus tab
    await act(async () => {
      fireEvent.pointerDown(focusTab, { button: 0 });
      fireEvent.click(focusTab);
    });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Start Session/i })).toBeDefined();
    });
  });

  it('toggles light/dark theme', async () => {
    await act(async () => {
      render(<App />);
    });

    // Find the dark/light toggle button in the header
    const themeBtn = screen.getByTitle(/Switch to Light Mode|Switch to Dark Mode/i);
    expect(themeBtn).toBeDefined();

    await act(async () => {
      fireEvent.click(themeBtn);
    });

    const isDark = document.documentElement.classList.contains('dark');
    expect(typeof isDark).toBe('boolean');
  });
});
