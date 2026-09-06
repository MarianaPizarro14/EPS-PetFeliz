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

        $referencia = $request->referencia;
        $montoPesos = $request->monto;
        $montoCentavos = (int) round($montoPesos * 100);

        $currency = config('services.wompi.currency', 'COP');
        $integritySecret = config('services.wompi.integrity_secret');
        $publicKey = config('services.wompi.public_key');

        if (!$integritySecret) {
            return response()->json([
                'message' => 'Error de configuración: Secreto de integridad de Wompi no configurado.'
            ], 500);
        }

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
