import React, { useState, useEffect, useCallback } from 'react';
import {
  Room,
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
import { RoomBar } from './components/RoomBar.js';
import { Timer } from './components/Timer.js';
import { RadioPlayer } from './components/RadioPlayer.js';
import { AmbientMixer } from './components/AmbientMixer.js';
import { SessionsView } from './components/SessionsView.js';
import { HistoryView } from './components/HistoryView.js';
import { RoomModal } from './components/RoomModal.js';
import { RadioModal } from './components/RadioModal.js';
import { ZenMode } from './components/ZenMode.js';
import { sound } from './utils/sound.js';
import { useStudyTimer } from './hooks/useStudyTimer.js';

function getInitialColorMode(): ColorMode {
  if (typeof window === 'undefined') return 'dark';
  const saved = window.localStorage.getItem('studinty-color-mode');
  if (saved === 'light' || saved === 'dark') return saved;
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function App() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [radios, setRadios] = useState<RadioStation[]>([]);
  const [currentStationId, setCurrentStationId] = useState<string | null>(null);

  const [ambientSound, setAmbientSound] = useState<AmbientSoundType>('none');
  const [ambientVolume, setAmbientVolume] = useState<number>(0.35);
  const [radioVolume, setRadioVolume] = useState<number>(0.75);
  const [currentTheme, setCurrentTheme] = useState<CalmTheme>('sage');
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
  const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [isRadioModalOpen, setIsRadioModalOpen] = useState(false);
  const [isZenModeOpen, setIsZenModeOpen] = useState(false);

  const activeRoom = rooms.find((r) => r.id === activeRoomId) || rooms[0] || null;
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
    initialWorkMinutes: activeRoom?.timer_work_minutes ?? 25,
    initialBreakMinutes: activeRoom?.timer_break_minutes ?? 5,
    initialBreaksEnabled: activeRoom ? Boolean(activeRoom.breaks_enabled) : true,
    activeRoomId,
    onSessionSaved: refreshSessionsAndStats,
  });

  // Sync calm theme & dark mode attributes on <html>
  useEffect(() => {
    const html = document.documentElement;
    html.setAttribute('data-theme', currentTheme);
    html.classList.toggle('dark', colorMode === 'dark');
    window.localStorage.setItem('studinty-color-mode', colorMode);
  }, [currentTheme, colorMode]);

  const applyRoomVibe = useCallback(
    (room: Room, options: { fromUserGesture: boolean } = { fromUserGesture: false }) => {
      setActiveRoomId(room.id);
      setCurrentTheme(room.theme);
      setAmbientVolume(room.ambient_volume);
      setRadioVolume(room.radio_volume);

      if (room.default_radio_id) {
        setCurrentStationId(room.default_radio_id);
      }

      if (options.fromUserGesture) {
        setAmbientSound(room.ambient_sound);
        if (room.ambient_sound !== 'none' && room.ambient_volume > 0) {
          sound.startAmbient(room.ambient_sound, room.ambient_volume);
        } else {
          sound.stopAmbient();
        }
      } else {
        // Avoid auto-starting WebAudio before a user gesture
        setAmbientSound('none');
      }
    },
    []
  );

  // Initial load from SQLite API
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [fetchedRooms, fetchedRadios, fetchedSessions, fetchedHistory, fetchedStats] =
          await Promise.all([
            api.getRooms(),
            api.getRadios(),
            api.getSessions(),
            api.getHistory(),
            api.getStats(),
          ]);
        if (!mounted) return;
        setRooms(fetchedRooms);
        setRadios(fetchedRadios);
        setSessions(fetchedSessions);
        setPlayHistory(fetchedHistory);
        setStats(fetchedStats);

        if (fetchedRooms.length > 0) {
          applyRoomVibe(fetchedRooms[0], { fromUserGesture: false });
        } else if (fetchedRadios.length > 0) {
          setCurrentStationId(fetchedRadios[0].id);
        }
      } catch (err) {
        console.error('Error loading initial data:', err);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [applyRoomVibe]);

  const handleSelectTab = (tab: 'timer' | 'sessions' | 'history') => {
    setActiveTab(tab);
    if (tab === 'history') {
      refreshHistory();
    } else if (tab === 'sessions') {
      refreshSessionsAndStats();
    }
  };

  const handleSelectRoom = (roomId: string) => {
    const room = rooms.find((r) => r.id === roomId);
    if (room) {
      applyRoomVibe(room, { fromUserGesture: true });
    }
  };

  const handleSaveRoom = async (roomData: Partial<Room>) => {
    if (editingRoom) {
      const updated = await api.updateRoom(editingRoom.id, roomData);
      setRooms((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
      if (activeRoomId === updated.id) {
        applyRoomVibe(updated, { fromUserGesture: true });
      }
    } else {
      const created = await api.createRoom(roomData as Room);
      setRooms((prev) => [...prev, created]);
      applyRoomVibe(created, { fromUserGesture: true });
    }
    setEditingRoom(null);
  };

  const handleSaveTimerToActiveRoom = async () => {
    if (!activeRoom) return;
    try {
      const updated = await api.updateRoom(activeRoom.id, {
        timer_work_minutes: timerState.workMinutes,
        timer_break_minutes: timerState.breaksEnabled ? timerState.breakMinutes : 0,
        breaks_enabled: timerState.breaksEnabled ? 1 : 0,
        timer_mode: timerState.breaksEnabled ? 'pomodoro' : 'continuous',
      });
      setRooms((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
    } catch (err) {
      console.error('Could not save timer settings to room:', err);
    }
  };

  const handleDeleteRoom = async (roomId: string) => {
    await api.deleteRoom(roomId);
    const remaining = rooms.filter((r) => r.id !== roomId);
    setRooms(remaining);
    if (activeRoomId === roomId && remaining.length > 0) {
      applyRoomVibe(remaining[0], { fromUserGesture: true });
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
    setCurrentStationId(newRadio.id);
  };

  const handleDeleteRadio = async (stationId: string) => {
    await api.deleteRadio(stationId);
    const remaining = radios.filter((s) => s.id !== stationId);
    setRadios(remaining);
    if (currentStationId === stationId && remaining.length > 0) {
      setCurrentStationId(remaining[0].id);
    }
  };

  const hasUnsavedRoomChanges = Boolean(
    activeRoom &&
      (timerState.workMinutes !== activeRoom.timer_work_minutes ||
        timerState.breaksEnabled !== Boolean(activeRoom.breaks_enabled) ||
        (timerState.breaksEnabled && timerState.breakMinutes !== activeRoom.timer_break_minutes))
  );

  const isSessionDimmed = activeTab === 'timer' && timerState.isRunning;

  return (
    <div
      data-focus-active={isSessionDimmed ? 'true' : 'false'}
      className="min-h-screen flex flex-col font-sans bg-[var(--bg-canvas)] text-[var(--text-main)] transition-colors duration-500"
    >
      <Header
        currentTheme={currentTheme}
        onSelectTheme={setCurrentTheme}
        colorMode={colorMode}
        onToggleColorMode={() => setColorMode((m) => (m === 'dark' ? 'light' : 'dark'))}
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
        onEnterZenMode={() => setIsZenModeOpen(true)}
        stats={stats}
      />

      <main className="flex-1 max-w-3xl w-full mx-auto px-5 pb-12 flex flex-col">
        {/* Seamless Room Strip */}
        <div className="pb-4 border-b border-[var(--border-hairline)]">
          <RoomBar
            rooms={rooms}
            activeRoomId={activeRoomId}
            onSelectRoom={handleSelectRoom}
            onOpenCreateModal={() => {
              setEditingRoom(null);
              setIsRoomModalOpen(true);
            }}
            onOpenEditModal={() => {
              setEditingRoom(activeRoom || null);
              setIsRoomModalOpen(true);
            }}
          />
        </div>

        {activeTab === 'timer' && (
          <div className="flex-1 flex flex-col justify-between gap-8 pt-4">
            {/* Centerpiece Focus Timer — stays undimmed while everything else dims */}
            <Timer
              timerState={timerState}
              sessionGoal={sessionGoal}
              onSessionGoalChange={setSessionGoal}
              onToggleTimer={toggleTimer}
              onResetTimer={resetTimer}
              onSkipPhase={skipPhase}
              onConfigureTimer={configureCustomTimer}
              hasUnsavedRoomChanges={hasUnsavedRoomChanges}
              onSaveTimerToRoom={handleSaveTimerToActiveRoom}
            />

            {/* Blended Soundscape Strip — dims smoothly during active session */}
            <div className="focus-dimmable pt-7 border-t border-[var(--border-hairline)] grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-10">
              <RadioPlayer
                stations={radios}
                currentStationId={currentStationId}
                onSelectStation={setCurrentStationId}
                onOpenAddModal={() => setIsRadioModalOpen(true)}
                onDeleteStation={handleDeleteRadio}
                radioVolume={radioVolume}
                onVolumeChange={setRadioVolume}
                activeRoomId={activeRoomId}
                onHistoryUpdated={refreshHistory}
              />

              <AmbientMixer
                ambientSound={ambientSound}
                ambientVolume={ambientVolume}
                onSoundChange={setAmbientSound}
                onVolumeChange={setAmbientVolume}
              />
            </div>
          </div>
        )}

        {activeTab === 'sessions' && (
          <SessionsView sessions={sessions} stats={stats} rooms={rooms} />
        )}

        {activeTab === 'history' && (
          <HistoryView history={playHistory} rooms={rooms} />
        )}
      </main>

      <footer className="focus-dimmable py-5 text-center text-[11px] text-[var(--text-faint)]">
        <span>studinty · local sqlite sanctuary</span>
      </footer>

      <RoomModal
        isOpen={isRoomModalOpen}
        onClose={() => setIsRoomModalOpen(false)}
        onSave={handleSaveRoom}
        onDelete={editingRoom && rooms.length > 1 ? handleDeleteRoom : undefined}
        editingRoom={editingRoom}
        radios={radios}
      />

      <RadioModal
        isOpen={isRadioModalOpen}
        onClose={() => setIsRadioModalOpen(false)}
        onAddRadio={handleAddRadio}
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
