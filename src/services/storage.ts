import {
  Room,
  RadioStation,
  StudySession,
  PlayHistoryItem,
  DashboardStats,
  YouTubeMetadata,
} from '../types/index.js';
import { detectStreamType, extractYouTubeId, normalizeYouTubeUrl } from '../utils/youtube.js';

const STORAGE_KEYS = {
  ROOMS: 'studinty_rooms_v2',
  RADIOS: 'studinty_radios_v2',
  SESSIONS: 'studinty_sessions_v2',
  HISTORY: 'studinty_history_v2',
};

// In-memory fallback if localStorage is disabled or running in headless/Node test environment
class MemoryStorageShim implements Storage {
  private store = new Map<string, string>();
  get length(): number {
    return this.store.size;
  }
  clear(): void {
    this.store.clear();
  }
  getItem(key: string): string | null {
    return this.store.has(key) ? this.store.get(key)! : null;
  }
  key(index: number): string | null {
    return Array.from(this.store.keys())[index] || null;
  }
  removeItem(key: string): void {
    this.store.delete(key);
  }
  setItem(key: string, value: string): void {
    this.store.set(key, String(value));
  }
}

function getSafeStorage(): Storage {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const testKey = '__studinty_test__';
      window.localStorage.setItem(testKey, '1');
      window.localStorage.removeItem(testKey);
      return window.localStorage;
    }
  } catch {
    // LocalStorage blocked by security policy or not available
  }
  return new MemoryStorageShim();
}

export const defaultCuratedRadios: Omit<RadioStation, 'created_at'>[] = [
  {
    id: 'radio-yt-lofigirl',
    name: 'Lofi Girl — Study Beats Live',
    description: '24/7 lofi hip hop radio — beats to relax/study to (audio-only stream).',
    url: 'https://www.youtube.com/watch?v=jfKfPfyJRdk',
    stream_type: 'youtube',
    genre: 'lofi live',
    is_curated: 1,
  },
  {
    id: 'radio-yt-chillhop',
    name: 'Chillhop Radio — Study & Relax Live',
    description: 'Mellow jazzy & lofi hip hop beats 24/7 live stream.',
    url: 'https://www.youtube.com/watch?v=5yx6BWlEVcY',
    stream_type: 'youtube',
    genre: 'chillhop live',
    is_curated: 1,
  },
  {
    id: 'radio-yt-synthwave',
    name: 'Lofi Synthwave — Chill Cyber Beats',
    description: 'Retro futuristic chill synthwave stream for coding and deep work.',
    url: 'https://www.youtube.com/watch?v=4xDzrJKXOOY',
    stream_type: 'youtube',
    genre: 'synthwave',
    is_curated: 1,
  },
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
    description: 'Atmospheric minimalist ambient textures for deep reading.',
    url: 'https://ice1.somafm.com/dronezone-128-mp3',
    stream_type: 'audio',
    genre: 'drone',
    is_curated: 1,
  },
  {
    id: 'radio-nightwave',
    name: 'Nightwave Plaza',
    description: 'Late-night vaporwave and mellow synth lofi radio.',
    url: 'https://radio.plaza.one/mp3',
    stream_type: 'audio',
    genre: 'vaporwave',
    is_curated: 1,
  },
  {
    id: 'radio-synth-rain',
    name: 'Rain & Ambient Synthesis',
    description: 'Procedurally generated gentle rain sounds via Web Audio.',
    url: 'ambient:rain',
    stream_type: 'ambient',
    genre: 'nature',
    is_curated: 1,
  },
];

export const defaultStarterRooms: Omit<Room, 'created_at' | 'updated_at'>[] = [
  {
    id: 'room-library',
    name: 'Silent Library Hall',
    description: 'Deep immersion, muted distractions, and gentle rain on stone windows.',
    theme: 'sage',
    timer_work_minutes: 50,
    timer_break_minutes: 10,
    breaks_enabled: 1,
    timer_mode: 'pomodoro',
    default_radio_id: 'radio-drone-zone',
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
    default_radio_id: 'radio-yt-chillhop',
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
    default_radio_id: 'radio-groove-salad',
    ambient_sound: 'waves',
    ambient_volume: 0.25,
    radio_volume: 0.7,
  },
];

export class LocalStudyStorage {
  private storage: Storage;

  constructor(customStorage?: Storage) {
    this.storage = customStorage || getSafeStorage();
    this.initDefaults();
  }

