import { useEffect, useMemo, useRef, useState } from "react";
// import { useQuery } from "@tanstack/react-query";
import type { ChatRoom, ChatMessage } from "@/types";
import { MessageBubble } from "./MessageBubble";
import { VoiceRecorder } from "./VoiceRecorder";
import { TypingIndicator } from "./TypingIndicator";

interface ChatWindowProps {
  room: ChatRoom;
  currentUserId: number;
  messages: ChatMessage[];
  isLoading: boolean;
  isSending: boolean;
  onSendText: (content: string) => void;
  onSendVoice: (payload: {
    blob: Blob;
    mime: string;
    durationMs: number;
  }) => void;
  typingName: string | null;
}

function groupMessages(messages: ChatMessage[]) {
  return messages.map((m, i) => {
    const prev = messages[i - 1];
    const showSender =
      !prev ||
      prev.sender_id !== m.sender_id ||
      new Date(m.created_at).getTime() - new Date(prev.created_at).getTime() >
        5 * 60 * 1000;
    return { message: m, showSender };
  });
}

export function ChatWindow({
  room,
  currentUserId,
  messages,
  isLoading,
  isSending,
  onSendText,
  onSendVoice,
  typingName,
}: ChatWindowProps) {
  const [draft, setDraft] = useState("");
  const [showRecorder, setShowRecorder] = useState(false);
  const listRef = useRef<HTMLDivElement | null>(null);

  const grouped = useMemo(() => groupMessages(messages), [messages]);

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages.length]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = draft.trim();
    if (!trimmed || isSending) return;
    onSendText(trimmed);
    setDraft("");
  };

  return (
    <section className="flex-1 flex flex-col min-w-0 bg-gradient-to-b from-loft-plum-50/40 to-white">
      {/* Header */}
      <header className="px-6 py-4 border-b border-loft-plum-100 bg-white/80 backdrop-blur">
        <h3 className="font-display text-lg text-loft-plum-900">
          {(room.name ??
            room.members
              .filter((m) => m.id !== currentUserId)
              .map((m) => m.name)
              .join(", ")) ||
            "Conversation"}
        </h3>
        <p className="text-xs text-loft-plum-500">
          {room.is_group ? `${room.members.length} members` : "Direct message"}
        </p>
      </header>

      {/* Messages */}
      <div
        ref={listRef}
        className="flex-1 overflow-y-auto px-6 py-4 space-y-1 scroll-smooth"
      >
        {isLoading ? (
          <div className="h-full flex items-center justify-center">
            <span className="h-8 w-8 border-2 border-loft-plum-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : grouped.length === 0 ? (
          <div className="h-full flex items-center justify-center text-loft-plum-400 text-sm">
            No messages yet. Say hi 👋
          </div>
        ) : (
          grouped.map(({ message, showSender }) => (
            <MessageBubble
              key={message.id}
              message={message}
              isMine={message.sender_id === currentUserId}
              showSender={showSender}
            />
          ))
        )}
        {typingName && <TypingIndicator name={typingName} />}
      </div>

      {/* Composer */}
      <footer className="border-t border-loft-plum-100 bg-white/90 backdrop-blur px-4 py-3">
        {showRecorder ? (
          <VoiceRecorder
            onComplete={(payload) => {
              onSendVoice(payload);
              setShowRecorder(false);
            }}
            onCancel={() => setShowRecorder(false)}
            disabled={isSending}
          />
        ) : (
          <form onSubmit={handleSubmit} className="flex items-end gap-2">
            <button
              type="button"
              onClick={() => setShowRecorder(true)}
              disabled={isSending}
              className="shrink-0 h-11 w-11 rounded-full bg-loft-plum-100 text-loft-plum-700 hover:bg-loft-plum-200 disabled:opacity-50 flex items-center justify-center transition-colors"
              aria-label="Record voice message"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <rect x="9" y="3" width="6" height="12" rx="3" />
                <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
              </svg>
            </button>

            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
              placeholder="Write a message…"
              rows={1}
              className="flex-1 resize-none rounded-2xl border border-loft-plum-200 bg-loft-plum-50/50 px-4 py-3 text-sm text-loft-plum-900 placeholder:text-loft-plum-400 focus:outline-none focus:ring-2 focus:ring-loft-plum-400 max-h-32"
              disabled={isSending}
            />

            <button
              type="submit"
              disabled={!draft.trim() || isSending}
              className="shrink-0 h-11 w-11 rounded-full bg-loft-plum-600 text-white hover:bg-loft-plum-700 disabled:opacity-50 flex items-center justify-center transition-transform active:scale-90"
              aria-label="Send message"
            >
              {isSending ? (
                <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M3 20l18-8L3 4v6l12 2-12 2z" />
                </svg>
              )}
            </button>
          </form>
        )}
      </footer>
    </section>
  );
}
