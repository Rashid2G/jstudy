import React, { useState, useEffect } from 'react';
import { RadioStation, CalmTheme, ColorMode, AmbientSoundType } from '../types/index.js';
import { TimerState } from '../utils/timer.js';
import { CalmDialog, CalmSwitch, CalmSlider } from './ui.js';
import { ThemeSelector } from './ThemeSelector.js';
import { AmbientMixer } from './AmbientMixer.js';
import { Minus, Plus, Music, Volume2, PlusCircle, Trash2, Clock, Palette, Loader2, Repeat } from 'lucide-react';
import { extractYouTubeId, isYouTubeUrl } from '../utils/youtube.js';
import { api } from '../services/api.js';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  timerState: TimerState;
  onConfigureTimer: (updates: {
    workMinutes?: number;
    breakMinutes?: number;
    breaksEnabled?: boolean;
    loopEnabled?: boolean;
    totalSessionMinutes?: number;
  }) => void;
  stations: RadioStation[];
  currentStationId: string | null;
  onSelectStation: (stationId: string) => void;
  radioVolume: number;
  onRadioVolumeChange: (volume: number) => void;
  onAddStation: (data: {
    name: string;
    description: string;
    url: string;
    genre: string;
    stream_type?: string;
  }) => Promise<void>;
  onDeleteStation?: (stationId: string) => Promise<void>;
  ambientSound: AmbientSoundType;
  ambientVolume: number;
  onAmbientSoundChange: (sound: AmbientSoundType) => void;
  onAmbientVolumeChange: (volume: number) => void;
  currentTheme: CalmTheme;
  onSelectTheme: (theme: CalmTheme) => void;
  colorMode: ColorMode;
  onToggleColorMode: () => void;
  initialSection?: string | null;
  initialAddStation?: boolean;
}

const QUICK_PRESETS = [
  { label: '25 / 5', work: 25, brk: 5, breaks: true, desc: 'Classic Pomodoro' },
  { label: '50 / 10', work: 50, brk: 10, breaks: true, desc: 'Deep Rhythm' },
  { label: '90 / 15', work: 90, brk: 15, breaks: true, desc: 'Ultradian Wave' },
  { label: '45m flow', work: 45, brk: 0, breaks: false, desc: 'No-Break Flow' },
];

