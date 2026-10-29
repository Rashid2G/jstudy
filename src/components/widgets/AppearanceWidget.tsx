import React from 'react';
import { CalmTheme, ColorMode } from '../../types/index.js';
import { THEMES } from '../ThemeSelector.js';
import { Palette, Sun, Moon, ChevronDown, X } from 'lucide-react';

interface Props {
  currentTheme: CalmTheme;
  onSelectTheme: (theme: CalmTheme) => void;
  colorMode: ColorMode;
  onToggleColorMode: () => void;
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

export const AppearanceWidget: React.FC<Props> = ({
  currentTheme,
  onSelectTheme,
  colorMode,
  onToggleColorMode,
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
  const activeThemeObj = THEMES.find((t) => t.id === currentTheme) || THEMES[0];
  const activeSwatch = colorMode === 'dark' ? activeThemeObj.swatchDark : activeThemeObj.swatchLight;

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
      aria-label="Appearance Widget"
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
            <Palette className="w-4 h-4" />
          </div>
          <div className="min-w-0 max-w-full px-1">
            <span className="block text-[10px] font-semibold tracking-wider uppercase text-[var(--text-faint)]">
              Theme
            </span>
            <p className="text-xs font-semibold text-[var(--text-main)] truncate mt-0.5 max-w-[110px]">
              {activeThemeObj.name}
            </p>
          </div>
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[var(--ink-wash)] border border-[var(--border-hairline)] shrink-0">
            <span
              className="w-2.5 h-2.5 rounded-full shadow-inner"
              style={{ backgroundColor: activeSwatch }}
            />
            <span className="text-[10px] font-mono text-[var(--text-muted)]">
              {colorMode === 'dark' ? 'Dark' : 'Light'}
            </span>
          </div>
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
              <Palette className={isCompressed ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
            </div>

            <div className="min-w-0">
              <span className="block text-[10px] font-semibold tracking-wider uppercase text-[var(--text-faint)] truncate">
                {isCompressed ? 'Theme' : 'Appearance'}
              </span>
              {!isCompressed ? (
                <p className="text-xs font-semibold text-[var(--text-main)] truncate mt-0.5">
                  {activeThemeObj.name}
                </p>
              ) : !isNarrow ? (
                <p className="text-[11px] font-medium text-[var(--text-main)] truncate">
                  {activeThemeObj.name}
                </p>
              ) : null}
            </div>
          </div>

          <div className="apple-widget-meta flex items-center gap-1.5 sm:gap-2 shrink-0">
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[var(--ink-wash)] border border-[var(--border-hairline)]">
              <span
                className="w-2.5 h-2.5 rounded-full shadow-inner"
                style={{ backgroundColor: activeSwatch }}
              />
              <span className="text-[10px] font-mono text-[var(--text-muted)]">
                {colorMode === 'dark' ? 'Dark' : 'Light'}
              </span>
            </div>

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
            {/* Light / Dark Mode Segmented Pill */}
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-[var(--ink-wash)] border border-[var(--border-hairline)]">
              <span className="text-xs font-medium text-[var(--text-muted)]">Color Mode</span>
              <div
                className="inline-flex items-center p-0.5 rounded-lg bg-[var(--bg-canvas)] border border-[var(--border-hairline)]"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={() => colorMode === 'dark' && onToggleColorMode()}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
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
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
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

            {/* 5 Color Palette Swatches */}
            <div>
              <span className="block text-[10px] font-semibold uppercase tracking-wider text-[var(--text-faint)] mb-1.5">
                Palettes
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2" role="radiogroup" aria-label="Color palettes">
                {THEMES.map((t) => {
                  const isActive = currentTheme === t.id;
                  const swatch = colorMode === 'dark' ? t.swatchDark : t.swatchLight;
                  const bg = colorMode === 'dark' ? t.bgDark : t.bgLight;

                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectTheme(t.id);
                      }}
                      role="radio"
                      aria-checked={isActive}
                      aria-label={t.name}
                      className={`flex flex-col items-center py-2.5 px-2 rounded-xl text-center transition-all ${
                        isActive
                          ? 'bg-[var(--accent-main)] text-[var(--accent-fg)] font-semibold shadow-sm'
                          : 'bg-[var(--ink-wash)] text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--ink-wash-strong)]'
                      }`}
                      title={`${t.name} — ${t.description}`}
                    >
                      <div className="flex items-center gap-1 mb-1.5">
                        <span
                          className="w-3.5 h-3.5 rounded-full border border-black/10 shrink-0"
                          style={{ backgroundColor: swatch }}
                        />
                        <span
                          className="w-3 h-3 rounded-full border border-black/10 shrink-0"
                          style={{ backgroundColor: bg }}
                        />
                      </div>
                      <span className="text-[11px] leading-tight font-medium">
                        {t.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
