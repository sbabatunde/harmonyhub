import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { teacherService, Student } from "@/api/services/teacherService";
import { assignmentService } from "@/api/services/assignmentService";
import { useAuthStore } from "@/store/authStore";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Spinner";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { AssignmentForm } from "@/components/assignments/AssignmentForm";
import { StudentProgressModal } from "@/components/teacher/StudentProgressModal";
import {
  Users,
  ClipboardList,
  TrendingUp,
  Mic2,
  BookOpen,
  Gamepad2,
} from "lucide-react";

export default function TeacherDashboard() {
  const { user } = useAuthStore();
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [isAssignmentModalOpen, setIsAssignmentModalOpen] = useState(false);
  const [isProgressModalOpen, setIsProgressModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const { data: students, isLoading } = useQuery({
    queryKey: ["students"],
    queryFn: () => teacherService.getStudents(),
  });

  const { data: stats } = useQuery({
    queryKey: ["teacher-stats"],
    queryFn: () => teacherService.getStatistics(),
  });

  const { data: recentAssignments } = useQuery({
    queryKey: ["teacher-assignments"],
    queryFn: () => assignmentService.getAssignments(),
  });

  const filteredStudents = students?.filter(
    (student: Student) =>
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  if (isLoading) return <Spinner />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-display text-loft-plum-900">
          Teacher Dashboard
        </h1>
        <p className="text-loft-plum-600 mt-1">
          Welcome back, {user?.name}. Here's your choir's progress.
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-loft-plum-100 mb-3">
            <Users className="w-6 h-6 text-loft-plum-600" />
          </div>
          <h3 className="text-sm font-medium text-loft-plum-500">
            Total Students
          </h3>
          <p className="text-3xl font-display text-loft-plum-900 mt-1">
            {stats?.totalStudents || students?.length || 0}
          </p>
        </Card>

        <Card className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-choir-sage-100 mb-3">
            <Mic2 className="w-6 h-6 text-choir-sage-600" />
          </div>
          <h3 className="text-sm font-medium text-loft-plum-500">
            Practice Sessions
          </h3>
          <p className="text-3xl font-display text-loft-plum-900 mt-1">
            {stats?.totalPracticeSessions || 0}
          </p>
        </Card>

        <Card className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-brass-gold-100 mb-3">
            <TrendingUp className="w-6 h-6 text-brass-gold-600" />
          </div>
          <h3 className="text-sm font-medium text-loft-plum-500">
            Avg Accuracy
          </h3>
          <p className="text-3xl font-display text-loft-plum-900 mt-1">
            {stats?.averageAccuracy || 0}%
          </p>
        </Card>

        <Card className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-loft-plum-100 mb-3">
            <ClipboardList className="w-6 h-6 text-loft-plum-600" />
          </div>
          <h3 className="text-sm font-medium text-loft-plum-500">
            Assignments
          </h3>
          <p className="text-3xl font-display text-loft-plum-900 mt-1">
            {recentAssignments?.length || 0}
          </p>
        </Card>
      </div>

      {/* Student Search */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-display text-loft-plum-900">Students</h2>
          <div className="w-64">
            <Input
              placeholder="Search students..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {filteredStudents && filteredStudents.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-loft-plum-100">
                  <th className="text-left py-3 px-4 text-sm font-medium text-loft-plum-500">
                    Name
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-loft-plum-500">
                    Voice Part
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-loft-plum-500">
                    Vocal Range
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-loft-plum-500">
                    Progress
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-loft-plum-500">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((student: Student) => (
                  <tr
                    key={student.id}
                    className="border-b border-loft-plum-50 hover:bg-loft-plum-50"
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-loft-plum-900 text-brass-gold-400 flex items-center justify-center text-sm">
                          {student.name?.[0]?.toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-loft-plum-900">
                            {student.name}
                          </p>
                          <p className="text-sm text-loft-plum-500">
                            {student.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant="gold" className="capitalize">
                        {student.voicePart || "Unknown"}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-loft-plum-600">
                      {student.vocalRangeLow && student.vocalRangeHigh
                        ? `${student.vocalRangeLow} - ${student.vocalRangeHigh}`
                        : "Not set"}
                    </td>
                    <td className="py-3 px-4">
                      <div className="space-y-1">
                        <div className="text-sm text-loft-plum-600">
                          {student.practiceSessionsCount || 0} sessions
                        </div>
                        <div className="text-sm text-loft-plum-600">
                          {student.averageAccuracy || 0}% accuracy
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedStudent(student);
                          setIsStudentModalOpen(true);
                        }}
                      >
                        Details
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedStudent(student);
                          setIsProgressModalOpen(true);
                        }}
                      >
                        <BookOpen className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8">
            <Users className="w-12 h-12 text-loft-plum-300 mx-auto mb-3" />
            <p className="text-loft-plum-500">No students found</p>
          </div>
        )}
      </Card>

      {/* Student Details Modal */}
      <Modal
        isOpen={isStudentModalOpen}
        onClose={() => setIsStudentModalOpen(false)}
        title={selectedStudent?.name || "Student Details"}
        size="lg"
      >
        {selectedStudent && (
          <div className="space-y-6">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 rounded-full bg-loft-plum-900 text-brass-gold-400 flex items-center justify-center text-2xl font-display">
                {selectedStudent.name?.[0]?.toUpperCase()}
              </div>
              <div>
                <h3 className="text-xl font-display text-loft-plum-900">
                  {selectedStudent.name}
                </h3>
                <p className="text-loft-plum-500">{selectedStudent.email}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-loft-plum-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-loft-plum-500 mb-1">
                  Voice Part
                </h4>
                <p className="font-medium text-loft-plum-900 capitalize">
                  {selectedStudent.voicePart || "Not specified"}
                </p>
              </div>
              <div className="bg-loft-plum-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-loft-plum-500 mb-1">
                  Age Bracket
                </h4>
                <p className="font-medium text-loft-plum-900">
                  {selectedStudent.ageBracket || "Not specified"}
                </p>
              </div>
              <div className="bg-loft-plum-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-loft-plum-500 mb-1">
                  Vocal Range
                </h4>
                <p className="font-medium text-loft-plum-900">
                  {selectedStudent.vocalRangeLow &&
                  selectedStudent.vocalRangeHigh
                    ? `${selectedStudent.vocalRangeLow} - ${selectedStudent.vocalRangeHigh}`
                    : "Not specified"}
                </p>
              </div>
              <div className="bg-loft-plum-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-loft-plum-500 mb-1">
                  Guardian
                </h4>
                <p className="font-medium text-loft-plum-900">
                  {selectedStudent.guardianEmail || "Not applicable"}
                </p>
              </div>
            </div>

            <div className="flex space-x-3">
              <Button
                variant="primary"
                className="flex-1"
                onClick={() => {
                  setIsStudentModalOpen(false);
                  setIsAssignmentModalOpen(true);
                }}
              >
                <ClipboardList className="w-4 h-4 mr-2" />
                Assign Song
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setIsStudentModalOpen(false);
                  setIsProgressModalOpen(true);
                }}
              >
                <BookOpen className="w-4 h-4 mr-2" />
                View Progress
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Assignment Modal */}
      <AssignmentForm
        isOpen={isAssignmentModalOpen}
        onClose={() => setIsAssignmentModalOpen(false)}
        preselectedStudent={selectedStudent}
      />

      {/* Progress Modal */}
      <StudentProgressModal
        isOpen={isProgressModalOpen}
        onClose={() => setIsProgressModalOpen(false)}
        student={selectedStudent}
      />
    </div>
  );
}
