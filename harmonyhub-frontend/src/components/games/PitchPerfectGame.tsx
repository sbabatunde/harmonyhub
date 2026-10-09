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
  Trophy,
  Target,
  Flame,
  RotateCcw,
  Mic,
} from "lucide-react";
import { cn } from "@/utils/helpers";

interface TargetNote {
  name: string;
  frequency: number;
  octave: number;
}

type GamePhase = "instructions" | "playing" | "gameover";

const NOTE_POOLS: Record<1 | 2 | 3, TargetNote[]> = {
  1: [
    { name: "C4", frequency: 261.63, octave: 4 },
    { name: "E4", frequency: 329.63, octave: 4 },
    { name: "G4", frequency: 392.0, octave: 4 },
  ],
  2: [
    { name: "C4", frequency: 261.63, octave: 4 },
    { name: "D4", frequency: 293.66, octave: 4 },
    { name: "E4", frequency: 329.63, octave: 4 },
    { name: "F4", frequency: 349.23, octave: 4 },
    { name: "G4", frequency: 392.0, octave: 4 },
    { name: "A4", frequency: 440.0, octave: 4 },
    { name: "B4", frequency: 493.88, octave: 4 },
  ],
  3: [
    { name: "C4", frequency: 261.63, octave: 4 },
    { name: "C#4", frequency: 277.18, octave: 4 },
    { name: "D4", frequency: 293.66, octave: 4 },
    { name: "D#4", frequency: 311.13, octave: 4 },
    { name: "E4", frequency: 329.63, octave: 4 },
    { name: "F4", frequency: 349.23, octave: 4 },
    { name: "F#4", frequency: 369.99, octave: 4 },
    { name: "G4", frequency: 392.0, octave: 4 },
    { name: "G#4", frequency: 415.3, octave: 4 },
    { name: "A4", frequency: 440.0, octave: 4 },
    { name: "A#4", frequency: 466.16, octave: 4 },
    { name: "B4", frequency: 493.88, octave: 4 },
    { name: "C5", frequency: 523.25, octave: 5 },
  ],
};

const TOTAL_ROUNDS = 10;
const HOLD_DURATION_MS = 700;

