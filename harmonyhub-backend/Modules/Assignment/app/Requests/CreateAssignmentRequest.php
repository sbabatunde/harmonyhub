<?php

namespace Modules\Assignment\app\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Modules\Assignment\app\DTOs\CreateAssignmentData;

class CreateAssignmentRequest extends FormRequest
{
  public function authorize(): bool
  {
    return in_array(auth()->user()->role, ['teacher', 'admin']);
  }

  public function rules(): array
  {
    return [
      'student_id' => ['required', 'exists:users,id'],
      'song_id' => ['required', 'exists:songs,id'],
      'due_date' => ['nullable', 'date', 'after:today'],
    ];
  }

  public function toDTO(): CreateAssignmentData
  {
    return CreateAssignmentData::from([
      ...$this->validated(),
      'assigned_by' => auth()->id(),
    ]);
  }
}
