import type { ChatMessage } from "@/types";
import { VoicePlayer } from "./VoicePlayer";

interface MessageBubbleProps {
  message: ChatMessage;
  isMine: boolean;
  showSender: boolean;
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function MessageBubble({
  message,
  isMine,
  showSender,
}: MessageBubbleProps) {
  const isPending = message.id < 0;

  return (
    <div
      className={`flex w-full animate-[fadeIn_180ms_ease-out] ${
        isMine ? "justify-end" : "justify-start"
      }`}
    >
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

        <div
          className={`rounded-2xl px-4 py-2.5 shadow-sm transition-opacity ${
            isMine
              ? "bg-loft-plum-600 text-white rounded-tr-sm"
              : "bg-white text-loft-plum-900 rounded-tl-sm border border-loft-plum-100"
          } ${isPending ? "opacity-60" : ""}`}
        >
          {message.type === "text" && message.content && (
            <p className="text-sm whitespace-pre-wrap break-words">
              {message.content}
            </p>
          )}

          {message.type === "voice" && message.voice_duration_ms && (
            <VoicePlayer
              roomId={message.room_id}
              messageId={message.id}
              durationMs={message.voice_duration_ms}
              isMine={isMine}
            />
          )}
        </div>

        <span
          className={`text-[11px] mt-1 px-1 tabular-nums ${
            isMine ? "text-loft-plum-400" : "text-loft-plum-400"
          }`}
        >
          {isPending ? "Sending…" : formatTime(message.created_at)}
        </span>
      </div>
    </div>
  );
}
