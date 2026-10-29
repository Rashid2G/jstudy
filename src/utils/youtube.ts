import { StreamType } from '../types/index.js';

const YT_ID_REGEX = /^[a-zA-Z0-9_-]{11}$/;

/**
 * Extracts an 11-character YouTube video or live stream ID from any standard
 * YouTube, youtu.be, YouTube Live, or YouTube Music URL.
 */
export function extractYouTubeId(input: string): string | null {
  if (!input || typeof input !== 'string') return null;
  const trimmed = input.trim();

  if (YT_ID_REGEX.test(trimmed)) {
    return trimmed;
  }

  try {
    const parsed = new URL(trimmed);
    const host = parsed.hostname.replace(/^(www\.|m\.|music\.)/, '').toLowerCase();

    if (host === 'youtu.be') {
      const id = parsed.pathname.split('/').filter(Boolean)[0];
      return id && YT_ID_REGEX.test(id) ? id : null;
    }

    if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
      const vParam = parsed.searchParams.get('v');
      if (vParam && YT_ID_REGEX.test(vParam)) {
        return vParam;
      }

      const parts = parsed.pathname.split('/').filter(Boolean);
      if (parts.length >= 2 && ['live', 'embed', 'shorts', 'v'].includes(parts[0])) {
        const candidate = parts[1];
        if (YT_ID_REGEX.test(candidate)) {
          return candidate;
        }
      }
    }
  } catch {
    // Fallback regex for partial URLs without protocol
    const match = trimmed.match(
      /(?:youtube\.com\/(?:watch\?.*v=|live\/|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
    );
    if (match && YT_ID_REGEX.test(match[1])) {
      return match[1];
    }
  }

  return null;
}

export function isYouTubeUrl(url: string): boolean {
  return extractYouTubeId(url) !== null;
}

export function normalizeYouTubeUrl(url: string): string {
  const id = extractYouTubeId(url);
  if (!id) return url.trim();
  return `https://www.youtube.com/watch?v=${id}`;
}

export function detectStreamType(url: string): StreamType {
  const trimmed = (url || '').trim();
  if (trimmed.startsWith('ambient:')) {
    return 'ambient';
  }
  if (isYouTubeUrl(trimmed)) {
    return 'youtube';
  }
  return 'audio';
}
