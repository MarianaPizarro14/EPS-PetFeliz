<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureIsRecepcionista
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (!$user || strtolower(trim($user->rol ?? '')) !== 'recepcionista') {
            return response()->json([
                'message' => 'Acceso denegado. Se requieren permisos de recepcionista de sede.'
            ], Response::HTTP_FORBIDDEN);
        }

        return $next($request);
    }
}
