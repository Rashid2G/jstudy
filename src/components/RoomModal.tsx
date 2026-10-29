import React, { useState, useEffect } from 'react';
import { Room, RadioStation, CalmTheme, AmbientSoundType } from '../types/index.js';
import { X, Trash2, Check } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (roomData: Partial<Room>) => Promise<void>;
  onDelete?: (roomId: string) => Promise<void>;
  editingRoom: Room | null;
  radios: RadioStation[];
}

const THEME_OPTIONS: { id: CalmTheme; label: string; bg: string }[] = [
  { id: 'sage', label: 'Sage', bg: '#5e7d64' },
  { id: 'sand', label: 'Sand', bg: '#a2856a' },
  { id: 'slate', label: 'Slate', bg: '#6f7b8f' },
  { id: 'dusk', label: 'Dusk', bg: '#363345' },
  { id: 'nordic', label: 'Nordic', bg: '#4a4a4a' },
];

const AMBIENT_OPTIONS: { id: AmbientSoundType; label: string }[] = [
  { id: 'none', label: 'No Ambient' },
  { id: 'rain', label: 'Rain' },
  { id: 'fireplace', label: 'Fireplace' },
  { id: 'cafe', label: 'Cafe' },
  { id: 'waves', label: 'Waves' },
  { id: 'whitenoise', label: 'White Noise' },
];

