import { useEffect, useRef, useState } from "react";
import { chatService } from "@/api/services/chatService";

interface VoicePlayerProps {
  roomId: number;
  messageId: number;
  durationMs: number;
  isMine: boolean;
}

function formatDuration(ms: number): string {
  const total = Math.round(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function VoicePlayer({
  roomId,
  messageId,
  durationMs,
  isMine,
}: VoicePlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0); // 0..1
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onTime = () => {
      if (audio.duration > 0) {
        setProgress(audio.currentTime / audio.duration);
      }
    };
    const onEnd = () => {
      setIsPlaying(false);
      setProgress(0);
    };
    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("ended", onEnd);
    return () => {
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("ended", onEnd);
    };
  }, []);

  const toggle = async () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
      return;
    }
    try {
      if (!audio.src) {
        setLoading(true);
        const url = await chatService.getVoiceUrl(roomId, messageId);
        audio.src = url;
      }
      await audio.play();
      setIsPlaying(true);
    } catch (e) {
      setError((e as Error).message || "Could not play message");
    } finally {
      setLoading(false);
    }
  };

  const bubbleTint = isMine
    ? "bg-loft-plum-600 text-white"
    : "bg-loft-plum-100 text-loft-plum-900";

  return (
    <div className={`flex items-center gap-3 min-w-[180px] ${bubbleTint}`}>
      <button
        type="button"
        onClick={toggle}
        disabled={loading}
        className={`shrink-0 h-9 w-9 rounded-full flex items-center justify-center transition-transform active:scale-90 ${
          isMine
            ? "bg-white/20 hover:bg-white/30"
            : "bg-white hover:bg-loft-plum-50"
        }`}
        aria-label={isPlaying ? "Pause voice message" : "Play voice message"}
      >
        {loading ? (
          <span className="h-3 w-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
        ) : isPlaying ? (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <rect x="6" y="5" width="4" height="14" rx="1" />
            <rect x="14" y="5" width="4" height="14" rx="1" />
          </svg>
        ) : (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 5v14l11-7z" />
          </svg>
        )}
      </button>

      <div className="flex-1 flex items-center gap-0.5 h-6">
        {Array.from({ length: 24 }).map((_, i) => {
          const height = 6 + ((i * 7) % 14); // pseudo-random but stable
          const active = progress > i / 24;
          return (
            <span
              key={i}
              className={`w-1 rounded-full transition-colors ${
                active
                  ? isMine
                    ? "bg-white"
                    : "bg-loft-plum-600"
                  : isMine
                    ? "bg-white/40"
                    : "bg-loft-plum-300"
              }`}
              style={{ height: `${height}px` }}
            />
          );
        })}
      </div>

      <span className="text-xs tabular-nums shrink-0 opacity-80">
        {formatDuration(durationMs)}
      </span>

      <audio ref={audioRef} preload="none" />

      {error && <span className="text-xs text-ember-coral-600">{error}</span>}
    </div>
  );
}
