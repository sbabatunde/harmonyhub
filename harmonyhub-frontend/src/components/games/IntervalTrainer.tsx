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

} from "lucide-react";
import { cn } from "@/utils/helpers";

// ----------------------------------------------------------- Types
interface Interval {
  name: string;
  shortName: string;
  semitones: number;
  mnemonic: string;
  songExample: string;
  difficulty: 1 | 2 | 3;
}

type GamePhase = "instructions" | "playing" | "result" | "gameover";

// ----------------------------------------------------------- Data
const INTERVALS: Interval[] = [
  {
    name: "Perfect Unison",
    shortName: "P1",
    semitones: 0,
    mnemonic: "Same note played twice",
    songExample: "Any note held steady",
    difficulty: 1,
  },
  {
    name: "Major Second",
    shortName: "M2",
    semitones: 2,
    mnemonic: "One whole step up",
    songExample: "Happy Birthday (first two notes)",
    difficulty: 1,
  },
  {
    name: "Major Third",
    shortName: "M3",
    semitones: 4,
    mnemonic: "Bright, happy sound",
    songExample: "When the Saints Go Marching In",
    difficulty: 1,
  },
  {
    name: "Perfect Fourth",
    shortName: "P4",
    semitones: 5,
    mnemonic: "Strong, open sound",
    songExample: "Here Comes the Bride",
    difficulty: 2,
  },
  {
    name: "Perfect Fifth",
    shortName: "P5",
    semitones: 7,
    mnemonic: "Very stable, powerful",
    songExample: "Twinkle Twinkle Little Star",
    difficulty: 2,
  },
  {
    name: "Major Sixth",
    shortName: "M6",
    semitones: 9,
    mnemonic: "Sweet, longing sound",
    songExample: "My Bonnie Lies Over the Ocean",
    difficulty: 2,
  },
  {
    name: "Minor Second",
    shortName: "m2",
    semitones: 1,
    mnemonic: "Tense, close together",
    songExample: "Jaws theme (first two notes)",
    difficulty: 2,
  },
  {
    name: "Minor Third",
    shortName: "m3",
    semitones: 3,
    mnemonic: "Sad, minor sound",
    songExample: "Greensleeves (first two notes)",
    difficulty: 3,
  },
  {
    name: "Tritone",
    shortName: "TT",
    semitones: 6,
    mnemonic: "Unstable, mysterious",
    songExample: "The Simpsons theme",
    difficulty: 3,
  },
  {
    name: "Minor Sixth",
    shortName: "m6",
    semitones: 8,
    mnemonic: "Sad and beautiful",
    songExample: "Go Down Moses",
    difficulty: 3,
  },
];

const DIFFICULTY_POOLS: Record<1 | 2 | 3, number> = {
  1: 3, // rounds 1-3 use easy intervals only
  2: 6, // rounds 4-6 add medium
  3: 10, // rounds 7+ use all
};

