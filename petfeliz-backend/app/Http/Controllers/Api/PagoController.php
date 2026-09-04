<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Pago;
use Illuminate\Http\Request;

class PagoController extends Controller
{
    /**
     * Listar pagos/facturas del cliente autenticado.
     */
    public function index(Request $request)
    {
        $cliente = $request->user()->cliente;

        if (!$cliente) {
            return response()->json([], 200);
        }

        $pagos = Pago::with(['cita.servicio', 'cita.mascota', 'cita.veterinario'])
            ->where('id_cliente', $cliente->id_cliente)
            ->orderBy('created_at', 'desc')
            ->get();

        $formateados = $pagos->map(function ($pago) {
            $cita = $pago->cita;
            $servicioNombre = $cita && $cita->servicio ? $cita->servicio->nombre : ($cita->motivo ?? 'Servicio Veterinario');

            return [
                'id_pago' => $pago->id_pago,
                'id_cita' => $pago->id_cita,
                'fecha_pago' => $pago->created_at ? $pago->created_at->format('Y-m-d H:i') : null,
                'monto' => (float) $pago->monto,
                'tipo_cobertura' => $pago->tipo_cobertura,
                'metodo_pago' => $pago->metodo_pago,
                'estado' => $pago->estado,
                'referencia_transaccion' => $pago->referencia_transaccion,
                'servicio_nombre' => $servicioNombre,
                'fecha_cita' => $cita ? $cita->fecha : null,
                'hora_cita' => $cita ? $cita->hora : null,
                'mascota' => $cita && $cita->mascota ? [
                    'id' => $cita->mascota->id_mascota,
                    'nombre' => $cita->mascota->nombre,
                    'especie' => $cita->mascota->especie,
                    'foto' => $cita->mascota->foto_mascota ?? 'https://res.cloudinary.com/dedroug6v/image/upload/v1/mascotas/default_pet.jpg',
                ] : null,
                'veterinario' => $cita && $cita->veterinario ? [
                    'id' => $cita->veterinario->id_veterinario,
                    'nombre' => $cita->veterinario->nombre,
                ] : [
                    'id' => 1,
                    'nombre' => 'Dra. Laura Martínez',
                ],
            ];
        });

        return response()->json($formateados, 200);
    }

    /**
     * Detalle de un pago específico para factura/recibo.
     */
    public function show(Request $request, $id)
    {
        $cliente = $request->user()->cliente;

        if (!$cliente) {
            return response()->json(['message' => 'Cliente no encontrado.'], 404);
        }

        $pago = Pago::with(['cita.servicio', 'cita.mascota', 'cita.veterinario', 'cliente.usuario'])
            ->where('id_cliente', $cliente->id_cliente)
            ->where('id_pago', $id)
            ->first();

        if (!$pago) {
            return response()->json(['message' => 'Pago no encontrado.'], 404);
        }

        $cita = $pago->cita;
        $servicioNombre = $cita && $cita->servicio ? $cita->servicio->nombre : ($cita->motivo ?? 'Servicio Veterinario');

        return response()->json([
            'id_pago' => $pago->id_pago,
            'id_cita' => $pago->id_cita,
            'fecha_pago' => $pago->created_at ? $pago->created_at->format('Y-m-d H:i') : null,
            'monto' => (float) $pago->monto,
            'tipo_cobertura' => $pago->tipo_cobertura,
            'metodo_pago' => $pago->metodo_pago,
            'estado' => $pago->estado,
            'referencia_transaccion' => $pago->referencia_transaccion,
            'servicio_nombre' => $servicioNombre,
            'fecha_cita' => $cita ? $cita->fecha : null,
            'hora_cita' => $cita ? $cita->hora : null,
            'cliente_nombre' => $cliente->usuario ? ($cliente->usuario->nombreCompleto ?? $cliente->usuario->nombre) : 'Cliente',
            'mascota' => $cita && $cita->mascota ? [
                'id' => $cita->mascota->id_mascota,
                'nombre' => $cita->mascota->nombre,
                'especie' => $cita->mascota->especie,
                'foto' => $cita->mascota->foto_mascota,
            ] : null,
            'veterinario_nombre' => $cita && $cita->veterinario ? $cita->veterinario->nombre : 'Dra. Laura Martínez',
        ], 200);
    }

