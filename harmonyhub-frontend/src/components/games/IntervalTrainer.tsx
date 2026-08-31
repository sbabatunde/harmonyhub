import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { gameService } from "@/api/services/gameService";
import { Play, CheckCircle, XCircle } from "lucide-react";

interface Interval {
  name: string;
  semitones: number;
  description: string;
}

const INTERVALS: Interval[] = [
  { name: "Unison", semitones: 0, description: "Same note" },
  { name: "Minor 2nd", semitones: 1, description: "Jaws theme" },
  { name: "Major 2nd", semitones: 2, description: "Happy Birthday" },
  { name: "Minor 3rd", semitones: 3, description: "Greensleeves" },
  { name: "Major 3rd", semitones: 4, description: "Oh When the Saints" },
  { name: "Perfect 4th", semitones: 5, description: "Here Comes the Bride" },
  { name: "Perfect 5th", semitones: 7, description: "Star Wars theme" },
];

export const IntervalTrainer = () => {
  const [currentInterval, setCurrentInterval] = useState<Interval | null>(null);
  const [options, setOptions] = useState<Interval[]>([]);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [round, setRound] = useState(1);
  const [gameStarted, setGameStarted] = useState(false);
  const [feedback, setFeedback] = useState<"correct" | "incorrect" | null>(
    null,
  );
  const audioContextRef = useRef<AudioContext | null>(null);

  const playInterval = (interval: Interval) => {
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext();
    }

    const ctx = audioContextRef.current;
    const baseFrequency = 261.63; // C4
    const intervalFrequency =
      baseFrequency * Math.pow(2, interval.semitones / 12);

    // Play first note
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.frequency.value = baseFrequency;
    gain1.gain.value = 0.5;
    osc1.start(ctx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
    osc1.stop(ctx.currentTime + 0.5);

    // Play second note after slight delay
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.frequency.value = intervalFrequency;
    gain2.gain.value = 0.5;
    osc2.start(ctx.currentTime + 0.5);
    gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1);
    osc2.stop(ctx.currentTime + 1);
  };

  const generateQuestion = () => {
    const correctInterval =
      INTERVALS[Math.floor(Math.random() * INTERVALS.length)];
    setCurrentInterval(correctInterval);

    // Generate 4 options (including correct one)
    const shuffledIntervals = [...INTERVALS]
      .sort(() => Math.random() - 0.5)
      .slice(0, 3);
    shuffledIntervals.push(correctInterval);
    setOptions(shuffledIntervals.sort(() => Math.random() - 0.5));

    setFeedback(null);
  };

  const startGame = () => {
    setGameStarted(true);
    setScore(0);
    setStreak(0);
    setRound(1);
    generateQuestion();
  };

  const handleAnswer = (interval: Interval) => {
    if (interval.name === currentInterval?.name) {
      setFeedback("correct");
      setScore((s) => s + 10 + streak * 2);
      setStreak((s) => s + 1);
    } else {
      setFeedback("incorrect");
      setStreak(0);
    }

    setTimeout(() => {
      setRound((r) => r + 1);
      generateQuestion();
    }, 1500);
  };

  const endGame = async () => {
    setGameStarted(false);
    setCurrentInterval(null);
    setFeedback(null);

    if (score > 0) {
      try {
        await gameService.submitScore({
          game_type: "interval_trainer",
          score,
          accuracy_percentage: (score / (round * 10)) * 100,
        });
      } catch (error) {
        console.error("Failed to submit score:", error);
      }
    }
  };

  return (
    <Card className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-display text-loft-plum-900">
          Interval Trainer
        </h2>
        <p className="text-loft-plum-500 mt-1">
          Train your ear to recognize intervals
        </p>
      </div>

      {!gameStarted ? (
        <div className="text-center space-y-4">
          <div className="text-6xl">🎵</div>
          <div className="space-y-2">
            <p className="text-loft-plum-600">Learn to identify:</p>
            <div className="flex flex-wrap justify-center gap-2">
              {INTERVALS.map((interval) => (
                <Badge key={interval.name} variant="plum">
                  {interval.name}
                </Badge>
              ))}
            </div>
          </div>
          <Button variant="sage" size="lg" onClick={startGame}>
            Start Game
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Score */}
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

          {/* Play Button */}
          <div className="text-center">
            <Button
              variant="primary"
              size="lg"
              onClick={() => currentInterval && playInterval(currentInterval)}
              leftIcon={<Play className="w-5 h-5" />}
            >
              Play Interval
            </Button>
          </div>

          {/* Options */}
          <div className="grid grid-cols-2 gap-3">
            {options.map((interval) => (
              <button
                key={interval.name}
                onClick={() => handleAnswer(interval)}
                disabled={feedback !== null}
                className={`px-4 py-3 rounded-lg font-medium transition-all ${
                  feedback === "correct" &&
                  interval.name === currentInterval?.name
                    ? "bg-choir-sage-500 text-white"
                    : feedback === "incorrect" &&
                        interval.name === currentInterval?.name
                      ? "bg-ember-coral-500 text-white"
                      : feedback !== null
                        ? "opacity-50"
                        : "bg-loft-plum-100 hover:bg-loft-plum-200 text-loft-plum-900"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span>{interval.name}</span>
                  {feedback === "correct" &&
                    interval.name === currentInterval?.name && (
                      <CheckCircle className="w-5 h-5" />
                    )}
                  {feedback === "incorrect" &&
                    interval.name === currentInterval?.name && (
                      <XCircle className="w-5 h-5" />
                    )}
                </div>
                <p className="text-xs mt-1 opacity-75">
                  {interval.description}
                </p>
              </button>
            ))}
          </div>

          <Button variant="coral" className="w-full" onClick={endGame}>
            End Game
          </Button>
        </div>
      )}
    </Card>
  );
};
