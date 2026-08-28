<?php

namespace App\Services;

use App\Models\Cliente;
use App\Models\Notificacion;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;

class NotificationService
{
    /**
     * Crear notificación web (campanita) y opcionalmente enviar correo electrónico al cliente.
     */
    public static function notificar(
        Cliente $cliente,
        string $titulo,
        string $mensaje,
        string $icono = 'fa-regular fa-bell',
        string $tipo = 'general',
        $mailable = null,
        bool $esRecordatorioCita = false
    ) {
        // 1. Guardar en la base de datos (Campanita Web)
        $notificacion = Notificacion::create([
            'id_cliente' => $cliente->id_cliente,
            'titulo' => $titulo,
            'mensaje' => $mensaje,
            'leida' => false,
            'icono' => $icono,
            'tipo' => $tipo,
        ]);

        // 2. Enviar correo si existe mailable y el usuario lo tiene permitido en sus preferencias
        if ($mailable && $cliente->usuario && !empty($cliente->usuario->email)) {
            $debeEnviarEmail = $esRecordatorioCita
                ? ($cliente->recordatorios_citas ?? true)
                : ($cliente->notificaciones_email ?? true);

            if ($debeEnviarEmail) {
                try {
                    Mail::to($cliente->usuario->email)->send($mailable);
                } catch (\Throwable $e) {
                    Log::error("Fallo al enviar correo de notificación a {$cliente->usuario->email}: " . $e->getMessage());
                }
            }
        }

        return $notificacion;
    }
}
