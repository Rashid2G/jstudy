import {
  Room,
  RadioStation,
  StudySession,
  PlayHistoryItem,
  DashboardStats,
  YouTubeMetadata,
  SpotifyMetadata,
} from '../types/index.js';
import { localStudyStorage } from './storage.js';

/**
 * Client-side Storage API Adapter
 *
 * Runs fully locally in the browser with localStorage persistence so that
 * the application is 100% static, fast, private, and hostable on GitHub Pages.
 */
export const api = {
  // --- Rooms ---
  async getRooms(): Promise<Room[]> {
    return Promise.resolve(localStudyStorage.getRooms());
  },

  async createRoom(
    data: Partial<Omit<Room, 'id' | 'created_at' | 'updated_at'>> & { name: string }
  ): Promise<Room> {
    return Promise.resolve(localStudyStorage.createRoom(data));
  },

  async updateRoom(
    id: string,
    data: Partial<Omit<Room, 'id' | 'created_at' | 'updated_at'>>
  ): Promise<Room> {
    return Promise.resolve(localStudyStorage.updateRoom(id, data));
  },

  async deleteRoom(id: string): Promise<void> {
    localStudyStorage.deleteRoom(id);
    return Promise.resolve();
  },

  // --- Radios ---
  async getRadios(): Promise<RadioStation[]> {
    return Promise.resolve(localStudyStorage.getRadios());
  },

  async createRadio(data: {
    name: string;
    description?: string;
    url: string;
    stream_type?: string;
    genre?: string;
  }): Promise<RadioStation> {
    return Promise.resolve(localStudyStorage.createRadio(data));
  },

  async deleteRadio(id: string): Promise<void> {
    localStudyStorage.deleteRadio(id);
    return Promise.resolve();
  },

  // --- YouTube Metadata & Audio Fallback ---
  async getYouTubeMeta(url: string): Promise<YouTubeMetadata> {
    return localStudyStorage.getYouTubeMeta(url);
  },

  // --- Spotify Metadata ---
  async getSpotifyMeta(url: string): Promise<SpotifyMetadata> {
    return localStudyStorage.getSpotifyMeta(url);
  },

  getYouTubeAudioStreamUrl(url: string): string {
    // Pure static deployment: audio plays client-side via YouTube IFrame API
    return url;
  },

  // --- Study Sessions ---
  async getSessions(limit = 50): Promise<StudySession[]> {
    return Promise.resolve(localStudyStorage.getSessions(limit));
  },

  async createSession(data: {
    room_id?: string | null;
    title: string;
    category?: string;
    target_duration_seconds: number;
    actual_duration_seconds: number;
    completed: boolean | number;
    started_at: string;
    ended_at: string;
    notes?: string | null;
  }): Promise<StudySession> {
    return Promise.resolve(localStudyStorage.createSession(data));
  },

  // --- Play History ---
  async getHistory(limit = 50): Promise<PlayHistoryItem[]> {
    return Promise.resolve(localStudyStorage.getHistory(limit));
  },

  async recordPlayStart(data: {
    radio_id: string;
    radio_name: string;
    room_id?: string | null;
    session_id?: string | null;
    started_at: string;
  }): Promise<PlayHistoryItem> {
    return Promise.resolve(localStudyStorage.recordPlayStart(data));
  },

  async updatePlayEnd(id: string, durationSeconds: number): Promise<void> {
    localStudyStorage.updatePlayEnd(id, durationSeconds);
    return Promise.resolve();
  },

  // --- Dashboard Stats ---
  async getStats(): Promise<DashboardStats> {
    return Promise.resolve(localStudyStorage.getStats());
  },

  // --- Data Management & Backup ---
  exportBackup(): string {
    return localStudyStorage.exportBackup();
  },

  restoreBackup(jsonString: string): boolean {
    return localStudyStorage.restoreBackup(jsonString);
  },

  resetAll(): void {
    localStudyStorage.resetAll();
  },
};
