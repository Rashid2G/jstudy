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
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-medium uppercase tracking-widest text-[var(--text-faint)]">
          Ambient Atmosphere
        </span>
        {ambientSound !== 'none' && (
          <span className="text-[10px] font-mono text-[var(--text-faint)]">
            {Math.round(ambientVolume * 100)}%
          </span>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        {SOUND_OPTIONS.map((opt) => {
          const Icon = opt.icon;
          const isActive = ambientSound === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => handleSelect(opt.id)}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs transition-colors ${
                isActive
                  ? 'bg-[var(--ink-wash-strong)] text-[var(--text-main)] font-medium'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--ink-wash)]'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{opt.label}</span>
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-2.5 pt-0.5">
        <span className="text-[10px] font-mono text-[var(--text-faint)]">Mix</span>
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
      </div>
    </div>
  );
};
