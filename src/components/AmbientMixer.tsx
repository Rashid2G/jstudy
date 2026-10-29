import React from 'react';
import { AmbientSoundType } from '../types/index.js';
import { CloudRain, Flame, Coffee, Waves, Wind, VolumeX } from 'lucide-react';
import { sound } from '../utils/sound.js';
import { CalmSlider } from './ui.js';

interface Props {
  ambientSound: AmbientSoundType;
  ambientVolume: number;
  onSoundChange: (sound: AmbientSoundType) => void;
  onVolumeChange: (volume: number) => void;
}

const SOUND_OPTIONS: {
  id: AmbientSoundType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { id: 'none', label: 'Off', icon: VolumeX },
  { id: 'rain', label: 'Rain', icon: CloudRain },
  { id: 'fireplace', label: 'Hearth', icon: Flame },
  { id: 'cafe', label: 'Cafe', icon: Coffee },
  { id: 'waves', label: 'Waves', icon: Waves },
  { id: 'whitenoise', label: 'Wind', icon: Wind },
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

  const handleVolume = (val: number) => {
    onVolumeChange(val);
    sound.setAmbientVolume(val);
    if (ambientSound !== 'none' && val > 0 && sound.getCurrentAmbientType() === 'none') {
      sound.startAmbient(ambientSound, val);
    }
  };

  return (
    <div className="space-y-3.5">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-main)]">
            Ambient Background Atmosphere
          </span>
          <p className="text-[11px] text-[var(--text-muted)]">
            Procedurally synthesized calming noise layering
          </p>
        </div>
        {ambientSound !== 'none' && (
          <span className="text-xs font-mono text-[var(--text-muted)] font-medium">
            {Math.round(ambientVolume * 100)}%
          </span>
        )}
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
        {SOUND_OPTIONS.map((opt) => {
          const Icon = opt.icon;
          const isActive = ambientSound === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => handleSelect(opt.id)}
              className={`flex flex-col items-center justify-center p-3 rounded-2xl text-xs transition-all border ${
                isActive
                  ? 'border-[var(--accent-main)] bg-[var(--ink-wash-strong)] ring-2 ring-[var(--accent-main)]/30 text-[var(--text-main)] font-semibold shadow-sm'
                  : 'border-[var(--border-hairline)] bg-[var(--ink-wash)] text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--ink-wash-strong)]'
              }`}
            >
              <Icon className="w-4 h-4 mb-1" />
              <span>{opt.label}</span>
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-[var(--ink-wash)] border border-[var(--border-hairline)]">
        <span className="text-xs font-medium text-[var(--text-muted)] shrink-0">Atmosphere Volume</span>
        <CalmSlider
          value={ambientSound === 'none' ? 0 : ambientVolume}
          min={0}
          max={1}
          step={0.02}
          onChange={(val) => {
            if (ambientSound === 'none' && val > 0) {
              onSoundChange('rain');
              sound.startAmbient('rain', val);
              onVolumeChange(val);
            } else {
              handleVolume(val);
            }
          }}
          ariaLabel="Ambient sound volume"
          className="flex-1"
        />
        <span className="text-xs font-mono text-[var(--text-muted)] w-10 text-right font-medium">
          {Math.round((ambientSound === 'none' ? 0 : ambientVolume) * 100)}%
        </span>
      </div>
    </div>
  );
};
