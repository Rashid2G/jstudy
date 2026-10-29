import { describe, it, expect } from 'vitest';
import {
  extractYouTubeId,
  isYouTubeUrl,
  normalizeYouTubeUrl,
  detectStreamType,
} from '../utils/youtube.js';

describe('YouTube URL & stream type utilities', () => {
  it('extracts video IDs from standard watch, live, short, and YouTube Music URLs', () => {
    expect(extractYouTubeId('https://www.youtube.com/watch?v=jfKfPfyJRdk')).toBe('jfKfPfyJRdk');
    expect(extractYouTubeId('https://youtu.be/jfKfPfyJRdk?si=abc123')).toBe('jfKfPfyJRdk');
    expect(extractYouTubeId('https://www.youtube.com/live/jfKfPfyJRdk?feature=share')).toBe(
      'jfKfPfyJRdk'
    );
    expect(extractYouTubeId('https://music.youtube.com/watch?v=5yx6BWlEVcY&list=RD')).toBe(
      '5yx6BWlEVcY'
    );
    expect(extractYouTubeId('https://www.youtube.com/embed/4xDzrJKXOOY')).toBe('4xDzrJKXOOY');
  });

  it('returns null for non-YouTube URLs or invalid IDs', () => {
    expect(extractYouTubeId('https://ice1.somafm.com/groovesalad-128-mp3')).toBeNull();
    expect(extractYouTubeId('ambient:rain')).toBeNull();
    expect(extractYouTubeId('')).toBeNull();
  });

  it('normalizes YouTube URLs to canonical watch URLs', () => {
    expect(normalizeYouTubeUrl('https://youtu.be/jfKfPfyJRdk?si=xyz')).toBe(
      'https://www.youtube.com/watch?v=jfKfPfyJRdk'
    );
    expect(normalizeYouTubeUrl('https://www.youtube.com/live/4xDzrJKXOOY')).toBe(
      'https://www.youtube.com/watch?v=4xDzrJKXOOY'
    );
  });

  it('detects youtube, ambient, and standard audio stream types accurately', () => {
    expect(isYouTubeUrl('https://www.youtube.com/live/jfKfPfyJRdk')).toBe(true);
    expect(detectStreamType('https://www.youtube.com/watch?v=jfKfPfyJRdk')).toBe('youtube');
    expect(detectStreamType('https://youtu.be/5yx6BWlEVcY')).toBe('youtube');
    expect(detectStreamType('ambient:rain')).toBe('ambient');
    expect(detectStreamType('https://ice1.somafm.com/dronezone-128-mp3')).toBe('audio');
  });
});
