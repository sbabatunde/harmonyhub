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
  BookOpen,
  RotateCcw,
  Music,
  Layers,
  Sparkles,
} from "lucide-react";
import { cn } from "@/utils/helpers";

// ----------------------------------------------------------- Types
interface ChordQuality {
  name: string;
  shortName: string;
  intervals: number[]; // semitones from root
  mood: string;
  example: string;
  difficulty: 1 | 2 | 3;
}

type GamePhase = "instructions" | "playing" | "gameover";
type PlayStyle = "block" | "arpeggio";

// ----------------------------------------------------------- Chord data
const CHORD_QUALITIES: ChordQuality[] = [
  {
    name: "Major",
    shortName: "Maj",
    intervals: [0, 4, 7],
    mood: "Bright, happy, stable",
    example: "Most worship songs and hymns",
    difficulty: 1,
  },
  {
    name: "Minor",
    shortName: "Min",
    intervals: [0, 3, 7],
    mood: "Sad, soft, reflective",
    example: "Many Lenten and reflective songs",
    difficulty: 1,
  },
  {
    name: "Diminished",
    shortName: "Dim",
    intervals: [0, 3, 6],
    mood: "Tense, unstable, resolving",
    example: "Transitional chords — feel the pull",
    difficulty: 2,
  },
  {
    name: "Augmented",
    shortName: "Aug",
    intervals: [0, 4, 8],
    mood: "Mysterious, floating, dream-like",
    example: "Uncommon but striking",
    difficulty: 3,
  },
  {
    name: "Suspended 4th",
    shortName: "Sus4",
    intervals: [0, 5, 7],
    mood: "Open, unresolved, waiting",
    example: "Worship 'sus' chords before resolution",
    difficulty: 2,
  },
  {
    name: "Major 7th",
    shortName: "Maj7",
    intervals: [0, 4, 7, 11],
    mood: "Warm, jazzy, lush",
    example: "Contemporary worship ballads",
    difficulty: 3,
  },
];

const DIFFICULTY_POOLS: Record<1 | 2 | 3, number> = {
  1: 2, // major, minor
  2: 5, // + diminished, augmented, sus4
  3: 6, // all
};

const ROOT_FREQUENCY = 261.63; // C4
const TOTAL_ROUNDS = 10;

