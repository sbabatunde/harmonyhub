import { useAuthStore } from "@/store/authStore";
import { useQuery } from "@tanstack/react-query";
import { practiceService } from "@/api/services/practiceService";
import { curriculumService } from "@/api/services/curriculumService";
import { gameService } from "@/api/services/gameService";
import { Card } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { AICoachFeedback } from "@/components/coach/AICoachFeedback";
import { Link } from "react-router-dom";
import {
  Clock,
  Target,
  TrendingUp,
  Flame,
  Mic,
  Gamepad2,
  ArrowRight,
  Trophy,
} from "lucide-react";

export default function DashboardPage() {
  const { user } = useAuthStore();

  const { data: practiceStats } = useQuery({
    queryKey: ["practice-stats"],
    queryFn: () => practiceService.getStatistics(),
  });

  const { data: gameStats } = useQuery({
    queryKey: ["game-stats"],
    queryFn: () => gameService.getGameStatistics(),
  });

  const { data: curriculumProgress } = useQuery({
    queryKey: ["curriculum-progress"],
    queryFn: () => curriculumService.getProgress(),
  });

  const completedStages =
    curriculumProgress?.filter((p: any) => p.status === "completed").length ||
    0;
  const totalStages = curriculumProgress?.length || 0;
  const curriculumPercentage =
    totalStages > 0 ? (completedStages / totalStages) * 100 : 0;

  return (
    <div className="space-y-8">
      <AICoachFeedback />

      {/* Welcome Section */}
      <div className="relative overflow-hidden rounded-2xl bg-loft-plum-900 text-white p-8">
        <div className="absolute inset-0 bg-gradient-to-r from-loft-plum-900 to-loft-plum-700"></div>
        <div className="relative z-10">
          <h1 className="text-4xl font-display mb-2">
            Welcome back, {user?.name}
          </h1>
          <p className="text-loft-plum-200 text-lg">
            {practiceStats?.current_streak ? (
              <>🔥 {practiceStats.current_streak} day streak! Keep it going!</>
            ) : (
              <>Ready to make beautiful music?</>
            )}
          </p>
          <div className="mt-4 flex space-x-4">
            <Link to="/practice">
              <Button variant="gold">
                <Mic className="w-4 h-4 mr-2" />
                Start Practice
              </Button>
            </Link>
            <Link to="/games">
              <Button
                variant="outline"
                className="border-white text-white hover:bg-white hover:text-loft-plum-900"
              >
                <Gamepad2 className="w-4 h-4 mr-2" />
                Play Games
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-choir-sage-100 mb-3">
            <Clock className="w-6 h-6 text-choir-sage-600" />
          </div>
          <h3 className="text-sm font-medium text-loft-plum-500">
            Practice Time
          </h3>
          <p className="text-3xl font-display text-loft-plum-900 mt-1">
            {practiceStats?.total_minutes || 0}m
          </p>
          <p className="text-sm text-loft-plum-500 mt-1">
            {practiceStats?.sessions_this_week || 0} sessions this week
          </p>
        </Card>

        <Card className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-brass-gold-100 mb-3">
            <Target className="w-6 h-6 text-brass-gold-600" />
          </div>
          <h3 className="text-sm font-medium text-loft-plum-500">
            Avg Accuracy
          </h3>
          <p className="text-3xl font-display text-loft-plum-900 mt-1">
            {practiceStats?.average_accuracy || 0}%
          </p>
          <p className="text-sm text-loft-plum-500 mt-1">
            Keep up the good work!
          </p>
        </Card>

        <Card className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-loft-plum-100 mb-3">
            <TrendingUp className="w-6 h-6 text-loft-plum-600" />
          </div>
          <h3 className="text-sm font-medium text-loft-plum-500">Curriculum</h3>
          <p className="text-3xl font-display text-loft-plum-900 mt-1">
            {completedStages}/{totalStages}
          </p>
          <p className="text-sm text-loft-plum-500 mt-1">Stages completed</p>
        </Card>

        <Card className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-ember-coral-100 mb-3">
            <Flame className="w-6 h-6 text-ember-coral-500" />
          </div>
          <h3 className="text-sm font-medium text-loft-plum-500">Streak</h3>
          <p className="text-3xl font-display text-loft-plum-900 mt-1">
            {practiceStats?.current_streak || 0} days
          </p>
          <p className="text-sm text-loft-plum-500 mt-1">
            Practice daily to build streak
          </p>
        </Card>
      </div>

      {/* Curriculum Progress */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-display text-loft-plum-900">
            Curriculum Progress
          </h2>
          <Link
            to="/curriculum"
            className="text-loft-plum-600 hover:text-loft-plum-800"
          >
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
        <ProgressBar value={curriculumPercentage} color="sage" showLabel />
      </Card>

      {/* Top Songs */}
      {practiceStats?.top_songs && practiceStats.top_songs.length > 0 && (
        <div>
          <h2 className="text-xl font-display text-loft-plum-900 mb-4">
            Most Practiced Songs
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {practiceStats.top_songs.map((song, index) => (
              <Card key={index} className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-brass-gold-100 flex items-center justify-center">
                  <Trophy className="w-5 h-5 text-brass-gold-600" />
                </div>
                <div>
                  <p className="font-medium text-loft-plum-900">
                    {song.song_title}
                  </p>
                  <p className="text-sm text-loft-plum-500">
                    {song.part_type} • {song.practice_count} times
                  </p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Game Stats */}
      {gameStats && (
        <div>
          <h2 className="text-xl font-display text-loft-plum-900 mb-4">
            Game Performance
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <h3 className="font-display text-loft-plum-900 mb-2">
                Pitch Perfect
              </h3>
              <div className="space-y-1">
                <p className="text-sm text-loft-plum-500">
                  Best: {gameStats.pitch_perfect.best_score}
                </p>
                <p className="text-sm text-loft-plum-500">
                  Accuracy: {gameStats.pitch_perfect.average_accuracy}%
                </p>
                <p className="text-sm text-loft-plum-500">
                  Played: {gameStats.pitch_perfect.games_played} times
                </p>
              </div>
            </Card>
            <Card>
              <h3 className="font-display text-loft-plum-900 mb-2">
                Interval Trainer
              </h3>
              <div className="space-y-1">
                <p className="text-sm text-loft-plum-500">
                  Best: {gameStats.interval_trainer.best_score}
                </p>
                <p className="text-sm text-loft-plum-500">
                  Accuracy: {gameStats.interval_trainer.average_accuracy}%
                </p>
                <p className="text-sm text-loft-plum-500">
                  Played: {gameStats.interval_trainer.games_played} times
                </p>
              </div>
            </Card>
            <Card>
              <h3 className="font-display text-loft-plum-900 mb-2">
                Rhythm Master
              </h3>
              <div className="space-y-1">
                <p className="text-sm text-loft-plum-500">
                  Best: {gameStats.rhythm_master.best_score}
                </p>
                <p className="text-sm text-loft-plum-500">
                  Accuracy: {gameStats.rhythm_master.average_accuracy}%
                </p>
                <p className="text-sm text-loft-plum-500">
                  Played: {gameStats.rhythm_master.games_played} times
                </p>
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