  private read<T>(key: string, defaultValue: T): T {
    try {
      const raw = this.storage.getItem(key);
      if (!raw) return defaultValue;
      return JSON.parse(raw) as T;
    } catch {
      return defaultValue;
    }
  }

  private write<T>(key: string, value: T): void {
    try {
      this.storage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.warn(`LocalStorage write failed for key "${key}":`, e);
    }
  }

  initDefaults(): void {
    const existingRooms = this.read<Room[]>(STORAGE_KEYS.ROOMS, []);
    if (!existingRooms || existingRooms.length === 0) {
      const now = new Date().toISOString();
      const seeded: Room[] = defaultStarterRooms.map((r) => ({
        ...r,
        created_at: now,
        updated_at: now,
      }));
      this.write(STORAGE_KEYS.ROOMS, seeded);
    }

    const existingRadios = this.read<RadioStation[]>(STORAGE_KEYS.RADIOS, []);
    if (!existingRadios || existingRadios.length === 0) {
      const now = new Date().toISOString();
      const seeded: RadioStation[] = defaultCuratedRadios.map((r) => ({
        ...r,
        created_at: now,
      }));
      this.write(STORAGE_KEYS.RADIOS, seeded);
    }
  }

  // --- Rooms ---
  getRooms(): Room[] {
    const rooms = this.read<Room[]>(STORAGE_KEYS.ROOMS, []);
    return rooms.sort((a, b) => (a.created_at || '').localeCompare(b.created_at || ''));
  }

  getRoomById(id: string): Room | null {
    return this.getRooms().find((r) => r.id === id) || null;
  }

  createRoom(data: Partial<Omit<Room, 'id' | 'created_at' | 'updated_at'>> & { name: string }): Room {
    const trimmedName = (data.name || '').trim();
    if (!trimmedName) {
      throw new Error('Room name is required');
    }

    const breaksEnabled = data.breaks_enabled !== undefined ? (data.breaks_enabled ? 1 : 0) : 1;
    const workMinutes = Math.max(1, Math.min(240, Number(data.timer_work_minutes ?? 25)));
    const breakMinutes = breaksEnabled
      ? Math.max(1, Math.min(90, Number(data.timer_break_minutes ?? 5)))
      : Math.max(0, Math.min(90, Number(data.timer_break_minutes ?? 0)));

    const now = new Date().toISOString();
    const id = `room-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    const newRoom: Room = {
      id,
      name: trimmedName,
      description: data.description || '',
      theme: data.theme || 'sage',
      timer_work_minutes: workMinutes,
      timer_break_minutes: breakMinutes,
      breaks_enabled: breaksEnabled,
      timer_mode: data.timer_mode || (breaksEnabled ? 'pomodoro' : 'continuous'),
      default_radio_id: data.default_radio_id ?? null,
      ambient_sound: data.ambient_sound || 'none',
      ambient_volume: typeof data.ambient_volume === 'number' ? data.ambient_volume : 0.35,
      radio_volume: typeof data.radio_volume === 'number' ? data.radio_volume : 0.75,
      created_at: now,
      updated_at: now,
    };

    const rooms = this.getRooms();
    rooms.push(newRoom);
    this.write(STORAGE_KEYS.ROOMS, rooms);
    return newRoom;
  }

  updateRoom(id: string, data: Partial<Omit<Room, 'id' | 'created_at' | 'updated_at'>>): Room {
    const rooms = this.getRooms();
    const index = rooms.findIndex((r) => r.id === id);
    if (index === -1) {
      throw new Error(`Room not found: ${id}`);
    }

    const current = rooms[index];
    const breaksEnabled =
      data.breaks_enabled !== undefined
        ? data.breaks_enabled
          ? 1
          : 0
        : current.breaks_enabled;

    let workMinutes = current.timer_work_minutes;
    if (data.timer_work_minutes !== undefined) {
      workMinutes = Math.max(1, Math.min(240, Number(data.timer_work_minutes)));
    }

    let breakMinutes = current.timer_break_minutes;
    if (data.timer_break_minutes !== undefined) {
      breakMinutes = breaksEnabled
        ? Math.max(1, Math.min(90, Number(data.timer_break_minutes)))
        : Math.max(0, Math.min(90, Number(data.timer_break_minutes)));
    } else if (!breaksEnabled) {
      breakMinutes = 0;
    }

    const updated: Room = {
      ...current,
      ...data,
      name: data.name !== undefined ? data.name.trim() || current.name : current.name,
      timer_work_minutes: workMinutes,
      timer_break_minutes: breakMinutes,
      breaks_enabled: breaksEnabled,
      timer_mode:
        data.timer_mode || (breaksEnabled ? current.timer_mode : 'continuous'),
      updated_at: new Date().toISOString(),
    };

    rooms[index] = updated;
    this.write(STORAGE_KEYS.ROOMS, rooms);
    return updated;
  }

  deleteRoom(id: string): void {
    const rooms = this.getRooms().filter((r) => r.id !== id);
    this.write(STORAGE_KEYS.ROOMS, rooms);
  }

  // --- Radios ---
  getRadios(): RadioStation[] {
    const radios = this.read<RadioStation[]>(STORAGE_KEYS.RADIOS, []);
    return radios.sort((a, b) => (b.is_curated || 0) - (a.is_curated || 0));
  }

  createRadio(data: {
    name: string;
    description?: string;
    url: string;
    stream_type?: string;
    genre?: string;
  }): RadioStation {
    const name = (data.name || '').trim();
    const url = (data.url || '').trim();
    if (!name || !url) {
      throw new Error('Radio station name and stream URL are required');
    }

    const detectedType = detectStreamType(url);
    const finalType = (data.stream_type as any) || detectedType;
    const normalizedUrl = finalType === 'youtube' ? normalizeYouTubeUrl(url) : url;

    const id = `radio-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const newStation: RadioStation = {
      id,
      name,
      description: data.description || '',
      url: normalizedUrl,
      stream_type: finalType,
      genre: data.genre || 'custom',
      is_curated: 0,
      created_at: new Date().toISOString(),
    };

    const radios = this.getRadios();
    radios.push(newStation);
    this.write(STORAGE_KEYS.RADIOS, radios);
    return newStation;
  }

