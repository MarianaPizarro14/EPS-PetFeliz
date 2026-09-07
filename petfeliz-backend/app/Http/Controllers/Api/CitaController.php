<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Cita;
use App\Models\EstadoCita;
use App\Models\Mascota;
use App\Models\Servicio;
use Carbon\Carbon;
use Illuminate\Http\Request;

class CitaController extends Controller
{
    /**
     * Listar citas del cliente divididas en Próximas, Pasadas y Canceladas.
     */
    public function index(Request $request)
    {
        $cliente = $request->user()->cliente;

        if (!$cliente) {
            return response()->json([
                'proximas' => [],
                'pasadas' => [],
                'canceladas' => [],
            ], 200);
        }

        $citas = Cita::with(['mascota', 'veterinario', 'estado', 'servicio'])
            ->where('id_cliente', $cliente->id_cliente)
            ->orderBy('fecha', 'asc')
            ->orderBy('hora', 'asc')
            ->get();

        $hoy = Carbon::today()->toDateString();

        $formatear = function ($cita) {
            $estadoStr = 'Pendiente';
            if ($cita->estado) {
                $nombreEst = strtolower($cita->estado->nombre);
                if ($nombreEst === 'confirmada') $estadoStr = 'Confirmada';
                elseif ($nombreEst === 'cancelada') $estadoStr = 'Cancelada';
                elseif ($nombreEst === 'pendiente') $estadoStr = 'Pendiente';
                else $estadoStr = ucfirst($cita->estado->nombre);
            }

            $servicioNombre = $cita->servicio ? $cita->servicio->nombre : ($cita->motivo ?? 'Consulta General');

            return [
                'id' => $cita->id_cita,
                'fecha' => $cita->fecha,
                'hora' => $cita->hora,
                'motivo' => $cita->motivo,
                'servicioNombre' => $servicioNombre,
                'observacion' => $cita->observacion,
                'estado' => $estadoStr,
                'id_estado' => $cita->id_estado,
                'mascota' => $cita->mascota ? [
                    'id' => $cita->mascota->id_mascota,
                    'nombre' => $cita->mascota->nombre,
                    'especie' => $cita->mascota->especie,
                    'foto' => $cita->mascota->foto_mascota ?? 'https://res.cloudinary.com/dedroug6v/image/upload/v1/mascotas/default_pet.jpg',
                ] : null,
                'veterinario' => $cita->veterinario ? [
                    'id' => $cita->veterinario->id_veterinario,
                    'nombre' => $cita->veterinario->nombre,
                    'foto' => $cita->veterinario->foto_perfil,
                ] : [
                    'id' => 1,
                    'nombre' => 'Dra. Laura Martínez',
                    'foto' => null,
                ],
                'servicio' => $cita->servicio ? [
                    'id' => $cita->servicio->id_servicio,
                    'nombre' => $cita->servicio->nombre,
                ] : null,
            ];
        };

        $proximas = [];
        $pasadas = [];
        $canceladas = [];

        foreach ($citas as $c) {
            $formatted = $formatear($c);
            if ($c->id_estado == 3 || strtolower($c->estado?->nombre ?? '') === 'cancelada') {
                $canceladas[] = $formatted;
            } elseif ($c->fecha >= $hoy) {
                $proximas[] = $formatted;
            } else {
                $pasadas[] = $formatted;
            }
        }

        return response()->json([
            'proximas' => array_values($proximas),
            'pasadas' => array_values(array_reverse($pasadas)),
            'canceladas' => array_values($canceladas),
        ], 200);
    }

