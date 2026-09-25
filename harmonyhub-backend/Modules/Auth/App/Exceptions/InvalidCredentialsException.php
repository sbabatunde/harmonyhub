<?php

namespace Modules\Auth\App\Exceptions;

use Exception;
use Illuminate\Http\JsonResponse;

class InvalidCredentialsException extends Exception
{
  public function __construct(string $message = 'Invalid credentials provided')
  {
    parent::__construct($message);
  }

  public function render(): JsonResponse
  {
    return response()->json([
      'success' => false,
      'message' => $this->getMessage(),
    ], 401);
  }
}
