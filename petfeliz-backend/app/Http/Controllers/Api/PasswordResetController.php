<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\ForgotPasswordRequest;
use App\Http\Requests\ResetPasswordRequest;
use App\Mail\ResetPasswordMail;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

class PasswordResetController extends Controller
{
    public function forgot(ForgotPasswordRequest $request)
    {
        $user = User::where('email', $request->email)->first();

        if (!$user) {
            return response()->json([
                'message' => 'No pudimos enviar el enlace. Verifica el correo ingresado.',
            ], 400);
        }

        $token = Str::random(60);

        $user->update([
            'token_reset' => $token,
            'token_reset_expira' => now()->addMinutes(60),
        ]);

        $resetLink = env('FRONTEND_URL') . '/reset-password?token=' . $token . '&email=' . $user->email;

        Mail::to($user->email)->send(new ResetPasswordMail($resetLink));

        return response()->json([
            'message' => 'Se envió el enlace de recuperación a tu correo.',
        ]);
    }

    public function reset(ResetPasswordRequest $request)
    {
        $user = User::where('email', $request->email)
            ->where('token_reset', $request->token)
            ->first();

        if (!$user) {
            return response()->json([
                'message' => 'El token es inválido.',
            ], 400);
        }

        if (now()->greaterThan($user->token_reset_expira)) {
            return response()->json([
                'message' => 'El token expiró, solicita uno nuevo.',
            ], 400);
        }

        $user->update([
            'contrasena_hash' => Hash::make($request->password),
            'token_reset' => null,
            'token_reset_expira' => null,
        ]);

        return response()->json([
            'message' => 'Contraseña actualizada correctamente.',
        ]);
    }
}