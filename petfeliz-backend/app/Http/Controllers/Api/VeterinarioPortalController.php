<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Cita;
use App\Models\Mascota;
use Carbon\Carbon;
use Illuminate\Http\Request;

class VeterinarioPortalController extends Controller
{
    /**
     * Obtener el dashboard y agenda semanal del médico veterinario autenticado.
     */
    public function dashboard(Request $request)
    {
        $user = $request->user();
        $vet = $user->veterinario;

        if (!$vet) {
            return response()->json([
                'message' => 'No se encontró un perfil de médico veterinario asociado a esta cuenta.'
            ], 404);
        }

        $citasQuery = Cita::with(['mascota', 'cliente.usuario', 'servicio', 'estado'])
            ->where('id_veterinario', $vet->id_veterinario)
            ->orderBy('fecha', 'asc')
            ->orderBy('hora', 'asc')
            ->get();

        $citas = $citasQuery->map(function ($c) {
            $horaFmt = date('h:i A', strtotime($c->hora));
            return [
                'id_cita' => $c->id_cita,
                'fecha' => $c->fecha,
                'fecha_formateada' => Carbon::parse($c->fecha)->format('d/m/Y'),
                'hora' => $horaFmt,
                'hora_raw' => $c->hora,
                'motivo' => $c->motivo ?? ($c->servicio->nombre ?? 'Consulta General'),
                'id_estado' => $c->id_estado,
                'estado' => $c->estado->nombre_estado ?? ($c->id_estado == 2 ? 'Atendida' : ($c->id_estado == 3 ? 'Cancelada' : 'Pendiente')),
                'observacion' => $c->observacion ?? '',
                'paciente' => [
                    'id_mascota' => $c->mascota->id_mascota ?? null,
                    'nombre' => $c->mascota->nombre ?? 'Paciente',
                    'especie' => $c->mascota->especie ?? 'Canino',
                    'raza' => $c->mascota->raza ?? 'Criollo',
                    'foto' => $c->mascota->foto_mascota ?? 'https://res.cloudinary.com/dedroug6v/image/upload/v1/mascotas/default_pet.jpg',
                ],
                'dueno' => [
                    'id_cliente' => $c->cliente->id_cliente ?? null,
                    'nombre' => $c->cliente->nombre ?? 'Cliente EPS',
                    'telefono' => $c->cliente->telefono ?? '300 000 0000',
                    'email' => $c->cliente->usuario->email ?? '',
                    'cedula' => $c->cliente->cedula ?? '',
                ],
                'servicio' => [
                    'id_servicio' => $c->servicio->id_servicio ?? null,
                    'nombre' => $c->servicio->nombre ?? 'Consulta General',
                ],
            ];
        });

        // Agrupar citas por fecha para facilitar la vista semanal en el frontend
        $citasPorFecha = $citas->groupBy('fecha');

        // Métricas reales
        $totalCitas = $citas->count();
        $pendientes = $citas->where('id_estado', 1)->count();
        $atendidas = $citas->where('id_estado', 2)->count();
        $pacientesUnicos = $citas->pluck('paciente.id_mascota')->filter()->unique()->count();

        return response()->json([
            'veterinario' => [
                'id_veterinario' => $vet->id_veterinario,
                'nombre' => $vet->nombre,
                'telefono' => $vet->telefono ?? '',
                'numero_tarjeta' => $vet->numero_tarjeta ?? '',
                'foto_perfil' => $vet->foto_perfil ?? null,
                'correo' => $user->email,
            ],
            'stats' => [
                'total_citas' => $totalCitas,
                'pendientes' => $pendientes,
                'atendidas' => $atendidas,
                'pacientes_unicos' => $pacientesUnicos,
            ],
            'citas' => $citas->values(),
            'citas_por_fecha' => $citasPorFecha,
        ], 200);
    }

    /**
     * Obtener el listado único de pacientes (mascotas) asignados/atendidos por el veterinario.
     */
    public function pacientes(Request $request)
    {
        $user = $request->user();
        $vet = $user->veterinario;

        if (!$vet) {
            return response()->json([
                'message' => 'No se encontró un perfil de médico veterinario asociado a esta cuenta.'
            ], 404);
        }

        $mascotas = Mascota::whereHas('citas', function ($q) use ($vet) {
            $q->where('id_veterinario', $vet->id_veterinario);
        })->with(['cliente.usuario', 'citas' => function ($q) use ($vet) {
            $q->where('id_veterinario', $vet->id_veterinario)->orderBy('fecha', 'desc');
        }])->get();

        $pacientes = $mascotas->map(function ($mascota) {
            $ultimaCita = $mascota->citas->first();
            $fechaUltima = $ultimaCita ? Carbon::parse($ultimaCita->fecha)->format('d/m/Y') : 'N/A';

            return [
                'id_mascota' => $mascota->id_mascota,
                'nombre' => $mascota->nombre,
                'especie' => $mascota->especie ?? 'Canino',
                'raza' => $mascota->raza ?? 'Criollo',
                'sexo' => $mascota->sexo ?? 'Macho',
                'alergias' => $mascota->alergias ?? 'Ninguna registrada',
                'foto' => $mascota->foto_mascota ?? 'https://res.cloudinary.com/dedroug6v/image/upload/v1/mascotas/default_pet.jpg',
                'dueno' => $mascota->cliente ? [
                    'id_cliente' => $mascota->cliente->id_cliente,
                    'nombre' => $mascota->cliente->nombre,
                    'telefono' => $mascota->cliente->telefono ?? 'Sin teléfono',
                    'cedula' => $mascota->cliente->cedula ?? '',
                    'email' => $mascota->cliente->usuario->email ?? '',
                ] : null,
                'total_atenciones' => $mascota->citas->count(),
                'ultima_cita' => $fechaUltima,
            ];
        });

        return response()->json([
            'pacientes' => $pacientes->values(),
            'total' => $pacientes->count(),
        ], 200);
    }

    /**
     * Registrar la atención médica de una cita y agregar observaciones clínicas.
     */
    public function atender(Request $request, $id)
    {
        $user = $request->user();
        $vet = $user->veterinario;

        if (!$vet) {
            return response()->json([
                'message' => 'No se encontró un perfil de médico veterinario asociado a esta cuenta.'
            ], 404);
        }

        $cita = Cita::where('id_cita', $id)
            ->where('id_veterinario', $vet->id_veterinario)
            ->firstOrFail();

        $request->validate([
            'observacion' => 'nullable|string|max:1000',
            'id_estado' => 'nullable|integer|in:1,2,3,4',
        ]);

        // Cambiar a estado 2 ("Atendida" / Confirmada) por defecto al registrar atención
        $cita->id_estado = $request->id_estado ?? 2;

        if ($request->has('observacion')) {
            $cita->observacion = trim(strip_tags($request->observacion));
        }

        $cita->save();

        $cita->load(['mascota', 'cliente.usuario', 'servicio', 'estado']);

        return response()->json([
            'message' => 'Atención médica registrada exitosamente.',
            'cita' => [
                'id_cita' => $cita->id_cita,
                'fecha' => $cita->fecha,
                'hora' => date('h:i A', strtotime($cita->hora)),
                'motivo' => $cita->motivo,
                'id_estado' => $cita->id_estado,
                'estado' => $cita->estado->nombre_estado ?? 'Atendida',
                'observacion' => $cita->observacion,
                'paciente' => $cita->mascota->nombre ?? 'Paciente',
                'dueno' => $cita->cliente->nombre ?? 'Cliente',
            ],
        ], 200);
    }
}