    /**
     * Crear una nueva cita.
     */
    public function store(Request $request)
    {
        $cliente = $request->user()->cliente;

        if (!$cliente) {
            return response()->json(['message' => 'Cliente no registrado.'], 404);
        }

        $request->validate([
            'id_mascota' => 'required|integer',
            'id_servicio' => 'nullable|integer',
            'motivo' => 'nullable|string|max:200',
            'fecha' => 'required|date',
            'hora' => 'required|string',
            'observacion' => 'nullable|string|max:500',
        ]);

        $servicioNombre = 'Consulta General';
        if ($request->id_servicio) {
            $srv = Servicio::find($request->id_servicio);
            if ($srv) $servicioNombre = $srv->nombre;
        }

        $motivoFinal = $request->motivo ?: $servicioNombre;

        $cita = Cita::create([
            'id_cliente' => $cliente->id_cliente,
            'id_mascota' => $request->id_mascota,
            'id_servicio' => $request->id_servicio,
            'motivo' => $motivoFinal,
            'fecha' => $request->fecha,
            'hora' => date('H:i:s', strtotime($request->hora)),
            'observacion' => $request->observacion,
            'id_estado' => 2, // 2 = Confirmada por defecto
            'id_veterinario' => 1,
        ]);

        return response()->json([
            'message' => 'Cita agendada correctamente.',
            'cita' => $cita,
        ], 201);
    }

    /**
     * Reprogramar la fecha y hora de una cita.
     */
    public function reprogramar(Request $request, $id)
    {
        $cliente = $request->user()->cliente;

        $cita = Cita::where('id_cliente', $cliente->id_cliente)
            ->where('id_cita', $id)
            ->firstOrFail();

        $request->validate([
            'fecha' => 'required|date',
            'hora' => 'required|string',
        ]);

        $cita->fecha = $request->fecha;
        $cita->hora = $request->hora;
        $cita->save();

        $pet = \App\Models\Mascota::find($cita->id_mascota);
        $petNombre = $pet ? $pet->nombre : 'tu mascota';

        \App\Services\NotificationService::notificar(
            $cliente,
            'Cita Reprogramada',
            "La cita para {$petNombre} ha sido reprogramada para el {$cita->fecha} a las {$cita->hora}.",
            'fa-regular fa-clock',
            'cita'
        );

        return response()->json([
            'message' => 'Cita reprogramada exitosamente.',
            'cita' => $cita,
        ], 200);
    }

    /**
     * Cancelar una cita.
     */
    public function cancelar(Request $request, $id)
    {
        $cliente = $request->user()->cliente;

        $cita = Cita::where('id_cliente', $cliente->id_cliente)
            ->where('id_cita', $id)
            ->firstOrFail();

        $cita->id_estado = 3; // 3 = Cancelada
        $cita->save();

        $pet = \App\Models\Mascota::find($cita->id_mascota);
        $petNombre = $pet ? $pet->nombre : 'tu mascota';

        \App\Services\NotificationService::notificar(
            $cliente,
            'Cita Cancelada',
            "La cita para {$petNombre} del {$cita->fecha} ha sido cancelada.",
            'fa-solid fa-calendar-xmark',
            'cita'
        );

        return response()->json([
            'message' => 'La cita ha sido cancelada.',
        ], 200);
    }

