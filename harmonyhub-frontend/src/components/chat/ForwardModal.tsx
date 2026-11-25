import { useMemo, useState } from "react";
import type { ChatMessage, ChatRoom } from "@/types";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

interface ForwardModalProps {
  isOpen: boolean;
  message: ChatMessage | null;
  rooms: ChatRoom[];
  currentUserId: number;
  onClose: () => void;
  onForward: (targetRoomId: number) => void;
}

function roomTitle(room: ChatRoom, currentUserId: number): string {
  if (room.name) return room.name;
  const other = room.members.find((m) => m.id !== currentUserId);
  return other?.name ?? "Direct message";
}

export function ForwardModal({
  isOpen,
  message,
  rooms,
  currentUserId,
  onClose,
  onForward,
}: ForwardModalProps) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<number | null>(null);

  const filtered = useMemo(() => {
    if (!search.trim()) return rooms;
    const q = search.toLowerCase();
    return rooms.filter((r) =>
      roomTitle(r, currentUserId).toLowerCase().includes(q),
    );
  }, [rooms, search, currentUserId]);

  const handleClose = () => {
    setSearch("");
    setSelected(null);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Forward to…" size="lg">
      <div className="space-y-4">
        {message && (
          <div className="px-3 py-2 rounded-lg bg-loft-plum-50 border-l-2 border-loft-plum-400">
            <p className="text-xs font-medium text-loft-plum-700">
              {message.sender_name ?? "someone"}
            </p>
            <p className="text-xs text-loft-plum-500 line-clamp-2">
              {message.type === "voice"
                ? "🎤 Voice message"
                : (message.content?.replace(/<[^>]*>/g, "") ?? "(empty)")}
            </p>
          </div>
        )}

        <Input
          placeholder="Search conversations…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          autoFocus
        />

        <div className="max-h-72 overflow-y-auto rounded-xl border border-loft-plum-100 divide-y divide-loft-plum-100">
          {filtered.length === 0 ? (
            <p className="p-6 text-center text-sm text-loft-plum-500">
              No conversations found.
            </p>
          ) : (
            filtered.map((room) => {
              const active = room.id === selected;
              return (
                <button
                  key={room.id}
                  type="button"
                  onClick={() => setSelected(room.id)}
                  className={`w-full text-left px-4 py-3 flex items-center gap-3 transition-colors ${
                    active ? "bg-loft-plum-50" : "hover:bg-loft-plum-50/60"
                  }`}
                >
                  <div className="h-9 w-9 shrink-0 rounded-full bg-brass-gold-100 text-brass-gold-700 flex items-center justify-center font-semibold">
                    {roomTitle(room, currentUserId).charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-loft-plum-900 truncate">
                      {roomTitle(room, currentUserId)}
                    </p>
                    <p className="text-xs text-loft-plum-500">
                      {room.is_group
                        ? `${room.members.length} members`
                        : "Direct"}
                    </p>
                  </div>
                  <span
                    className={`h-5 w-5 rounded-full border-2 flex items-center justify-center ${
                      active
                        ? "bg-loft-plum-600 border-loft-plum-600"
                        : "border-loft-plum-300"
                    }`}
                  >
                    {active && (
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="white"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M20 6L9 17l-5-5" />
                      </svg>
                    )}
                  </span>
                </button>
              );
            })
          )}
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={handleClose} type="button">
            Cancel
          </Button>
          <Button
            variant="primary"
            type="button"
            disabled={selected === null}
            onClick={() => {
              if (selected !== null) {
                onForward(selected);
                handleClose();
              }
            }}
          >
            Forward
          </Button>
        </div>
      </div>
    </Modal>
  );
}
