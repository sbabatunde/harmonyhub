import { useState, useEffect, useRef, useCallback } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { gameService } from "@/api/services/gameService";
import { Play, Square, Music, Zap, Target, Timer } from "lucide-react";
import { cn } from "@/utils/helpers";

interface RhythmPattern {
  id: number;
  bpm: number;
  beats: number[];
  difficulty: "easy" | "medium" | "hard";
  label: string;
}

interface TapResult {
  index: number;
  expectedTime: number;
  actualTime: number;
  accuracy: "perfect" | "good" | "okay" | "miss";
  timingError: number;
}

const RHYTHM_PATTERNS: RhythmPattern[] = [
  {
    id: 1,
    bpm: 80,
    beats: [0, 750, 1500, 2250],
    difficulty: "easy",
    label: "Simple Quarter Notes",
  },
  {
    id: 2,
    bpm: 90,
    beats: [0, 500, 1000, 1500, 2000],
    difficulty: "easy",
    label: "Five Beat Pattern",
  },
  {
    id: 3,
    bpm: 100,
    beats: [0, 300, 600, 900, 1200, 1500],
    difficulty: "medium",
    label: "Eighth Notes",
  },
  {
    id: 4,
    bpm: 110,
    beats: [0, 250, 500, 750, 1000, 1250, 1500],
    difficulty: "medium",
    label: "Faster Eighth Notes",
  },
  {
    id: 5,
    bpm: 120,
    beats: [0, 250, 500, 1000, 1250, 1500, 1750],
    difficulty: "hard",
    label: "Syncopated Rhythm",
  },
  {
    id: 6,
    bpm: 130,
    beats: [0, 200, 400, 600, 800, 1000, 1200, 1400, 1600],
    difficulty: "hard",
    label: "Sixteenth Notes",
  },
];

const ACCURACY_THRESHOLDS = {
  perfect: 50, // ms
  good: 100, // ms
  okay: 200, // ms
};

const SCORE_VALUES = {
  perfect: 100,
  good: 50,
  okay: 25,
  miss: 0,
};

