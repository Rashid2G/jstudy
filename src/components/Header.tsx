import React from 'react';
import { CalmTheme, ColorMode, DashboardStats } from '../types/index.js';
import { CalmTabs } from './ui.js';
import { Maximize2, Flame, Sliders } from 'lucide-react';

interface Props {
  currentTheme?: CalmTheme;
  onSelectTheme?: (theme: CalmTheme) => void;
  colorMode?: ColorMode;
  onToggleColorMode?: () => void;
  activeTab: 'timer' | 'sessions' | 'history';
  onSelectTab: (tab: 'timer' | 'sessions' | 'history') => void;
  onEnterZenMode: () => void;
  onOpenSettings: () => void;
  stats: DashboardStats;
}

export const Header: React.FC<Props> = ({
  activeTab,
  onSelectTab,
  onEnterZenMode,
  onOpenSettings,
  stats,
}) => {
  return (
    <header className="focus-dimmable py-4 transition-colors">
      <div className="max-w-3xl mx-auto px-5 flex flex-wrap items-center justify-between gap-4">
        {/* Minimal Wordmark */}
        <div className="flex items-baseline gap-2.5">
          <span className="text-base font-semibold tracking-tight text-[var(--text-main)]">
            jstudy
          </span>
          {stats.activeStreakDays > 0 && (
            <span
              className="inline-flex items-center gap-1 text-[11px] font-mono text-[var(--text-muted)]"
              title={`${stats.activeStreakDays} day study streak`}
            >
              <Flame className="w-3 h-3 text-[var(--accent-main)]" />
              {stats.activeStreakDays}d
            </span>
          )}
        </div>

        {/* Seamless Radix Navigation Tabs */}
        <CalmTabs.Root
          value={activeTab}
          onValueChange={(v) => onSelectTab(v as 'timer' | 'sessions' | 'history')}
        >
          <CalmTabs.List className="flex items-center gap-1" aria-label="Main views">
            {(
              [
                { id: 'timer', label: 'Focus' },
                { id: 'sessions', label: 'Sessions' },
                { id: 'history', label: 'Plays' },
              ] as const
            ).map((tab) => (
              <CalmTabs.Trigger
                key={tab.id}
                value={tab.id}
                onClick={() => onSelectTab(tab.id)}
                className={`px-3.5 py-1.5 rounded-full text-xs transition-colors focus:outline-none ${
                  activeTab === tab.id
                    ? 'bg-[var(--ink-wash-strong)] text-[var(--text-main)] font-medium shadow-sm'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--ink-wash)]'
                }`}
              >
                {tab.label}
              </CalmTabs.Trigger>
            ))}
          </CalmTabs.List>
        </CalmTabs.Root>

        {/* Right Actions: Zen Mode & Settings */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onEnterZenMode}
            className="p-2 rounded-full text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--ink-wash)] transition-colors"
            title="Fullscreen Zen Mode"
            aria-label="Fullscreen Zen Mode"
          >
            <Maximize2 className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={onOpenSettings}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--ink-wash)] border border-[var(--border-hairline)] transition-colors"
            title="Open Settings"
            aria-label="Open Settings"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span className="hidden sm:inline font-medium">Settings</span>
          </button>
        </div>
      </div>
    </header>
  );
};
