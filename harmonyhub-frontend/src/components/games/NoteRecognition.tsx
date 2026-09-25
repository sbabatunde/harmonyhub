import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { gameService } from "@/api/services/gameService";
import {
  Play,
  Volume2,
  CheckCircle,
  XCircle,
  Trophy,
  Target,
  Flame,
  RotateCcw,
  Music,
  Headphones,
} from "lucide-react";
import { cn } from "@/utils/helpers";

// ----------------------------------------------------------- Types
interface NoteOption {
  name: string;
  frequency: number;
}

type GamePhase = "instructions" | "playing" | "gameover";

// ----------------------------------------------------------- Note pools
// Two octaves of natural notes, arranged for progressive difficulty.
const NOTE_POOLS: Record<1 | 2 | 3, NoteOption[]> = {
  1: [
    { name: "C4", frequency: 261.63 },
    { name: "E4", frequency: 329.63 },
    { name: "G4", frequency: 392.0 },
  ],
  2: [
    { name: "C4", frequency: 261.63 },
    { name: "D4", frequency: 293.66 },
    { name: "E4", frequency: 329.63 },
    { name: "F4", frequency: 349.23 },
    { name: "G4", frequency: 392.0 },
    { name: "A4", frequency: 440.0 },
    { name: "B4", frequency: 493.88 },
  ],
  3: [
    { name: "C4", frequency: 261.63 },
    { name: "D4", frequency: 293.66 },
    { name: "E4", frequency: 329.63 },
    { name: "F4", frequency: 349.23 },
    { name: "G4", frequency: 392.0 },
    { name: "A4", frequency: 440.0 },
    { name: "B4", frequency: 493.88 },
    { name: "C5", frequency: 523.25 },
    { name: "D5", frequency: 587.33 },
    { name: "E5", frequency: 659.25 },
  ],
};

const TOTAL_ROUNDS = 10;

// Reference tones — a fixed C4 pitch the user can play any time as an anchor
const REFERENCE_NOTE: NoteOption = { name: "C4", frequency: 261.63 };

