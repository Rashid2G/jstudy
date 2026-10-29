import React from 'react';
import { StudySession, DashboardStats, Room } from '../types/index.js';
import { formatDuration, formatDisplayDate } from '../utils/format.js';

interface Props {
  sessions: StudySession[];
  stats: DashboardStats;
  rooms?: Room[];
}

export const SessionsView: React.FC<Props> = ({ sessions, stats, rooms = [] }) => {
  const roomMap = new Map((rooms || []).map((r) => [r.id, r.name]));

  return (
    <section aria-label="Study Sessions" className="py-4 space-y-10">
      {/* Typographic Stats Strip — blended directly on canvas */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 pb-8 border-b border-[var(--border-hairline)]">
        <div>
          <span className="block text-[11px] uppercase tracking-widest text-[var(--text-faint)] mb-1">
            Today
          </span>
          <span className="text-2xl font-mono font-light text-[var(--text-main)]">
            {formatDuration(stats.todayFocusSeconds)}
          </span>
        </div>

        <div>
          <span className="block text-[11px] uppercase tracking-widest text-[var(--text-faint)] mb-1">
            Streak
          </span>
          <span className="text-2xl font-mono font-light text-[var(--text-main)]">
            {stats.activeStreakDays} {stats.activeStreakDays === 1 ? 'day' : 'days'}
          </span>
        </div>

        <div>
          <span className="block text-[11px] uppercase tracking-widest text-[var(--text-faint)] mb-1">
            Sessions
          </span>
          <span className="text-2xl font-mono font-light text-[var(--text-main)]">
            {stats.completedSessionsCount}
          </span>
        </div>

        <div>
          <span className="block text-[11px] uppercase tracking-widest text-[var(--text-faint)] mb-1">
            All Time
          </span>
          <span className="text-2xl font-mono font-light text-[var(--text-main)]">
            {formatDuration(stats.totalFocusSeconds)}
          </span>
        </div>
      </div>

      {/* Session Ledger */}
      <div>
        <div className="flex items-baseline justify-between mb-4">
          <h2 className="text-xs font-medium uppercase tracking-widest text-[var(--text-faint)]">
            Focus Log
          </h2>
          <span className="text-[11px] font-mono text-[var(--text-faint)]">
            {sessions.length} recorded
          </span>
        </div>

        {sessions.length === 0 ? (
          <p className="py-12 text-center text-sm text-[var(--text-muted)]">
            No sessions completed yet. Start a focus block to begin your log.
          </p>
        ) : (
          <div className="divide-y divide-[var(--border-hairline)]">
            {sessions.map((s) => {
              const roomName = s.room_id ? roomMap.get(s.room_id) : null;
              return (
                <div key={s.id} className="py-3.5 flex items-baseline justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-baseline gap-2.5 flex-wrap">
                      <span className="text-sm font-medium text-[var(--text-main)]">
                        {s.title}
                      </span>
                      {roomName && (
                        <span className="text-xs text-[var(--text-faint)]">
                          {roomName}
                        </span>
                      )}
                    </div>
                    {s.notes && (
                      <p className="text-xs text-[var(--text-muted)] mt-0.5 italic">
                        {s.notes}
                      </p>
                    )}
                  </div>

                  <div className="text-right shrink-0 flex items-baseline gap-4">
                    <span className="text-xs text-[var(--text-faint)] hidden sm:inline">
                      {formatDisplayDate(s.started_at)}
                    </span>
                    <span className="text-sm font-mono text-[var(--accent-main)]">
                      {formatDuration(s.actual_duration_seconds)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};