export const RhythmMaster: React.FC = () => {
  const [currentPattern, setCurrentPattern] = useState<RhythmPattern | null>(
    null,
  );
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [round, setRound] = useState(1);
  const [gameStarted, setGameStarted] = useState(false);
  const [isPatternPlaying, setIsPatternPlaying] = useState(false);
  const [userTaps, setUserTaps] = useState<number[]>([]);
  const [tapResults, setTapResults] = useState<TapResult[]>([]);
  const [lastAccuracy, setLastAccuracy] = useState<
    "perfect" | "good" | "okay" | "miss" | null
  >(null);
  const [patternStartTime, setPatternStartTime] = useState<number>(0);

  const audioContextRef = useRef<AudioContext | null>(null);
  const patternTimeoutRef = useRef<NodeJS.Timeout[]>([]);
  const tapPadRef = useRef<HTMLButtonElement>(null);

  // Audio setup
  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext();
    }
    return audioContextRef.current;
  }, []);

  // Play a drum sound
  const playDrumSound = useCallback(
    (time: number, frequency: number = 200) => {
      const ctx = getAudioContext();

      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.type = "sine";
      oscillator.frequency.value = frequency;

      gainNode.gain.setValueAtTime(0.5, time);
      gainNode.gain.exponentialRampToValueAtTime(0.001, time + 0.1);

      oscillator.start(time);
      oscillator.stop(time + 0.1);
    },
    [getAudioContext],
  );

  // Play metronome click
  const playMetronomeClick = useCallback(
    (time: number) => {
      playDrumSound(time, 1000); // Higher frequency for metronome
    },
    [playDrumSound],
  );

  // Play the current pattern
  const playPattern = useCallback(
    (pattern: RhythmPattern) => {
      const ctx = getAudioContext();
      const now = ctx.currentTime;
      setPatternStartTime(performance.now());
      setIsPatternPlaying(true);
      setUserTaps([]);
      setTapResults([]);
      setLastAccuracy(null);

      // Clear any existing timeouts
      patternTimeoutRef.current.forEach((timeout) => clearTimeout(timeout));
      patternTimeoutRef.current = [];

      // Play each beat
      pattern.beats.forEach((beatTime, index) => {
        const timeout = setTimeout(() => {
          playDrumSound(ctx.currentTime, 200);
        }, beatTime);
        patternTimeoutRef.current.push(timeout);
      });

      // Set timeout to mark pattern as finished
      const endTimeout = setTimeout(
        () => {
          setIsPatternPlaying(false);
        },
        pattern.beats[pattern.beats.length - 1] + 500,
      );
      patternTimeoutRef.current.push(endTimeout);
    },
    [getAudioContext, playDrumSound],
  );

  // Handle tap
  const handleTap = useCallback(() => {
    if (!isPatternPlaying || !currentPattern) return;

    const tapTime = performance.now() - patternStartTime;
    const tapIndex = userTaps.length;

    if (tapIndex >= currentPattern.beats.length) return;

    const expectedTime = currentPattern.beats[tapIndex];
    const timingError = Math.abs(tapTime - expectedTime);

    let accuracy: TapResult["accuracy"];
    if (timingError <= ACCURACY_THRESHOLDS.perfect) {
      accuracy = "perfect";
    } else if (timingError <= ACCURACY_THRESHOLDS.good) {
      accuracy = "good";
    } else if (timingError <= ACCURACY_THRESHOLDS.okay) {
      accuracy = "okay";
    } else {
      accuracy = "miss";
    }

    const result: TapResult = {
      index: tapIndex,
      expectedTime,
      actualTime: tapTime,
      accuracy,
      timingError,
    };

    setTapResults((prev) => [...prev, result]);
    setUserTaps((prev) => [...prev, tapTime]);
    setLastAccuracy(accuracy);

    // Update score
    const pointsEarned = SCORE_VALUES[accuracy];
    setScore((prev) => prev + pointsEarned);

    if (accuracy !== "miss") {
      const newStreak = streak + 1;
      setStreak(newStreak);
      setBestStreak((prev) => Math.max(prev, newStreak));
    } else {
      setStreak(0);
    }

    // Play feedback sound
    if (accuracy === "perfect") {
      playDrumSound(getAudioContext().currentTime, 800); // High pitch for perfect
    } else if (accuracy === "good") {
      playDrumSound(getAudioContext().currentTime, 400); // Medium pitch
    }
  }, [
    isPatternPlaying,
    currentPattern,
    userTaps,
    patternStartTime,
    streak,
    getAudioContext,
    playDrumSound,
  ]);

  // Generate random pattern
  const generatePattern = useCallback(() => {
    const difficultyPool = RHYTHM_PATTERNS.filter((p) =>
      round <= 3
        ? p.difficulty === "easy"
        : round <= 6
          ? p.difficulty !== "hard"
          : true,
    );

    const pattern =
      difficultyPool[Math.floor(Math.random() * difficultyPool.length)];
    setCurrentPattern(pattern);
    return pattern;
  }, [round]);

  // Start game
  const startGame = async () => {
    setGameStarted(true);
    setScore(0);
    setStreak(0);
    setBestStreak(0);
    setRound(1);

    const pattern = generatePattern();
    setTimeout(() => playPattern(pattern), 500);
  };

  // Next round
  const nextRound = () => {
    setRound((prev) => prev + 1);
    const pattern = generatePattern();
    setTimeout(() => playPattern(pattern), 500);
  };

  // End game
  const endGame = async () => {
    setGameStarted(false);
    setCurrentPattern(null);
    setIsPatternPlaying(false);

    // Clear all timeouts
    patternTimeoutRef.current.forEach((timeout) => clearTimeout(timeout));
    patternTimeoutRef.current = [];

    if (score > 0) {
      try {
        await gameService.submitScore({
          game_type: "rhythm_master",
          score,
          accuracy_percentage: calculateOverallAccuracy(),
        });
      } catch (error) {
        console.error("Failed to submit score:", error);
      }
    }
  };

  // Calculate overall accuracy
  const calculateOverallAccuracy = () => {
    if (tapResults.length === 0) return 0;
    const totalPossible = tapResults.length * SCORE_VALUES.perfect;
    const actualScore = tapResults.reduce(
      (sum, result) => sum + SCORE_VALUES[result.accuracy],
      0,
    );
    return (actualScore / totalPossible) * 100;
  };

  // Keyboard listener for spacebar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space" && gameStarted && isPatternPlaying) {
        e.preventDefault();
        handleTap();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [gameStarted, isPatternPlaying, handleTap]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      patternTimeoutRef.current.forEach((timeout) => clearTimeout(timeout));
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  const getAccuracyColor = (accuracy: TapResult["accuracy"]) => {
    switch (accuracy) {
      case "perfect":
        return "bg-choir-sage-500 text-white";
      case "good":
        return "bg-brass-gold-400 text-loft-plum-900";
      case "okay":
        return "bg-loft-plum-300 text-loft-plum-900";
      case "miss":
        return "bg-ember-coral-500 text-white";
      default:
        return "bg-loft-plum-100 text-loft-plum-700";
    }
  };

  const getAccuracyLabel = (accuracy: TapResult["accuracy"]) => {
    switch (accuracy) {
      case "perfect":
        return "Perfect!";
      case "good":
        return "Good";
      case "okay":
        return "Okay";
      case "miss":
        return "Miss";
      default:
        return "";
    }
  };

  return (
    <Card className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-display text-loft-plum-900">
          Rhythm Master
        </h2>
        <p className="text-loft-plum-500 mt-1">
          Tap along to the rhythm pattern
        </p>
      </div>

      {!gameStarted ? (
        <div className="text-center space-y-6">
          <div className="text-6xl">🥁</div>

          <div className="space-y-3">
            <h3 className="font-display text-lg text-loft-plum-800">
              How to Play
            </h3>
            <ul className="text-left space-y-2 text-loft-plum-600">
              <li className="flex items-center">
                <Play className="w-4 h-4 mr-2 text-choir-sage-500" />
                Listen to the rhythm pattern
              </li>
              <li className="flex items-center">
                <Target className="w-4 h-4 mr-2 text-brass-gold-500" />
                Tap the pad (or press spacebar) to match each beat
              </li>
              <li className="flex items-center">
                <Timer className="w-4 h-4 mr-2 text-loft-plum-500" />
                The closer your timing, the more points you earn
              </li>
            </ul>
          </div>

          <div className="flex justify-center space-x-4">
            <Badge variant="sage">Easy</Badge>
            <Badge variant="gold">Medium</Badge>
            <Badge variant="coral">Hard</Badge>
          </div>

          <Button variant="sage" size="lg" onClick={startGame}>
            Start Game
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Score Display */}
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-loft-plum-500">Score</p>
              <p className="text-2xl font-display text-loft-plum-900">
                {score}
              </p>
            </div>
            <div>
              <p className="text-sm text-loft-plum-500">Streak</p>
              <p className="text-2xl font-display text-brass-gold-500">
                {streak} 🔥
              </p>
            </div>
            <div>
              <p className="text-sm text-loft-plum-500">Round</p>
              <p className="text-2xl font-display text-loft-plum-900">
                {round}
              </p>
            </div>
          </div>

          {/* Pattern Info */}
          {currentPattern && (
            <div className="text-center space-y-2">
              <Badge
                variant={
                  currentPattern.difficulty === "easy"
                    ? "sage"
                    : currentPattern.difficulty === "medium"
                      ? "gold"
                      : "coral"
                }
              >
                {currentPattern.difficulty}
              </Badge>
              <p className="text-loft-plum-600">{currentPattern.label}</p>
              <p className="text-sm text-loft-plum-400">
                {currentPattern.bpm} BPM
              </p>
            </div>
          )}

          {/* Tap Pad */}
          <div className="text-center space-y-4">
            <button
              ref={tapPadRef}
              onMouseDown={handleTap}
              onTouchStart={(e) => {
                e.preventDefault();
                handleTap();
              }}
              className={cn(
                "w-full h-40 rounded-2xl border-4 transition-all duration-150",
                "focus:outline-none focus:ring-4",
                isPatternPlaying
                  ? "border-loft-plum-300 bg-loft-plum-100 hover:bg-loft-plum-200 active:bg-loft-plum-300 cursor-pointer"
                  : "border-loft-plum-200 bg-loft-plum-50 cursor-not-allowed",
                lastAccuracy === "perfect" &&
                  "border-choir-sage-500 bg-choir-sage-100",
                lastAccuracy === "good" &&
                  "border-brass-gold-400 bg-brass-gold-100",
                lastAccuracy === "miss" &&
                  "border-ember-coral-500 bg-ember-coral-100",
              )}
              disabled={!isPatternPlaying}
            >
              <div className="flex flex-col items-center justify-center space-y-2">
                <Music
                  className={cn(
                    "w-12 h-12",
                    isPatternPlaying
                      ? "text-loft-plum-500"
                      : "text-loft-plum-300",
                  )}
                />
                <span
                  className={cn(
                    "text-lg font-medium",
                    isPatternPlaying
                      ? "text-loft-plum-700"
                      : "text-loft-plum-400",
                  )}
                >
                  {isPatternPlaying ? "TAP HERE!" : "Listen..."}
                </span>
                {lastAccuracy && (
                  <Badge
                    variant={
                      lastAccuracy === "perfect"
                        ? "sage"
                        : lastAccuracy === "good"
                          ? "gold"
                          : lastAccuracy === "miss"
                            ? "coral"
                            : "neutral"
                    }
                  >
                    {getAccuracyLabel(lastAccuracy)}
                  </Badge>
                )}
              </div>
            </button>
            <p className="text-sm text-loft-plum-400">
              Tip: You can also press the spacebar
            </p>
          </div>

          {/* Tap Results */}
          {tapResults.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-loft-plum-600">
                Your Taps
              </h4>
              <div className="flex flex-wrap gap-2">
                {tapResults.map((result, index) => (
                  <div
                    key={index}
                    className={cn(
                      "px-2 py-1 rounded-lg text-xs font-medium",
                      getAccuracyColor(result.accuracy),
                    )}
                    title={`Timing error: ${result.timingError.toFixed(0)}ms`}
                  >
                    {getAccuracyLabel(result.accuracy)}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Game Controls */}
          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={nextRound}
              disabled={isPatternPlaying}
            >
              Skip Pattern
            </Button>
            <Button variant="coral" onClick={endGame}>
              <Square className="w-4 h-4 mr-2" />
              End Game
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
};
