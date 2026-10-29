import React from 'react';
import { CalmTheme, ColorMode } from '../types/index.js';
import { Moon, Sun } from 'lucide-react';

interface Props {
  currentTheme: CalmTheme;
  onSelectTheme: (theme: CalmTheme) => void;
  colorMode: ColorMode;
  onToggleColorMode: () => void;
}

const THEMES: { id: CalmTheme; name: string; swatchLight: string; swatchDark: string }[] = [
  { id: 'sage', name: 'Sage', swatchLight: '#5a7860', swatchDark: '#7c9c82' },
  { id: 'sand', name: 'Warm Sand', swatchLight: '#96795c', swatchDark: '#b59779' },
  { id: 'slate', name: 'Slate Mist', swatchLight: '#5c7085', swatchDark: '#849bb3' },
  { id: 'dusk', name: 'Soft Dusk', swatchLight: '#786790', swatchDark: '#9d8cb8' },
  { id: 'nordic', name: 'Nordic Stone', swatchLight: '#545450', swatchDark: '#a8a8a2' },
];

export const ThemeSelector: React.FC<Props> = ({
  currentTheme,
  onSelectTheme,
  colorMode,
  onToggleColorMode,
}) => {
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
