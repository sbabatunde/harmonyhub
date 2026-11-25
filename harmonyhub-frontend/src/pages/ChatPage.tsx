import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/store/authStore";
import { useChatRooms } from "@/hooks/useChatRooms";
import { useChatMessages } from "@/hooks/useChatMessages";
import { ChatSidebar } from "@/components/chat/ChatSidebar";
import { ChatWindow } from "@/components/chat/ChatWindow";
import { NewChatModal } from "@/components/chat/NewChatModal";

interface TypingPayload {
  user_id: number;
  user_name: string;
  typing: boolean;
}

export default function ChatPage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const roomsQuery = useChatRooms();
  const [activeRoomId, setActiveRoomId] = useState<number | null>(null);
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);
  const [typing, setTyping] = useState<TypingPayload | null>(null);

  const rooms = roomsQuery.data ?? [];
  const activeRoom = useMemo(
    () => rooms.find((r) => r.id === activeRoomId) ?? null,
    [rooms, activeRoomId],
  );

  const chat = useChatMessages(activeRoomId);

  // Subscribe to the typing cache for the active room
  useEffect(() => {
    if (!activeRoomId) {
      setTyping(null);
      return;
    }

    const key = ["chat", "typing", activeRoomId];
    setTyping(qc.getQueryData<TypingPayload>(key) ?? null);

    const unsubscribe = qc.getQueryCache().subscribe((event) => {
      if (
        event.type === "updated" &&
        Array.isArray(event.query.queryKey) &&
        event.query.queryKey[0] === "chat" &&
        event.query.queryKey[1] === "typing" &&
        event.query.queryKey[2] === activeRoomId
      ) {
        setTyping(qc.getQueryData<TypingPayload>(key) ?? null);
      }
    });

    return unsubscribe;
  }, [activeRoomId, qc]);

  const typingName =
    typing && typing.typing && typing.user_id !== user?.id
      ? typing.user_name
      : null;

  if (!user) {
    navigate("/login", { replace: true });
    return null;
  }

  return (
    <div className="h-[calc(100vh-6rem)] flex overflow-hidden rounded-xl border border-loft-plum-100 bg-white shadow-sm">
      <ChatSidebar
        rooms={rooms}
        activeRoomId={activeRoomId}
        currentUserId={user.id}
        isLoading={roomsQuery.isLoading}
        onSelect={setActiveRoomId}
        onNewChat={() => setIsNewChatOpen(true)}
      />

      {activeRoom ? (
        <ChatWindow
          room={activeRoom}
          currentUserId={user.id}
          messages={chat.messages}
          isLoading={chat.isLoading}
          isSending={chat.sendText.isPending || chat.sendVoice.isPending}
          onSendText={(payload) => chat.sendText.mutate(payload)}
          onSendVoice={(payload) => chat.sendVoice.mutate(payload)}
          onEdit={(id, content) =>
            chat.editText.mutate({ messageId: id, content })
          }
          onDelete={(id) => chat.deleteMessage.mutate(id)}
          onPin={(id, pinned) =>
            chat.pinMessage.mutate({ messageId: id, pinned })
          }
          onForward={(message) => {
            // Placeholder — wire to a "forward to room" modal in Pass 2C
            window.alert(
              `Forward message #${message.id} — forwarding UI coming in Pass 2C`,
            );
          }}
          onReplyPrivately={(message) => {
            // Placeholder — creates/finds a DM with the sender, then opens it
            window.alert(
              `Reply privately to ${message.sender_name} — DM flow coming in Pass 2C`,
            );
          }}
          typingName={typingName}
          onBack={() => setActiveRoomId(null)}
        />
      ) : (
        <section className="hidden md:flex flex-1 items-center justify-center bg-gradient-to-br from-loft-plum-50 to-white">
          <div className="text-center">
            <div className="h-16 w-16 mx-auto rounded-full bg-loft-plum-100 flex items-center justify-center mb-4">
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="text-loft-plum-600"
              >
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <h2 className="font-display text-xl text-loft-plum-900">
              Select a conversation
            </h2>
            <p className="text-sm text-loft-plum-500 mt-1">
              Pick a chat from the sidebar, or start a new one.
            </p>
          </div>
        </section>
      )}

      <NewChatModal
        isOpen={isNewChatOpen}
        onClose={() => setIsNewChatOpen(false)}
        onCreated={(roomId) => setActiveRoomId(roomId)}
      />
    </div>
  );
}
