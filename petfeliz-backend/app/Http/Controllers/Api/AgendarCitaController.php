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
                    15 => 'Vacunación', 16 => 'Laboratorio Clínico', 17 => 'Laboratorio Clínico', 18 => 'Médico Director',
                    19 => 'Cirugía', 20 => 'Cirugía', 21 => 'Cirugía', 22 => 'Odontología',
                    23 => 'Urgencias', 24 => 'Urgencias', 25 => 'Urgencias', 26 => 'Urgencias', 27 => 'Urgencias',
                    28 => 'Medicina General'
                ];

                $sedes = [
                    1 => 'Sede Laureles', 2 => 'Sede Envigado', 3 => 'Sede Bello',
                    4 => 'Sede Envigado', 5 => 'Sede Laureles', 6 => 'Sede Laureles · Envigado',
                    7 => 'Sede Bello · Laureles', 8 => 'Todas las sedes', 9 => 'Todas las sedes',
                    10 => 'Todas las sedes', 11 => 'Sede Laureles', 12 => 'Sede Bello',
                    13 => 'Sede Envigado', 14 => 'Sede Laureles · Envigado', 15 => 'Sede Bello',
                    16 => 'Sede Laureles', 17 => 'Sede Bello', 18 => 'Sede Envigado',
                    19 => 'Sede Laureles', 20 => 'Sede Envigado', 21 => 'Sede Bello',
                    22 => 'Sede Laureles', 23 => 'Todas las sedes', 24 => 'Todas las sedes',
                    25 => 'Todas las sedes', 26 => 'Todas las sedes', 27 => 'Todas las sedes',
                    28 => 'Sede Bello'
                ];

                return [
                    'id' => $v->id_veterinario,
                    'nombre' => $v->nombre,
                    'especialidad' => $especialidades[$v->id_veterinario] ?? 'Medicina General',
                    'sede' => $sedes[$v->id_veterinario] ?? 'Sede Laureles',
                    'calificacion' => $ratings[$v->id_veterinario] ?? 4.8,
                    'foto' => $v->foto_perfil ?? null,
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

        // Limpiar reservas temporales (conservando aquellas con referencia de pago hasta 24h)
        ReservaTemporal::limpiarExpiradas();

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
            ->map(function ($h) {
                return date('h:i A', strtotime($h));
            })
            ->toArray();

        // Slots con reserva temporal vigente
        $reservasOcupadas = ReservaTemporal::where('id_veterinario', $idVet)
            ->where('fecha', $fecha)
            ->where('expires_at', '>', now())
            ->where('es_usada', false)
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

        // Limpiar reservas temporales
        ReservaTemporal::limpiarExpiradas();

        // Citas confirmadas / activas del médico en el mes
        $citas = Cita::where('id_veterinario', $idVet)
            ->whereBetween('fecha', [$start->toDateString(), $end->toDateString()])
            ->where('id_estado', '!=', 3)
            ->get(['fecha', 'hora']);

        // Reservas temporales vigentes del médico en el mes
        $reservas = ReservaTemporal::where('id_veterinario', $idVet)
            ->whereBetween('fecha', [$start->toDateString(), $end->toDateString()])
            ->where('expires_at', '>', now())
            ->where('es_usada', false)
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
            'id_veterinario' => 'required|integer|exists:veterinario,id_veterinario',
            'fecha' => 'required|date|after_or_equal:today',
            'hora' => 'required|string',
            'id_servicio' => 'nullable|integer|exists:servicio,id_servicio',
            'id_mascota' => 'nullable|integer|exists:mascota,id_mascota',
            'id_sede' => 'nullable|integer|exists:sede,id_sede',
            'motivo' => 'nullable|string|max:255',
            'referencia_pago' => 'nullable|string|max:100',
        ]);

        $user = $request->user();
        $cliente = $user ? $user->cliente : null;

        // Validar que si se envía mascota, pertenezca al usuario
        if ($request->filled('id_mascota') && $cliente) {
            $mascotaValida = \App\Models\Mascota::where('id_mascota', $request->id_mascota)
                ->where('id_cliente', $cliente->id_cliente)
                ->exists();
            if (!$mascotaValida) {
                return response()->json([
                    'message' => 'No autorizado. La mascota no pertenece al cliente autenticado.',
                ], 403);
            }
        }

        $idVet = $request->id_veterinario;
        $fecha = $request->fecha;
        $hora = $request->hora;
        $horaSql = date('H:i:s', strtotime($hora));

        return \Illuminate\Support\Facades\DB::transaction(function () use ($request, $user, $cliente, $idVet, $fecha, $hora, $horaSql) {
            // Limpiar expiradas
            ReservaTemporal::limpiarExpiradas();

            // 1. Verificar con bloqueo pesimista si ya existe cita confirmada/activa en cita table
            $citaExistente = Cita::where('id_veterinario', $idVet)
                ->where('fecha', $fecha)
                ->where('hora', $horaSql)
                ->where('id_estado', '!=', 3)
                ->lockForUpdate()
                ->exists();

            if ($citaExistente) {
                return response()->json([
                    'message' => 'El horario seleccionado ya ha sido reservado por otro usuario. Por favor elige otro horario.',
                ], 409);
            }

            // 2. Verificar con bloqueo si existe reserva temporal vigente de otro usuario
            $reservaExistente = ReservaTemporal::where('id_veterinario', $idVet)
                ->where('fecha', $fecha)
                ->where('hora', $hora)
                ->where('expires_at', '>', now())
                ->where('id_usuario', '!=', $user->id_usuario)
                ->where('es_usada', false)
                ->lockForUpdate()
                ->exists();

            if ($reservaExistente) {
                return response()->json([
                    'message' => 'El horario seleccionado se encuentra en proceso de pago por otro usuario. Por favor elige otro horario.',
                ], 409);
            }

            // Eliminar reservas anteriores sin referencia del mismo usuario
            ReservaTemporal::where('id_usuario', $user->id_usuario)
                ->whereNull('referencia_pago')
                ->where('es_usada', false)
                ->delete();

            $token = Str::random(40);
            $expiresAt = now()->addMinutes(10);

            $reserva = ReservaTemporal::create([
                'id_veterinario' => $idVet,
                'fecha' => $fecha,
                'hora' => $hora,
                'id_usuario' => $user->id_usuario,
                'id_cliente' => $cliente ? $cliente->id_cliente : null,
                'id_servicio' => $request->id_servicio,
                'id_mascota' => $request->id_mascota,
                'id_sede' => $request->id_sede,
                'motivo' => $request->motivo,
                'referencia_pago' => $request->referencia_pago,
                'token_reserva' => $token,
                'expires_at' => $expiresAt,
            ]);

            return response()->json([
                'message' => 'Horario bloqueado temporalmente por 10 minutos.',
                'token_reserva' => $token,
                'expires_at' => $expiresAt->toIso8601String(),
            ], 200);
        });
    }

    /**
     * Liberar la reserva temporal si el usuario cancela.
     */
    public function liberarReserva(Request $request)
    {
        $token = $request->token_reserva;
        $user = $request->user();

        if ($token && $user) {
            ReservaTemporal::where('token_reserva', $token)
                ->where('id_usuario', $user->id_usuario)
                ->where('es_usada', false)
                ->delete();
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
            'id_mascota' => 'required|integer|exists:mascota,id_mascota',
            'id_servicio' => 'required|integer|exists:servicio,id_servicio',
            'metodo_pago' => 'nullable|string',
        ]);

        $resultado = \App\Services\PaymentAppointmentService::procesarConfirmacion($request->all(), $user);

        return response()->json($resultado, $resultado['code'] ?? 200);
    }
}
