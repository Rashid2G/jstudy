import React from 'react';
import { AmbientSoundType } from '../../types/index.js';
import { CloudRain, Flame, Coffee, Waves, Wind, VolumeX, Volume2, ChevronDown, X } from 'lucide-react';
import { sound } from '../../utils/sound.js';
import { CalmSlider } from '../ui.js';

interface Props {
  ambientSound: AmbientSoundType;
  ambientVolume: number;
  onAmbientSoundChange: (sound: AmbientSoundType) => void;
  onAmbientVolumeChange: (volume: number) => void;
  isExpanded?: boolean;
  isCompressed?: boolean;
  isTall?: boolean;
  isNarrow?: boolean;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  onToggleExpand?: () => void;
  onClose?: () => void;
  className?: string;
  style?: React.CSSProperties;
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

export const AmbientWidget: React.FC<Props> = ({
  ambientSound,
  ambientVolume,
  onAmbientSoundChange,
  onAmbientVolumeChange,
  isExpanded = false,
  isCompressed = false,
  isTall = false,
  isNarrow = false,
  onMouseEnter,
  onMouseLeave,
  onToggleExpand,
  onClose,
  className = '',
  style,
}) => {
  const activeOption = SOUND_OPTIONS.find((s) => s.id === ambientSound) || SOUND_OPTIONS[0];
  const ActiveIcon = activeOption.icon;

  const handleSelectSound = (type: AmbientSoundType) => {
    onAmbientSoundChange(type);
    if (type === 'none') {
      sound.stopAmbient();
    } else {
      sound.startAmbient(type, ambientVolume);
    }
  };

  const handleVolumeChange = (val: number) => {
    onAmbientVolumeChange(val);
    sound.setAmbientVolume(val);
    if (ambientSound !== 'none' && val > 0 && sound.getCurrentAmbientType() === 'none') {
      sound.startAmbient(ambientSound, val);
    }
  };

  return (
    <div
      className={`apple-widget group rounded-[22px] bg-[var(--bg-elevated)]/90 backdrop-blur-xl border select-none ${
        isExpanded
          ? 'is-expanded border-[var(--accent-main)] p-3.5 sm:p-4 flex flex-col justify-start'
          : isCompressed
          ? `is-compressed border-[var(--border-hairline)] ${
              isTall ? 'p-3 flex flex-col justify-center' : 'px-3 sm:px-3.5 py-0 flex items-center'
            }`
          : 'border-[var(--border-hairline)] p-3.5 sm:p-4 flex items-center'
      } ${className}`}
      style={style}
      tabIndex={0}
      role="region"
      aria-label="Ambient Atmosphere Widget"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {/* If compressed & tall (vertical column companion) */}
      {isCompressed && isTall ? (
        <div
          className="flex flex-col items-center justify-center text-center w-full h-full cursor-pointer gap-2 py-1 select-none"
          onClick={onToggleExpand}
          title="Click to expand"
        >
          <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-[var(--ink-wash-strong)] text-[var(--accent-main)] shadow-sm shrink-0 transition-transform group-hover:scale-105">
            <ActiveIcon className="w-4 h-4" />
          </div>
          <div className="min-w-0 max-w-full px-1">
            <span className="block text-[10px] font-semibold tracking-wider uppercase text-[var(--text-faint)]">
              Atmosphere
            </span>
            <p className="text-xs font-semibold text-[var(--text-main)] truncate mt-0.5 max-w-[110px]">
              {activeOption.label}
            </p>
          </div>
          <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-[var(--ink-wash)] text-[var(--accent-main)] border border-[var(--border-hairline)] shrink-0">
            {ambientSound === 'none' ? 'Off' : `${Math.round(ambientVolume * 100)}%`}
          </span>
        </div>
      ) : (
        /* Standard Header Bar (for resting, compressed-short, and expanded) */
        <div
          className={`flex items-center justify-between cursor-pointer w-full ${!isExpanded ? 'h-full' : ''}`}
          onClick={onToggleExpand}
          title={isExpanded ? 'Click to collapse' : 'Click to expand'}
        >
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
            <div
              className={`${
                isCompressed ? 'w-7 h-7 sm:w-8 sm:h-8' : 'w-8 h-8 sm:w-9 sm:h-9'
              } rounded-xl flex items-center justify-center bg-[var(--ink-wash-strong)] text-[var(--accent-main)] shrink-0 transition-transform group-hover:scale-105`}
            >
              <ActiveIcon className={isCompressed ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
            </div>

            <div className="min-w-0">
              <span className="block text-[10px] font-semibold tracking-wider uppercase text-[var(--text-faint)] truncate">
                {isCompressed ? 'Ambient' : 'Atmosphere'}
              </span>
              {!isCompressed ? (
                <p className="text-xs font-semibold text-[var(--text-main)] truncate mt-0.5">
                  {activeOption.label}
                </p>
              ) : !isNarrow ? (
                <p className="text-[11px] font-medium text-[var(--text-main)] truncate">
                  {activeOption.label}
                </p>
              ) : null}
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-[var(--ink-wash)] text-[var(--accent-main)] border border-[var(--border-hairline)]">
              {ambientSound === 'none' ? 'Off' : `${Math.round(ambientVolume * 100)}%`}
            </span>

            {isExpanded && onClose ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onClose();
                }}
                className="p-1 rounded-full text-[var(--text-faint)] hover:text-[var(--text-main)] hover:bg-[var(--ink-wash)] transition-colors"
                title="Close widget"
                aria-label="Close widget"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            ) : !isCompressed ? (
              <ChevronDown className="w-3.5 h-3.5 text-[var(--text-faint)] apple-widget-chevron" />
            ) : null}
          </div>
        </div>
      )}

