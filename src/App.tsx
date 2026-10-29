import React, { useState, useEffect, useCallback } from 'react';
import {
  RadioStation,
  StudySession,
  PlayHistoryItem,
  DashboardStats,
  CalmTheme,
  ColorMode,
  AmbientSoundType,
} from './types/index.js';
import { api } from './services/api.js';
import { Header } from './components/Header.js';
import { Timer } from './components/Timer.js';
import { AppleWidgetsShelf } from './components/widgets/AppleWidgetsShelf.js';
import { SessionsView } from './components/SessionsView.js';
import { HistoryView } from './components/HistoryView.js';
import { SettingsModal } from './components/SettingsModal.js';
import { SoundtrackEngine } from './components/SoundtrackEngine.js';
import { ZenMode } from './components/ZenMode.js';
import { useStudyTimer } from './hooks/useStudyTimer.js';

function getInitialColorMode(): ColorMode {
  if (typeof window === 'undefined') return 'dark';
  const saved = window.localStorage.getItem('studinty-color-mode');
  if (saved === 'light' || saved === 'dark') return saved;
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function getInitialTheme(): CalmTheme {
  if (typeof window === 'undefined') return 'sage';
  const saved = window.localStorage.getItem('studinty-theme') as CalmTheme;
  if (['sage', 'sand', 'slate', 'dusk', 'nordic'].includes(saved)) return saved;
  return 'sage';
}

function getInitialSoundtrackEnabled(): boolean {
  if (typeof window === 'undefined') return true;
  const saved = window.localStorage.getItem('studinty-soundtrack-enabled');
  return saved !== null ? saved === 'true' : true;
}

function getInitialRadioVolume(): number {
  if (typeof window === 'undefined') return 0.75;
  const saved = window.localStorage.getItem('studinty-radio-volume');
  const parsed = saved ? parseFloat(saved) : 0.75;
  return Number.isFinite(parsed) ? Math.max(0, Math.min(1, parsed)) : 0.75;
}

function getInitialAmbientSound(): AmbientSoundType {
  if (typeof window === 'undefined') return 'none';
  const saved = window.localStorage.getItem('studinty-ambient-sound') as AmbientSoundType;
  if (['none', 'rain', 'fireplace', 'cafe', 'waves', 'whitenoise'].includes(saved)) return saved;
  return 'none';
}

function getInitialAmbientVolume(): number {
  if (typeof window === 'undefined') return 0.35;
  const saved = window.localStorage.getItem('studinty-ambient-volume');
  const parsed = saved ? parseFloat(saved) : 0.35;
  return Number.isFinite(parsed) ? Math.max(0, Math.min(1, parsed)) : 0.35;
}

export function App() {
  const [radios, setRadios] = useState<RadioStation[]>([]);
  const [currentStationId, setCurrentStationId] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    return window.localStorage.getItem('studinty-station-id');
  });

  const [soundtrackEnabled, setSoundtrackEnabled] = useState<boolean>(getInitialSoundtrackEnabled);
  const [radioVolume, setRadioVolume] = useState<number>(getInitialRadioVolume);
  const [ambientSound, setAmbientSound] = useState<AmbientSoundType>(getInitialAmbientSound);
  const [ambientVolume, setAmbientVolume] = useState<number>(getInitialAmbientVolume);

  const [currentTheme, setCurrentTheme] = useState<CalmTheme>(getInitialTheme);
  const [colorMode, setColorMode] = useState<ColorMode>(getInitialColorMode);

  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [playHistory, setPlayHistory] = useState<PlayHistoryItem[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalFocusSeconds: 0,
    completedSessionsCount: 0,
    activeStreakDays: 0,
    todayFocusSeconds: 0,
  });

  const [activeTab, setActiveTab] = useState<'timer' | 'sessions' | 'history'>('timer');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settingsInitialSection, setSettingsInitialSection] = useState<string | null>(null);
  const [settingsInitialAddStation, setSettingsInitialAddStation] = useState(false);
  const [isZenModeOpen, setIsZenModeOpen] = useState(false);

  const handleOpenSettings = useCallback((options?: { section?: string; addStation?: boolean }) => {
    setSettingsInitialSection(options?.section || null);
    setSettingsInitialAddStation(Boolean(options?.addStation));
    setIsSettingsOpen(true);
  }, []);

  const handleCloseSettings = useCallback(() => {
    setIsSettingsOpen(false);
    setSettingsInitialSection(null);
    setSettingsInitialAddStation(false);
  }, []);

  const activeStation = radios.find((s) => s.id === currentStationId) || radios[0];

  const refreshSessionsAndStats = useCallback(async () => {
    try {
      const [fetchedSessions, fetchedStats] = await Promise.all([
        api.getSessions(),
        api.getStats(),
      ]);
      setSessions(fetchedSessions);
      setStats(fetchedStats);
    } catch (err) {
      console.error(err);
    }
  }, []);

  const refreshHistory = useCallback(async () => {
    try {
      const fetchedHistory = await api.getHistory();
      setPlayHistory(fetchedHistory);
    } catch (err) {
      console.error(err);
    }
  }, []);

  const {
    timerState,
    sessionGoal,
    setSessionGoal,
    toggleTimer,
    resetTimer,
    skipPhase,
    configureCustomTimer,
  } = useStudyTimer({
    onSessionSaved: refreshSessionsAndStats,
  });

  // Sync calm theme & dark mode attributes on <html>
  useEffect(() => {
    const html = document.documentElement;
    html.setAttribute('data-theme', currentTheme);
    html.classList.toggle('dark', colorMode === 'dark');
    window.localStorage.setItem('studinty-color-mode', colorMode);
    window.localStorage.setItem('studinty-theme', currentTheme);
  }, [currentTheme, colorMode]);

  // Persist soundtrackEnabled
  useEffect(() => {
    window.localStorage.setItem('studinty-soundtrack-enabled', String(soundtrackEnabled));
  }, [soundtrackEnabled]);

  const handleToggleSoundtrack = (enabled: boolean) => {
    setSoundtrackEnabled(enabled);
  };

  const handleSelectStation = (stationId: string) => {
    setCurrentStationId(stationId);
    window.localStorage.setItem('studinty-station-id', stationId);
  };

  const handleRadioVolumeChange = (vol: number) => {
    setRadioVolume(vol);
    window.localStorage.setItem('studinty-radio-volume', String(vol));
  };

  const handleAmbientSoundChange = (soundType: AmbientSoundType) => {
    setAmbientSound(soundType);
    window.localStorage.setItem('studinty-ambient-sound', soundType);
  };

  const handleAmbientVolumeChange = (vol: number) => {
    setAmbientVolume(vol);
    window.localStorage.setItem('studinty-ambient-volume', String(vol));
  };

  // Initial data load from API
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [fetchedRadios, fetchedSessions, fetchedHistory, fetchedStats] =
          await Promise.all([
            api.getRadios(),
            api.getSessions(),
            api.getHistory(),
            api.getStats(),
          ]);
        if (!mounted) return;
        setRadios(fetchedRadios);
        setSessions(fetchedSessions);
        setPlayHistory(fetchedHistory);
        setStats(fetchedStats);

        if (fetchedRadios.length > 0) {
          if (!currentStationId || !fetchedRadios.some((s) => s.id === currentStationId)) {
            setCurrentStationId(fetchedRadios[0].id);
            window.localStorage.setItem('studinty-station-id', fetchedRadios[0].id);
          }
        }
      } catch (err) {
        console.error('Error loading initial data:', err);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const handleSelectTab = (tab: 'timer' | 'sessions' | 'history') => {
    setActiveTab(tab);
    if (tab === 'history') {
      refreshHistory();
    } else if (tab === 'sessions') {
      refreshSessionsAndStats();
    }
  };

  const handleAddRadio = async (data: {
    name: string;
    description: string;
    url: string;
    genre: string;
    stream_type?: string;
  }) => {
    const newRadio = await api.createRadio(data);
    setRadios((prev) => [...prev, newRadio]);
    handleSelectStation(newRadio.id);
  };

  const handleDeleteRadio = async (stationId: string) => {
    await api.deleteRadio(stationId);
    const remaining = radios.filter((s) => s.id !== stationId);
    setRadios(remaining);
    if (currentStationId === stationId && remaining.length > 0) {
      handleSelectStation(remaining[0].id);
    }
  };

  const isSessionDimmed = activeTab === 'timer' && timerState.isRunning;

  // Soundtrack playback is strictly synced to timer running AND soundtrack toggle
  const isSoundtrackPlaying = timerState.isRunning && soundtrackEnabled;

  return (
    <div
      data-focus-active={isSessionDimmed ? 'true' : 'false'}
      className="app-shell h-screen max-h-screen flex flex-col font-sans text-[var(--text-main)] transition-colors duration-500 overflow-hidden"
    >
      <Header
        currentTheme={currentTheme}
        onSelectTheme={setCurrentTheme}
        colorMode={colorMode}
        onToggleColorMode={() => setColorMode((m) => (m === 'dark' ? 'light' : 'dark'))}
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
        onEnterZenMode={() => setIsZenModeOpen(true)}
        onOpenSettings={() => handleOpenSettings()}
        stats={stats}
      />

      {/* Main viewport area - Non-scrollable when fitting, smooth internal scroll if needed */}
      <main className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-5 flex flex-col justify-between min-h-0 overflow-y-auto overflow-x-hidden">
        {/* Tab 1: Centerpiece Focus Timer and Apple Style Control Widgets */}
        <div
          className={`w-full flex-1 flex flex-col justify-center items-center py-2 sm:py-3 my-auto ${
            activeTab === 'timer' ? 'flex' : 'hidden'
          }`}
        >
          <Timer
            timerState={timerState}
            sessionGoal={sessionGoal}
            onSessionGoalChange={setSessionGoal}
            onToggleTimer={toggleTimer}
            onResetTimer={resetTimer}
            onSkipPhase={skipPhase}
            soundtrackEnabled={soundtrackEnabled}
            onToggleSoundtrack={handleToggleSoundtrack}
            activeStationName={activeStation?.name}
            onOpenSettings={() => handleOpenSettings()}
          />

          {/* Apple Style Expandable Interactive Widgets */}
          <AppleWidgetsShelf
            timerState={timerState}
            onConfigureTimer={configureCustomTimer}
            stations={radios}
            currentStationId={currentStationId}
            onSelectStation={handleSelectStation}
            isPlaying={isSoundtrackPlaying}
            soundtrackEnabled={soundtrackEnabled}
            onToggleSoundtrack={handleToggleSoundtrack}
            radioVolume={radioVolume}
            onRadioVolumeChange={handleRadioVolumeChange}
            onAddStation={handleAddRadio}
            onOpenAddStation={() => handleOpenSettings({ section: 'soundtrack', addStation: true })}
            onOpenSettings={handleOpenSettings}
            ambientSound={ambientSound}
            ambientVolume={ambientVolume}
            onAmbientSoundChange={handleAmbientSoundChange}
            onAmbientVolumeChange={handleAmbientVolumeChange}
            currentTheme={currentTheme}
            onSelectTheme={setCurrentTheme}
            colorMode={colorMode}
            onToggleColorMode={() => setColorMode((m) => (m === 'dark' ? 'light' : 'dark'))}
          />
        </div>

        {/* Tab 2: Sessions view (internal scroll for list) */}
        <div
          className={`h-full overflow-y-auto py-4 ${
            activeTab === 'sessions' ? 'block' : 'hidden'
          }`}
        >
          <SessionsView sessions={sessions} stats={stats} />
        </div>

        {/* Tab 3: Plays history view (internal scroll for list) */}
        <div
          className={`h-full overflow-y-auto py-4 ${
            activeTab === 'history' ? 'block' : 'hidden'
          }`}
        >
          <HistoryView history={playHistory} />
        </div>
      </main>

      <footer className="focus-dimmable py-3 text-center shrink-0">
        <p className="text-[11px] text-[var(--text-faint)] max-w-md mx-auto mb-2 px-4 leading-relaxed font-light">
          &ldquo;Everything has become fast, distracting, and overwhelming, and the only way to focus these days is to turn the noise down. Achive more, do less.&rdquo;
        </p>
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[var(--ink-wash)] border border-[var(--border-hairline)] text-xs text-[var(--text-muted)] transition-colors shadow-sm">
          <span className="font-medium tracking-wide">Just Study</span>
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-main)] opacity-75" />
          <span className="font-semibold tracking-wider uppercase text-[11px] text-[var(--accent-main)]">By RASHID</span>
        </div>
      </footer>

      {/* Persistent Audio Soundtrack Engine - NEVER unmounted across tabs */}
      <SoundtrackEngine
        stations={radios}
        currentStationId={currentStationId}
        isPlaying={isSoundtrackPlaying}
        radioVolume={radioVolume}
        ambientSound={ambientSound}
        ambientVolume={ambientVolume}
        onHistoryUpdated={refreshHistory}
      />

      {/* Settings Modal (Timer, Color Palettes, Soundtrack, Ambient) */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={handleCloseSettings}
        initialSection={settingsInitialSection}
        initialAddStation={settingsInitialAddStation}
        timerState={timerState}
        onConfigureTimer={configureCustomTimer}
        stations={radios}
        currentStationId={currentStationId}
        onSelectStation={handleSelectStation}
        radioVolume={radioVolume}
        onRadioVolumeChange={handleRadioVolumeChange}
        onAddStation={handleAddRadio}
        onDeleteStation={handleDeleteRadio}
        ambientSound={ambientSound}
        ambientVolume={ambientVolume}
        onAmbientSoundChange={handleAmbientSoundChange}
        onAmbientVolumeChange={handleAmbientVolumeChange}
        currentTheme={currentTheme}
        onSelectTheme={setCurrentTheme}
        colorMode={colorMode}
        onToggleColorMode={() => setColorMode((m) => (m === 'dark' ? 'light' : 'dark'))}
      />

      <ZenMode
        isOpen={isZenModeOpen}
        onClose={() => setIsZenModeOpen(false)}
        remainingSeconds={timerState.remainingSeconds}
        totalSeconds={timerState.totalDurationSeconds}
        isRunning={timerState.isRunning}
        onToggleTimer={toggleTimer}
        sessionGoal={sessionGoal}
        activeStationName={activeStation?.name}
        phase={timerState.phase}
      />
    </div>
  );
}

export default App;
