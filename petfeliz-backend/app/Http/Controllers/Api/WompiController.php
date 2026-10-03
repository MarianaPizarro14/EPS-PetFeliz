<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class WompiController extends Controller
{
    /**
     * Generar la firma criptográfica SHA256 para el Widget / Checkout de Wompi.
     */
    public function generarFirma(Request $request)
    {
        $request->validate([
            'id_servicio' => 'required|integer|exists:servicio,id_servicio',
            'token_reserva' => 'required|string',
            'referencia' => 'nullable|string',
        ], [
            'id_servicio.required' => 'El servicio clínico es obligatorio.',
            'token_reserva.required' => 'El token de reserva es obligatorio.',
        ]);

        $user = $request->user();
        if (!$user) {
            return response()->json(['message' => 'Usuario no autenticado.'], 401);
        }
        $cliente = $user->cliente;

        // 1. Validar que token_reserva exista, pertenezca al usuario autenticado, esté vigente y no haya sido usado
        $reserva = \App\Models\ReservaTemporal::where('token_reserva', $request->token_reserva)
            ->where('id_usuario', $user->id_usuario)
            ->where('expires_at', '>', now())
            ->where('es_usada', false)
            ->first();

        if (!$reserva) {
            return response()->json([
                'message' => 'La reserva del horario no existe, ha expirado o pertenece a otro usuario. Por favor selecciona tu horario nuevamente.'
            ], 422);
        }

        // 2. Generar o validar la referencia de pago en el servidor
        $referencia = $request->filled('referencia')
            ? trim($request->referencia)
            : ('PETFELIZ-' . strtoupper(\Illuminate\Support\Str::random(10)) . '-' . time());

        // Asociar la referencia de pago a la reserva temporal
        $reserva->update(['referencia_pago' => $referencia]);

        $servicio = \App\Models\Servicio::findOrFail($request->id_servicio);
        $calculo = $servicio->calcularPrecio($cliente);
        $montoPesos = (float) $calculo['monto'];
        $montoCentavos = (int) round($montoPesos * 100);

        $currency = trim(config('services.wompi.currency', 'COP'));
        $rawSecret = config('services.wompi.integrity_secret') ?? '';
        $integritySecret = trim(trim($rawSecret), '"\'');

        $rawPublicKey = config('services.wompi.public_key') ?? '';
        $publicKey = trim(trim($rawPublicKey), '"\'');

        if (empty($integritySecret)) {
            \Illuminate\Support\Facades\Log::error('WOMPI CONFIG ERROR: La variable WOMPI_INTEGRITY_SECRET no está configurada.');
            return response()->json([
                'message' => 'No pudimos iniciar el pago en este momento. Por favor intenta de nuevo en unos minutos o selecciona otro método de pago.'
            ], 500);
        }

        \Illuminate\Support\Facades\Log::info("WOMPI FIRMA GENERADA: Usuario={$user->id_usuario}, Ref={$referencia}, MontoCentavos={$montoCentavos}, Moneda={$currency}");

        // Concatenación requerida por Wompi: Referencia + MontoEnCentavos + Moneda + SecretoDeIntegridad
        $cadenaFirma = $referencia . $montoCentavos . $currency . $integritySecret;
        $signature = hash('sha256', $cadenaFirma);

        return response()->json([
            'referencia' => $referencia,
            'monto_pesos' => $montoPesos,
            'monto_centavos' => $montoCentavos,
            'moneda' => $currency,
            'publicKey' => $publicKey,
            'signature' => $signature,
        ], 200);
    }

    /**
     * Webhook para recibir notificaciones asíncronas de Wompi (transacciones PENDING / APPROVED / DECLINED).
     */
    public function handleWebhook(Request $request)
    {
        $payload = $request->all();

        // 1. Validar la firma criptográfica (checksum SHA256) con WOMPI_EVENTS_SECRET (401 si no coincide)
        $isValidChecksum = \App\Services\WompiService::verificarChecksumWebhook($payload);
        if (!$isValidChecksum) {
            \Illuminate\Support\Facades\Log::warning('WOMPI WEBHOOK ERROR: Firma de evento (checksum) no coincide. Origen no autorizado rechazado con 401.', [
                'ip' => $request->ip(),
                'payload' => $payload,
            ]);
            return response()->json([
                'status' => 'unauthorized',
                'message' => 'Firma del evento inválida.'
            ], 401);
        }

        try {
            $event = $payload['event'] ?? '';
            $transaction = $payload['data']['transaction'] ?? null;

            if ($event === 'transaction.updated' && $transaction) {
                $wompiTxId = $transaction['id'] ?? '';
                $status = $transaction['status'] ?? '';
                \Illuminate\Support\Facades\Log::info("WOMPI WEBHOOK RECIBIDO: Transacción {$wompiTxId} en estado '{$status}'.");

                // Procesar transacción mediante el servicio unificado
                $resultado = \App\Services\PaymentAppointmentService::procesarDesdeWebhook($transaction);

                // Responder 200 en todo evento ya procesado, incluidos conflictos de negocio
                return response()->json([
                    'status' => 'processed',
                    'message' => $resultado['message'] ?? 'Evento procesado correctamente.',
                    'data' => $resultado,
                ], 200);
            }

            return response()->json([
                'status' => 'received',
                'message' => 'Notificación de Webhook Wompi verificada y recibida.'
            ], 200);
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::error("WOMPI WEBHOOK EXCEPCION INESPERADA: " . $e->getMessage(), [
                'exception' => $e,
                'payload' => $payload,
            ]);
            return response()->json([
                'status' => 'error',
                'message' => 'Error interno al procesar el webhook de Wompi.'
            ], 500);
        }
    }
}