  deleteRadio(id: string): void {
    const radios = this.getRadios().filter((r) => r.id !== id);
    this.write(STORAGE_KEYS.RADIOS, radios);
  }

  // --- Study Sessions ---
  getSessions(limit = 50): StudySession[] {
    const sessions = this.read<StudySession[]>(STORAGE_KEYS.SESSIONS, []);
    return sessions
      .sort((a, b) => (b.started_at || '').localeCompare(a.started_at || ''))
      .slice(0, limit);
  }

  createSession(data: {
    room_id?: string | null;
    title: string;
    category?: string;
    target_duration_seconds: number;
    actual_duration_seconds: number;
    completed: boolean | number;
    started_at: string;
    ended_at: string;
    notes?: string | null;
  }): StudySession {
    const id = `session-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const newSession: StudySession = {
      id,
      room_id: data.room_id ?? null,
      title: data.title || 'Focus Session',
      category: data.category || 'general',
      target_duration_seconds: Number(data.target_duration_seconds || 0),
      actual_duration_seconds: Math.max(0, Number(data.actual_duration_seconds || 0)),
      completed: data.completed ? 1 : 0,
      started_at: data.started_at,
      ended_at: data.ended_at,
      notes: data.notes ?? null,
    };

    const sessions = this.read<StudySession[]>(STORAGE_KEYS.SESSIONS, []);
    sessions.push(newSession);
    this.write(STORAGE_KEYS.SESSIONS, sessions);
    return newSession;
  }

  // --- Play History ---
  getHistory(limit = 50): PlayHistoryItem[] {
    const history = this.read<PlayHistoryItem[]>(STORAGE_KEYS.HISTORY, []);
    return history
      .sort((a, b) => (b.started_at || '').localeCompare(a.started_at || ''))
      .slice(0, limit);
  }

  recordPlayStart(data: {
    radio_id: string;
    radio_name: string;
    room_id?: string | null;
    session_id?: string | null;
    started_at: string;
  }): PlayHistoryItem {
    const id = `hist-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const item: PlayHistoryItem = {
      id,
      radio_id: data.radio_id,
      radio_name: data.radio_name,
      room_id: data.room_id ?? null,
      session_id: data.session_id ?? null,
      duration_seconds: 0,
      started_at: data.started_at,
      ended_at: null,
    };

    const history = this.read<PlayHistoryItem[]>(STORAGE_KEYS.HISTORY, []);
    history.push(item);
    this.write(STORAGE_KEYS.HISTORY, history);
    return item;
  }

