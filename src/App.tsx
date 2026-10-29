import React, { useState, useEffect } from 'react';
import { Room, RadioStation, StudySession, PlayHistoryItem, DashboardStats, CalmTheme, AmbientSoundType } from './types/index.js';
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

export function App() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [radios, setRadios] = useState<RadioStation[]>([]);
  const [currentStationId, setCurrentStationId] = useState<string | null>(null);

  const [ambientSound, setAmbientSound] = useState<AmbientSoundType>('rain');
  const [ambientVolume, setAmbientVolume] = useState<number>(0.4);
  const [radioVolume, setRadioVolume] = useState<number>(0.75);
  const [currentTheme, setCurrentTheme] = useState<CalmTheme>('sage');

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

  // Apply calm theme to body
  useEffect(() => {
    document.body.className = `theme-${currentTheme}`;
  }, [currentTheme]);

  // Initial load
  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      const [fetchedRooms, fetchedRadios, fetchedSessions, fetchedHistory, fetchedStats] = await Promise.all([
        api.getRooms(),
        api.getRadios(),
        api.getSessions(),
        api.getHistory(),
        api.getStats(),
      ]);

      setRooms(fetchedRooms);
      setRadios(fetchedRadios);
      setSessions(fetchedSessions);
      setPlayHistory(fetchedHistory);
      setStats(fetchedStats);

      // Initialize with first room if none selected
      if (fetchedRooms.length > 0 && !activeRoomId) {
        applyRoomVibe(fetchedRooms[0]);
      }
    } catch (err) {
      console.error('Error loading initial data:', err);
    }
  };

  const applyRoomVibe = (room: Room) => {
    setActiveRoomId(room.id);
    setCurrentTheme(room.theme);
    setAmbientSound(room.ambient_sound);
    setAmbientVolume(room.ambient_volume);
    setRadioVolume(room.radio_volume);

    if (room.default_radio_id) {
      setCurrentStationId(room.default_radio_id);
    }

    // Update ambient sound synth
    if (room.ambient_sound !== 'none' && room.ambient_volume > 0) {
      sound.startAmbient(room.ambient_sound, room.ambient_volume);
    } else {
      sound.stopAmbient();
    }
  };

  const handleSelectRoom = (roomId: string) => {
    const room = rooms.find((r) => r.id === roomId);
    if (room) {
      applyRoomVibe(room);
    }
  };

  const handleSaveRoom = async (roomData: Partial<Room>) => {
    if (editingRoom) {
      const updated = await api.updateRoom(editingRoom.id, roomData);
      setRooms((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
      if (activeRoomId === updated.id) {
        applyRoomVibe(updated);
      }
    } else {
      const created = await api.createRoom(roomData as any);
      setRooms((prev) => [...prev, created]);
      applyRoomVibe(created);
    }
    setEditingRoom(null);
  };

  const handleDeleteRoom = async (roomId: string) => {
    await api.deleteRoom(roomId);
    const remaining = rooms.filter((r) => r.id !== roomId);
    setRooms(remaining);
    if (activeRoomId === roomId && remaining.length > 0) {
      applyRoomVibe(remaining[0]);
    }
  };

  const handleAddRadio = async (data: { name: string; description: string; url: string; genre: string }) => {
    const newRadio = await api.createRadio({
      ...data,
      stream_type: 'audio',
    });
    setRadios((prev) => [...prev, newRadio]);
    setCurrentStationId(newRadio.id);
  };

  const refreshSessionsAndStats = async () => {
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
  };

  const activeRoom = rooms.find((r) => r.id === activeRoomId) || rooms[0];
  const activeStation = radios.find((s) => s.id === currentStationId) || radios[0];

  return (
    <div className="min-h-screen flex flex-col font-sans transition-colors duration-300">
      <Header
        currentTheme={currentTheme}
        onSelectTheme={setCurrentTheme}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onEnterZenMode={() => setIsZenModeOpen(true)}
        stats={stats}
      />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-6 space-y-6">
        {/* Room Switcher Chips */}
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

        {activeTab === 'timer' && (
          <div className="space-y-6">
            {/* Center Focus Timer */}
            <Timer
              workMinutes={activeRoom?.timer_work_minutes || 25}
              breakMinutes={activeRoom?.timer_break_minutes || 5}
              activeRoomId={activeRoomId}
              onSessionComplete={refreshSessionsAndStats}
            />

            {/* Audio Controls Grid: Lofi Radio + Ambient Mixer */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <RadioPlayer
                stations={radios}
                currentStationId={currentStationId}
                onSelectStation={setCurrentStationId}
                onOpenAddModal={() => setIsRadioModalOpen(true)}
                radioVolume={radioVolume}
                onVolumeChange={setRadioVolume}
                activeRoomId={activeRoomId}
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

      {/* Footer */}
      <footer className="py-4 border-t border-[var(--border-subtle)] text-center text-xs text-[var(--text-muted)]">
        <p>Studinty • Calm study sanctuary • Stored locally in SQLite</p>
      </footer>

      {/* Modals */}
      <RoomModal
        isOpen={isRoomModalOpen}
        onClose={() => setIsRoomModalOpen(false)}
        onSave={handleSaveRoom}
        onDelete={editingRoom ? handleDeleteRoom : undefined}
        editingRoom={editingRoom}
        radios={radios}
      />

      <RadioModal
        isOpen={isRadioModalOpen}
        onClose={() => setIsRadioModalOpen(false)}
        onAddRadio={handleAddRadio}
      />

      {/* Zen Full Screen Mode */}
      <ZenMode
        isOpen={isZenModeOpen}
        onClose={() => setIsZenModeOpen(false)}
        remainingSeconds={activeRoom?.timer_work_minutes ? activeRoom.timer_work_minutes * 60 : 1500}
        totalSeconds={activeRoom?.timer_work_minutes ? activeRoom.timer_work_minutes * 60 : 1500}
        isRunning={false}
        onToggleTimer={() => {}}
        sessionGoal="Distraction Free Study"
        activeStationName={activeStation?.name}
        phase="work"
      />
    </div>
  );
}

export default App;
