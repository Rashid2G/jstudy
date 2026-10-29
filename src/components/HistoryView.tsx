import React from 'react';
import { PlayHistoryItem, Room } from '../types/index.js';
import { formatDuration, formatDisplayDate } from '../utils/format.js';

interface Props {
  history: PlayHistoryItem[];
  rooms?: Room[];
}

export const HistoryView: React.FC<Props> = ({ history, rooms = [] }) => {
  const roomMap = new Map((rooms || []).map((r) => [r.id, r.name]));

  return (
    <section aria-label="Radio Play History" className="py-4">
      <div className="flex items-baseline justify-between mb-4 pb-3 border-b border-[var(--border-hairline)]">
        <h2 className="text-xs font-medium uppercase tracking-widest text-[var(--text-faint)]">
          Listening History
        </h2>
        <span className="text-[11px] font-mono text-[var(--text-faint)]">
          {history.length} plays
        </span>
      </div>

      {history.length === 0 ? (
        <p className="py-12 text-center text-sm text-[var(--text-muted)]">
          No radio or YouTube streams played yet.
        </p>
      ) : (
        <div className="divide-y divide-[var(--border-hairline)]">
          {history.map((item) => {
            const roomName = item.room_id ? roomMap.get(item.room_id) : null;
            return (
              <div key={item.id} className="py-3.5 flex items-baseline justify-between gap-4">
                <div className="min-w-0 flex items-baseline gap-2.5 flex-wrap">
                  <span className="text-sm font-medium text-[var(--text-main)]">
                    {item.radio_name}
                  </span>
                  {roomName && (
                    <span className="text-xs text-[var(--text-faint)]">{roomName}</span>
                  )}
                </div>

                <div className="text-right shrink-0 flex items-baseline gap-4">
                  <span className="text-xs text-[var(--text-faint)] hidden sm:inline">
                    {formatDisplayDate(item.started_at)}
                  </span>
                  <span className="text-xs font-mono text-[var(--text-muted)]">
                    {item.duration_seconds > 0 ? formatDuration(item.duration_seconds) : 'Playing'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};
