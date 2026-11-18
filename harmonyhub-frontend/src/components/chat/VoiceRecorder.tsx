import { useVoiceRecorder } from "@/hooks/useVoiceRecorder";

interface VoiceRecorderProps {
  onComplete: (payload: {
    blob: Blob;
    mime: string;
    durationMs: number;
  }) => void;
  onCancel: () => void;
  disabled?: boolean;
}

function formatElapsed(ms: number): string {
  const total = Math.floor(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function VoiceRecorder({
  onComplete,
  onCancel,
  disabled,
}: VoiceRecorderProps) {
  const { isRecording, elapsedMs, error, start, stopAndCollect } =
    useVoiceRecorder();

  const handleMicPress = async () => {
    if (isRecording) {
      stopAndCollect(onComplete);
    } else {
      await start();
    }
  };

  return (
    <div className="flex items-center gap-3 w-full">
      {isRecording ? (
        <>
          <button
            type="button"
            onClick={() => stopAndCollect(onComplete)}
            className="shrink-0 h-11 w-11 rounded-full bg-ember-coral-500 text-white flex items-center justify-center shadow-lg animate-pulse"
            aria-label="Stop and send"
          >
            <span className="h-3 w-3 rounded-sm bg-white" />
          </button>

          <div className="flex-1 flex items-center gap-2 px-4 h-11 rounded-2xl bg-ember-coral-50 border border-ember-coral-200">
            <span className="h-2 w-2 rounded-full bg-ember-coral-500 animate-pulse" />
            <span className="text-ember-coral-700 text-sm font-medium tabular-nums">
              {formatElapsed(elapsedMs)}
            </span>
            <div className="flex-1 flex items-end gap-0.5 h-6 overflow-hidden">
              {Array.from({ length: 32 }).map((_, i) => {
                const base = 4;
                const height =
                  base + ((i * 11 + Math.floor(elapsedMs / 100)) % 16);
                return (
                  <span
                    key={i}
                    className="w-1 rounded-full bg-ember-coral-400 transition-all duration-100"
                    style={{ height: `${Math.min(height, 24)}px` }}
                  />
                );
              })}
            </div>
          </div>

          <button
            type="button"
            onClick={onCancel}
            className="shrink-0 h-11 w-11 rounded-full text-loft-plum-500 hover:bg-loft-plum-100 flex items-center justify-center"
            aria-label="Cancel recording"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </>
      ) : (
        <button
          type="button"
          onClick={handleMicPress}
          disabled={disabled}
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
      )}

      {error && <span className="text-xs text-ember-coral-600">{error}</span>}
    </div>
  );
}