  updatePlayEnd(id: string, durationSeconds: number): void {
    const history = this.read<PlayHistoryItem[]>(STORAGE_KEYS.HISTORY, []);
    const index = history.findIndex((h) => h.id === id);
    if (index !== -1) {
      history[index].duration_seconds = Math.max(0, durationSeconds);
      history[index].ended_at = new Date().toISOString();
      this.write(STORAGE_KEYS.HISTORY, history);
    }
  }

  // --- Dashboard Stats ---
  getStats(): DashboardStats {
    const sessions = this.read<StudySession[]>(STORAGE_KEYS.SESSIONS, []);

    let totalFocusSeconds = 0;
    let completedSessionsCount = 0;
    let todayFocusSeconds = 0;

    const todayStr = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD
    const completedDaysSet = new Set<string>();

    for (const s of sessions) {
      totalFocusSeconds += s.actual_duration_seconds || 0;
      if (s.completed) {
        completedSessionsCount += 1;
        if (s.started_at) {
          const sDate = new Date(s.started_at).toLocaleDateString('en-CA');
          completedDaysSet.add(sDate);
        }
      }

      if (s.started_at) {
        const sDate = new Date(s.started_at).toLocaleDateString('en-CA');
        if (sDate === todayStr) {
          todayFocusSeconds += s.actual_duration_seconds || 0;
        }
      }
    }

    // Compute active consecutive daily streak
    let streakDays = 0;
    const checkDate = new Date();

    // Check if user completed something today or yesterday
    const checkStr = checkDate.toLocaleDateString('en-CA');
    if (completedDaysSet.has(checkStr)) {
      streakDays += 1;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      // Check if streak was maintained yesterday
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toLocaleDateString('en-CA');
      if (completedDaysSet.has(yesterdayStr)) {
        checkDate.setDate(checkDate.getDate() - 1);
      }
    }

    while (streakDays > 0) {
      const prevStr = checkDate.toLocaleDateString('en-CA');
      if (completedDaysSet.has(prevStr)) {
        streakDays += 1;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    return {
      totalFocusSeconds,
      completedSessionsCount,
      activeStreakDays: streakDays,
      todayFocusSeconds,
    };
  }

  // --- YouTube Metadata Client Fetch ---
  async getYouTubeMeta(url: string): Promise<YouTubeMetadata> {
    const videoId = extractYouTubeId(url);
    if (!videoId) {
      throw new Error('Invalid YouTube video or stream link');
    }

    // Try noembed (CORS enabled)
    try {
      const res = await fetch(`https://noembed.com/embed?url=https://www.youtube.com/watch?v=${videoId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.title) {
          return {
            videoId,
            title: data.title,
            author: data.author_name || 'YouTube',
          };
        }
      }
    } catch {
      // Fallback
    }

    // Try youtube oembed directly
    try {
      const res = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`);
      if (res.ok) {
        const data = await res.json();
        if (data.title) {
          return {
            videoId,
            title: data.title,
            author: data.author_name || 'YouTube',
          };
        }
      }
    } catch {
      // Fallback
    }

    return {
      videoId,
      title: `YouTube Audio (${videoId})`,
      author: 'YouTube',
    };
  }

  // --- Data Export & Reset ---
  exportBackup(): string {
    return JSON.stringify({
      version: 1,
      exportedAt: new Date().toISOString(),
      rooms: this.getRooms(),
      radios: this.getRadios(),
      sessions: this.getSessions(1000),
      history: this.getHistory(1000),
    }, null, 2);
  }

  restoreBackup(jsonString: string): boolean {
    try {
      const data = JSON.parse(jsonString);
      if (Array.isArray(data.rooms)) this.write(STORAGE_KEYS.ROOMS, data.rooms);
      if (Array.isArray(data.radios)) this.write(STORAGE_KEYS.RADIOS, data.radios);
      if (Array.isArray(data.sessions)) this.write(STORAGE_KEYS.SESSIONS, data.sessions);
      if (Array.isArray(data.history)) this.write(STORAGE_KEYS.HISTORY, data.history);
      return true;
    } catch (e) {
      console.error('Failed to restore backup:', e);
      return false;
    }
  }

  resetAll(): void {
    this.storage.removeItem(STORAGE_KEYS.ROOMS);
    this.storage.removeItem(STORAGE_KEYS.RADIOS);
    this.storage.removeItem(STORAGE_KEYS.SESSIONS);
    this.storage.removeItem(STORAGE_KEYS.HISTORY);
    this.initDefaults();
  }
}

export const localStudyStorage = new LocalStudyStorage();
