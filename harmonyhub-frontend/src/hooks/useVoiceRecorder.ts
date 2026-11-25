import { useCallback, useEffect, useRef, useState } from "react";

const MAX_BYTES = 1 * 1024 * 1024; // 1 MB
const MAX_MS = 5 * 60 * 1000; // 5 minutes

export interface RecordingResult {
  blob: Blob;
  mime: string;
  durationMs: number;
}

export function useVoiceRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startedAtRef = useRef<number>(0);
  const tickRef = useRef<number | null>(null);
  const stopTimerRef = useRef<number | null>(null);

  const cleanup = useCallback(() => {
    if (tickRef.current !== null) {
      window.clearInterval(tickRef.current);
      tickRef.current = null;
    }
    if (stopTimerRef.current !== null) {
      window.clearTimeout(stopTimerRef.current);
      stopTimerRef.current = null;
    }
    if (mediaRecorderRef.current?.stream) {
      mediaRecorderRef.current.stream
        .getTracks()
        .forEach((track) => track.stop());
    }
    mediaRecorderRef.current = null;
    chunksRef.current = [];
    setIsRecording(false);
    setElapsedMs(0);
  }, []);

  const stop = useCallback(() => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      mediaRecorderRef.current.stop();
    }
  }, []);

  const start = useCallback(async (): Promise<void> => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const preferred = MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : "audio/mp4";
      const recorder = new MediaRecorder(stream, { mimeType: preferred });
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];
      startedAtRef.current = performance.now();

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.start(250);
      setIsRecording(true);

      tickRef.current = window.setInterval(() => {
        setElapsedMs(performance.now() - startedAtRef.current);
      }, 100);

      stopTimerRef.current = window.setTimeout(() => {
        stop();
        setError("Maximum recording length is 5 minutes.");
      }, MAX_MS);
    } catch (e) {
      setError((e as Error).message ?? "Microphone permission denied");
      cleanup();
    }
  }, [cleanup, stop]);

  useEffect(() => cleanup, [cleanup]);

  const stopAndCollect = useCallback(
    (onComplete: (result: RecordingResult) => void): void => {
      const recorder = mediaRecorderRef.current;
      if (!recorder || recorder.state === "inactive") return;

      recorder.onstop = () => {
        const mime = recorder.mimeType || "audio/webm";
        const blob = new Blob(chunksRef.current, { type: mime });
        const durationMs = performance.now() - startedAtRef.current;
        cleanup();
        if (blob.size > MAX_BYTES) {
          setError("Recording exceeds 1 MB limit.");
          return;
        }
        if (blob.size === 0) {
          setError("Recording was empty.");
          return;
        }
        onComplete({ blob, mime, durationMs: Math.round(durationMs) });
      };
      stop();
    },
    [cleanup, stop],
  );

  return {
    isRecording,
    elapsedMs,
    error,
    start,
    stop,
    stopAndCollect,
    maxBytes: MAX_BYTES,
    maxMs: MAX_MS,
  };
}
