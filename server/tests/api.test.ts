import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';
import { StudintyDatabase } from '../db.js';

describe('API Routes', () => {
  let app: any;
  let db: StudintyDatabase;

  beforeEach(() => {
    db = new StudintyDatabase(':memory:');
    const instance = createApp(db);
    app = instance.app;
  });

  it('GET /api/health returns ok', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  describe('/api/rooms', () => {
    it('GET /api/rooms returns seeded rooms', async () => {
      const res = await request(app).get('/api/rooms');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(4);
    });

    it('POST /api/rooms validates input and creates room', async () => {
      const invalid = await request(app).post('/api/rooms').send({ name: '' });
      expect(invalid.status).toBe(400);

      const res = await request(app).post('/api/rooms').send({
        name: 'Late Night Physics',
        description: 'Quiet contemplation',
        theme: 'dusk',
        timer_work_minutes: 35,
        timer_break_minutes: 7,
      });

      expect(res.status).toBe(201);
      expect(res.body.id).toBeDefined();
      expect(res.body.name).toBe('Late Night Physics');
      expect(res.body.timer_work_minutes).toBe(35);
    });

    it('PUT /api/rooms/:id updates room', async () => {
      const roomsRes = await request(app).get('/api/rooms');
      const target = roomsRes.body[0];

      const res = await request(app)
        .put(`/api/rooms/${target.id}`)
        .send({ name: 'Updated Room Name', timer_work_minutes: 55 });

      expect(res.status).toBe(200);
      expect(res.body.name).toBe('Updated Room Name');
      expect(res.body.timer_work_minutes).toBe(55);
    });

    it('DELETE /api/rooms/:id deletes room', async () => {
      const createRes = await request(app).post('/api/rooms').send({ name: 'Temporary Room' });
      const id = createRes.body.id;

      const delRes = await request(app).delete(`/api/rooms/${id}`);
      expect(delRes.status).toBe(200);
      expect(delRes.body.success).toBe(true);

      const checkRes = await request(app).get(`/api/rooms/${id}`);
      expect(checkRes.status).toBe(404);
    });
  });

  describe('/api/radios', () => {
    it('GET /api/radios returns curated stations', async () => {
      const res = await request(app).get('/api/radios');
      expect(res.status).toBe(200);
      expect(res.body.length).toBeGreaterThanOrEqual(4);
    });

    it('POST /api/radios creates custom station and validates', async () => {
      const invalid = await request(app).post('/api/radios').send({ name: 'Incomplete' });
      expect(invalid.status).toBe(400);

      const res = await request(app).post('/api/radios').send({
        name: 'Chill Anime Beats',
        description: 'Lo-fi beats from stream',
        url: 'https://stream.example.com/audio.mp3',
        stream_type: 'audio',
        genre: 'lofi'
      });

      expect(res.status).toBe(201);
      expect(res.body.name).toBe('Chill Anime Beats');
      expect(res.body.is_curated).toBe(0);
    });
  });

  describe('/api/sessions & /api/stats', () => {
    it('POST /api/sessions logs a session and updates /api/stats', async () => {
      const res = await request(app).post('/api/sessions').send({
        room_id: 'room-library',
        title: 'Deep Calculus Session',
        category: 'Mathematics',
        target_duration_seconds: 1800,
        actual_duration_seconds: 1800,
        completed: 1,
        started_at: new Date().toISOString(),
        ended_at: new Date().toISOString(),
        notes: 'Finished chapters 4 and 5',
      });

      expect(res.status).toBe(201);
      expect(res.body.id).toBeDefined();

      const statsRes = await request(app).get('/api/stats');
      expect(statsRes.status).toBe(200);
      expect(statsRes.body.completedSessionsCount).toBe(1);
      expect(statsRes.body.totalFocusSeconds).toBe(1800);
    });
  });

  describe('/api/history', () => {
    it('POST and PUT /api/history tracks audio sessions', async () => {
      const startRes = await request(app).post('/api/history').send({
        radio_id: 'radio-groove-salad',
        radio_name: 'SomaFM Groove Salad',
        duration_seconds: 0,
        started_at: new Date().toISOString(),
      });

      expect(startRes.status).toBe(201);
      const id = startRes.body.id;

      const updateRes = await request(app).put(`/api/history/${id}`).send({
        duration_seconds: 320,
        ended_at: new Date().toISOString(),
      });
      expect(updateRes.status).toBe(200);

      const getRes = await request(app).get('/api/history');
      expect(getRes.status).toBe(200);
      expect(getRes.body[0].duration_seconds).toBe(320);
    });
  });
});
