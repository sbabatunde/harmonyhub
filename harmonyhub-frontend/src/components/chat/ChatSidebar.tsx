import type { ChatRoom } from "@/types";

interface ChatSidebarProps {
  rooms: ChatRoom[];
  activeRoomId: number | null;
  isLoading: boolean;
  onSelect: (roomId: number) => void;
  onNewChat: () => void;
}

function roomTitle(room: ChatRoom, currentUserId: number): string {
  if (room.name) return room.name;
  const other = room.members.find((m) => m.id !== currentUserId);
  return other?.name ?? "Direct message";
}

function roomSubtitle(room: ChatRoom): string {
  if (room.is_group) {
    return `${room.members.length} members`;
  }
  return "Direct message";
}

function formatRelative(iso?: string | null): string {
  if (!iso) return "";
  const date = new Date(iso);
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return date.toLocaleDateString();
}

export function ChatSidebar({
  rooms,
  activeRoomId,
  isLoading,
  onSelect,
  onNewChat,
}: ChatSidebarProps) {
  if (isLoading) {
    return (
      <aside className="w-80 shrink-0 border-r border-loft-plum-100 bg-loft-plum-50/50 flex items-center justify-center">
        <span className="h-6 w-6 border-2 border-loft-plum-400 border-t-transparent rounded-full animate-spin" />
      </aside>
    );
  }

  return (
    <aside className="w-80 shrink-0 border-r border-loft-plum-100 bg-loft-plum-50/50 flex flex-col">
      <div className="p-4 border-b border-loft-plum-100 flex items-center justify-between">
        <h2 className="font-display text-lg text-loft-plum-900">Messages</h2>
        <button
          type="button"
          onClick={onNewChat}
          className="h-9 w-9 rounded-full bg-loft-plum-600 text-white flex items-center justify-center hover:bg-loft-plum-700 transition-colors shadow-sm"
          aria-label="Start new conversation"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            <path d="M12 5v14M5 12h14" />
          </svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {rooms.length === 0 ? (
          <div className="p-6 text-center text-sm text-loft-plum-500">
            No conversations yet.
            <br />
            Tap <span className="font-semibold">+</span> to start one.
          </div>
        ) : (
          rooms.map((room) => {
            const active = room.id === activeRoomId;
            return (
              <button
                key={room.id}
                type="button"
                onClick={() => onSelect(room.id)}
                className={`w-full text-left px-4 py-3 flex items-start gap-3 transition-colors border-b border-loft-plum-100/60 ${
                  active
                    ? "bg-white border-l-4 border-l-loft-plum-600"
                    : "hover:bg-white/70 border-l-4 border-l-transparent"
                }`}
              >
                <div className="h-10 w-10 shrink-0 rounded-full bg-brass-gold-100 text-brass-gold-700 flex items-center justify-center font-semibold">
                  {roomTitle(room, room.created_by).charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-loft-plum-900 truncate">
                      {roomTitle(room, room.created_by)}
                    </span>
                    <span className="text-xs text-loft-plum-400 shrink-0">
                      {formatRelative(
                        room.latest_message?.created_at ?? room.updated_at,
                      )}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2 mt-0.5">
                    <span className="text-xs text-loft-plum-500 truncate">
                      {room.latest_message?.content ?? roomSubtitle(room)}
                    </span>
                    {!!room.unread_count && room.unread_count > 0 && (
                      <span className="shrink-0 h-5 min-w-[20px] px-1.5 rounded-full bg-ember-coral-500 text-white text-[11px] font-semibold flex items-center justify-center">
                        {room.unread_count}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </aside>
  );
}
