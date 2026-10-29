import { describe, it, expect, beforeEach } from 'vitest';
import { StudintyDatabase } from '../db.js';

describe('StudintyDatabase', () => {
  let db: StudintyDatabase;

  beforeEach(() => {
    db = new StudintyDatabase(':memory:');
  });

  it('initializes with curated default YouTube radio and starter rooms', () => {
    const radios = db.getRadios();
    expect(radios.length).toBeGreaterThanOrEqual(1);
    expect(radios.some((r) => r.id === 'radio-yt-lofigirl' && r.stream_type === 'youtube')).toBe(
      true
    );

    const rooms = db.getRooms();
    expect(rooms.length).toBeGreaterThanOrEqual(4);
    expect(rooms.some((r) => r.name === 'Silent Library Hall')).toBe(true);
    expect(rooms.some((r) => r.breaks_enabled === 0)).toBe(true);
  });

  it('creates, reads, updates, and deletes rooms including no-break custom sessions', () => {
    const newRoom = db.createRoom({
      name: 'Organic Chem Marathon',
      description: 'Continuous deep focus with no breaks',
      theme: 'sage',
      timer_work_minutes: 75,
      timer_break_minutes: 0,
      breaks_enabled: 0,
      timer_mode: 'continuous',
      default_radio_id: 'radio-yt-lofigirl',
      ambient_sound: 'rain',
      ambient_volume: 0.5,
      radio_volume: 0.8,
    });

    expect(newRoom.id).toBeDefined();
    expect(newRoom.name).toBe('Organic Chem Marathon');
    expect(newRoom.timer_work_minutes).toBe(75);
    expect(newRoom.breaks_enabled).toBe(0);
    expect(newRoom.timer_break_minutes).toBe(0);

    const updated = db.updateRoom(newRoom.id, {
      breaks_enabled: 1,
      timer_break_minutes: 15,
      timer_work_minutes: 60,
    });

    expect(updated).not.toBeNull();
    expect(updated?.breaks_enabled).toBe(1);
    expect(updated?.timer_break_minutes).toBe(15);
    expect(updated?.timer_work_minutes).toBe(60);

    const deleted = db.deleteRoom(newRoom.id);
    expect(deleted).toBe(true);
    expect(db.getRoomById(newRoom.id)).toBeNull();
  });

  it('auto-detects YouTube video and live stream links when creating custom radios', () => {
    const custom = db.createRadio({
      name: 'Custom Ambient Study',
      description: 'Deep calm soundscape',
      url: 'https://www.youtube.com/watch?v=0sfDth4lMLc',
      genre: 'ambient',
      is_curated: 0,
    });

    expect(custom.id).toBeDefined();
    expect(custom.stream_type).toBe('youtube');
    expect(custom.url).toBe('https://www.youtube.com/watch?v=0sfDth4lMLc');

    const retrieved = db.getRadioById(custom.id);
    expect(retrieved?.name).toBe('Custom Ambient Study');

    const deleted = db.deleteRadio(custom.id);
    expect(deleted).toBe(true);
    expect(db.getRadioById(custom.id)).toBeNull();
  });

  it('records study sessions and computes stats', () => {
    const now = new Date();
    const start = new Date(now.getTime() - 25 * 60 * 1000).toISOString();
    const end = now.toISOString();

    const session = db.createSession({
      room_id: null,
      title: 'Algorithms & Data Structures',
      category: 'Computer Science',
      target_duration_seconds: 1500,
      actual_duration_seconds: 1500,
      completed: 1,
      started_at: start,
      ended_at: end,
      notes: 'Reviewed graph search & binary trees',
    });

    expect(session.id).toBeDefined();
    expect(session.completed).toBe(1);

    const stats = db.getStats();
    expect(stats.completedSessionsCount).toBe(1);
    expect(stats.totalFocusSeconds).toBe(1500);
    expect(stats.activeStreakDays).toBe(1);
  });

  it('logs play history and updates duration', () => {
    const startedAt = new Date().toISOString();
    const entry = db.recordPlayHistory({
      radio_id: 'radio-yt-lofigirl',
      radio_name: 'lofi hip hop radio 📚 beats to relax/study to',
      room_id: null,
      session_id: null,
      duration_seconds: 0,
      started_at: startedAt,
      ended_at: null,
    });

    expect(entry.id).toBeDefined();

    const endedAt = new Date().toISOString();
    db.updatePlayHistoryDuration(entry.id, 900, endedAt);

    const history = db.getPlayHistory();
    const updated = history.find((h) => h.id === entry.id);
    expect(updated?.duration_seconds).toBe(900);
    expect(updated?.ended_at).toBe(endedAt);
  });
});