// ----------------------------------------------------------- Component
export const NoteRecognition: React.FC = () => {
  const [phase, setPhase] = useState<GamePhase>("instructions");
  const [target, setTarget] = useState<NoteOption | null>(null);
  const [options, setOptions] = useState<NoteOption[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [round, setRound] = useState(1);
  const [correctCount, setCorrectCount] = useState(0);

  const audioContextRef = useRef<AudioContext | null>(null);
  const feedbackTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // --------------------------------------------------------- Audio
  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext();
    }
    return audioContextRef.current;
  }, []);

  const playTone = useCallback(
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
      gain.gain.linearRampToValueAtTime(0.4, now + 0.05);
      gain.gain.setValueAtTime(0.4, now + duration - 0.1);
      gain.gain.linearRampToValueAtTime(0, now + duration);

      osc.start(now);
      osc.stop(now + duration);
    },
    [getAudioContext],
  );

  // --------------------------------------------------------- Question generation
  const generateQuestion = useCallback(
    (currentRound: number) => {
      const poolSize = currentRound <= 3 ? 1 : currentRound <= 7 ? 2 : 3;
      const pool = NOTE_POOLS[poolSize as 1 | 2 | 3];

      const correct = pool[Math.floor(Math.random() * pool.length)];
      const others = pool.filter((n) => n.name !== correct.name);
      const shuffled = [...others].sort(() => Math.random() - 0.5);
      const chosen = shuffled.slice(0, Math.min(3, shuffled.length));

      setTarget(correct);
      setOptions([correct, ...chosen].sort(() => Math.random() - 0.5));
      setSelected(null);
      setFeedback(null);
      // Auto-play after a short delay
      setTimeout(() => playTone(correct.frequency), 500);
    },
    [playTone],
  );

  const startGame = () => {
    setPhase("playing");
    setScore(0);
    setStreak(0);
    setBestStreak(0);
    setRound(1);
    setCorrectCount(0);
    generateQuestion(1);
  };

  const handleAnswer = (option: NoteOption) => {
    if (selected || !target) return;

    setSelected(option.name);
    const isCorrect = option.name === target.name;

    if (isCorrect) {
      setFeedback("correct");
      setScore((s) => s + 10 + streak * 2);
      setStreak((s) => s + 1);
      setBestStreak((b) => Math.max(b, streak + 1));
      setCorrectCount((c) => c + 1);
    } else {
      setFeedback("wrong");
      setStreak(0);
    }

    feedbackTimeoutRef.current = setTimeout(() => {
      const next = round + 1;
      if (next > TOTAL_ROUNDS) {
        endGame(isCorrect);
      } else {
        setRound(next);
        generateQuestion(next);
      }
    }, 1600);
  };

  const endGame = async (lastWasCorrect: boolean) => {
    setPhase("gameover");
    const finalScore = score + (lastWasCorrect ? 10 + streak * 2 : 0);
    const finalCorrect = correctCount + (lastWasCorrect ? 1 : 0);

    if (finalScore > 0) {
      try {
        await gameService.submitScore({
          game_type: "interval_trainer", // reuse bucket; can add a new type later
          score: finalScore,
          accuracy_percentage: Math.round((finalCorrect / TOTAL_ROUNDS) * 100),
        });
      } catch (err) {
        console.error("Score submit failed:", err);
      }
    }
  };

  // Cleanup
  useEffect(() => {
    return () => {
      if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current);
      if (audioContextRef.current) audioContextRef.current.close();
    };
  }, []);

  // --------------------------------------------------------- Render: Instructions
  if (phase === "instructions") {
    return (
      <Card className="space-y-6 max-w-2xl mx-auto">
        <div className="text-center space-y-3">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", damping: 12 }}
            className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-brass-gold-100"
          >
            <Headphones className="w-10 h-10 text-brass-gold-600" />
          </motion.div>
          <h2 className="text-3xl font-display text-loft-plum-900">
            Note Recognition
          </h2>
          <p className="text-loft-plum-600 max-w-lg mx-auto">
            Train your ear to recognize individual notes by pitch. This builds
            the foundation for singing harmonies and following sheet music by
            ear.
          </p>
        </div>

        <div className="bg-loft-plum-50 rounded-lg p-5 space-y-3">
          <h3 className="font-display text-lg text-loft-plum-900">
            How to play
          </h3>
          <ol className="space-y-2 text-sm text-loft-plum-700">
            <li className="flex items-start">
              <span className="w-6 h-6 rounded-full bg-loft-plum-900 text-brass-gold-400 flex items-center justify-center text-xs font-medium mr-3 flex-shrink-0 mt-0.5">
                1
              </span>
              <span>
                A single note plays. <strong>Identify which note</strong> you
                heard
              </span>
            </li>
            <li className="flex items-start">
              <span className="w-6 h-6 rounded-full bg-loft-plum-900 text-brass-gold-400 flex items-center justify-center text-xs font-medium mr-3 flex-shrink-0 mt-0.5">
                2
              </span>
              <span>
                Use the <strong>reference C</strong> button any time to compare
                against a known pitch
              </span>
            </li>
            <li className="flex items-start">
              <span className="w-6 h-6 rounded-full bg-loft-plum-900 text-brass-gold-400 flex items-center justify-center text-xs font-medium mr-3 flex-shrink-0 mt-0.5">
                3
              </span>
              <span>
                Play <strong>10 rounds</strong>. Difficulty rises at round 4 and
                round 8
              </span>
            </li>
            <li className="flex items-start">
              <span className="w-6 h-6 rounded-full bg-loft-plum-900 text-brass-gold-400 flex items-center justify-center text-xs font-medium mr-3 flex-shrink-0 mt-0.5">
                4
              </span>
              <span>
                Build <strong>streaks</strong> for bonus points
              </span>
            </li>
          </ol>
        </div>

        <div className="bg-brass-gold-50 rounded-lg p-5 space-y-3">
          <h3 className="font-display text-lg text-brass-gold-800">
            Tips for success
          </h3>
          <ul className="space-y-2 text-sm text-brass-gold-700">
            <li>🎧 Use the reference C to anchor your sense of pitch</li>
            <li>🎧 Try humming the reference C, then compare to the target</li>
            <li>🎧 Don't rush — the answer buttons stay available</li>
            <li>
              🎧 Replays count — play the target as many times as you need
            </li>
          </ul>
        </div>

        <div className="flex justify-center pt-2">
          <Button variant="primary" size="lg" onClick={startGame}>
            <Play className="w-5 h-5 mr-2" />
            Start Training
          </Button>
        </div>
      </Card>
    );
  }

  // --------------------------------------------------------- Render: Gameover
  if (phase === "gameover") {
    const accuracy = Math.round((correctCount / TOTAL_ROUNDS) * 100);
    const grade =
      accuracy >= 90
        ? { label: "Perfect pitch intuition!", color: "text-brass-gold-500" }
        : accuracy >= 70
          ? { label: "Great ear!", color: "text-choir-sage-500" }
          : accuracy >= 50
            ? { label: "Developing well", color: "text-loft-plum-600" }
            : { label: "Keep training", color: "text-loft-plum-500" };

    return (
      <Card className="space-y-6 max-w-lg mx-auto text-center">
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", damping: 12 }}
          className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-brass-gold-100"
        >
          <Trophy className="w-12 h-12 text-brass-gold-500" />
        </motion.div>

        <div>
          <h2 className="text-3xl font-display text-loft-plum-900">
            Session Complete
          </h2>
          <p className={cn("mt-1 text-lg font-medium", grade.color)}>
            {grade.label}
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="bg-loft-plum-50 rounded-lg p-3">
            <p className="text-xs text-loft-plum-500">Score</p>
            <p className="text-2xl font-display text-loft-plum-900">{score}</p>
          </div>
          <div className="bg-loft-plum-50 rounded-lg p-3">
            <p className="text-xs text-loft-plum-500">Correct</p>
            <p className="text-2xl font-display text-choir-sage-600">
              {correctCount}/{TOTAL_ROUNDS}
            </p>
          </div>
          <div className="bg-loft-plum-50 rounded-lg p-3">
            <p className="text-xs text-loft-plum-500">Best Streak</p>
            <p className="text-2xl font-display text-brass-gold-500">
              {bestStreak}
            </p>
          </div>
        </div>

        <div className="flex justify-center pt-2">
          <Button variant="primary" onClick={startGame}>
            <RotateCcw className="w-4 h-4 mr-2" />
            Play Again
          </Button>
        </div>
      </Card>
    );
  }

  // --------------------------------------------------------- Render: Playing
  const progress = (round / TOTAL_ROUNDS) * 100;
  const currentDifficultyLabel =
    round <= 3 ? "Warmup" : round <= 7 ? "Intermediate" : "Advanced";

  return (
    <Card className="space-y-5 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-display text-loft-plum-900">
            Note Recognition
          </h2>
          <p className="text-sm text-loft-plum-500">
            Round {round} of {TOTAL_ROUNDS} · {currentDifficultyLabel}
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Badge variant="plum">
            <Target className="w-3 h-3 mr-1" />
            {score} pts
          </Badge>
          {streak > 0 && (
            <Badge variant="gold">
              <Flame className="w-3 h-3 mr-1" />
              {streak} streak
            </Badge>
          )}
        </div>
      </div>

      {/* Progress */}
      <ProgressBar value={progress} color="gold" />

      {/* Playback */}
      <div className="bg-loft-plum-50 rounded-xl p-6 text-center space-y-4">
        <p className="text-sm font-medium text-loft-plum-600">
          Listen to the note
        </p>

        <div className="flex justify-center space-x-3">
          <Button
            variant="primary"
            size="lg"
            onClick={() => target && playTone(target.frequency)}
          >
            <Volume2 className="w-5 h-5 mr-2" />
            Play Note
          </Button>

          <Button
            variant="outline"
            size="lg"
            onClick={() => playTone(REFERENCE_NOTE.frequency)}
          >
            <Music className="w-5 h-5 mr-2" />
            Reference C
          </Button>
        </div>

        <p className="text-xs text-loft-plum-400">
          Tip: Compare the target to the reference C to find its pitch
        </p>
      </div>

      {/* Options */}
      <div className="grid grid-cols-2 gap-3">
        <AnimatePresence>
          {options.map((option, index) => {
            const isSelected = selected === option.name;
            const isCorrectAnswer = target?.name === option.name;
            const showAsCorrect = feedback && isCorrectAnswer;
            const showAsWrong = feedback === "wrong" && isSelected;

            return (
              <motion.button
                key={option.name}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => handleAnswer(option)}
                disabled={!!selected}
                className={cn(
                  "p-5 rounded-xl border-2 transition-all",
                  !feedback &&
                    !selected &&
                    "border-loft-plum-100 hover:border-loft-plum-300 hover:bg-loft-plum-50",
                  showAsCorrect && "border-choir-sage-500 bg-choir-sage-50",
                  showAsWrong && "border-ember-coral-500 bg-ember-coral-50",
                  feedback &&
                    !showAsCorrect &&
                    !showAsWrong &&
                    "border-loft-plum-100 opacity-50",
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="font-display text-2xl text-loft-plum-900">
                    {option.name}
                  </span>
                  {showAsCorrect && (
                    <CheckCircle className="w-6 h-6 text-choir-sage-500" />
                  )}
                  {showAsWrong && (
                    <XCircle className="w-6 h-6 text-ember-coral-500" />
                  )}
                </div>
              </motion.button>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Feedback */}
      <AnimatePresence>
        {feedback && target && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={cn(
              "rounded-lg p-4",
              feedback === "correct"
                ? "bg-choir-sage-50 border border-choir-sage-200"
                : "bg-brass-gold-50 border border-brass-gold-200",
            )}
          >
            <div className="flex items-start space-x-3">
              {feedback === "correct" ? (
                <CheckCircle className="w-5 h-5 text-choir-sage-500 flex-shrink-0 mt-0.5" />
              ) : (
                <Target className="w-5 h-5 text-brass-gold-500 flex-shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <p
                  className={cn(
                    "font-medium",
                    feedback === "correct"
                      ? "text-choir-sage-800"
                      : "text-brass-gold-800",
                  )}
                >
                  {feedback === "correct"
                    ? `Correct! It was ${target.name}`
                    : `The note was ${target.name}`}
                </p>
                <p className="text-sm text-loft-plum-600 mt-1">
                  Compare it with the reference C next time — distance is key.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
};
