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
            'referencia' => 'required|string',
            'monto' => 'required|numeric|gt:0',
        ]);

        $referencia = trim($request->referencia);
        $montoPesos = (float) $request->monto;

        if ($request->filled('id_servicio')) {
            $servicio = \App\Models\Servicio::find($request->id_servicio);
            if ($servicio) {
                $user = $request->user();
                $cliente = $user ? $user->cliente : null;
                $afiliadoAlDia = $cliente && $cliente->es_afiliado && $cliente->estado_afiliacion === 'al_dia';

                if ($afiliadoAlDia) {
                    if ($servicio->incluido_en_plan) {
                        $montoPesos = 0;
                    } elseif ($servicio->precio_afiliado !== null && $servicio->precio_afiliado !== '') {
                        $montoPesos = (float) $servicio->precio_afiliado;
                    } else {
                        $montoPesos = (float) ($servicio->precio_base ?? 70000);
                    }
                } else {
                    $montoPesos = (float) ($servicio->precio_base ?? 70000);
                }
            }
        }

        $montoCentavos = (int) round($montoPesos * 100);

        $currency = trim(config('services.wompi.currency', 'COP'));
        $rawSecret = config('services.wompi.integrity_secret') ?? '';
        // Limpiar espacios en blanco, comillas simples/dobles y saltos de línea invisibles
        $integritySecret = trim(trim($rawSecret), '"\'');

        $rawPublicKey = config('services.wompi.public_key') ?? '';
        $publicKey = trim(trim($rawPublicKey), '"\'');

        if (empty($integritySecret)) {
            \Illuminate\Support\Facades\Log::error('WOMPI CONFIG ERROR: La variable WOMPI_INTEGRITY_SECRET no está configurada en Railway.');
            return response()->json([
                'message' => 'No pudimos iniciar el pago en este momento. Por favor intenta de nuevo en unos minutos o selecciona otro método de pago.'
            ], 500);
        }

        // Log::info temporal de depuración SIN el secreto para comparar datos
        \Illuminate\Support\Facades\Log::info("WOMPI FIRMA DEBUG: Referencia={$referencia}, MontoPesos={$montoPesos}, MontoCentavos={$montoCentavos}, Moneda={$currency}");

        // Concatenación requerida por Wompi: Referencia + MontoEnCentavos + Moneda + SecretoDeIntegridad
        $cadenaFirma = $referencia . $montoCentavos . $currency . $integritySecret;

        // Algoritmo SHA256 en hexadecimal
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
     * Webhook para recibir notificaciones asíncronas de Wompi (transacciones PENDING / APPROVED).
     */
    public function handleWebhook(Request $request)
    {
        $payload = $request->all();

        // 1. Validar la firma criptográfica (checksum SHA256) con WOMPI_EVENTS_SECRET
        $isValidChecksum = \App\Services\WompiService::verificarChecksumWebhook($payload);
        if (!$isValidChecksum) {
            \Illuminate\Support\Facades\Log::warning('WOMPI WEBHOOK ERROR: Firma de evento (checksum) no coincide. Intento de origen no autorizado desestimado.', [
                'ip' => $request->ip(),
                'payload' => $payload,
            ]);
            return response()->json([
                'status' => 'unauthorized',
                'message' => 'Firma del evento inválida.'
            ], 401);
        }

        $event = $payload['event'] ?? '';
        $transaction = $payload['data']['transaction'] ?? null;

        if ($event === 'transaction.updated' && $transaction) {
            $wompiTxId = $transaction['id'] ?? '';
            $status = $transaction['status'] ?? '';
            \Illuminate\Support\Facades\Log::info("WOMPI WEBHOOK RECIBIDO: Transacción {$wompiTxId} cambió a estado '{$status}'.");
        }

        return response()->json([
            'status' => 'received',
            'message' => 'Notificación de Webhook Wompi verificada y procesada correctamente.'
        ], 200);
    }
}
