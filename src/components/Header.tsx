import React from 'react';
import { CalmTheme, DashboardStats } from '../types/index.js';
import { ThemeSelector } from './ThemeSelector.js';
import { Maximize2, Flame, Headphones, BookOpen, Clock } from 'lucide-react';

interface Props {
  currentTheme: CalmTheme;
  onSelectTheme: (theme: CalmTheme) => void;
  activeTab: 'timer' | 'sessions' | 'history';
  onSelectTab: (tab: 'timer' | 'sessions' | 'history') => void;
  onEnterZenMode: () => void;
  stats: DashboardStats;
}

export const Header: React.FC<Props> = ({
  currentTheme,
  onSelectTheme,
  activeTab,
  onSelectTab,
  onEnterZenMode,
  stats,
}) => {
  return (
    <header className="py-4 border-b border-[var(--border-subtle)] bg-[var(--bg-main)]/80 backdrop-blur-md sticky top-0 z-30 transition-colors">
      <div className="max-w-4xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Logo & Tagline */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-[var(--accent-main)] flex items-center justify-center text-white font-medium text-sm shadow-sm">
            S
          </div>
          <div>
            <h1 className="text-sm font-semibold tracking-tight text-[var(--text-main)]">
              studinty
            </h1>
            <p className="text-[11px] text-[var(--text-muted)] leading-tight">
              mindful study & lofi sanctuary
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 p-1 bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-full shadow-sm">
          <button
            onClick={() => onSelectTab('timer')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1.5 ${
              activeTab === 'timer'
                ? 'bg-[var(--accent-main)] text-white shadow-sm'
                : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Focus</span>
          </button>

          <button
            onClick={() => onSelectTab('sessions')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1.5 ${
              activeTab === 'sessions'
                ? 'bg-[var(--accent-main)] text-white shadow-sm'
                : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Sessions</span>
          </button>

          <button
            onClick={() => onSelectTab('history')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1.5 ${
              activeTab === 'history'
                ? 'bg-[var(--accent-main)] text-white shadow-sm'
                : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
            }`}
          >
            <Headphones className="w-3.5 h-3.5" />
            <span>Plays</span>
          </button>
        </div>

        {/* Right tools: Streak, Zen Mode, Theme */}
        <div className="flex items-center gap-2">
          {stats.activeStreakDays > 0 && (
            <div
              className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-[var(--bg-card)] border border-[var(--border-subtle)] text-xs text-amber-700 dark:text-amber-300 font-mono"
              title={`${stats.activeStreakDays} day active study streak`}
            >
              <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              <span>{stats.activeStreakDays}d</span>
            </div>
          )}

          <button
            onClick={onEnterZenMode}
            className="p-1.5 rounded-full bg-[var(--bg-card)] border border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors"
            title="Enter Zen Mode (Full Screen Distraction Free)"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>

          <ThemeSelector currentTheme={currentTheme} onSelectTheme={onSelectTheme} />
        </div>
      </div>
    </header>
  );
};
