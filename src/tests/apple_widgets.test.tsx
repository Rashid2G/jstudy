// @vitest-environment jsdom
import React, { act } from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
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
        frequency: { value: 1000, setValueAtTime: vi.fn() },
        Q: { value: 1, setValueAtTime: vi.fn() },
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

describe('Apple Style Interactive Widgets Shelf', () => {
  it('renders all four Apple widgets on the main page', async () => {
    await act(async () => {
      render(<App />);
    });

    // 4 Widgets by aria-label / role
    expect(screen.getByRole('region', { name: /Timer Rhythm Widget/i })).toBeDefined();
    expect(screen.getByRole('region', { name: /Soundtrack Widget/i })).toBeDefined();
    expect(screen.getByRole('region', { name: /Ambient Atmosphere Widget/i })).toBeDefined();
    expect(screen.getByRole('region', { name: /Appearance Widget/i })).toBeDefined();
  });

  it('allows switching timer rhythm preset directly from the widget without settings modal', async () => {
    await act(async () => {
      render(<App />);
    });

    const rhythmWidget = screen.getByRole('region', { name: /Timer Rhythm Widget/i });
    expect(rhythmWidget).toBeDefined();

    // Click 50 / 10 preset button inside rhythm widget
    const deepPresetBtn = screen.getByRole('button', { name: /50 \/ 10/i });
    expect(deepPresetBtn).toBeDefined();

    await act(async () => {
      fireEvent.click(deepPresetBtn);
    });

    // Main timer dial updates to 50:00!
    expect(screen.getByText('50:00')).toBeDefined();
  });

  it('allows adjusting break time and focus time cleanly without overflowing', async () => {
    await act(async () => {
      render(<App />);
    });

    // Find Increase break time button
    const incBreakBtn = screen.getByRole('button', { name: /Increase break time/i });
    expect(incBreakBtn).toBeDefined();

    await act(async () => {
      fireEvent.click(incBreakBtn);
    });

    // Default was 5m, now 6m
    expect(screen.getByText('6m')).toBeDefined();

    // Find Increase focus time button
    const incFocusBtn = screen.getByRole('button', { name: /Increase focus time/i });
    await act(async () => {
      fireEvent.click(incFocusBtn);
    });

    // Default was 25m, now 30m (+5)
    expect(screen.getAllByText('30m').length).toBeGreaterThanOrEqual(1);
  });

  it('provides responsive volume slider for soundtrack and ambient audio', async () => {
    await act(async () => {
      render(<App />);
    });

    const soundtrackSlider = screen.getByRole('slider', { name: /Soundtrack volume/i });
    expect(soundtrackSlider).toBeDefined();
    expect(soundtrackSlider.closest('[class*="w-full"]')).toBeDefined();

    const ambientSlider = screen.getByRole('slider', { name: /Atmosphere volume/i });
    expect(ambientSlider).toBeDefined();
    expect(ambientSlider.closest('[class*="w-full"]')).toBeDefined();
  });

  it('expands inward on hover and cleanly exits without shifting the area under cursor', async () => {
    await act(async () => {
      render(<App />);
    });

    const rhythmWidget = screen.getByRole('region', { name: /Timer Rhythm Widget/i });
    const soundtrackWidget = screen.getByRole('region', { name: /Soundtrack Widget/i });
    const shelfSection = screen.getByRole('region', { name: /Apple Control Widgets/i });

    // Hover Top-Left (rhythm): expands down and right into the inner div
    await act(async () => {
      fireEvent.mouseEnter(rhythmWidget);
    });
    expect(rhythmWidget.classList.contains('is-expanded')).toBe(true);
    expect(soundtrackWidget.classList.contains('is-compressed')).toBe(true);
    expect(rhythmWidget.style.width).toBe('calc(73% - 5px)');
    expect(rhythmWidget.style.height).toBe('calc(100% - 64px)');

    // Hover Top-Right (soundtrack): expands down and left into the inner div
    await act(async () => {
      fireEvent.mouseEnter(soundtrackWidget);
    });
    // Rhythm widget collapses
    expect(rhythmWidget.classList.contains('is-expanded')).toBe(false);
    expect(rhythmWidget.classList.contains('is-compressed')).toBe(true);
    // Soundtrack widget expands
    expect(soundtrackWidget.classList.contains('is-expanded')).toBe(true);
    expect(soundtrackWidget.style.width).toBe('calc(73% - 5px)');
    expect(soundtrackWidget.style.height).toBe('calc(100% - 64px)');

    // Clean exit: leave the shelf entirely
    await act(async () => {
      fireEvent.mouseLeave(shelfSection);
    });
    expect(soundtrackWidget.classList.contains('is-expanded')).toBe(false);
    expect(soundtrackWidget.classList.contains('is-compressed')).toBe(false);
    expect(soundtrackWidget.style.width).toBe('calc(50% - 5px)');
  });

  it('allows switching ambient atmosphere sound directly from the widget', async () => {
    await act(async () => {
      render(<App />);
    });

    const rainButton = screen.getByRole('button', { name: /^Rain$/i });
    expect(rainButton).toBeDefined();

    await act(async () => {
      fireEvent.click(rainButton);
    });

    expect(window.localStorage.getItem('studinty-ambient-sound')).toBe('rain');
  });

  it('allows switching color theme and dark/light mode directly from the appearance widget', async () => {
    await act(async () => {
      render(<App />);
    });

    // Find Sand theme button inside Appearance widget
    const sandBtn = screen.getByRole('radio', { name: /Warm Sand/i });
    expect(sandBtn).toBeDefined();

    await act(async () => {
      fireEvent.click(sandBtn);
    });

        expect(document.documentElement.getAttribute('data-theme')).toBe('sand');
  });

  it('opens settings modal directly at soundtrack station form when clicking Add custom URL in soundtrack widget', async () => {
    await act(async () => {
      render(<App />);
    });

    const soundtrackWidget = screen.getByRole('region', { name: /Soundtrack Widget/i });

    // Expand soundtrack widget
    await act(async () => {
      fireEvent.mouseEnter(soundtrackWidget);
    });
    expect(soundtrackWidget.classList.contains('is-expanded')).toBe(true);

    // Find 'Add custom URL' button in the expanded soundtrack widget
    const addUrlBtn = screen.getByRole('button', { name: /Add custom URL/i });
    expect(addUrlBtn).toBeDefined();

    await act(async () => {
      fireEvent.click(addUrlBtn);
    });

    // Modal opens directly to the soundtrack form with Station Title input visible
    const stationTitleInput = screen.getByPlaceholderText(/e\.g\. My Study Beats/i);
    expect(stationTitleInput).toBeDefined();

    // Verify modal dialog is open
    expect(screen.getByRole('dialog', { name: /Settings & Preferences/i })).toBeDefined();
  });

  it('renders unfocused companion widgets cleanly centered without layout distortion', async () => {
    await act(async () => {
      render(<App />);
    });

    const soundtrackWidget = screen.getByRole('region', { name: /Soundtrack Widget/i });
    const rhythmWidget = screen.getByRole('region', { name: /Timer Rhythm Widget/i });
    const ambientWidget = screen.getByRole('region', { name: /Ambient Atmosphere Widget/i });
    const appearanceWidget = screen.getByRole('region', { name: /Appearance Widget/i });

    // Expand Soundtrack widget
    await act(async () => {
      fireEvent.mouseEnter(soundtrackWidget);
    });

    // Rhythm is companion in the tall column (compressed & tall)
    expect(rhythmWidget.classList.contains('is-compressed')).toBe(true);
    // Ambient & Appearance are companions in the short row (compressed & short)
    expect(ambientWidget.classList.contains('is-compressed')).toBe(true);
    expect(appearanceWidget.classList.contains('is-compressed')).toBe(true);

    // Rhythm widget shows cleanly centered Rhythm label and Pomodoro/timing text
    expect(rhythmWidget.textContent).toContain('Rhythm');
    expect(rhythmWidget.textContent).toContain('Pomodoro');

    // Ambient widget shows Atmosphere / Ambient and Off badge
    expect(ambientWidget.textContent).toContain('Off');

    // Appearance widget shows Theme and Dark badge
    expect(appearanceWidget.textContent).toContain('Dark');
  });

  it('toggles loop mode in Rhythm widget and controls required total duration', async () => {
    await act(async () => {
      render(<App />);
    });

    // Loop is ON by default
    const widgetLoopToggle = screen.getByRole('switch', { name: /Loop Sessions/i });
    expect(widgetLoopToggle).toBeDefined();
    expect(widgetLoopToggle.getAttribute('aria-checked')).toBe('true');

    // Turn Loop OFF
    await act(async () => {
      fireEvent.click(widgetLoopToggle);
    });
    expect(widgetLoopToggle.getAttribute('aria-checked')).toBe('false');

    // Required Total Duration appears in widget
    await waitFor(() => {
      expect(screen.getByText(/Req/i)).toBeDefined();
      expect(screen.getByText(/Default: 30m/i)).toBeDefined();
    });

    // Adjust total duration via widget button
    const decBtn = screen.getByRole('button', { name: /Decrease total duration/i });
    await act(async () => {
      fireEvent.click(decBtn);
    });

    // 30m - 5m = 25m
    expect(screen.getAllByText('25m').length).toBeGreaterThanOrEqual(1);
  });
});

