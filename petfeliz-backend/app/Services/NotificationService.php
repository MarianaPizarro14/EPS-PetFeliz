<?php

namespace App\Services;

use App\Models\Cliente;
use App\Models\Notificacion;
use App\Models\User;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;

class NotificationService
{
    /**
     * Crear notificación web (campanita) y opcionalmente enviar correo electrónico transaccional al cliente.
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
        $notificacion = Notificacion::create([
            'id_cliente' => $cliente->id_cliente,
            'id_usuario' => $cliente->id_usuario,
            'titulo' => $titulo,
            'mensaje' => $mensaje,
            'leida' => false,
            'icono' => $icono,
            'tipo' => $tipo,
        ]);

        if ($mailable && $cliente->usuario && !empty($cliente->usuario->email)) {
            // Los correos de recordatorio de cita respetan el interruptor de preferencia.
            // Los correos transaccionales (facturas, confirmación de cita, comprobante de pago) SIEMPRE se envían.
            $debeEnviarEmail = $esRecordatorioCita
                ? ($cliente->recordatorios_citas ?? true)
                : true;

            if ($debeEnviarEmail) {
                try {
                    Mail::to($cliente->usuario->email)->send($mailable);
                } catch (\Throwable $e) {
                    Log::error("Fallo no bloqueante al enviar correo transaccional a {$cliente->usuario->email}: " . $e->getMessage());
                }
            }
        }

        return $notificacion;
    }

    /**
     * Crear notificación web para todos los administradores del sistema.
     */
    public static function notificarAdmin(
        string $titulo,
        string $mensaje,
        string $icono = 'fa-solid fa-shield-halved',
        string $tipo = 'admin'
    ) {
        try {
            $admins = User::where('rol', 'admin')->get();
            foreach ($admins as $admin) {
                Notificacion::create([
                    'id_cliente' => null,
                    'id_usuario' => $admin->id_usuario,
                    'titulo' => $titulo,
                    'mensaje' => $mensaje,
                    'leida' => false,
                    'icono' => $icono,
                    'tipo' => $tipo,
                ]);
            }
        } catch (\Throwable $e) {
            Log::error("Fallo al crear notificación de administrador: " . $e->getMessage());
        }
    }
}
