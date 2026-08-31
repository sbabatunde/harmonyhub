<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckRole
{
  public function handle(Request $request, Closure $next, string ...$roles): Response
  {
    $user = $request->user();

    if (!$user) {
      return response()->json([
        'success' => false,
        'message' => 'Unauthenticated',
      ], 401);
    }

    // $user->role is a UserRole backed-enum instance (see App\Enums\UserRole),
    // not a plain string — comparing it directly against the route's string
    // params (e.g. 'role:teacher,admin') always failed, since PHP won't
    // loosely-equate a BackedEnum case to its own scalar value.
    $userRole = $user->role instanceof \BackedEnum ? $user->role->value : $user->role;

    if (!in_array($userRole, $roles, true)) {
      return response()->json([
        'success' => false,
        'message' => 'Unauthorized access',
      ], 403);
    }

    return $next($request);
  }
}
