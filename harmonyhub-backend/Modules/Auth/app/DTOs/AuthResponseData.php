<?php

namespace Modules\Auth\app\DTOs;

use App\Models\User;
use Modules\Auth\App\DTOs\UserData;
use Spatie\LaravelData\Data;

class AuthResponseData extends Data
{
  public function __construct(
    public readonly UserData $user,
    public readonly string $token,
  ) {}

  public static function fromUser(User $user, string $token): self
  {
    return new self(
      user: UserData::fromModel($user),
      token: $token,
    );
  }
}
