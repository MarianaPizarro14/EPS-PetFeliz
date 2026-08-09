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
}
