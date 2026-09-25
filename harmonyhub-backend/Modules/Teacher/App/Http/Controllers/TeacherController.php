<?php

namespace Modules\Teacher\App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Modules\Teacher\App\Services\Contracts\TeacherServiceInterface;
use App\Support\Traits\ApiResponseTrait;

class TeacherController
{
    use ApiResponseTrait;

    public function __construct(
        private readonly TeacherServiceInterface $teacherService
    ) {}

    public function students(): JsonResponse
    {
        $students = $this->teacherService->getStudents(auth()->user()->church_id);

        return $this->successResponse($students);
    }

    public function studentDetails(int $studentId): JsonResponse
    {
        $student = $this->teacherService->getStudentDetails($studentId);

        if (!$student) {
            return $this->errorResponse('Student not found', 404);
        }

        return $this->successResponse($student);
    }

    public function statistics(): JsonResponse
    {
        $stats = $this->teacherService->getStatistics(auth()->user()->church_id);

        return $this->successResponse($stats);
    }

    public function studentProgress(int $studentId): JsonResponse
    {
        $progress = $this->teacherService->getStudentProgress($studentId);

        return $this->successResponse($progress);
    }

    public function studentAssignments(int $studentId): JsonResponse
    {
        $assignments = $this->teacherService->getStudentAssignments($studentId);

        return $this->successResponse($assignments);
    }
}
