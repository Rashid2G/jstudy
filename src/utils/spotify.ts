import { StreamType } from '../types/index.js';
import { isYouTubeUrl } from './youtube.js';

export interface SpotifyDetails {
  type: 'track' | 'playlist' | 'album' | 'artist' | 'episode';
  id: string;
  uri: string;
}

const SPOTIFY_URI_REGEX = /^spotify:(track|playlist|album|artist|episode):([a-zA-Z0-9]{15,30})$/;
const SUPPORTED_TYPES: SpotifyDetails['type'][] = ['track', 'playlist', 'album', 'artist', 'episode'];

/**
 * Extracts Spotify details (type, id, and uri) from a Spotify URL or URI.
 * Supports standard URLs, international URLs (e.g. /intl-de/), embed URLs, and spotify: URIs.
 */
export function extractSpotifyDetails(input: string): SpotifyDetails | null {
  if (!input || typeof input !== 'string') return null;
  const trimmed = input.trim();

  // 1. Direct Spotify URI: spotify:track:4cOdK2wGLETKBW3PvgPWqT
  const uriMatch = trimmed.match(SPOTIFY_URI_REGEX);
  if (uriMatch) {
    const type = uriMatch[1] as SpotifyDetails['type'];
    const id = uriMatch[2];
    return { type, id, uri: `spotify:${type}:${id}` };
  }

  // 2. Web URL: https://open.spotify.com/track/4cOdK2wGLETKBW3PvgPWqT
  try {
    const parsed = new URL(trimmed);
    const host = parsed.hostname.replace(/^(www\.)/, '').toLowerCase();
    if (host === 'open.spotify.com' || host === 'spotify.com') {
      const parts = parsed.pathname.split('/').filter(Boolean);
      let typeIdx = -1;
      for (let i = 0; i < parts.length; i++) {
        if (SUPPORTED_TYPES.includes(parts[i] as any)) {
          typeIdx = i;
          break;
        }
      }

      if (typeIdx !== -1 && parts[typeIdx + 1]) {
        const type = parts[typeIdx] as SpotifyDetails['type'];
        const id = parts[typeIdx + 1];
        if (/^[a-zA-Z0-9]{15,30}$/.test(id)) {
          return { type, id, uri: `spotify:${type}:${id}` };
        }
      }
    }
  } catch {
    // URL parsing failed; fallback to regex search
    const match = trimmed.match(
      /(?:open\.spotify\.com\/(?:intl-[a-z]{2}\/)?(?:embed\/)?(track|playlist|album|artist|episode)\/|spotify:(track|playlist|album|artist|episode):)([a-zA-Z0-9]{15,30})/
    );
    if (match) {
      const type = (match[1] || match[2]) as SpotifyDetails['type'];
      const id = match[3];
      return { type, id, uri: `spotify:${type}:${id}` };
    }
  }

  return null;
}

/**
 * Extracts a normalized Spotify URI from a URL or URI string.
 * Example: "https://open.spotify.com/track/4cOd..." -> "spotify:track:4cOd..."
 */
export function extractSpotifyUri(input: string): string | null {
  const details = extractSpotifyDetails(input);
  return details ? details.uri : null;
}

/**
 * Returns true if the string is a valid Spotify URL or URI.
 */
export function isSpotifyUrl(url: string): boolean {
  return extractSpotifyUri(url) !== null;
}

/**
 * Normalizes any Spotify URL or URI into a canonical https://open.spotify.com/{type}/{id} URL.
 */
export function normalizeSpotifyUrl(url: string): string {
  const details = extractSpotifyDetails(url);
  if (!details) return (url || '').trim();
  return `https://open.spotify.com/${details.type}/${details.id}`;
}

/**
 * Determines stream type: ambient, youtube, spotify, or audio.
 */
export function detectStreamType(url: string): StreamType {
  const trimmed = (url || '').trim();
  if (trimmed.startsWith('ambient:')) {
    return 'ambient';
  }
  if (isYouTubeUrl(trimmed)) {
    return 'youtube';
  }
  if (isSpotifyUrl(trimmed)) {
    return 'spotify';
  }
  return 'audio';
}
