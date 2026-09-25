<?php

namespace Modules\Auth\App\DTOs;

use Spatie\LaravelData\Data;
use App\Models\User;
use App\Enums\UserRole;
use App\Enums\VoicePart;

class UserData extends Data
{
  public function __construct(
    public readonly int $id,
    public readonly string $name,
    public readonly string $email,
    public readonly UserRole|string $role,
    public readonly VoicePart|string|null $voicePart,
    public readonly ?int $churchId,
    public readonly ?string $churchName = null,
  ) {}

  public static function fromModel(User $user): self
  {
    return new self(
      id: $user->id,
      name: $user->name,
      email: $user->email,
      role: $user->role instanceof UserRole ? $user->role->value : $user->role,
      voicePart: $user->voice_part instanceof VoicePart ? $user->voice_part->value : $user->voice_part,
      churchId: $user->church_id,
      churchName: $user->church?->name,
    );
  }
}
