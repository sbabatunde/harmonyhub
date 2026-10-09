import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { usePitchDetection } from "@/hooks/usePitchDetection";
import { gameService } from "@/api/services/gameService";
import {
  Play,
  Volume2,
  CheckCircle,
  Trophy,
  Target,
  RotateCcw,
  Waves,
} from "lucide-react";
import { cn } from "@/utils/helpers";

interface ScaleNote {
  name: string;
  frequency: number;
  solfege: string;
  degree: number;
}

type ScaleType = "major" | "minor";
type GamePhase = "instructions" | "playing" | "gameover";

const SCALES: Record<ScaleType, ScaleNote[]> = {
  major: [
    { name: "C4", frequency: 261.63, solfege: "Do", degree: 1 },
    { name: "D4", frequency: 293.66, solfege: "Re", degree: 2 },
    { name: "E4", frequency: 329.63, solfege: "Mi", degree: 3 },
    { name: "F4", frequency: 349.23, solfege: "Fa", degree: 4 },
    { name: "G4", frequency: 392.0, solfege: "Sol", degree: 5 },
    { name: "A4", frequency: 440.0, solfege: "La", degree: 6 },
    { name: "B4", frequency: 493.88, solfege: "Ti", degree: 7 },
    { name: "C5", frequency: 523.25, solfege: "Do", degree: 8 },
  ],
  minor: [
    { name: "A3", frequency: 220.0, solfege: "Do", degree: 1 },
    { name: "B3", frequency: 246.94, solfege: "Re", degree: 2 },
    { name: "C4", frequency: 261.63, solfege: "Me", degree: 3 },
    { name: "D4", frequency: 293.66, solfege: "Fa", degree: 4 },
    { name: "E4", frequency: 329.63, solfege: "Sol", degree: 5 },
    { name: "F4", frequency: 349.23, solfege: "Le", degree: 6 },
    { name: "G4", frequency: 392.0, solfege: "Te", degree: 7 },
    { name: "A4", frequency: 440.0, solfege: "Do", degree: 8 },
  ],
};

const HOLD_DURATION_MS = 600;
const CENTS_TOLERANCE = 30;
const TOTAL_ROUNDS = 3;

