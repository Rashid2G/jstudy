import { Room, RadioStation, StudySession, PlayHistoryItem, DashboardStats } from '../types/index.js';

const API_BASE = '/api';

export const api = {
  // Rooms
  async getRooms(): Promise<Room[]> {
    const res = await fetch(`${API_BASE}/rooms`);
    if (!res.ok) throw new Error('Failed to fetch rooms');
    return res.json();
  },

  async createRoom(data: Omit<Room, 'id' | 'created_at' | 'updated_at'>): Promise<Room> {
    const res = await fetch(`${API_BASE}/rooms`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create room');
    return res.json();
  },

  async updateRoom(id: string, data: Partial<Room>): Promise<Room> {
    const res = await fetch(`${API_BASE}/rooms/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update room');
    return res.json();
  },

  async deleteRoom(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/rooms/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete room');
  },

  // Radios
  async getRadios(): Promise<RadioStation[]> {
    const res = await fetch(`${API_BASE}/radios`);
    if (!res.ok) throw new Error('Failed to fetch radios');
    return res.json();
  },

  async createRadio(data: { name: string; description?: string; url: string; stream_type?: string; genre?: string }): Promise<RadioStation> {
    const res = await fetch(`${API_BASE}/radios`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create radio station');
    return res.json();
  },

  async deleteRadio(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/radios/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete radio');
  },

  // Sessions
  async getSessions(limit = 50): Promise<StudySession[]> {
    const res = await fetch(`${API_BASE}/sessions?limit=${limit}`);
    if (!res.ok) throw new Error('Failed to fetch sessions');
    return res.json();
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
    const res = await fetch(`${API_BASE}/sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to save session');
    return res.json();
  },

  // Play History
  async getHistory(limit = 50): Promise<PlayHistoryItem[]> {
    const res = await fetch(`${API_BASE}/history?limit=${limit}`);
    if (!res.ok) throw new Error('Failed to fetch play history');
    return res.json();
  },

  async recordPlayStart(data: {
    radio_id: string;
    radio_name: string;
    room_id?: string | null;
    session_id?: string | null;
    started_at: string;
  }): Promise<PlayHistoryItem> {
    const res = await fetch(`${API_BASE}/history`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, duration_seconds: 0 }),
    });
    if (!res.ok) throw new Error('Failed to record play start');
    return res.json();
  },

  async updatePlayEnd(id: string, durationSeconds: number): Promise<void> {
    await fetch(`${API_BASE}/history/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        duration_seconds: durationSeconds,
        ended_at: new Date().toISOString(),
      }),
    });
  },

  // Dashboard Stats
  async getStats(): Promise<DashboardStats> {
    const res = await fetch(`${API_BASE}/stats`);
    if (!res.ok) throw new Error('Failed to fetch stats');
    return res.json();
  },
};
