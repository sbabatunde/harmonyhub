import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { gameService } from "@/api/services/gameService";
import {
  Play,
  Trophy,
  Target,
  Flame,
  RotateCcw,
  Drum,
  MousePointer2,
  Clock,
} from "lucide-react";
import { cn } from "@/utils/helpers";

// ----------------------------------------------------------- Types
interface RhythmPattern {
  id: number;
  bpm: number;
  beats: number[]; // ms offsets from start
  label: string;
  description: string;
  difficulty: 1 | 2 | 3;
}

interface TapResult {
  index: number;
  expectedMs: number;
  actualMs: number;
  diffMs: number;
  accuracy: "perfect" | "good" | "okay" | "miss";
}

type GamePhase =
  | "instructions"
  | "countdown"
  | "playing"
  | "result"
  | "gameover";

// ----------------------------------------------------------- Patterns
const PATTERNS: RhythmPattern[] = [
  // -------- Warmup (easy)
  {
    id: 1,
    bpm: 80,
    beats: [0, 750, 1500, 2250],
    label: "Steady Quarters",
    description: "Four even beats. Simple and relaxed.",
    difficulty: 1,
  },
  {
    id: 2,
    bpm: 85,
    beats: [0, 700, 1400, 2100, 2800],
    label: "Five Beat Pattern",
    description: "Extend the phrase by one beat.",
    difficulty: 1,
  },
  // -------- Intermediate
  {
    id: 3,
    bpm: 95,
    beats: [0, 320, 640, 960, 1280],
    label: "Faster Quarters",
    description: "Same idea, quicker tempo.",
    difficulty: 2,
  },
  {
    id: 4,
    bpm: 100,
    beats: [0, 300, 600, 900, 1200, 1500],
    label: "Six Beat Flow",
    description: "Longer phrase — keep your place.",
    difficulty: 2,
  },
  {
    id: 5,
    bpm: 105,
    beats: [0, 300, 900, 1200, 1800],
    label: "Eighth Note Groove",
    description: "Includes short-long pairs.",
    difficulty: 2,
  },
  // -------- Advanced
  {
    id: 6,
    bpm: 115,
    beats: [0, 260, 780, 1040, 1560, 1820],
    label: "Syncopation Intro",
    description: "Off-beat accents — feel the pulse.",
    difficulty: 3,
  },
  {
    id: 7,
    bpm: 125,
    beats: [0, 240, 480, 960, 1200, 1440, 1680],
    label: "Sixteenth Notes",
    description: "Fast runs with rests.",
    difficulty: 3,
  },
  {
    id: 8,
    bpm: 130,
    beats: [0, 230, 690, 920, 1150, 1610, 1840, 2070],
    label: "Advanced Groove",
    description: "Complex timing — trust your ear.",
    difficulty: 3,
  },
];

// ----------------------------------------------------------- Scoring
const ACCURACY_THRESHOLDS = {
  perfect: 60, // ±60ms
  good: 120,
  okay: 220,
};

const SCORE_VALUES = {
  perfect: 100,
  good: 50,
  okay: 25,
  miss: 0,
};

const TOTAL_ROUNDS = 5;
const COUNTDOWN_START = 3;
// const VISUAL_LEAD_MS = 2000; // how long before the beat the visual indicator starts