export const ScaleSinger: React.FC = () => {
  const [phase, setPhase] = useState<GamePhase>("instructions");
  const [scaleType, setScaleType] = useState<ScaleType>("major");
  const [currentNoteIndex, setCurrentNoteIndex] = useState(0);
  const [round, setRound] = useState(1);
  const [notesHit, setNotesHit] = useState(0);
  const [notesMissed, setNotesMissed] = useState(0);
  const [roundResults, setRoundResults] = useState<boolean[]>([]);
  const [score, setScore] = useState(0);
  const [holdProgress, setHoldProgress] = useState(0);
  const [liveAccuracy, setLiveAccuracy] = useState(0);

  const holdStartRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isTransitioningRef = useRef(false);

  const {
    pitch,
    note: detectedNote,
    cents,
    isListening,
    startListening,
    stopListening,
    error: micError,
  } = usePitchDetection();

  const scale = SCALES[scaleType];
  const currentNote = scale[currentNoteIndex];

  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext();
    }
    return audioContextRef.current;
  }, []);

  const playNote = useCallback(
    (frequency: number, duration = 1.2) => {
      const ctx = getAudioContext();
      const now = ctx.currentTime + 0.05;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.value = frequency;

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.35, now + 0.05);
      gain.gain.setValueAtTime(0.35, now + duration - 0.1);
      gain.gain.linearRampToValueAtTime(0, now + duration);

      osc.start(now);
      osc.stop(now + duration);
    },
    [getAudioContext],
  );

  const startGame = async () => {
    setPhase("playing");
    setCurrentNoteIndex(0);
    setRound(1);
    setNotesHit(0);
    setNotesMissed(0);
    setRoundResults([]);
    setScore(0);
    setHoldProgress(0);

    await startListening();

    setTimeout(() => {
      if (scale[0]) playNote(scale[0].frequency);
    }, 600);
  };

  const handleNoteComplete = (hit: boolean) => {
    if (isTransitioningRef.current) return;
    isTransitioningRef.current = true;

    const newResults = [...roundResults, hit];
    setRoundResults(newResults);

    if (hit) {
      setNotesHit((n) => n + 1);
      setScore((s) => s + 15);
    } else {
      setNotesMissed((n) => n + 1);
    }

    holdStartRef.current = null;
    setHoldProgress(0);

    const next = currentNoteIndex + 1;

    if (next >= scale.length) {
      timeoutRef.current = setTimeout(() => {
        isTransitioningRef.current = false;
        if (round >= TOTAL_ROUNDS) {
          finishGame();
        } else {
          setRound((r) => r + 1);
          setCurrentNoteIndex(0);
          setRoundResults([]);
          playNote(scale[0].frequency);
        }
      }, 800);
    } else {
      timeoutRef.current = setTimeout(() => {
        isTransitioningRef.current = false;
        setCurrentNoteIndex(next);
        playNote(scale[next].frequency);
      }, 500);
    }
  };

  const finishGame = async () => {
    stopListening();
    setPhase("gameover");

    if (score > 0) {
      try {
        const totalPossible = TOTAL_ROUNDS * scale.length * 15;
        await gameService.submitScore({
          game_type: "pitch_perfect",
          score,
          accuracy_percentage: Math.round((score / totalPossible) * 100),
        });
      } catch (err) {
        console.error("Score submit failed:", err);
      }
    }
  };

  useEffect(() => {
    if (phase !== "playing" || !isListening || !currentNote) return;

    let frame: number;
    let last = performance.now();

    const loop = () => {
      frame = requestAnimationFrame(loop);

      const now = performance.now();
      if (now - last < 50) return;
      last = now;

      if (pitch === null) {
        holdStartRef.current = null;
        setHoldProgress(0);
        setLiveAccuracy(0);
        return;
      }

      const centsOff = Math.abs(cents);
      const accuracy = Math.max(0, 100 - centsOff * 2);
      setLiveAccuracy(accuracy);

      const inTune = centsOff <= CENTS_TOLERANCE;

      if (inTune) {
        if (holdStartRef.current === null) holdStartRef.current = now;
        const holdFor = now - holdStartRef.current;
        const progress = Math.min(100, (holdFor / HOLD_DURATION_MS) * 100);
        setHoldProgress(progress);

        if (holdFor >= HOLD_DURATION_MS) {
          handleNoteComplete(true);
        }
      } else {
        if (holdStartRef.current === null) {
          holdStartRef.current = now;
        }
        const outFor = now - holdStartRef.current;
        if (outFor > 4000) {
          handleNoteComplete(false);
        }
        setHoldProgress(0);
      }
    };

    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, [phase, isListening, pitch, cents, currentNote]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (audioContextRef.current) audioContextRef.current.close();
      stopListening();
    };
  }, [stopListening]);

  const pitchColor =
    Math.abs(cents) <= 10
      ? "text-choir-sage-500"
      : Math.abs(cents) <= CENTS_TOLERANCE
        ? "text-brass-gold-500"
        : "text-ember-coral-500";

  if (phase === "instructions") {
    return (
      <Card className="space-y-4 sm:space-y-6 max-w-2xl mx-auto">
        <div className="text-center space-y-2 sm:space-y-3">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", damping: 12 }}
            className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-brass-gold-100"
          >
            <Waves className="w-8 h-8 sm:w-10 sm:h-10 text-brass-gold-600" />
          </motion.div>
          <h2 className="text-2xl sm:text-3xl font-display text-loft-plum-900">
            Scale Singer
          </h2>
          <p className="text-sm sm:text-base text-loft-plum-600 max-w-lg mx-auto">
            The best warmup game. Sing a full scale note by note, matching pitch
            as you climb.
          </p>
        </div>

        <div className="bg-loft-plum-50 rounded-lg p-4 sm:p-5 space-y-2 sm:space-y-3">
          <h3 className="font-display text-base sm:text-lg text-loft-plum-900">
            How to play
          </h3>
          <ol className="space-y-2 text-xs sm:text-sm text-loft-plum-700">
            {[
              <>
                A scale note plays. <strong>Sing that note back</strong> and
                hold it steady
              </>,
              <>
                When you match, the scale <strong>moves up one step</strong>
                —follow along
              </>,
              <>
                Complete the whole scale <strong>3 times</strong> to finish
              </>,
            ].map((text, i) => (
              <li key={i} className="flex items-start">
                <span className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-loft-plum-900 text-brass-gold-400 flex items-center justify-center text-[10px] sm:text-xs font-medium mr-2 sm:mr-3 flex-shrink-0 mt-0.5">
                  {i + 1}
                </span>
                <span>{text}</span>
              </li>
            ))}
          </ol>
        </div>

        <div className="bg-choir-sage-50 rounded-lg p-4 sm:p-5 space-y-2 sm:space-y-3">
          <h3 className="font-display text-base sm:text-lg text-choir-sage-800">
            Choose your scale
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
            <button
              onClick={() => setScaleType("major")}
              className={cn(
                "p-3 rounded-lg border-2 text-left transition-all touch-manipulation",
                scaleType === "major"
                  ? "border-choir-sage-500 bg-white"
                  : "border-transparent bg-white/50 hover:bg-white",
              )}
            >
              <p className="font-display text-sm sm:text-base text-loft-plum-900">
                Major Scale
              </p>
              <p className="text-[10px] sm:text-xs text-loft-plum-500 mt-0.5">
                Do-Re-Mi · Bright and joyful
              </p>
            </button>
            <button
              onClick={() => setScaleType("minor")}
              className={cn(
                "p-3 rounded-lg border-2 text-left transition-all touch-manipulation",
                scaleType === "minor"
                  ? "border-choir-sage-500 bg-white"
                  : "border-transparent bg-white/50 hover:bg-white",
              )}
            >
              <p className="font-display text-sm sm:text-base text-loft-plum-900">
                Minor Scale
              </p>
              <p className="text-[10px] sm:text-xs text-loft-plum-500 mt-0.5">
                Do-Re-Me · Softer, reflective
              </p>
            </button>
          </div>
        </div>

        {micError && (
          <div className="bg-ember-coral-100 text-ember-coral-800 p-3 rounded-lg text-xs sm:text-sm">
            <strong>Microphone error:</strong> {micError}
          </div>
        )}

        <div className="flex justify-center pt-1 sm:pt-2">
          <Button variant="primary" size="lg" onClick={startGame}>
            <Play className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
            Begin Warmup
          </Button>
        </div>
      </Card>
    );
  }

  if (phase === "gameover") {
    const totalNotes = TOTAL_ROUNDS * scale.length;
    const accuracy = Math.round((notesHit / totalNotes) * 100);
    const grade =
      accuracy >= 90
        ? { label: "Beautiful control!", color: "text-brass-gold-500" }
        : accuracy >= 70
          ? { label: "Strong warmup", color: "text-choir-sage-500" }
          : accuracy >= 50
            ? { label: "Good effort", color: "text-loft-plum-600" }
            : { label: "Keep practicing", color: "text-loft-plum-500" };

    return (
      <Card className="space-y-4 sm:space-y-6 max-w-lg mx-auto text-center">
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", damping: 12 }}
          className="inline-flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-brass-gold-100"
        >
          <Trophy className="w-10 h-10 sm:w-12 sm:h-12 text-brass-gold-500" />
        </motion.div>

        <div>
          <h2 className="text-2xl sm:text-3xl font-display text-loft-plum-900">
            Warmup Complete
          </h2>
          <p
            className={cn("mt-1 text-base sm:text-lg font-medium", grade.color)}
          >
            {grade.label}
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          <div className="bg-loft-plum-50 rounded-lg p-2 sm:p-3">
            <p className="text-[10px] sm:text-xs text-loft-plum-500">Score</p>
            <p className="text-xl sm:text-2xl font-display text-loft-plum-900">
              {score}
            </p>
          </div>
          <div className="bg-loft-plum-50 rounded-lg p-2 sm:p-3">
            <p className="text-[10px] sm:text-xs text-loft-plum-500">
              Notes Hit
            </p>
            <p className="text-xl sm:text-2xl font-display text-choir-sage-600">
              {notesHit}/{totalNotes}
            </p>
          </div>
          <div className="bg-loft-plum-50 rounded-lg p-2 sm:p-3">
            <p className="text-[10px] sm:text-xs text-loft-plum-500">
              Notes Missed
            </p>
            <p className="text-xl sm:text-2xl font-display text-ember-coral-500">
              {notesMissed}
            </p>
          </div>
        </div>

        <div className="flex justify-center pt-1 sm:pt-2">
          <Button variant="primary" onClick={startGame}>
            <RotateCcw className="w-4 h-4 mr-2" />
            Sing Again
          </Button>
        </div>
      </Card>
    );
  }

  const overallProgress =
    ((round - 1) / TOTAL_ROUNDS) * 100 +
    ((currentNoteIndex / scale.length) * 100) / TOTAL_ROUNDS;

  return (
    <Card className="space-y-4 sm:space-y-5 max-w-3xl mx-auto">
      <div className="flex items-start justify-between gap-2 flex-wrap">
        <div className="min-w-0">
          <h2 className="text-xl sm:text-2xl font-display text-loft-plum-900">
            Scale Singer
          </h2>
          <p className="text-xs sm:text-sm text-loft-plum-500 capitalize">
            {scaleType} scale · Round {round} of {TOTAL_ROUNDS}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Badge variant="plum">
            <Target className="w-3 h-3 mr-1" />
            {score}
          </Badge>
          <Badge variant="sage">
            <CheckCircle className="w-3 h-3 mr-1" />
            {notesHit}
          </Badge>
        </div>
      </div>

      <ProgressBar value={overallProgress} color="gold" />

      <div className="bg-loft-plum-50 rounded-xl p-3 sm:p-6 space-y-3 sm:space-y-4">
        <p className="text-xs sm:text-sm font-medium text-loft-plum-600 text-center">
          Sing the scale
        </p>

        <div className="flex justify-center items-end gap-1 sm:gap-2 overflow-x-auto pb-2">
          {scale.map((note, idx) => {
            const isCurrent = idx === currentNoteIndex;
            const isPast = idx < currentNoteIndex;
            const wasHit = isPast && roundResults[idx] === true;

            return (
              <motion.div
                key={note.name}
                animate={{ scale: isCurrent ? 1.15 : 1, y: isCurrent ? -6 : 0 }}
                transition={{ type: "spring", damping: 15 }}
                className="flex flex-col items-center flex-shrink-0"
              >
                <div
                  className={cn(
                    "w-6 sm:w-10 rounded-t-lg transition-all duration-300",
                    isPast
                      ? wasHit
                        ? "bg-choir-sage-500"
                        : "bg-ember-coral-400"
                      : isCurrent
                        ? "bg-brass-gold-400"
                        : "bg-loft-plum-200",
                  )}
                  style={{ height: `${20 + (idx / scale.length) * 60}px` }}
                />
                <p
                  className={cn(
                    "mt-1 text-[10px] sm:text-xs font-medium",
                    isCurrent
                      ? "text-brass-gold-600"
                      : isPast
                        ? wasHit
                          ? "text-choir-sage-600"
                          : "text-ember-coral-500"
                        : "text-loft-plum-400",
                  )}
                >
                  {note.solfege}
                </p>
                <p className="text-[8px] sm:text-[10px] text-loft-plum-400">
                  {note.name}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>

      <div className="text-center space-y-2 sm:space-y-3">
        <p className="text-xs sm:text-sm font-medium text-loft-plum-600">
          Sing this note
        </p>
        <p className="text-3xl sm:text-5xl font-display text-loft-plum-900">
          {currentNote.solfege} ({currentNote.name})
        </p>
        <Button
          variant="primary"
          onClick={() => playNote(currentNote.frequency)}
        >
          <Volume2 className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
          <span className="text-sm sm:text-base">Hear Note</span>
        </Button>
      </div>

      <div className="space-y-2 sm:space-y-3">
        <div className="flex items-end justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[10px] sm:text-xs font-medium text-loft-plum-500 uppercase tracking-wide">
              You are singing
            </p>
            <p className={cn("text-3xl sm:text-4xl font-display", pitchColor)}>
              {detectedNote || "—"}
            </p>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-[10px] sm:text-xs font-medium text-loft-plum-500 uppercase tracking-wide">
              Deviation
            </p>
            <p className={cn("text-xl sm:text-2xl font-display", pitchColor)}>
              {cents >= 0 ? "+" : ""}
              {isFinite(cents) ? cents.toFixed(0) : "0"}¢
            </p>
          </div>
        </div>

        <div className="relative h-3 sm:h-4 bg-loft-plum-100 rounded-full overflow-hidden">
          <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-[10%] bg-choir-sage-300/40" />
          <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-[30%] bg-brass-gold-300/30" />
          {pitch !== null && (
            <motion.div
              className={cn(
                "absolute inset-y-0 w-2 rounded-full shadow-md",
                Math.abs(cents) <= 10
                  ? "bg-choir-sage-500"
                  : Math.abs(cents) <= CENTS_TOLERANCE
                    ? "bg-brass-gold-500"
                    : "bg-ember-coral-500",
              )}
              style={{
                left: `${50 + Math.max(-50, Math.min(50, (cents / 50) * 50))}%`,
                transform: "translateX(-50%)",
              }}
            />
          )}
        </div>

        <div className="flex justify-between text-[10px] sm:text-xs text-loft-plum-400">
          <span>−50¢</span>
          <span>Perfect</span>
          <span>+50¢</span>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs sm:text-sm">
          <span className="text-loft-plum-600 font-medium">
            {holdProgress > 0 ? "Hold it..." : "Match the pitch to advance"}
          </span>
          <span className="text-[10px] sm:text-xs text-loft-plum-400">
            {Math.round(liveAccuracy)}%
          </span>
        </div>
        <ProgressBar
          value={holdProgress}
          color={holdProgress >= 100 ? "sage" : "gold"}
        />
      </div>

      <div className="flex justify-center">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            stopListening();
            finishGame();
          }}
        >
          <span className="text-xs sm:text-sm">End Session</span>
        </Button>
      </div>
    </Card>
  );
};
