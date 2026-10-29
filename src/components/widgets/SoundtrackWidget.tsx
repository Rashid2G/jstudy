import React, { useState } from 'react';
import { RadioStation } from '../../types/index.js';
import { CalmSwitch, CalmSlider } from '../ui.js';
import { Music, Volume2, ChevronDown, PlusCircle, Sparkles, X } from 'lucide-react';

interface Props {
  stations: RadioStation[];
  currentStationId: string | null;
  onSelectStation: (stationId: string) => void;
  isPlaying: boolean;
  soundtrackEnabled: boolean;
  onToggleSoundtrack: (enabled: boolean) => void;
  radioVolume: number;
  onRadioVolumeChange: (volume: number) => void;
  onAddStation?: (data: {
    name: string;
    description: string;
    url: string;
    genre: string;
    stream_type?: string;
  }) => Promise<void>;
  isExpanded?: boolean;
  isCompressed?: boolean;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  onToggleExpand?: () => void;
  onClose?: () => void;
  className?: string;
  style?: React.CSSProperties;
}

export const SoundtrackWidget: React.FC<Props> = ({
  stations,
  currentStationId,
  onSelectStation,
  isPlaying,
  soundtrackEnabled,
  onToggleSoundtrack,
  radioVolume,
  onRadioVolumeChange,
  onAddStation,
  isExpanded = false,
  isCompressed = false,
  onMouseEnter,
  onMouseLeave,
  onToggleExpand,
  onClose,
  className = '',
  style,
}) => {
  const [isAddingStation, setIsAddingStation] = useState(false);
  const [newStationName, setNewStationName] = useState('');
  const [newStationUrl, setNewStationUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const activeStation = stations.find((s) => s.id === currentStationId) || stations[0];

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStationName.trim() || !newStationUrl.trim() || !onAddStation) return;

    try {
      setIsSubmitting(true);
      await onAddStation({
        name: newStationName.trim(),
        description: 'Custom station',
        url: newStationUrl.trim(),
        genre: 'custom',
      });
      setNewStationName('');
      setNewStationUrl('');
      setIsAddingStation(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className={`apple-widget group rounded-[22px] p-3.5 sm:p-4 bg-[var(--bg-elevated)]/90 backdrop-blur-xl border select-none ${
        isExpanded
          ? 'is-expanded border-[var(--accent-main)]'
          : isCompressed
          ? 'is-compressed border-[var(--border-hairline)]'
          : 'border-[var(--border-hairline)]'
      } ${className}`}
      style={style}
      tabIndex={0}
      role="region"
      aria-label="Soundtrack Widget"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {/* Resting / Header Bar */}
      <div
        className="flex items-center justify-between cursor-pointer w-full"
        onClick={onToggleExpand}
        title={isExpanded ? 'Click to collapse' : 'Click to expand'}
      >
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center bg-[var(--ink-wash-strong)] text-[var(--accent-main)] shrink-0 transition-transform group-hover:scale-105">
            {isPlaying ? (
              <div className="flex items-end justify-center gap-1 w-4 h-4">
                <span className="w-1 bg-[var(--accent-main)] rounded-full apple-eq-1" />
                <span className="w-1 bg-[var(--accent-main)] rounded-full apple-eq-2" />
                <span className="w-1 bg-[var(--accent-main)] rounded-full apple-eq-3" />
              </div>
            ) : (
              <Music className="w-4 h-4" />
            )}
          </div>

          <div className="min-w-0">
            <span className="block text-[10px] font-semibold tracking-wider uppercase text-[var(--text-faint)] truncate">
              {isCompressed ? 'Music' : 'Soundtrack'}
            </span>
            {!isCompressed && (
              <p className="text-xs font-semibold text-[var(--text-main)] truncate mt-0.5">
                {activeStation ? activeStation.name : 'No Station'}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-[var(--ink-wash)] text-[var(--accent-main)] border border-[var(--border-hairline)]">
            {soundtrackEnabled ? `${Math.round(radioVolume * 100)}%` : 'Off'}
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

      {/* Expandable Apple Controls Drawer */}
      <div className="apple-widget-drawer">
        <div className="apple-widget-drawer-inner">
          <div className="pt-3.5 mt-3 border-t border-[var(--border-hairline)] space-y-3">
            {/* Soundtrack Toggle Switch & Volume Slider Row — Fully responsive */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* Soundtrack Toggle Switch */}
              <div
                className="flex items-center justify-between p-3 rounded-xl bg-[var(--ink-wash)] border border-[var(--border-hairline)]"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center gap-2.5">
                  <CalmSwitch
                    id="widget-soundtrack-toggle"
                    checked={soundtrackEnabled}
                    onCheckedChange={onToggleSoundtrack}
                    label="Sound track"
                  />
                </div>
                <span className="text-[11px] font-mono text-[var(--text-faint)]">
                  {soundtrackEnabled ? 'Sound track on' : 'Sound track off'}
                </span>
              </div>

              {/* Soundtrack Volume Slider (Spacious, fluidly responsive) */}
              <div
                className="flex items-center gap-3 p-3 rounded-xl bg-[var(--ink-wash)] border border-[var(--border-hairline)] w-full"
                onClick={(e) => e.stopPropagation()}
              >
                <Volume2 className="w-4 h-4 text-[var(--text-muted)] shrink-0" />
                <div className="flex-1 min-w-0">
                  <CalmSlider
                    value={radioVolume}
                    min={0}
                    max={1}
                    step={0.02}
                    onChange={onRadioVolumeChange}
                    ariaLabel="Soundtrack volume"
                    className="w-full"
                  />
                </div>
                <span className="text-xs font-mono text-[var(--text-muted)] w-10 text-right font-medium shrink-0">
                  {Math.round(radioVolume * 100)}%
                </span>
              </div>
            </div>

            {/* Stations Chips Carousel */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-faint)]">
                  Stations
                </span>
                {onAddStation && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsAddingStation((prev) => !prev);
                    }}
                    className="text-[10px] font-medium text-[var(--accent-main)] hover:underline inline-flex items-center gap-1"
                  >
                    <PlusCircle className="w-3 h-3" />
                    <span>{isAddingStation ? 'Cancel' : 'Add custom URL'}</span>
                  </button>
                )}
              </div>

              {/* Station Pills */}
              <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto">
                {stations.map((st) => {
                  const isSelected = st.id === currentStationId;
                  return (
                    <button
                      key={st.id}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectStation(st.id);
                      }}
                      className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs transition-all ${
                        isSelected
                          ? 'bg-[var(--accent-main)] text-[var(--accent-fg)] font-semibold shadow-sm'
                          : 'bg-[var(--ink-wash)] text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--ink-wash-strong)]'
                      }`}
                      title={st.description || st.name}
                    >
                      <span className="truncate max-w-[130px]">{st.name}</span>
                      {st.is_curated && (
                        <Sparkles className="w-2.5 h-2.5 opacity-70 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Inline Add Station Form */}
            {isAddingStation && (
              <form
                onSubmit={handleAddSubmit}
                onClick={(e) => e.stopPropagation()}
                className="p-3 rounded-xl bg-[var(--ink-wash)] border border-[var(--border-hairline)] space-y-2 mt-2"
              >
                <input
                  type="text"
                  placeholder="Station title"
                  value={newStationName}
                  onChange={(e) => setNewStationName(e.target.value)}
                  className="w-full text-xs px-3 py-1.5 rounded-lg bg-[var(--bg-canvas)] border border-[var(--border-hairline)] text-[var(--text-main)] placeholder-[var(--text-faint)] focus:outline-none"
                  required
                />
                <input
                  type="text"
                  placeholder="YouTube URL or stream address"
                  value={newStationUrl}
                  onChange={(e) => setNewStationUrl(e.target.value)}
                  className="w-full text-xs px-3 py-1.5 rounded-lg bg-[var(--bg-canvas)] border border-[var(--border-hairline)] text-[var(--text-main)] placeholder-[var(--text-faint)] focus:outline-none"
                  required
                />
                <div className="flex justify-end gap-2 pt-0.5">
                  <button
                    type="button"
                    onClick={() => setIsAddingStation(false)}
                    className="text-xs px-2.5 py-1 text-[var(--text-muted)] hover:text-[var(--text-main)]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="text-xs px-3.5 py-1 rounded-lg bg-[var(--accent-main)] text-[var(--accent-fg)] font-medium disabled:opacity-50"
                  >
                    {isSubmitting ? 'Saving...' : 'Add Station'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
