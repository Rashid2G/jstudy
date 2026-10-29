import React, { useState } from 'react';
import { RadioStation } from '../../types/index.js';
import { CalmSwitch, CalmSlider } from '../ui.js';
import { Music, Volume2, ChevronDown, PlusCircle, Sparkles, X, Loader2 } from 'lucide-react';
import { extractYouTubeId, isYouTubeUrl } from '../../utils/youtube.js';
import { extractSpotifyUri, isSpotifyUrl } from '../../utils/spotify.js';
import { api } from '../../services/api.js';

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
  onOpenAddStation?: () => void;
  onOpenSettings?: (options?: { section?: string; addStation?: boolean }) => void;
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
  onOpenAddStation,
  onOpenSettings,
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
  const [isAddingStation, setIsAddingStation] = useState(false);
  const [newStationName, setNewStationName] = useState('');
  const [newStationUrl, setNewStationUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFetchingMeta, setIsFetchingMeta] = useState(false);

  const activeStation = stations.find((s) => s.id === currentStationId) || stations[0];

  const fetchAndSetMediaTitle = async (candidateUrl: string, targetField: 'name' | 'url') => {
    const videoId = extractYouTubeId(candidateUrl);
    if (!videoId) return;

    setIsFetchingMeta(true);
    try {
      const meta = await api.getYouTubeMeta(candidateUrl);
      if (meta && meta.title) {
        if (targetField === 'name') {
          setNewStationName(meta.title);
        } else {
          setNewStationName((prev) => {
            if (!prev.trim() || isYouTubeUrl(prev) || extractYouTubeId(prev)) {
              return meta.title;
            }
            return prev;
          });
        }
      }
    } catch {
      // If errored just leave it as it is
    } finally {
      setIsFetchingMeta(false);
    }
  };

  const handleTitlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const text = e.clipboardData.getData('text').trim();
    if (isSpotifyUrl(text) || isYouTubeUrl(text) || extractYouTubeId(text)) {
      if (!newStationUrl.trim()) {
        setNewStationUrl(text);
      }
      fetchAndSetMediaTitle(text, 'name');
    }
  };

  const handleUrlPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const text = e.clipboardData.getData('text').trim();
    if (isSpotifyUrl(text) || isYouTubeUrl(text) || extractYouTubeId(text)) {
      fetchAndSetMediaTitle(text, 'url');
    }
  };

  const handleTitleChange = (val: string) => {
    setNewStationName(val);
    const trimmed = val.trim();
    if (isSpotifyUrl(trimmed) || isYouTubeUrl(trimmed) || extractYouTubeId(trimmed)) {
      if (!newStationUrl.trim()) {
        setNewStationUrl(trimmed);
      }
      fetchAndSetMediaTitle(trimmed, 'name');
    }
  };

  const handleUrlChange = (val: string) => {
    setNewStationUrl(val);
    const trimmed = val.trim();
    if (isSpotifyUrl(trimmed) || isYouTubeUrl(trimmed) || extractYouTubeId(trimmed)) {
      if (!newStationName.trim() || isYouTubeUrl(newStationName) || extractYouTubeId(newStationName)) {
        fetchAndSetMediaTitle(trimmed, 'url');
      }
    }
  };

  const handleWidgetPaste = (e: React.ClipboardEvent) => {
    const targetTag = (e.target as HTMLElement)?.tagName?.toLowerCase();
    if (targetTag === 'input' || targetTag === 'textarea') return;

    const text = e.clipboardData.getData('text').trim();
    if (isSpotifyUrl(text) || isYouTubeUrl(text) || extractYouTubeId(text)) {
      e.preventDefault();
      setIsAddingStation(true);
      setNewStationUrl(text);
      setNewStationName(text);
      fetchAndSetMediaTitle(text, 'name');
    }
  };

  const handleAddClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onOpenAddStation) {
      onOpenAddStation();
    } else if (onOpenSettings) {
      onOpenSettings({ section: 'soundtrack', addStation: true });
    } else {
      setIsAddingStation((prev) => !prev);
    }
  };

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
      aria-label="Soundtrack Widget"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onPaste={handleWidgetPaste}
    >
      {/* If compressed & tall (vertical column companion) */}
      {isCompressed && isTall ? (
        <div
          className="flex flex-col items-center justify-center text-center w-full h-full cursor-pointer gap-2 py-1 select-none"
          onClick={onToggleExpand}
          title="Click to expand"
        >
          <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-[var(--ink-wash-strong)] text-[var(--accent-main)] shadow-sm shrink-0 transition-transform group-hover:scale-105">
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
          <div className="min-w-0 max-w-full px-1">
            <span className="block text-[10px] font-semibold tracking-wider uppercase text-[var(--text-faint)]">
              Music
            </span>
            <p className="text-xs font-semibold text-[var(--text-main)] truncate mt-0.5 max-w-[110px]">
              {activeStation ? activeStation.name : 'No Station'}
            </p>
          </div>
          <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-[var(--ink-wash)] text-[var(--accent-main)] border border-[var(--border-hairline)] shrink-0">
            {soundtrackEnabled ? `${Math.round(radioVolume * 100)}%` : 'Off'}
          </span>
        </div>
      ) : (
        /* Standard Header Bar (for resting, compressed-short, and expanded) */
        <div
          className={`apple-widget-header flex items-center justify-between gap-2 cursor-pointer w-full ${!isExpanded ? 'h-full' : ''}`}
          onClick={onToggleExpand}
          title={isExpanded ? 'Click to collapse' : 'Click to expand'}
        >
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
            <div
              className={`${
                isCompressed ? 'w-7 h-7 sm:w-8 sm:h-8' : 'w-8 h-8 sm:w-9 sm:h-9'
              } rounded-xl flex items-center justify-center bg-[var(--ink-wash-strong)] text-[var(--accent-main)] shrink-0 transition-transform group-hover:scale-105`}
            >
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
                <p className="text-xs font-semibold text-[var(--text-main)] truncate mt-0.5 max-w-[140px] sm:max-w-[170px]">
                  {activeStation ? activeStation.name : 'No Station'}
                </p>
              )}
            </div>
          </div>

          <div className="apple-widget-meta flex items-center gap-1.5 sm:gap-2 shrink-0">
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
                className="p-1 rounded-full text-[var(--text-faint)] hover:text-[var(--text-main)] hover:bg-[var(--ink-wash)] transition-colors cursor-pointer"
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
                {(onAddStation || onOpenAddStation || onOpenSettings) && (
                  <button
                    type="button"
                    onClick={handleAddClick}
                    className="text-[10px] font-medium text-[var(--accent-main)] hover:underline inline-flex items-center gap-1 cursor-pointer"
                    title="Open Settings to add a custom station URL"
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
                      className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs transition-all cursor-pointer ${
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

            {/* Inline Add Station Form (Fallback when modal opener is not provided) */}
            {isAddingStation && (
              <form
                onSubmit={handleAddSubmit}
                onClick={(e) => e.stopPropagation()}
                className="p-3 rounded-xl bg-[var(--ink-wash)] border border-[var(--border-hairline)] space-y-2 mt-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-[var(--text-muted)]">Station Details</span>
                  {isFetchingMeta && (
                    <span className="inline-flex items-center gap-1 text-[10px] text-[var(--accent-main)]">
                      <Loader2 className="w-2.5 h-2.5 animate-spin" />
                      Fetching YouTube title...
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  placeholder="Station title (or paste YouTube link)"
                  value={newStationName}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  onPaste={handleTitlePaste}
                  className="w-full text-xs px-3 py-1.5 rounded-lg bg-[var(--bg-canvas)] border border-[var(--border-hairline)] text-[var(--text-main)] placeholder-[var(--text-faint)] focus:outline-none"
                  required
                />
                <input
                  type="text"
                  placeholder="Spotify URL, YouTube URL, or stream address"
                  value={newStationUrl}
                  onChange={(e) => handleUrlChange(e.target.value)}
                  onPaste={handleUrlPaste}
                  className="w-full text-xs px-3 py-1.5 rounded-lg bg-[var(--bg-canvas)] border border-[var(--border-hairline)] text-[var(--text-main)] placeholder-[var(--text-faint)] focus:outline-none"
                  required
                />
                <div className="flex justify-end gap-2 pt-0.5">
                  <button
                    type="button"
                    onClick={() => setIsAddingStation(false)}
                    className="text-xs px-2.5 py-1 text-[var(--text-muted)] hover:text-[var(--text-main)] cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="text-xs px-3.5 py-1 rounded-lg bg-[var(--accent-main)] text-[var(--accent-fg)] font-medium disabled:opacity-50 cursor-pointer"
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
