import React, { useState } from 'react';
import { X, Radio as RadioIcon, Play, Pause, Check } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onAddRadio: (data: { name: string; description: string; url: string; genre: string }) => Promise<void>;
}

export const RadioModal: React.FC<Props> = ({ isOpen, onClose, onAddRadio }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [url, setUrl] = useState('');
  const [genre, setGenre] = useState('lofi');
  const [isTesting, setIsTesting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [testAudio, setTestAudio] = useState<HTMLAudioElement | null>(null);

  if (!isOpen) return null;

  const handleTestStream = () => {
    if (!url.trim()) return;

    if (isTesting && testAudio) {
      testAudio.pause();
      setIsTesting(false);
      setTestAudio(null);
    } else {
      const audio = new Audio(url.trim());
      audio.volume = 0.5;
      audio.play().then(() => {
        setIsTesting(true);
        setTestAudio(audio);
      }).catch((e) => {
        alert('Could not preview this stream URL. Please verify the URL points to an active audio stream.');
        console.warn(e);
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !url.trim()) return;

    if (testAudio) {
      testAudio.pause();
    }

    setIsSubmitting(true);
    try {
      await onAddRadio({
        name: name.trim(),
        description: description.trim(),
        url: url.trim(),
        genre: genre.trim() || 'lofi',
      });
      setName('');
      setDescription('');
      setUrl('');
      onClose();
    } catch (err) {
      console.error('Failed to add radio:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (testAudio) {
      testAudio.pause();
      setIsTesting(false);
      setTestAudio(null);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-md bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-3xl shadow-xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-subtle)]">
          <div className="flex items-center gap-2">
            <RadioIcon className="w-4 h-4 text-[var(--accent-main)]" />
            <h3 className="text-sm font-semibold text-[var(--text-main)]">
              Add Custom Radio Stream
            </h3>
          </div>
          <button
            onClick={handleClose}
            className="p-1 rounded-full text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-card-subtle)] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-[var(--text-muted)] mb-1 uppercase tracking-wider">
              Station Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. My Favorite Chillhop Live"
              className="w-full px-3 py-2 text-sm bg-[var(--bg-card-subtle)] border border-[var(--border-subtle)] rounded-xl text-[var(--text-main)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-main)]"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[var(--text-muted)] mb-1 uppercase tracking-wider">
              Stream Audio URL (MP3 / Icecast / Live stream)
            </label>
            <div className="flex gap-2">
              <input
                type="url"
                required
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://.../stream.mp3"
                className="flex-1 px-3 py-2 text-sm bg-[var(--bg-card-subtle)] border border-[var(--border-subtle)] rounded-xl text-[var(--text-main)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-main)]"
              />
              <button
                type="button"
                onClick={handleTestStream}
                disabled={!url.trim()}
                className="px-3 py-2 text-xs bg-[var(--bg-card-subtle)] hover:bg-[var(--border-subtle)] border border-[var(--border-subtle)] text-[var(--text-main)] rounded-xl transition-colors flex items-center gap-1 disabled:opacity-40"
                title="Test audio stream"
              >
                {isTesting ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                <span>{isTesting ? 'Stop' : 'Test'}</span>
              </button>
            </div>
            <p className="text-[11px] text-[var(--text-muted)] mt-1">
              Supports live icecast/shoutcast MP3 streams and audio feeds.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[var(--text-muted)] mb-1 uppercase tracking-wider">
                Genre
              </label>
              <input
                type="text"
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
                placeholder="lofi, ambient, classical, jazz"
                className="w-full px-3 py-2 text-sm bg-[var(--bg-card-subtle)] border border-[var(--border-subtle)] rounded-xl text-[var(--text-main)]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--text-muted)] mb-1 uppercase tracking-wider">
                Vibe / Description
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Late night chill..."
                className="w-full px-3 py-2 text-sm bg-[var(--bg-card-subtle)] border border-[var(--border-subtle)] rounded-xl text-[var(--text-main)]"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-[var(--border-subtle)]">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-xs text-[var(--text-muted)] hover:text-[var(--text-main)] rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !name.trim() || !url.trim()}
              className="px-5 py-2 text-xs font-medium text-white bg-[var(--accent-main)] hover:bg-[var(--accent-hover)] rounded-xl transition-all shadow-sm disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : 'Add Radio Stream'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
