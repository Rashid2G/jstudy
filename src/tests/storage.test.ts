import { describe, it, expect, beforeEach } from 'vitest';
import { LocalStudyStorage } from '../services/storage.js';

describe('LocalStudyStorage Client Storage Engine', () => {
  let storage: LocalStudyStorage;

  beforeEach(() => {
    storage = new LocalStudyStorage();
    storage.resetAll();
  });

  it('initializes with default rooms and curated radios', () => {
    const rooms = storage.getRooms();
    expect(rooms.length).toBeGreaterThanOrEqual(4);
    expect(rooms.some((r) => r.id === 'room-library')).toBe(true);
    expect(rooms.some((r) => r.id === 'room-midnight-lofi')).toBe(true);

    const radios = storage.getRadios();
    expect(radios.length).toBeGreaterThanOrEqual(5);
    expect(radios.some((r) => r.stream_type === 'youtube')).toBe(true);
    expect(radios.some((r) => r.stream_type === 'audio')).toBe(true);
  });

  describe('Rooms Management', () => {
    it('creates, reads, updates, and deletes rooms', () => {
      const created = storage.createRoom({
        name: 'Late Night Flow',
        description: 'Deep uninterrupted session',
        theme: 'dusk',
        timer_work_minutes: 45,
        timer_break_minutes: 0,
        breaks_enabled: 0,
        timer_mode: 'continuous',
      });

      expect(created.id).toBeDefined();
      expect(created.name).toBe('Late Night Flow');
      expect(created.breaks_enabled).toBe(0);
      expect(created.timer_break_minutes).toBe(0);

      const found = storage.getRoomById(created.id);
      expect(found).not.toBeNull();
      expect(found?.name).toBe('Late Night Flow');

      const updated = storage.updateRoom(created.id, {
        name: 'Updated Late Night Flow',
        timer_work_minutes: 50,
        breaks_enabled: 1,
        timer_break_minutes: 10,
      });

      expect(updated.name).toBe('Updated Late Night Flow');
      expect(updated.timer_work_minutes).toBe(50);
      expect(updated.breaks_enabled).toBe(1);
      expect(updated.timer_break_minutes).toBe(10);

      storage.deleteRoom(created.id);
      expect(storage.getRoomById(created.id)).toBeNull();
    });

    it('enforces room constraints and validation', () => {
      expect(() => {
        storage.createRoom({ name: '   ' });
      }).toThrow('Room name is required');

      const room = storage.createRoom({
        name: 'Test Bounds',
        timer_work_minutes: 9999,
        timer_break_minutes: -10,
        breaks_enabled: 1,
      });

      expect(room.timer_work_minutes).toBe(240);
      expect(room.timer_break_minutes).toBe(1);
    });
  });

  describe('Radio Stations Management', () => {
    it('creates and auto-detects YouTube live streams and videos', () => {
      const ytRadio = storage.createRadio({
        name: 'Custom Lofi Live',
        url: 'https://www.youtube.com/watch?v=jfKfPfyJRdk',
        genre: 'lofi',
      });

      expect(ytRadio.stream_type).toBe('youtube');
      expect(ytRadio.url).toContain('jfKfPfyJRdk');

      const directAudio = storage.createRadio({
        name: 'Icecast Stream',
        url: 'https://ice1.somafm.com/groovesalad-128-mp3',
        genre: 'ambient',
      });

      expect(directAudio.stream_type).toBe('audio');
    });

    it('deletes custom radios', () => {
      const custom = storage.createRadio({
        name: 'Temporary Stream',
        url: 'https://stream.example.com/audio.mp3',
      });

      const beforeCount = storage.getRadios().length;
      storage.deleteRadio(custom.id);
      const afterCount = storage.getRadios().length;
      expect(afterCount).toBe(beforeCount - 1);
    });
  });

  describe('Sessions and Streak Statistics', () => {
    it('records study sessions and computes dashboard statistics', () => {
      const now = new Date();
      const startedAt = now.toISOString();
      const endedAt = new Date(now.getTime() + 25 * 60 * 1000).toISOString();

      const session = storage.createSession({
        title: 'Quantum Mechanics Problem Set',
        category: 'Physics',
        target_duration_seconds: 1500,
        actual_duration_seconds: 1500,
        completed: true,
        started_at: startedAt,
        ended_at: endedAt,
      });

      expect(session.id).toBeDefined();
      expect(session.completed).toBe(1);
      expect(session.actual_duration_seconds).toBe(1500);

      const stats = storage.getStats();
      expect(stats.totalFocusSeconds).toBeGreaterThanOrEqual(1500);
      expect(stats.completedSessionsCount).toBeGreaterThanOrEqual(1);
      expect(stats.todayFocusSeconds).toBeGreaterThanOrEqual(1500);
      expect(stats.activeStreakDays).toBe(1);
    });

    it('tracks play history and updates duration', () => {
      const item = storage.recordPlayStart({
        radio_id: 'radio-drone-zone',
        radio_name: 'SomaFM Drone Zone',
        started_at: new Date().toISOString(),
      });

      expect(item.id).toBeDefined();
      expect(item.duration_seconds).toBe(0);

      storage.updatePlayEnd(item.id, 420);
      const history = storage.getHistory();
      const found = history.find((h) => h.id === item.id);
      expect(found).toBeDefined();
      expect(found?.duration_seconds).toBe(420);
      expect(found?.ended_at).not.toBeNull();
    });
  });

  describe('Backup and Restore', () => {
    it('exports and restores JSON backups accurately', () => {
      storage.createRoom({ name: 'Backup Test Room' });
      const json = storage.exportBackup();
      expect(json).toContain('Backup Test Room');

      storage.resetAll();
      expect(storage.getRooms().some((r) => r.name === 'Backup Test Room')).toBe(false);

      const success = storage.restoreBackup(json);
      expect(success).toBe(true);
      expect(storage.getRooms().some((r) => r.name === 'Backup Test Room')).toBe(true);
    });
  });
});