// ----------------------------------------------------------- Component
export const ChordEarTraining: React.FC = () => {
  const [phase, setPhase] = useState<GamePhase>("instructions");
  const [target, setTarget] = useState<ChordQuality | null>(null);
  const [options, setOptions] = useState<ChordQuality[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [round, setRound] = useState(1);
  const [correctCount, setCorrectCount] = useState(0);
  const [playStyle, setPlayStyle] = useState<PlayStyle>("block");

  const audioContextRef = useRef<AudioContext | null>(null);
  const feedbackTimeoutRef = useRef<NodeJS.Timeout>();

  // --------------------------------------------------------- Audio
  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext();
    }
    return audioContextRef.current;
  }, []);

  const playChord = useCallback(
    (chord: ChordQuality, style: PlayStyle = "block") => {
      const ctx = getAudioContext();
      const now = ctx.currentTime + 0.05;

      // Master gain to avoid clipping when 4 notes hit at once
      const masterGain = ctx.createGain();
      masterGain.connect(ctx.destination);
      masterGain.gain.value = 0.75;

      chord.intervals.forEach((semitones, index) => {
        const freq = ROOT_FREQUENCY * Math.pow(2, semitones / 12);
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.connect(gain);
        gain.connect(masterGain);
        osc.type = "sine";
        osc.frequency.value = freq;

        const noteDuration = 1.6;
        const startTime = style === "block" ? now : now + index * 0.12;

        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(0.3, startTime + 0.04);
        gain.gain.setValueAtTime(0.3, startTime + noteDuration - 0.1);
        gain.gain.linearRampToValueAtTime(0, startTime + noteDuration);

        osc.start(startTime);
        osc.stop(startTime + noteDuration);
      });
    },
    [getAudioContext],
  );

  // --------------------------------------------------------- Question generation
  const generateQuestion = useCallback(
    (currentRound: number) => {
      const poolSize =
        DIFFICULTY_POOLS[currentRound <= 3 ? 1 : currentRound <= 7 ? 2 : 3];
      const pool = CHORD_QUALITIES.slice(0, poolSize);

      const correct = pool[Math.floor(Math.random() * pool.length)];
      const others = pool.filter((c) => c.name !== correct.name);
      const shuffled = [...others].sort(() => Math.random() - 0.5);
      const chosen = shuffled.slice(0, Math.min(3, shuffled.length));

      setTarget(correct);
      setOptions([correct, ...chosen].sort(() => Math.random() - 0.5));
      setSelected(null);
      setFeedback(null);

      setTimeout(() => playChord(correct, playStyle), 500);
    },
    [playChord, playStyle],
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

  const handleAnswer = (option: ChordQuality) => {
    if (selected || !target) return;

    setSelected(option.name);
    const isCorrect = option.name === target.name;

    if (isCorrect) {
      setFeedback("correct");
      setScore((s) => s + 15 + streak * 3);
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
    }, 2000);
  };

  const endGame = async (lastWasCorrect: boolean) => {
    setPhase("gameover");
    const finalScore = score + (lastWasCorrect ? 15 + streak * 3 : 0);
    const finalCorrect = correctCount + (lastWasCorrect ? 1 : 0);

    if (finalScore > 0) {
      try {
        await gameService.submitScore({
          game_type: "interval_trainer", // reuse bucket
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
            <Layers className="w-10 h-10 text-brass-gold-600" />
          </motion.div>
          <h2 className="text-3xl font-display text-loft-plum-900">
            Chord Ear Training
          </h2>
          <p className="text-loft-plum-600 max-w-lg mx-auto">
            Identify chord qualities by ear — the foundation for singing harmony
            and hearing the "color" of worship music.
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
                A chord plays. <strong>Identify its quality</strong> — major,
                minor, diminished, etc.
              </span>
            </li>
            <li className="flex items-start">
              <span className="w-6 h-6 rounded-full bg-loft-plum-900 text-brass-gold-400 flex items-center justify-center text-xs font-medium mr-3 flex-shrink-0 mt-0.5">
                2
              </span>
              <span>
                Switch between <strong>block</strong> (all notes together) and
                <strong> arpeggio</strong> (notes in sequence)
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
                <strong>Replay</strong> the chord as many times as you need
              </span>
            </li>
          </ol>
        </div>

        <div className="bg-brass-gold-50 rounded-lg p-5 space-y-3">
          <h3 className="font-display text-lg text-brass-gold-800">
            The chord qualities
          </h3>
          <ul className="space-y-2 text-sm text-brass-gold-700">
            <li>
              <strong>Major</strong> — bright, happy, stable
            </li>
            <li>
              <strong>Minor</strong> — sad, soft, reflective
            </li>
            <li>
              <strong>Diminished</strong> — tense, unstable (round 4+)
            </li>
            <li>
              <strong>Augmented</strong> — mysterious, dream-like (round 4+)
            </li>
            <li>
              <strong>Sus4</strong> — open, unresolved (round 4+)
            </li>
            <li>
              <strong>Major 7th</strong> — warm, jazzy, lush (round 8+)
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
        ? { label: "Beautiful ear!", color: "text-brass-gold-500" }
        : accuracy >= 70
          ? { label: "Strong harmonic sense", color: "text-choir-sage-500" }
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
            Chord Ear Training
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
      <div className="bg-loft-plum-50 rounded-xl p-6 space-y-4">
        <p className="text-sm font-medium text-loft-plum-600 text-center">
          Listen to the chord
        </p>

        <div className="flex justify-center items-center space-x-3">
          <Button
            variant="primary"
            size="lg"
            onClick={() => target && playChord(target, playStyle)}
          >
            <Volume2 className="w-5 h-5 mr-2" />
            Play Chord
          </Button>

          {/* Play style toggle */}
          <div className="flex items-center space-x-1 bg-white rounded-lg p-1">
            <button
              onClick={() => setPlayStyle("block")}
              className={cn(
                "px-3 py-1.5 rounded text-sm font-medium transition-colors",
                playStyle === "block"
                  ? "bg-loft-plum-600 text-white"
                  : "text-loft-plum-600",
              )}
            >
              Block
            </button>
            <button
              onClick={() => setPlayStyle("arpeggio")}
              className={cn(
                "px-3 py-1.5 rounded text-sm font-medium transition-colors",
                playStyle === "arpeggio"
                  ? "bg-loft-plum-600 text-white"
                  : "text-loft-plum-600",
              )}
            >
              Arpeggio
            </button>
          </div>
        </div>

        <p className="text-xs text-loft-plum-400 text-center">
          Block = all notes at once · Arpeggio = notes one after another
        </p>
      </div>

      {/* Options */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
                  "p-4 rounded-xl border-2 text-left transition-all",
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
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-display text-loft-plum-900">
                      {option.name}
                    </p>
                    <p className="text-xs text-loft-plum-500 mt-0.5">
                      {option.mood}
                    </p>
                  </div>
                  <div className="flex-shrink-0 ml-2">
                    {showAsCorrect && (
                      <CheckCircle className="w-5 h-5 text-choir-sage-500" />
                    )}
                    {showAsWrong && (
                      <XCircle className="w-5 h-5 text-ember-coral-500" />
                    )}
                  </div>
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
                <Sparkles className="w-5 h-5 text-brass-gold-500 flex-shrink-0 mt-0.5" />
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
                    : `The chord was ${target.name}`}
                </p>
                <p className="text-sm text-loft-plum-600 mt-1">
                  <strong>Character:</strong> {target.mood}
                </p>
                <p className="text-xs text-loft-plum-500 mt-0.5">
                  <strong>Where you'll hear it:</strong> {target.example}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
};