// ----------------------------------------------------------- Component
export const IntervalTrainer: React.FC = () => {
  const [phase, setPhase] = useState<GamePhase>("instructions");
  const [currentInterval, setCurrentInterval] = useState<Interval | null>(null);
  const [options, setOptions] = useState<Interval[]>([]);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [round, setRound] = useState(1);
  const [correctCount, setCorrectCount] = useState(0);
  const [hasPlayedCurrent, setHasPlayedCurrent] = useState(false);

  const audioContextRef = useRef<AudioContext | null>(null);
  const feedbackTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // --------------------------------------------------------- Audio
  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext();
    }
    return audioContextRef.current;
  }, []);

  const playNote = useCallback(
    (frequency: number, startTime: number, duration: number) => {
      const ctx = getAudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.type = "sine";
      osc.frequency.value = frequency;

      // Envelope to avoid clicks
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.3, startTime + 0.02);
      gain.gain.setValueAtTime(0.3, startTime + duration - 0.05);
      gain.gain.linearRampToValueAtTime(0, startTime + duration);

      osc.start(startTime);
      osc.stop(startTime + duration);
    },
    [getAudioContext],
  );

  const playInterval = useCallback(
    (interval: Interval) => {
      const ctx = getAudioContext();
      const now = ctx.currentTime + 0.05;

      const baseFreq = 261.63; // C4
      const secondFreq = baseFreq * Math.pow(2, interval.semitones / 12);

      // Play first note
      playNote(baseFreq, now, 0.6);
      // Play second note slightly later
      playNote(secondFreq, now + 0.7, 0.6);

      setHasPlayedCurrent(true);
    },
    [getAudioContext, playNote],
  );

  const playNoteOnly = useCallback(
    (interval: Interval, whichNote: "first" | "second") => {
      const ctx = getAudioContext();
      const now = ctx.currentTime + 0.05;

      const baseFreq = 261.63;
      const freq =
        whichNote === "first"
          ? baseFreq
          : baseFreq * Math.pow(2, interval.semitones / 12);

      playNote(freq, now, 0.6);
    },
    [getAudioContext, playNote],
  );

  // --------------------------------------------------------- Question generation
  const generateQuestion = useCallback(
    (currentRound: number) => {
      const poolSize =
        DIFFICULTY_POOLS[currentRound <= 3 ? 1 : currentRound <= 6 ? 2 : 3];
      const pool = INTERVALS.slice(0, poolSize);

      const correct = pool[Math.floor(Math.random() * pool.length)];

      // Build options: correct + 3 random others from pool
      const others = pool.filter((i) => i.name !== correct.name);
      const shuffledOthers = [...others].sort(() => Math.random() - 0.5);
      const chosen = shuffledOthers.slice(
        0,
        Math.min(3, shuffledOthers.length),
      );

      const allOptions = [correct, ...chosen].sort(() => Math.random() - 0.5);

      setCurrentInterval(correct);
      setOptions(allOptions);
      setSelectedOption(null);
      setFeedback(null);
      setHasPlayedCurrent(false);

      // Auto-play the interval after a short delay
      setTimeout(() => playInterval(correct), 400);
    },
    [playInterval],
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

  const handleAnswer = (option: Interval) => {
    if (selectedOption || !currentInterval) return;
    if (!hasPlayedCurrent) {
      playInterval(currentInterval);
      return;
    }

    setSelectedOption(option.name);
    const isCorrect = option.name === currentInterval.name;

    if (isCorrect) {
      setFeedback("correct");
      const points = 10 + streak * 2;
      setScore((s) => s + points);
      setStreak((s) => s + 1);
      setBestStreak((b) => Math.max(b, streak + 1));
      setCorrectCount((c) => c + 1);
    } else {
      setFeedback("wrong");
      setStreak(0);
    }

    // Move to next round
    feedbackTimeoutRef.current = setTimeout(() => {
      const nextRound = round + 1;
      if (nextRound > 10) {
        setPhase("gameover");
        // Submit score
        gameService
          .submitScore({
            game_type: "interval_trainer",
            score: score + (isCorrect ? 10 + streak * 2 : 0),
            accuracy_percentage: Math.round(
              ((correctCount + (isCorrect ? 1 : 0)) / 10) * 100,
            ),
          })
          .catch((err) => console.error("Score submit failed:", err));
      } else {
        setRound(nextRound);
        generateQuestion(nextRound);
      }
    }, 1800);
  };

  // Cleanup
  useEffect(() => {
    return () => {
      if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current);
      if (audioContextRef.current) audioContextRef.current.close();
    };
  }, []);

  const formatScore = () => score.toLocaleString();

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
            <BookOpen className="w-10 h-10 text-brass-gold-600" />
          </motion.div>
          <h2 className="text-3xl font-display text-loft-plum-900">
            Interval Trainer
          </h2>
          <p className="text-loft-plum-600 max-w-lg mx-auto">
            Train your ear to recognize musical intervals — the distance between
            two notes. This is the foundation of harmony singing.
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
                You'll hear <strong>two notes played in sequence</strong>
              </span>
            </li>
            <li className="flex items-start">
              <span className="w-6 h-6 rounded-full bg-loft-plum-900 text-brass-gold-400 flex items-center justify-center text-xs font-medium mr-3 flex-shrink-0 mt-0.5">
                2
              </span>
              <span>
                Choose which <strong>interval</strong> you heard from the
                options
              </span>
            </li>
            <li className="flex items-start">
              <span className="w-6 h-6 rounded-full bg-loft-plum-900 text-brass-gold-400 flex items-center justify-center text-xs font-medium mr-3 flex-shrink-0 mt-0.5">
                3
              </span>
              <span>
                Get <strong>10 rounds</strong>. Difficulty increases after round
                3 and again at round 7
              </span>
            </li>
            <li className="flex items-start">
              <span className="w-6 h-6 rounded-full bg-loft-plum-900 text-brass-gold-400 flex items-center justify-center text-xs font-medium mr-3 flex-shrink-0 mt-0.5">
                4
              </span>
              <span>
                Build <strong>streaks</strong> for bonus points. Missing resets
                your streak
              </span>
            </li>
          </ol>
        </div>

        <div className="bg-brass-gold-50 rounded-lg p-5 space-y-3">
          <h3 className="font-display text-lg text-brass-gold-800">
            Tips for success
          </h3>
          <ul className="space-y-2 text-sm text-brass-gold-700">
            <li>🎵 Listen for the "shape" — bright, sad, tense, or open</li>
            <li>🎵 Use the replay button to hear the interval again</li>
            <li>🎵 Use the reference song for each interval to remember it</li>
            <li>🎵 Don't rush — the answer buttons stay available</li>
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
    const accuracy = Math.round((correctCount / 10) * 100);
    const grade =
      accuracy >= 90
        ? { label: "Outstanding!", color: "text-brass-gold-500" }
        : accuracy >= 70
          ? { label: "Great work!", color: "text-choir-sage-500" }
          : accuracy >= 50
            ? { label: "Good progress", color: "text-loft-plum-600" }
            : { label: "Keep practicing", color: "text-loft-plum-500" };

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

        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="bg-loft-plum-50 rounded-lg p-3">
            <p className="text-xs text-loft-plum-500">Score</p>
            <p className="text-2xl font-display text-loft-plum-900">
              {formatScore()}
            </p>
          </div>
          <div className="bg-loft-plum-50 rounded-lg p-3">
            <p className="text-xs text-loft-plum-500">Accuracy</p>
            <p className="text-2xl font-display text-choir-sage-600">
              {accuracy}%
            </p>
          </div>
          <div className="bg-loft-plum-50 rounded-lg p-3">
            <p className="text-xs text-loft-plum-500">Best Streak</p>
            <p className="text-2xl font-display text-brass-gold-500">
              {bestStreak}
            </p>
          </div>
        </div>

        <div className="flex justify-center space-x-3 pt-2">
          <Button variant="primary" onClick={startGame}>
            <RotateCcw className="w-4 h-4 mr-2" />
            Play Again
          </Button>
        </div>
      </Card>
    );
  }

  // --------------------------------------------------------- Render: Playing
  const progress = (round / 10) * 100;
  const currentDifficultyLabel =
    round <= 3 ? "Warmup" : round <= 6 ? "Intermediate" : "Advanced";

  return (
    <Card className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-display text-loft-plum-900">
            Interval Trainer
          </h2>
          <p className="text-sm text-loft-plum-500">
            Round {round} of 10 · {currentDifficultyLabel}
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Badge variant="plum">
            <Target className="w-3 h-3 mr-1" />
            {formatScore()} pts
          </Badge>
          {streak > 0 && (
            <Badge variant="gold">
              <Flame className="w-3 h-3 mr-1" />
              {streak} streak
            </Badge>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <ProgressBar value={progress} color="gold" />

      {/* Playback area */}
      <div className="bg-loft-plum-50 rounded-xl p-8 text-center space-y-4">
        <p className="text-sm font-medium text-loft-plum-600">
          Listen to the interval, then choose your answer
        </p>

        <div className="flex justify-center space-x-3">
          <Button
            variant="primary"
            size="lg"
            onClick={() => currentInterval && playInterval(currentInterval)}
          >
            <Volume2 className="w-5 h-5 mr-2" />
            Play Interval
          </Button>

          {currentInterval && (
            <>
              <Button
                variant="outline"
                size="lg"
                onClick={() => playNoteOnly(currentInterval, "first")}
              >
                Play 1st Note
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => playNoteOnly(currentInterval, "second")}
              >
                Play 2nd Note
              </Button>
            </>
          )}
        </div>

        <p className="text-xs text-loft-plum-400">
          Tip: Use the individual notes if you need help
        </p>
      </div>

      {/* Options */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <AnimatePresence mode="wait">
          {options.map((option, index) => {
            const isSelected = selectedOption === option.name;
            const isCorrectAnswer = currentInterval?.name === option.name;
            const showAsCorrect = feedback && isCorrectAnswer;
            const showAsWrong = feedback === "wrong" && isSelected;

            return (
              <motion.button
                key={option.name}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => handleAnswer(option)}
                disabled={!!selectedOption}
                className={cn(
                  "p-4 rounded-xl text-left transition-all border-2",
                  !feedback &&
                    !selectedOption &&
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
                  <div className="flex-1">
                    <p className="font-display text-loft-plum-900">
                      {option.name}
                    </p>
                    <p className="text-xs text-loft-plum-500 mt-0.5">
                      {option.mnemonic}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2 flex-shrink-0 ml-2">
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

      {/* Feedback with reference */}
      <AnimatePresence>
        {feedback && currentInterval && (
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
                    ? `Correct! +${10 + (streak - 1) * 2} points`
                    : `Not quite. It was ${currentInterval.name}`}
                </p>
                <p className="text-sm text-loft-plum-600 mt-1">
                  <strong>Remember it by:</strong> {currentInterval.songExample}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
};