export const SettingsModal: React.FC<Props> = ({
  isOpen,
  onClose,
  timerState,
  onConfigureTimer,
  stations,
  currentStationId,
  onSelectStation,
  radioVolume,
  onRadioVolumeChange,
  onAddStation,
  onDeleteStation,
  ambientSound,
  ambientVolume,
  onAmbientSoundChange,
  onAmbientVolumeChange,
  currentTheme,
  onSelectTheme,
  colorMode,
  onToggleColorMode,
  initialSection,
  initialAddStation = false,
}) => {
  const [isAddingStation, setIsAddingStation] = useState(false);
  const [stationName, setStationName] = useState('');
  const [stationUrl, setStationUrl] = useState('');
  const [stationGenre, setStationGenre] = useState('lofi');
  const [isSubmittingStation, setIsSubmittingStation] = useState(false);
  const [isFetchingMeta, setIsFetchingMeta] = useState(false);

  const { workMinutes, breakMinutes, breaksEnabled, loopEnabled, totalSessionMinutes } = timerState;
  const fullCycleDuration = workMinutes + (breaksEnabled ? breakMinutes : 0);

  useEffect(() => {
    if (isOpen) {
      if (initialAddStation) {
        setIsAddingStation(true);
      }
      if (initialSection === 'soundtrack' || initialAddStation) {
        const timer = setTimeout(() => {
          const el = document.getElementById('settings-soundtrack-section');
          if (el && typeof el.scrollIntoView === 'function') {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
          const inputEl = document.getElementById('settings-station-name-input');
          if (inputEl) {
            inputEl.focus();
          }
        }, 120);
        return () => clearTimeout(timer);
      }
    } else {
      setIsAddingStation(false);
    }
  }, [isOpen, initialSection, initialAddStation]);

  const fetchAndSetYouTubeTitle = async (candidateUrl: string, targetField: 'name' | 'url') => {
    const videoId = extractYouTubeId(candidateUrl);
    if (!videoId) return;

    setIsFetchingMeta(true);
    try {
      const meta = await api.getYouTubeMeta(candidateUrl);
      if (meta && meta.title) {
        if (targetField === 'name') {
          setStationName(meta.title);
        } else {
          setStationName((prev) => {
            if (!prev.trim() || isYouTubeUrl(prev) || extractYouTubeId(prev)) {
              return meta.title;
            }
            return prev;
          });
        }
      }
    } catch {
      // If errored just leave it as it is
    } finally {
      setIsFetchingMeta(false);
    }
  };

  const handleTitlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const text = e.clipboardData.getData('text').trim();
    if (isYouTubeUrl(text) || extractYouTubeId(text)) {
      setStationName(text);
      if (!stationUrl.trim()) {
        setStationUrl(text);
      }
      fetchAndSetYouTubeTitle(text, 'name');
    }
  };

  const handleUrlPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const text = e.clipboardData.getData('text').trim();
    if (isYouTubeUrl(text) || extractYouTubeId(text)) {
      setStationUrl(text);
      fetchAndSetYouTubeTitle(text, 'url');
    }
  };

  const handleTitleChange = (val: string) => {
    setStationName(val);
    const trimmed = val.trim();
    if (isYouTubeUrl(trimmed) || extractYouTubeId(trimmed)) {
      if (!stationUrl.trim()) {
        setStationUrl(trimmed);
      }
      fetchAndSetYouTubeTitle(trimmed, 'name');
    }
  };

  const handleUrlChange = (val: string) => {
    setStationUrl(val);
    const trimmed = val.trim();
    if (isYouTubeUrl(trimmed) || extractYouTubeId(trimmed)) {
      if (!stationName.trim() || isYouTubeUrl(stationName) || extractYouTubeId(stationName)) {
        fetchAndSetYouTubeTitle(trimmed, 'url');
      }
    }
  };

  const handleAddStationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stationName.trim() || !stationUrl.trim()) return;

    try {
      setIsSubmittingStation(true);
      await onAddStation({
        name: stationName.trim(),
        description: 'Custom station added by user',
        url: stationUrl.trim(),
        genre: stationGenre.trim() || 'custom',
      });
      setStationName('');
      setStationUrl('');
      setIsAddingStation(false);
    } catch (err) {
      console.error('Failed to add station:', err);
    } finally {
      setIsSubmittingStation(false);
    }
  };

  return (
    <CalmDialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          setIsAddingStation(false);
          onClose();
        }
      }}
      title="Settings & Preferences"
      description="Customize timer rhythms, page color themes, soundtracks, and ambient atmosphere."
      maxWidthClassName="max-w-2xl"
    >
      <div className="space-y-8 pt-1 pb-2 text-[var(--text-main)]">
        {/* SECTION 1: PAGE COLOR PALETTES & APPEARANCE */}
        <section className="space-y-4 pb-7 border-b border-[var(--border-hairline)]">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-[var(--ink-wash)] text-[var(--accent-main)]">
              <Palette className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-main)]">
                Color Palettes & Theme
              </h3>
              <p className="text-[11px] text-[var(--text-muted)]">
                Select your soothing color environment and dark/light contrast
              </p>
            </div>
          </div>

          <ThemeSelector
            currentTheme={currentTheme}
            onSelectTheme={onSelectTheme}
            colorMode={colorMode}
            onToggleColorMode={onToggleColorMode}
            variant="expanded"
          />
        </section>

        {/* SECTION 2: TIMER DURATION & INTERVALS */}
        <section className="space-y-4 pb-7 border-b border-[var(--border-hairline)]">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-[var(--ink-wash)] text-[var(--accent-main)]">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-main)]">
                Timer Intervals & Rhythms
              </h3>
              <p className="text-[11px] text-[var(--text-muted)]">
                Choose a proven focus preset or customize exact work, break, and loop settings
              </p>
            </div>
          </div>

          {/* Quick Preset Buttons */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
            {QUICK_PRESETS.map((preset) => {
              const isActive =
                workMinutes === preset.work &&
                breakMinutes === preset.brk &&
                breaksEnabled === (preset.breaks ? 1 : 0);
              return (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() =>
                    onConfigureTimer({
                      workMinutes: preset.work,
                      breakMinutes: preset.brk,
                      breaksEnabled: preset.breaks,
                    })
                  }
                  className={`p-3 rounded-2xl border text-left transition-all ${
                    isActive
                      ? 'border-[var(--accent-main)] bg-[var(--ink-wash-strong)] ring-2 ring-[var(--accent-main)]/30 shadow-sm'
                      : 'border-[var(--border-hairline)] bg-[var(--ink-wash)] hover:bg-[var(--ink-wash-strong)]'
                  }`}
                >
                  <p className="font-mono text-sm font-semibold text-[var(--text-main)]">
                    {preset.label}
                  </p>
                  <p className="text-[10px] text-[var(--text-faint)] mt-0.5 truncate">
                    {preset.desc}
                  </p>
                </button>
              );
            })}
          </div>

          {/* Granular Duration Controls */}
          <div className="space-y-3 pt-2">
            {/* Focus Duration */}
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[var(--ink-wash)] border border-[var(--border-hairline)]">
              <div>
                <span className="text-xs font-medium text-[var(--text-main)]">Focus Session Duration</span>
                <p className="text-[10px] text-[var(--text-faint)]">Deep study blocks</p>
              </div>
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => onConfigureTimer({ workMinutes: Math.max(1, workMinutes - 5) })}
                  className="w-7 h-7 flex items-center justify-center rounded-full bg-[var(--bg-canvas)] border border-[var(--border-hairline)] hover:bg-[var(--ink-wash-strong)] text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors"
                  aria-label="Decrease focus minutes"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="font-mono text-xs w-11 text-center font-semibold">
                  {workMinutes}m
                </span>
                <button
                  type="button"
                  onClick={() => onConfigureTimer({ workMinutes: Math.min(240, workMinutes + 5) })}
                  className="w-7 h-7 flex items-center justify-center rounded-full bg-[var(--bg-canvas)] border border-[var(--border-hairline)] hover:bg-[var(--ink-wash-strong)] text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors"
                  aria-label="Increase focus minutes"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Breaks Toggle & Duration */}
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[var(--ink-wash)] border border-[var(--border-hairline)]">
              <div className="flex items-center gap-2">
                <CalmSwitch
                  id="settings-breaks-toggle"
                  checked={breaksEnabled}
                  onCheckedChange={(checked) => onConfigureTimer({ breaksEnabled: checked })}
                  label="Rest Breaks"
                />
              </div>
              {breaksEnabled && (
                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => onConfigureTimer({ breakMinutes: Math.max(1, breakMinutes - 1) })}
                    className="w-7 h-7 flex items-center justify-center rounded-full bg-[var(--bg-canvas)] border border-[var(--border-hairline)] hover:bg-[var(--ink-wash-strong)] text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors"
                    aria-label="Decrease break minutes"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="font-mono text-xs w-11 text-center font-semibold">
                    {breakMinutes}m
                  </span>
                  <button
                    type="button"
                    onClick={() => onConfigureTimer({ breakMinutes: Math.min(90, breakMinutes + 1) })}
                    className="w-7 h-7 flex items-center justify-center rounded-full bg-[var(--bg-canvas)] border border-[var(--border-hairline)] hover:bg-[var(--ink-wash-strong)] text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors"
                    aria-label="Increase break minutes"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Loop Mode & Total Session Duration */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
            {/* Loop Toggle */}
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[var(--ink-wash)] border border-[var(--border-hairline)]">
              <div>
                <div className="flex items-center gap-2">
                  <CalmSwitch
                    id="settings-loop-toggle"
                    checked={loopEnabled}
                    onCheckedChange={(checked) => onConfigureTimer({ loopEnabled: checked })}
                    label="Loop Sessions"
                  />
                </div>
                <p className="text-[10px] text-[var(--text-faint)] mt-1">
                  {loopEnabled ? 'Auto-cycle focus & breaks' : 'Stop after total duration'}
                </p>
              </div>
              <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-[var(--bg-canvas)] text-[var(--accent-main)] border border-[var(--border-hairline)]">
                {loopEnabled ? 'Loop ON' : 'Fixed'}
              </span>
            </div>

            {/* Total Duration (Required if loop is off) */}
            {!loopEnabled ? (
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[var(--ink-wash)] border border-[var(--accent-main)]/40 ring-1 ring-[var(--accent-main)]/20">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-medium text-[var(--text-main)]">Total Duration</span>
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-semibold uppercase bg-[var(--accent-main)]/15 text-[var(--accent-main)]">
                      Required
                    </span>
                  </div>
                  <p className="text-[10px] text-[var(--text-faint)] mt-0.5">
                    Default: {fullCycleDuration}m (1 full cycle)
                  </p>
                </div>
                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() =>
                      onConfigureTimer({
                        totalSessionMinutes: Math.max(1, totalSessionMinutes - 5),
                      })
                    }
                    className="w-7 h-7 flex items-center justify-center rounded-full bg-[var(--bg-canvas)] border border-[var(--border-hairline)] hover:bg-[var(--ink-wash-strong)] text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors"
                    aria-label="Decrease total duration"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="font-mono text-xs w-11 text-center font-semibold">
                    {totalSessionMinutes}m
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      onConfigureTimer({
                        totalSessionMinutes: Math.min(1440, totalSessionMinutes + 5),
                      })
                    }
                    className="w-7 h-7 flex items-center justify-center rounded-full bg-[var(--bg-canvas)] border border-[var(--border-hairline)] hover:bg-[var(--ink-wash-strong)] text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors"
                    aria-label="Increase total duration"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="hidden sm:flex items-center justify-between p-3.5 rounded-2xl bg-[var(--ink-wash)]/40 border border-[var(--border-hairline)] opacity-60">
                <div>
                  <span className="text-xs font-medium text-[var(--text-faint)]">Total Duration</span>
                  <p className="text-[10px] text-[var(--text-faint)]">Active only when loop is off</p>
                </div>
                <span className="text-[10px] font-mono text-[var(--text-faint)]">Unlimited (Looping)</span>
              </div>
            )}
          </div>
        </section>

        {/* SECTION 3: SOUNDTRACK RADIO STATIONS & VOLUME */}
        <section id="settings-soundtrack-section" className="space-y-4 pb-7 border-b border-[var(--border-hairline)] scroll-mt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-[var(--ink-wash)] text-[var(--accent-main)]">
                <Music className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-main)]">
                  Soundtrack Station
                </h3>
                <p className="text-[11px] text-[var(--text-muted)]">
                  Continuous focus audio stream synced with your active timer
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsAddingStation((v) => !v)}
              className="text-xs font-medium text-[var(--accent-main)] hover:underline inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg hover:bg-[var(--ink-wash)] transition-colors cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>{isAddingStation ? 'Cancel' : 'Add custom URL'}</span>
            </button>
          </div>

          {/* Add custom station form */}
          {isAddingStation && (
            <form onSubmit={handleAddStationSubmit} className="p-4 rounded-2xl bg-[var(--ink-wash)] border border-[var(--border-hairline)] space-y-3">
              <div>
                <label className="block text-[11px] font-medium text-[var(--text-muted)] mb-1 flex items-center justify-between">
                  <span>Station Title</span>
                  {isFetchingMeta && (
                    <span className="inline-flex items-center gap-1 text-[10px] text-[var(--accent-main)]">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Fetching YouTube title...
                    </span>
                  )}
                </label>
                <input
                  id="settings-station-name-input"
                  type="text"
                  placeholder="e.g. My Study Beats"
                  value={stationName}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  onPaste={handleTitlePaste}
                  className="w-full text-xs px-3.5 py-2 rounded-xl bg-[var(--bg-canvas)] border border-[var(--border-hairline)] text-[var(--text-main)] placeholder-[var(--text-faint)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-main)]"
                  required
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-[var(--text-muted)] mb-1">YouTube URL or Stream Address</label>
                <input
                  type="text"
                  placeholder="https://music.youtube.com/... or https://www.youtube.com/watch?v=..."
                  value={stationUrl}
                  onChange={(e) => handleUrlChange(e.target.value)}
                  onPaste={handleUrlPaste}
                  className="w-full text-xs px-3.5 py-2 rounded-xl bg-[var(--bg-canvas)] border border-[var(--border-hairline)] text-[var(--text-main)] placeholder-[var(--text-faint)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-main)]"
                  required
                />
              </div>
              <div className="flex justify-end gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => setIsAddingStation(false)}
                  className="px-3 py-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--text-main)] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingStation}
                  className="px-4 py-1.5 rounded-xl bg-[var(--accent-main)] text-[var(--accent-fg)] text-xs font-medium hover:bg-[var(--accent-hover)] disabled:opacity-50 transition-colors shadow-sm cursor-pointer"
                >
                  {isSubmittingStation ? 'Adding...' : 'Save Station'}
                </button>
              </div>
            </form>
          )}

          {/* Stations list */}
          <div className="space-y-2">
            {stations.map((st) => {
              const isSelected = st.id === currentStationId;
              return (
                <div
                  key={st.id}
                  onClick={() => onSelectStation(st.id)}
                  className={`flex items-center justify-between p-3.5 rounded-2xl text-xs cursor-pointer transition-all border ${
                    isSelected
                      ? 'border-[var(--accent-main)] bg-[var(--ink-wash-strong)] ring-2 ring-[var(--accent-main)]/30 text-[var(--text-main)] shadow-sm'
                      : 'border-[var(--border-hairline)] bg-[var(--ink-wash)] hover:bg-[var(--ink-wash-strong)] text-[var(--text-muted)]'
                  }`}
                >
                  <div className="min-w-0 pr-3">
                    <div className="flex items-center gap-2">
                      <p className={`font-semibold text-xs truncate ${isSelected ? 'text-[var(--text-main)]' : ''}`}>
                        {st.name}
                      </p>
                      {st.is_curated ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-[var(--accent-main)]/15 text-[var(--accent-main)]">
                          Default
                        </span>
                      ) : null}
                    </div>
                    <p className="text-[11px] text-[var(--text-faint)] truncate mt-0.5">
                      {st.genre} · {st.stream_type || 'stream'}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {onDeleteStation && !st.is_curated && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteStation(st.id);
                        }}
                        className="p-1.5 text-[var(--text-faint)] hover:text-red-500 rounded-lg hover:bg-red-500/10 transition-colors"
                        title="Delete station"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Volume Control */}
          <div className="flex items-center gap-3 pt-2">
            <Volume2 className="w-4 h-4 text-[var(--text-muted)] shrink-0" />
            <div className="flex-1">
              <CalmSlider
                value={radioVolume}
                min={0}
                max={1}
                step={0.02}
                onChange={onRadioVolumeChange}
                ariaLabel="Soundtrack volume"
              />
            </div>
            <span className="text-xs font-mono text-[var(--text-muted)] w-10 text-right font-medium">
              {Math.round(radioVolume * 100)}%
            </span>
          </div>
        </section>

        {/* SECTION 4: AMBIENT SOUND ATMOSPHERE */}
        <section className="space-y-4">
          <AmbientMixer
            ambientSound={ambientSound}
            ambientVolume={ambientVolume}
            onSoundChange={onAmbientSoundChange}
            onVolumeChange={onAmbientVolumeChange}
          />
        </section>
      </div>
    </CalmDialog>
  );
};
