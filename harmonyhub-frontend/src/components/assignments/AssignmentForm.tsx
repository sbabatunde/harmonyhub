import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { assignmentService } from "@/api/services/assignmentService";
import { songService } from "@/api/services/songService";
import { teacherService, Student } from "@/api/services/teacherService";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useQuery } from "@tanstack/react-query";
import { Spinner } from "@/components/ui/Spinner";

const assignmentSchema = z.object({
  student_id: z.string().min(1, "Student is required"),
  song_id: z.string().min(1, "Song is required"),
  due_date: z.string().optional(),
});

type AssignmentFormData = z.infer<typeof assignmentSchema>;

interface AssignmentFormProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedStudent?: Student | null;
}

export const AssignmentForm: React.FC<AssignmentFormProps> = ({
  isOpen,
  onClose,
  preselectedStudent,
}) => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<AssignmentFormData>({
    resolver: zodResolver(assignmentSchema),
    defaultValues: {
      student_id: preselectedStudent?.id?.toString() || "",
    },
  });

  // Fetch students
  const { data: students, isLoading: isLoadingStudents } = useQuery({
    queryKey: ["students"],
    queryFn: () => teacherService.getStudents(),
    enabled: isOpen,
  });

  // Fetch songs
  const { data: songsData, isLoading: isLoadingSongs } = useQuery({
    queryKey: ["songs-for-assignment"],
    queryFn: () => songService.getSongs(),
    enabled: isOpen,
  });

  const createAssignmentMutation = useMutation({
    mutationFn: (data: {
      student_id: number;
      song_id: number;
      due_date?: string;
    }) => assignmentService.createAssignment(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assignments"] });
      queryClient.invalidateQueries({ queryKey: ["teacher-assignments"] });
      onClose();
      reset();
    },
  });

  const onSubmit = (data: AssignmentFormData) => {
    createAssignmentMutation.mutate({
      student_id: parseInt(data.student_id),
      song_id: parseInt(data.song_id),
      due_date: data.due_date || undefined,
    });
  };

  const filteredStudents = students?.filter(
    (student: Student) =>
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const songs = Array.isArray(songsData) ? songsData : [];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Assignment"
      size="lg"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Student Selection */}
        <div>
          <label className="block text-sm font-medium text-loft-plum-700 mb-1">
            Student
          </label>
          {!preselectedStudent && (
            <Input
              placeholder="Search students..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="mb-2"
            />
          )}

          {isLoadingStudents ? (
            <Spinner />
          ) : preselectedStudent ? (
            <div className="bg-loft-plum-50 rounded-lg p-4">
              <p className="font-medium text-loft-plum-900">
                {preselectedStudent.name}
              </p>
              <p className="text-sm text-loft-plum-500">
                {preselectedStudent.email}
              </p>
              <input
                type="hidden"
                value={preselectedStudent.id}
                {...register("student_id")}
              />
            </div>
          ) : (
            <select className="input-field" {...register("student_id")}>
              <option value="">Select student</option>
              {filteredStudents?.map((student: Student) => (
                <option key={student.id} value={student.id}>
                  {student.name} - {student.voicePart || "No part"}
                </option>
              ))}
            </select>
          )}
          {errors.student_id && (
            <p className="text-sm text-ember-coral-600 mt-1">
              {errors.student_id.message}
            </p>
          )}
        </div>

        {/* Song Selection */}
        <div>
          <label className="block text-sm font-medium text-loft-plum-700 mb-1">
            Song
          </label>
          {isLoadingSongs ? (
            <Spinner />
          ) : (
            <select className="input-field" {...register("song_id")}>
              <option value="">Select song</option>
              {songs.map((song: any) => (
                <option key={song.id} value={song.id}>
                  {song.title} - {song.artist || "Unknown"}
                </option>
              ))}
            </select>
          )}
          {errors.song_id && (
            <p className="text-sm text-ember-coral-600 mt-1">
              {errors.song_id.message}
            </p>
          )}
        </div>

        {/* Due Date */}
        <Input
          label="Due Date (Optional)"
          type="date"
          hint="Leave empty for no due date"
          error={errors.due_date?.message}
          {...register("due_date")}
        />

        {/* Selected Info */}
        {watch("student_id") && watch("song_id") && (
          <div className="bg-brass-gold-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-brass-gold-800 mb-2">
              Assignment Summary
            </h4>
            <div className="space-y-1 text-sm text-brass-gold-700">
              <p>
                <span className="font-medium">Student:</span>{" "}
                {
                  filteredStudents?.find(
                    (s) => s.id === parseInt(watch("student_id")),
                  )?.name
                }
              </p>
              <p>
                <span className="font-medium">Song:</span>{" "}
                {
                  songs.find((s: any) => s.id === parseInt(watch("song_id")))
                    ?.title
                }
              </p>
              {watch("due_date") && (
                <p>
                  <span className="font-medium">Due:</span>{" "}
                  {watch("due_date") && (
                    <p>
                      <span className="font-medium">Due:</span>{" "}
                      {new Date(watch("due_date")!).toLocaleDateString()}
                    </p>
                  )}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end space-x-3">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={createAssignmentMutation.isPending}
          >
            Create Assignment
          </Button>
        </div>
      </form>
    </Modal>
  );
};