    /**
     * Obtener listado de servicios veterinarios activos.
     */
    public function servicios()
    {
        $servicios = Servicio::where('activo', 1)->get();
        if ($servicios->isEmpty()) {
            $defaultServicios = [
                [
                    'id_servicio' => 1,
                    'nombre' => 'Consulta General',
                    'descripcion' => 'Evaluación integral del estado de salud de tu mascota con diagnóstico y plan de tratamiento personalizado.',
                    'precio_base' => 70000,
                    'precio_afiliado' => 0,
                    'incluido_en_plan' => true,
                    'activo' => true,
                ],
                [
                    'id_servicio' => 2,
                    'nombre' => 'Vacunación',
                    'descripcion' => 'Esquema completo de vacunas para perros y gatos según edad, raza y estilo de vida.',
                    'precio_base' => 75000,
                    'precio_afiliado' => 20000,
                    'incluido_en_plan' => true,
                    'activo' => true,
                ],
                [
                    'id_servicio' => 3,
                    'nombre' => 'Desparasitación',
                    'descripcion' => 'Tratamiento interno y externo contra parásitos adaptado al peso, edad y hábitos de tu mascota.',
                    'precio_base' => 55000,
                    'precio_afiliado' => 20000,
                    'incluido_en_plan' => true,
                    'activo' => true,
                ],
                [
                    'id_servicio' => 4,
                    'nombre' => 'Urgencias',
                    'descripcion' => 'Atención médica veterinaria prioritaria y de emergencia 24/7 para estabilización e intervenciones requeridas.',
                    'precio_base' => 120000,
                    'precio_afiliado' => 50000,
                    'incluido_en_plan' => false,
                    'activo' => true,
                ],
                [
                    'id_servicio' => 5,
                    'nombre' => 'Laboratorio Clínico',
                    'descripcion' => 'Análisis de sangre, orina, coprológicos y profilaxis para diagnóstico preciso de patologías.',
                    'precio_base' => 110000,
                    'precio_afiliado' => 45000,
                    'incluido_en_plan' => false,
                    'activo' => true,
                ],
                [
                    'id_servicio' => 6,
                    'nombre' => 'Odontología',
                    'descripcion' => 'Profilaxis dental profesional, extracciones y tratamiento de enfermedades periodontales.',
                    'precio_base' => 180000,
                    'precio_afiliado' => 80000,
                    'incluido_en_plan' => false,
                    'activo' => true,
                ],
                [
                    'id_servicio' => 7,
                    'nombre' => 'Cirugía',
                    'descripcion' => 'Procedimientos quirúrgicos generales y especializados con anestesia inhalada y monitoreo constante.',
                    'precio_base' => 450000,
                    'precio_afiliado' => 200000,
                    'incluido_en_plan' => false,
                    'activo' => true,
                ],
            ];
            return response()->json($defaultServicios, 200);
        }
        return response()->json($servicios, 200);
    }

    /**
     * Historial de servicios prestados a las mascotas del cliente.
     */
    public function historialServicios(Request $request, $id = null)
    {
        $cliente = $request->user()->cliente;

        if (!$cliente) {
            return response()->json([], 200);
        }

        $citas = Cita::with(['mascota', 'veterinario', 'estado', 'servicio'])
            ->where('id_cliente', $cliente->id_cliente)
            ->orderBy('fecha', 'desc')
            ->orderBy('hora', 'desc')
            ->get();

        $historial = $citas->map(function ($cita) {
            $estadoStr = 'Completado';
            if ($cita->estado) {
                $nombreEst = strtolower($cita->estado->nombre);
                if ($nombreEst === 'cancelada') $estadoStr = 'Cancelado';
                elseif ($nombreEst === 'confirmada') $estadoStr = 'Completado';
                elseif ($nombreEst === 'pendiente') $estadoStr = 'Pendiente';
                else $estadoStr = ucfirst($cita->estado->nombre);
            }

            $precio = $cita->servicio ? ($cita->servicio->precio_afiliado ?? $cita->servicio->precio_base ?? 70000) : 70000;

            return [
                'id_cita' => $cita->id_cita,
                'fecha' => $cita->fecha,
                'hora' => $cita->hora,
                'motivo' => $cita->motivo,
                'tipo_servicio' => $cita->servicio ? $cita->servicio->nombre : ($cita->motivo ?? 'Consulta General'),
                'descripcion_servicio' => $cita->servicio ? $cita->servicio->descripcion : null,
                'especialista' => $cita->veterinario ? $cita->veterinario->nombre : 'Dra. Laura Martínez',
                'estado' => $estadoStr,
                'costo' => $precio,
                'id_mascota' => $cita->id_mascota,
                'mascota_nombre' => $cita->mascota ? $cita->mascota->nombre : 'Mascota',
                'mascota_especie' => $cita->mascota ? $cita->mascota->especie : 'Desconocido',
                'mascota_foto' => $cita->mascota ? ($cita->mascota->foto_mascota ?? 'https://res.cloudinary.com/dedroug6v/image/upload/v1/mascotas/default_pet.jpg') : null,
            ];
        });

        return response()->json($historial, 200);
    }
}

