import { describe, it, expect, beforeEach } from 'vitest';
import { StudintyDatabase } from '../db.js';

describe('StudintyDatabase', () => {
  let db: StudintyDatabase;

  beforeEach(() => {
    db = new StudintyDatabase(':memory:');
  });

  it('initializes with curated YouTube & Icecast radios and starter rooms', () => {
    const radios = db.getRadios();
    expect(radios.length).toBeGreaterThanOrEqual(6);
    expect(radios.some((r) => r.id === 'radio-yt-lofigirl' && r.stream_type === 'youtube')).toBe(
      true
    );
    expect(radios.some((r) => r.id === 'radio-drone-zone')).toBe(true);

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
    expect(updated?.breaks_enabled).toBe(1);
    expect(updated?.timer_break_minutes).toBe(15);
    expect(updated?.timer_work_minutes).toBe(60);

    const deleted = db.deleteRoom(newRoom.id);
    expect(deleted).toBe(true);
    expect(db.getRoomById(newRoom.id)).toBeNull();
  });

  it('auto-detects YouTube video and live stream links when creating custom radios', () => {
    const ytLive = db.createRadio({
      name: 'Custom Lofi Live',
      description: 'Live stream from YouTube',
      url: 'https://www.youtube.com/live/jfKfPfyJRdk?feature=share',
      genre: 'lofi',
      is_curated: 0,
    });

    expect(ytLive.stream_type).toBe('youtube');
    expect(ytLive.url).toBe('https://www.youtube.com/watch?v=jfKfPfyJRdk');

    const mp3Radio = db.createRadio({
      name: 'My Personal Chill Stream',
      description: 'Custom lofi stream',
      url: 'https://example.com/stream.mp3',
      stream_type: 'audio',
      genre: 'lofi',
      is_curated: 0,
    });

    expect(mp3Radio.stream_type).toBe('audio');
    expect(db.deleteRadio(mp3Radio.id)).toBe(true);
    expect(db.getRadioById(mp3Radio.id)).toBeNull();
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

    const stats = db.getStats();
    expect(stats.completedSessionsCount).toBe(1);
    expect(stats.totalFocusSeconds).toBe(1500);
    expect(stats.todayFocusSeconds).toBe(1500);
    expect(stats.activeStreakDays).toBe(1);
  });

  it('logs play history and updates duration', () => {
    const started = new Date(Date.now() - 600 * 1000).toISOString();
    const record = db.recordPlayHistory({
      radio_id: 'radio-yt-lofigirl',
      radio_name: 'Lofi Girl — Study Beats Live',
      room_id: 'room-midnight-lofi',
      session_id: null,
      duration_seconds: 100,
      started_at: started,
      ended_at: null,
    });

    expect(record.id).toBeDefined();

    const now = new Date().toISOString();
    db.updatePlayHistoryDuration(record.id, 600, now);

    const history = db.getPlayHistory();
    expect(history.length).toBe(1);
    expect(history[0].duration_seconds).toBe(600);
    expect(history[0].ended_at).toBe(now);
  });
});
