import React from 'react';
import { AmbientSoundType } from '../types/index.js';
import { CloudRain, Flame, Coffee, Waves, Wind, VolumeX } from 'lucide-react';
import { sound } from '../utils/sound.js';

interface Props {
  ambientSound: AmbientSoundType;
  ambientVolume: number;
  onSoundChange: (sound: AmbientSoundType) => void;
  onVolumeChange: (volume: number) => void;
}

const SOUND_OPTIONS: { id: AmbientSoundType; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'none', label: 'Off', icon: VolumeX },
  { id: 'rain', label: 'Rain', icon: CloudRain },
  { id: 'fireplace', label: 'Hearth', icon: Flame },
  { id: 'cafe', label: 'Cafe', icon: Coffee },
  { id: 'waves', label: 'Waves', icon: Waves },
  { id: 'whitenoise', label: 'White Noise', icon: Wind },
];

export const AmbientMixer: React.FC<Props> = ({
  ambientSound,
  ambientVolume,
  onSoundChange,
  onVolumeChange,
}) => {
  const handleSelect = (type: AmbientSoundType) => {
    onSoundChange(type);
    if (type === 'none') {
      sound.stopAmbient();
    } else {
      sound.startAmbient(type, ambientVolume);
    }
  };

  const handleVolume = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    onVolumeChange(val);
    sound.setAmbientVolume(val);
    if (ambientSound !== 'none' && val > 0 && sound.getCurrentAmbientType() === 'none') {
      sound.startAmbient(ambientSound, val);
    }
  };

  return (
    <div className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-subtle)] shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">
          Ambient Layer
        </span>
        {ambientSound !== 'none' && (
          <span className="text-xs font-mono text-[var(--text-muted)]">
            {Math.round(ambientVolume * 100)}%
          </span>
        )}
      </div>

      <div className="grid grid-cols-6 gap-1.5 mb-3">
        {SOUND_OPTIONS.map((opt) => {
          const Icon = opt.icon;
          const isActive = ambientSound === opt.id;
          return (
            <button
              key={opt.id}
              onClick={() => handleSelect(opt.id)}
              className={`flex flex-col items-center justify-center p-2 rounded-xl text-xs transition-all ${
                isActive
                  ? 'bg-[var(--accent-main)] text-white shadow-sm font-medium'
                  : 'bg-[var(--bg-card-subtle)] text-[var(--text-main)] hover:bg-[var(--border-subtle)] opacity-80 hover:opacity-100'
              }`}
            >
              <Icon className="w-4 h-4 mb-1" />
              <span className="text-[10px] leading-tight truncate">{opt.label}</span>
            </button>
          );
        })}
      </div>

      {ambientSound !== 'none' && (
        <div className="flex items-center gap-3 pt-1">
          <span className="text-[11px] text-[var(--text-muted)]">Volume</span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={ambientVolume}
            onChange={handleVolume}
            className="flex-1"
          />
        </div>
      )}
    </div>
  );
};
