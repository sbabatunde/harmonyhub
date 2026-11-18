import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/store/authStore";
import { useChatRooms } from "@/hooks/useChatRooms";
import { useChatMessages } from "@/hooks/useChatMessages";
import { ChatSidebar } from "@/components/chat/ChatSidebar";
import { ChatWindow } from "@/components/chat/ChatWindow";

interface TypingPayload {
  user_id: number;
  user_name: string;
  typing: boolean;
}

export default function ChatPage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const roomsQuery = useChatRooms();
  const [activeRoomId, setActiveRoomId] = useState<number | null>(null);

  const rooms = roomsQuery.data ?? [];
  const activeRoom = useMemo(
    () => rooms.find((r) => r.id === activeRoomId) ?? null,
    [rooms, activeRoomId],
  );

  const chat = useChatMessages(activeRoomId);

  // typing indicator (from useChatMessages cache)
  const typingQuery = useQuery<TypingPayload | null>({
    queryKey: ["chat", "typing", activeRoomId ?? 0],
    enabled: false,
    queryFn: () => null,
    initialData: null,
  });

  const typingName =
    typingQuery.data &&
    typingQuery.data.typing &&
    typingQuery.data.user_id !== user?.id
      ? typingQuery.data.user_name
      : null;

  const handleNewChat = () => {
    // Minimal MVP: just ask for an email and create a DM.
    const email = window.prompt("Student or teacher email?");
    if (!email) return;
    // Real implementation would look up the user id via an API call; for now,
    // bail out if the rooms list is empty.
    window.alert(
      `Creating a room with ${email} requires a user-lookup endpoint. ` +
        `Once you add GET /api/users?email=…, this can create the room automatically.`,
    );
  };

  if (!user) {
    navigate("/login", { replace: true });
    return null;
  }

  return (
    <div className="h-[calc(100vh-4rem)] flex overflow-hidden rounded-xl border border-loft-plum-100 bg-white shadow-sm">
      <ChatSidebar
        rooms={rooms}
        activeRoomId={activeRoomId}
        isLoading={roomsQuery.isLoading}
        onSelect={setActiveRoomId}
        onNewChat={handleNewChat}
      />

      {activeRoom ? (
        <ChatWindow
          room={activeRoom}
          currentUserId={user.id}
          messages={chat.messages}
          isLoading={chat.isLoading}
          isSending={chat.sendText.isPending || chat.sendVoice.isPending}
          onSendText={(content) => chat.sendText.mutate(content)}
          onSendVoice={(payload) => chat.sendVoice.mutate(payload)}
          typingName={typingName}
        />
      ) : (
        <section className="flex-1 flex items-center justify-center bg-gradient-to-br from-loft-plum-50 to-white">
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
    </div>
  );
}
