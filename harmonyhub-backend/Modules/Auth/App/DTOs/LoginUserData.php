<?php

namespace Modules\Auth\App\DTOs;

use Spatie\LaravelData\Data;

class LoginUserData extends Data
{
  public function __construct(
    public readonly string $email,
    public readonly string $password,
  ) {}
}
