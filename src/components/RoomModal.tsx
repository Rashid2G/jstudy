import React, { useState, useEffect } from 'react';
import { Room, RadioStation, CalmTheme, AmbientSoundType } from '../types/index.js';
import { CalmDialog, CalmSwitch, CalmSlider } from './ui.js';
import { Trash2 } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (roomData: Partial<Room>) => Promise<void>;
  onDelete?: (roomId: string) => Promise<void>;
  editingRoom: Room | null;
  radios: RadioStation[];
}

const THEME_OPTIONS: { id: CalmTheme; label: string; bg: string }[] = [
  { id: 'sage', label: 'Sage', bg: '#5a7860' },
  { id: 'sand', label: 'Sand', bg: '#96795c' },
  { id: 'slate', label: 'Slate', bg: '#5c7085' },
  { id: 'dusk', label: 'Dusk', bg: '#786790' },
  { id: 'nordic', label: 'Nordic', bg: '#545450' },
];

const AMBIENT_OPTIONS: { id: AmbientSoundType; label: string }[] = [
  { id: 'none', label: 'Silent' },
  { id: 'rain', label: 'Rain' },
  { id: 'fireplace', label: 'Hearth' },
  { id: 'cafe', label: 'Cafe' },
  { id: 'waves', label: 'Waves' },
  { id: 'whitenoise', label: 'Wind' },
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
  const [breaksEnabled, setBreaksEnabled] = useState(true);
  const [breakMinutes, setBreakMinutes] = useState(5);
  const [defaultRadioId, setDefaultRadioId] = useState<string>('');
  const [ambientSound, setAmbientSound] = useState<AmbientSoundType>('rain');
  const [ambientVolume, setAmbientVolume] = useState(0.35);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (editingRoom) {
      setName(editingRoom.name);
      setDescription(editingRoom.description || '');
      setTheme(editingRoom.theme);
      setWorkMinutes(editingRoom.timer_work_minutes);
      setBreaksEnabled(Boolean(editingRoom.breaks_enabled));
      setBreakMinutes(editingRoom.timer_break_minutes || 5);
      setDefaultRadioId(editingRoom.default_radio_id || radios[0]?.id || '');
      setAmbientSound(editingRoom.ambient_sound);
      setAmbientVolume(editingRoom.ambient_volume);
    } else {
      setName('');
      setDescription('');
      setTheme('sage');
      setWorkMinutes(25);
      setBreaksEnabled(true);
      setBreakMinutes(5);
      setDefaultRadioId(radios[0]?.id || '');
      setAmbientSound('rain');
      setAmbientVolume(0.35);
    }
  }, [editingRoom, radios, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      await onSave({
        name: name.trim(),
        description: description.trim(),
        theme,
        timer_work_minutes: Math.max(1, Math.min(240, Number(workMinutes) || 25)),
        timer_break_minutes: breaksEnabled
          ? Math.max(1, Math.min(90, Number(breakMinutes) || 5))
          : 0,
        breaks_enabled: breaksEnabled ? 1 : 0,
        timer_mode: breaksEnabled ? 'pomodoro' : 'continuous',
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
    setIsSubmitting(true);
    try {
      await onDelete(editingRoom.id);
      onClose();
    } catch (err) {
      console.error('Failed to delete room:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <CalmDialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      title={editingRoom ? 'Room Settings' : 'New Study Room'}
      description="Save your exact timer structure, audio stream, and atmosphere so you can return in one click."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs text-[var(--text-muted)] mb-1.5">Room Name</label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Late Night Calculus, Thesis Deep Flow"
            className="w-full px-3 py-2 text-sm bg-[var(--ink-wash)] border border-[var(--border-hairline)] rounded-xl text-[var(--text-main)] placeholder-[var(--text-faint)] focus:outline-none focus:border-[var(--accent-main)]"
          />
        </div>

        <div>
          <label className="block text-xs text-[var(--text-muted)] mb-1.5">Description</label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Optional vibe note"
            className="w-full px-3 py-2 text-sm bg-[var(--ink-wash)] border border-[var(--border-hairline)] rounded-xl text-[var(--text-main)] placeholder-[var(--text-faint)] focus:outline-none focus:border-[var(--accent-main)]"
          />
        </div>

        {/* Palette */}
        <div>
          <label className="block text-xs text-[var(--text-muted)] mb-1.5">Calm Palette</label>
          <div className="grid grid-cols-5 gap-1.5">
            {THEME_OPTIONS.map((t) => (
              <button
                type="button"
                key={t.id}
                onClick={() => setTheme(t.id)}
                className={`flex flex-col items-center py-2 rounded-xl text-xs transition-colors ${
                  theme === t.id
                    ? 'bg-[var(--ink-wash-strong)] text-[var(--text-main)] font-medium ring-1 ring-[var(--accent-main)]'
                    : 'bg-[var(--ink-wash)] text-[var(--text-muted)] hover:text-[var(--text-main)]'
                }`}
              >
                <span
                  className="w-3.5 h-3.5 rounded-full mb-1"
                  style={{ backgroundColor: t.bg }}
                />
                <span className="text-[10px]">{t.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Custom Pomodoro / Continuous Session Setup */}
        <div className="space-y-3 pt-1">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[var(--text-muted)]">Session Timing</span>
            <CalmSwitch
              id="room-breaks-switch"
              checked={breaksEnabled}
              onCheckedChange={setBreaksEnabled}
              label={breaksEnabled ? 'Include breaks' : 'No breaks (continuous)'}
            />
          </div>

          <div className={`grid gap-3 ${breaksEnabled ? 'grid-cols-2' : 'grid-cols-1'}`}>
            <div>
              <label className="block text-[11px] text-[var(--text-faint)] mb-1">
                Focus duration (minutes)
              </label>
              <input
                type="number"
                min={1}
                max={240}
                value={workMinutes}
                onChange={(e) => setWorkMinutes(Math.max(1, parseInt(e.target.value, 10) || 25))}
                className="w-full px-3 py-2 text-sm font-mono bg-[var(--ink-wash)] border border-[var(--border-hairline)] rounded-xl text-[var(--text-main)] focus:outline-none focus:border-[var(--accent-main)]"
              />
            </div>

            {breaksEnabled && (
              <div>
                <label className="block text-[11px] text-[var(--text-faint)] mb-1">
                  Break duration (minutes)
                </label>
                <input
                  type="number"
                  min={1}
                  max={90}
                  value={breakMinutes}
                  onChange={(e) => setBreakMinutes(Math.max(1, parseInt(e.target.value, 10) || 5))}
                  className="w-full px-3 py-2 text-sm font-mono bg-[var(--ink-wash)] border border-[var(--border-hairline)] rounded-xl text-[var(--text-main)] focus:outline-none focus:border-[var(--accent-main)]"
                />
              </div>
            )}
          </div>
        </div>

        {/* Default Radio */}
        <div>
          <label className="block text-xs text-[var(--text-muted)] mb-1.5">Default Audio Stream</label>
          <select
            value={defaultRadioId}
            onChange={(e) => setDefaultRadioId(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-[var(--ink-wash)] border border-[var(--border-hairline)] rounded-xl text-[var(--text-main)] focus:outline-none focus:border-[var(--accent-main)]"
          >
            {radios.map((r) => (
              <option key={r.id} value={r.id} className="bg-[var(--bg-elevated)] text-[var(--text-main)]">
                {r.name} ({r.genre})
              </option>
            ))}
          </select>
        </div>

        {/* Ambient Layer */}
        <div className="grid grid-cols-2 gap-3 items-end">
          <div>
            <label className="block text-xs text-[var(--text-muted)] mb-1.5">Ambient Texture</label>
            <select
              value={ambientSound}
              onChange={(e) => setAmbientSound(e.target.value as AmbientSoundType)}
              className="w-full px-3 py-2 text-sm bg-[var(--ink-wash)] border border-[var(--border-hairline)] rounded-xl text-[var(--text-main)] focus:outline-none focus:border-[var(--accent-main)]"
            >
              {AMBIENT_OPTIONS.map((a) => (
                <option key={a.id} value={a.id} className="bg-[var(--bg-elevated)] text-[var(--text-main)]">
                  {a.label}
                </option>
              ))}
            </select>
          </div>
          <div className="pb-1.5">
            <label className="block text-[11px] text-[var(--text-faint)] mb-2">
              Ambient Mix ({Math.round(ambientVolume * 100)}%)
            </label>
            <CalmSlider
              value={ambientVolume}
              min={0}
              max={1}
              step={0.05}
              onChange={setAmbientVolume}
              ariaLabel="Room ambient volume"
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-[var(--border-hairline)]">
          {editingRoom && onDelete ? (
            <button
              type="button"
              onClick={handleDelete}
              disabled={isSubmitting}
              className="px-3 py-1.5 text-xs text-rose-500 hover:bg-rose-500/10 rounded-full transition-colors inline-flex items-center gap-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete</span>
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs text-[var(--text-muted)] hover:text-[var(--text-main)] rounded-full transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-medium text-[var(--accent-fg)] bg-[var(--accent-main)] hover:bg-[var(--accent-hover)] rounded-full transition-colors"
            >
              {isSubmitting ? 'Saving...' : editingRoom ? 'Save Room' : 'Create Room'}
            </button>
          </div>
        </div>
      </form>
    </CalmDialog>
  );
};
