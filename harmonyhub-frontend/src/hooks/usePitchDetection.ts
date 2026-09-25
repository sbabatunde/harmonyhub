import { useState, useRef, useEffect, useCallback } from 'react';

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

  const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

  const frequencyToNote = useCallback((frequency: number) => {
    const noteNum = 12 * (Math.log(frequency / 440) / Math.log(2));
    const noteIndex = Math.round(noteNum) + 69;
    const noteName = noteNames[noteIndex % 12];
    const octave = Math.floor(noteIndex / 12) - 1;
    return `${noteName}${octave}`;
  }, []);

  const detectPitch = useCallback(() => {
    if (!analyserRef.current) return;

    const bufferLength = analyserRef.current.fftSize;
    const buffer = new Float32Array(bufferLength);
    analyserRef.current.getFloatTimeDomainData(buffer);

    // Autocorrelation
    const sampleRate = audioContextRef.current?.sampleRate || 44100;
    let bestOffset = -1;
    let bestCorrelation = 0;
    let rms = 0;

    for (let i = 0; i < buffer.length; i++) {
      const val = buffer[i];
      rms += val * val;
    }
    rms = Math.sqrt(rms / buffer.length);

    if (rms < 0.01) {
      setPitch(null);
      setNote(null);
      return;
    }

    for (let offset = 0; offset < buffer.length / 2; offset++) {
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
        
        // Calculate cents deviation
        const noteNum = 12 * (Math.log(frequency / 440) / Math.log(2));
        const nearestNote = Math.round(noteNum);
        const centsDeviation = (noteNum - nearestNote) * 100;
        setCents(centsDeviation);
      }
    }

    animationFrameRef.current = requestAnimationFrame(detectPitch);
  }, [frequencyToNote]);

  const startListening = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 2048;

      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);

      setIsListening(true);
      setError(null);
      detectPitch();
    } catch (err) {
      setError('Unable to access microphone');
      console.error('Error accessing microphone:', err);
    }
  }, [detectPitch]);

  const stopListening = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
    setIsListening(false);
    setPitch(null);
    setNote(null);
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