      {/* Expandable Apple Controls Drawer */}
      <div className="apple-widget-drawer w-full">
        <div className="apple-widget-drawer-inner">
          <div className="pt-3.5 mt-3 border-t border-[var(--border-hairline)] space-y-3">
            {/* 6 Sound Icons Grid */}
            <div>
              <span className="block text-[10px] font-semibold uppercase tracking-wider text-[var(--text-faint)] mb-1.5">
                Soundscape
              </span>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {SOUND_OPTIONS.map((opt) => {
                  const Icon = opt.icon;
                  const isSelected = ambientSound === opt.id;

                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectSound(opt.id);
                      }}
                      className={`flex flex-col items-center justify-center py-2.5 px-1.5 rounded-xl text-center transition-all ${
                        isSelected
                          ? 'bg-[var(--accent-main)] text-[var(--accent-fg)] font-semibold shadow-sm'
                          : 'bg-[var(--ink-wash)] text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--ink-wash-strong)]'
                      }`}
                      title={opt.label}
                    >
                      <Icon className="w-4 h-4 mb-1" />
                      <span className="text-[11px] leading-none font-medium">{opt.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Atmosphere Volume Slider (Fully responsive full-width slider) */}
            <div
              className="flex items-center gap-3 p-3 rounded-xl bg-[var(--ink-wash)] border border-[var(--border-hairline)] w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <Volume2 className="w-4 h-4 text-[var(--text-muted)] shrink-0" />
              <div className="flex-1 min-w-0">
                <CalmSlider
                  value={ambientSound === 'none' ? 0 : ambientVolume}
                  min={0}
                  max={1}
                  step={0.02}
                  onChange={(val) => {
                    if (ambientSound === 'none' && val > 0) {
                      handleSelectSound('rain');
                      handleVolumeChange(val);
                    } else {
                      handleVolumeChange(val);
                    }
                  }}
                  ariaLabel="Atmosphere volume"
                  className="w-full"
                />
              </div>
              <span className="text-xs font-mono text-[var(--text-muted)] w-10 text-right font-medium shrink-0">
                {Math.round((ambientSound === 'none' ? 0 : ambientVolume) * 100)}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
