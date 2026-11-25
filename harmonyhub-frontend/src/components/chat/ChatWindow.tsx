import { useEffect, useMemo, useRef, useState } from "react";
import { chatService } from "@/api/services/chatService";
import type { ChatRoom, ChatMessage, Song } from "@/types";
import { MessageBubble } from "./MessageBubble";
import { VoiceRecorder } from "./VoiceRecorder";
import { TypingIndicator } from "./TypingIndicator";
import { EmojiPicker } from "./EmojiPicker";
import { SongPicker } from "./SongPicker";
import { RichComposer } from "./RichComposer";
import type { MessageAction } from "./MessageActions";
import { textOfHtml } from "@/utils/html";

interface SendPayload {
  content?: string;
  reply_to_id?: number;
  forwarded_from_id?: number;
  song_id?: number;
}

interface ChatWindowProps {
  room: ChatRoom;
  currentUserId: number;
  messages: ChatMessage[];
  isLoading: boolean;
  isSending: boolean;
  onSendText: (payload: SendPayload) => void;
  onSendVoice: (payload: {
    blob: Blob;
    mime: string;
    durationMs: number;
  }) => void;
  onEdit: (messageId: number, content: string) => void;
  onDelete: (messageId: number) => void;
  onPin: (messageId: number, pinned: boolean) => void;
  onForward: (message: ChatMessage) => void;
  onReplyPrivately: (message: ChatMessage) => void;
  typingName: string | null;
  onBack?: () => void;
  pinnedCount?: number;
  onOpenPinned?: () => void;
}

type GroupedItem =
  | { kind: "separator"; date: string; key: string }
  | { kind: "message"; message: ChatMessage; showSender: boolean; key: string };

