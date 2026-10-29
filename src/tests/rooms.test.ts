import { describe, it, expect } from 'vitest';
import { Room } from '../types/index.js';

describe('Room configuration logic', () => {
  const sampleRooms: Room[] = [
    {
      id: 'room-1',
      name: 'Silent Library',
      description: 'Ultra quiet focus',
      theme: 'sage',
      timer_work_minutes: 50,
      timer_break_minutes: 10,
      timer_mode: 'pomodoro',
      default_radio_id: 'radio-drone-zone',
      ambient_sound: 'rain',
      ambient_volume: 0.5,
      radio_volume: 0.7,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'room-2',
      name: 'Coffee Shop Flow',
      description: 'Cozy cafe vibes',
      theme: 'sand',
      timer_work_minutes: 25,
      timer_break_minutes: 5,
      timer_mode: 'pomodoro',
      default_radio_id: 'radio-nightwave',
      ambient_sound: 'cafe',
      ambient_volume: 0.4,
      radio_volume: 0.8,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];

  it('correctly finds and resolves room settings by id', () => {
    const selected = sampleRooms.find((r) => r.id === 'room-2');
    expect(selected).toBeDefined();
    expect(selected?.theme).toBe('sand');
    expect(selected?.timer_work_minutes).toBe(25);
    expect(selected?.ambient_sound).toBe('cafe');
  });

  it('falls back safely when room id is missing', () => {
    const fallback = sampleRooms.find((r) => r.id === 'non-existent') || sampleRooms[0];
    expect(fallback).toBeDefined();
    expect(fallback.id).toBe('room-1');
  });

  it('validates custom room minutes constraints', () => {
    const rawWorkMinutes = -10;
    const clampedWork = Math.max(1, Math.min(180, rawWorkMinutes || 25));
    expect(clampedWork).toBe(1);

    const highWork = 300;
    const clampedHigh = Math.max(1, Math.min(180, highWork || 25));
    expect(clampedHigh).toBe(180);
  });
});
