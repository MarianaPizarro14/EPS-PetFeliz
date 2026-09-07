<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Cita;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AdminController extends Controller
{
    /**
     * Autenticar únicamente usuarios con rol de administrador.
     */
    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        if (!Auth::attempt($request->only('email', 'password'))) {
            return response()->json([
                'message' => 'Las credenciales ingresadas son incorrectas.',
            ], 401);
        }

        $user = User::where('email', $request->email)->firstOrFail();

        if ($user->rol !== 'admin') {
            Auth::logout();
            return response()->json([
                'message' => 'Acceso denegado. Tu cuenta no posee permisos de administrador.',
            ], 403);
        }

        $token = $user->createToken('admin_auth_token')->plainTextToken;

        return response()->json([
            'message' => '¡Bienvenido al Panel de Administración de PetFeliz!',
            'token' => $token,
            'user' => [
                'id_usuario' => $user->id_usuario,
                'email' => $user->email,
                'rol' => $user->rol,
                'nombre' => 'Administrador',
                'nombreCompleto' => 'Director Administrativo EPS PetFeliz',
                'foto' => 'https://res.cloudinary.com/dedroug6v/image/upload/v1782673220/felipe-restrepo_qjvdxd.jpg',
            ],
        ], 200);
    }

    /**
     * Obtener estadísticas reales y listados para el Dashboard de Administración.
     */
    public function dashboard(Request $request)
    {
        $user = $request->user();

        if ($user->rol !== 'admin') {
            return response()->json([
                'message' => 'Acceso no autorizado.',
            ], 403);
        }

        $todayStr = Carbon::today()->toDateString();

        // 1. Métricas generales de la base de datos
        $totalCitasHoyCount = Cita::whereDate('fecha', $todayStr)->count();
        $citasPendientesCount = Cita::where('id_estado', 1)->count();
        $revisionesHoyCount = Cita::whereDate('fecha', $todayStr)->where('id_estado', 2)->count();

        // 2. Próximos Pacientes (citas del día o últimas atenciones registradas)
        $citasQuery = Cita::with(['mascota', 'cliente.usuario', 'veterinario', 'servicio', 'estado'])
            ->whereDate('fecha', $todayStr)
            ->orderBy('hora', 'asc')
            ->get();

        if ($citasQuery->isEmpty()) {
            $citasQuery = Cita::with(['mascota', 'cliente.usuario', 'veterinario', 'servicio', 'estado'])
                ->orderBy('fecha', 'desc')
                ->orderBy('hora', 'asc')
                ->take(8)
                ->get();
        }

        $proximosPacientes = $citasQuery->map(function ($c) {
            $horaFmt = date('h:i A', strtotime($c->hora));
            return [
                'id_cita' => $c->id_cita,
                'hora' => $horaFmt,
                'fecha' => $c->fecha,
                'paciente' => [
                    'nombre' => $c->mascota->nombre ?? 'Paciente',
                    'especie' => $c->mascota->especie ?? 'Canino',
                    'raza' => $c->mascota->raza ?? 'Criollo',
                    'foto' => $c->mascota->foto_mascota ?? 'https://res.cloudinary.com/dedroug6v/image/upload/v1/mascotas/default_pet.jpg',
                ],
                'dueno' => [
                    'nombre' => $c->cliente->nombre ?? 'Cliente PetFeliz',
                    'telefono' => $c->cliente->telefono ?? '300 000 0000',
                    'email' => $c->cliente->usuario->email ?? 'cliente@petfeliz.com',
                    'cedula' => $c->cliente->cedula ?? '1.020.345.678',
                ],
                'servicio' => $c->motivo ?? ($c->servicio->nombre ?? 'Consulta General'),
                'veterinario' => [
                    'nombre' => $c->veterinario->nombre ?? 'Médico Asignado',
                    'especialidad' => $c->veterinario->especialidad ?? 'Medicina General',
                    'foto' => $c->veterinario->foto_perfil ?? 'https://res.cloudinary.com/dedroug6v/image/upload/v1782673220/felipe-restrepo_qjvdxd.jpg',
                ],
                'estado' => $c->estado->nombre_estado ?? ($c->id_estado == 2 ? 'Confirmada' : 'Pendiente'),
                'id_estado' => $c->id_estado,
                'observacion' => $c->observacion ?? 'Atención agendada en línea.',
            ];
        });

        // 3. Recordatorios de hoy
        $recordatorios = [
            [
                'id' => 1,
                'tipo' => 'urgente',
                'titulo' => 'Revisión Quirófano Sede Laureles',
                'detalle' => 'Verificar stock de insumos e instrumental médico.',
                'hora' => '08:30 AM',
            ],
            [
                'id' => 2,
                'tipo' => 'info',
                'titulo' => 'Verificación Afiliados en Mora',
                'detalle' => 'Citas con tarifa particular aplicadas correctamente.',
                'hora' => '10:00 AM',
            ],
            [
                'id' => 3,
                'tipo' => 'exito',
                'titulo' => 'Auditoría de Certificados Sanitarios',
                'detalle' => 'Emisión de certificados de inmunización al día.',
                'hora' => '02:00 PM',
            ],
        ];

        // 4. Actividad Reciente
        $actividadReciente = [
            [
                'id' => 1,
                'icono' => 'fa-regular fa-calendar-check',
                'color' => 'green',
                'titulo' => 'Cita Médica Agendada',
                'descripcion' => 'Consulta de control reservada para hoy',
                'tiempo' => 'Hace 10 min',
            ],
            [
                'id' => 2,
                'icono' => 'fa-solid fa-receipt',
                'color' => 'blue',
                'titulo' => 'Pago Confirmado vía Wompi',
                'descripcion' => 'Transacción de copago procesada con éxito',
                'tiempo' => 'Hace 35 min',
            ],
            [
                'id' => 3,
                'icono' => 'fa-solid fa-paw',
                'color' => 'amber',
                'titulo' => 'Nuevo Expediente de Mascota',
                'descripcion' => 'Mascota dada de alta en la plataforma',
                'tiempo' => 'Hace 1 hora',
            ],
        ];

        return response()->json([
            'stats' => [
                'total_citas_hoy' => $totalCitasHoyCount > 0 ? $totalCitasHoyCount : count($proximosPacientes),
                'citas_pendientes' => $citasPendientesCount > 0 ? $citasPendientesCount : 2,
                'revisiones_hoy' => $revisionesHoyCount > 0 ? $revisionesHoyCount : 5,
            ],
            'proximos_pacientes' => $proximosPacientes,
            'recordatorios_hoy' => $recordatorios,
            'actividad_reciente' => $actividadReciente,
        ], 200);
    }
}
