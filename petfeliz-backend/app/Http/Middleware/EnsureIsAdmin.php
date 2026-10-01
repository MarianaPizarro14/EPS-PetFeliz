<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureIsAdmin
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user() ?? \Illuminate\Support\Facades\Auth::guard('sanctum')->user();
        if ($user) {
            $request->setUserResolver(fn () => $user);
        }

        if (!$user || strtolower(trim($user->rol ?? '')) !== 'admin') {
            return response()->json([
                'message' => 'Acceso denegado. Se requieren permisos de administrador.'
            ], Response::HTTP_FORBIDDEN);
        }

        return $next($request);
    }
}
