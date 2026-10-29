// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  extractSpotifyDetails,
  extractSpotifyUri,
  isSpotifyUrl,
  normalizeSpotifyUrl,
  detectStreamType,
} from '../utils/spotify.js';
import { spotifyAudio } from '../utils/spotifyPlayer.js';

describe('Spotify URL Parser & Utilities', () => {
  it('extracts Spotify details from standard track URLs', () => {
    const url = 'https://open.spotify.com/track/4cOdK2wGLETKBW3PvgPWqT?si=abc123';
    const details = extractSpotifyDetails(url);
    expect(details).not.toBeNull();
    expect(details?.type).toBe('track');
    expect(details?.id).toBe('4cOdK2wGLETKBW3PvgPWqT');
    expect(details?.uri).toBe('spotify:track:4cOdK2wGLETKBW3PvgPWqT');
  });

  it('extracts Spotify details from playlist and album URLs', () => {
    const playlistUrl = 'https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M';
    const playlistDetails = extractSpotifyDetails(playlistUrl);
    expect(playlistDetails?.type).toBe('playlist');
    expect(playlistDetails?.id).toBe('37i9dQZF1DXcBWIGoYBM5M');
    expect(playlistDetails?.uri).toBe('spotify:playlist:37i9dQZF1DXcBWIGoYBM5M');

    const albumUrl = 'https://open.spotify.com/album/41MnTivkwTO3UUODNDfdPl';
    const albumDetails = extractSpotifyDetails(albumUrl);
    expect(albumDetails?.type).toBe('album');
    expect(albumDetails?.id).toBe('41MnTivkwTO3UUODNDfdPl');
  });

  it('extracts Spotify details from international and embed URLs', () => {
    const intlUrl = 'https://open.spotify.com/intl-de/track/4cOdK2wGLETKBW3PvgPWqT';
    expect(extractSpotifyUri(intlUrl)).toBe('spotify:track:4cOdK2wGLETKBW3PvgPWqT');

    const embedUrl = 'https://open.spotify.com/embed/track/4cOdK2wGLETKBW3PvgPWqT';
    expect(extractSpotifyUri(embedUrl)).toBe('spotify:track:4cOdK2wGLETKBW3PvgPWqT');
  });

  it('extracts details from native spotify: URI format', () => {
    const uri = 'spotify:playlist:37i9dQZF1DXcBWIGoYBM5M';
    const details = extractSpotifyDetails(uri);
    expect(details?.type).toBe('playlist');
    expect(details?.id).toBe('37i9dQZF1DXcBWIGoYBM5M');
    expect(details?.uri).toBe(uri);
    expect(isSpotifyUrl(uri)).toBe(true);
  });

  it('returns null for non-Spotify or invalid URLs', () => {
    expect(extractSpotifyDetails('')).toBeNull();
    expect(extractSpotifyDetails('https://youtube.com/watch?v=12345678901')).toBeNull();
    expect(extractSpotifyDetails('https://icecast.somafm.com/stream')).toBeNull();
    expect(extractSpotifyDetails('random text')).toBeNull();
    expect(isSpotifyUrl('https://example.com')).toBe(false);
  });

  it('normalizes Spotify URLs correctly', () => {
    expect(normalizeSpotifyUrl('spotify:track:4cOdK2wGLETKBW3PvgPWqT')).toBe(
      'https://open.spotify.com/track/4cOdK2wGLETKBW3PvgPWqT'
    );
    expect(normalizeSpotifyUrl('https://open.spotify.com/intl-ja/playlist/37i9dQZF1DXcBWIGoYBM5M?si=xyz')).toBe(
      'https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M'
    );
  });

  it('detects stream type correctly across all providers', () => {
    expect(detectStreamType('https://open.spotify.com/track/4cOdK2wGLETKBW3PvgPWqT')).toBe('spotify');
    expect(detectStreamType('spotify:playlist:37i9dQZF1DXcBWIGoYBM5M')).toBe('spotify');
    expect(detectStreamType('https://www.youtube.com/watch?v=0sfDth4lMLc')).toBe('youtube');
    expect(detectStreamType('ambient:rain')).toBe('ambient');
    expect(detectStreamType('https://stream.somafm.com/groovesalad')).toBe('audio');
  });
});

describe('SpotifyAudioController in-app playback control', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('provides methods to start, pause, stop, and change Spotify URI', async () => {
    expect(typeof spotifyAudio.play).toBe('function');
    expect(typeof spotifyAudio.pause).toBe('function');
    expect(typeof spotifyAudio.stop).toBe('function');
    expect(typeof spotifyAudio.loadUri).toBe('function');
    expect(typeof spotifyAudio.setVisible).toBe('function');
  });

  it('mounts and manages container in document.body when activated', () => {
    spotifyAudio.setVisible(true);
    const host = document.getElementById('studinty-spotify-host');
    expect(host).not.toBeNull();
    expect(host?.style.transform).toBe('translateY(0)');
    expect(host?.style.opacity).toBe('1');

    spotifyAudio.setVisible(false);
    expect(host?.style.transform).toBe('translateY(130%)');
    expect(host?.style.opacity).toBe('0');
  });

  it('gracefully handles invalid URLs during play', async () => {
    const onError = vi.fn();
    await spotifyAudio.play('invalid-url', { onError });
    expect(onError).toHaveBeenCalledWith('Invalid Spotify URL or URI');
  });
});
