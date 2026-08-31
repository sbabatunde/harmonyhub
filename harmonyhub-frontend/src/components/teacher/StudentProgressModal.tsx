import { useQuery } from "@tanstack/react-query";
import { teacherService, Student } from "@/api/services/teacherService";
import { Modal } from "@/components/ui/Modal";
import { Spinner } from "@/components/ui/Spinner";
import { Badge } from "@/components/ui/Badge";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Card } from "@/components/ui/Card";
import { formatDate } from "@/utils/helpers";
import { BookOpen, Mic2, Gamepad2, TrendingUp } from "lucide-react";

interface StudentProgressModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student | null;
}

export const StudentProgressModal: React.FC<StudentProgressModalProps> = ({
  isOpen,
  onClose,
  student,
}) => {
  const { data: progress, isLoading } = useQuery({
    queryKey: ["student-progress", student?.id],
    queryFn: () => teacherService.getStudentProgress(student!.id),
    enabled: isOpen && !!student,
  });

  if (!student) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`${student.name}'s Progress`}
      size="xl"
    >
      {isLoading ? (
        <Spinner />
      ) : (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-3 gap-4">
            <Card className="text-center">
              <Mic2 className="w-6 h-6 text-choir-sage-600 mx-auto mb-2" />
              <p className="text-sm text-loft-plum-500">Practice Sessions</p>
              <p className="text-2xl font-display text-loft-plum-900">
                {progress?.recent_practice?.length || 0}
              </p>
            </Card>
            <Card className="text-center">
              <Gamepad2 className="w-6 h-6 text-brass-gold-500 mx-auto mb-2" />
              <p className="text-sm text-loft-plum-500">Games Played</p>
              <p className="text-2xl font-display text-loft-plum-900">
                {progress?.recent_games?.length || 0}
              </p>
            </Card>
            <Card className="text-center">
              <TrendingUp className="w-6 h-6 text-loft-plum-600 mx-auto mb-2" />
              <p className="text-sm text-loft-plum-500">Avg Accuracy</p>
              <p className="text-2xl font-display text-loft-plum-900">
                {student.averageAccuracy || 0}%
              </p>
            </Card>
          </div>

          {/* Curriculum Progress */}
          {progress?.curriculum_progress &&
            progress.curriculum_progress.length > 0 && (
              <div>
                <h3 className="font-display text-lg text-loft-plum-900 mb-3 flex items-center">
                  <BookOpen className="w-5 h-5 mr-2 text-loft-plum-500" />
                  Curriculum Progress
                </h3>
                <div className="space-y-3">
                  {progress.curriculum_progress.map((item: any) => (
                    <div
                      key={item.id}
                      className="bg-loft-plum-50 rounded-lg p-4"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-loft-plum-900">
                          {item.curriculum_stage?.name || `Stage ${item.id}`}
                        </h4>
                        <Badge
                          variant={
                            item.status === "completed"
                              ? "sage"
                              : item.status === "in_progress"
                                ? "gold"
                                : "neutral"
                          }
                        >
                          {item.status.replace("_", " ")}
                        </Badge>
                      </div>
                      {item.accuracy_percentage && (
                        <ProgressBar
                          value={item.accuracy_percentage}
                          color={item.status === "completed" ? "sage" : "gold"}
                          showLabel
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

          {/* Recent Practice Sessions */}
          {progress?.recent_practice && progress.recent_practice.length > 0 && (
            <div>
              <h3 className="font-display text-lg text-loft-plum-900 mb-3">
                Recent Practice
              </h3>
              <div className="space-y-2">
                {progress.recent_practice.slice(0, 5).map((session: any) => (
                  <div
                    key={session.id}
                    className="flex items-center justify-between bg-loft-plum-50 rounded-lg p-3"
                  >
                    <div>
                      <p className="text-sm font-medium text-loft-plum-900">
                        {formatDate(session.practice_date)}
                      </p>
                      <p className="text-xs text-loft-plum-500">
                        {session.duration_minutes} minutes
                      </p>
                    </div>
                    {session.average_pitch_accuracy && (
                      <Badge
                        variant={
                          session.average_pitch_accuracy >= 80
                            ? "sage"
                            : session.average_pitch_accuracy >= 60
                              ? "gold"
                              : "coral"
                        }
                      >
                        {session.average_pitch_accuracy}%
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent Game Scores */}
          {progress?.recent_games && progress.recent_games.length > 0 && (
            <div>
              <h3 className="font-display text-lg text-loft-plum-900 mb-3">
                Recent Game Scores
              </h3>
              <div className="space-y-2">
                {progress.recent_games.slice(0, 5).map((score: any) => (
                  <div
                    key={score.id}
                    className="flex items-center justify-between bg-loft-plum-50 rounded-lg p-3"
                  >
                    <div>
                      <p className="text-sm font-medium text-loft-plum-900 capitalize">
                        {score.game_type.replace("_", " ")}
                      </p>
                      <p className="text-xs text-loft-plum-500">
                        {formatDate(score.created_at)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-loft-plum-900">
                        Score: {score.score}
                      </p>
                      {score.accuracy_percentage && (
                        <p className="text-xs text-loft-plum-500">
                          {score.accuracy_percentage}% accuracy
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
};
