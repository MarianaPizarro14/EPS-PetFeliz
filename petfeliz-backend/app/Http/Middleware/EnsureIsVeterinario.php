<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureIsVeterinario
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (!$user || $user->rol !== 'veterinario') {
            return response()->json([
                'message' => 'Acceso denegado. Se requieren permisos de profesional médico veterinario.'
            ], Response::HTTP_FORBIDDEN);
        }

        return $next($request);
    }
}
