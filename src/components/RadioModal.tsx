import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Loader2 } from 'lucide-react';
import { CalmDialog } from './ui.js';
import { extractYouTubeId, isYouTubeUrl } from '../utils/youtube.js';
import { extractSpotifyUri, isSpotifyUrl } from '../utils/spotify.js';
import { youtubeAudio } from '../utils/youtubePlayer.js';
import { spotifyAudio } from '../utils/spotifyPlayer.js';
import { api } from '../services/api.js';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onAddRadio: (data: {
    name: string;
    description: string;
    url: string;
    genre: string;
    stream_type?: string;
  }) => Promise<void>;
}

export const RadioModal: React.FC<Props> = ({ isOpen, onClose, onAddRadio }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [url, setUrl] = useState('');
  const [genre, setGenre] = useState('lofi');
  const [isTesting, setIsTesting] = useState(false);
  const [isFetchingMeta, setIsFetchingMeta] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const testAudioRef = useRef<HTMLAudioElement | null>(null);

  const detectedYouTubeId = extractYouTubeId(url);
  const detectedSpotifyUri = extractSpotifyUri(url);

  // Auto-fetch YouTube metadata when pasting a YouTube link
  useEffect(() => {
    if (!detectedYouTubeId || !isOpen) return;
    let cancelled = false;
    setIsFetchingMeta(true);

    api
      .getYouTubeMeta(url)
      .then((meta) => {
        if (cancelled) return;
        setName((prev) => (prev.trim() === '' ? meta.title : prev));
        setDescription((prev) =>
          prev.trim() === '' && meta.author ? `YouTube audio · ${meta.author}` : prev
        );
      })
      .catch(() => {
        // If errored just leave it as it is
      })
      .finally(() => {
        if (!cancelled) setIsFetchingMeta(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [detectedYouTubeId, isOpen]);

  // Auto-fetch Spotify metadata when pasting a Spotify link
  useEffect(() => {
    if (!detectedSpotifyUri || !isOpen) return;
    let cancelled = false;
    setIsFetchingMeta(true);

    api
      .getSpotifyMeta(url)
      .then((meta) => {
        if (cancelled) return;
        setName((prev) => (prev.trim() === '' ? meta.title : prev));
        setDescription((prev) =>
          prev.trim() === '' && meta.author ? `Spotify · ${meta.author}` : prev
        );
        setGenre((prev) => (prev === 'lofi' ? 'spotify' : prev));
      })
      .catch(() => {
        // Ignore quietly
      })
      .finally(() => {
        if (!cancelled) setIsFetchingMeta(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [detectedSpotifyUri, isOpen]);

  const handleNamePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const text = e.clipboardData.getData('text').trim();
    if (isYouTubeUrl(text) || extractYouTubeId(text)) {
      if (!url.trim()) {
        setUrl(text);
      }
      setIsFetchingMeta(true);
      api
        .getYouTubeMeta(text)
        .then((meta) => {
          if (meta?.title) {
            setName(meta.title);
          }
        })
        .catch(() => {
          // If errored just leave it as it is
        })
        .finally(() => {
          setIsFetchingMeta(false);
        });
    }
  };

  const handleNameChange = (val: string) => {
    setName(val);
    const trimmed = val.trim();
    if (isYouTubeUrl(trimmed) || extractYouTubeId(trimmed)) {
      if (!url.trim()) {
        setUrl(trimmed);
      }
      setIsFetchingMeta(true);
      api
        .getYouTubeMeta(trimmed)
        .then((meta) => {
          if (meta?.title) {
            setName(meta.title);
          }
        })
        .catch(() => {
          // If errored just leave it as it is
        })
        .finally(() => {
          setIsFetchingMeta(false);
        });
    }
  };

  const stopTestPlayback = () => {
    if (testAudioRef.current) {
      testAudioRef.current.pause();
      testAudioRef.current = null;
    }
    if (isTesting) {
      youtubeAudio.pause();
      spotifyAudio.stop();
      setIsTesting(false);
    }
  };

  const handleClose = () => {
    stopTestPlayback();
    setPreviewError(null);
    onClose();
  };

  const handleTestStream = () => {
    const trimmed = url.trim();
    if (!trimmed) return;
    setPreviewError(null);

    if (isTesting) {
      stopTestPlayback();
      return;
    }

    // Spotify stream test
    if (isSpotifyUrl(trimmed)) {
      setIsTesting(true);
      spotifyAudio.play(trimmed, {
        onPlaying: () => setIsTesting(true),
        onError: (err) => {
          setIsTesting(false);
          setPreviewError(err || 'Could not preview Spotify audio stream.');
        },
      });
      return;
    }

    // YouTube stream test
    const ytId = extractYouTubeId(trimmed);
    if (ytId) {
      setIsTesting(true);
      youtubeAudio.play(ytId, 0.6, false, {
        onPlaying: () => setIsTesting(true),
        onFallbackNeeded: () => {
          youtubeAudio.stop();
          const audio = new Audio(api.getYouTubeAudioStreamUrl(trimmed));
          audio.volume = 0.6;
          testAudioRef.current = audio;
          audio.play().catch(() => {
            setIsTesting(false);
            setPreviewError('Unable to preview audio stream in this browser.');
          });
        },
        onError: () => {
          setIsTesting(false);
          setPreviewError('Failed to load YouTube stream. It may have playback restrictions.');
        },
      });
      return;
    }

    // Direct HTTP/Icecast stream
    setIsTesting(true);
    const audio = new Audio(trimmed);
    audio.volume = 0.6;
    testAudioRef.current = audio;

    audio.onplaying = () => setIsTesting(true);
    audio.onerror = () => {
      setIsTesting(false);
      setPreviewError('Unable to load audio stream from this URL.');
    };

    audio.play().catch(() => {
      setIsTesting(false);
      setPreviewError('Could not play stream. Make sure the link is a valid direct audio or live URL.');
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !url.trim()) return;

    try {
      setIsSubmitting(true);
      stopTestPlayback();

      const isYt = isYouTubeUrl(url);
      const isSp = isSpotifyUrl(url);
      const stream_type = isSp ? 'spotify' : isYt ? 'youtube' : 'audio';

      await onAddRadio({
        name: name.trim(),
        description: description.trim() || (isSp ? 'Spotify audio' : isYt ? 'YouTube audio stream' : 'Web audio radio stream'),
        url: url.trim(),
        genre: genre.trim() || (isSp ? 'spotify' : isYt ? 'youtube audio' : 'lofi'),
        stream_type,
      });

      handleClose();
      setName('');
      setUrl('');
      setDescription('');
      setGenre('lofi');
    } catch (err: any) {
      setPreviewError(err.message || 'Failed to save radio station');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <CalmDialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) handleClose();
      }}
      title="Add Focus Audio Stream"
      description="Paste any Spotify playlist/track, YouTube video or 24/7 live radio, or Icecast/MP3 stream URL. Plays cleanly as focus audio."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs text-[var(--text-muted)]">
              Spotify, YouTube, or Audio Stream URL
            </label>
            {detectedSpotifyUri && (
              <span className="text-[10px] font-mono text-[var(--accent-main)]">
                {isFetchingMeta ? 'Fetching title...' : 'Spotify stream ready'}
              </span>
            )}
            {detectedYouTubeId && !detectedSpotifyUri && (
              <span className="text-[10px] font-mono text-[var(--accent-main)]">
                {isFetchingMeta ? 'Fetching title...' : 'YouTube stream ready'}
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              required
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                setPreviewError(null);
              }}
              placeholder="https://open.spotify.com/... or https://www.youtube.com/... or .mp3"
              className="flex-1 px-3 py-2 text-sm bg-[var(--ink-wash)] border border-[var(--border-hairline)] rounded-xl text-[var(--text-main)] placeholder-[var(--text-faint)] focus:outline-none focus:border-[var(--accent-main)]"
            />
            <button
              type="button"
              onClick={handleTestStream}
              disabled={!url.trim()}
              className="px-3 py-2 text-xs bg-[var(--ink-wash)] hover:bg-[var(--ink-wash-strong)] text-[var(--text-main)] rounded-xl transition-colors inline-flex items-center gap-1.5 disabled:opacity-40"
            >
              {isTesting ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              <span>{isTesting ? 'Stop' : 'Preview'}</span>
            </button>
          </div>
          {previewError && (
            <p className="text-[11px] text-rose-500 mt-1">{previewError}</p>
          )}
        </div>

        <div>
          <label className="block text-xs text-[var(--text-muted)] mb-1.5">
            Station / Track Name
          </label>
          <div className="relative">
            <input
              type="text"
              required
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              onPaste={handleNamePaste}
              placeholder="e.g. Deep Focus Spotify Mix, Lofi Study Session"
              className="w-full px-3 py-2 text-sm bg-[var(--ink-wash)] border border-[var(--border-hairline)] rounded-xl text-[var(--text-main)] placeholder-[var(--text-faint)] focus:outline-none focus:border-[var(--accent-main)]"
            />
            {isFetchingMeta && (
              <Loader2 className="w-3.5 h-3.5 animate-spin absolute right-3 top-2.5 text-[var(--text-faint)]" />
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-[var(--text-muted)] mb-1.5">
              Genre / Tag
            </label>
            <input
              type="text"
              value={genre}
              onChange={(e) => setGenre(e.target.value)}
              placeholder="e.g. spotify, lofi, ambient"
              className="w-full px-3 py-2 text-sm bg-[var(--ink-wash)] border border-[var(--border-hairline)] rounded-xl text-[var(--text-main)] focus:outline-none focus:border-[var(--accent-main)]"
            />
          </div>

          <div>
            <label className="block text-xs text-[var(--text-muted)] mb-1.5">
              Description (Optional)
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Soothing instrumental study tracks"
              className="w-full px-3 py-2 text-sm bg-[var(--ink-wash)] border border-[var(--border-hairline)] rounded-xl text-[var(--text-main)] focus:outline-none focus:border-[var(--accent-main)]"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2.5 pt-3 border-t border-[var(--border-hairline)]">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 text-sm text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || !name.trim() || !url.trim()}
            className="px-5 py-2 text-sm rounded-xl bg-[var(--accent-main)] text-[var(--accent-fg)] font-medium hover:bg-[var(--accent-hover)] disabled:opacity-40 transition-colors shadow-sm"
          >
            {isSubmitting ? 'Adding...' : 'Add Audio Stream'}
          </button>
        </div>
      </form>
    </CalmDialog>
  );
};
