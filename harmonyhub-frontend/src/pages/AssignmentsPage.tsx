import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { assignmentService } from "@/api/services/assignmentService";
import { useAuthStore } from "@/store/authStore";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatDate } from "@/utils/helpers";
import { Assignment } from "@/types";

export default function AssignmentsPage() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const { data: assignments, isLoading } = useQuery({
    queryKey: ["assignments"],
    queryFn: async () => {
      const response = await assignmentService.getAssignments();
      return response;
    },
  });

  const completeMutation = useMutation({
    mutationFn: (id: number) => assignmentService.completeAssignment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assignments"] });
    },
  });

  if (isLoading) return <Spinner />;

  const assignmentList = assignments || [];
  const isTeacher = user?.role === "teacher" || user?.role === "admin";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display text-loft-plum-900">
            Assignments
          </h1>
          <p className="text-loft-plum-600 mt-1">
            {isTeacher
              ? "Manage student assignments"
              : "Your practice assignments"}
          </p>
        </div>
        {isTeacher && <Button variant="primary">New Assignment</Button>}
      </div>

      {assignmentList.length === 0 ? (
        <EmptyState
          icon="📝"
          title="No assignments yet"
          description="Assignments will appear here when your teacher creates them"
        />
      ) : (
        <div className="space-y-4">
          {assignmentList.map((assignment: Assignment) => (
            <Card key={assignment.id} className="flex items-center space-x-4">
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <h3 className="font-display text-lg text-loft-plum-900">
                    {assignment.song?.title || "Song"}
                  </h3>
                  {assignment.completed_at ? (
                    <Badge variant="sage">Completed</Badge>
                  ) : (
                    <Badge variant="gold">Pending</Badge>
                  )}
                </div>
                <div className="flex items-center space-x-4 mt-1 text-sm text-loft-plum-500">
                  {assignment.due_date && (
                    <span>Due: {formatDate(assignment.due_date)}</span>
                  )}
                  {isTeacher && assignment.student && (
                    <span>Student: {assignment.student.name}</span>
                  )}
                </div>
              </div>
              {!isTeacher && !assignment.completed_at && (
                <Button
                  variant="sage"
                  size="sm"
                  onClick={() => completeMutation.mutate(assignment.id)}
                >
                  Mark Complete
                </Button>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