function formatDateSeparator(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function groupMessages(messages: ChatMessage[]): GroupedItem[] {
  const items: GroupedItem[] = [];
  let lastDay: string | null = null;
  messages.forEach((m, i) => {
    const day = new Date(m.created_at).toDateString();
    if (day !== lastDay) {
      items.push({
        kind: "separator",
        date: m.created_at,
        key: `sep-${day}`,
      });
      lastDay = day;
    }
    const prev = messages[i - 1];
    const showSender =
      !prev ||
      prev.sender_id !== m.sender_id ||
      new Date(m.created_at).getTime() - new Date(prev.created_at).getTime() >
        5 * 60_000;
    items.push({ kind: "message", message: m, showSender, key: `msg-${m.id}` });
  });
  return items;
}

export function ChatWindow({
  room,
  currentUserId,
  messages,
  isLoading,
  isSending,
  onSendText,
  onSendVoice,
  onEdit,
  onDelete,
  onPin,
  onForward,
  onReplyPrivately,
  typingName,
  onBack,
  pinnedCount,
  onOpenPinned,
}: ChatWindowProps) {
  const [draft, setDraft] = useState("");
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
  const [editing, setEditing] = useState<ChatMessage | null>(null);
  const [songAttachment, setSongAttachment] = useState<Song | null>(null);
  const [showRecorder, setShowRecorder] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [showSongPicker, setShowSongPicker] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [richMode, setRichMode] = useState<boolean>(() => {
    return localStorage.getItem("chat.richMode") !== "false";
  });

  const listRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTypingSentRef = useRef(false);

  useEffect(() => {
    localStorage.setItem("chat.richMode", String(richMode));
  }, [richMode]);

  const visibleMessages = useMemo(() => {
    if (!search.trim()) return messages;
    const q = search.toLowerCase();
    return messages.filter(
      (m) =>
        textOfHtml(m.content ?? "")
          .toLowerCase()
          .includes(q) || (m.sender_name ?? "").toLowerCase().includes(q),
    );
  }, [messages, search]);

  const grouped = useMemo(
    () => groupMessages(visibleMessages),
    [visibleMessages],
  );

  useEffect(() => {
    if (search.trim()) return;
    const el = listRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages.length, search]);

  useEffect(() => {
    if (!draft.trim()) {
      if (lastTypingSentRef.current) {
        chatService.notifyTyping(room.id, false).catch(() => {});
        lastTypingSentRef.current = false;
      }
      return;
    }
    if (!lastTypingSentRef.current) {
      chatService.notifyTyping(room.id, true).catch(() => {});
      lastTypingSentRef.current = true;
    }
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      chatService.notifyTyping(room.id, false).catch(() => {});
      lastTypingSentRef.current = false;
    }, 2500);
    return () => {
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    };
  }, [draft, room.id]);

  const clearComposer = () => {
    setDraft("");
    setReplyTo(null);
    setSongAttachment(null);
    setEditing(null);
    lastTypingSentRef.current = false;
  };

  const isEmptyDraft = (() => {
    const t = draft.trim();
    return richMode ? t === "" || t === "<p></p>" : t === "";
  })();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editing) {
      if (isEmptyDraft || draft.trim() === editing.content) {
        clearComposer();
        return;
      }
      onEdit(editing.id, draft.trim());
      clearComposer();
      return;
    }
    if (isEmptyDraft && !songAttachment) return;
    if (isSending) return;
    onSendText({
      content: isEmptyDraft ? undefined : draft.trim(),
      reply_to_id: replyTo?.id,
      song_id: songAttachment?.id,
    });
    clearComposer();
  };

  const startReply = (m: ChatMessage) => {
    setReplyTo(m);
    setEditing(null);
    textareaRef.current?.focus();
  };

  const startEdit = (m: ChatMessage) => {
    setRichMode(true);
    setEditing(m);
    setDraft(m.content ?? "");
    setReplyTo(null);
    setTimeout(() => textareaRef.current?.focus(), 0);
  };

  const handleAction = (action: MessageAction, m: ChatMessage) => {
    switch (action) {
      case "reply":
        startReply(m);
        break;
      case "reply_privately":
        onReplyPrivately(m);
        break;
      case "forward":
        onForward(m);
        break;
      case "pin":
        onPin(m.id, true);
        break;
      case "unpin":
        onPin(m.id, false);
        break;
      case "edit":
        startEdit(m);
        break;
      case "delete":
        if (window.confirm("Delete this message?")) onDelete(m.id);
        break;
      case "select":
        toggleSelect(m);
        break;
      case "copy":
        if (m.content)
          navigator.clipboard.writeText(textOfHtml(m.content)).catch(() => {});
        break;
      case "copy_link":
        navigator.clipboard
          .writeText(`${window.location.origin}/chat#message-${m.id}`)
          .catch(() => {});
        break;
    }
  };

  const toggleSelect = (m: ChatMessage) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(m.id)) next.delete(m.id);
      else next.add(m.id);
      return next;
    });
  };

  const selectionMode = selectedIds.size > 0;
  const title =
    room.name ??
    room.members
      .filter((m) => m.id !== currentUserId)
      .map((m) => m.name)
      .join(", ") ??
    "Conversation";

  return (
    <section className="flex-1 flex flex-col min-w-0 bg-gradient-to-b from-loft-plum-50/40 to-white">
      {/* Header */}
      <header className="px-3 md:px-6 py-3 md:py-4 border-b border-loft-plum-100 bg-white/80 backdrop-blur flex items-center gap-1">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="md:hidden p-2 -ml-1 rounded-lg hover:bg-loft-plum-100 text-loft-plum-700"
            aria-label="Back"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <path d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}
        <div className="flex-1 min-w-0">
          {selectionMode ? (
            <h3 className="font-display text-base md:text-lg text-loft-plum-900">
              {selectedIds.size} selected
            </h3>
          ) : (
            <>
              <h3 className="font-display text-base md:text-lg text-loft-plum-900 truncate">
                {title}
              </h3>
              <p className="text-xs text-loft-plum-500">
                {room.is_group
                  ? `${room.members.length} members`
                  : "Direct message"}
              </p>
            </>
          )}
        </div>

        {selectionMode ? (
          <button
            type="button"
            onClick={() => setSelectedIds(new Set())}
            className="text-xs font-medium text-loft-plum-600 hover:text-loft-plum-800 px-2"
          >
            Cancel
          </button>
        ) : (
          <>
            {onOpenPinned && (
              <button
                type="button"
                onClick={onOpenPinned}
                className="relative p-2 rounded-lg hover:bg-loft-plum-100 text-loft-plum-600"
                aria-label="Pinned messages"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M12 2l3 7 7 .5-5 5 2 8-7-4-7 4 2-8-5-5 7-.5z" />
                </svg>
                {!!pinnedCount && pinnedCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 h-4 min-w-[16px] px-1 rounded-full bg-brass-gold-400 text-white text-[10px] font-bold flex items-center justify-center">
                    {pinnedCount}
                  </span>
                )}
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                setSearchOpen((v) => !v);
                if (searchOpen) setSearch("");
              }}
              className={`p-2 rounded-lg transition-colors ${
                searchOpen
                  ? "bg-loft-plum-100 text-loft-plum-800"
                  : "hover:bg-loft-plum-100 text-loft-plum-600"
              }`}
              aria-label="Search messages"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-3.5-3.5" />
              </svg>
            </button>
          </>
        )}
      </header>

      {/* Search bar */}
      {searchOpen && !selectionMode && (
        <div className="px-3 md:px-6 py-2 border-b border-loft-plum-100 bg-loft-plum-50/60">
          <div className="relative">
            <input
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search messages…"
              className="w-full pl-3 pr-9 py-2 rounded-lg border border-loft-plum-200 bg-white text-sm focus:ring-2 focus:ring-loft-plum-400 focus:outline-none"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-loft-plum-100 text-loft-plum-500"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            )}
          </div>
          {search && (
            <p className="text-xs text-loft-plum-500 mt-1">
              {visibleMessages.length} result
              {visibleMessages.length === 1 ? "" : "s"}
            </p>
          )}
        </div>
      )}

      {/* Messages */}
      <div
        ref={listRef}
        className="flex-1 overflow-y-auto px-3 md:px-6 py-3 md:py-4 space-y-1 scroll-smooth"
      >
        {isLoading ? (
          <div className="h-full flex items-center justify-center">
            <span className="h-8 w-8 border-2 border-loft-plum-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : grouped.length === 0 ? (
          <div className="h-full flex items-center justify-center text-loft-plum-400 text-sm">
            {search
              ? "No messages match your search."
              : "No messages yet. Say hi 👋"}
          </div>
        ) : (
          grouped.map((item) =>
            item.kind === "separator" ? (
              <div key={item.key} className="flex items-center gap-3 py-3">
                <div className="flex-1 h-px bg-loft-plum-100" />
                <span className="text-[11px] font-medium uppercase tracking-wide text-loft-plum-400">
                  {formatDateSeparator(item.date)}
                </span>
                <div className="flex-1 h-px bg-loft-plum-100" />
              </div>
            ) : (
              <MessageBubble
                key={item.key}
                message={item.message}
                isMine={item.message.sender_id === currentUserId}
                showSender={item.showSender}
                members={room.members}
                currentUserId={currentUserId}
                isSelected={selectedIds.has(item.message.id)}
                onAction={handleAction}
                onToggleSelect={selectionMode ? toggleSelect : undefined}
              />
            ),
          )
        )}
        {typingName && <TypingIndicator name={typingName} />}
      </div>

      {/* Composer */}
      <footer className="border-t border-loft-plum-100 bg-white/90 backdrop-blur px-3 md:px-4 py-3 relative">
        {selectionMode && (
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs text-loft-plum-600 flex-1">
              {selectedIds.size} message{selectedIds.size === 1 ? "" : "s"}{" "}
              selected
            </span>
            <button
              type="button"
              onClick={() => {
                const msgs = messages.filter((m) => selectedIds.has(m.id));
                msgs.forEach((m) => onDelete(m.id));
                setSelectedIds(new Set());
              }}
              className="text-xs px-3 py-1.5 rounded-lg bg-ember-coral-50 text-ember-coral-700 hover:bg-ember-coral-100"
            >
              Delete
            </button>
          </div>
        )}

        {showRecorder ? (
          <VoiceRecorder
            onComplete={(p) => {
              onSendVoice(p);
              setShowRecorder(false);
            }}
            onCancel={() => setShowRecorder(false)}
            disabled={isSending}
          />
        ) : (
          <>
            {editing && (
              <div className="flex items-center gap-2 mb-2 px-3 py-1.5 rounded-lg bg-brass-gold-50 border border-brass-gold-200">
                <span className="text-xs font-medium text-brass-gold-800">
                  Editing message
                </span>
                <button
                  type="button"
                  onClick={() => clearComposer()}
                  className="ml-auto text-xs text-brass-gold-700 hover:underline"
                >
                  Cancel
                </button>
              </div>
            )}
            {replyTo && !editing && (
              <div className="flex items-start gap-2 mb-2 px-3 py-2 rounded-lg bg-loft-plum-50 border-l-2 border-loft-plum-400">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-loft-plum-700">
                    Replying to {replyTo.sender_name ?? "someone"}
                  </p>
                  <p className="text-xs text-loft-plum-500 truncate">
                    {replyTo.type === "voice"
                      ? "🎤 Voice message"
                      : (replyTo.content?.replace(/<[^>]*>/g, "") ?? "")}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setReplyTo(null)}
                  className="p-1 rounded hover:bg-loft-plum-100 text-loft-plum-500"
                >
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <path d="M6 6l12 12M18 6L6 18" />
                  </svg>
                </button>
              </div>
            )}
            {songAttachment && (
              <div className="flex items-center gap-2 mb-2 px-3 py-2 rounded-lg bg-brass-gold-50 border border-brass-gold-200">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="text-brass-gold-700"
                >
                  <path d="M9 18V5l12-2v13" />
                  <circle cx="6" cy="18" r="3" />
                  <circle cx="18" cy="16" r="3" />
                </svg>
                <span className="text-xs font-medium text-brass-gold-800 flex-1 truncate">
                  {songAttachment.title}
                </span>
                <button
                  type="button"
                  onClick={() => setSongAttachment(null)}
                  className="p-1 rounded hover:bg-brass-gold-100 text-brass-gold-700"
                >
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <path d="M6 6l12 12M18 6L6 18" />
                  </svg>
                </button>
              </div>
            )}

            <form
              onSubmit={handleSubmit}
              className="flex items-end gap-2 relative"
            >
              <button
                type="button"
                onClick={() => setShowSongPicker(true)}
                disabled={isSending || !!editing}
                className="shrink-0 h-11 w-11 rounded-full bg-loft-plum-100 text-loft-plum-700 hover:bg-loft-plum-200 disabled:opacity-50 flex items-center justify-center transition-colors"
                aria-label="Share a song"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M9 18V5l12-2v13" />
                  <circle cx="6" cy="18" r="3" />
                  <circle cx="18" cy="16" r="3" />
                </svg>
              </button>

              <button
                type="button"
                onClick={() => setShowRecorder(true)}
                disabled={isSending || !!editing}
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

              <div className="flex-1 relative">
                {richMode ? (
                  <RichComposer
                    value={draft}
                    onChange={setDraft}
                    onSubmit={() => {
                      const form =
                        document.querySelector<HTMLFormElement>("form");
                      form?.requestSubmit();
                    }}
                    disabled={isSending}
                    placeholder={editing ? "Edit message…" : "Write a message…"}
                  />
                ) : (
                  <textarea
                    ref={textareaRef}
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSubmit(e);
                      }
                    }}
                    placeholder={editing ? "Edit message…" : "Write a message…"}
                    rows={1}
                    className="w-full resize-none rounded-2xl border border-loft-plum-200 bg-loft-plum-50/50 px-4 py-3 pr-16 text-sm text-loft-plum-900 placeholder:text-loft-plum-400 focus:outline-none focus:ring-2 focus:ring-loft-plum-400 max-h-32"
                    disabled={isSending}
                  />
                )}

                <button
                  type="button"
                  onClick={() => setShowEmoji((v) => !v)}
                  className="absolute right-9 bottom-2.5 p-1 rounded hover:bg-loft-plum-100 text-loft-plum-500"
                  aria-label="Emoji"
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <circle cx="12" cy="12" r="9" />
                    <path d="M8 14s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01" />
                  </svg>
                </button>

                <button
                  type="button"
                  onClick={() => setRichMode((v) => !v)}
                  className="absolute right-2 bottom-2.5 p-1 rounded hover:bg-loft-plum-100 text-loft-plum-500 text-[11px] font-bold"
                  title={richMode ? "Plain text" : "Rich text"}
                >
                  {richMode ? "Aa" : "Aa✦"}
                </button>

                {showEmoji && (
                  <EmojiPicker
                    onSelect={(emoji) => setDraft((d) => d + emoji)}
                    onClose={() => setShowEmoji(false)}
                  />
                )}
              </div>

              <button
                type="submit"
                disabled={isEmptyDraft && !songAttachment}
                className="shrink-0 h-11 w-11 rounded-full bg-loft-plum-600 text-white hover:bg-loft-plum-700 disabled:opacity-50 flex items-center justify-center transition-transform active:scale-90"
                aria-label={editing ? "Save edit" : "Send message"}
              >
                {isSending ? (
                  <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : editing ? (
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
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
          </>
        )}
      </footer>

      <SongPicker
        isOpen={showSongPicker}
        onClose={() => setShowSongPicker(false)}
        onSelect={(s) => setSongAttachment(s)}
      />
    </section>
  );
}
