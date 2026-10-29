import { DatabaseSync } from 'node:sqlite';
import { Room, RadioStation, StudySession, PlayHistoryItem, DashboardStats } from '../src/types/index.js';
import crypto from 'node:crypto';

export class StudintyDatabase {
  public db: DatabaseSync;

  constructor(dbPath: string = 'studinty.db') {
    this.db = new DatabaseSync(dbPath);
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

    this.seedDefaults();
  }

  private seedDefaults() {
    const radioCountRow = this.db.prepare('SELECT COUNT(*) as count FROM radios').get() as { count: number | bigint };
    const radioCount = Number(radioCountRow.count);

    if (radioCount === 0) {
      const defaultRadios: Omit<RadioStation, 'created_at'>[] = [
        {
          id: 'radio-groove-salad',
          name: 'SomaFM Groove Salad',
          description: 'A nicely chilled plate of ambient/downtempo beats and grooves.',
          url: 'https://ice1.somafm.com/groovesalad-128-mp3',
          stream_type: 'audio',
          genre: 'ambient',
          is_curated: 1,
        },
        {
          id: 'radio-drone-zone',
          name: 'SomaFM Drone Zone',
          description: 'Served best chilled, safe with most medications. Atmospheric ambient for deep studying.',
          url: 'https://ice1.somafm.com/dronezone-128-mp3',
          stream_type: 'audio',
          genre: 'drone',
          is_curated: 1,
        },
        {
          id: 'radio-nightwave',
          name: 'Nightwave Plaza',
          description: 'Top-tier vaporwave, future funk and mellow synth lofi radio.',
          url: 'https://radio.plaza.one/mp3',
          stream_type: 'audio',
          genre: 'synthwave',
          is_curated: 1,
        },
        {
          id: 'radio-lush',
          name: 'SomaFM Lush',
          description: 'Sensuous and mellow vocals, mostly female, with an electronic chill influence.',
          url: 'https://ice1.somafm.com/lush-128-mp3',
          stream_type: 'audio',
          genre: 'downtempo',
          is_curated: 1,
        },
        {
          id: 'radio-defcon',
          name: 'SomaFM DEF CON',
          description: 'Music for hacking, coding and high-concentration reading.',
          url: 'https://ice1.somafm.com/defcon-128-mp3',
          stream_type: 'audio',
          genre: 'electronic',
          is_curated: 1,
        },
        {
          id: 'radio-ambient-rain',
          name: 'Pure Rain & Focus Chime',
          description: 'Synthesized gentle rainfall and calming acoustic warmth generated on your device.',
          url: 'ambient:rain',
          stream_type: 'ambient',
          genre: 'nature',
          is_curated: 1,
        },
        {
          id: 'radio-ambient-cafe',
          name: 'Coffee House Chatter',
          description: 'Subtle cup clinks, espresso steam, and distant warm chatter.',
          url: 'ambient:cafe',
          stream_type: 'ambient',
          genre: 'ambient',
          is_curated: 1,
        }
      ];

      const insertRadio = this.db.prepare(`
        INSERT INTO radios (id, name, description, url, stream_type, genre, is_curated, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const now = new Date().toISOString();
      for (const r of defaultRadios) {
        insertRadio.run(r.id, r.name, r.description, r.url, r.stream_type, r.genre, r.is_curated, now);
      }
    }

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
          timer_mode: 'pomodoro',
          default_radio_id: 'radio-drone-zone',
          ambient_sound: 'rain',
          ambient_volume: 0.4,
          radio_volume: 0.75,
        },
        {
          id: 'room-midnight-lofi',
          name: 'Midnight Study Desk',
          description: 'Warm night vibes with cozy hearth sounds and mellow beats.',
          theme: 'dusk',
          timer_work_minutes: 25,
          timer_break_minutes: 5,
          timer_mode: 'pomodoro',
          default_radio_id: 'radio-groove-salad',
          ambient_sound: 'fireplace',
          ambient_volume: 0.35,
          radio_volume: 0.7,
        },
        {
          id: 'room-coffee-flow',
          name: 'Corner Cafe Nook',
          description: 'Warm morning light, light acoustic coffee shop ambiance and quick 30-min bursts.',
          theme: 'sand',
          timer_work_minutes: 30,
          timer_break_minutes: 5,
          timer_mode: 'pomodoro',
          default_radio_id: 'radio-nightwave',
          ambient_sound: 'cafe',
          ambient_volume: 0.4,
          radio_volume: 0.8,
        },
        {
          id: 'room-nordic-zen',
          name: 'Nordic Clean Focus',
          description: 'Ultra minimalist slate aesthetics for math, thesis writing, and heavy problem solving.',
          theme: 'slate',
          timer_work_minutes: 45,
          timer_break_minutes: 15,
          timer_mode: 'pomodoro',
          default_radio_id: 'radio-lush',
          ambient_sound: 'waves',
          ambient_volume: 0.3,
          radio_volume: 0.7,
        }
      ];

      const insertRoom = this.db.prepare(`
        INSERT INTO rooms (
          id, name, description, theme, timer_work_minutes, timer_break_minutes,
          timer_mode, default_radio_id, ambient_sound, ambient_volume, radio_volume,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const now = new Date().toISOString();
      for (const r of defaultRooms) {
        insertRoom.run(
          r.id,
          r.name,
          r.description,
          r.theme,
          r.timer_work_minutes,
          r.timer_break_minutes,
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

  createRoom(data: Omit<Room, 'id' | 'created_at' | 'updated_at'>): Room {
    const id = `room-${crypto.randomUUID()}`;
    const now = new Date().toISOString();
    this.db.prepare(`
      INSERT INTO rooms (
        id, name, description, theme, timer_work_minutes, timer_break_minutes,
        timer_mode, default_radio_id, ambient_sound, ambient_volume, radio_volume,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      data.name,
      data.description || '',
      data.theme || 'sage',
      data.timer_work_minutes || 25,
      data.timer_break_minutes || 5,
      data.timer_mode || 'pomodoro',
      data.default_radio_id || null,
      data.ambient_sound || 'none',
      data.ambient_volume ?? 0.5,
      data.radio_volume ?? 0.8,
      now,
      now
    );

    return this.getRoomById(id)!;
  }

  updateRoom(id: string, data: Partial<Omit<Room, 'id' | 'created_at' | 'updated_at'>>): Room | null {
    const current = this.getRoomById(id);
    if (!current) return null;

    const updated = {
      ...current,
      ...data,
      updated_at: new Date().toISOString()
    };

    this.db.prepare(`
      UPDATE rooms SET
        name = ?, description = ?, theme = ?, timer_work_minutes = ?,
        timer_break_minutes = ?, timer_mode = ?, default_radio_id = ?,
        ambient_sound = ?, ambient_volume = ?, radio_volume = ?, updated_at = ?
      WHERE id = ?
    `).run(
      updated.name,
      updated.description,
      updated.theme,
      updated.timer_work_minutes,
      updated.timer_break_minutes,
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

  createRadio(data: Omit<RadioStation, 'id' | 'created_at'>): RadioStation {
    const id = `radio-${crypto.randomUUID()}`;
    const now = new Date().toISOString();
    this.db.prepare(`
      INSERT INTO radios (id, name, description, url, stream_type, genre, is_curated, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      data.name,
      data.description || '',
      data.url,
      data.stream_type || 'audio',
      data.genre || 'lofi',
      data.is_curated ?? 0,
      now
    );

    return this.getRadioById(id)!;
  }

  deleteRadio(id: string): boolean {
    const radio = this.getRadioById(id);
    if (!radio) return false;
    // Don't delete curated unless user explicitly removes, but allow deleting custom radios
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
      UPDATE play_history SET duration_seconds = ?, ended_at = ? WHERE id = ?
    `).run(durationSeconds, endedAt, id);
  }

  // --- Dashboard Stats ---
  getStats(): DashboardStats {
    const totalRow = this.db.prepare(`
      SELECT
        COALESCE(SUM(actual_duration_seconds), 0) as totalFocusSeconds,
        COUNT(*) as completedSessionsCount
      FROM sessions
      WHERE completed = 1
    `).get() as { totalFocusSeconds: number | bigint; completedSessionsCount: number | bigint };

    const today = new Date().toISOString().slice(0, 10);
    const todayRow = this.db.prepare(`
      SELECT COALESCE(SUM(actual_duration_seconds), 0) as todayFocusSeconds
      FROM sessions
      WHERE completed = 1 AND started_at >= ?
    `).get(`${today}T00:00:00.000Z`) as { todayFocusSeconds: number | bigint };

    // Calculate streak days
    const datesRow = this.db.prepare(`
      SELECT DISTINCT substr(started_at, 1, 10) as study_date
      FROM sessions
      WHERE completed = 1
      ORDER BY study_date DESC
    `).all() as { study_date: string }[];

    let streak = 0;
    if (datesRow.length > 0) {
      const dates = new Set(datesRow.map(d => d.study_date));
      let currentCheck = new Date();
      
      // If no study today, check if yesterday was studied to maintain streak
      const todayStr = currentCheck.toISOString().slice(0, 10);
      if (!dates.has(todayStr)) {
        currentCheck.setDate(currentCheck.getDate() - 1);
      }

      while (true) {
        const checkStr = currentCheck.toISOString().slice(0, 10);
        if (dates.has(checkStr)) {
          streak++;
          currentCheck.setDate(currentCheck.getDate() - 1);
        } else {
          break;
        }
      }
    }

    return {
      totalFocusSeconds: Number(totalRow.totalFocusSeconds),
      completedSessionsCount: Number(totalRow.completedSessionsCount),
      activeStreakDays: streak,
      todayFocusSeconds: Number(todayRow.todayFocusSeconds)
    };
  }
}
