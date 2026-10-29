import express from 'express';
import cors from 'cors';
import { StudintyDatabase } from './db.js';

export function createApp(database?: StudintyDatabase) {
  const app = express();
  const db = database || new StudintyDatabase();

  app.use(cors());
  app.use(express.json());

  // Health check
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // --- Rooms Routes ---
  app.get('/api/rooms', (_req, res) => {
    try {
      const rooms = db.getRooms();
      res.json(rooms);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/rooms/:id', (req, res) => {
    try {
      const room = db.getRoomById(req.params.id);
      if (!room) {
        res.status(404).json({ error: 'Room not found' });
        return;
      }
      res.json(room);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/rooms', (req, res) => {
    try {
      const { name, description, theme, timer_work_minutes, timer_break_minutes, timer_mode, default_radio_id, ambient_sound, ambient_volume, radio_volume } = req.body;
      if (!name || typeof name !== 'string' || name.trim() === '') {
        res.status(400).json({ error: 'Room name is required' });
        return;
      }
      const newRoom = db.createRoom({
        name: name.trim(),
        description: description || '',
        theme: theme || 'sage',
        timer_work_minutes: Number(timer_work_minutes) || 25,
        timer_break_minutes: Number(timer_break_minutes) || 5,
        timer_mode: timer_mode || 'pomodoro',
        default_radio_id: default_radio_id || null,
        ambient_sound: ambient_sound || 'none',
        ambient_volume: ambient_volume !== undefined ? Number(ambient_volume) : 0.4,
        radio_volume: radio_volume !== undefined ? Number(radio_volume) : 0.75,
      });
      res.status(201).json(newRoom);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.put('/api/rooms/:id', (req, res) => {
    try {
      const updated = db.updateRoom(req.params.id, req.body);
      if (!updated) {
        res.status(404).json({ error: 'Room not found' });
        return;
      }
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete('/api/rooms/:id', (req, res) => {
    try {
      const success = db.deleteRoom(req.params.id);
      if (!success) {
        res.status(404).json({ error: 'Room not found' });
        return;
      }
      res.json({ success: true, id: req.params.id });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // --- Radios Routes ---
  app.get('/api/radios', (_req, res) => {
    try {
      const radios = db.getRadios();
      res.json(radios);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/radios', (req, res) => {
    try {
      const { name, description, url, stream_type, genre } = req.body;
      if (!name || !url) {
        res.status(400).json({ error: 'Name and URL are required' });
        return;
      }
      const newRadio = db.createRadio({
        name: name.trim(),
        description: description || '',
        url: url.trim(),
        stream_type: stream_type || 'audio',
        genre: genre || 'lofi',
        is_curated: 0,
      });
      res.status(201).json(newRadio);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete('/api/radios/:id', (req, res) => {
    try {
      const success = db.deleteRadio(req.params.id);
      if (!success) {
        res.status(404).json({ error: 'Radio not found' });
        return;
      }
      res.json({ success: true, id: req.params.id });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // --- Sessions Routes ---
  app.get('/api/sessions', (req, res) => {
    try {
      const limit = req.query.limit ? Number(req.query.limit) : 50;
      const sessions = db.getSessions(limit);
      res.json(sessions);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/sessions', (req, res) => {
    try {
      const { room_id, title, category, target_duration_seconds, actual_duration_seconds, completed, started_at, ended_at, notes } = req.body;
      if (!target_duration_seconds || actual_duration_seconds === undefined) {
        res.status(400).json({ error: 'Target and actual durations are required' });
        return;
      }
      const session = db.createSession({
        room_id: room_id || null,
        title: title || 'Focus Session',
        category: category || 'Study',
        target_duration_seconds: Number(target_duration_seconds),
        actual_duration_seconds: Number(actual_duration_seconds),
        completed: completed ? 1 : 0,
        started_at: started_at || new Date().toISOString(),
        ended_at: ended_at || new Date().toISOString(),
        notes: notes || null,
      });
      res.status(201).json(session);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // --- Play History Routes ---
  app.get('/api/history', (req, res) => {
    try {
      const limit = req.query.limit ? Number(req.query.limit) : 50;
      const history = db.getPlayHistory(limit);
      res.json(history);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/history', (req, res) => {
    try {
      const { radio_id, radio_name, room_id, session_id, duration_seconds, started_at, ended_at } = req.body;
      if (!radio_id || !radio_name) {
        res.status(400).json({ error: 'radio_id and radio_name are required' });
        return;
      }
      const record = db.recordPlayHistory({
        radio_id,
        radio_name,
        room_id: room_id || null,
        session_id: session_id || null,
        duration_seconds: Number(duration_seconds) || 0,
        started_at: started_at || new Date().toISOString(),
        ended_at: ended_at || null,
      });
      res.status(201).json(record);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.put('/api/history/:id', (req, res) => {
    try {
      const { duration_seconds, ended_at } = req.body;
      db.updatePlayHistoryDuration(
        req.params.id,
        Number(duration_seconds) || 0,
        ended_at || new Date().toISOString()
      );
      res.json({ success: true, id: req.params.id });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // --- Stats Route ---
  app.get('/api/stats', (_req, res) => {
    try {
      const stats = db.getStats();
      res.json(stats);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  return { app, db };
}
