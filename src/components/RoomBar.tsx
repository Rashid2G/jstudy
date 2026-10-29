import React from 'react';
import { Room } from '../types/index.js';
import { Plus, Sliders, Sparkles } from 'lucide-react';

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
    <div className="flex items-center justify-between gap-2 overflow-x-auto py-1 scrollbar-none">
      <div className="flex items-center gap-1.5 flex-wrap sm:flex-nowrap">
        <span className="text-xs font-medium uppercase tracking-wider text-[var(--text-muted)] mr-1 hidden sm:inline-block">
          Rooms:
        </span>
        {rooms.map((room) => {
          const isActive = room.id === activeRoomId;
          return (
            <button
              key={room.id}
              onClick={() => onSelectRoom(room.id)}
              className={`px-3 py-1.5 rounded-xl text-xs transition-all whitespace-nowrap flex items-center gap-1.5 border ${
                isActive
                  ? 'bg-[var(--accent-main)] text-white border-[var(--accent-main)] shadow-sm font-medium'
                  : 'bg-[var(--bg-card)] text-[var(--text-main)] border-[var(--border-subtle)] hover:border-[var(--accent-main)] hover:bg-[var(--bg-card-subtle)]'
              }`}
            >
              <span>{room.name}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isActive ? 'bg-black/20 text-white' : 'bg-[var(--bg-card-subtle)] text-[var(--text-muted)]'}`}>
                {room.timer_work_minutes}m
              </span>
            </button>
          );
        })}

        <button
          onClick={onOpenCreateModal}
          className="px-2.5 py-1.5 rounded-xl text-xs bg-[var(--bg-card-subtle)] text-[var(--text-muted)] hover:text-[var(--text-main)] border border-dashed border-[var(--border-subtle)] hover:border-[var(--accent-main)] transition-colors flex items-center gap-1"
          title="Create New Custom Room"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Room</span>
        </button>
      </div>

      <button
        onClick={onOpenEditModal}
        className="px-2.5 py-1.5 rounded-xl text-xs text-[var(--text-muted)] hover:text-[var(--text-main)] bg-[var(--bg-card)] border border-[var(--border-subtle)] hover:bg-[var(--bg-card-subtle)] transition-colors flex items-center gap-1.5 shrink-0"
        title="Customize active room"
      >
        <Sliders className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Customize Room</span>
      </button>
    </div>
  );
};
