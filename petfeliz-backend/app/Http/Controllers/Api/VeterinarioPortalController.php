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
            $nombreEstado = $c->estado->nombre ?? ($c->id_estado == 4 ? 'Completada' : ($c->id_estado == 2 ? 'Confirmada' : ($c->id_estado == 3 ? 'Cancelada' : 'Pendiente')));
            return [
                'id_cita' => $c->id_cita,
                'fecha' => $c->fecha,
                'fecha_formateada' => Carbon::parse($c->fecha)->format('d/m/Y'),
                'hora' => $horaFmt,
                'hora_raw' => $c->hora,
                'motivo' => $c->motivo ?? ($c->servicio->nombre ?? 'Consulta General'),
                'id_estado' => $c->id_estado,
                'estado' => $nombreEstado,
                'estado_nombre' => $nombreEstado,
                'observacion' => $c->observacion ?? '',
                'paciente' => [
                    'id_mascota' => $c->mascota->id_mascota ?? null,
                    'nombre' => $c->mascota->nombre ?? 'Paciente',
                    'especie' => $c->mascota->especie ?? 'Canino',
                    'raza' => $c->mascota->raza ?? 'Criollo',
                    'foto' => $c->mascota->foto_mascota ?? 'https://res.cloudinary.com/dedroug6v/image/upload/v1/mascotas/default_pet.jpg',
                    'foto_mascota' => $c->mascota->foto_mascota ?? null,
                ],
                'dueno' => [
                    'id_cliente' => $c->cliente->id_cliente ?? null,
                    'nombre' => $c->cliente->nombre ?? 'Cliente EPS',
                    'telefono' => $c->cliente->telefono ?? '300 000 0000',
                    'email' => $c->cliente->usuario->email ?? '',
                    'cedula' => $c->cliente->cedula ?? '',
                ],
                'cliente' => [
                    'id_cliente' => $c->cliente->id_cliente ?? null,
                    'nombre' => $c->cliente->nombre ?? 'Cliente EPS',
                    'telefono' => $c->cliente->telefono ?? '300 000 0000',
                ],
                'servicio' => [
                    'id_servicio' => $c->servicio->id_servicio ?? null,
                    'nombre' => $c->servicio->nombre ?? ($c->motivo ?? 'Consulta General'),
                    'nombre_servicio' => $c->servicio->nombre ?? ($c->motivo ?? 'Consulta General'),
                ],
            ];
        });

        // Agrupar citas por fecha estructuradas para el frontend
        $diasEsp = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
        $agendaSemanal = $citas->groupBy('fecha')->map(function ($items, $fechaKey) use ($diasEsp) {
            $dt = Carbon::parse($fechaKey);
            $diaNom = $diasEsp[$dt->dayOfWeek] . ' ' . $dt->format('d/m/Y');
            return [
                'fecha' => $fechaKey,
                'dia_nombre' => $diaNom,
                'citas' => $items->values(),
            ];
        })->values();

        // Métricas reales
        $totalCitas = $citas->count();
        $pendientes = $citas->whereIn('id_estado', [1, 2])->count();
        $atendidas = $citas->where('id_estado', 4)->count();
        $pacientesUnicos = $citas->pluck('paciente.id_mascota')->filter()->unique()->count();

        return response()->json([
            'veterinario' => [
                'id_veterinario' => $vet->id_veterinario,
                'nombre' => $vet->nombre,
                'telefono' => $vet->telefono ?? '',
                'numero_tarjeta' => $vet->numero_tarjeta ?? '',
                'foto_perfil' => $vet->foto_perfil ?? null,
                'correo' => $user->email,
                'password_temporal' => (bool) ($user->password_temporal ?? false),
            ],
            'stats' => [
                'total_citas' => $totalCitas,
                'pendientes' => $pendientes,
                'atendidas' => $atendidas,
                'pacientes_unicos' => $pacientesUnicos,
            ],
            'citas' => $citas->values(),
            'todas_citas' => $citas->values(),
            'agenda_semanal' => $agendaSemanal,
            'citas_por_fecha' => $citas->groupBy('fecha'),
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

        // Cambiar a estado 4 ("Completada" / Atendida) por defecto al registrar atención clínica
        $cita->id_estado = $request->id_estado ?? 4;

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
                'estado' => $cita->estado->nombre ?? 'Completada',
                'observacion' => $cita->observacion,
                'paciente' => $cita->mascota->nombre ?? 'Paciente',
                'dueno' => $cita->cliente->nombre ?? 'Cliente',
            ],
        ], 200);
    }

    /**
     * Cambiar la contraseña del veterinario desde su propio portal.
     * Valida la contraseña actual o temporal y marca password_temporal = false al guardar.
     */
    public function cambiarPassword(Request $request)
    {
        $user = $request->user();

        if (!$user) {
            return response()->json(['message' => 'Usuario no autenticado.'], 401);
        }

        $request->validate([
            'contrasena_actual' => 'required|string',
            'nueva_contrasena' => 'required|string|min:6',
            'confirmar_nueva_contrasena' => 'required|string|same:nueva_contrasena',
        ], [
            'contrasena_actual.required' => 'Debes ingresar tu contraseña actual o temporal.',
            'nueva_contrasena.required' => 'Debes ingresar la nueva contraseña.',
            'nueva_contrasena.min' => 'La nueva contraseña debe tener al menos 6 caracteres.',
            'confirmar_nueva_contrasena.same' => 'La confirmación de la contraseña no coincide.',
        ]);

        if (!\Illuminate\Support\Facades\Hash::check($request->contrasena_actual, $user->contrasena_hash)) {
            return response()->json([
                'message' => 'La contraseña actual o temporal ingresada es incorrecta.',
            ], 422);
        }

        if (\Illuminate\Support\Facades\Hash::check($request->nueva_contrasena, $user->contrasena_hash)) {
            return response()->json([
                'message' => 'La nueva contraseña no puede ser igual a la clave actual.',
            ], 422);
        }

        $user->contrasena_hash = \Illuminate\Support\Facades\Hash::make($request->nueva_contrasena);
        $user->password_temporal = false;
        $user->save();

        return response()->json([
            'success' => true,
            'message' => 'Contraseña actualizada exitosamente. Tu cuenta cuenta ahora con una clave personalizada.',
            'password_temporal' => false,
        ], 200);
    }
}
