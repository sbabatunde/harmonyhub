<?php

namespace Modules\Auth\app\Services;

use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Modules\Auth\app\DTOs\RegisterUserData;
use Modules\Auth\app\DTOs\LoginUserData;
use Modules\Auth\app\DTOs\AuthResponseData;
use Modules\Auth\app\Exceptions\InvalidCredentialsException;
use Modules\Auth\app\Services\Contracts\AuthServiceInterface;

class AuthService implements AuthServiceInterface
{
  public function register(RegisterUserData $data): AuthResponseData
  {
    $user = User::create([
      'name' => $data->name,
      'email' => $data->email,
      'password' => Hash::make($data->password),
      'role' => 'student',
      'voice_part' => $data->voicePart ?? 'unknown',
      'vocal_range_low' => $data->vocalRangeLow,
      'vocal_range_high' => $data->vocalRangeHigh,
      'age_bracket' => $data->ageBracket,
      'is_minor' => $data->isMinor ?? false,
      'guardian_email' => $data->guardianEmail,
      'church_id' => $data->churchId,
    ]);

    // Create session for cookie-based auth
    auth()->login($user);

    // Also create token for API auth
    $token = $user->createToken('auth_token')->plainTextToken;

    return AuthResponseData::fromUser($user, $token);
  }

  public function login(LoginUserData $data): AuthResponseData
  {
    $user = User::where('email', $data->email)->first();

    if (!$user || !Hash::check($data->password, $user->password)) {
      throw new InvalidCredentialsException();
    }

    // CREATE THE SESSION - This is the key fix!
    auth()->login($user);

    // Also create token for API auth
    $token = $user->createToken('auth_token')->plainTextToken;

    return AuthResponseData::fromUser($user, $token);
  }

  public function logout(User $user): void
  {
    // Delete current token
    $user->currentAccessToken()?->delete();

    // Destroy session
    auth()->logout();
  }
}