    /**
     * Obtener el estado detallado de la afiliación del cliente, beneficios y lista de cuotas pagadas.
     */
    public function afiliacionInfo(Request $request)
    {
        $cliente = $request->user()->cliente;

        if (!$cliente) {
            return response()->json(['message' => 'Cliente no encontrado.'], 404);
        }

        $mascotas = \App\Models\Mascota::where('id_cliente', $cliente->id_cliente)->get();
        $pagosAfiliacion = Pago::where('id_cliente', $cliente->id_cliente)
            ->where(function($q) {
                $q->where('tipo_cobertura', 'afiliacion')
                  ->orWhere('tipo_cobertura', 'eps');
            })
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($pago) {
                return [
                    'id_pago' => $pago->id_pago,
                    'fecha_pago' => $pago->created_at ? $pago->created_at->format('d/m/Y') : null,
                    'monto' => (float) $pago->monto,
                    'metodo_pago' => $pago->metodo_pago,
                    'estado' => $pago->estado,
                    'referencia' => $pago->referencia_transaccion,
                    'concepto' => 'Plan Cobertura Integral EPS PetFeliz',
                ];
            });

        $esAfiliado = (bool) ($cliente->es_afiliado ?? false);
        $codigoAfiliado = 'EPS-PET-' . str_pad($cliente->id_cliente, 5, '0', STR_PAD_LEFT);
        $fechaAfiliacionFormatted = $cliente->fecha_afiliacion ? $cliente->fecha_afiliacion->format('d/m/Y') : null;

