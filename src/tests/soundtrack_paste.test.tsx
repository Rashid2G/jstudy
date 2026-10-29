// @vitest-environment jsdom
import React, { act } from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { SettingsModal } from '../components/SettingsModal.js';
import { SoundtrackWidget } from '../components/widgets/SoundtrackWidget.js';
import { localStudyStorage, defaultCuratedRadios } from '../services/storage.js';
import { api } from '../services/api.js';

beforeEach(() => {
  global.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
  window.matchMedia =
    window.matchMedia ||
    function () {
      return {
        matches: false,
        addListener: function () {},
        removeListener: function () {},
      };
    };
});

describe('Soundtrack default & YouTube Title Auto-fetch on Paste', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStudyStorage.resetAll();
  });

  afterEach(() => {
    cleanup();
  });

  describe('Default Soundtrack', () => {
    it('has https://www.youtube.com/watch?v=rFZHOHl-L8A as the default soundtrack', () => {
      const radios = localStudyStorage.getRadios();
      const defaultRadio = radios.find((r) => r.is_curated === 1) || radios[0];

      expect(defaultRadio).toBeDefined();
      expect(defaultRadio.url).toBe('https://www.youtube.com/watch?v=rFZHOHl-L8A');
      expect(defaultRadio.name).toContain('lofi hip hop radio');
      expect(defaultCuratedRadios[0].url).toBe('https://www.youtube.com/watch?v=rFZHOHl-L8A');
    });
  });

  describe('SettingsModal paste support', () => {
    const dummyTimerState = {
      phase: 'work' as const,
      remainingSeconds: 1500,
      totalDurationSeconds: 1500,
      isRunning: false,
      completedCycles: 0,
      workMinutes: 25,
      breakMinutes: 5,
      breaksEnabled: 1,
      timerMode: 'pomodoro' as const,
    };

    it('fetches title when YouTube link is pasted into URL cell', async () => {
      vi.spyOn(api, 'getYouTubeMeta').mockResolvedValueOnce({
        videoId: 'rFZHOHl-L8A',
        title: 'lofi hip hop radio 📚 beats to relax/study to',
        author: 'Lofi Girl',
      });

      render(
        <SettingsModal
          isOpen={true}
          onClose={() => {}}
          timerState={dummyTimerState}
          onConfigureTimer={() => {}}
          stations={localStudyStorage.getRadios()}
          currentStationId="radio-yt-lofigirl"
          onSelectStation={() => {}}
          radioVolume={0.7}
          onRadioVolumeChange={() => {}}
          onAddStation={async () => {}}
          ambientSound="none"
          ambientVolume={0.3}
          onAmbientSoundChange={() => {}}
          onAmbientVolumeChange={() => {}}
          currentTheme="sage"
          onSelectTheme={() => {}}
          colorMode="dark"
          onToggleColorMode={() => {}}
        />
      );

      const addBtn = screen.getByRole('button', { name: /Add custom URL/i });
      fireEvent.click(addBtn);

      const urlInput = screen.getByPlaceholderText(/https:\/\/music\.youtube\.com/i);
      const titleInput = screen.getByPlaceholderText(/e\.g\. My Study Beats/i) as HTMLInputElement;

      // Simulate pasting YouTube link into URL cell
      fireEvent.paste(urlInput, {
        clipboardData: {
          getData: () => 'https://www.youtube.com/watch?v=rFZHOHl-L8A',
        },
      });

      await waitFor(() => {
        expect(titleInput.value).toBe('lofi hip hop radio 📚 beats to relax/study to');
      });
    });

    it('fetches title when YouTube link is pasted into Title cell, and sets URL cell', async () => {
      vi.spyOn(api, 'getYouTubeMeta').mockResolvedValueOnce({
        videoId: 'rFZHOHl-L8A',
        title: 'lofi hip hop radio 📚 beats to relax/study to',
        author: 'Lofi Girl',
      });

      render(
        <SettingsModal
          isOpen={true}
          onClose={() => {}}
          timerState={dummyTimerState}
          onConfigureTimer={() => {}}
          stations={localStudyStorage.getRadios()}
          currentStationId="radio-yt-lofigirl"
          onSelectStation={() => {}}
          radioVolume={0.7}
          onRadioVolumeChange={() => {}}
          onAddStation={async () => {}}
          ambientSound="none"
          ambientVolume={0.3}
          onAmbientSoundChange={() => {}}
          onAmbientVolumeChange={() => {}}
          currentTheme="sage"
          onSelectTheme={() => {}}
          colorMode="dark"
          onToggleColorMode={() => {}}
        />
      );

      const addBtn = screen.getByRole('button', { name: /Add custom URL/i });
      fireEvent.click(addBtn);

      const titleInput = screen.getByPlaceholderText(/e\.g\. My Study Beats/i) as HTMLInputElement;
      const urlInput = screen.getByPlaceholderText(/https:\/\/music\.youtube\.com/i) as HTMLInputElement;

      // Simulate pasting YouTube link into Title cell
      fireEvent.paste(titleInput, {
        clipboardData: {
          getData: () => 'https://www.youtube.com/watch?v=rFZHOHl-L8A',
        },
      });

      await waitFor(() => {
        expect(titleInput.value).toBe('lofi hip hop radio 📚 beats to relax/study to');
        expect(urlInput.value).toBe('https://www.youtube.com/watch?v=rFZHOHl-L8A');
      });
    });

    it('leaves cell as it is if fetching YouTube title errors', async () => {
      vi.spyOn(api, 'getYouTubeMeta').mockRejectedValueOnce(
        new Error('Failed to fetch YouTube title')
      );

      render(
        <SettingsModal
          isOpen={true}
          onClose={() => {}}
          timerState={dummyTimerState}
          onConfigureTimer={() => {}}
          stations={localStudyStorage.getRadios()}
          currentStationId="radio-yt-lofigirl"
          onSelectStation={() => {}}
          radioVolume={0.7}
          onRadioVolumeChange={() => {}}
          onAddStation={async () => {}}
          ambientSound="none"
          ambientVolume={0.3}
          onAmbientSoundChange={() => {}}
          onAmbientVolumeChange={() => {}}
          currentTheme="sage"
          onSelectTheme={() => {}}
          colorMode="dark"
          onToggleColorMode={() => {}}
        />
      );

      const addBtn = screen.getByRole('button', { name: /Add custom URL/i });
      fireEvent.click(addBtn);

      const titleInput = screen.getByPlaceholderText(/e\.g\. My Study Beats/i) as HTMLInputElement;

      fireEvent.change(titleInput, {
        target: { value: 'https://www.youtube.com/watch?v=broken_id' },
      });

      // Wait a moment for async promise rejection
      await new Promise((r) => setTimeout(r, 50));

      // Value must remain as it is
      expect(titleInput.value).toBe('https://www.youtube.com/watch?v=broken_id');
    });
  });

  describe('SoundtrackWidget paste support', () => {
    it('fetches title when YouTube link is pasted into SoundtrackWidget cell', async () => {
      vi.spyOn(api, 'getYouTubeMeta').mockResolvedValueOnce({
        videoId: 'rFZHOHl-L8A',
        title: 'lofi hip hop radio 📚 beats to relax/study to',
        author: 'Lofi Girl',
      });

      render(
        <SoundtrackWidget
          stations={localStudyStorage.getRadios()}
          currentStationId="radio-yt-lofigirl"
          onSelectStation={() => {}}
          isPlaying={false}
          soundtrackEnabled={true}
          onToggleSoundtrack={() => {}}
          radioVolume={0.7}
          onRadioVolumeChange={() => {}}
          onAddStation={async () => {}}
          isExpanded={true}
        />
      );

      // Click "Add custom URL" to show inline form
      const addBtn = screen.getByRole('button', { name: /Add custom URL/i });
      fireEvent.click(addBtn);

      const titleInput = screen.getByPlaceholderText(/Station title/i) as HTMLInputElement;

      // Paste link into title cell
      fireEvent.paste(titleInput, {
        clipboardData: {
          getData: () => 'https://www.youtube.com/watch?v=rFZHOHl-L8A',
        },
      });

      await waitFor(() => {
        expect(titleInput.value).toBe('lofi hip hop radio 📚 beats to relax/study to');
      });
    });

    it('leaves SoundtrackWidget input as it is if fetching errors', async () => {
      vi.spyOn(api, 'getYouTubeMeta').mockRejectedValueOnce(
        new Error('Network error')
      );

      render(
        <SoundtrackWidget
          stations={localStudyStorage.getRadios()}
          currentStationId="radio-yt-lofigirl"
          onSelectStation={() => {}}
          isPlaying={false}
          soundtrackEnabled={true}
          onToggleSoundtrack={() => {}}
          radioVolume={0.7}
          onRadioVolumeChange={() => {}}
          onAddStation={async () => {}}
          isExpanded={true}
        />
      );

      const addBtn = screen.getByRole('button', { name: /Add custom URL/i });
      fireEvent.click(addBtn);

      const titleInput = screen.getByPlaceholderText(/Station title/i) as HTMLInputElement;

      fireEvent.change(titleInput, {
        target: { value: 'https://www.youtube.com/watch?v=broken_id' },
      });

      await new Promise((r) => setTimeout(r, 50));

      expect(titleInput.value).toBe('https://www.youtube.com/watch?v=broken_id');
    });
  });
});
