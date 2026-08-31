import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PitchPerfectGame } from "@/components/games/PitchPerfectGame";
import { IntervalTrainer } from "@/components/games/IntervalTrainer";
import { RhythmMaster } from "@/components/games/RhythmMaster";
import { gameService } from "@/api/services/gameService";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Spinner";
import { Trophy } from "lucide-react";

type GameType = "pitch_perfect" | "interval_trainer" | "rhythm_master";

export default function GamesPage() {
  const [activeGame, setActiveGame] = useState<GameType | null>(null);
  const [showLeaderboard, setShowLeaderboard] = useState<GameType | null>(null);

  const { data: leaderboard, isLoading: isLoadingLeaderboard } = useQuery({
    queryKey: ["leaderboard", showLeaderboard],
    queryFn: () => gameService.getLeaderboard(showLeaderboard!),
    enabled: !!showLeaderboard,
  });

  const games = [
    {
      type: "pitch_perfect" as GameType,
      title: "Pitch Perfect",
      description: "Match target notes with your voice",
      icon: "🎯",
      difficulty: "Beginner",
    },
    {
      type: "interval_trainer" as GameType,
      title: "Interval Trainer",
      description: "Learn to recognize musical intervals",
      icon: "🎵",
      difficulty: "Intermediate",
    },
    {
      type: "rhythm_master" as GameType,
      title: "Rhythm Master",
      description: "Tap along to rhythmic patterns",
      icon: "🥁",
      difficulty: "All Levels",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display text-loft-plum-900">
            Training Games
          </h1>
          <p className="text-loft-plum-600 mt-1">
            Have fun while improving your skills
          </p>
        </div>
        <button
          onClick={() =>
            setShowLeaderboard(showLeaderboard ? null : "pitch_perfect")
          }
          className="flex items-center space-x-2 text-loft-plum-600 hover:text-loft-plum-800"
        >
          <Trophy className="w-5 h-5" />
          <span>Leaderboard</span>
        </button>
      </div>

      {/* Leaderboard */}
      {showLeaderboard && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-display text-loft-plum-900">
              Leaderboard
            </h2>
            <select
              value={showLeaderboard}
              onChange={(e) => setShowLeaderboard(e.target.value as GameType)}
              className="input-field w-auto"
            >
              <option value="pitch_perfect">Pitch Perfect</option>
              <option value="interval_trainer">Interval Trainer</option>
              <option value="rhythm_master">Rhythm Master</option>
            </select>
          </div>

          {isLoadingLeaderboard ? (
            <Spinner />
          ) : (
            <div className="space-y-2">
              {leaderboard?.map((entry, index) => (
                <div
                  key={entry.user_id}
                  className="flex items-center justify-between p-3 rounded-lg bg-loft-plum-50"
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-lg font-display text-loft-plum-400">
                      #{index + 1}
                    </span>
                    <div>
                      <p className="font-medium text-loft-plum-900">
                        {entry.name}
                      </p>
                      <p className="text-sm text-loft-plum-500 capitalize">
                        {entry.voice_part}
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant={
                      index === 0 ? "gold" : index === 1 ? "sage" : "neutral"
                    }
                  >
                    {entry.best_score} pts
                  </Badge>
                </div>
              ))}
              {leaderboard?.length === 0 && (
                <p className="text-center text-loft-plum-500 py-4">
                  No scores yet
                </p>
              )}
            </div>
          )}
        </Card>
      )}

      {/* Game Selection */}
      {!activeGame ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {games.map((game) => (
            <Card
              key={game.type}
              hoverable
              onClick={() => setActiveGame(game.type)}
              className="text-center space-y-4"
            >
              <div className="text-6xl">{game.icon}</div>
              <div>
                <h3 className="font-display text-xl text-loft-plum-900">
                  {game.title}
                </h3>
                <p className="text-sm text-loft-plum-500 mt-1">
                  {game.description}
                </p>
              </div>
              <Badge variant={game.difficulty === "Beginner" ? "sage" : "gold"}>
                {game.difficulty}
              </Badge>
            </Card>
          ))}
        </div>
      ) : (
        <div className="max-w-2xl mx-auto">
          <button
            onClick={() => setActiveGame(null)}
            className="mb-4 text-loft-plum-600 hover:text-loft-plum-800"
          >
            ← Back to Games
          </button>
          {activeGame === "pitch_perfect" && <PitchPerfectGame />}
          {activeGame === "interval_trainer" && <IntervalTrainer />}
          {activeGame === "rhythm_master" && <RhythmMaster />}
        </div>
      )}
    </div>
  );
}
