import { useQuery } from "@tanstack/react-query";
import { curriculumService } from "@/api/services/curriculumService";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Spinner } from "@/components/ui/Spinner";
import { Lock, CheckCircle, PlayCircle } from "lucide-react";
import { UserProgress } from "@/types";

export default function CurriculumPage() {
  const { data: progress, isLoading } = useQuery({
    queryKey: ["curriculum-progress"],
    queryFn: async () => {
      const response = await curriculumService.getProgress();
      return response;
    },
  });

  if (isLoading) return <Spinner />;

  const stages = progress || [];
  const completedCount = stages.filter(
    (p: UserProgress) => p.status === "completed",
  ).length;
  const inProgressCount = stages.filter(
    (p: UserProgress) => p.status === "in_progress",
  ).length;
  const overallProgress = (completedCount / stages.length) * 100;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-6 h-6 text-choir-sage-500" />;
      case "in_progress":
        return <PlayCircle className="w-6 h-6 text-brass-gold-400" />;
      default:
        return <Lock className="w-6 h-6 text-loft-plum-300" />;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-display text-loft-plum-900">
          Vocal Curriculum
        </h1>
        <p className="text-loft-plum-600 mt-1">
          Your journey to vocal excellence
        </p>
      </div>

      {/* Overall Progress */}
      <Card>
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-display text-lg text-loft-plum-800">
            Overall Progress
          </h2>
          <Badge variant="sage">
            {completedCount} / {stages.length} completed
          </Badge>
        </div>
        <ProgressBar value={overallProgress} color="sage" showLabel />
      </Card>

      {/* Stage List */}
      <div className="space-y-4">
        {stages.map((progress: UserProgress, index: number) => (
          <Card key={progress.stage.id} className="flex items-center space-x-4">
            <div className="flex-shrink-0">
              {getStatusIcon(progress.status)}
            </div>
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-loft-plum-400">
                  Stage {index + 1}
                </span>
                {progress.status === "completed" && (
                  <Badge variant="sage">Completed</Badge>
                )}
                {progress.status === "in_progress" && (
                  <Badge variant="gold">In Progress</Badge>
                )}
              </div>
              <h3 className="font-display text-lg text-loft-plum-900">
                {progress.stage.name}
              </h3>
              <p className="text-sm text-loft-plum-500">
                {progress.stage.description}
              </p>
            </div>
            {progress.accuracy && (
              <div className="flex-shrink-0 text-right">
                <p className="text-sm text-loft-plum-500">Accuracy</p>
                <p className="text-lg font-display text-choir-sage-600">
                  {progress.accuracy}%
                </p>
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
