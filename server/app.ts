import os from 'node:os';
import path from 'node:path';
import express from 'express';
import cors from 'cors';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import { StudintyDatabase } from './db.js';
import { detectStreamType, extractYouTubeId } from '../src/utils/youtube.js';

function resolveBinary(name: string, fallbacks: string[] = []): string {
  for (const candidate of fallbacks) {
    if (fs.existsSync(candidate)) return candidate;
  }
  return name;
}

export function createApp(database?: StudintyDatabase) {
  const app = express();
  const db = database || new StudintyDatabase();

  app.use(cors());
  app.use(express.json());

  // Health check
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // --- YouTube Metadata & Pure Audio Stream Routes ---
  app.get('/api/youtube/meta', async (req, res) => {
    const rawUrl = String(req.query.url || '');
    const videoId = extractYouTubeId(rawUrl);
    if (!videoId) {
      res.status(400).json({ error: 'Invalid YouTube video or live stream URL' });
      return;
    }

    const canonicalUrl = `https://www.youtube.com/watch?v=${videoId}`;
    try {
      const oembedRes = await fetch(
        `https://www.youtube.com/oembed?url=${encodeURIComponent(canonicalUrl)}&format=json`
      );
      if (!oembedRes.ok) {
        res.json({
          videoId,
          title: `YouTube Stream (${videoId})`,
          author: 'YouTube',
        });
        return;
      }
      const data = (await oembedRes.json()) as { title?: string; author_name?: string };
      res.json({
        videoId,
        title: data.title || `YouTube Stream (${videoId})`,
        author: data.author_name || 'YouTube',
      });
    } catch {
      res.json({
        videoId,
        title: `YouTube Stream (${videoId})`,
        author: 'YouTube',
      });
    }
  });

  app.get('/api/youtube/stream', (req, res) => {
    const rawUrl = String(req.query.url || '');
    const videoId = extractYouTubeId(rawUrl);
    if (!videoId) {
      res.status(400).json({ error: 'Invalid YouTube URL' });
      return;
    }

    const canonicalUrl = `https://www.youtube.com/watch?v=${videoId}`;
    const ytdlpBin = resolveBinary('yt-dlp', [
      path.join(os.homedir(), '.local/share/mise/installs/python/latest/bin/yt-dlp'),
      '/usr/local/bin/yt-dlp',
      '/usr/bin/yt-dlp',
    ]);
    const ffmpegBin = resolveBinary('ffmpeg', ['/usr/bin/ffmpeg', '/usr/local/bin/ffmpeg']);

    const childEnv = {
      ...process.env,
      PATH: `${process.env.PATH || ''}:/usr/bin:/usr/local/bin:${path.join(os.homedir(), '.local/share/mise/shims')}`,
    };

    let cleanedUp = false;
    let firstByteSent = false;

    const ytdlp = spawn(
      ytdlpBin,
      [
        '--remote-components',
        'ejs:github',
        '-f',
        'bestaudio/best',
        '--no-playlist',
        '-q',
        '-o',
        '-',
        canonicalUrl,
      ],
      {
        stdio: ['ignore', 'pipe', 'pipe'],
        env: childEnv,
      }
    );

    const ffmpeg = spawn(
      ffmpegBin,
      ['-loglevel', 'error', '-i', 'pipe:0', '-vn', '-acodec', 'libmp3lame', '-ab', '128k', '-f', 'mp3', 'pipe:1'],
      {
        stdio: ['pipe', 'pipe', 'pipe'],
        env: childEnv,
      }
    );

    const cleanup = () => {
      if (cleanedUp) return;
      cleanedUp = true;
      try {
        ytdlp.kill('SIGTERM');
      } catch {
        // ignore
      }
      try {
        ffmpeg.kill('SIGTERM');
      } catch {
        // ignore
      }
    };

    ytdlp.on('error', () => {
      cleanup();
      if (!res.headersSent) {
        res.status(503).json({ error: 'yt-dlp unavailable for audio transcoding' });
      }
    });

    ffmpeg.on('error', () => {
      cleanup();
      if (!res.headersSent) {
        res.status(503).json({ error: 'ffmpeg unavailable for audio transcoding' });
      }
    });

    if (ytdlp.stdout && ffmpeg.stdin) {
      ytdlp.stdout.pipe(ffmpeg.stdin);
      ffmpeg.stdin.on('error', () => {
        // Expected EPIPE on disconnect
      });
    }

    if (ffmpeg.stdout) {
      ffmpeg.stdout.on('data', (chunk: Buffer) => {
        if (!firstByteSent) {
          firstByteSent = true;
          if (!res.headersSent) {
            res.writeHead(200, {
              'Content-Type': 'audio/mpeg',
              'Cache-Control': 'no-store',
            });
          }
        }
        if (!res.writableEnded) {
          res.write(chunk);
        }
      });

      ffmpeg.stdout.on('end', () => {
        if (!firstByteSent && !res.headersSent) {
          res.status(502).json({ error: 'YouTube stream did not produce audio' });
        } else if (!res.writableEnded) {
          res.end();
        }
      });
    }

    ffmpeg.on('close', () => {
      if (!firstByteSent && !res.headersSent) {
        res.status(502).json({ error: 'YouTube video or live stream unavailable' });
      }
      cleanup();
    });

    req.on('close', cleanup);
    res.on('close', cleanup);
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
      const {
        name,
        description,
        theme,
        timer_work_minutes,
        timer_break_minutes,
        breaks_enabled,
        timer_mode,
        default_radio_id,
        ambient_sound,
        ambient_volume,
        radio_volume,
      } = req.body;

      if (!name || typeof name !== 'string' || name.trim() === '') {
        res.status(400).json({ error: 'Room name is required' });
        return;
      }

      const breaksOn = breaks_enabled !== undefined ? (breaks_enabled ? 1 : 0) : 1;

      const newRoom = db.createRoom({
        name: name.trim(),
        description: description || '',
        theme: theme || 'sage',
        timer_work_minutes: timer_work_minutes !== undefined ? Number(timer_work_minutes) : 25,
        timer_break_minutes:
          timer_break_minutes !== undefined ? Number(timer_break_minutes) : breaksOn ? 5 : 0,
        breaks_enabled: breaksOn,
        timer_mode: timer_mode || (breaksOn ? 'pomodoro' : 'continuous'),
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
      if (!name || !url || typeof name !== 'string' || typeof url !== 'string') {
        res.status(400).json({ error: 'Name and URL are required' });
        return;
      }
      const trimmedUrl = url.trim();
      const detected = detectStreamType(trimmedUrl);
      const newRadio = db.createRadio({
        name: name.trim(),
        description: description || '',
        url: trimmedUrl,
        stream_type: detected === 'youtube' ? 'youtube' : (stream_type || detected),
        genre: genre || (detected === 'youtube' ? 'youtube audio' : 'lofi'),
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
      const {
        room_id,
        title,
        category,
        target_duration_seconds,
        actual_duration_seconds,
        completed,
        started_at,
        ended_at,
        notes,
      } = req.body;
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
      res.status(201).json(newsessionWithSafeId(session));
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

function newsessionWithSafeId<T>(session: T): T {
  return session;
}
