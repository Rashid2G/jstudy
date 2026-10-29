import React, { useState } from 'react';
import { RadioStation, CalmTheme, ColorMode, AmbientSoundType } from '../../types/index.js';
import { TimerState } from '../../utils/timer.js';
import { TimerRhythmWidget } from './TimerRhythmWidget.js';
import { SoundtrackWidget } from './SoundtrackWidget.js';
import { AmbientWidget } from './AmbientWidget.js';
import { AppearanceWidget } from './AppearanceWidget.js';

interface Props {
  timerState: TimerState;
  onConfigureTimer: (updates: {
    workMinutes?: number;
    breakMinutes?: number;
    breaksEnabled?: boolean;
  }) => void;
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
  ambientSound: AmbientSoundType;
  ambientVolume: number;
  onAmbientSoundChange: (sound: AmbientSoundType) => void;
  onAmbientVolumeChange: (volume: number) => void;
  currentTheme: CalmTheme;
  onSelectTheme: (theme: CalmTheme) => void;
  colorMode: ColorMode;
  onToggleColorMode: () => void;
}

export const AppleWidgetsShelf: React.FC<Props> = ({
  timerState,
  onConfigureTimer,
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
  ambientSound,
  ambientVolume,
  onAmbientSoundChange,
  onAmbientVolumeChange,
  currentTheme,
  onSelectTheme,
  colorMode,
  onToggleColorMode,
}) => {
  const [activeWidget, setActiveWidget] = useState<string | null>(null);

  const handleMouseEnter = (id: string) => {
    setActiveWidget(id);
  };

  const handleMouseLeave = () => {
    setActiveWidget(null);
  };

  const handleToggleExpand = (id: string) => {
    setActiveWidget((prev) => (prev === id ? null : id));
  };

  const isAnyExpanded = activeWidget !== null;
  const containerHeight = isAnyExpanded ? 336 : 164;

  // Inward expanding coordinates:
  // Top-Left (Rhythm) & Top-Right (Soundtrack) expand down into row 2
  // Bottom-Left (Ambient) & Bottom-Right (Appearance) expand up into row 1
  const topRowHeight =
    activeWidget === 'rhythm' || activeWidget === 'soundtrack'
      ? 'calc(100% - 64px)'
      : isAnyExpanded
      ? '54px'
      : 'calc(50% - 5px)';

  const bottomRowHeight =
    activeWidget === 'ambient' || activeWidget === 'appearance'
      ? 'calc(100% - 64px)'
      : isAnyExpanded
      ? '54px'
      : 'calc(50% - 5px)';

  // Top-Left & Bottom-Left expand right into col 2
  // Top-Right & Bottom-Right expand left into col 1
  const leftColWidth =
    activeWidget === 'rhythm' || activeWidget === 'ambient'
      ? 'calc(73% - 5px)'
      : isAnyExpanded
      ? 'calc(27% - 5px)'
      : 'calc(50% - 5px)';

  const rightColWidth =
    activeWidget === 'soundtrack' || activeWidget === 'appearance'
      ? 'calc(73% - 5px)'
      : isAnyExpanded
      ? 'calc(27% - 5px)'
      : 'calc(50% - 5px)';

  const isRhythmTall = isAnyExpanded && activeWidget === 'soundtrack';
  const isSoundtrackTall = isAnyExpanded && activeWidget === 'rhythm';
  const isAmbientTall = isAnyExpanded && activeWidget === 'appearance';
  const isAppearanceTall = isAnyExpanded && activeWidget === 'ambient';

  const isRhythmNarrow = isAnyExpanded && activeWidget !== 'rhythm';
  const isSoundtrackNarrow = isAnyExpanded && activeWidget === 'rhythm';
  const isAmbientNarrow = isAnyExpanded && (activeWidget === 'soundtrack' || activeWidget === 'appearance');
  const isAppearanceNarrow = isAnyExpanded && (activeWidget === 'rhythm' || activeWidget === 'ambient');

  return (
    <section
      role="region"
      aria-label="Apple Control Widgets"
      className="focus-dimmable w-full max-w-2xl mx-auto mt-3 sm:mt-4 px-1 select-none"
      onMouseLeave={handleMouseLeave}
    >
      <div
        className="apple-widget-shelf-container w-full"
        style={{ height: `${containerHeight}px` }}
      >
        {/* Quadrant 1: Top-Left — Focus Rhythm (Expands Down & Right) */}
        <TimerRhythmWidget
          timerState={timerState}
          onConfigureTimer={onConfigureTimer}
          isExpanded={activeWidget === 'rhythm'}
          isCompressed={isAnyExpanded && activeWidget !== 'rhythm'}
          isTall={isRhythmTall}
          isNarrow={isRhythmNarrow}
          onMouseEnter={() => handleMouseEnter('rhythm')}
          onToggleExpand={() => handleToggleExpand('rhythm')}
          onClose={() => setActiveWidget(null)}
          style={{
            top: 0,
            left: 0,
            width: leftColWidth,
            height: topRowHeight,
          }}
        />

        {/* Quadrant 2: Top-Right — Soundtrack (Expands Down & Left) */}
        <SoundtrackWidget
          stations={stations}
          currentStationId={currentStationId}
          onSelectStation={onSelectStation}
          isPlaying={isPlaying}
          soundtrackEnabled={soundtrackEnabled}
          onToggleSoundtrack={onToggleSoundtrack}
          radioVolume={radioVolume}
          onRadioVolumeChange={onRadioVolumeChange}
          onAddStation={onAddStation}
          onOpenAddStation={onOpenAddStation}
          onOpenSettings={onOpenSettings}
          isExpanded={activeWidget === 'soundtrack'}
          isCompressed={isAnyExpanded && activeWidget !== 'soundtrack'}
          isTall={isSoundtrackTall}
          isNarrow={isSoundtrackNarrow}
          onMouseEnter={() => handleMouseEnter('soundtrack')}
          onToggleExpand={() => handleToggleExpand('soundtrack')}
          onClose={() => setActiveWidget(null)}
          style={{
            top: 0,
            right: 0,
            width: rightColWidth,
            height: topRowHeight,
          }}
        />

        {/* Quadrant 3: Bottom-Left — Ambient Atmosphere (Expands Up & Right) */}
        <AmbientWidget
          ambientSound={ambientSound}
          ambientVolume={ambientVolume}
          onAmbientSoundChange={onAmbientSoundChange}
          onAmbientVolumeChange={onAmbientVolumeChange}
          isExpanded={activeWidget === 'ambient'}
          isCompressed={isAnyExpanded && activeWidget !== 'ambient'}
          isTall={isAmbientTall}
          isNarrow={isAmbientNarrow}
          onMouseEnter={() => handleMouseEnter('ambient')}
          onToggleExpand={() => handleToggleExpand('ambient')}
          onClose={() => setActiveWidget(null)}
          style={{
            bottom: 0,
            left: 0,
            width: leftColWidth,
            height: bottomRowHeight,
          }}
        />

        {/* Quadrant 4: Bottom-Right — Appearance & Themes (Expands Up & Left) */}
        <AppearanceWidget
          currentTheme={currentTheme}
          onSelectTheme={onSelectTheme}
          colorMode={colorMode}
          onToggleColorMode={onToggleColorMode}
          isExpanded={activeWidget === 'appearance'}
          isCompressed={isAnyExpanded && activeWidget !== 'appearance'}
          isTall={isAppearanceTall}
          isNarrow={isAppearanceNarrow}
          onMouseEnter={() => handleMouseEnter('appearance')}
          onToggleExpand={() => handleToggleExpand('appearance')}
          onClose={() => setActiveWidget(null)}
          style={{
            bottom: 0,
            right: 0,
            width: rightColWidth,
            height: bottomRowHeight,
          }}
        />
      </div>
    </section>
  );
};
