import { describe, it, expect } from 'vitest';
import { formatTime, formatDuration, formatDisplayDate } from '../utils/format.js';

describe('format utilities', () => {
  it('formats seconds to MM:SS correctly', () => {
    expect(formatTime(0)).toBe('00:00');
    expect(formatTime(65)).toBe('01:05');
    expect(formatTime(1500)).toBe('25:00');
    expect(formatTime(3600)).toBe('60:00');
    expect(formatTime(-5)).toBe('00:00');
  });

  it('formats durations in human friendly format', () => {
    expect(formatDuration(45)).toBe('45s');
    expect(formatDuration(60)).toBe('1m');
    expect(formatDuration(1500)).toBe('25m');
    expect(formatDuration(3600)).toBe('1h');
    expect(formatDuration(3660)).toBe('1h 1m');
    expect(formatDuration(5400)).toBe('1h 30m');
  });

  it('formats display dates safely', () => {
    const now = new Date();
    expect(formatDisplayDate(now.toISOString())).toContain('Today');

    const yesterday = new Date(Date.now() - 24 * 3600 * 1000);
    expect(formatDisplayDate(yesterday.toISOString())).toContain('Yesterday');

    expect(formatDisplayDate('invalid-date')).toBe('Recently');
  });
});
