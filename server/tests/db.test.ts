import { describe, it, expect, beforeEach } from 'vitest';
import { StudintyDatabase } from '../db.js';

describe('StudintyDatabase', () => {
  let db: StudintyDatabase;

  beforeEach(() => {
    // Use in-memory SQLite database for test isolation
    db = new StudintyDatabase(':memory:');
  });

  it('initializes with curated radios and starter rooms', () => {
    const radios = db.getRadios();
    expect(radios.length).toBeGreaterThanOrEqual(4);
    expect(radios.some(r => r.id === 'radio-drone-zone')).toBe(true);

    const rooms = db.getRooms();
    expect(rooms.length).toBeGreaterThanOrEqual(4);
    expect(rooms.some(r => r.name === 'Silent Library Hall')).toBe(true);
  });

  it('creates, reads, updates, and deletes rooms', () => {
    const newRoom = db.createRoom({
      name: 'Organic Chem Marathon',
      description: 'Focusing on reaction mechanisms',
      theme: 'sage',
      timer_work_minutes: 40,
      timer_break_minutes: 10,
      timer_mode: 'pomodoro',
      default_radio_id: 'radio-drone-zone',
      ambient_sound: 'rain',
      ambient_volume: 0.6,
      radio_volume: 0.8,
    });

    expect(newRoom.id).toBeDefined();
    expect(newRoom.name).toBe('Organic Chem Marathon');
    expect(newRoom.timer_work_minutes).toBe(40);

    const retrieved = db.getRoomById(newRoom.id);
    expect(retrieved).not.toBeNull();
    expect(retrieved?.name).toBe('Organic Chem Marathon');

    const updated = db.updateRoom(newRoom.id, {
      timer_work_minutes: 45,
      ambient_volume: 0.7,
    });
    expect(updated?.timer_work_minutes).toBe(45);
    expect(updated?.ambient_volume).toBe(0.7);

    const deleted = db.deleteRoom(newRoom.id);
    expect(deleted).toBe(true);
    expect(db.getRoomById(newRoom.id)).toBeNull();
  });

  it('creates and deletes custom radio stations', () => {
    const customRadio = db.createRadio({
      name: 'My Personal Chill Stream',
      description: 'Custom lofi stream',
      url: 'https://example.com/stream.mp3',
      stream_type: 'audio',
      genre: 'lofi',
      is_curated: 0,
    });

    expect(customRadio.id).toBeDefined();
    expect(customRadio.is_curated).toBe(0);

    const radios = db.getRadios();
    expect(radios.some(r => r.id === customRadio.id)).toBe(true);

    const deleted = db.deleteRadio(customRadio.id);
    expect(deleted).toBe(true);
    expect(db.getRadioById(customRadio.id)).toBeNull();
  });

  it('records study sessions and computes stats', () => {
    const started = new Date(Date.now() - 30 * 60 * 1000).toISOString();
    const ended = new Date().toISOString();

    const session = db.createSession({
      room_id: 'room-library',
      title: 'Linear Algebra Problem Set',
      category: 'Math',
      target_duration_seconds: 1500,
      actual_duration_seconds: 1500,
      completed: 1,
      started_at: started,
      ended_at: ended,
      notes: 'Solved 10 eigen decomposition questions.',
    });

    expect(session.id).toBeDefined();
    expect(session.title).toBe('Linear Algebra Problem Set');

    const sessions = db.getSessions();
    expect(sessions.length).toBe(1);
    expect(sessions[0].notes).toBe('Solved 10 eigen decomposition questions.');

    const stats = db.getStats();
    expect(stats.completedSessionsCount).toBe(1);
    expect(stats.totalFocusSeconds).toBe(1500);
    expect(stats.todayFocusSeconds).toBe(1500);
    expect(stats.activeStreakDays).toBe(1);
  });

  it('logs play history and updates duration', () => {
    const started = new Date(Date.now() - 600 * 1000).toISOString();
    const record = db.recordPlayHistory({
      radio_id: 'radio-drone-zone',
      radio_name: 'SomaFM Drone Zone',
      room_id: 'room-library',
      session_id: null,
      duration_seconds: 100,
      started_at: started,
      ended_at: null,
    });

    expect(record.id).toBeDefined();
    expect(record.radio_name).toBe('SomaFM Drone Zone');

    const now = new Date().toISOString();
    db.updatePlayHistoryDuration(record.id, 600, now);

    const history = db.getPlayHistory();
    expect(history.length).toBe(1);
    expect(history[0].duration_seconds).toBe(600);
    expect(history[0].ended_at).toBe(now);
  });
});
