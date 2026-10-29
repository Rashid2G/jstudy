import React from 'react';
import { CalmTheme, ColorMode } from '../types/index.js';
import { Moon, Sun, Check } from 'lucide-react';

export interface ThemeOption {
  id: CalmTheme;
  name: string;
  description: string;
  swatchLight: string;
  swatchDark: string;
  bgLight: string;
  bgDark: string;
}

export const THEMES: ThemeOption[] = [
  {
    id: 'sage',
    name: 'Sage',
    description: 'Calm moss & eucalyptus',
    swatchLight: '#5a7860',
    swatchDark: '#7c9c82',
    bgLight: '#f2f4f0',
    bgDark: '#131714',
  },
  {
    id: 'sand',
    name: 'Warm Sand',
    description: 'Toasted cedar & oat',
    swatchLight: '#96795c',
    swatchDark: '#b59779',
    bgLight: '#f5f1ea',
    bgDark: '#171411',
  },
  {
    id: 'slate',
    name: 'Slate Mist',
    description: 'Cool storm & quiet rain',
    swatchLight: '#5c7085',
    swatchDark: '#849bb3',
    bgLight: '#f1f3f6',
    bgDark: '#12151a',
  },
  {
    id: 'dusk',
    name: 'Soft Dusk',
    description: 'Mellow twilight & plum',
    swatchLight: '#786790',
    swatchDark: '#9d8cb8',
    bgLight: '#f5f2f7',
    bgDark: '#19151f',
  },
  {
    id: 'nordic',
    name: 'Nordic Stone',
    description: 'Neutral mineral & paper',
    swatchLight: '#545450',
    swatchDark: '#a8a8a2',
    bgLight: '#f4f4f2',
    bgDark: '#171716',
  },
];

interface Props {
  currentTheme: CalmTheme;
  onSelectTheme: (theme: CalmTheme) => void;
  colorMode: ColorMode;
  onToggleColorMode: () => void;
  variant?: 'compact' | 'expanded';
}

export const ThemeSelector: React.FC<Props> = ({
  currentTheme,
  onSelectTheme,
  colorMode,
  onToggleColorMode,
  variant = 'compact',
}) => {
  if (variant === 'expanded') {
    return (
      <div className="space-y-4">
        {/* Light / Dark Mode Toggle */}
        <div className="flex items-center justify-between p-3 rounded-2xl bg-[var(--ink-wash)]">
          <div>
            <p className="text-xs font-medium text-[var(--text-main)]">Color Mode</p>
            <p className="text-[11px] text-[var(--text-muted)]">
              {colorMode === 'dark' ? 'Dark atmosphere' : 'Bright daylight paper'}
            </p>
          </div>
          <div className="inline-flex items-center p-1 rounded-xl bg-[var(--bg-canvas)] border border-[var(--border-hairline)]">
            <button
              type="button"
              onClick={() => colorMode === 'dark' && onToggleColorMode()}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                colorMode === 'light'
                  ? 'bg-[var(--ink-wash-strong)] text-[var(--text-main)] shadow-sm'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
              }`}
            >
              <Sun className="w-3.5 h-3.5" />
              <span>Light</span>
            </button>
            <button
              type="button"
              onClick={() => colorMode === 'light' && onToggleColorMode()}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                colorMode === 'dark'
                  ? 'bg-[var(--ink-wash-strong)] text-[var(--text-main)] shadow-sm'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
              }`}
            >
              <Moon className="w-3.5 h-3.5" />
              <span>Dark</span>
            </button>
          </div>
        </div>

        {/* 5 Palette Cards Grid */}
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wider text-[var(--text-faint)] mb-2.5">
            Page Color Palettes
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5" role="radiogroup" aria-label="Page color palettes">
            {THEMES.map((t) => {
              const active = currentTheme === t.id;
              const swatch = colorMode === 'dark' ? t.swatchDark : t.swatchLight;
              const bg = colorMode === 'dark' ? t.bgDark : t.bgLight;

              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => onSelectTheme(t.id)}
                  aria-checked={active}
                  role="radio"
                  className={`group relative flex flex-col items-start p-3 rounded-2xl text-left transition-all duration-200 border ${
                    active
                      ? 'border-[var(--accent-main)] bg-[var(--ink-wash-strong)] ring-2 ring-[var(--accent-main)]/30 shadow-sm'
                      : 'border-[var(--border-hairline)] bg-[var(--ink-wash)] hover:bg-[var(--ink-wash-strong)] hover:border-[var(--accent-main)]/40'
                  }`}
                >
                  {/* Swatch Preview Bar */}
                  <div className="w-full flex items-center justify-between mb-2.5">
                    <div className="flex items-center gap-1.5">
                      <span
                        className="w-4 h-4 rounded-full shadow-inner border border-black/10 shrink-0"
                        style={{ backgroundColor: swatch }}
                        title={`${t.name} accent`}
                      />
                      <span
                        className="w-3.5 h-3.5 rounded-full border border-black/10 shrink-0"
                        style={{ backgroundColor: bg }}
                        title={`${t.name} background`}
                      />
                    </div>
                    {active && <Check className="w-3.5 h-3.5 text-[var(--accent-main)]" />}
                  </div>

                  {/* Palette Name */}
                  <span className={`text-xs font-semibold ${active ? 'text-[var(--text-main)]' : 'text-[var(--text-muted)] group-hover:text-[var(--text-main)]'}`}>
                    {t.name}
                  </span>
                  <span className="text-[10px] text-[var(--text-faint)] leading-tight mt-0.5 line-clamp-1">
                    {t.description}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // Compact variant
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex items-center gap-1.5" role="radiogroup" aria-label="Color palette">
        {THEMES.map((t) => {
          const active = currentTheme === t.id;
          const swatch = colorMode === 'dark' ? t.swatchDark : t.swatchLight;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => onSelectTheme(t.id)}
              title={`${t.name} palette`}
              aria-label={`${t.name} palette`}
              aria-checked={active}
              role="radio"
              className={`w-3.5 h-3.5 rounded-full transition-all duration-200 ${
                active
                  ? 'scale-125 ring-2 ring-offset-2 ring-[var(--accent-main)] ring-offset-[var(--bg-canvas)] opacity-100'
                  : 'opacity-45 hover:opacity-85 hover:scale-110'
              }`}
              style={{ backgroundColor: swatch }}
            />
          );
        })}
      </div>

      <span className="w-[1px] h-3.5 bg-[var(--border-hairline)]" />

      <button
        type="button"
        onClick={onToggleColorMode}
        className="p-1.5 rounded-full text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--ink-wash)] transition-colors"
        title={colorMode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        aria-label={colorMode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        {colorMode === 'dark' ? (
          <Sun className="w-3.5 h-3.5" />
        ) : (
          <Moon className="w-3.5 h-3.5" />
        )}
      </button>
    </div>
  );
};
