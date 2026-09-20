<?php

namespace App\Services;

use App\Models\Cliente;
use App\Models\Notificacion;
use App\Models\User;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class NotificationService
{
    /**
     * Crear notificación web (campanita) y enviar correo electrónico transaccional vía Resend HTTP API.
     * Retorna verdadero si el correo fue aceptado exitosamente por Resend, falso en caso contrario.
     */
    public static function notificar(
        Cliente $cliente,
        string $titulo,
        string $mensaje,
        string $icono = 'fa-regular fa-bell',
        string $tipo = 'general',
        $mailable = null,
        bool $esRecordatorioCita = false
    ): bool {
        // 1. Guardar la notificación web para la campanita del cliente
        Notificacion::create([
            'id_cliente' => $cliente->id_cliente,
            'id_usuario' => $cliente->id_usuario,
            'titulo' => $titulo,
            'mensaje' => $mensaje,
            'leida' => false,
            'icono' => $icono,
            'tipo' => $tipo,
        ]);

        $emailEnviado = false;

        // 2. Obtener el usuario y su correo electrónico
        $usuario = $cliente->usuario;
        $recipientEmail = $usuario ? $usuario->email : null;

        if ($mailable && !empty($recipientEmail)) {
            // Verificar preferencia si es recordatorio de cita; correos transaccionales siempre se envían
            $debeEnviarEmail = $esRecordatorioCita
                ? ($cliente->recordatorios_citas ?? true)
                : true;

            if ($debeEnviarEmail) {
                try {
                    // Leer estrictamente desde config/services.php para soportar config:cache en Railway
                    $resendKey = config('services.resend.key');

                    if (!empty($resendKey) && str_starts_with(trim($resendKey), 're_')) {
                        // Renderizar HTML del mailable
                        $htmlContent = $mailable->render();

                        // Asunto del correo
                        $subject = $titulo;
                        if (method_exists($mailable, 'envelope') && $mailable->envelope()) {
                            $subject = $mailable->envelope()->subject ?? $titulo;
                        } elseif (property_exists($mailable, 'subject') && !empty($mailable->subject)) {
                            $subject = $mailable->subject;
                        }

                        $fromAddress = config('mail.from.address', 'notificaciones@epspetfeliz.site');
                        $fromName = config('mail.from.name', 'EPS PetFeliz');

                        // Petición HTTP síncrona a la API de Resend por puerto HTTPS 443 (libre de bloqueos SMTP)
                        $response = Http::withHeaders([
                            'Authorization' => "Bearer {$resendKey}",
                            'Content-Type' => 'application/json',
                        ])->post('https://api.resend.com/emails', [
                            'from' => "{$fromName} <{$fromAddress}>",
                            'to' => [$recipientEmail],
                            'subject' => $subject,
                            'html' => $htmlContent,
                        ]);

                        if ($response->successful()) {
                            $emailEnviado = true;
                            Log::info("RESEND SUCCESS: Correo enviado a {$recipientEmail}. ID: " . ($response->json('id') ?? 'OK'));
                        } else {
                            Log::error("RESEND ERROR [HTTP {$response->status()}] al enviar a {$recipientEmail}: " . $response->body());
                        }
                    } else {
                        Log::error("RESEND CONFIG ERROR: La clave config('services.resend.key') está vacía o no comienza por 're_'. No se envió el correo a {$recipientEmail}.");
                    }
                } catch (\Throwable $e) {
                    Log::error("RESEND EXCEPTION al enviar correo a {$recipientEmail}: " . $e->getMessage() . "\n" . $e->getTraceAsString());
                }
            }
        }

        return $emailEnviado;
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
