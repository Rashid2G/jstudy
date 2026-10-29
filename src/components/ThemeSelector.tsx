import React from 'react';
import { CalmTheme } from '../types/index.js';
import { Palette } from 'lucide-react';

interface Props {
  currentTheme: CalmTheme;
  onSelectTheme: (theme: CalmTheme) => void;
}

const THEMES: { id: CalmTheme; name: string; color: string }[] = [
  { id: 'sage', name: 'Sage Garden', color: '#5e7d64' },
  { id: 'sand', name: 'Warm Oat', color: '#a2856a' },
  { id: 'slate', name: 'Slate Mist', color: '#6f7b8f' },
  { id: 'dusk', name: 'Midnight Dusk', color: '#363345' },
  { id: 'nordic', name: 'Nordic Paper', color: '#4a4a4a' },
];

export const ThemeSelector: React.FC<Props> = ({ currentTheme, onSelectTheme }) => {
  return (
    <div className="flex items-center space-x-1.5 p-1 rounded-full bg-[var(--bg-card-subtle)] border border-[var(--border-subtle)]">
      <span className="pl-2 pr-1 text-xs text-[var(--text-muted)] flex items-center gap-1">
        <Palette className="w-3.5 h-3.5" />
      </span>
      {THEMES.map((t) => (
        <button
          key={t.id}
          onClick={() => onSelectTheme(t.id)}
          title={t.name}
          className={`w-5 h-5 rounded-full border transition-all ${
            currentTheme === t.id
              ? 'ring-2 ring-offset-1 ring-[var(--accent-main)] scale-110'
              : 'opacity-70 hover:opacity-100 hover:scale-105'
          }`}
          style={{ backgroundColor: t.color, borderColor: 'rgba(0,0,0,0.1)' }}
        />
      ))}
    </div>
  );
};
