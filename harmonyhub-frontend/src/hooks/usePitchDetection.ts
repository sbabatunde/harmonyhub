import { useState, useRef, useEffect, useCallback } from "react";

interface PitchDetectionResult {
  pitch: number | null;
  note: string | null;
  cents: number;
  isListening: boolean;
  startListening: () => Promise<void>;
  stopListening: () => void;
  error: string | null;
}

export const usePitchDetection = (): PitchDetectionResult => {
  const [pitch, setPitch] = useState<number | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [cents, setCents] = useState<number>(0);
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const runningRef = useRef(false); // ← guards the loop

  const noteNames = [
    "C",
    "C#",
    "D",
    "D#",
    "E",
    "F",
    "F#",
    "G",
    "G#",
    "A",
    "A#",
    "B",
  ];

  const frequencyToNote = useCallback((frequency: number) => {
    const noteNum = 12 * (Math.log(frequency / 440) / Math.log(2));
    const noteIndex = Math.round(noteNum) + 69;
    const noteName = noteNames[noteIndex % 12];
    const octave = Math.floor(noteIndex / 12) - 1;
    return `${noteName}${octave}`;
  }, []);

  const detectPitch = useCallback(() => {
    // Always schedule the next frame first — this is the key fix.
    if (!runningRef.current) return;
    animationFrameRef.current = requestAnimationFrame(detectPitch);

    if (!analyserRef.current || !audioContextRef.current) return;

    const bufferLength = analyserRef.current.fftSize;
    const buffer = new Float32Array(bufferLength);
    analyserRef.current.getFloatTimeDomainData(buffer);

    const sampleRate = audioContextRef.current.sampleRate;

    // RMS gate
    let rms = 0;
    for (let i = 0; i < buffer.length; i++) {
      const val = buffer[i];
      rms += val * val;
    }
    rms = Math.sqrt(rms / buffer.length);

    if (rms < 0.01) {
      // Silent frame — clear values but KEEP LOOPING
      setPitch(null);
      setNote(null);
      setCents(0);
      return;
    }

    // Autocorrelation
    let bestOffset = -1;
    let bestCorrelation = 0;

    for (let offset = 8; offset < buffer.length / 2; offset++) {
      let correlation = 0;
      for (let i = 0; i < buffer.length / 2; i++) {
        correlation += Math.abs(buffer[i] - buffer[i + offset]);
      }
      correlation = 1 - correlation / (buffer.length / 2);

      if (correlation > 0.9 && correlation > bestCorrelation) {
        bestCorrelation = correlation;
        bestOffset = offset;
      }
    }

    if (bestCorrelation > 0.01 && bestOffset > 0) {
      const frequency = sampleRate / bestOffset;
      if (frequency > 50 && frequency < 2000) {
        setPitch(frequency);
        setNote(frequencyToNote(frequency));

        const noteNum = 12 * (Math.log(frequency / 440) / Math.log(2));
        const nearestNote = Math.round(noteNum);
        const centsDeviation = (noteNum - nearestNote) * 100;
        setCents(centsDeviation);
      }
    }
  }, [frequencyToNote]);

  const startListening = useCallback(async () => {
    try {
      // Stop any prior session cleanly
      if (runningRef.current) {
        runningRef.current = false;
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
          animationFrameRef.current = null;
        }
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      });
      streamRef.current = stream;

      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      const ctx = new AudioCtx();
      audioContextRef.current = ctx;

      // iOS/Safari sometimes starts the context suspended
      if (ctx.state === "suspended") {
        await ctx.resume();
      }

      analyserRef.current = ctx.createAnalyser();
      analyserRef.current.fftSize = 2048;
      analyserRef.current.smoothingTimeConstant = 0.8;

      const source = ctx.createMediaStreamSource(stream);
      source.connect(analyserRef.current);

      runningRef.current = true;
      setIsListening(true);
      setError(null);
      detectPitch();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unable to access microphone";
      setError(message);
      console.error("Error accessing microphone:", err);
    }
  }, [detectPitch]);

  const stopListening = useCallback(() => {
    runningRef.current = false;

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    analyserRef.current = null;

    setIsListening(false);
    setPitch(null);
    setNote(null);
    setCents(0);
  }, []);

  useEffect(() => {
    return () => {
      stopListening();
    };
  }, [stopListening]);

  return {
    pitch,
    note,
    cents,
    isListening,
    startListening,
    stopListening,
    error,
  };
};
