import { DatabaseSync } from 'node:sqlite';
import { Room, RadioStation, StudySession, PlayHistoryItem, DashboardStats } from '../src/types/index.js';
import { detectStreamType, isYouTubeUrl, normalizeYouTubeUrl } from '../src/utils/youtube.js';
import crypto from 'node:crypto';

export class StudintyDatabase {
  public db: DatabaseSync;

  constructor(dbPath: string = 'studinty.db') {
    this.db = new DatabaseSync(dbPath);
    if (dbPath !== ':memory:') {
      this.db.exec('PRAGMA journal_mode = WAL; PRAGMA busy_timeout = 5000;');
    }
    this.init();
  }

  private init() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS rooms (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT NOT NULL DEFAULT '',
        theme TEXT NOT NULL DEFAULT 'sage',
        timer_work_minutes INTEGER NOT NULL DEFAULT 25,
        timer_break_minutes INTEGER NOT NULL DEFAULT 5,
        breaks_enabled INTEGER NOT NULL DEFAULT 1,
        timer_mode TEXT NOT NULL DEFAULT 'pomodoro',
        default_radio_id TEXT,
        ambient_sound TEXT NOT NULL DEFAULT 'rain',
        ambient_volume REAL NOT NULL DEFAULT 0.4,
        radio_volume REAL NOT NULL DEFAULT 0.7,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS radios (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT NOT NULL DEFAULT '',
        url TEXT NOT NULL,
        stream_type TEXT NOT NULL DEFAULT 'audio',
        genre TEXT NOT NULL DEFAULT 'lofi',
        is_curated INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        room_id TEXT,
        title TEXT NOT NULL,
        category TEXT NOT NULL DEFAULT 'Study',
        target_duration_seconds INTEGER NOT NULL,
        actual_duration_seconds INTEGER NOT NULL,
        completed INTEGER NOT NULL DEFAULT 1,
        started_at TEXT NOT NULL,
        ended_at TEXT NOT NULL,
        notes TEXT,
        FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE SET NULL
      );

      CREATE TABLE IF NOT EXISTS play_history (
        id TEXT PRIMARY KEY,
        radio_id TEXT NOT NULL,
        radio_name TEXT NOT NULL,
        room_id TEXT,
        session_id TEXT,
        duration_seconds INTEGER NOT NULL DEFAULT 0,
        started_at TEXT NOT NULL,
        ended_at TEXT,
        FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE SET NULL,
        FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE SET NULL
      );

      CREATE INDEX IF NOT EXISTS idx_sessions_started_at ON sessions(started_at);
      CREATE INDEX IF NOT EXISTS idx_play_history_started_at ON play_history(started_at);
      CREATE INDEX IF NOT EXISTS idx_sessions_room_id ON sessions(room_id);
    `);

    const roomCols = this.db.prepare('PRAGMA table_info(rooms)').all() as { name: string }[];
    if (!roomCols.some((c) => c.name === 'breaks_enabled')) {
      this.db.exec('ALTER TABLE rooms ADD COLUMN breaks_enabled INTEGER NOT NULL DEFAULT 1;');
    }

    this.seedDefaults();
  }

  private seedDefaults() {
    const curatedRadios: Omit<RadioStation, 'created_at'>[] = [
      {
        id: 'radio-yt-lofigirl',
        name: 'lofi hip hop radio 📚 beats to relax/study to',
        description: 'lofi hip hop radio 📚 beats to relax/study to (Lofi Girl).',
        url: 'https://www.youtube.com/watch?v=rFZHOHl-L8A',
        stream_type: 'youtube',
        genre: 'lofi live',
        is_curated: 1,
      },
    ];

    const upsertCuratedRadio = this.db.prepare(`
      INSERT INTO radios (id, name, description, url, stream_type, genre, is_curated, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        description = excluded.description,
        url = excluded.url,
        stream_type = excluded.stream_type,
        genre = excluded.genre
      WHERE radios.is_curated = 1
    `);

    const now = new Date().toISOString();
    // Enforce that only the default radio station exists, removing all others
    this.db.prepare('DELETE FROM radios WHERE id != ?').run(curatedRadios[0].id);
    upsertCuratedRadio.run(
      curatedRadios[0].id,
      curatedRadios[0].name,
      curatedRadios[0].description,
      curatedRadios[0].url,
      curatedRadios[0].stream_type,
      curatedRadios[0].genre,
      curatedRadios[0].is_curated,
      now
    );

    // Update rooms to use the default radio station
    this.db.prepare("UPDATE rooms SET default_radio_id = 'radio-yt-lofigirl'").run();

    const roomCountRow = this.db.prepare('SELECT COUNT(*) as count FROM rooms').get() as { count: number | bigint };
    const roomCount = Number(roomCountRow.count);

    if (roomCount === 0) {
      const defaultRooms: Omit<Room, 'created_at' | 'updated_at'>[] = [
        {
          id: 'room-library',
          name: 'Silent Library Hall',
          description: 'Deep immersion, muted distractions, and gentle rain on stone windows.',
          theme: 'sage',
          timer_work_minutes: 50,
          timer_break_minutes: 10,
          breaks_enabled: 1,
          timer_mode: 'pomodoro',
          default_radio_id: 'radio-yt-lofigirl',
          ambient_sound: 'rain',
          ambient_volume: 0.35,
          radio_volume: 0.7,
        },
        {
          id: 'room-midnight-lofi',
          name: 'Midnight Study Desk',
          description: 'Warm night vibes with cozy hearth sounds and Lofi Girl live beats.',
          theme: 'dusk',
          timer_work_minutes: 25,
          timer_break_minutes: 5,
          breaks_enabled: 1,
          timer_mode: 'pomodoro',
          default_radio_id: 'radio-yt-lofigirl',
          ambient_sound: 'fireplace',
          ambient_volume: 0.3,
          radio_volume: 0.7,
        },
        {
          id: 'room-coffee-flow',
          name: 'Corner Cafe Nook',
          description: 'Warm oat tones, coffee shop ambiance, and uninterrupted 45-min flow.',
          theme: 'sand',
          timer_work_minutes: 45,
          timer_break_minutes: 0,
          breaks_enabled: 0,
          timer_mode: 'continuous',
          default_radio_id: 'radio-yt-lofigirl',
          ambient_sound: 'cafe',
          ambient_volume: 0.35,
          radio_volume: 0.75,
        },
        {
          id: 'room-nordic-zen',
          name: 'Nordic Clean Focus',
          description: 'Minimalist slate aesthetics for math, thesis writing, and heavy problem solving.',
          theme: 'slate',
          timer_work_minutes: 60,
          timer_break_minutes: 10,
          breaks_enabled: 1,
          timer_mode: 'custom',
          default_radio_id: 'radio-yt-lofigirl',
          ambient_sound: 'waves',
          ambient_volume: 0.25,
          radio_volume: 0.7,
        },
      ];

      const insertRoom = this.db.prepare(`
        INSERT INTO rooms (
          id, name, description, theme, timer_work_minutes, timer_break_minutes,
          breaks_enabled, timer_mode, default_radio_id, ambient_sound, ambient_volume, radio_volume,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      for (const r of defaultRooms) {
        insertRoom.run(
          r.id,
          r.name,
          r.description,
          r.theme,
          r.timer_work_minutes,
          r.timer_break_minutes,
          r.breaks_enabled,
          r.timer_mode,
          r.default_radio_id,
          r.ambient_sound,
          r.ambient_volume,
          r.radio_volume,
          now,
          now
        );
      }
    }
  }

  // --- Rooms ---
  getRooms(): Room[] {
    return this.db.prepare('SELECT * FROM rooms ORDER BY created_at ASC').all() as unknown as Room[];
  }

  getRoomById(id: string): Room | null {
    const row = this.db.prepare('SELECT * FROM rooms WHERE id = ?').get(id);
    return (row as unknown as Room) || null;
  }

  createRoom(data: Partial<Omit<Room, 'id' | 'created_at' | 'updated_at'>> & { name: string }): Room {
    const id = `room-${crypto.randomUUID()}`;
    const now = new Date().toISOString();
    const breaksEnabled = data.breaks_enabled !== undefined ? (data.breaks_enabled ? 1 : 0) : 1;
    const workMins = Math.max(1, Math.min(240, Number(data.timer_work_minutes ?? 25)));
    const breakMins = breaksEnabled
      ? Math.max(1, Math.min(90, Number(data.timer_break_minutes ?? 5)))
      : Math.max(0, Math.min(90, Number(data.timer_break_minutes ?? 0)));

    this.db.prepare(`
      INSERT INTO rooms (
        id, name, description, theme, timer_work_minutes, timer_break_minutes,
        breaks_enabled, timer_mode, default_radio_id, ambient_sound, ambient_volume, radio_volume,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      data.name,
      data.description || '',
      data.theme || 'sage',
      workMins,
      breakMins,
      breaksEnabled,
      data.timer_mode || (breaksEnabled ? 'pomodoro' : 'continuous'),
      data.default_radio_id ?? null,
      data.ambient_sound || 'none',
      data.ambient_volume ?? 0.4,
      data.radio_volume ?? 0.75,
      now,
      now
    );

    return this.getRoomById(id)!;
  }

  updateRoom(id: string, data: Partial<Omit<Room, 'id' | 'created_at' | 'updated_at'>>): Room | null {
    const current = this.getRoomById(id);
    if (!current) return null;

    const breaksEnabled =
      data.breaks_enabled !== undefined ? (data.breaks_enabled ? 1 : 0) : current.breaks_enabled;

    const workMins =
      data.timer_work_minutes !== undefined
        ? Math.max(1, Math.min(240, Number(data.timer_work_minutes)))
        : current.timer_work_minutes;

    const breakMins =
      data.timer_break_minutes !== undefined
        ? Math.max(breaksEnabled ? 1 : 0, Math.min(90, Number(data.timer_break_minutes)))
        : current.timer_break_minutes;

    const updated = {
      ...current,
      ...data,
      timer_work_minutes: workMins,
      timer_break_minutes: breakMins,
      breaks_enabled: breaksEnabled,
      updated_at: new Date().toISOString(),
    };

    this.db.prepare(`
      UPDATE rooms SET
        name = ?, description = ?, theme = ?, timer_work_minutes = ?,
        timer_break_minutes = ?, breaks_enabled = ?, timer_mode = ?, default_radio_id = ?,
        ambient_sound = ?, ambient_volume = ?, radio_volume = ?, updated_at = ?
      WHERE id = ?
    `).run(
      updated.name,
      updated.description,
      updated.theme,
      updated.timer_work_minutes,
      updated.timer_break_minutes,
      updated.breaks_enabled,
      updated.timer_mode,
      updated.default_radio_id,
      updated.ambient_sound,
      updated.ambient_volume,
      updated.radio_volume,
      updated.updated_at,
      id
    );

    return this.getRoomById(id);
  }

  deleteRoom(id: string): boolean {
    const result = this.db.prepare('DELETE FROM rooms WHERE id = ?').run(id);
    return Number(result.changes) > 0;
  }

  // --- Radios ---
  getRadios(): RadioStation[] {
    return this.db.prepare('SELECT * FROM radios ORDER BY is_curated DESC, created_at ASC').all() as unknown as RadioStation[];
  }

  getRadioById(id: string): RadioStation | null {
    const row = this.db.prepare('SELECT * FROM radios WHERE id = ?').get(id);
    return (row as unknown as RadioStation) || null;
  }

  createRadio(data: Omit<RadioStation, 'id' | 'created_at' | 'stream_type'> & { stream_type?: RadioStation['stream_type'] }): RadioStation {
    const id = `radio-${crypto.randomUUID()}`;
    const now = new Date().toISOString();
    const rawUrl = data.url.trim();
    const detectedType = detectStreamType(rawUrl);
    const streamType = detectedType === 'youtube' ? 'youtube' : (data.stream_type || detectedType);
    const finalUrl = isYouTubeUrl(rawUrl) ? normalizeYouTubeUrl(rawUrl) : rawUrl;

    this.db.prepare(`
      INSERT INTO radios (id, name, description, url, stream_type, genre, is_curated, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      data.name,
      data.description || '',
      finalUrl,
      streamType,
      data.genre || 'lofi',
      data.is_curated ?? 0,
      now
    );

    return this.getRadioById(id)!;
  }

  deleteRadio(id: string): boolean {
    const radio = this.getRadioById(id);
    if (!radio) return false;
    const result = this.db.prepare('DELETE FROM radios WHERE id = ?').run(id);
    return Number(result.changes) > 0;
  }

  // --- Sessions ---
  getSessions(limit = 50): StudySession[] {
    return this.db.prepare('SELECT * FROM sessions ORDER BY started_at DESC LIMIT ?').all(limit) as unknown as StudySession[];
  }

  createSession(data: Omit<StudySession, 'id'>): StudySession {
    const id = `session-${crypto.randomUUID()}`;
    this.db.prepare(`
      INSERT INTO sessions (
        id, room_id, title, category, target_duration_seconds,
        actual_duration_seconds, completed, started_at, ended_at, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      data.room_id || null,
      data.title || 'Focus Session',
      data.category || 'Study',
      data.target_duration_seconds,
      data.actual_duration_seconds,
      data.completed ? 1 : 0,
      data.started_at,
      data.ended_at,
      data.notes || null
    );

    const row = this.db.prepare('SELECT * FROM sessions WHERE id = ?').get(id);
    return row as unknown as StudySession;
  }

  // --- Play History ---
  getPlayHistory(limit = 50): PlayHistoryItem[] {
    return this.db.prepare('SELECT * FROM play_history ORDER BY started_at DESC LIMIT ?').all(limit) as unknown as PlayHistoryItem[];
  }

  recordPlayHistory(data: Omit<PlayHistoryItem, 'id'>): PlayHistoryItem {
    const id = `history-${crypto.randomUUID()}`;
    this.db.prepare(`
      INSERT INTO play_history (
        id, radio_id, radio_name, room_id, session_id, duration_seconds, started_at, ended_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      data.radio_id,
      data.radio_name,
      data.room_id || null,
      data.session_id || null,
      data.duration_seconds || 0,
      data.started_at,
      data.ended_at || null
    );

    const row = this.db.prepare('SELECT * FROM play_history WHERE id = ?').get(id);
    return row as unknown as PlayHistoryItem;
  }

  updatePlayHistoryDuration(id: string, durationSeconds: number, endedAt: string): void {
    this.db.prepare(`
      UPDATE play_history SET
        duration_seconds = ?,
        ended_at = ?
      WHERE id = ?
    `).run(durationSeconds, endedAt, id);
  }

  // --- Dashboard Stats ---
  getStats(): DashboardStats {
    const totalRow = this.db.prepare(`
      SELECT
        COALESCE(SUM(actual_duration_seconds), 0) as totalFocusSeconds,
        COUNT(CASE WHEN completed = 1 THEN 1 END) as completedSessionsCount
      FROM sessions
    `).get() as { totalFocusSeconds: number | bigint; completedSessionsCount: number | bigint };

    const todayStr = new Date().toLocaleDateString('en-CA');
    const todayRow = this.db.prepare(`
      SELECT COALESCE(SUM(actual_duration_seconds), 0) as todayFocusSeconds
      FROM sessions
      WHERE substr(started_at, 1, 10) = ?
    `).get(todayStr) as { todayFocusSeconds: number | bigint };

    const sessionDays = this.db.prepare(`
      SELECT DISTINCT substr(started_at, 1, 10) as day
      FROM sessions
      WHERE completed = 1
      ORDER BY day DESC
    `).all() as { day: string }[];

    let activeStreak = 0;
    const checkDate = new Date();
    const uniqueDays = new Set(sessionDays.map((d) => d.day));

    // Check if streak active from today or yesterday
    const todayFormatted = checkDate.toLocaleDateString('en-CA');
    if (uniqueDays.has(todayFormatted)) {
      activeStreak += 1;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayFormatted = yesterday.toLocaleDateString('en-CA');
      if (uniqueDays.has(yesterdayFormatted)) {
        checkDate.setDate(checkDate.getDate() - 1);
      }
    }

    while (activeStreak > 0) {
      const curFormatted = checkDate.toLocaleDateString('en-CA');
      if (uniqueDays.has(curFormatted)) {
        activeStreak += 1;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    return {
      totalFocusSeconds: Number(totalRow.totalFocusSeconds),
      completedSessionsCount: Number(totalRow.completedSessionsCount),
      activeStreakDays: activeStreak,
      todayFocusSeconds: Number(todayRow.todayFocusSeconds),
    };
  }
}