export const RoomModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  editingRoom,
  radios,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [theme, setTheme] = useState<CalmTheme>('sage');
  const [workMinutes, setWorkMinutes] = useState(25);
  const [breakMinutes, setBreakMinutes] = useState(5);
  const [defaultRadioId, setDefaultRadioId] = useState<string>('');
  const [ambientSound, setAmbientSound] = useState<AmbientSoundType>('rain');
  const [ambientVolume, setAmbientVolume] = useState(0.4);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (editingRoom) {
      setName(editingRoom.name);
      setDescription(editingRoom.description || '');
      setTheme(editingRoom.theme);
      setWorkMinutes(editingRoom.timer_work_minutes);
      setBreakMinutes(editingRoom.timer_break_minutes);
      setDefaultRadioId(editingRoom.default_radio_id || (radios[0]?.id || ''));
      setAmbientSound(editingRoom.ambient_sound);
      setAmbientVolume(editingRoom.ambient_volume);
    } else {
      setName('');
      setDescription('');
      setTheme('sage');
      setWorkMinutes(25);
      setBreakMinutes(5);
      setDefaultRadioId(radios[0]?.id || '');
      setAmbientSound('rain');
      setAmbientVolume(0.4);
    }
  }, [editingRoom, radios, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      await onSave({
        name: name.trim(),
        description: description.trim(),
        theme,
        timer_work_minutes: Number(workMinutes),
        timer_break_minutes: Number(breakMinutes),
        default_radio_id: defaultRadioId || null,
        ambient_sound: ambientSound,
        ambient_volume: Number(ambientVolume),
      });
      onClose();
    } catch (err) {
      console.error('Failed to save room:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!editingRoom || !onDelete) return;
    if (confirm(`Delete the room "${editingRoom.name}"?`)) {
      setIsSubmitting(true);
      try {
        await onDelete(editingRoom.id);
        onClose();
      } catch (err) {
        console.error('Failed to delete room:', err);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-md bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-3xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-subtle)]">
          <h3 className="text-sm font-semibold text-[var(--text-main)]">
            {editingRoom ? 'Edit Custom Room' : 'Create Custom Room'}
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-card-subtle)] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
          <div>
            <label className="block text-xs font-medium text-[var(--text-muted)] mb-1 uppercase tracking-wider">
              Room Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Midnight Math Studio, Exam Sprint"
              className="w-full px-3 py-2 text-sm bg-[var(--bg-card-subtle)] border border-[var(--border-subtle)] rounded-xl text-[var(--text-main)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-main)]"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[var(--text-muted)] mb-1 uppercase tracking-wider">
              Vibe Description
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Dim lighting, deep concentration and tea"
              className="w-full px-3 py-2 text-sm bg-[var(--bg-card-subtle)] border border-[var(--border-subtle)] rounded-xl text-[var(--text-main)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-main)]"
            />
          </div>

          {/* Theme selection */}
          <div>
            <label className="block text-xs font-medium text-[var(--text-muted)] mb-1 uppercase tracking-wider">
              Color Palette
            </label>
            <div className="grid grid-cols-5 gap-2">
              {THEME_OPTIONS.map((t) => (
                <button
                  type="button"
                  key={t.id}
                  onClick={() => setTheme(t.id)}
                  className={`flex flex-col items-center p-2 rounded-xl border text-xs transition-all ${
                    theme === t.id
                      ? 'border-[var(--accent-main)] ring-2 ring-[var(--accent-main)] bg-[var(--accent-soft)]/20'
                      : 'border-[var(--border-subtle)] hover:bg-[var(--bg-card-subtle)]'
                  }`}
                >
                  <span
                    className="w-4 h-4 rounded-full mb-1 border border-black/10"
                    style={{ backgroundColor: t.bg }}
                  />
                  <span className="text-[10px] text-[var(--text-main)]">{t.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Timer intervals */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[var(--text-muted)] mb-1 uppercase tracking-wider">
                Focus (Minutes)
              </label>
              <input
                type="number"
                min="1"
                max="180"
                value={workMinutes}
                onChange={(e) => setWorkMinutes(Math.max(1, parseInt(e.target.value) || 25))}
                className="w-full px-3 py-2 text-sm bg-[var(--bg-card-subtle)] border border-[var(--border-subtle)] rounded-xl text-[var(--text-main)] font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--text-muted)] mb-1 uppercase tracking-wider">
                Break (Minutes)
              </label>
              <input
                type="number"
                min="1"
                max="60"
                value={breakMinutes}
                onChange={(e) => setBreakMinutes(Math.max(1, parseInt(e.target.value) || 5))}
                className="w-full px-3 py-2 text-sm bg-[var(--bg-card-subtle)] border border-[var(--border-subtle)] rounded-xl text-[var(--text-main)] font-mono"
              />
            </div>
          </div>

          {/* Default Radio */}
          <div>
            <label className="block text-xs font-medium text-[var(--text-muted)] mb-1 uppercase tracking-wider">
              Default Lofi Radio
            </label>
            <select
              value={defaultRadioId}
              onChange={(e) => setDefaultRadioId(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-[var(--bg-card-subtle)] border border-[var(--border-subtle)] rounded-xl text-[var(--text-main)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-main)]"
            >
              {radios.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name} ({r.genre})
                </option>
              ))}
            </select>
          </div>

          {/* Ambient sound */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[var(--text-muted)] mb-1 uppercase tracking-wider">
                Ambient Sound
              </label>
              <select
                value={ambientSound}
                onChange={(e) => setAmbientSound(e.target.value as AmbientSoundType)}
                className="w-full px-3 py-2 text-sm bg-[var(--bg-card-subtle)] border border-[var(--border-subtle)] rounded-xl text-[var(--text-main)]"
              >
                {AMBIENT_OPTIONS.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--text-muted)] mb-1 uppercase tracking-wider">
                Ambient Vol ({Math.round(ambientVolume * 100)}%)
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={ambientVolume}
                onChange={(e) => setAmbientVolume(parseFloat(e.target.value))}
                className="w-full mt-3"
              />
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-[var(--border-subtle)]">
            {editingRoom && onDelete ? (
              <button
                type="button"
                onClick={handleDelete}
                disabled={isSubmitting}
                className="px-3 py-2 text-xs text-rose-600 hover:bg-rose-50 rounded-xl transition-colors flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Room</span>
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs text-[var(--text-muted)] hover:text-[var(--text-main)] rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 text-xs font-medium text-white bg-[var(--accent-main)] hover:bg-[var(--accent-hover)] rounded-xl transition-all shadow-sm"
              >
                {isSubmitting ? 'Saving...' : editingRoom ? 'Save Changes' : 'Create Room'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
