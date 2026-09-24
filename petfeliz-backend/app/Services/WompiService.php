<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class WompiService
{
    /**
     * Consultar la información oficial de una transacción directamente a la API REST de Wompi.
     */
    public static function consultarTransaccion(string $transactionId): ?array
    {
        $baseUrl = rtrim(config('services.wompi.api_url', 'https://sandbox.wompi.co/v1'), '/');
        $publicKey = config('services.wompi.public_key') ?? '';
        $url = "{$baseUrl}/transactions/{$transactionId}";

        try {
            $headers = ['Accept' => 'application/json'];
            if (!empty($publicKey)) {
                $headers['Authorization'] = 'Bearer ' . trim($publicKey, '"\'');
            }

            $response = Http::withHeaders($headers)->timeout(10)->get($url);

            if ($response->successful()) {
                $json = $response->json();
                return $json['data'] ?? null;
            }

            Log::error("WOMPI API ERROR: Consulta de transacción {$transactionId} devolvió HTTP status {$response->status()}", [
                'body' => $response->body(),
            ]);
            return null;
        } catch (\Exception $e) {
            Log::error("WOMPI API EXCEPTION: Fallo al consultar la transacción {$transactionId}: " . $e->getMessage());
            return null;
        }
    }

    /**
     * Verificar la firma criptográfica (checksum SHA256) de un evento Webhook de Wompi.
     */
    public static function verificarChecksumWebhook(array $payload): bool
    {
        $rawSecret = config('services.wompi.events_secret') ?? '';
        $eventsSecret = trim(trim($rawSecret), '"\'');

        if (empty($eventsSecret)) {
            Log::warning('WOMPI WEBHOOK WARNING: WOMPI_EVENTS_SECRET no está configurada. Se omite la validación de checksum.');
            return true;
        }

        $transaction = $payload['data']['transaction'] ?? null;
        $signature = $payload['signature']['checksum'] ?? null;

        if (!$transaction || !$signature) {
            return false;
        }

        $id = $transaction['id'] ?? '';
        $status = $transaction['status'] ?? '';
        $amountInCents = $transaction['amount_in_cents'] ?? 0;
        $timestamp = $payload['timestamp'] ?? 0;

        // Concatenación según especificación oficial de Wompi:
        // properties.transaction.id + properties.transaction.status + properties.transaction.amount_in_cents + timestamp + WOMPI_EVENTS_SECRET
        $cadena = $id . $status . $amountInCents . $timestamp . $eventsSecret;
        $calculatedChecksum = hash('sha256', $cadena);

        return hash_equals($calculatedChecksum, $signature);
    }
}
