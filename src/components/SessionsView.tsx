import React from 'react';
import { StudySession, DashboardStats, Room } from '../types/index.js';
import { formatDuration, formatDisplayDate } from '../utils/format.js';
import { Flame, Clock, CheckCircle, Calendar, BookOpen } from 'lucide-react';

interface Props {
  sessions: StudySession[];
  stats: DashboardStats;
  rooms: Room[];
}

export const SessionsView: React.FC<Props> = ({ sessions, stats, rooms }) => {
  const roomMap = new Map(rooms.map((r) => [r.id, r.name]));

  return (
    <div className="space-y-6">
      {/* Top Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-subtle)] shadow-sm">
          <div className="flex items-center gap-2 text-[var(--accent-main)] mb-1">
            <Clock className="w-4 h-4" />
            <span className="text-[11px] font-medium uppercase tracking-wider text-[var(--text-muted)]">
              Today Focus
            </span>
          </div>
          <p className="text-2xl font-mono font-medium text-[var(--text-main)]">
            {formatDuration(stats.todayFocusSeconds)}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-subtle)] shadow-sm">
          <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 mb-1">
            <Flame className="w-4 h-4" />
            <span className="text-[11px] font-medium uppercase tracking-wider text-[var(--text-muted)]">
              Day Streak
            </span>
          </div>
          <p className="text-2xl font-mono font-medium text-[var(--text-main)]">
            {stats.activeStreakDays} {stats.activeStreakDays === 1 ? 'day' : 'days'}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-subtle)] shadow-sm">
          <div className="flex items-center gap-2 text-[var(--accent-main)] mb-1">
            <CheckCircle className="w-4 h-4" />
            <span className="text-[11px] font-medium uppercase tracking-wider text-[var(--text-muted)]">
              Sessions Done
            </span>
          </div>
          <p className="text-2xl font-mono font-medium text-[var(--text-main)]">
            {stats.completedSessionsCount}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-subtle)] shadow-sm">
          <div className="flex items-center gap-2 text-[var(--text-muted)] mb-1">
            <Calendar className="w-4 h-4" />
            <span className="text-[11px] font-medium uppercase tracking-wider text-[var(--text-muted)]">
              All-Time Focus
            </span>
          </div>
          <p className="text-2xl font-mono font-medium text-[var(--text-main)]">
            {formatDuration(stats.totalFocusSeconds)}
          </p>
        </div>
      </div>

      {/* Session History List */}
      <div className="p-5 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-subtle)] shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-[var(--text-main)] flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-[var(--accent-main)]" />
            <span>Study Session Records</span>
          </h3>
          <span className="text-xs text-[var(--text-muted)] font-mono">
            {sessions.length} sessions logged
          </span>
        </div>

        {sessions.length === 0 ? (
          <div className="text-center py-12 text-[var(--text-muted)]">
            <p className="text-sm">No study sessions recorded yet.</p>
            <p className="text-xs mt-1 opacity-80">Start your focus timer to log your first deep work block.</p>
          </div>
        ) : (
          <div className="divide-y divide-[var(--border-subtle)]">
            {sessions.map((s) => {
              const roomName = s.room_id ? roomMap.get(s.room_id) || 'Custom Room' : 'Focus Space';
              return (
                <div key={s.id} className="py-3 flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-[var(--text-main)]">
                        {s.title}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--bg-card-subtle)] text-[var(--text-muted)]">
                        {roomName}
                      </span>
                    </div>
                    {s.notes && (
                      <p className="text-xs text-[var(--text-muted)] italic">
                        "{s.notes}"
                      </p>
                    )}
                    <p className="text-[11px] text-[var(--text-muted)] opacity-75">
                      {formatDisplayDate(s.started_at)}
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-sm font-mono font-medium text-[var(--accent-main)]">
                      {formatDuration(s.actual_duration_seconds)}
                    </span>
                    <span className="block text-[10px] text-emerald-600 dark:text-emerald-400">
                      Completed
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
