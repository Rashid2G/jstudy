import React from 'react';
import { Room } from '../types/index.js';
import { Plus, SlidersHorizontal } from 'lucide-react';

interface Props {
  rooms: Room[];
  activeRoomId: string | null;
  onSelectRoom: (roomId: string) => void;
  onOpenCreateModal: () => void;
  onOpenEditModal: () => void;
}

export const RoomBar: React.FC<Props> = ({
  rooms,
  activeRoomId,
  onSelectRoom,
  onOpenCreateModal,
  onOpenEditModal,
}) => {
  return (
    <nav
      aria-label="Study rooms"
      className="focus-dimmable flex items-center justify-between gap-3 overflow-x-auto py-1"
    >
      <div className="flex items-center gap-1 flex-wrap">
        {rooms.map((room) => {
          const isActive = room.id === activeRoomId;
          const timingBadge = room.breaks_enabled
            ? `${room.timer_work_minutes}/${room.timer_break_minutes}m`
            : `${room.timer_work_minutes}m`;

          return (
            <button
              key={room.id}
              type="button"
              onClick={() => onSelectRoom(room.id)}
              className={`px-3 py-1.5 rounded-full text-xs transition-all whitespace-nowrap inline-flex items-center gap-1.5 ${
                isActive
                  ? 'bg-[var(--ink-wash-strong)] text-[var(--text-main)] font-medium'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--ink-wash)]'
              }`}
            >
              <span>{room.name}</span>
              <span className="text-[10px] font-mono text-[var(--text-faint)]">
                {timingBadge}
              </span>
            </button>
          );
        })}

        <button
          type="button"
          onClick={onOpenCreateModal}
          className="px-2.5 py-1.5 rounded-full text-xs text-[var(--text-faint)] hover:text-[var(--text-main)] hover:bg-[var(--ink-wash)] transition-colors inline-flex items-center gap-1"
          title="Create custom study room"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Room</span>
        </button>
      </div>

      {activeRoomId && (
        <button
          type="button"
          onClick={onOpenEditModal}
          className="px-2.5 py-1.5 rounded-full text-xs text-[var(--text-faint)] hover:text-[var(--text-main)] hover:bg-[var(--ink-wash)] transition-colors inline-flex items-center gap-1.5 shrink-0"
          title="Edit current room settings"
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Room settings</span>
        </button>
      )}
    </nav>
  );
};