        return response()->json([
            'cliente' => [
                'id_cliente' => $cliente->id_cliente,
                'nombre' => $cliente->nombre,
                'cedula' => $cliente->cedula,
                'es_afiliado' => $esAfiliado,
                'codigo_afiliado' => $codigoAfiliado,
                'fecha_afiliacion' => $fechaAfiliacionFormatted,
                'perfil_completo' => $cliente->esPerfilCompleto(),
                'campos_faltantes' => array_values($cliente->getCamposFaltantes()),
            ],
            'plan' => [
                'nombre' => 'Plan Cobertura Integral EPS PetFeliz',
                'precio_mensual' => 69900,
                'beneficios' => [
                    'Consultas veterinarias generales 100% cubiertas ($0 copago)',
                    'Atención médica de Urgencias 24/7 en Laureles, Itagüí y Bello',
                    'Descuentos de afiliado de hasta 40% en cirugías y laboratorio',
                    'Generación y descarga del Certificado Oficial de Afiliación Digital',
                ],
            ],
            'planes' => [
                'individual' => [
                    'nombre' => 'Mascota Individual',
                    'precio_mensual' => 39900,
                    'descripcion' => 'Cobertura completa para 1 mascota registrada.',
                    'beneficios' => [
                        'Consultas veterinarias generales con $0 copago',
                        'Atención de urgencias 24 horas',
                        'Descuentos preferenciales en exámenes y cirugía',
                    ],
                ],
                'familiar' => [
                    'nombre' => 'Grupo Familiar',
                    'precio_mensual' => 69900,
                    'descripcion' => 'Protección integral para todas las mascotas de tu hogar.',
                    'beneficios' => [
                        'Cobertura 100% para todas tus mascotas registradas',
                        'Atención de urgencias 24/7 sin límite de pacientes',
                        'Descuentos máximos de afiliado en todos los servicios',
                    ],
                ],
            ],
            'mascotas' => $mascotas->map(fn($m) => [
                'id' => $m->id_mascota,
                'nombre' => $m->nombre,
                'especie' => $m->especie,
                'raza' => $m->raza,
                'sexo' => $m->sexo,
                'foto' => $m->foto_mascota,
            ]),
            'historial_pagos_afiliacion' => $pagosAfiliacion,
        ], 200);
    }

    /**
     * Procesar la afiliación o renovación mensual del plan EPS.
     */
    public function pagarAfiliacion(Request $request)
    {
        $cliente = $request->user()->cliente;

        if (!$cliente) {
            return response()->json(['message' => 'Cliente no encontrado.'], 404);
        }

        $request->validate([
            'metodo_pago' => 'nullable|string',
            'monto' => 'nullable|numeric',
            'tipo_plan' => 'nullable|string',
        ]);

        $metodoMap = [
            'card' => 'Tarjeta de Crédito / Débito',
            'pse' => 'PSE - Cuenta de Ahorros',
            'nequi' => 'Nequi / Daviplata',
        ];
        $rawMetodo = $request->metodo_pago ?? 'card';
        $metodoFinal = $metodoMap[$rawMetodo] ?? $rawMetodo;

        // Determinar monto: Individual ($39.900) o Familiar ($69.900)
        $monto = 69900;
        if ($request->monto && (int)$request->monto === 39900) {
            $monto = 39900;
        } elseif ($request->tipo_plan === 'individual') {
            $monto = 39900;
        } elseif ($request->monto && (int)$request->monto === 69900) {
            $monto = 69900;
        }

        $referencia = 'TX-AFIL-' . strtoupper(\Illuminate\Support\Str::random(6)) . '-' . time();

        $pago = Pago::create([
            'id_cita' => null,
            'id_cliente' => $cliente->id_cliente,
            'monto' => $monto,
            'tipo_cobertura' => 'afiliacion',
            'metodo_pago' => $metodoFinal,
            'estado' => 'confirmado',
            'referencia_transaccion' => $referencia,
        ]);

        // Activar la afiliación en el cliente y fijar la fecha si aún no la tenía
        $cliente->es_afiliado = true;
        if (empty($cliente->fecha_afiliacion)) {
            $cliente->fecha_afiliacion = date('Y-m-d');
        }
        $cliente->save();

        $nombrePlan = $monto === 39900 ? 'Mascota Individual' : 'Grupo Familiar';

        // Disparar notificaciones dinámicas (Campanita Web + Correo)
        \App\Services\NotificationService::notificar(
            $cliente,
            '¡Afiliación Activa en EPS PetFeliz!',
            "Se confirmó tu pago por $" . number_format($monto, 0, ',', '.') . " COP (Ref: {$referencia}) para el plan {$nombrePlan}. Tu Cobertura Integral EPS se encuentra ACTIVA.",
            'fa-solid fa-shield-halved',
            'afiliacion',
            new \App\Mail\ConfirmacionPagoMail($cliente, [
                'referencia' => $referencia,
                'monto' => $monto,
                'servicio' => "Suscripción Plan EPS PetFeliz ({$nombrePlan})",
                'metodo' => $metodoFinal,
            ])
        );

        \App\Services\NotificationService::notificar(
            $cliente,
            'Comprobante de Afiliación Disponible',
            "Se generó tu recibo electrónico de afiliación. Puedes consultar tu Certificado Digital en el menú Afiliación.",
            'fa-solid fa-file-invoice-dollar',
            'factura',
            new \App\Mail\NuevaFacturaMail($cliente, [
                'id_pago' => $pago->id_pago,
                'referencia' => $referencia,
                'monto' => $monto,
                'servicio' => "Suscripción Plan EPS PetFeliz ({$nombrePlan})",
            ])
        );

        return response()->json([
            'message' => '¡Pago de afiliación procesado con éxito! Tu Cobertura Integral EPS está activa.',
            'pago' => $pago,
            'cliente' => [
                'es_afiliado' => true,
                'fecha_afiliacion' => $cliente->fecha_afiliacion ? $cliente->fecha_afiliacion->format('d/m/Y') : date('d/m/Y'),
            ],
        ], 200);
    }
}