// ----------------------------------------------------------- Component
export const RhythmMaster: React.FC = () => {
  const [phase, setPhase] = useState<GamePhase>("instructions");
  const [round, setRound] = useState(1);
  const [pattern, setPattern] = useState<RhythmPattern | null>(null);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [perfectCount, setPerfectCount] = useState(0);
  const [tapResults, setTapResults] = useState<TapResult[]>([]);
  const [lastAccuracy, setLastAccuracy] = useState<
    "perfect" | "good" | "okay" | "miss" | null
  >(null);
  const [countdown, setCountdown] = useState(COUNTDOWN_START);
  const [isPatternPlaying, setIsPatternPlaying] = useState(false);
  const [beatIndex, setBeatIndex] = useState(-1);

  const audioContextRef = useRef<AudioContext | null>(null);
  const patternStartRef = useRef<number>(0);
  const timeoutsRef = useRef<NodeJS.Timeout[]>([]);
  const tapPadRef = useRef<HTMLButtonElement>(null);

  // --------------------------------------------------------- Audio
  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext();
    }
    return audioContextRef.current;
  }, []);

  const playClickSound = useCallback(
    (time: number, frequency: number = 880, duration = 0.08) => {
      const ctx = getAudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.value = frequency;

      gain.gain.setValueAtTime(0.4, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

      osc.start(time);
      osc.stop(time + duration);
    },
    [getAudioContext],
  );

  const playMetronomeBeep = useCallback(
    (time: number, isDownbeat: boolean) => {
      playClickSound(time, isDownbeat ? 1320 : 880, 0.1);
    },
    [playClickSound],
  );

  // --------------------------------------------------------- Pattern scheduling
  const scheduleAndPlayPattern = useCallback(
    (pat: RhythmPattern) => {
      const ctx = getAudioContext();
      const baseTime = ctx.currentTime + 0.1;
      patternStartRef.current = performance.now();

      setIsPatternPlaying(true);
      setTapResults([]);
      setLastAccuracy(null);
      setBeatIndex(-1);

      // Clear previous
      timeoutsRef.current.forEach(clearTimeout);
      timeoutsRef.current = [];

      // Schedule each beat
      pat.beats.forEach((offsetMs, index) => {
        // Audio
        const audioTime = baseTime + offsetMs / 1000;
        playClickSound(audioTime, 1200, 0.06);

        // Visual beat index update
        const t = setTimeout(() => {
          setBeatIndex(index);
        }, offsetMs);
        timeoutsRef.current.push(t);
      });

      // End-of-pattern
      const endMs = pat.beats[pat.beats.length - 1] + 1500;
      const endT = setTimeout(() => {
        setIsPatternPlaying(false);
        // Move to result phase after a brief pause
        setTimeout(() => setPhase("result"), 500);
      }, endMs);
      timeoutsRef.current.push(endT);
    },
    [getAudioContext, playClickSound],
  );

  // --------------------------------------------------------- Countdown
  const startCountdown = () => {
    setPhase("countdown");
    setCountdown(COUNTDOWN_START);

    const ctx = getAudioContext();
    let count = COUNTDOWN_START;

    const interval = setInterval(() => {
      count -= 1;
      setCountdown(count);

      // Beep on each countdown
      playMetronomeBeep(ctx.currentTime, count === 0);

      if (count <= 0) {
        clearInterval(interval);
      }
    }, 800);

    // Start pattern when countdown reaches 0
    const startT = setTimeout(
      () => {
        if (pattern) {
          setPhase("playing");
          scheduleAndPlayPattern(pattern);
        }
      },
      800 * COUNTDOWN_START + 300,
    );
    timeoutsRef.current.push(startT);
  };

  // --------------------------------------------------------- Round handling
  const pickPattern = useCallback((currentRound: number) => {
    const difficulty = currentRound <= 2 ? 1 : currentRound <= 4 ? 2 : 3;
    const pool = PATTERNS.filter((p) => p.difficulty === difficulty);
    const picked = pool[Math.floor(Math.random() * pool.length)];

    setPattern(picked);
    return picked;
  }, []);

  const startGame = async () => {
    setScore(0);
    setStreak(0);
    setBestStreak(0);
    setPerfectCount(0);
    setRound(1);

    pickPattern(1);
    // Kick off countdown after a tick so the pattern is set
    setTimeout(() => startCountdown(), 100);
  };

  const handleTap = useCallback(() => {
    if (!pattern || !isPatternPlaying) return;

    const now = performance.now();
    const tapOffsetMs = now - patternStartRef.current;
    const tapIndex = tapResults.length;

    if (tapIndex >= pattern.beats.length) return;

    const expectedMs = pattern.beats[tapIndex];
    const diffMs = tapOffsetMs - expectedMs;
    const absDiff = Math.abs(diffMs);

    let accuracy: TapResult["accuracy"];
    if (absDiff <= ACCURACY_THRESHOLDS.perfect) accuracy = "perfect";
    else if (absDiff <= ACCURACY_THRESHOLDS.good) accuracy = "good";
    else if (absDiff <= ACCURACY_THRESHOLDS.okay) accuracy = "okay";
    else accuracy = "miss";

    const result: TapResult = {
      index: tapIndex,
      expectedMs,
      actualMs: tapOffsetMs,
      diffMs,
      accuracy,
    };

    setTapResults((prev) => [...prev, result]);
    setLastAccuracy(accuracy);

    const points = SCORE_VALUES[accuracy];
    setScore((s) => s + points);

    if (accuracy === "perfect") {
      setPerfectCount((c) => c + 1);
    }

    if (accuracy === "miss") {
      setStreak(0);
    } else {
      setStreak((s) => {
        const next = s + 1;
        setBestStreak((b) => Math.max(b, next));
        return next;
      });
    }

    // Audio feedback
    const ctx = getAudioContext();
    if (accuracy === "perfect") {
      playClickSound(ctx.currentTime, 1600, 0.12);
    } else if (accuracy === "good") {
      playClickSound(ctx.currentTime, 1200, 0.1);
    }
  }, [pattern, isPatternPlaying, tapResults, getAudioContext, playClickSound]);

  const nextRound = async () => {
    if (round >= TOTAL_ROUNDS) {
      // End game
      stopAllTimeouts();
      setPhase("gameover");

      if (score > 0) {
        try {
          const totalPossible = TOTAL_ROUNDS * 4 * SCORE_VALUES.perfect;
          const accuracy = Math.round((score / totalPossible) * 100);
          await gameService.submitScore({
            game_type: "rhythm_master",
            score,
            accuracy_percentage: accuracy,
          });
        } catch (err) {
          console.error("Score submit failed:", err);
        }
      }
      return;
    }

    const next = round + 1;
    setRound(next);
    pickPattern(next);
    setTimeout(() => startCountdown(), 200);
  };

  const stopAllTimeouts = () => {
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
  };

  // --------------------------------------------------------- Keyboard support
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.code === "Space" && isPatternPlaying) {
        e.preventDefault();
        handleTap();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isPatternPlaying, handleTap]);

  // --------------------------------------------------------- Cleanup
  useEffect(() => {
    return () => {
      stopAllTimeouts();
      if (audioContextRef.current) audioContextRef.current.close();
    };
  }, []);

  // --------------------------------------------------------- Helpers

  // const getAccuracyColor = (acc: TapResult["accuracy"]) => {
  //   switch (acc) {
  //     case "perfect":
  //       return "bg-choir-sage-500 text-white";
  //     case "good":
  //       return "bg-brass-gold-400 text-loft-plum-900";
  //     case "okay":
  //       return "bg-loft-plum-300 text-loft-plum-900";
  //     case "miss":
  //       return "bg-ember-coral-500 text-white";
  //   }
  // };

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
            <Drum className="w-10 h-10 text-brass-gold-600" />
          </motion.div>
          <h2 className="text-3xl font-display text-loft-plum-900">
            Rhythm Master
          </h2>
          <p className="text-loft-plum-600 max-w-lg mx-auto">
            Train your sense of timing. Listen to a beat pattern, then tap along
            to lock in the groove.
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
                A <strong>countdown</strong> plays, then the beat pattern starts
              </span>
            </li>
            <li className="flex items-start">
              <span className="w-6 h-6 rounded-full bg-loft-plum-900 text-brass-gold-400 flex items-center justify-center text-xs font-medium mr-3 flex-shrink-0 mt-0.5">
                2
              </span>
              <span>
                <strong>Tap the pad</strong> (or press Spacebar) on each beat
              </span>
            </li>
            <li className="flex items-start">
              <span className="w-6 h-6 rounded-full bg-loft-plum-900 text-brass-gold-400 flex items-center justify-center text-xs font-medium mr-3 flex-shrink-0 mt-0.5">
                3
              </span>
              <span>
                Tap within <strong>±60ms</strong> for a perfect score
              </span>
            </li>
            <li className="flex items-start">
              <span className="w-6 h-6 rounded-full bg-loft-plum-900 text-brass-gold-400 flex items-center justify-center text-xs font-medium mr-3 flex-shrink-0 mt-0.5">
                4
              </span>
              <span>
                Play <strong>5 rounds</strong>. Difficulty rises every 2 rounds
              </span>
            </li>
          </ol>
        </div>

        <div className="bg-brass-gold-50 rounded-lg p-5 space-y-3">
          <h3 className="font-display text-lg text-brass-gold-800">Scoring</h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 rounded-full bg-choir-sage-500" />
              <span className="text-brass-gold-700">Perfect (±60ms) → 100</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 rounded-full bg-brass-gold-400" />
              <span className="text-brass-gold-700">Good (±120ms) → 50</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 rounded-full bg-loft-plum-300" />
              <span className="text-brass-gold-700">Okay (±220ms) → 25</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 rounded-full bg-ember-coral-500" />
              <span className="text-brass-gold-700">Miss → 0</span>
            </div>
          </div>
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

  // --------------------------------------------------------- Render: Countdown
  if (phase === "countdown") {
    return (
      <Card className="text-center py-16 space-y-4 max-w-lg mx-auto">
        <p className="text-sm font-medium text-loft-plum-500 uppercase tracking-wide">
          Get ready
        </p>
        <AnimatePresence mode="wait">
          <motion.div
            key={countdown}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            transition={{ type: "spring", damping: 12 }}
            className="text-8xl font-display text-brass-gold-500"
          >
            {countdown > 0 ? countdown : "GO!"}
          </motion.div>
        </AnimatePresence>
        <p className="text-loft-plum-600">{pattern?.label}</p>
      </Card>
    );
  }

  // --------------------------------------------------------- Render: Gameover
  if (phase === "gameover") {
    const totalBeats = TOTAL_ROUNDS * 4; // rough estimate
    const accuracy = Math.min(
      100,
      Math.round((score / (totalBeats * SCORE_VALUES.perfect)) * 100),
    );
    const grade =
      accuracy >= 85
        ? { label: "Immaculate timing!", color: "text-brass-gold-500" }
        : accuracy >= 65
          ? { label: "Great sense of rhythm", color: "text-choir-sage-500" }
          : accuracy >= 45
            ? { label: "Solid groove", color: "text-loft-plum-600" }
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

        <div className="grid grid-cols-3 gap-3">
          <div className="bg-loft-plum-50 rounded-lg p-3">
            <p className="text-xs text-loft-plum-500">Score</p>
            <p className="text-2xl font-display text-loft-plum-900">{score}</p>
          </div>
          <div className="bg-loft-plum-50 rounded-lg p-3">
            <p className="text-xs text-loft-plum-500">Perfect Taps</p>
            <p className="text-2xl font-display text-choir-sage-600">
              {perfectCount}
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

  // --------------------------------------------------------- Render: Playing / Result
  const progress = (round / TOTAL_ROUNDS) * 100;

  return (
    <Card className="space-y-5 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-display text-loft-plum-900">
            Rhythm Master
          </h2>
          <p className="text-sm text-loft-plum-500">
            Round {round} of {TOTAL_ROUNDS} · {pattern?.bpm} BPM
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

      {/* Pattern info */}
      <div className="bg-loft-plum-50 rounded-xl p-4 text-center space-y-1">
        <p className="font-display text-lg text-loft-plum-900">
          {pattern?.label}
        </p>
        <p className="text-sm text-loft-plum-500">{pattern?.description}</p>
      </div>

      {/* Beat visualization */}
      <div className="flex justify-center space-x-2 py-4">
        {pattern?.beats.map((_, index) => {
          const result = tapResults.find((r) => r.index === index);
          const isCurrent = beatIndex === index && isPatternPlaying;
          return (
            <motion.div
              key={index}
              animate={{
                scale: isCurrent ? 1.3 : 1,
                y: isCurrent ? -4 : 0,
              }}
              transition={{ type: "spring", damping: 15 }}
              className={cn(
                "w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-medium",
                result
                  ? result.accuracy === "perfect"
                    ? "bg-choir-sage-500 border-choir-sage-500 text-white"
                    : result.accuracy === "good"
                      ? "bg-brass-gold-400 border-brass-gold-400 text-loft-plum-900"
                      : result.accuracy === "okay"
                        ? "bg-loft-plum-300 border-loft-plum-300 text-loft-plum-900"
                        : "bg-ember-coral-500 border-ember-coral-500 text-white"
                  : isCurrent
                    ? "bg-brass-gold-100 border-brass-gold-500 text-brass-gold-700"
                    : "bg-white border-loft-plum-200 text-loft-plum-400",
              )}
            >
              {index + 1}
            </motion.div>
          );
        })}
      </div>

      {/* Tap pad */}
      <button
        ref={tapPadRef}
        onMouseDown={(e) => {
          e.preventDefault();
          handleTap();
        }}
        onTouchStart={(e) => {
          e.preventDefault();
          handleTap();
        }}
        disabled={!isPatternPlaying}
        className={cn(
          "w-full h-32 rounded-2xl border-4 transition-all duration-100 select-none",
          "flex items-center justify-center space-x-3",
          isPatternPlaying
            ? lastAccuracy === "perfect"
              ? "border-choir-sage-500 bg-choir-sage-50"
              : lastAccuracy === "good"
                ? "border-brass-gold-400 bg-brass-gold-50"
                : lastAccuracy === "miss"
                  ? "border-ember-coral-500 bg-ember-coral-50"
                  : "border-loft-plum-300 bg-loft-plum-50 hover:bg-loft-plum-100 active:scale-[0.98]"
            : "border-loft-plum-100 bg-loft-plum-50 cursor-not-allowed opacity-60",
        )}
      >
        {isPatternPlaying ? (
          <>
            <MousePointer2 className="w-8 h-8 text-loft-plum-500" />
            <span className="text-lg font-display text-loft-plum-700">
              TAP HERE
            </span>
          </>
        ) : (
          <>
            <Clock className="w-8 h-8 text-loft-plum-400" />
            <span className="text-lg font-display text-loft-plum-500">
              Wait for pattern...
            </span>
          </>
        )}
      </button>

      <p className="text-xs text-center text-loft-plum-400">
        Tip: Use the{" "}
        <kbd className="px-1.5 py-0.5 bg-loft-plum-100 rounded text-loft-plum-700">
          Space
        </kbd>{" "}
        key for faster taps
      </p>

      {/* Tap results */}
      {tapResults.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-loft-plum-500 uppercase tracking-wide">
            This Round
          </p>
          <div className="flex flex-wrap gap-2">
            {tapResults.map((result, i) => (
              <Badge
                key={i}
                variant={
                  result.accuracy === "perfect"
                    ? "sage"
                    : result.accuracy === "good"
                      ? "gold"
                      : result.accuracy === "miss"
                        ? "coral"
                        : "plum"
                }
              >
                {result.diffMs > 0 ? "+" : ""}
                {Math.round(result.diffMs)}ms
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Result phase */}
      {phase === "result" && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-brass-gold-50 rounded-lg p-4 text-center space-y-3"
        >
          <p className="font-display text-lg text-brass-gold-800">
            Round {round} complete
          </p>
          <div className="flex justify-center space-x-3">
            <Button variant="primary" onClick={nextRound}>
              {round >= TOTAL_ROUNDS ? "See Results" : "Next Round"}
            </Button>
          </div>
        </motion.div>
      )}

      {/* End session button */}
      {phase === "playing" && (
        <div className="flex justify-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              stopAllTimeouts();
              stopAllTimeouts();
              setPhase("gameover");
            }}
          >
            End Session
          </Button>
        </div>
      )}
    </Card>
  );
};
