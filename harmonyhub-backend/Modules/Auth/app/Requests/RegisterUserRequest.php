<?php

namespace Modules\Auth\app\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Modules\Auth\app\DTOs\RegisterUserData;

class RegisterUserRequest extends FormRequest
{
  public function authorize(): bool
  {
    return true;
  }

  public function rules(): array
  {
    return [
      'name' => ['required', 'string', 'max:255'],
      'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
      'password' => ['required', 'string', 'min:8', 'confirmed'],
      'church_id' => ['required', 'exists:churches,id'],
      'voice_part' => ['sometimes', 'string', 'in:soprano,alto,tenor,bass,unknown'],
      'vocal_range_low' => ['sometimes', 'nullable', 'string', 'max:10'],
      'vocal_range_high' => ['sometimes', 'nullable', 'string', 'max:10'],
      'age_bracket' => ['sometimes', 'nullable', 'string', 'max:20'],
      'is_minor' => ['sometimes', 'boolean'],
      'guardian_email' => ['required_if:is_minor,true', 'nullable', 'email'],
    ];
  }

  public function messages(): array
  {
    return [
      'guardian_email.required_if' => 'Guardian email is required for minor users.',
    ];
  }

  public function toDTO(): RegisterUserData
  {
    return RegisterUserData::from($this->validated());
  }
}
