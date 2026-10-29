import React from 'react';
import { PlayHistoryItem, Room } from '../types/index.js';
import { formatDuration, formatDisplayDate } from '../utils/format.js';
import { Headphones, Radio, Clock } from 'lucide-react';

interface Props {
  history: PlayHistoryItem[];
  rooms: Room[];
}

export const HistoryView: React.FC<Props> = ({ history, rooms }) => {
  const roomMap = new Map(rooms.map((r) => [r.id, r.name]));

  return (
    <div className="p-5 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-subtle)] shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-[var(--text-main)] flex items-center gap-2">
          <Headphones className="w-4 h-4 text-[var(--accent-main)]" />
          <span>Radio & Audio Play History</span>
        </h3>
        <span className="text-xs text-[var(--text-muted)] font-mono">
          {history.length} streams played
        </span>
      </div>

      {history.length === 0 ? (
        <div className="text-center py-12 text-[var(--text-muted)]">
          <p className="text-sm">No audio playback recorded yet.</p>
          <p className="text-xs mt-1 opacity-80">Tune into a station or ambient layer to start logging audio history.</p>
        </div>
      ) : (
        <div className="divide-y divide-[var(--border-subtle)]">
          {history.map((item) => {
            const roomName = item.room_id ? roomMap.get(item.room_id) || 'Custom Room' : 'Focus Space';
            return (
              <div key={item.id} className="py-3 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[var(--bg-card-subtle)] flex items-center justify-center text-[var(--accent-main)]">
                    <Radio className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-[var(--text-main)]">
                        {item.radio_name}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--bg-card-subtle)] text-[var(--text-muted)]">
                        {roomName}
                      </span>
                    </div>
                    <p className="text-[11px] text-[var(--text-muted)] opacity-75">
                      {formatDisplayDate(item.started_at)}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs font-mono font-medium text-[var(--text-main)]">
                    {item.duration_seconds > 0 ? formatDuration(item.duration_seconds) : 'Active / Quick'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
