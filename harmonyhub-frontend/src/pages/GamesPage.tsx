import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { PitchPerfectGame } from "@/components/games/PitchPerfectGame";
import { IntervalTrainer } from "@/components/games/IntervalTrainer";
import { RhythmMaster } from "@/components/games/RhythmMaster";
import { ScaleSinger } from "@/components/games/ScaleSinger";
import { NoteRecognition } from "@/components/games/NoteRecognition";
import { ChordEarTraining } from "@/components/games/ChordEarTraining";
import { gameService } from "@/api/services/gameService";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Spinner";
import { Trophy, ArrowLeft } from "lucide-react";

type GameType =
  | "pitch_perfect"
  | "interval_trainer"
  | "rhythm_master"
  | "scale_singer"
  | "note_recognition"
  | "chord_ear_training"
  | null;

interface GameMeta {
  type: GameType;
  title: string;
  description: string;
  icon: string;
  category: "warmup" | "ear" | "rhythm";
  difficulty: "Beginner" | "Intermediate" | "Advanced" | "All Levels";
}

const GAMES: GameMeta[] = [
  {
    type: "scale_singer",
    title: "Scale Singer",
    description: "Warm up your voice by singing a full scale note by note",
    icon: "🌊",
    category: "warmup",
    difficulty: "Beginner",
  },
  {
    type: "pitch_perfect",
    title: "Pitch Perfect",
    description: "Match target notes with your voice",
    icon: "🎯",
    category: "warmup",
    difficulty: "Beginner",
  },
  {
    type: "interval_trainer",
    title: "Interval Trainer",
    description: "Recognize the distance between two notes",
    icon: "🎵",
    category: "ear",
    difficulty: "Intermediate",
  },
  {
    type: "note_recognition",
    title: "Note Recognition",
    description: "Identify individual notes by pitch",
    icon: "🎧",
    category: "ear",
    difficulty: "Intermediate",
  },
  {
    type: "chord_ear_training",
    title: "Chord Ear Training",
    description: "Identify major, minor, and other chord qualities",
    icon: "🎹",
    category: "ear",
    difficulty: "Advanced",
  },
  {
    type: "rhythm_master",
    title: "Rhythm Master",
    description: "Tap along to rhythmic patterns",
    icon: "🥁",
    category: "rhythm",
    difficulty: "All Levels",
  },
];

export default function GamesPage() {
  const [activeGame, setActiveGame] = useState<GameType>(null);
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  const { data: leaderboard, isLoading: isLoadingLeaderboard } = useQuery({
    queryKey: ["leaderboard"],
    queryFn: () => gameService.getLeaderboard("pitch_perfect"),
    enabled: showLeaderboard,
  });

  const groupedGames = {
    warmup: GAMES.filter((g) => g.category === "warmup"),
    ear: GAMES.filter((g) => g.category === "ear"),
    rhythm: GAMES.filter((g) => g.category === "rhythm"),
  };

  const categoryLabels = {
    warmup: { title: "Warmup", description: "Start here before rehearsal" },
    ear: { title: "Ear Training", description: "Build your harmonic sense" },
    rhythm: { title: "Rhythm", description: "Lock in the groove" },
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display text-loft-plum-900">
            Training Games
          </h1>
          <p className="text-loft-plum-600 mt-1">
            Six games to build every musician's foundational skills
          </p>
        </div>
        <button
          onClick={() => setShowLeaderboard((v) => !v)}
          className="flex items-center space-x-2 text-loft-plum-600 hover:text-loft-plum-800"
        >
          <Trophy className="w-5 h-5" />
          <span>Leaderboard</span>
        </button>
      </div>

      {!activeGame ? (
        <>
          {/* Leaderboard */}
          {showLeaderboard && (
            <Card>
              <h2 className="text-xl font-display text-loft-plum-900 mb-4">
                Leaderboard
              </h2>
              {isLoadingLeaderboard ? (
                <Spinner />
              ) : (
                <div className="space-y-2">
                  {leaderboard?.slice(0, 10).map((entry, index) => (
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
                          index === 0
                            ? "gold"
                            : index === 1
                              ? "sage"
                              : "neutral"
                        }
                      >
                        {entry.best_score} pts
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}

          {/* Game sections */}
          {(Object.keys(groupedGames) as Array<keyof typeof groupedGames>).map(
            (category) => (
              <div key={category}>
                <div className="mb-3">
                  <h2 className="text-xl font-display text-loft-plum-900">
                    {categoryLabels[category].title}
                  </h2>
                  <p className="text-sm text-loft-plum-500">
                    {categoryLabels[category].description}
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {groupedGames[category].map((game, index) => (
                    <motion.div
                      key={game.type}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.08 }}
                    >
                      <Card
                        hoverable
                        onClick={() => setActiveGame(game.type)}
                        className="text-center space-y-3 h-full"
                      >
                        <div className="text-5xl">{game.icon}</div>
                        <div>
                          <h3 className="font-display text-lg text-loft-plum-900">
                            {game.title}
                          </h3>
                          <p className="text-sm text-loft-plum-500 mt-1">
                            {game.description}
                          </p>
                        </div>
                        <Badge
                          variant={
                            game.difficulty === "Beginner"
                              ? "sage"
                              : game.difficulty === "Advanced"
                                ? "coral"
                                : "gold"
                          }
                        >
                          {game.difficulty}
                        </Badge>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </div>
            ),
          )}
        </>
      ) : (
        <div className="max-w-3xl mx-auto">
          <button
            onClick={() => setActiveGame(null)}
            className="flex items-center text-loft-plum-600 hover:text-loft-plum-800 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Games
          </button>
          {activeGame === "pitch_perfect" && <PitchPerfectGame />}
          {activeGame === "interval_trainer" && <IntervalTrainer />}
          {activeGame === "rhythm_master" && <RhythmMaster />}
          {activeGame === "scale_singer" && <ScaleSinger />}
          {activeGame === "note_recognition" && <NoteRecognition />}
          {activeGame === "chord_ear_training" && <ChordEarTraining />}
        </div>
      )}
    </div>
  );
}
