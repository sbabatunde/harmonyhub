import React, { useState, useEffect, useRef } from "react";
import { usePitchDetection } from "@/hooks/usePitchDetection";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Badge } from "@/components/ui/Badge";
import { gameService } from "@/api/services/gameService";

interface PitchPerfectGameProps {
  onScoreSubmit?: (score: number) => void;
}

const TARGET_NOTES = [
  { note: "C4", frequency: 261.63 },
  { note: "D4", frequency: 293.66 },
  { note: "E4", frequency: 329.63 },
  { note: "F4", frequency: 349.23 },
  { note: "G4", frequency: 392.0 },
  { note: "A4", frequency: 440.0 },
  { note: "B4", frequency: 493.88 },
  { note: "C5", frequency: 523.25 },
];

export const PitchPerfectGame: React.FC<PitchPerfectGameProps> = ({
  onScoreSubmit,
}) => {
  const {
    pitch,
    note,
    cents,
    isListening,
    startListening,
    stopListening,
    error,
  } = usePitchDetection();
  const [currentTarget, setCurrentTarget] = useState(TARGET_NOTES[0]);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [round, setRound] = useState(1);
  const [isCorrect, setIsCorrect] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (isListening && note === currentTarget.note && Math.abs(cents) < 20) {
      handleCorrectNote();
    }
  }, [note, cents, currentTarget]);

  const handleCorrectNote = () => {
    setIsCorrect(true);
    const newScore = score + 10 + streak * 2;
    setScore(newScore);
    const newStreak = streak + 1;
    setStreak(newStreak);
    setBestStreak(Math.max(bestStreak, newStreak));

    timeoutRef.current = setTimeout(() => {
      nextRound();
    }, 1000);
  };

  const nextRound = () => {
    setIsCorrect(false);
    setCurrentTarget(
      TARGET_NOTES[Math.floor(Math.random() * TARGET_NOTES.length)],
    );
    setRound((r) => r + 1);
  };

  const startGame = async () => {
    setGameStarted(true);
    setScore(0);
    setStreak(0);
    setRound(1);
    await startListening();
  };

  const stopGame = async () => {
    setGameStarted(false);
    stopListening();

    if (score > 0) {
      try {
        await gameService.submitScore({
          game_type: "pitch_perfect",
          score,
          accuracy_percentage: Math.round((score / (round * 10)) * 100),
        });
        console.log("Score submitted successfully!");
      } catch (error) {
        console.error("Failed to submit score:", error);
      }
    }
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      stopListening();
    };
  }, []);

  const getAccuracyColor = () => {
    if (!pitch) return "bg-loft-plum-100";
    if (Math.abs(cents) < 10) return "bg-choir-sage-500";
    if (Math.abs(cents) < 25) return "bg-brass-gold-400";
    return "bg-ember-coral-500";
  };

  return (
    <Card className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-display text-loft-plum-900">
          Pitch Perfect
        </h2>
        <p className="text-loft-plum-500 mt-1">
          Match the target note with your voice
        </p>
      </div>

      {error && (
        <div className="bg-ember-coral-100 text-ember-coral-800 p-3 rounded-lg">
          {error}
        </div>
      )}

      {!gameStarted ? (
        <div className="text-center space-y-4">
          <div className="text-6xl">🎯</div>
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

          {/* Target Note */}
          <div className="text-center">
            <p className="text-sm text-loft-plum-500 mb-2">Target Note</p>
            <div
              className={`text-6xl font-display ${isCorrect ? "text-choir-sage-500" : "text-loft-plum-900"}`}
            >
              {currentTarget.note}
            </div>
          </div>

          {/* Pitch Meter */}
          <div className="space-y-2">
            <div className="h-8 bg-loft-plum-100 rounded-full overflow-hidden relative">
              <div
                className={`absolute inset-y-0 left-0 transition-all duration-100 ${getAccuracyColor()}`}
                style={{
                  width: pitch
                    ? `${Math.min(Math.abs(cents) * 2, 100)}%`
                    : "0%",
                }}
              />
            </div>
            <div className="flex justify-between text-sm text-loft-plum-500">
              <span>Perfect</span>
              <span>Your note: {note || "---"}</span>
            </div>
          </div>

          {isCorrect && (
            <div className="text-center">
              <Badge variant="sage">✓ Perfect!</Badge>
            </div>
          )}

          <Button variant="coral" className="w-full" onClick={stopGame}>
            End Game
          </Button>
        </div>
      )}
    </Card>
  );
};
