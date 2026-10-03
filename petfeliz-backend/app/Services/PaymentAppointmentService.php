<?php

namespace App\Services;

use App\Models\Cita;
use App\Models\Cliente;
use App\Models\Mascota;
use App\Models\Pago;
use App\Models\ReservaTemporal;
use App\Models\Servicio;
use App\Models\User;
use App\Models\Veterinario;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class PaymentAppointmentService
{
    /**
     * Mapeo de métodos de pago de Wompi a nombres legibles.
     */
    private static function mapPaymentMethod(?string $rawMetodo, float $monto): string
    {
        if ($monto == 0) {
            return 'Cobertura Plan EPS';
        }

        if (empty($rawMetodo)) {
            return 'Tarjeta de Crédito / Débito';
        }

        $metodoMap = [
            'CARD' => 'Tarjeta de Crédito / Débito',
            'CARD_DEBIT' => 'Tarjeta Débito',
            'NEQUI' => 'Nequi',
            'PSE' => 'PSE (Wompi)',
            'BANCOLOMBIA_TRANSFER' => 'Bancolombia (Transferencia)',
            'BANCOLOMBIA_COLLECT' => 'Corresponsal Bancolombia',
            'BANCOLOMBIA_QR' => 'QR Bancolombia',
            'DAVIPLATA' => 'Daviplata',
            'card' => 'Tarjeta de Crédito / Débito',
            'nequi' => 'Nequi',
            'eps' => 'Cobertura Plan EPS',
            'wompi' => 'Wompi',
            'efectivo_sede' => 'Efectivo en Sede',
            'datafono' => 'Datáfono en Sede',
        ];

        $metodoUpper = strtoupper($rawMetodo);
        return $metodoMap[$rawMetodo] ?? ($metodoMap[$metodoUpper] ?? ucwords(strtolower(str_replace('_', ' ', $rawMetodo))));
    }

    /**
     * Procesar confirmación de pago y creación de Cita de forma IDEMPOTENTE y TRANSACCIONAL.
     *
     * @param array $params [
     *   'token_reserva' => ?string,
     *   'referencia_wompi' => ?string,
     *   'id_transaccion_wompi' => ?string,
     *   'id_mascota' => ?int,
     *   'id_servicio' => ?int,
     *   'id_cliente' => ?int,
     *   'observacion' => ?string,
     *   'tx_data' => ?array, // Si ya viene de webhook
     * ]
     * @param User|null $user
     * @return array [ 'success' => bool, 'code' => int, 'data' => array|string ]
     */
    public static function procesarConfirmacion(array $params, ?User $user = null): array
    {
        $wompiTxId = $params['id_transaccion_wompi'] ?? ($params['referencia_wompi'] ?? null);
        $tokenReserva = $params['token_reserva'] ?? null;
        $referenciaPago = $params['referencia'] ?? ($params['reference'] ?? null);

        // 1. IDEMPOTENCIA: Verificar si la transacción de Wompi ya fue procesada previamente
        if (!empty($wompiTxId)) {
            $pagoExistente = Pago::where('wompi_transaction_id', $wompiTxId)->first();
            if ($pagoExistente && $pagoExistente->id_cita) {
                $citaExistente = Cita::with(['mascota', 'veterinario', 'servicio'])->find($pagoExistente->id_cita);
                if ($citaExistente) {
                    Log::info("IDEMPOTENCIA: Pago Wompi {$wompiTxId} ya procesado anteriormente. Devolviendo cita existente #{$citaExistente->id_cita}.");
                    return [
                        'success' => true,
                        'code' => 200,
                        'idempotent' => true,
                        'message' => 'Esta transacción ya fue procesada anteriormente.',
                        'cita' => self::formatCitaResponse($citaExistente, $pagoExistente),
                    ];
                }
            }
        }

        // 2. Localizar la reserva temporal asociada (conservando reservas con referencia de pago)
        ReservaTemporal::limpiarExpiradas();

        $reservaQuery = ReservaTemporal::query();
        if (!empty($tokenReserva)) {
            $reservaQuery->where('token_reserva', $tokenReserva);
        } elseif (!empty($referenciaPago)) {
            $reservaQuery->where('referencia_pago', $referenciaPago);
        } elseif (!empty($params['id_veterinario']) && !empty($params['fecha']) && !empty($params['hora'])) {
            $reservaQuery->where('id_veterinario', $params['id_veterinario'])
                ->where('fecha', $params['fecha'])
                ->where('hora', $params['hora']);
        } else {
            return [
                'success' => false,
                'code' => 400,
                'message' => 'No se proporcionó información suficiente para identificar la reserva de la cita.',
            ];
        }

        $reserva = $reservaQuery->first();

        // 3. Determinar el cliente
        $cliente = null;
        if ($user && $user->cliente) {
            $cliente = $user->cliente;
        } elseif (!empty($params['id_cliente'])) {
            $cliente = Cliente::find($params['id_cliente']);
        } elseif ($reserva && $reserva->id_cliente) {
            $cliente = Cliente::find($reserva->id_cliente);
        } elseif ($reserva && $reserva->id_usuario) {
            $u = User::find($reserva->id_usuario);
            $cliente = $u ? $u->cliente : null;
        }

        if (!$cliente) {
            return [
                'success' => false,
                'code' => 404,
                'message' => 'No se pudo identificar el cliente titular de la reserva.',
            ];
        }

        // 4. Determinar mascota, servicio, veterinario, fecha, hora
        $idServicio = $params['id_servicio'] ?? ($reserva ? $reserva->id_servicio : null);
        $idMascota = $params['id_mascota'] ?? ($reserva ? $reserva->id_mascota : null);
        $observacion = $params['observacion'] ?? ($reserva ? $reserva->motivo : null);

        if (!$idServicio) {
            return [
                'success' => false,
                'code' => 422,
                'message' => 'El servicio clínico es obligatorio.',
            ];
        }

        $servicio = Servicio::find($idServicio);
        if (!$servicio) {
            return [
                'success' => false,
                'code' => 422,
                'message' => 'El servicio seleccionado no existe.',
            ];
        }

        // 5. Validar mascota perteneciente al cliente
        if (!$idMascota) {
            return [
                'success' => false,
                'code' => 422,
                'message' => 'La mascota es obligatoria.',
            ];
        }

        $mascota = Mascota::where('id_mascota', $idMascota)->where('id_cliente', $cliente->id_cliente)->first();
        if (!$mascota) {
            return [
                'success' => false,
                'code' => 403,
                'message' => 'No autorizado. La mascota no pertenece al cliente en sesión.',
            ];
        }

        // 6. Calcular precio SIEMPRE mediante Servicio::calcularPrecio() (SIN FALLBACKS FIJOS)
        $calculoPrecio = $servicio->calcularPrecio($cliente);
        $monto = (float) $calculoPrecio['monto'];
        $tipoCobertura = $calculoPrecio['tipo_cobertura'];
        $motivoFinal = $servicio->nombre;

        $rawMetodo = 'CARD';

        // 7. Si el monto es mayor a 0, validar transacción con Wompi
        if ($monto > 0) {
            if (empty($wompiTxId)) {
                return [
                    'success' => false,
                    'code' => 422,
                    'message' => 'Se requiere el ID de la transacción de Wompi para confirmar el pago.',
                ];
            }

            $txData = $params['tx_data'] ?? WompiService::consultarTransaccion($wompiTxId);

            if (!$txData) {
                return [
                    'success' => false,
                    'code' => 502,
                    'message' => 'No se pudo verificar la transacción con la pasarela de pagos Wompi.',
                ];
            }

            $status = strtoupper($txData['status'] ?? 'UNKNOWN');

            if ($status === 'PENDING') {
                return [
                    'success' => false,
                    'code' => 202,
                    'message' => 'Tu transacción se encuentra PENDIENTE de autorización por tu entidad bancaria. Recibirás una notificación en cuanto sea aprobada.',
                ];
            }

            if ($status !== 'APPROVED') {
                // Liberar la reserva si falló o fue rechazada
                if ($reserva) {
                    $reserva->update(['es_usada' => false]);
                }
                return [
                    'success' => false,
                    'code' => 422,
                    'message' => "La transacción no fue aprobada por Wompi (Estado: {$status}).",
                ];
            }

            $rawMetodo = $txData['payment_method_type'] ?? ($txData['payment_method']['type'] ?? 'CARD');
            $metodoPagoMapeado = self::mapPaymentMethod($rawMetodo, $monto);

            // Coincidencia estricta de Monto en Centavos
            $montoCentavosEsperado = (int) round($monto * 100);
            $montoCentavosWompi = (int) ($txData['amount_in_cents'] ?? 0);
            if ($montoCentavosWompi !== $montoCentavosEsperado) {
                $montoRecibidoPesos = $montoCentavosWompi / 100;
                Log::error("WOMPI DISCREPANCIA MONTO: Esperado {$montoCentavosEsperado} centavos (\${$monto}), recibido {$montoCentavosWompi} centavos (\${$montoRecibidoPesos}) en tx {$wompiTxId}.");

                // Registrar el Pago como 'requiere_revision' para no dejar el dinero sin rastro
                Pago::firstOrCreate(
                    ['wompi_transaction_id' => $wompiTxId],
                    [
                        'id_cliente' => $cliente->id_cliente,
                        'monto' => $montoRecibidoPesos,
                        'tipo_cobertura' => $tipoCobertura,
                        'metodo_pago' => $metodoPagoMapeado,
                        'estado' => 'requiere_revision',
                        'referencia_transaccion' => "WOMPI-{$wompiTxId}",
                        'observacion_pago' => "ALERTA: Discrepancia de monto en pasarela Wompi. Monto pagado (\$" . number_format($montoRecibidoPesos, 0, ',', '.') . " COP) difiere de la tarifa esperada (\$" . number_format($monto, 0, ',', '.') . " COP).",
                    ]
                );

                NotificationService::notificarAdmin(
                    'Alerta: Discrepancia de Monto en Pago',
                    "El cliente {$cliente->nombre} pagó $" . number_format($montoRecibidoPesos, 0, ',', '.') . " COP en Wompi (Tx: {$wompiTxId}), pero la tarifa del servicio {$motivoFinal} es de $" . number_format($monto, 0, ',', '.') . " COP. Se registró para revisión manual.",
                    'fa-solid fa-triangle-exclamation',
                    'alerta'
                );

                return [
                    'success' => false,
                    'code' => 422,
                    'message' => "El monto pagado en Wompi (\$" . number_format($montoRecibidoPesos, 0, ',', '.') . ") no coincide con la tarifa requerida (\$" . number_format($monto, 0, ',', '.') . ").",
                ];
            }

            // Moneda COP
            if (strtoupper($txData['currency'] ?? '') !== 'COP') {
                return [
                    'success' => false,
                    'code' => 422,
                    'message' => 'La moneda de la transacción debe ser COP.',
                ];
            }
        } else {
            $rawMetodo = 'eps';
        }

        $metodoFinal = self::mapPaymentMethod($rawMetodo, $monto);

        // 8. TRANSACCIÓN ATÓMICA CON BLOQUEO PESIMISTA
        return DB::transaction(function () use (
            $reserva,
            $params,
            $cliente,
            $idMascota,
            $idServicio,
            $motivoFinal,
            $monto,
            $tipoCobertura,
            $metodoFinal,
            $wompiTxId,
            $observacion
        ) {
            $idVet = $reserva ? $reserva->id_veterinario : ($params['id_veterinario'] ?? null);
            $fecha = $reserva ? $reserva->fecha : ($params['fecha'] ?? null);
            $horaStr = $reserva ? $reserva->hora : ($params['hora'] ?? null);

            if (!$idVet || !$fecha || !$horaStr) {
                return [
                    'success' => false,
                    'code' => 400,
                    'message' => 'No se encontraron los datos de médico, fecha y hora para la cita.',
                ];
            }

            $horaSql = date('H:i:s', strtotime($horaStr));

            // Bloquear y verificar citas activas concurrentes
            $citaConflicto = Cita::where('id_veterinario', $idVet)
                ->where('fecha', $fecha)
                ->where('hora', $horaSql)
                ->where('id_estado', '!=', 3) // Distinto a Cancelada
                ->lockForUpdate()
                ->first();

            if ($citaConflicto) {
                // Si la cita que ya existe es exactamente del mismo cliente y transacción, retornar idempotente
                $pagoExistente = Pago::where('id_cita', $citaConflicto->id_cita)->first();
                if ($pagoExistente && $wompiTxId && $pagoExistente->wompi_transaction_id === $wompiTxId) {
                    return [
                        'success' => true,
                        'code' => 200,
                        'idempotent' => true,
                        'message' => 'Esta cita ya fue procesada anteriormente.',
                        'cita' => self::formatCitaResponse($citaConflicto, $pagoExistente),
                    ];
                }

                if ($reserva) {
                    $reserva->delete();
                }

                // Si el pago ya fue cobrado en Wompi pero el horario fue tomado, registrar para REEMBOLSO manual
                if ($monto > 0 && $wompiTxId) {
                    Pago::firstOrCreate(
                        ['wompi_transaction_id' => $wompiTxId],
                        [
                            'id_cliente' => $cliente->id_cliente,
                            'monto' => $monto,
                            'tipo_cobertura' => $tipoCobertura,
                            'metodo_pago' => $metodoFinal,
                            'estado' => 'requiere_revision',
                            'referencia_transaccion' => "WOMPI-{$wompiTxId}",
                            'observacion_pago' => 'ALERTA: Pago recibido por Wompi pero el horario de la cita ya no estaba disponible. Requiere gestión de reembolso manual.',
                        ]
                    );

                    Log::error("WOMPI REEMBOLSO REQUERIDO: Pago {$wompiTxId} por \${$monto} COP recibido pero el cupo (Vet: {$idVet}, Fecha: {$fecha}, Hora: {$horaSql}) ya estaba ocupado.");

                    NotificationService::notificarAdmin(
                        'Alerta: Pago Requiere Revisión/Reembolso',
                        "Se recibió el pago Wompi {$wompiTxId} por $" . number_format($monto, 0, ',', '.') . " COP para {$cliente->nombre} pero el horario ya no estaba disponible. Se requiere gestionar reembolso manual.",
                        'fa-solid fa-triangle-exclamation',
                        'alerta'
                    );
                }

                return [
                    'success' => false,
                    'code' => 409,
                    'message' => 'El horario seleccionado ya ha sido reservado por otro usuario. Se ha registrado el pago para revisión y reembolso.',
                ];
            }

            $vetObj = Veterinario::find($idVet);
            $idSedeFinal = ($vetObj && $vetObj->id_sede) ? (int) $vetObj->id_sede : ($reserva->id_sede ?? ($params['id_sede'] ?? 1));

            // Crear Cita con captura de QueryException por colisión de índice único slot_activo
            try {
                $cita = Cita::create([
                    'id_cliente' => $cliente->id_cliente,
                    'id_mascota' => $idMascota,
                    'id_servicio' => $idServicio,
                    'id_sede' => $idSedeFinal,
                    'motivo' => $motivoFinal,
                    'fecha' => $fecha,
                    'hora' => $horaSql,
                    'observacion' => $observacion,
                    'metodo_pago' => $metodoFinal,
                    'estado_pago' => 'pagado',
                    'monto_pago' => $monto,
                    'id_estado' => 2, // 2 = Confirmada
                    'id_veterinario' => $idVet,
                ]);
            } catch (\Illuminate\Database\QueryException $e) {
                if ($e->getCode() == 23000 || str_contains($e->getMessage(), 'slot_activo') || str_contains($e->getMessage(), 'Duplicate entry')) {
                    Log::error("CONFLICTO CONCURRENCIA: Violación de índice único slot_activo al crear cita para médico {$idVet}, fecha {$fecha}, hora {$horaSql}. Error: " . $e->getMessage());

                    if ($monto > 0 && $wompiTxId) {
                        Pago::firstOrCreate(
                            ['wompi_transaction_id' => $wompiTxId],
                            [
                                'id_cliente' => $cliente->id_cliente,
                                'monto' => $monto,
                                'tipo_cobertura' => $tipoCobertura,
                                'metodo_pago' => $metodoFinal,
                                'estado' => 'requiere_revision',
                                'referencia_transaccion' => "WOMPI-{$wompiTxId}",
                                'observacion_pago' => 'ALERTA: Conflicto de concurrencia al crear cita. Requiere reembolso manual.',
                            ]
                        );

                        NotificationService::notificarAdmin(
                            'Alerta: Choque de Horario en Pago',
                            "Colisión de cita concurrente en pago {$wompiTxId} ($" . number_format($monto, 0, ',', '.') . " COP). Se requiere revisión.",
                            'fa-solid fa-triangle-exclamation',
                            'alerta'
                        );
                    }

                    return [
                        'success' => false,
                        'code' => 409,
                        'message' => 'El horario seleccionado ya fue tomado por otra cita activa. Por favor selecciona otro horario.',
                    ];
                }
                throw $e;
            }

            $refTransaccion = $wompiTxId ? "WOMPI-{$wompiTxId}" : ('TX-' . strtoupper(Str::random(8)) . '-' . time());

            // Crear Pago
            $pago = Pago::create([
                'id_cita' => $cita->id_cita,
                'id_cliente' => $cliente->id_cliente,
                'monto' => $monto,
                'tipo_cobertura' => $tipoCobertura,
                'metodo_pago' => $metodoFinal,
                'estado' => 'confirmado',
                'referencia_transaccion' => $refTransaccion,
                'wompi_transaction_id' => $monto > 0 ? $wompiTxId : null,
            ]);

            // Marcar la reserva temporal como utilizada y completada
            if ($reserva) {
                $reserva->update(['es_usada' => true]);
            }

            // Notificaciones
            $pet = Mascota::find($cita->id_mascota);
            $petNombre = $pet ? $pet->nombre : 'tu mascota';
            $vetNombre = $vetObj->nombre ?? 'Médico Asignado';

            $emailEnviado1 = NotificationService::notificar(
                $cliente,
                'Pago Exitoso Registrado',
                "Se confirmó tu pago por $" . number_format($monto, 0, ',', '.') . " COP (Ref: {$pago->referencia_transaccion}) para el servicio {$motivoFinal}.",
                'fa-solid fa-credit-card',
                'pago',
                new \App\Mail\ConfirmacionPagoMail($cliente, [
                    'referencia' => $pago->referencia_transaccion,
                    'monto' => $monto,
                    'servicio' => $motivoFinal,
                    'metodo' => $metodoFinal,
                ])
            );

            $emailEnviado2 = NotificationService::notificar(
                $cliente,
                'Comprobante Digital Disponible',
                "Se ha generado el comprobante electrónico para la atención de {$petNombre}.",
                'fa-solid fa-file-invoice-dollar',
                'factura',
                new \App\Mail\NuevaFacturaMail($cliente, [
                    'id_pago' => $pago->id_pago,
                    'referencia' => $pago->referencia_transaccion,
                    'monto' => $monto,
                    'servicio' => $motivoFinal,
                ])
            );

            NotificationService::notificar(
                $cliente,
                '¡Cita Agendada Exitosamente!',
                "Tu cita para {$petNombre} ha sido programada para el {$cita->fecha} a las {$cita->hora} con Dr(a). {$vetNombre}.",
                'fa-regular fa-calendar-check',
                'cita'
            );

            NotificationService::notificarAdmin(
                'Nueva Cita Confirmada',
                "El cliente {$cliente->nombre} agendó {$motivoFinal} para {$petNombre} el {$cita->fecha} a las {$cita->hora}.",
                'fa-solid fa-calendar-check',
                'cita'
            );

            return [
                'success' => true,
                'code' => 201,
                'message' => '¡Cita confirmada y pagada con éxito!',
                'email_enviado' => ($emailEnviado1 || $emailEnviado2),
                'cita' => self::formatCitaResponse($cita, $pago),
            ];
        });
    }

    /**
     * Procesar evento recibido desde Webhook de Wompi.
     */
    public static function procesarDesdeWebhook(array $transaction): array
    {
        $status = strtoupper($transaction['status'] ?? '');
        $wompiTxId = $transaction['id'] ?? '';
        $reference = $transaction['reference'] ?? '';

        Log::info("PaymentAppointmentService::procesarDesdeWebhook - Transacción {$wompiTxId} ({$reference}) Estado: {$status}");

        // Si el estado es APPROVED, procesar la confirmación y agendamiento
        if ($status === 'APPROVED') {
            return self::procesarConfirmacion([
                'id_transaccion_wompi' => $wompiTxId,
                'referencia_wompi' => $wompiTxId,
                'referencia' => $reference,
                'tx_data' => $transaction,
            ]);
        }

        // Si el estado es DECLINED / VOIDED / ERROR, liberar la reserva si existe
        if (in_array($status, ['DECLINED', 'VOIDED', 'ERROR'])) {
            self::liberarReservaPorReferencia($reference);
            Log::info("Reserva temporal liberada tras pago no exitoso ({$status}) para referencia: {$reference}");
            return [
                'success' => true,
                'code' => 200,
                'message' => "Reserva liberada para estado {$status}.",
            ];
        }

        return [
            'success' => true,
            'code' => 200,
            'message' => "Evento ignorado para estado {$status}.",
        ];
    }

    /**
     * Liberar reserva temporal buscando por referencia de pago o token.
     */
    public static function liberarReservaPorReferencia(?string $referencia): bool
    {
        if (empty($referencia)) {
            return false;
        }

        return (bool) ReservaTemporal::where('referencia_pago', $referencia)
            ->orWhere('token_reserva', $referencia)
            ->delete();
    }

    /**
     * Formatear respuesta de cita para el frontend.
     */
    public static function formatCitaResponse(Cita $cita, ?Pago $pago = null): array
    {
        $pet = $cita->mascota;
        $vet = $cita->veterinario;
        $servicio = $cita->servicio;

        return [
            'id' => $cita->id_cita,
            'fecha' => $cita->fecha,
            'hora' => $cita->hora,
            'servicioNombre' => $servicio ? $servicio->nombre : ($cita->motivo ?? 'Consulta General'),
            'precio' => (float) ($cita->monto_pago ?? ($pago ? $pago->monto : 0)),
            'monto' => (float) ($cita->monto_pago ?? ($pago ? $pago->monto : 0)),
            'tipo_cobertura' => $pago ? $pago->tipo_cobertura : 'particular',
            'estado' => 'Confirmada',
            'mascota' => $pet ? [
                'id' => $pet->id_mascota,
                'nombre' => $pet->nombre,
                'especie' => $pet->especie,
                'foto' => $pet->foto_mascota ?? 'https://res.cloudinary.com/dedroug6v/image/upload/v1/mascotas/default_pet.jpg',
            ] : null,
            'veterinario' => $vet ? [
                'id' => $vet->id_veterinario,
                'nombre' => $vet->nombre,
                'foto' => $vet->foto_perfil,
            ] : null,
        ];
    }
}
