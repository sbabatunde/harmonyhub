<?php

namespace Modules\Assignment\app\Controllers;

use Illuminate\Http\JsonResponse;
use Modules\Assignment\app\Requests\CreateAssignmentRequest;
use Modules\Assignment\app\Services\Contracts\AssignmentServiceInterface;
use App\Support\Traits\ApiResponseTrait;

class AssignmentController
{
    use ApiResponseTrait;

    public function __construct(
        private readonly AssignmentServiceInterface $assignmentService
    ) {}

    public function index(): JsonResponse
    {
        $user = auth()->user();
        $role = $user->role; // This is UserRole enum

        // Pass the enum value
        $assignments = $this->assignmentService->listUserAssignments(
            $user->id,
            $role instanceof \App\Enums\UserRole ? $role->value : $role
        );

        return $this->successResponse($assignments);
    }
    public function store(CreateAssignmentRequest $request): JsonResponse
    {
        $assignment = $this->assignmentService->createAssignment($request->toDTO());

        return $this->successResponse($assignment, 'Assignment created successfully', 201);
    }

    public function show(int $id): JsonResponse
    {
        $assignment = $this->assignmentService->getAssignment($id);

        if (!$assignment) {
            return $this->errorResponse('Assignment not found', 404);
        }

        return $this->successResponse($assignment);
    }

    public function complete(int $id): JsonResponse
    {
        $assignment = $this->assignmentService->completeAssignment($id, auth()->id());

        if (!$assignment) {
            return $this->errorResponse('Assignment not found', 404);
        }

        return $this->successResponse($assignment, 'Assignment completed successfully');
    }
}
