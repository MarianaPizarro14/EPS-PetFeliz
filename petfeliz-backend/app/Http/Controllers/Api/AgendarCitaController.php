<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Cita;
use App\Models\Pago;
use App\Models\ReservaTemporal;
use App\Models\Servicio;
use App\Models\Veterinario;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class AgendarCitaController extends Controller
{
    /**
     * Listar médicos veterinarios con sus especialidades.
     */
    public function veterinarios(Request $request)
    {
        $vets = Veterinario::with(['usuario'])
            ->get()
            ->map(function ($v) {
                // Calificaciones estáticas equilibradas para demo
                $ratings = [
                    1 => 4.9, 2 => 4.8, 3 => 4.7, 4 => 4.9, 5 => 5.0,
                    6 => 4.8, 7 => 4.6, 8 => 4.9, 9 => 4.8, 10 => 4.7,
                ];

                $especialidades = [
                    1 => 'Medicina General', 2 => 'Medicina General', 3 => 'Medicina General',
                    4 => 'Medicina General', 5 => 'Medicina General', 6 => 'Dermatología',
                    7 => 'Dermatología', 8 => 'Urgencias', 9 => 'Urgencias', 10 => 'Urgencias',
                    11 => 'Desparasitación', 12 => 'Desparasitación', 13 => 'Desparasitación', 14 => 'Vacunación',
                    15 => 'Vacunación', 16 => 'Médico Director', 17 => 'Médico Director', 18 => 'Médico Director',
                    19 => 'Cirugía', 20 => 'Cirugía', 21 => 'Cirugía', 22 => 'Odontología',
                    23 => 'Urgencias', 24 => 'Urgencias', 25 => 'Urgencias', 26 => 'Urgencias', 27 => 'Urgencias',
                    28 => 'Medicina General'
                ];

                return [
                    'id' => $v->id_veterinario,
                    'nombre' => $v->nombre,
                    'especialidad' => $especialidades[$v->id_veterinario] ?? 'Medicina General',
                    'calificacion' => $ratings[$v->id_veterinario] ?? 4.8,
                    'foto' => $v->foto_perfil ?? 'https://res.cloudinary.com/dedroug6v/image/upload/v1782673220/felipe-restrepo_qjvdxd.jpg',
                ];
            });

        return response()->json($vets, 200);
    }

    /**
     * Obtener horarios disponibles para un médico en una fecha específica.
     */
    public function horariosDisponibles(Request $request)
    {
        $request->validate([
            'id_veterinario' => 'required|integer',
            'fecha' => 'required|date',
        ]);

        $idVet = $request->id_veterinario;
        $fecha = $request->fecha;

        // Limpiar reservas temporales expiradas
        ReservaTemporal::where('expires_at', '<', now())->delete();

        // Slots base diarios
        $todosLosSlots = [
            '08:00 AM', '09:00 AM', '10:00 AM', '11:00 AM',
            '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM'
        ];

        // Citas confirmadas / activas en BD
        $citasOcupadas = Cita::where('id_veterinario', $idVet)
            ->where('fecha', $fecha)
            ->where('id_estado', '!=', 3)
            ->pluck('hora')
            ->toArray();

        // Slots con reserva temporal vigente
        $reservasOcupadas = ReservaTemporal::where('id_veterinario', $idVet)
            ->where('fecha', $fecha)
            ->where('expires_at', '>', now())
            ->pluck('hora')
            ->toArray();

        $ocupados = array_unique(array_merge($citasOcupadas, $reservasOcupadas));

        $disponibles = array_values(array_diff($todosLosSlots, $ocupados));

        return response()->json([
            'fecha' => $fecha,
            'id_veterinario' => $idVet,
            'disponibles' => $disponibles,
            'ocupados' => array_values($ocupados),
        ], 200);
    }

    /**
     * Consultar cantidad de cupos disponibles por día en un mes específico para un médico (Ventana de 3 meses).
     */
    public function disponibilidadMes(Request $request)
    {
        $request->validate([
            'id_veterinario' => 'required|integer',
            'mes' => 'required|integer|min:1|max:12',
            'anio' => 'required|integer',
        ]);

        $idVet = (int) $request->id_veterinario;
        $mes = (int) $request->mes;
        $anio = (int) $request->anio;

        // Rango del mes solicitado
        $start = Carbon::createFromDate($anio, $mes, 1)->startOfDay();
        $end = $start->copy()->endOfMonth()->endOfDay();

        // Limpiar reservas temporales expiradas
        ReservaTemporal::where('expires_at', '<', now())->delete();

        // Citas confirmadas / activas del médico en el mes
        $citas = Cita::where('id_veterinario', $idVet)
            ->whereBetween('fecha', [$start->toDateString(), $end->toDateString()])
            ->where('id_estado', '!=', 3)
            ->get(['fecha', 'hora']);

        // Reservas temporales vigentes del médico en el mes
        $reservas = ReservaTemporal::where('id_veterinario', $idVet)
            ->whereBetween('fecha', [$start->toDateString(), $end->toDateString()])
            ->where('expires_at', '>', now())
            ->get(['fecha', 'hora']);

        $ocupadosPorFecha = [];
        foreach ($citas as $c) {
            $ocupadosPorFecha[$c->fecha][] = $c->hora;
        }
        foreach ($reservas as $r) {
            $ocupadosPorFecha[$r->fecha][] = $r->hora;
        }

        $todosLosSlotsCount = 8;
        $todayDate = Carbon::today();
        $disponibilidad = [];

        $daysInMonth = $start->daysInMonth;
        for ($d = 1; $d <= $daysInMonth; $d++) {
            $currentDay = Carbon::createFromDate($anio, $mes, $d)->startOfDay();
            $dateStr = $currentDay->toDateString();

            $isSunday = $currentDay->isSunday();
            $isPast = $currentDay->lt($todayDate);

            if ($isSunday || $isPast) {
                $disponibilidad[$dateStr] = 0;
            } else {
                $ocupados = array_unique($ocupadosPorFecha[$dateStr] ?? []);
                $disponibles = max(0, $todosLosSlotsCount - count($ocupados));
                $disponibilidad[$dateStr] = $disponibles;
            }
        }

        return response()->json([
            'id_veterinario' => $idVet,
            'mes' => $mes,
            'anio' => $anio,
            'disponibilidad' => $disponibilidad,
        ], 200);
    }

    /**
     * Bloquear un slot de médico + fecha + hora por 10 minutos (Reserva Temporal).
     */
    public function reservarSlot(Request $request)
    {
        $request->validate([
            'id_veterinario' => 'required|integer',
            'fecha' => 'required|date',
            'hora' => 'required|string',
        ]);

        $user = $request->user();
        $idVet = $request->id_veterinario;
        $fecha = $request->fecha;
        $hora = $request->hora;

        // Limpiar expiradas
        ReservaTemporal::where('expires_at', '<', now())->delete();

        // 1. Verificar si ya existe cita confirmada en cita table
        $citaExistente = Cita::where('id_veterinario', $idVet)
            ->where('fecha', $fecha)
            ->where('hora', $hora)
            ->where('id_estado', '!=', 3)
            ->exists();

        if ($citaExistente) {
            return response()->json([
                'message' => 'El horario seleccionado ya ha sido reservado por otro usuario. Por favor elige otro horario.',
            ], 409);
        }

        // 2. Verificar si existe reserva temporal vigente de otro usuario
        $reservaExistente = ReservaTemporal::where('id_veterinario', $idVet)
            ->where('fecha', $fecha)
            ->where('hora', $hora)
            ->where('expires_at', '>', now())
            ->where('id_usuario', '!=', $user->id_usuario)
            ->exists();

        if ($reservaExistente) {
            return response()->json([
                'message' => 'El horario seleccionado se encuentra en proceso de pago por otro usuario. Por favor elige otro horario.',
            ], 409);
        }

        // Eliminar reservas anteriores del mismo usuario para esta sesión
        ReservaTemporal::where('id_usuario', $user->id_usuario)->delete();

        $token = Str::random(40);
        $expiresAt = now()->addMinutes(10);

        $reserva = ReservaTemporal::create([
            'id_veterinario' => $idVet,
            'fecha' => $fecha,
            'hora' => $hora,
            'id_usuario' => $user->id_usuario,
            'token_reserva' => $token,
            'expires_at' => $expiresAt,
        ]);

        return response()->json([
            'message' => 'Horario bloqueado temporalmente por 10 minutos.',
            'token_reserva' => $token,
            'expires_at' => $expiresAt->toIso8601String(),
        ], 200);
    }

    /**
     * Liberar la reserva temporal si el usuario cancela.
     */
    public function liberarReserva(Request $request)
    {
        $token = $request->token_reserva;
        if ($token) {
            ReservaTemporal::where('token_reserva', $token)->delete();
        }

        return response()->json(['message' => 'Reserva liberada.'], 200);
    }

    /**
     * Confirmar pago y crear la Cita definitiva en MySQL.
     */
    public function confirmarPago(Request $request)
    {
        $user = $request->user();
        $cliente = $user->cliente;

        if (!$cliente) {
            return response()->json(['message' => 'Cliente no encontrado.'], 404);
        }

        $request->validate([
            'token_reserva' => 'required|string',
            'id_mascota' => 'required|integer',
            'id_servicio' => 'required|integer',
            'metodo_pago' => 'nullable|string',
        ]);

        // Limpiar expiradas
        ReservaTemporal::where('expires_at', '<', now())->delete();

        $reserva = ReservaTemporal::where('token_reserva', $request->token_reserva)->first();

        if (!$reserva) {
            return response()->json([
                'message' => 'El tiempo de reserva ha expirado o el horario ya no está disponible. Por favor selecciona nuevamente tu cita.',
            ], 410);
        }

        // Doble verificación a nivel de base de datos
        $citaExistente = Cita::where('id_veterinario', $reserva->id_veterinario)
            ->where('fecha', $reserva->fecha)
            ->where('hora', $reserva->hora)
            ->where('id_estado', '!=', 3)
            ->exists();

        if ($citaExistente) {
            $reserva->delete();
            return response()->json([
                'message' => 'Disculpas, este horario acaba de ser ocupado. Por favor selecciona otro horario.',
            ], 409);
        }

        $servicio = Servicio::find($request->id_servicio);
        $motivoFinal = $servicio ? $servicio->nombre : 'Consulta General';

        $cita = Cita::create([
            'id_cliente' => $cliente->id_cliente,
            'id_mascota' => $request->id_mascota,
            'id_servicio' => $request->id_servicio,
            'motivo' => $motivoFinal,
            'fecha' => $reserva->fecha,
            'hora' => $reserva->hora,
            'observacion' => $request->observacion ?? 'Pago confirmado en línea',
            'id_estado' => 2, // 2 = Confirmada
            'id_veterinario' => $reserva->id_veterinario,
        ]);

        // Registrar Pago en la tabla `pagos`
        $monto = 70000;
        $tipoCobertura = 'particular';
        if ($servicio) {
            if ($servicio->incluido_en_plan) {
                $monto = 0;
                $tipoCobertura = 'eps';
            } elseif ($servicio->precio_afiliado) {
                $monto = $servicio->precio_afiliado;
                $tipoCobertura = 'copago';
            } else {
                $monto = $servicio->precio_base ?? 70000;
                $tipoCobertura = 'particular';
            }
        }

        $metodoMap = [
          'card' => 'Tarjeta de Crédito / Débito',
          'pse' => 'PSE - Cuenta de Ahorros',
          'nequi' => 'Nequi / Daviplata',
          'eps' => 'Cobertura Plan EPS',
        ];
        $rawMetodo = $request->metodo_pago ?? 'card';
        $metodoFinal = $metodoMap[$rawMetodo] ?? $rawMetodo;

        $pago = Pago::create([
            'id_cita' => $cita->id_cita,
            'id_cliente' => $cliente->id_cliente,
            'monto' => $monto,
            'tipo_cobertura' => $tipoCobertura,
            'metodo_pago' => $metodoFinal,
            'estado' => 'confirmado',
            'referencia_transaccion' => 'TX-' . strtoupper(Str::random(8)) . '-' . time(),
        ]);

        // Eliminar la reserva temporal al confirmar
        $reserva->delete();

        $vet = Veterinario::find($cita->id_veterinario);
        $pet = \App\Models\Mascota::find($cita->id_mascota);

        return response()->json([
            'message' => '¡Cita confirmada y pagada con éxito!',
            'cita' => [
                'id' => $cita->id_cita,
                'fecha' => $cita->fecha,
                'hora' => $cita->hora,
                'servicioNombre' => $motivoFinal,
                'precio' => $servicio ? $servicio->precio_base : '70000',
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
            ],
        ], 201);
    }
}
