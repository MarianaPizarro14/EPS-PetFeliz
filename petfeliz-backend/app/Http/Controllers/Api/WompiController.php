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
        $montoPesos = $request->monto;
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
     * Webhook placeholder para recibir notificaciones asíncronas de Wompi.
     */
    public function handleWebhook(Request $request)
    {
        // Placeholder: Lógica de validación del webhook se implementará en una etapa posterior.
        return response()->json([
            'status' => 'received',
            'message' => 'Notificación de Webhook Wompi recibida correctamente.'
        ], 200);
    }
}
