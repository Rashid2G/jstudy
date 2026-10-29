import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Loader2 } from 'lucide-react';
import { CalmDialog } from './ui.js';
import { extractYouTubeId, isYouTubeUrl } from '../utils/youtube.js';
import { youtubeAudio } from '../utils/youtubePlayer.js';
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

  // Auto-fetch YouTube video / live stream title when pasting a YouTube link
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
        // Ignore oembed error quietly
      })
      .finally(() => {
        if (!cancelled) setIsFetchingMeta(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [detectedYouTubeId, isOpen]);

  const stopTestPlayback = () => {
    if (testAudioRef.current) {
      testAudioRef.current.pause();
      testAudioRef.current = null;
    }
    if (isTesting) {
      youtubeAudio.pause();
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
            setPreviewError('Could not preview YouTube audio stream.');
          });
        },
      });
      return;
    }

    const audio = new Audio(trimmed);
    audio.volume = 0.6;
    testAudioRef.current = audio;
    audio
      .play()
      .then(() => setIsTesting(true))
      .catch(() => {
        setIsTesting(false);
        setPreviewError('Could not preview stream. Check that the URL is a valid audio or YouTube link.');
      });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !url.trim()) return;

    stopTestPlayback();
    setIsSubmitting(true);
    try {
      const isYt = isYouTubeUrl(url.trim());
      await onAddRadio({
        name: name.trim(),
        description: description.trim(),
        url: url.trim(),
        genre: genre.trim() || (isYt ? 'youtube audio' : 'lofi'),
        stream_type: isYt ? 'youtube' : 'audio',
      });
      setName('');
      setDescription('');
      setUrl('');
      setPreviewError(null);
      onClose();
    } catch (err) {
      console.error('Failed to add radio:', err);
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
      description="Paste any YouTube video, 24/7 YouTube live radio, or Icecast/MP3 stream URL. Videos run purely as background audio."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs text-[var(--text-muted)]">
              YouTube or Audio Stream URL
            </label>
            {detectedYouTubeId && (
              <span className="text-[10px] font-mono text-[var(--accent-main)]">
                {isFetchingMeta ? 'Fetching title...' : 'YouTube audio stream ready'}
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <input
              type="url"
              required
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                setPreviewError(null);
              }}
              placeholder="https://www.youtube.com/watch?v=... or .mp3"
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
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Lofi Girl Study Session, Rainy Piano Mix"
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
              placeholder="lofi, piano, ambient"
              className="w-full px-3 py-2 text-sm bg-[var(--ink-wash)] border border-[var(--border-hairline)] rounded-xl text-[var(--text-main)] placeholder-[var(--text-faint)] focus:outline-none focus:border-[var(--accent-main)]"
            />
          </div>
          <div>
            <label className="block text-xs text-[var(--text-muted)] mb-1.5">
              Short Note
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Calm evening study"
              className="w-full px-3 py-2 text-sm bg-[var(--ink-wash)] border border-[var(--border-hairline)] rounded-xl text-[var(--text-main)] placeholder-[var(--text-faint)] focus:outline-none focus:border-[var(--accent-main)]"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--border-hairline)]">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 text-xs text-[var(--text-muted)] hover:text-[var(--text-main)] rounded-full transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || !name.trim() || !url.trim()}
            className="px-5 py-2 text-xs font-medium text-[var(--accent-fg)] bg-[var(--accent-main)] hover:bg-[var(--accent-hover)] rounded-full transition-colors disabled:opacity-50"
          >
            {isSubmitting ? 'Saving...' : 'Save Stream'}
          </button>
        </div>
      </form>
    </CalmDialog>
  );
};
