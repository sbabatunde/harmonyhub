<?php

namespace Modules\Auth\App\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Modules\Auth\App\DTOs\LoginUserData;

class LoginUserRequest extends FormRequest
{
  public function authorize(): bool
  {
    return true;
  }

  public function rules(): array
  {
    return [
      'email' => ['required', 'string', 'email'],
      'password' => ['required', 'string'],
    ];
  }

  public function toDTO(): LoginUserData
  {
    return LoginUserData::from($this->validated());
  }
}
