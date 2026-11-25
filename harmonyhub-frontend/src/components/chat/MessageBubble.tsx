import { Link } from "react-router-dom";
import type { ChatMessage, ChatRoomMember } from "@/types";
import { VoicePlayer } from "./VoicePlayer";
import { MessageActions, type MessageAction } from "./MessageActions";
import { renderMessageContent } from "./renderMessageContent";
import { useSwipeToReply } from "@/hooks/useSwipeToReply";

interface MessageBubbleProps {
  message: ChatMessage;
  isMine: boolean;
  showSender: boolean;
  members: ChatRoomMember[];
  currentUserId: number;
  isSelected: boolean;
  onAction: (action: MessageAction, message: ChatMessage) => void;
  onToggleSelect?: (message: ChatMessage) => void;
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function canEditMessage(m: ChatMessage, currentUserId: number): boolean {
  if (m.sender_id !== currentUserId) return false;
  if (m.type !== "text") return false;
  if (m.deleted_at) return false;
  return Date.now() - new Date(m.created_at).getTime() <= 10 * 60_000;
}

export function MessageBubble({
  message,
  isMine,
  showSender,
  members,
  currentUserId,
  isSelected,
  onAction,
  onToggleSelect,
}: MessageBubbleProps) {
  const isPending = message.id < 0;
  const isDeleted = !!message.deleted_at;
  const canEdit = canEditMessage(message, currentUserId);
  const canDelete =
    isMine || members.some((m) => m.id === currentUserId && m.role === "admin");
  const canPin = !isDeleted;

  const { ref: swipeRef, offsetX } = useSwipeToReply({
    onSwipeRight: () => {
      if (!isDeleted && message.id > 0) {
        onAction("reply", message);
      }
    },
    threshold: 60,
  });

  return (
    <div
      ref={swipeRef}
      className={`group relative flex w-full ${
        isMine ? "justify-end" : "justify-start"
      } ${isSelected ? "bg-loft-plum-50/60" : ""}`}
      style={{
        transform: offsetX ? `translateX(${offsetX * 0.4}px)` : undefined,
        transition: offsetX ? "none" : "transform 150ms ease-out",
      }}
    >
      {/* Swipe-to-reply arrow */}
      {offsetX > 20 && (
        <div
          className="absolute left-2 top-1/2 -translate-y-1/2 text-loft-plum-400 pointer-events-none"
          style={{ opacity: Math.min(offsetX / 60, 1) }}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M9 17l-6-5 6-5M3 12h12a6 6 0 0 1 6 6v1" />
          </svg>
        </div>
      )}

      {onToggleSelect && !isDeleted && (
        <button
          type="button"
          onClick={() => onToggleSelect(message)}
          className={`self-center mx-2 h-5 w-5 rounded-full border-2 flex items-center justify-center transition-opacity ${
            isSelected
              ? "bg-loft-plum-600 border-loft-plum-600 opacity-100"
              : "border-loft-plum-300 opacity-0 group-hover:opacity-100"
          }`}
          aria-label={isSelected ? "Deselect message" : "Select message"}
        >
          {isSelected && (
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
        </button>
      )}

      <div
        className={`flex flex-col max-w-[75%] ${
          isMine ? "items-end" : "items-start"
        }`}
      >
        {showSender && !isMine && (
          <span className="text-xs font-medium text-loft-plum-600 mb-1 px-1">
            {message.sender_name}
          </span>
        )}

        <div className="flex items-end gap-1.5">
          {!isMine && !isDeleted && (
            <div className="opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
              <MessageActions
                message={message}
                isMine={isMine}
                canEdit={canEdit}
                canDelete={canDelete}
                canPin={canPin}
                align="left"
                onAction={(a) => onAction(a, message)}
              />
            </div>
          )}

          <div
            className={`relative rounded-2xl shadow-sm transition-opacity ${
              isMine
                ? "bg-loft-plum-600 text-white rounded-tr-sm"
                : "bg-white text-loft-plum-900 rounded-tl-sm border border-loft-plum-100"
            } ${isPending ? "opacity-60" : ""} ${
              isDeleted ? "italic opacity-70" : ""
            }`}
          >
            {message.pinned_at && (
              <span className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-brass-gold-400 text-white flex items-center justify-center shadow">
                <svg
                  width="10"
                  height="10"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M12 2l3 7 7 .5-5 5 2 8-7-4-7 4 2-8-5-5 7-.5z" />
                </svg>
              </span>
            )}

            <div className="px-4 py-2.5 space-y-2">
              {message.forwarded_from && (
                <div
                  className={`flex items-center gap-1.5 text-[11px] ${
                    isMine ? "text-white/70" : "text-loft-plum-500"
                  }`}
                >
                  <svg
                    width="11"
                    height="11"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M15 17l6-5-6-5M21 12H9a6 6 0 0 0-6 6v1" />
                  </svg>
                  Forwarded from{" "}
                  {message.forwarded_from.sender_name ?? "someone"}
                </div>
              )}

              {message.reply_to && (
                <div
                  className={`border-l-2 pl-2 py-1 rounded-r ${
                    isMine
                      ? "border-white/40 bg-white/10"
                      : "border-loft-plum-400 bg-loft-plum-50"
                  }`}
                >
                  <p
                    className={`text-[11px] font-medium ${
                      isMine ? "text-white/80" : "text-loft-plum-700"
                    }`}
                  >
                    {message.reply_to.sender_name ?? "someone"}
                  </p>
                  <p
                    className={`text-xs truncate max-w-[200px] ${
                      isMine ? "text-white/70" : "text-loft-plum-500"
                    }`}
                  >
                    {message.reply_to.type === "voice"
                      ? "🎤 Voice message"
                      : (message.reply_to.content?.replace(/<[^>]*>/g, "") ??
                        "(empty)")}
                  </p>
                </div>
              )}

              {isDeleted ? (
                <p className="text-sm italic opacity-70">
                  This message was deleted
                </p>
              ) : message.type === "text" ? (
                renderMessageContent(message.content ?? "", {
                  members,
                  isMine,
                })
              ) : message.type === "voice" && message.voice_duration_ms ? (
                <VoicePlayer
                  roomId={message.room_id}
                  messageId={message.id}
                  durationMs={message.voice_duration_ms}
                  isMine={isMine}
                />
              ) : null}

              {message.song && !isDeleted && (
                <Link
                  to={`/songs/${message.song.id}`}
                  onClick={(e) => e.stopPropagation()}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2 transition-colors ${
                    isMine
                      ? "bg-white/15 hover:bg-white/25"
                      : "bg-brass-gold-50 hover:bg-brass-gold-100 border border-brass-gold-200"
                  }`}
                >
                  <div
                    className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${
                      isMine
                        ? "bg-white/20"
                        : "bg-brass-gold-200 text-brass-gold-800"
                    }`}
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M9 18V5l12-2v13" />
                      <circle cx="6" cy="18" r="3" />
                      <circle cx="18" cy="16" r="3" />
                    </svg>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p
                      className={`text-sm font-medium truncate ${
                        isMine ? "text-white" : "text-brass-gold-900"
                      }`}
                    >
                      {message.song.title}
                    </p>
                    {message.song.artist && (
                      <p
                        className={`text-xs truncate ${
                          isMine ? "text-white/70" : "text-brass-gold-700"
                        }`}
                      >
                        {message.song.artist}
                      </p>
                    )}
                  </div>
                </Link>
              )}
            </div>
          </div>

          {isMine && !isDeleted && (
            <div className="opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
              <MessageActions
                message={message}
                isMine={isMine}
                canEdit={canEdit}
                canDelete={canDelete}
                canPin={canPin}
                align="right"
                onAction={(a) => onAction(a, message)}
              />
            </div>
          )}
        </div>

        <span className="text-[11px] mt-1 px-1 tabular-nums text-loft-plum-400">
          {isPending ? "Sending…" : formatTime(message.created_at)}
          {message.edited_at && !message.deleted_at && " · edited"}
          {message.pinned_at && " · pinned"}
        </span>
      </div>
    </div>
  );
}