export const PitchPerfectGame: React.FC = () => {
  const [phase, setPhase] = useState<GamePhase>("instructions");
  const [target, setTarget] = useState<TargetNote | null>(null);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [round, setRound] = useState(1);
  const [correctCount, setCorrectCount] = useState(0);
  const [liveAccuracy, setLiveAccuracy] = useState(0);
  const [holdProgress, setHoldProgress] = useState(0);

  const holdStartRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const feedbackTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const {
    pitch,
    note: detectedNote,
    cents,
    isListening,
    startListening,
    stopListening,
    error: micError,
  } = usePitchDetection();

  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext();
    }
    return audioContextRef.current;
  }, []);

  const playTone = useCallback(
    (frequency: number, duration: number = 1.5) => {
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

  const pickTarget = useCallback(
    (currentRound: number) => {
      const poolSize = currentRound <= 3 ? 1 : currentRound <= 6 ? 2 : 3;
      const pool = NOTE_POOLS[poolSize as 1 | 2 | 3];
      const picked = pool[Math.floor(Math.random() * pool.length)];

      setTarget(picked);
      setHoldProgress(0);
      holdStartRef.current = null;

      setTimeout(() => playTone(picked.frequency), 500);
    },
    [playTone],
  );

  const startGame = async () => {
    setPhase("playing");
    setScore(0);
    setStreak(0);
    setBestStreak(0);
    setRound(1);
    setCorrectCount(0);
    setLiveAccuracy(0);

    await startListening();
    pickTarget(1);
  };

  const endGame = async (finalScore: number, finalCorrect: number) => {
    stopListening();
    setPhase("gameover");

    if (finalScore > 0) {
      try {
        await gameService.submitScore({
          game_type: "pitch_perfect",
          score: finalScore,
          accuracy_percentage: Math.round((finalCorrect / TOTAL_ROUNDS) * 100),
        });
      } catch (err) {
        console.error("Score submission failed:", err);
      }
    }
  };

  const nextRound = useCallback(
    (wasCorrect: boolean) => {
      const nextScore = wasCorrect ? score + 10 + streak * 2 : score;
      const nextCorrect = wasCorrect ? correctCount + 1 : correctCount;
      const nextRoundNum = round + 1;

      if (nextRoundNum > TOTAL_ROUNDS) {
        endGame(nextScore, nextCorrect);
      } else {
        setScore(nextScore);
        setCorrectCount(nextCorrect);
        setRound(nextRoundNum);
        pickTarget(nextRoundNum);
      }
    },
    [round, score, streak, correctCount, pickTarget],
  );

  useEffect(() => {
    if (phase !== "playing" || !target || !isListening) return;

    let animationFrame: number;
    let lastUpdate = performance.now();

    const loop = () => {
      animationFrame = requestAnimationFrame(loop);

      const now = performance.now();
      if (now - lastUpdate < 50) return;
      lastUpdate = now;

      if (!pitch) {
        holdStartRef.current = null;
        setHoldProgress(0);
        setLiveAccuracy(0);
        return;
      }

      const centsOff = Math.abs(cents);
      const accuracy = Math.max(0, 100 - centsOff * 2);
      setLiveAccuracy(accuracy);

      const inTune = centsOff <= 25;

      if (inTune) {
        if (holdStartRef.current === null) {
          holdStartRef.current = now;
        }
        const holdFor = now - holdStartRef.current;
        const progress = Math.min(100, (holdFor / HOLD_DURATION_MS) * 100);
        setHoldProgress(progress);

        if (holdFor >= HOLD_DURATION_MS) {
          cancelAnimationFrame(animationFrame);
          setStreak((s) => s + 1);
          setBestStreak((b) => Math.max(b, streak + 1));

          feedbackTimeoutRef.current = setTimeout(() => {
            nextRound(true);
          }, 800);
        }
      } else {
        holdStartRef.current = null;
        setHoldProgress(0);
      }
    };

    animationFrame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animationFrame);
  }, [phase, target, isListening, pitch, cents, streak, nextRound]);

  useEffect(() => {
    return () => {
      if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current);
      if (audioContextRef.current) audioContextRef.current.close();
      stopListening();
    };
  }, [stopListening]);

  const currentDifficultyLabel =
    round <= 3 ? "Warmup" : round <= 6 ? "Intermediate" : "Advanced";

  const displayNote = detectedNote || "—";
  const displayCents = isFinite(cents) ? cents.toFixed(0) : "0";

  const pitchColor =
    Math.abs(cents) <= 10
      ? "text-choir-sage-500"
      : Math.abs(cents) <= 25
        ? "text-brass-gold-500"
        : "text-ember-coral-500";

  // Instructions
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
            <Mic className="w-8 h-8 sm:w-10 sm:h-10 text-brass-gold-600" />
          </motion.div>
          <h2 className="text-2xl sm:text-3xl font-display text-loft-plum-900">
            Pitch Perfect
          </h2>
          <p className="text-sm sm:text-base text-loft-plum-600 max-w-lg mx-auto">
            Train your ear-to-voice connection. Listen to a target note, then
            sing it back with steady pitch control.
          </p>
        </div>

        <div className="bg-loft-plum-50 rounded-lg p-4 sm:p-5 space-y-2 sm:space-y-3">
          <h3 className="font-display text-base sm:text-lg text-loft-plum-900">
            How to play
          </h3>
          <ol className="space-y-2 text-xs sm:text-sm text-loft-plum-700">
            {[
              <>
                Click <strong>Start</strong>. Your browser will ask for
                microphone access — allow it
              </>,
              <>
                Listen to the <strong>target note</strong>, then sing it back
              </>,
              <>
                Hold the correct pitch for <strong>0.7 seconds</strong> to score
                the round
              </>,
              <>
                Play <strong>10 rounds</strong>. Difficulty increases at round 4
                and round 7
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

        <div className="bg-brass-gold-50 rounded-lg p-4 sm:p-5 space-y-2 sm:space-y-3">
          <h3 className="font-display text-base sm:text-lg text-brass-gold-800">
            Tips for success
          </h3>
          <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-brass-gold-700">
            <li>🎤 Use headphones if possible — reduces feedback</li>
            <li>🎤 Sing "ahh" or "ooh" — steady vowels track best</li>
            <li>🎤 Adjust your pitch gradually — don't jump octaves</li>
            <li>🎤 Watch the meter turn gold and green for the perfect zone</li>
          </ul>
        </div>

        {micError && (
          <div className="bg-ember-coral-100 text-ember-coral-800 p-3 rounded-lg text-xs sm:text-sm">
            <strong>Microphone error:</strong> {micError}
          </div>
        )}

        <div className="flex justify-center pt-1 sm:pt-2">
          <Button variant="primary" size="lg" onClick={startGame}>
            <Play className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
            Start Singing
          </Button>
        </div>
      </Card>
    );
  }

  // Gameover
  if (phase === "gameover") {
    const accuracy = Math.round((correctCount / TOTAL_ROUNDS) * 100);
    const grade =
      accuracy >= 90
        ? { label: "Perfect Pitch!", color: "text-brass-gold-500" }
        : accuracy >= 70
          ? { label: "Excellent control", color: "text-choir-sage-500" }
          : accuracy >= 50
            ? { label: "Solid progress", color: "text-loft-plum-600" }
            : { label: "Keep training", color: "text-loft-plum-500" };

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
            Session Complete
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
              Rounds Hit
            </p>
            <p className="text-xl sm:text-2xl font-display text-choir-sage-600">
              {correctCount}/{TOTAL_ROUNDS}
            </p>
          </div>
          <div className="bg-loft-plum-50 rounded-lg p-2 sm:p-3">
            <p className="text-[10px] sm:text-xs text-loft-plum-500">
              Best Streak
            </p>
            <p className="text-xl sm:text-2xl font-display text-brass-gold-500">
              {bestStreak}
            </p>
          </div>
        </div>

        <div className="flex justify-center pt-1 sm:pt-2">
          <Button variant="primary" onClick={startGame}>
            <RotateCcw className="w-4 h-4 mr-2" />
            Play Again
          </Button>
        </div>
      </Card>
    );
  }

  // Playing
  const progress = (round / TOTAL_ROUNDS) * 100;
  const isInPerfectZone = Math.abs(cents) <= 10;
  const isInGoodZone = Math.abs(cents) <= 25;

  return (
    <Card className="space-y-4 sm:space-y-5 max-w-3xl mx-auto">
      <div className="flex items-start justify-between gap-2 flex-wrap">
        <div className="min-w-0">
          <h2 className="text-xl sm:text-2xl font-display text-loft-plum-900">
            Pitch Perfect
          </h2>
          <p className="text-xs sm:text-sm text-loft-plum-500">
            Round {round} of {TOTAL_ROUNDS} · {currentDifficultyLabel}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Badge variant="plum">
            <Target className="w-3 h-3 mr-1" />
            {score}
          </Badge>
          {streak > 0 && (
            <Badge variant="gold">
              <Flame className="w-3 h-3 mr-1" />
              {streak}
            </Badge>
          )}
        </div>
      </div>

      <ProgressBar value={progress} color="gold" />

      <div className="bg-loft-plum-50 rounded-xl p-4 sm:p-6 text-center space-y-3 sm:space-y-4">
        <p className="text-xs sm:text-sm font-medium text-loft-plum-600">
          Sing this note
        </p>
        <p className="text-5xl sm:text-6xl font-display text-loft-plum-900">
          {target?.name || "—"}
        </p>
        <div className="flex justify-center">
          <Button
            variant="primary"
            onClick={() => target && playTone(target.frequency)}
          >
            <Volume2 className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
            <span className="text-sm sm:text-base">Hear Target Again</span>
          </Button>
        </div>
      </div>

      <div className="space-y-2 sm:space-y-3">
        <div className="flex items-end justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[10px] sm:text-xs font-medium text-loft-plum-500 uppercase tracking-wide">
              You are singing
            </p>
            <p className={cn("text-3xl sm:text-4xl font-display", pitchColor)}>
              {displayNote}
            </p>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-[10px] sm:text-xs font-medium text-loft-plum-500 uppercase tracking-wide">
              Deviation
            </p>
            <p className={cn("text-xl sm:text-2xl font-display", pitchColor)}>
              {cents >= 0 ? "+" : ""}
              {displayCents}¢
            </p>
          </div>
        </div>

        <div className="relative h-3 sm:h-4 bg-loft-plum-100 rounded-full overflow-hidden">
          <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-[8%] bg-choir-sage-300/40" />
          <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-[20%] bg-brass-gold-300/30" />

          {pitch !== null && (
            <motion.div
              className={cn(
                "absolute inset-y-0 w-2 rounded-full shadow-md transition-colors",
                isInPerfectZone
                  ? "bg-choir-sage-500"
                  : isInGoodZone
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
            {holdProgress > 0 ? "Hold it..." : "Match the pitch to score"}
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

      {!isInGoodZone && pitch !== null && (
        <div className="bg-brass-gold-50 rounded-lg p-2.5 sm:p-3 text-xs sm:text-sm text-brass-gold-800">
          {cents > 0
            ? "🎵 You're sharp — try relaxing down slightly"
            : "🎵 You're flat — push up gently"}
        </div>
      )}

      <div className="flex justify-center pt-1 sm:pt-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => endGame(score, correctCount)}
        >
          <span className="text-xs sm:text-sm">End Session</span>
        </Button>
      </div>
    </Card>
  );
};
