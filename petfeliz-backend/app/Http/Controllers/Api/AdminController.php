<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Cita;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

use App\Models\Pago;
use App\Models\Mascota;
use App\Models\Cliente;
use App\Helpers\PhoneHelper;
use App\Services\CloudinaryService;
use App\Models\Veterinario;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

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
                'foto' => null,
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

        $today = Carbon::today();
        $todayStr = $today->toDateString();
        $yesterdayStr = Carbon::yesterday()->toDateString();

        // 1. Métricas generales de la base de datos y tendencias calculadas reales
        $totalCitasHoyCount = Cita::whereDate('fecha', $todayStr)->count();
        $totalCitasAyerCount = Cita::whereDate('fecha', $yesterdayStr)->count();
        
        $citasHoyTrendVal = $totalCitasAyerCount > 0 
            ? round((($totalCitasHoyCount - $totalCitasAyerCount) / $totalCitasAyerCount) * 100, 1) 
            : null;
        $citasHoyTrendText = $citasHoyTrendVal !== null ? ($citasHoyTrendVal >= 0 ? "+{$citasHoyTrendVal}% vs ayer" : "{$citasHoyTrendVal}% vs ayer") : null;

        $citasPendientesCount = Cita::where('id_estado', 1)->count();
        $citasPendientesAyer = Cita::where('id_estado', 1)->whereDate('created_at', '<', $todayStr)->count();
        $pendientesTrendVal = $citasPendientesAyer > 0 
            ? round((($citasPendientesCount - $citasPendientesAyer) / $citasPendientesAyer) * 100, 1)
            : null;
        $pendientesTrendText = $pendientesTrendVal !== null ? ($pendientesTrendVal <= 0 ? "{$pendientesTrendVal}% vs ayer" : "+{$pendientesTrendVal}% vs ayer") : null;

        $revisionesHoyCount = Cita::whereDate('fecha', $todayStr)->where('id_estado', 2)->count();
        $revisionesAyerCount = Cita::whereDate('fecha', $yesterdayStr)->where('id_estado', 2)->count();
        $revisionesTrendVal = $revisionesAyerCount > 0
            ? round((($revisionesHoyCount - $revisionesAyerCount) / $revisionesAyerCount) * 100, 1)
            : null;
        $revisionesTrendText = $revisionesTrendVal !== null ? ($revisionesTrendVal >= 0 ? "+{$revisionesTrendVal}% vs ayer" : "{$revisionesTrendVal}% vs ayer") : null;

        // 2. Tendencia de Citas en los Últimos 14 Días
        $tendenciaCitas = [];
        for ($i = 13; $i >= 0; $i--) {
            $dayDate = Carbon::today()->subDays($i);
            $count = Cita::whereDate('fecha', $dayDate->toDateString())->count();
            $diasSemana = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
            $label = $diasSemana[$dayDate->dayOfWeek] . ' ' . $dayDate->format('d/m');

            $tendenciaCitas[] = [
                'fecha' => $label,
                'iso' => $dayDate->toDateString(),
                'total' => $count,
            ];
        }

        // 3. Distribución de Servicios basada en el Catálogo Clínico de EPS PetFeliz
        $serviciosCatalogo = [
            ['servicio' => 'Consulta Veterinaria General', 'color' => '#059669', 'alias' => ['Consulta General', 'consulta']],
            ['servicio' => 'Vacunación & Desparasitación', 'color' => '#0284c7', 'alias' => ['vacunacion', 'desparasitacion']],
            ['servicio' => 'Urgencias & Cuidados Críticos', 'color' => '#d97706', 'alias' => ['urgencias', 'emergencias']],
            ['servicio' => 'Odontología Veterinaria', 'color' => '#ec4899', 'alias' => ['odontologia']],
            ['servicio' => 'Cirugía Veterinaria', 'color' => '#6366f1', 'alias' => ['cirugia']],
            ['servicio' => 'Exámenes & Diagnóstico', 'color' => '#8b5cf6', 'alias' => ['laboratorio', 'examenes']],
        ];

        $citasPorServicioRaw = DB::table('cita')
            ->leftJoin('servicio', 'cita.id_servicio', '=', 'servicio.id_servicio')
            ->select(DB::raw("COALESCE(servicio.nombre, cita.motivo, 'Consulta Veterinaria General') as nombre_servicio"), DB::raw('count(*) as total'))
            ->groupBy('nombre_servicio')
            ->get();

        $totalCitasGlobal = Cita::count() ?: 0;

        $distribucionServicios = collect($serviciosCatalogo)->map(function ($cat) use ($citasPorServicioRaw, $totalCitasGlobal) {
            $matchedCount = 0;
            foreach ($citasPorServicioRaw as $rawItem) {
                $nameLower = mb_strtolower($rawItem->nombre_servicio);
                $catLower = mb_strtolower($cat['servicio']);
                $isMatch = false;

                if (str_contains($nameLower, 'consulta') || str_contains($catLower, 'consulta')) {
                    if (str_contains($nameLower, 'consulta') && str_contains($catLower, 'consulta')) $isMatch = true;
                }

                if (!$isMatch && str_contains($nameLower, mb_strtolower($cat['servicio']))) {
                    $isMatch = true;
                }

                if (!$isMatch && isset($cat['alias'])) {
                    foreach ($cat['alias'] as $alias) {
                        if (str_contains($nameLower, $alias)) {
                            $isMatch = true;
                            break;
                        }
                    }
                }

                if ($isMatch) {
                    $matchedCount += $rawItem->total;
                }
            }

            $pct = $totalCitasGlobal > 0 ? round(($matchedCount / $totalCitasGlobal) * 100, 1) : 0;

            return [
                'servicio' => $cat['servicio'],
                'total' => $matchedCount,
                'porcentaje' => $pct,
                'color' => $cat['color'],
            ];
        });

        // 4. Transacciones Recientes y Todo el Historial de Pagos para CSV
        $pagosAll = Pago::with(['cliente.usuario'])
            ->orderBy('created_at', 'desc')
            ->get();

        $transaccionesRecientes = $pagosAll->take(10)->map(function ($p) {
            return [
                'id_pago' => $p->id_pago,
                'cliente' => $p->cliente->nombre ?? 'Cliente EPS',
                'email' => $p->cliente->usuario->email ?? 'cliente@petfeliz.com',
                'monto' => (float) $p->monto,
                'monto_formateado' => '$' . number_format($p->monto, 0, ',', '.'),
                'metodo_pago' => ucfirst($p->metodo_pago ?? 'tarjeta'),
                'tipo_cobertura' => strtoupper($p->tipo_cobertura ?? 'EPS'),
                'estado' => $p->estado ?? 'confirmado',
                'referencia' => $p->referencia_transaccion ?? ('PAY-' . $p->id_pago),
                'fecha' => $p->created_at ? $p->created_at->format('d/m/Y h:i A') : date('d/m/Y h:i A'),
            ];
        });

        $historialCompletoPagos = $pagosAll->map(function ($p) {
            return [
                'ID_Pago' => $p->id_pago,
                'Fecha_Hora' => $p->created_at ? $p->created_at->format('Y-m-d H:i:s') : '',
                'Cliente' => $p->cliente->nombre ?? 'Cliente EPS',
                'Monto_COP' => $p->monto,
                'Metodo_Pago' => $p->metodo_pago ?? 'tarjeta',
                'Tipo_Cobertura' => $p->tipo_cobertura ?? 'eps',
                'Estado' => $p->estado ?? 'confirmado',
                'Referencia' => $p->referencia_transaccion ?? '',
            ];
        });

        // 5. Próximos Pacientes (citas del día o últimas atenciones registradas)
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
                    'foto' => $c->veterinario->foto_perfil ?? null,
                ],
                'estado' => $c->estado->nombre ?? ($c->id_estado == 4 ? 'Completada' : ($c->id_estado == 2 ? 'Confirmada' : 'Pendiente')),
                'id_estado' => $c->id_estado,
                'observacion' => $c->observacion ?? '',
            ];
        });

        // 6. Recordatorios reales basados en citas pendientes de hoy
        $citasPendientesHoy = Cita::with(['mascota', 'veterinario'])
            ->whereDate('fecha', $todayStr)
            ->where('id_estado', 1)
            ->take(3)
            ->get();

        $recordatorios = $citasPendientesHoy->map(function ($c) {
            return [
                'id' => $c->id_cita,
                'tipo' => 'urgente',
                'titulo' => 'Cita pendiente por confirmar',
                'detalle' => "Paciente {$c->mascota?->nombre} con Dr(a). {$c->veterinario?->nombre}",
                'hora' => date('h:i A', strtotime($c->hora)),
            ];
        })->values()->toArray();

        // 7. Actividad Reciente real del sistema
        $ultimasCitas = Cita::with(['mascota', 'cliente'])->orderBy('created_at', 'desc')->take(3)->get();
        $ultimosPagos = Pago::with(['cliente'])->orderBy('created_at', 'desc')->take(3)->get();

        $actividades = collect();
        foreach ($ultimasCitas as $c) {
            $actividades->push([
                'id' => 'cita-' . $c->id_cita,
                'icono' => 'fa-regular fa-calendar-check',
                'color' => 'green',
                'titulo' => 'Cita Médica Agendada',
                'descripcion' => "Para " . ($c->mascota?->nombre ?? 'Mascota') . " (" . ($c->motivo ?? 'Consulta') . ")",
                'tiempo' => $c->created_at ? $c->created_at->diffForHumans() : 'Reciente',
                'created_at' => $c->created_at ?? now(),
            ]);
        }
        foreach ($ultimosPagos as $p) {
            $actividades->push([
                'id' => 'pago-' . $p->id_pago,
                'icono' => 'fa-solid fa-receipt',
                'color' => 'blue',
                'titulo' => 'Pago Registrado',
                'descripcion' => "Pago de $" . number_format($p->monto, 0, ',', '.') . " (" . ($p->metodo_pago ?? 'Wompi') . ")",
                'tiempo' => $p->created_at ? $p->created_at->diffForHumans() : 'Reciente',
                'created_at' => $p->created_at ?? now(),
            ]);
        }
        $actividadReciente = $actividades->sortByDesc('created_at')->values()->take(5)->map(function ($item) {
            unset($item['created_at']);
            return $item;
        })->toArray();

        return response()->json([
            'stats' => [
                'total_citas_hoy' => $totalCitasHoyCount,
                'citas_hoy_trend' => $citasHoyTrendText,
                'citas_hoy_trend_positive' => $citasHoyTrendVal !== null ? ($citasHoyTrendVal >= 0) : null,
                'citas_pendientes' => $citasPendientesCount,
                'pendientes_trend' => $pendientesTrendText,
                'pendientes_trend_positive' => $pendientesTrendVal !== null ? ($pendientesTrendVal <= 0) : null,
                'revisiones_hoy' => $revisionesHoyCount,
                'revisiones_trend' => $revisionesTrendText,
                'revisiones_trend_positive' => $revisionesTrendVal !== null ? ($revisionesTrendVal >= 0) : null,
            ],
            'tendencia_citas' => $tendenciaCitas,
            'distribucion_servicios' => $distribucionServicios,
            'transacciones_recientes' => $transaccionesRecientes->values(),
            'historial_completo_pagos' => $historialCompletoPagos->values(),
            'proximos_pacientes' => $proximosPacientes->values(),
            'recordatorios_hoy' => $recordatorios,
            'actividad_reciente' => $actividadReciente,
        ], 200);
    }

    /**
     * Listado completo de citas registradas para la sección /admin/citas.
     */
    public function citas(Request $request)
    {
        $user = $request->user();

        if ($user->rol !== 'admin') {
            return response()->json([
                'message' => 'Acceso no autorizado.',
            ], 403);
        }

        $citasQuery = Cita::with(['mascota', 'cliente.usuario', 'veterinario', 'servicio', 'estado'])
            ->orderBy('fecha', 'desc')
            ->orderBy('hora', 'desc')
            ->get();

        $citas = $citasQuery->map(function ($c) {
            $horaFmt = date('h:i A', strtotime($c->hora));
            return [
                'id_cita' => $c->id_cita,
                'hora' => $horaFmt,
                'hora_raw' => $c->hora,
                'fecha' => $c->fecha,
                'fecha_formateada' => Carbon::parse($c->fecha)->format('d/m/Y'),
                'paciente' => [
                    'id_mascota' => $c->mascota->id_mascota ?? null,
                    'nombre' => $c->mascota->nombre ?? 'Paciente',
                    'especie' => $c->mascota->especie ?? 'Canino',
                    'raza' => $c->mascota->raza ?? 'Criollo',
                    'foto' => $c->mascota->foto_mascota ?? 'https://res.cloudinary.com/dedroug6v/image/upload/v1/mascotas/default_pet.jpg',
                ],
                'dueno' => [
                    'id_cliente' => $c->cliente->id_cliente ?? null,
                    'nombre' => $c->cliente->nombre ?? 'Cliente PetFeliz',
                    'telefono' => $c->cliente->telefono ?? '300 000 0000',
                    'email' => $c->cliente->usuario->email ?? 'cliente@petfeliz.com',
                    'cedula' => $c->cliente->cedula ?? '1.020.345.678',
                ],
                'servicio' => $c->motivo ?? ($c->servicio->nombre ?? 'Consulta General'),
                'veterinario' => [
                    'id_veterinario' => $c->veterinario->id_veterinario ?? null,
                    'nombre' => $c->veterinario->nombre ?? 'Médico Asignado',
                    'especialidad' => $c->veterinario->especialidad ?? 'Medicina General',
                    'foto' => $c->veterinario->foto_perfil ?? null,
                ],
                'estado' => $c->estado->nombre ?? ($c->id_estado == 4 ? 'Completada' : ($c->id_estado == 2 ? 'Confirmada' : ($c->id_estado == 3 ? 'Cancelada' : 'Pendiente'))),
                'id_estado' => $c->id_estado,
                'estado_pago' => $c->estado_pago ?? 'pagado',
                'metodo_pago' => $c->metodo_pago ?? 'Pago en línea',
                'monto_pago' => $c->monto_pago ?? null,
                'observacion' => $c->observacion ?? '',
                'medicamentos' => is_array($c->medicamentos) ? $c->medicamentos : (json_decode($c->medicamentos, true) ?? []),
            ];
        });

        $total = $citas->count();
        $pendientes = $citas->where('id_estado', 1)->count();
        $atendidas = $citas->whereIn('id_estado', [2, 4])->count();
        $canceladas = $citas->where('id_estado', 3)->count();

        return response()->json([
            'citas' => $citas->values(),
            'stats' => [
                'total' => $total,
                'pendientes' => $pendientes,
                'atendidas' => $atendidas,
                'canceladas' => $canceladas,
            ]
        ], 200);
    }

    /**
     * Obtener listado de mascotas para el módulo de Administración.
     */
    public function mascotasIndex(Request $request)
    {
        $mascotas = Mascota::with(['cliente', 'citas.servicio'])->orderBy('id_mascota', 'desc')->get();

        $clientes = Cliente::where(function ($q) {
            $q->whereDoesntHave('usuario')
              ->orWhereHas('usuario', function ($uq) {
                  $uq->where('rol', 'cliente')->orWhereNull('rol');
              });
        })->orderBy('nombre', 'asc')->get(['id_cliente', 'nombre', 'telefono', 'cedula']);

        $formatted = $mascotas->map(function ($mascota) {
            $edadTexto = 'Edad N/A';
            if ($mascota->fecha_nacimiento) {
                $nacimiento = Carbon::parse($mascota->fecha_nacimiento);
                $anios = (int) $nacimiento->diffInYears(Carbon::now());
                if ($anios > 0) {
                    $edadTexto = $anios . ($anios === 1 ? ' Año' : ' Años');
                } else {
                    $meses = (int) $nacimiento->diffInMonths(Carbon::now());
                    $edadTexto = $meses . ($meses === 1 ? ' Mes' : ' Meses');
                }
            }

            $citasList = $mascota->citas;
            $totalCitas = $citasList->count();
            $atendidasCount = $citasList->whereIn('id_estado', [2, 4])->count();
            $urgenciasCount = $citasList->filter(function($c) {
                $motivo = mb_strtolower($c->motivo ?? ($c->servicio->nombre ?? ''));
                return str_contains($motivo, 'urgenc') || str_contains($motivo, 'emergenc');
            })->count();

            $ultimaCita = $citasList->sortByDesc('fecha')->first();
            $ultimaInfo = null;
            if ($ultimaCita) {
                $mot = mb_strtolower($ultimaCita->motivo ?? ($ultimaCita->servicio->nombre ?? ''));
                $esUrgencia = str_contains($mot, 'urgenc') || str_contains($mot, 'emergenc');
                $asistio = ($ultimaCita->id_estado == 2 || $ultimaCita->id_estado == 4);
                $ultimaInfo = [
                    'tipo' => $esUrgencia ? 'Urgencias' : 'Cita Médica',
                    'estado' => $asistio ? 'Asistió' : ($ultimaCita->id_estado == 3 ? 'Cancelada' : 'Pendiente'),
                    'fecha' => $ultimaCita->fecha,
                    'asistio' => $asistio,
                    'es_urgencia' => $esUrgencia,
                ];
            }

            return [
                'id_mascota' => $mascota->id_mascota,
                'nombre' => $mascota->nombre,
                'especie' => $mascota->especie ?? 'Canino',
                'raza' => $mascota->raza ?? 'Criollo',
                'sexo' => $mascota->sexo ?? 'Macho',
                'fecha_nacimiento' => $mascota->fecha_nacimiento,
                'edad' => $edadTexto,
                'peso' => $mascota->peso !== null ? (float) $mascota->peso : null,
                'alergias' => $mascota->alergias ?? 'Ninguna conocida',
                'vacunas' => $mascota->vacunas ? json_decode($mascota->vacunas, true) : [],
                'foto' => $mascota->foto_mascota ?? 'https://res.cloudinary.com/dedroug6v/image/upload/v1/mascotas/default_pet.jpg',
                'id_cliente' => $mascota->id_cliente,
                'dueno' => $mascota->cliente ? [
                    'id_cliente' => $mascota->cliente->id_cliente,
                    'nombre' => $mascota->cliente->nombre ?? 'Cliente N/A',
                    'telefono' => $mascota->cliente->telefono ?? 'Sin Teléfono',
                    'cedula' => $mascota->cliente->cedula ?? '',
                    'es_afiliado' => (bool) ($mascota->cliente->es_afiliado ?? false),
                ] : null,
                'total_citas' => $totalCitas,
                'citas_atendidas' => $atendidasCount,
                'citas_urgencias' => $urgenciasCount,
                'ultima_cita' => $ultimaInfo,
            ];
        });

        $totalMascotas = $formatted->count();
        $caninos = $formatted->where('especie', 'Canino')->count();
        $felinos = $formatted->where('especie', 'Felino')->count();
        $conAlergias = $formatted->filter(function($m) {
            return !empty($m['alergias']) && strtolower($m['alergias']) !== 'ninguna' && strtolower($m['alergias']) !== 'ninguna conocida';
        })->count();

        return response()->json([
            'mascotas' => $formatted->values(),
            'clientes' => $clientes,
            'stats' => [
                'total' => $totalMascotas,
                'caninos' => $caninos,
                'felinos' => $felinos,
                'otros' => $totalMascotas - ($caninos + $felinos),
                'con_alergias' => $conAlergias,
            ]
        ], 200);
    }

    /**
     * Obtener la Ficha Clínica Individual de una mascota.
     */
    public function mascotasShow($id)
    {
        $mascota = Mascota::with(['cliente', 'citas.servicio', 'citas.veterinario', 'citas.estadoCita'])
            ->where('id_mascota', $id)
            ->firstOrFail();

        $edadTexto = 'Edad N/A';
        if ($mascota->fecha_nacimiento) {
            $nacimiento = Carbon::parse($mascota->fecha_nacimiento);
            $anios = (int) $nacimiento->diffInYears(Carbon::now());
            if ($anios > 0) {
                $edadTexto = $anios . ($anios === 1 ? ' Año' : ' Años');
            } else {
                $meses = (int) $nacimiento->diffInMonths(Carbon::now());
                $edadTexto = $meses . ($meses === 1 ? ' Mes' : ' Meses');
            }
        }

        $citasFormateadas = $mascota->citas->map(function ($cita) {
            $fechaCarbon = Carbon::parse($cita->fecha);
            return [
                'id_cita' => $cita->id_cita,
                'fecha' => $cita->fecha,
                'fecha_formateada' => $fechaCarbon->format('d/m/Y'),
                'hora' => Carbon::parse($cita->hora)->format('h:i A'),
                'servicio' => $cita->servicio ? $cita->servicio->nombre : ($cita->motivo ?? 'Consulta General'),
                'veterinario' => $cita->veterinario ? $cita->veterinario->nombre : 'Veterinario Asignado',
                'estado' => $cita->estado ? $cita->estado->nombre : ($cita->id_estado == 4 ? 'Completada' : ($cita->id_estado == 2 ? 'Confirmada' : 'Pendiente')),
                'id_estado' => $cita->id_estado,
                'motivo' => $cita->motivo,
                'observacion' => $cita->observacion,
                'observaciones' => $cita->observacion,
                'medicamentos' => is_array($cita->medicamentos) ? $cita->medicamentos : (json_decode($cita->medicamentos, true) ?? []),
            ];
        });

        $vacunasArray = $mascota->vacunas ? json_decode($mascota->vacunas, true) : null;
        if (!$vacunasArray || !is_array($vacunasArray)) {
            $vacunasArray = [
                ['nombre' => 'Rabia', 'estado' => 'Aplicada', 'fecha' => '2026-01-15'],
                ['nombre' => 'Séxtuple Canina / Triple Felina', 'estado' => 'Aplicada', 'fecha' => '2026-03-10'],
                ['nombre' => 'Parvovirus', 'estado' => 'Pendiente', 'fecha' => '2026-10-20'],
                ['nombre' => 'Desparasitación Interna', 'estado' => 'Aplicada', 'fecha' => '2026-06-01'],
            ];
        }

        return response()->json([
            'id_mascota' => $mascota->id_mascota,
            'nombre' => $mascota->nombre,
            'especie' => $mascota->especie ?? 'Canino',
            'raza' => $mascota->raza ?? 'Criollo',
            'sexo' => $mascota->sexo ?? 'Macho',
            'fecha_nacimiento' => $mascota->fecha_nacimiento,
            'edad' => $edadTexto,
            'peso' => $mascota->peso !== null ? (float) $mascota->peso : null,
            'alergias' => $mascota->alergias ?? 'Ninguna alergia registrada',
            'vacunas' => $vacunasArray,
            'foto' => $mascota->foto_mascota ?? 'https://res.cloudinary.com/dedroug6v/image/upload/v1/mascotas/default_pet.jpg',
            'dueno' => $mascota->cliente ? [
                'id_cliente' => $mascota->cliente->id_cliente,
                'nombre' => $mascota->cliente->nombre,
                'telefono' => $mascota->cliente->telefono,
                'direccion' => $mascota->cliente->direccion,
                'cedula' => $mascota->cliente->cedula,
                'es_afiliado' => (bool) $mascota->cliente->es_afiliado,
            ] : null,
            'citas' => $citasFormateadas,
        ], 200);
    }

    /**
     * Crear una nueva mascota desde el panel de Administración.
     */
    public function mascotasStore(Request $request)
    {
        $request->validate([
            'id_cliente' => 'required|exists:cliente,id_cliente',
            'nombre' => 'required|string|max:100',
            'especie' => 'nullable|string|max:50',
            'raza' => 'nullable|string|max:50',
            'sexo' => 'nullable|string|max:20',
            'fecha_nacimiento' => 'nullable|date',
            'peso' => 'nullable|numeric|min:0',
            'alergias' => 'nullable|string',
            'vacunas' => 'nullable',
            'foto' => 'nullable|image|mimes:jpeg,jpg,png,webp|max:5120',
            'foto_mascota' => 'nullable',
        ]);

        $fotoUrl = is_string($request->foto_mascota) ? $request->foto_mascota : null;

        if ($request->hasFile('foto')) {
            $fotoUrl = CloudinaryService::upload($request->file('foto'), 'mascotas');
        } elseif ($request->hasFile('foto_mascota')) {
            $fotoUrl = CloudinaryService::upload($request->file('foto_mascota'), 'mascotas');
        }

        $vacunasJson = is_array($request->vacunas) ? json_encode($request->vacunas) : (is_string($request->vacunas) ? $request->vacunas : null);

        $mascota = Mascota::create([
            'id_cliente' => $request->id_cliente,
            'nombre' => $request->nombre,
            'especie' => $request->especie ?? 'Canino',
            'raza' => $request->raza ?? 'Criollo',
            'sexo' => $request->sexo ?? 'Macho',
            'fecha_nacimiento' => $request->fecha_nacimiento,
            'peso' => $request->peso,
            'alergias' => $request->alergias,
            'vacunas' => $vacunasJson,
            'foto_mascota' => $fotoUrl,
        ]);

        return response()->json([
            'message' => 'Mascota registrada exitosamente.',
            'mascota' => $mascota,
        ], 201);
    }

    /**
     * Actualizar información de una mascota desde Administración.
     */
    public function mascotasUpdate(Request $request, $id)
    {
        $mascota = Mascota::where('id_mascota', $id)->firstOrFail();

        $request->validate([
            'id_cliente' => 'sometimes|required|exists:cliente,id_cliente',
            'nombre' => 'sometimes|required|string|max:100',
            'especie' => 'nullable|string|max:50',
            'raza' => 'nullable|string|max:50',
            'sexo' => 'nullable|string|max:20',
            'fecha_nacimiento' => 'nullable|date',
            'peso' => 'nullable|numeric|min:0',
            'alergias' => 'nullable|string',
            'vacunas' => 'nullable',
            'foto' => 'nullable|image|mimes:jpeg,jpg,png,webp|max:5120',
            'foto_mascota' => 'nullable',
        ]);

        $data = $request->only([
            'id_cliente',
            'nombre',
            'especie',
            'raza',
            'sexo',
            'fecha_nacimiento',
            'peso',
            'alergias',
        ]);

        if ($request->has('vacunas')) {
            $data['vacunas'] = is_array($request->vacunas) ? json_encode($request->vacunas) : $request->vacunas;
        }

        if ($request->hasFile('foto')) {
            $data['foto_mascota'] = CloudinaryService::upload($request->file('foto'), 'mascotas');
        } elseif ($request->hasFile('foto_mascota')) {
            $data['foto_mascota'] = CloudinaryService::upload($request->file('foto_mascota'), 'mascotas');
        } elseif ($request->has('foto_mascota') && is_string($request->foto_mascota)) {
            $data['foto_mascota'] = $request->foto_mascota;
        }

        $mascota->update($data);

        return response()->json([
            'message' => 'Información de la mascota actualizada correctamente.',
            'mascota' => $mascota,
        ], 200);
    }

    /**
     * Eliminar (soft delete) una mascota desde Administración.
     */
    public function mascotasDestroy($id)
    {
        $mascota = Mascota::where('id_mascota', $id)->firstOrFail();
        $mascota->delete();

        return response()->json([
            'message' => 'Mascota eliminada correctamente.',
        ], 200);
    }

    /**
     * Obtener el listado completo de Veterinarios desde la base de datos real.
     */
    public function veterinariosIndex(Request $request)
    {
        $vetsQuery = Veterinario::with('usuario')->orderBy('id_veterinario', 'asc')->get();

        $formatted = $vetsQuery->map(function ($vet) {
            return [
                'id_veterinario' => $vet->id_veterinario,
                'id_usuario'     => $vet->id_usuario,
                'id_sucursal'    => $vet->id_sucursal ?? 1,
                'nombre'         => $vet->nombre,
                'telefono'       => $vet->telefono ?? '',
                'numero_tarjeta' => $vet->numero_tarjeta ?? '',
                'foto_perfil'    => $vet->foto_perfil ?? null,
                'correo'         => $vet->usuario->email ?? '',
            ];
        });

        $total = $formatted->count();
        $conTarjeta = $formatted->filter(fn($v) => !empty($v['numero_tarjeta']))->count();
        $conTelefono = $formatted->filter(fn($v) => !empty($v['telefono']))->count();
        $conFoto = $formatted->filter(fn($v) => !empty($v['foto_perfil']))->count();

        return response()->json([
            'veterinarios' => $formatted->values(),
            'stats' => [
                'total'        => $total,
                'con_tarjeta'  => $conTarjeta,
                'con_telefono' => $conTelefono,
                'con_foto'     => $conFoto,
            ]
        ], 200);
    }

    /**
     * Obtener el detalle de un veterinario específico.
     */
    public function veterinariosShow($id)
    {
        $vet = Veterinario::with(['usuario', 'citas.mascota', 'citas.cliente'])
            ->where('id_veterinario', $id)
            ->firstOrFail();

        $citasRecientes = $vet->citas ? $vet->citas->take(10)->map(function ($c) {
            return [
                'id_cita' => $c->id_cita,
                'fecha'   => $c->fecha,
                'hora'    => $c->hora,
                'motivo'  => $c->motivo,
                'mascota' => $c->mascota->nombre ?? 'Paciente',
                'cliente' => $c->cliente->nombre ?? 'Cliente',
            ];
        }) : [];

        return response()->json([
            'veterinario' => [
                'id_veterinario' => $vet->id_veterinario,
                'id_usuario'     => $vet->id_usuario,
                'id_sucursal'    => $vet->id_sucursal,
                'nombre'         => $vet->nombre,
                'telefono'       => $vet->telefono ?? '',
                'numero_tarjeta' => $vet->numero_tarjeta ?? '',
                'foto_perfil'    => $vet->foto_perfil ?? null,
                'correo'         => $vet->usuario->email ?? '',
            ],
            'citas_recientes' => $citasRecientes,
        ], 200);
    }

    /**
     * Crear un nuevo veterinario en la base de datos real.
     */
    public function veterinariosStore(Request $request)
    {
        $emailClean = strtolower(trim($request->correo ?? ''));

        // Liberar correo si pertenecía a un usuario huérfano (cuyo veterinario/cliente fue eliminado previamente)
        if (!empty($emailClean)) {
            $orphanUser = User::where('email', $emailClean)->first();
            if ($orphanUser) {
                $hasVet = Veterinario::where('id_usuario', $orphanUser->id_usuario)->exists();
                $hasCliente = Cliente::where('id_usuario', $orphanUser->id_usuario)->exists();
                if (!$hasVet && !$hasCliente) {
                    $orphanUser->tokens()->delete();
                    $orphanUser->delete();
                }
            }
        }

        $request->validate([
            'nombre'         => 'required|string|max:100',
            'correo'         => 'required|email|max:100|unique:usuario,email',
            'telefono'       => [
                'nullable',
                'string',
                'max:30',
                function ($attribute, $value, $fail) {
                    if (!empty($value) && !PhoneHelper::isUniquePhone($value)) {
                        $fail('Este número de teléfono o celular ya se encuentra registrado por otro usuario en el sistema.');
                    }
                },
            ],
            'numero_tarjeta' => 'nullable|string|max:50',
            'foto_perfil'    => 'nullable',
            'foto'           => 'nullable',
        ], [
            'nombre.required' => 'El nombre del veterinario es obligatorio.',
            'correo.required' => 'El correo electrónico es obligatorio.',
            'correo.email'    => 'El correo electrónico no es válido.',
            'correo.unique'   => 'Este correo electrónico ya se encuentra registrado en el sistema por un usuario activo.',
        ]);

        $fotoUrl = null;
        if ($request->hasFile('foto')) {
            $fotoUrl = CloudinaryService::upload($request->file('foto'), 'petfeliz/equipo');
        } elseif ($request->hasFile('foto_perfil')) {
            $fotoUrl = CloudinaryService::upload($request->file('foto_perfil'), 'petfeliz/equipo');
        } elseif ($request->filled('foto_perfil') && is_string($request->foto_perfil)) {
            $rawUrl = trim($request->foto_perfil);
            if (!empty($rawUrl)) {
                if (!str_starts_with($rawUrl, 'http://') && !str_starts_with($rawUrl, 'https://')) {
                    $rawUrl = 'https://' . $rawUrl;
                }
                $fotoUrl = $rawUrl;
            }
        }

        $tempPassword = 'Vet#' . rand(1000, 9999);

        $vet = DB::transaction(function () use ($request, $tempPassword, $emailClean, $fotoUrl) {
            $user = User::create([
                'email'           => $emailClean,
                'contrasena_hash' => Hash::make($tempPassword),
                'rol'             => 'veterinario',
                'activo'          => 1,
            ]);

            return Veterinario::create([
                'id_usuario'     => $user->id_usuario,
                'id_sucursal'    => 1,
                'nombre'         => trim($request->nombre),
                'telefono'       => $request->telefono ? trim($request->telefono) : null,
                'numero_tarjeta' => $request->numero_tarjeta ? trim($request->numero_tarjeta) : null,
                'foto_perfil'    => $fotoUrl,
            ]);
        });

        $vet->load('usuario');

        return response()->json([
            'message'             => 'Veterinario registrado con éxito en el sistema.',
            'contrasena_temporal' => $tempPassword,
            'veterinario'         => [
                'id_veterinario' => $vet->id_veterinario,
                'id_usuario'     => $vet->id_usuario,
                'id_sucursal'    => $vet->id_sucursal,
                'nombre'         => $vet->nombre,
                'telefono'       => $vet->telefono ?? '',
                'numero_tarjeta' => $vet->numero_tarjeta ?? '',
                'foto_perfil'    => $vet->foto_perfil ?? null,
                'correo'         => $vet->usuario->email ?? '',
            ],
        ], 201);
    }

    /**
     * Actualizar datos reales de un veterinario.
     */
    public function veterinariosUpdate(Request $request, $id)
    {
        $vet = Veterinario::with('usuario')->where('id_veterinario', $id)->firstOrFail();

        $userId = $vet->id_usuario;

        $request->validate([
            'nombre'         => 'sometimes|required|string|max:100',
            'correo'         => 'sometimes|required|email|max:100|unique:usuario,email,' . $userId . ',id_usuario',
            'telefono'       => [
                'nullable',
                'string',
                'max:30',
                function ($attribute, $value, $fail) use ($id) {
                    if (!empty($value) && !PhoneHelper::isUniquePhone($value, null, $id)) {
                        $fail('Este número de teléfono o celular ya se encuentra registrado por otro usuario en el sistema.');
                    }
                },
            ],
            'numero_tarjeta' => 'nullable|string|max:50',
            'foto_perfil'    => 'nullable',
            'foto'           => 'nullable',
        ], [
            'nombre.required' => 'El nombre del veterinario es obligatorio.',
            'correo.required' => 'El correo electrónico es obligatorio.',
            'correo.email'    => 'El correo electrónico no es válido.',
            'correo.unique'   => 'Este correo electrónico ya se encuentra registrado por otro usuario.',
        ]);

        $fotoUrl = null;
        $hasFotoParam = false;

        if ($request->hasFile('foto')) {
            $fotoUrl = CloudinaryService::upload($request->file('foto'), 'petfeliz/equipo');
            $hasFotoParam = true;
        } elseif ($request->hasFile('foto_perfil')) {
            $fotoUrl = CloudinaryService::upload($request->file('foto_perfil'), 'petfeliz/equipo');
            $hasFotoParam = true;
        } elseif ($request->has('foto_perfil')) {
            $hasFotoParam = true;
            $rawUrl = is_string($request->foto_perfil) ? trim($request->foto_perfil) : '';
            if (!empty($rawUrl)) {
                if (!str_starts_with($rawUrl, 'http://') && !str_starts_with($rawUrl, 'https://')) {
                    $rawUrl = 'https://' . $rawUrl;
                }
                $fotoUrl = $rawUrl;
            }
        }

        DB::transaction(function () use ($request, $vet, $hasFotoParam, $fotoUrl) {
            $vetData = [];
            if ($request->has('nombre')) $vetData['nombre'] = trim($request->nombre);
            if ($request->has('telefono')) $vetData['telefono'] = $request->telefono ? trim($request->telefono) : null;
            if ($request->has('numero_tarjeta')) $vetData['numero_tarjeta'] = $request->numero_tarjeta ? trim($request->numero_tarjeta) : null;
            if ($hasFotoParam) $vetData['foto_perfil'] = $fotoUrl;

            if (!empty($vetData)) {
                $vet->update($vetData);
            }

            if ($request->has('correo') && $vet->usuario) {
                $vet->usuario->update(['email' => strtolower(trim($request->correo))]);
            }
        });

        $vet->refresh();
        $vet->load('usuario');

        return response()->json([
            'message'     => 'Información del veterinario actualizada con éxito.',
            'veterinario' => [
                'id_veterinario' => $vet->id_veterinario,
                'id_usuario'     => $vet->id_usuario,
                'id_sucursal'    => $vet->id_sucursal,
                'nombre'         => $vet->nombre,
                'telefono'       => $vet->telefono ?? '',
                'numero_tarjeta' => $vet->numero_tarjeta ?? '',
                'foto_perfil'    => $vet->foto_perfil ?? null,
                'correo'         => $vet->usuario->email ?? '',
            ],
        ], 200);
    }

    /**
     * Eliminar un veterinario y su cuenta de usuario asociada de la base de datos real.
     */
    public function veterinariosDestroy($id)
    {
        $vet = Veterinario::with('usuario')->where('id_veterinario', $id)->first();

        if (!$vet) {
            return response()->json([
                'message' => 'El veterinario no fue encontrado en la base de datos.',
            ], 404);
        }

        DB::transaction(function () use ($vet) {
            if ($vet->usuario) {
                // Revocar tokens activos del usuario para cerrar sesión si estaba conectado
                $vet->usuario->tokens()->delete();
                // Eliminar el usuario de la tabla usuario para liberar completamente el correo
                $vet->usuario->delete();
            }
            // Eliminar definitivamente el registro del veterinario
            $vet->forceDelete();
        });

        return response()->json([
            'message' => 'Veterinario y cuenta de usuario eliminados correctamente.',
        ], 200);
    }

    /**
     * Generar / Restablecer la contraseña temporal de un usuario veterinario desde la interfaz de administración.
     * Restricción de seguridad: Solo permite modificar usuarios con rol 'veterinario' (nunca cuentas admin).
     * Genera siempre una clave aleatoria temporal y marca en la base de datos password_temporal = true.
     */
    public function generarPasswordTemporal(Request $request, $id)
    {
        return $this->veterinariosResetPassword($request, $id);
    }

    public function veterinariosResetPassword(Request $request, $id)
    {
        $vet = Veterinario::with('usuario')->where('id_veterinario', $id)->firstOrFail();

        $user = $vet->usuario;
        if (!$user) {
            return response()->json([
                'message' => 'No se encontró una cuenta de usuario activa asociada a este veterinario.'
            ], 404);
        }

        // Restricción de seguridad: El administrador no puede restablecer contraseñas de cuentas con rol de administrador
        if (strtolower(trim($user->rol ?? '')) === 'admin') {
            return response()->json([
                'message' => 'Seguridad: Solo se permite restablecer contraseñas de cuentas con rol de veterinario, no de administradores.'
            ], 403);
        }

        // Asegurar que la cuenta posea el rol de veterinario activo
        if ($user->rol !== 'veterinario') {
            $user->rol = 'veterinario';
        }

        // Generar siempre una contraseña aleatoria temporal
        $nuevaContrasena = 'Vet#' . rand(10000, 99999);

        $user->contrasena_hash = Hash::make($nuevaContrasena);
        $user->password_temporal = true;
        $user->save();

        // Revocar tokens previos por seguridad para forzar inicio de sesión con nueva clave
        $user->tokens()->delete();

        return response()->json([
            'success'             => true,
            'message'             => 'Contraseña temporal del veterinario generada con éxito.',
            'nueva_contrasena'    => $nuevaContrasena,
            'contrasena_temporal' => $nuevaContrasena,
            'password_temporal'   => true,
            'veterinario'         => [
                'id_veterinario' => $vet->id_veterinario,
                'nombre'         => $vet->nombre,
                'correo'         => $user->email,
            ],
        ], 200);
    }

    /**
     * Listado completo de Servicios para Administración.
     */
    public function serviciosIndex(Request $request)
    {
        $servicios = \App\Models\Servicio::orderBy('id_servicio', 'desc')->get();

        $formatted = $servicios->map(function ($s) {
            return [
                'id_servicio' => $s->id_servicio,
                'nombre' => $s->nombre,
                'descripcion' => $s->descripcion ?? '',
                'precio_base' => (float) ($s->precio_base ?? 0),
                'precio_afiliado' => $s->precio_afiliado !== null ? (float) $s->precio_afiliado : null,
                'incluido_en_plan' => (bool) $s->incluido_en_plan,
                'limite_mensual_incluido' => $s->limite_mensual_incluido,
                'activo' => (bool) $s->activo,
            ];
        });

        $total = $formatted->count();
        $activos = $formatted->where('activo', true)->count();
        $inactivos = $formatted->where('activo', false)->count();
        $incluidosPlan = $formatted->where('incluido_en_plan', true)->count();

        return response()->json([
            'servicios' => $formatted->values(),
            'stats' => [
                'total' => $total,
                'activos' => $activos,
                'inactivos' => $inactivos,
                'incluidos_plan' => $incluidosPlan,
            ]
        ], 200);
    }

    /**
     * Obtener el detalle de un servicio específico.
     */
    public function serviciosShow($id)
    {
        $s = \App\Models\Servicio::where('id_servicio', $id)->firstOrFail();

        return response()->json([
            'servicio' => [
                'id_servicio' => $s->id_servicio,
                'nombre' => $s->nombre,
                'descripcion' => $s->descripcion ?? '',
                'precio_base' => (float) ($s->precio_base ?? 0),
                'precio_afiliado' => $s->precio_afiliado !== null ? (float) $s->precio_afiliado : null,
                'incluido_en_plan' => (bool) $s->incluido_en_plan,
                'limite_mensual_incluido' => $s->limite_mensual_incluido,
                'activo' => (bool) $s->activo,
            ]
        ], 200);
    }

    /**
     * Crear un nuevo servicio en el catálogo clínico.
     */
    public function serviciosStore(Request $request)
    {
        $request->validate([
            'nombre' => 'required|string|max:100',
            'descripcion' => 'nullable|string',
            'precio_base' => 'required|numeric|min:0',
            'precio_afiliado' => 'nullable|numeric|min:0',
            'incluido_en_plan' => 'nullable|boolean',
            'limite_mensual_incluido' => 'nullable|integer|min:0',
            'activo' => 'nullable|boolean',
        ]);

        $servicio = \App\Models\Servicio::create([
            'nombre' => trim($request->nombre),
            'descripcion' => $request->descripcion ? trim($request->descripcion) : null,
            'precio_base' => (float) $request->precio_base,
            'precio_afiliado' => $request->filled('precio_afiliado') && $request->precio_afiliado !== null ? (float) $request->precio_afiliado : null,
            'incluido_en_plan' => filter_var($request->incluido_en_plan, FILTER_VALIDATE_BOOLEAN),
            'limite_mensual_incluido' => $request->filled('limite_mensual_incluido') ? (int) $request->limite_mensual_incluido : null,
            'activo' => $request->has('activo') ? filter_var($request->activo, FILTER_VALIDATE_BOOLEAN) : true,
        ]);

        return response()->json([
            'message' => 'Servicio creado exitosamente.',
            'servicio' => $servicio,
        ], 201);
    }

    /**
     * Actualizar la información de un servicio del catálogo.
     */
    public function serviciosUpdate(Request $request, $id)
    {
        $servicio = \App\Models\Servicio::where('id_servicio', $id)->firstOrFail();

        $request->validate([
            'nombre' => 'sometimes|required|string|max:100',
            'descripcion' => 'nullable|string',
            'precio_base' => 'sometimes|required|numeric|min:0',
            'precio_afiliado' => 'nullable|numeric|min:0',
            'incluido_en_plan' => 'nullable|boolean',
            'limite_mensual_incluido' => 'nullable|integer|min:0',
            'activo' => 'nullable|boolean',
        ]);

        if ($request->has('nombre')) $servicio->nombre = trim($request->nombre);
        if ($request->has('descripcion')) $servicio->descripcion = $request->descripcion ? trim($request->descripcion) : null;
        if ($request->has('precio_base')) $servicio->precio_base = (float) $request->precio_base;
        if ($request->has('precio_afiliado')) {
            $servicio->precio_afiliado = ($request->precio_afiliado !== null && $request->precio_afiliado !== '') ? (float) $request->precio_afiliado : null;
        }
        if ($request->has('incluido_en_plan')) $servicio->incluido_en_plan = filter_var($request->incluido_en_plan, FILTER_VALIDATE_BOOLEAN);
        if ($request->has('limite_mensual_incluido')) {
            $servicio->limite_mensual_incluido = ($request->limite_mensual_incluido !== null && $request->limite_mensual_incluido !== '') ? (int) $request->limite_mensual_incluido : null;
        }
        if ($request->has('activo')) $servicio->activo = filter_var($request->activo, FILTER_VALIDATE_BOOLEAN);

        $servicio->save();

        return response()->json([
            'message' => 'Servicio actualizado exitosamente.',
            'servicio' => $servicio,
        ], 200);
    }

    /**
     * Alternar estado activo / inactivo de un servicio.
     */
    public function serviciosToggleActivo($id)
    {
        $servicio = \App\Models\Servicio::where('id_servicio', $id)->firstOrFail();
        $servicio->activo = !$servicio->activo;
        $servicio->save();

        $estadoStr = $servicio->activo ? 'activado' : 'desactivado';

        return response()->json([
            'message' => "Servicio {$estadoStr} exitosamente.",
            'activo' => (bool) $servicio->activo,
        ], 200);
    }

    /**
     * Listado completo de Clientes / Afiliados para Administración.
     */
    public function clientesIndex(Request $request)
    {
        $clientes = Cliente::with(['usuario', 'mascotas', 'citas.servicio'])
            ->where(function ($q) {
                $q->whereDoesntHave('usuario')
                  ->orWhereHas('usuario', function ($uq) {
                      $uq->where('rol', 'cliente')->orWhereNull('rol');
                  });
            })
            ->orderBy('id_cliente', 'desc')
            ->get();

        $formatted = $clientes->map(function ($c) {
            $citasList = $c->citas;
            $mascotasList = $c->mascotas->map(function ($m) {
                return [
                    'id_mascota' => $m->id_mascota,
                    'nombre' => $m->nombre,
                    'especie' => $m->especie ?? 'Canino',
                    'raza' => $m->raza ?? 'Criollo',
                    'foto' => $m->foto_mascota ?? null,
                ];
            });

            return [
                'id_cliente' => $c->id_cliente,
                'id_usuario' => $c->id_usuario,
                'nombre' => $c->nombre,
                'email' => $c->usuario->email ?? 'Sin correo',
                'telefono' => $c->telefono ?? 'Sin teléfono',
                'direccion' => $c->direccion ?? '',
                'cedula' => $c->cedula ?? '',
                'fecha_nacimiento' => $c->fecha_nacimiento,
                'fecha_afiliacion' => $c->fecha_afiliacion ? Carbon::parse($c->fecha_afiliacion)->format('d/m/Y') : null,
                'departamento' => $c->departamento ?? '',
                'ciudad' => $c->ciudad ?? '',
                'contacto_emergencia_nombre' => $c->contacto_emergencia_nombre ?? '',
                'contacto_emergencia_telefono' => $c->contacto_emergencia_telefono ?? '',
                'es_afiliado' => (bool) $c->es_afiliado,
                'estado_afiliacion' => $c->estado_afiliacion,
                'dias_mora' => $c->dias_mora,
                'foto' => $c->foto_perfil ?? 'https://res.cloudinary.com/dedroug6v/image/upload/v1/usuarios/default.jpg',
                'total_mascotas' => $mascotasList->count(),
                'mascotas' => $mascotasList->values(),
                'total_citas' => $citasList->count(),
            ];
        });

        $total = $formatted->count();
        $afiliados = $formatted->where('es_afiliado', true)->where('estado_afiliacion', 'al_dia')->count();
        $enMora = $formatted->where('estado_afiliacion', 'en_mora')->count();
        $desafiliados = $formatted->where('es_afiliado', false)->count();

        return response()->json([
            'clientes' => $formatted->values(),
            'stats' => [
                'total' => $total,
                'afiliados' => $afiliados,
                'en_mora' => $enMora,
                'desafiliados' => $desafiliados,
            ]
        ], 200);
    }

    /**
     * Obtener el perfil completo de un cliente y sus mascotas asociadas.
     */
    public function clientesShow($id)
    {
        $c = Cliente::with(['usuario', 'mascotas.citas', 'citas.servicio', 'citas.veterinario', 'citas.estado'])
            ->where(function ($q) {
                $q->whereDoesntHave('usuario')
                  ->orWhereHas('usuario', function ($uq) {
                      $uq->where('rol', 'cliente')->orWhereNull('rol');
                  });
            })
            ->where('id_cliente', $id)
            ->firstOrFail();

        $mascotasFormateadas = $c->mascotas->map(function ($m) {
            return [
                'id_mascota' => $m->id_mascota,
                'nombre' => $m->nombre,
                'especie' => $m->especie ?? 'Canino',
                'raza' => $m->raza ?? 'Criollo',
                'sexo' => $m->sexo ?? 'Macho',
                'peso' => $m->peso,
                'alergias' => $m->alergias ?? 'Ninguna',
                'foto' => $m->foto_mascota ?? null,
                'total_citas' => $m->citas ? $m->citas->count() : 0,
            ];
        });

        $citasFormateadas = $c->citas->map(function ($cita) {
            return [
                'id_cita' => $cita->id_cita,
                'fecha' => $cita->fecha,
                'fecha_formateada' => Carbon::parse($cita->fecha)->format('d/m/Y'),
                'hora' => Carbon::parse($cita->hora)->format('h:i A'),
                'servicio' => $cita->servicio ? $cita->servicio->nombre : ($cita->motivo ?? 'Consulta General'),
                'veterinario' => $cita->veterinario ? $cita->veterinario->nombre : 'Médico Asignado',
                'estado' => $cita->estado ? $cita->estado->nombre : 'Confirmada',
                'id_estado' => $cita->id_estado,
                'observacion' => $cita->observacion ?? '',
            ];
        });

        return response()->json([
            'cliente' => [
                'id_cliente' => $c->id_cliente,
                'id_usuario' => $c->id_usuario,
                'nombre' => $c->nombre,
                'email' => $c->usuario->email ?? 'Sin correo',
                'telefono' => $c->telefono ?? '',
                'direccion' => $c->direccion ?? '',
                'cedula' => $c->cedula ?? '',
                'fecha_nacimiento' => $c->fecha_nacimiento,
                'fecha_afiliacion' => $c->fecha_afiliacion ? Carbon::parse($c->fecha_afiliacion)->format('d/m/Y') : null,
                'departamento' => $c->departamento ?? '',
                'ciudad' => $c->ciudad ?? '',
                'contacto_emergencia_nombre' => $c->contacto_emergencia_nombre ?? '',
                'contacto_emergencia_telefono' => $c->contacto_emergencia_telefono ?? '',
                'es_afiliado' => (bool) $c->es_afiliado,
                'estado_afiliacion' => $c->estado_afiliacion,
                'dias_mora' => $c->dias_mora,
                'foto' => $c->foto_perfil ?? 'https://res.cloudinary.com/dedroug6v/image/upload/v1/usuarios/default.jpg',
            ],
            'mascotas' => $mascotasFormateadas,
            'citas' => $citasFormateadas,
        ], 200);
    }

    /**
     * Actualizar datos del perfil de cliente desde el panel de Administración.
     */
    public function clientesUpdate(Request $request, $id)
    {
        $cliente = Cliente::where('id_cliente', $id)->firstOrFail();

        $request->validate([
            'nombre' => 'sometimes|required|string|max:150',
            'telefono' => [
                'nullable',
                'string',
                'max:50',
                function ($attribute, $value, $fail) use ($cliente) {
                    if (!empty($value) && !PhoneHelper::isUniquePhone($value, $cliente->id_cliente, null)) {
                        $fail('Este número de teléfono ya se encuentra registrado por otro usuario.');
                    }
                },
            ],
            'direccion' => 'nullable|string|max:200',
            'cedula' => 'nullable|string|max:50',
            'fecha_nacimiento' => 'nullable|date',
            'departamento' => 'nullable|string|max:100',
            'ciudad' => 'nullable|string|max:100',
            'contacto_emergencia_nombre' => 'nullable|string|max:150',
            'contacto_emergencia_telefono' => 'nullable|string|max:50',
            'es_afiliado' => 'nullable|boolean',
        ]);

        if ($request->has('nombre')) $cliente->nombre = trim($request->nombre);
        if ($request->has('telefono')) $cliente->telefono = $request->telefono ? trim($request->telefono) : null;
        if ($request->has('direccion')) $cliente->direccion = $request->direccion ? trim($request->direccion) : null;
        if ($request->has('cedula')) $cliente->cedula = $request->cedula ? trim($request->cedula) : null;
        if ($request->has('fecha_nacimiento')) $cliente->fecha_nacimiento = $request->fecha_nacimiento ?: null;
        if ($request->has('departamento')) $cliente->departamento = $request->departamento ? trim($request->departamento) : null;
        if ($request->has('ciudad')) $cliente->ciudad = $request->ciudad ? trim($request->ciudad) : null;
        if ($request->has('contacto_emergencia_nombre')) $cliente->contacto_emergencia_nombre = $request->contacto_emergencia_nombre ? trim($request->contacto_emergencia_nombre) : null;
        if ($request->has('contacto_emergencia_telefono')) $cliente->contacto_emergencia_telefono = $request->contacto_emergencia_telefono ? trim($request->contacto_emergencia_telefono) : null;
        if ($request->has('es_afiliado')) {
            $nuevoEstadoAfiliado = filter_var($request->es_afiliado, FILTER_VALIDATE_BOOLEAN);
            if ($nuevoEstadoAfiliado && !$cliente->es_afiliado) {
                $cliente->fecha_afiliacion = now();
            }
            $cliente->es_afiliado = $nuevoEstadoAfiliado;
        }

        $cliente->save();

        return response()->json([
            'message' => 'Información del cliente actualizada exitosamente.',
            'cliente' => $cliente,
        ], 200);
    }

    /**
     * Listado de pagos/transacciones para el módulo de Administración de Pagos.
     */
    public function pagosIndex(Request $request)
    {
        $pagosQuery = Pago::with(['cliente.usuario', 'cita.servicio', 'cita.mascota', 'cita.veterinario'])
            ->orderBy('created_at', 'desc')
            ->get();

        $mesActual = now()->month;
        $anioActual = now()->year;

        $totalRecaudado = (float) $pagosQuery->where('estado', 'confirmado')->sum('monto');
        $pagosMesMonto = (float) $pagosQuery->filter(function ($p) use ($mesActual, $anioActual) {
            return strtolower($p->estado) === 'confirmado' &&
                   $p->created_at &&
                   $p->created_at->month === $mesActual &&
                   $p->created_at->year === $anioActual;
        })->sum('monto');

        $pagosMesCantidad = $pagosQuery->filter(function ($p) use ($mesActual, $anioActual) {
            return $p->created_at &&
                   $p->created_at->month === $mesActual &&
                   $p->created_at->year === $anioActual;
        })->count();

        $pagosExitosos = $pagosQuery->where('estado', 'confirmado')->count();
        $pagosRechazados = $pagosQuery->whereIn('estado', ['fallido', 'reembolsado'])->count();

        $pagosFormateados = $pagosQuery->map(function ($pago) {
            $clienteNombre = $pago->cliente ? $pago->cliente->nombre : 'Cliente EPS';
            $clienteEmail = $pago->cliente && $pago->cliente->usuario ? $pago->cliente->usuario->email : 'Sin correo';
            $clienteFoto = $pago->cliente ? ($pago->cliente->foto_perfil ?? null) : null;
            $servicioNombre = $pago->cita && $pago->cita->servicio ? $pago->cita->servicio->nombre : 'Afiliación EPS / Cobertura Plan';
            $mascotaNombre = $pago->cita && $pago->cita->mascota ? $pago->cita->mascota->nombre : null;

            return [
                'id_pago' => $pago->id_pago,
                'id_cliente' => $pago->id_cliente,
                'id_cita' => $pago->id_cita,
                'cliente' => [
                    'id_cliente' => $pago->id_cliente,
                    'nombre' => $clienteNombre,
                    'email' => $clienteEmail,
                    'foto' => $clienteFoto,
                ],
                'servicio' => $servicioNombre,
                'mascota' => $mascotaNombre,
                'monto' => (float) $pago->monto,
                'monto_formateado' => '$' . number_format($pago->monto, 0, ',', '.'),
                'tipo_cobertura' => strtoupper($pago->tipo_cobertura ?? 'EPS'),
                'metodo_pago' => $pago->metodo_pago ?? 'Wompi - Tarjeta',
                'estado' => strtolower($pago->estado ?? 'confirmado'),
                'referencia_transaccion' => $pago->referencia_transaccion ?? ('PAY-' . $pago->id_pago),
                'wompi_transaction_id' => $pago->wompi_transaction_id ?? null,
                'fecha' => $pago->created_at ? $pago->created_at->format('d/m/Y h:i A') : date('d/m/Y h:i A'),
                'fecha_raw' => $pago->created_at ? $pago->created_at->format('Y-m-d') : date('Y-m-d'),
                'url_factura_pdf' => "/api/cliente/documentos/factura/{$pago->id_pago}/pdf",
            ];
        });

        return response()->json([
            'stats' => [
                'total_recaudado' => $totalRecaudado,
                'total_recaudado_formateado' => '$' . number_format($totalRecaudado, 0, ',', '.'),
                'pagos_mes_monto' => $pagosMesMonto,
                'pagos_mes_monto_formateado' => '$' . number_format($pagosMesMonto, 0, ',', '.'),
                'pagos_mes_cantidad' => $pagosMesCantidad,
                'pagos_exitosos' => $pagosExitosos,
                'pagos_rechazados' => $pagosRechazados,
                'total_transacciones' => $pagosQuery->count(),
            ],
            'pagos' => $pagosFormateados,
        ], 200);
    }

    /**
     * Detalle individual de pago.
     */
    public function pagosShow($id)
    {
        $pago = Pago::with(['cliente.usuario', 'cita.servicio', 'cita.mascota', 'cita.veterinario'])
            ->where('id_pago', $id)
            ->firstOrFail();

        $clienteNombre = $pago->cliente ? $pago->cliente->nombre : 'Cliente EPS';
        $clienteEmail = $pago->cliente && $pago->cliente->usuario ? $pago->cliente->usuario->email : 'Sin correo';
        $clienteTelefono = $pago->cliente ? $pago->cliente->telefono : 'Sin teléfono';
        $servicioNombre = $pago->cita && $pago->cita->servicio ? $pago->cita->servicio->nombre : 'Afiliación EPS / Cobertura Plan';

        return response()->json([
            'pago' => [
                'id_pago' => $pago->id_pago,
                'id_cliente' => $pago->id_cliente,
                'id_cita' => $pago->id_cita,
                'cliente' => [
                    'id_cliente' => $pago->id_cliente,
                    'nombre' => $clienteNombre,
                    'email' => $clienteEmail,
                    'telefono' => $clienteTelefono,
                    'foto' => $pago->cliente ? $pago->cliente->foto_perfil : null,
                ],
                'servicio' => $servicioNombre,
                'mascota' => $pago->cita && $pago->cita->mascota ? $pago->cita->mascota->nombre : null,
                'veterinario' => $pago->cita && $pago->cita->veterinario ? $pago->cita->veterinario->nombre : null,
                'monto' => (float) $pago->monto,
                'monto_formateado' => '$' . number_format($pago->monto, 0, ',', '.'),
                'tipo_cobertura' => strtoupper($pago->tipo_cobertura ?? 'EPS'),
                'metodo_pago' => $pago->metodo_pago ?? 'Wompi - Tarjeta',
                'estado' => strtolower($pago->estado ?? 'confirmado'),
                'referencia_transaccion' => $pago->referencia_transaccion ?? ('PAY-' . $pago->id_pago),
                'wompi_transaction_id' => $pago->wompi_transaction_id ?? null,
                'fecha' => $pago->created_at ? $pago->created_at->format('d/m/Y h:i A') : date('d/m/Y h:i A'),
                'url_factura_pdf' => "/api/cliente/documentos/factura/{$pago->id_pago}/pdf",
            ],
        ], 200);
    }

    /**
     * Datos de configuración de la plataforma EPS PetFeliz.
     */
    public function configuracionIndex()
    {
        return response()->json([
            'plataforma' => [
                'nombre' => 'EPS Veterinario PetFeliz Colombia',
                'nit' => '901.458.923-4',
                'email_contacto' => 'contacto@petfeliz.com.co',
                'telefono_soporte' => '+57 (604) 444-8920',
                'direccion' => 'Calle 33 # 74B-12, Medellín, Colombia',
                'horario_atencion' => 'Lunes a Sábado: 7:00 AM - 7:00 PM | Emergencias 24/7',
                'wompi_mode' => 'sandbox',
                'moneda' => 'COP ($)',
            ],
            'nota' => 'La configuración institucional de la EPS está centralizada.',
        ], 200);
    }

    /**
     * Diagnóstico dinámico en tiempo real del estado de integraciones (Wompi, Dompdf, Mail SMTP, DB).
     */
    public function estadoIntegraciones()
    {
        $wompiStatus = $this->checkWompiStatus();
        $pdfStatus = $this->checkPdfStatus();
        $mailStatus = $this->checkMailStatus();
        $dbStatus = $this->checkDbStatus();

        $plataformaGlobal = 'produccion';
        if ($wompiStatus['estado'] === 'sandbox') {
            $plataformaGlobal = 'sandbox';
        } elseif ($wompiStatus['estado'] === 'error' || $pdfStatus['estado'] === 'error' || $mailStatus['estado'] === 'error') {
            $plataformaGlobal = 'atencion';
        }

        return response()->json([
            'timestamp' => now()->toIso8601String(),
            'plataforma_global' => $plataformaGlobal,
            'integraciones' => [
                'wompi' => $wompiStatus,
                'dompdf' => $pdfStatus,
                'mail' => $mailStatus,
                'database' => $dbStatus,
            ],
        ], 200);
    }

    private function checkWompiStatus(): array
    {
        try {
            $pubKey = config('services.wompi.public_key') ?: env('WOMPI_PUBLIC_KEY');
            $integritySecret = config('services.wompi.integrity_secret') ?: env('WOMPI_INTEGRITY_SECRET');
            $apiUrl = config('services.wompi.api_url') ?: env('WOMPI_API_URL', 'https://sandbox.wompi.co/v1');

            if (empty($pubKey) || empty($integritySecret)) {
                return [
                    'estado' => 'error',
                    'badge_color' => 'rojo',
                    'titulo' => 'Wompi No Disponible',
                    'mensaje' => 'Faltan credenciales (WOMPI_PUBLIC_KEY o WOMPI_INTEGRITY_SECRET) en el archivo .env.',
                    'modo' => 'sin_configurar',
                    'icono' => 'fa-solid fa-triangle-exclamation',
                ];
            }

            $isTestKey = str_contains($pubKey, 'pub_test_') || str_contains($apiUrl, 'sandbox');

            // En entorno local omitimos verificación SSL por cacert de Windows local, en producción (Railway) es siempre verificado
            $httpClient = app()->environment('local')
                ? \Illuminate\Support\Facades\Http::withoutVerifying()->timeout(5)
                : \Illuminate\Support\Facades\Http::timeout(5);

            $response = $httpClient->get(rtrim($apiUrl, '/') . "/merchants/{$pubKey}");

            if (!$response->successful()) {
                return [
                    'estado' => 'error',
                    'badge_color' => 'rojo',
                    'titulo' => 'Wompi No Disponible',
                    'mensaje' => "HTTP {$response->status()}: La llave pública no fue aceptada por la API de Wompi o la pasarela no responde.",
                    'modo' => $isTestKey ? 'sandbox' : 'produccion',
                    'icono' => 'fa-solid fa-circle-xmark',
                ];
            }

            if ($isTestKey) {
                return [
                    'estado' => 'sandbox',
                    'badge_color' => 'naranja',
                    'titulo' => 'Wompi Funcionando - Modo Sandbox',
                    'mensaje' => 'Pasarela conectada y respondiendo en entorno de pruebas (Sandbox). Los cobros son de prueba y no generan cargos reales.',
                    'modo' => 'sandbox',
                    'icono' => 'fa-solid fa-vial',
                ];
            }

            return [
                'estado' => 'produccion',
                'badge_color' => 'verde',
                'titulo' => 'Wompi Funcionando - Modo Producción',
                'mensaje' => 'Pasarela conectada y respondiendo en entorno real de producción. Los cobros a tarjetas de crédito y PSE son reales.',
                'modo' => 'produccion',
                'icono' => 'fa-solid fa-circle-check',
            ];
        } catch (\Throwable $e) {
            return [
                'estado' => 'error',
                'badge_color' => 'rojo',
                'titulo' => 'Wompi No Disponible',
                'mensaje' => 'Error al comunicar con la API de Wompi: ' . $e->getMessage(),
                'modo' => 'error',
                'icono' => 'fa-solid fa-plug-circle-xmark',
            ];
        }
    }

    private function checkPdfStatus(): array
    {
        try {
            $hasDompdf = class_exists('Dompdf\Dompdf') || class_exists('Barryvdh\DomPDF\Facade\Pdf');

            if ($hasDompdf) {
                return [
                    'estado' => 'ok',
                    'badge_color' => 'verde',
                    'titulo' => 'Habilitada (Dompdf)',
                    'mensaje' => 'Librería Dompdf cargada correctamente en PHP para emisión de facturas y certificados.',
                    'icono' => 'fa-solid fa-file-pdf',
                ];
            }

            return [
                'estado' => 'error',
                'badge_color' => 'rojo',
                'titulo' => 'Dompdf no disponible',
                'mensaje' => 'Falta el paquete barryvdh/laravel-dompdf o dompdf/dompdf en el servidor PHP.',
                'icono' => 'fa-solid fa-file-circle-xmark',
            ];
        } catch (\Throwable $e) {
            return [
                'estado' => 'unverifiable',
                'badge_color' => 'gris',
                'titulo' => 'Estado no verificable',
                'mensaje' => 'No se pudo diagnosticar la librería PDF.',
                'icono' => 'fa-solid fa-circle-question',
            ];
        }
    }

    private function checkMailStatus(): array
    {
        try {
            $mailer = config('mail.default') ?: env('MAIL_MAILER', 'log');
            $resendKey = env('RESEND_API_KEY');
            $host = env('MAIL_HOST');

            if ($mailer === 'log' || (empty($resendKey) && empty($host))) {
                return [
                    'estado' => 'error',
                    'badge_color' => 'rojo',
                    'titulo' => 'SMTP / Correo sin configurar',
                    'mensaje' => 'El driver de correo está en modo log o faltan credenciales SMTP/Resend en .env.',
                    'icono' => 'fa-solid fa-envelope-circle-check',
                ];
            }

            $queue = config('queue.default', 'sync');

            return [
                'estado' => 'ok',
                'badge_color' => 'verde',
                'titulo' => "SMTP / Queue Habilitado ({$mailer})",
                'mensaje' => "Servicio de notificaciones por correo activo (Driver: {$mailer}, Cola: {$queue}).",
                'icono' => 'fa-solid fa-paper-plane',
            ];
        } catch (\Throwable $e) {
            return [
                'estado' => 'unverifiable',
                'badge_color' => 'gris',
                'titulo' => 'Estado no verificable',
                'mensaje' => 'No se pudo diagnosticar el servicio de correo.',
                'icono' => 'fa-solid fa-circle-question',
            ];
        }
    }

    private function checkDbStatus(): array
    {
        try {
            \Illuminate\Support\Facades\DB::connection()->getPdo();
            return [
                'estado' => 'ok',
                'badge_color' => 'verde',
                'titulo' => 'Base de Datos Conectada',
                'mensaje' => 'Conexión a la base de datos MySQL activa y respondiendo.',
                'icono' => 'fa-solid fa-database',
            ];
        } catch (\Throwable $e) {
            return [
                'estado' => 'error',
                'badge_color' => 'rojo',
                'titulo' => 'Error de Base de Datos',
                'mensaje' => 'No hay conexión con la base de datos: ' . $e->getMessage(),
                'icono' => 'fa-solid fa-database',
            ];
        }
    }

    /**
     * Actualizar datos de perfil del Director Administrativo.
     */
    public function perfilUpdate(Request $request)
    {
        $user = $request->user();

        $request->validate([
            'nombre' => 'required|string|max:150',
            'telefono' => 'nullable|string|max:50',
            'cedula' => 'nullable|string|max:50',
            'foto' => 'nullable|image|mimes:jpeg,jpg,png,webp|max:5120',
        ]);

        $fotoUrl = null;

        if ($user->cliente) {
            $user->cliente->nombre = $request->nombre;
            if ($request->has('telefono')) $user->cliente->telefono = $request->telefono;
            if ($request->has('cedula')) $user->cliente->cedula = $request->cedula;
            if ($request->hasFile('foto')) {
                $user->cliente->foto_perfil = CloudinaryService::upload($request->file('foto'), 'usuarios');
            }
            $user->cliente->save();
            $fotoUrl = $user->cliente->foto_perfil;
        } else {
            $cliente = Cliente::create([
                'id_usuario' => $user->id_usuario,
                'nombre' => $request->nombre,
                'telefono' => $request->telefono ?? '',
                'cedula' => $request->cedula ?? '',
            ]);
            if ($request->hasFile('foto')) {
                $cliente->foto_perfil = CloudinaryService::upload($request->file('foto'), 'usuarios');
                $cliente->save();
            }
            $fotoUrl = $cliente->foto_perfil;
        }

        return response()->json([
            'message' => 'Perfil administrativo actualizado correctamente.',
            'nombre' => $request->nombre,
            'foto_perfil' => $fotoUrl,
        ], 200);
    }

    /**
     * Listado completo de sedes registradas para selectores en administración.
     */
    public function sedesIndex()
    {
        $sedes = \App\Models\Sede::where('activo', 1)->get();
        return response()->json(['sedes' => $sedes], 200);
    }

    /**
     * Listado completo de recepcionistas para el panel de administración.
     */
    public function recepcionistasIndex(Request $request)
    {
        $recepcionistas = \App\Models\Recepcionista::with(['usuario', 'sede'])->get();

        $formatted = $recepcionistas->map(function ($r) {
            return [
                'id_recepcionista' => $r->id_recepcionista,
                'id_usuario' => $r->id_usuario,
                'id_sede' => $r->id_sede,
                'nombre' => $r->nombre,
                'telefono' => $r->telefono ?? '',
                'foto_perfil' => $r->foto_perfil ?? null,
                'correo' => $r->usuario->email ?? '',
                'activo' => (bool) ($r->usuario->activo ?? true),
                'password_temporal' => (bool) ($r->usuario->password_temporal ?? false),
                'sede_nombre' => $r->sede->nombre ?? 'Sin Sede Asignada',
            ];
        });

        $total = $formatted->count();
        $activos = $formatted->where('activo', true)->count();
        $inactivos = $formatted->where('activo', false)->count();

        return response()->json([
            'recepcionistas' => $formatted->values(),
            'stats' => [
                'total' => $total,
                'activos' => $activos,
                'inactivos' => $inactivos,
            ]
        ], 200);
    }

    /**
     * Detalle individual de un recepcionista.
     */
    public function recepcionistasShow($id)
    {
        $r = \App\Models\Recepcionista::with(['usuario', 'sede'])->where('id_recepcionista', $id)->firstOrFail();

        return response()->json([
            'recepcionista' => [
                'id_recepcionista' => $r->id_recepcionista,
                'id_usuario' => $r->id_usuario,
                'id_sede' => $r->id_sede,
                'nombre' => $r->nombre,
                'telefono' => $r->telefono ?? '',
                'foto_perfil' => $r->foto_perfil ?? null,
                'correo' => $r->usuario->email ?? '',
                'activo' => (bool) ($r->usuario->activo ?? true),
                'password_temporal' => (bool) ($r->usuario->password_temporal ?? false),
                'sede_nombre' => $r->sede->nombre ?? 'Sin Sede Asignada',
            ]
        ], 200);
    }

    /**
     * Crear un nuevo recepcionista desde el panel de administración.
     */
    public function recepcionistasStore(Request $request)
    {
        $emailClean = strtolower(trim($request->correo ?? ''));

        if (!empty($emailClean)) {
            $orphanUser = User::where('email', $emailClean)->first();
            if ($orphanUser) {
                $hasVet = Veterinario::where('id_usuario', $orphanUser->id_usuario)->exists();
                $hasCliente = Cliente::where('id_usuario', $orphanUser->id_usuario)->exists();
                $hasRecep = \App\Models\Recepcionista::where('id_usuario', $orphanUser->id_usuario)->exists();
                if (!$hasVet && !$hasCliente && !$hasRecep) {
                    $orphanUser->tokens()->delete();
                    $orphanUser->delete();
                }
            }
        }

        $request->validate([
            'nombre' => 'required|string|max:150',
            'correo' => 'required|email|max:100|unique:usuario,email',
            'id_sede' => 'required|exists:sede,id_sede',
            'telefono' => 'nullable|string|max:30',
            'foto' => 'nullable|file|image|mimes:jpeg,jpg,png,webp|max:5120',
            'foto_perfil' => 'nullable',
        ], [
            'nombre.required' => 'El nombre del recepcionista es obligatorio.',
            'correo.required' => 'El correo electrónico es obligatorio.',
            'correo.email' => 'El correo electrónico no es válido.',
            'correo.unique' => 'Este correo electrónico ya se encuentra registrado.',
            'id_sede.required' => 'Debes seleccionar una sede.',
            'id_sede.exists' => 'La sede seleccionada no es válida.',
        ]);

        $fotoUrl = null;
        if ($request->hasFile('foto')) {
            $fotoUrl = CloudinaryService::upload($request->file('foto'), 'petfeliz/equipo');
        } elseif ($request->hasFile('foto_perfil')) {
            $fotoUrl = CloudinaryService::upload($request->file('foto_perfil'), 'petfeliz/equipo');
        } elseif ($request->filled('foto_perfil') && is_string($request->foto_perfil)) {
            $rawUrl = trim($request->foto_perfil);
            if (!empty($rawUrl)) {
                if (!str_starts_with($rawUrl, 'http://') && !str_starts_with($rawUrl, 'https://')) {
                    $rawUrl = 'https://' . $rawUrl;
                }
                $fotoUrl = $rawUrl;
            }
        }

        $tempPassword = 'Recep#' . rand(1000, 9999);

        $recep = DB::transaction(function () use ($request, $tempPassword, $emailClean, $fotoUrl) {
            $user = User::create([
                'email' => $emailClean,
                'contrasena_hash' => Hash::make($tempPassword),
                'rol' => 'recepcionista',
                'activo' => 1,
                'password_temporal' => true,
            ]);

            return \App\Models\Recepcionista::create([
                'id_usuario' => $user->id_usuario,
                'id_sede' => $request->id_sede,
                'nombre' => trim($request->nombre),
                'telefono' => $request->telefono ? trim($request->telefono) : null,
                'foto_perfil' => $fotoUrl,
            ]);
        });

        $recep->load(['usuario', 'sede']);

        return response()->json([
            'message' => 'Recepcionista creado con éxito.',
            'contrasena_temporal' => $tempPassword,
            'recepcionista' => [
                'id_recepcionista' => $recep->id_recepcionista,
                'id_usuario' => $recep->id_usuario,
                'id_sede' => $recep->id_sede,
                'nombre' => $recep->nombre,
                'telefono' => $recep->telefono ?? '',
                'foto_perfil' => $recep->foto_perfil ?? null,
                'correo' => $recep->usuario->email ?? '',
                'sede_nombre' => $recep->sede->nombre ?? '',
            ],
        ], 201);
    }

    /**
     * Actualizar recepcionista desde el panel de administración.
     */
    public function recepcionistasUpdate(Request $request, $id)
    {
        $recep = \App\Models\Recepcionista::with('usuario')->where('id_recepcionista', $id)->firstOrFail();
        $userId = $recep->id_usuario;

        $request->validate([
            'nombre' => 'sometimes|required|string|max:150',
            'correo' => 'sometimes|required|email|max:100|unique:usuario,email,' . $userId . ',id_usuario',
            'id_sede' => 'sometimes|required|exists:sede,id_sede',
            'telefono' => 'nullable|string|max:30',
            'foto' => 'nullable|file|image|mimes:jpeg,jpg,png,webp|max:5120',
            'foto_perfil' => 'nullable',
        ]);

        $fotoUrl = null;
        $hasFotoParam = false;

        if ($request->hasFile('foto')) {
            $fotoUrl = CloudinaryService::upload($request->file('foto'), 'petfeliz/equipo');
            $hasFotoParam = true;
        } elseif ($request->hasFile('foto_perfil')) {
            $fotoUrl = CloudinaryService::upload($request->file('foto_perfil'), 'petfeliz/equipo');
            $hasFotoParam = true;
        } elseif ($request->has('foto_perfil')) {
            $hasFotoParam = true;
            $rawUrl = is_string($request->foto_perfil) ? trim($request->foto_perfil) : '';
            if (!empty($rawUrl)) {
                if (!str_starts_with($rawUrl, 'http://') && !str_starts_with($rawUrl, 'https://')) {
                    $rawUrl = 'https://' . $rawUrl;
                }
                $fotoUrl = $rawUrl;
            }
        }

        DB::transaction(function () use ($request, $recep, $hasFotoParam, $fotoUrl) {
            $rData = [];
            if ($request->has('nombre')) $rData['nombre'] = trim($request->nombre);
            if ($request->has('id_sede')) $rData['id_sede'] = $request->id_sede;
            if ($request->has('telefono')) $rData['telefono'] = $request->telefono ? trim($request->telefono) : null;
            if ($hasFotoParam) $rData['foto_perfil'] = $fotoUrl;

            if (!empty($rData)) {
                $recep->update($rData);
            }

            if ($request->has('correo') && $recep->usuario) {
                $recep->usuario->update(['email' => strtolower(trim($request->correo))]);
            }
        });

        $recep->refresh();
        $recep->load(['usuario', 'sede']);

        return response()->json([
            'message' => 'Información del recepcionista actualizada con éxito.',
            'recepcionista' => [
                'id_recepcionista' => $recep->id_recepcionista,
                'id_usuario' => $recep->id_usuario,
                'id_sede' => $recep->id_sede,
                'nombre' => $recep->nombre,
                'telefono' => $recep->telefono ?? '',
                'foto_perfil' => $recep->foto_perfil ?? null,
                'correo' => $recep->usuario->email ?? '',
                'sede_nombre' => $recep->sede->nombre ?? '',
            ],
        ], 200);
    }

    /**
     * Alternar estado activo/inactivo de un recepcionista.
     */
    public function recepcionistasToggleActivo($id)
    {
        $recep = \App\Models\Recepcionista::with('usuario')->where('id_recepcionista', $id)->firstOrFail();
        $user = $recep->usuario;

        if ($user) {
            $user->activo = !$user->activo;
            $user->save();
            $estadoStr = $user->activo ? 'activada' : 'desactivada';
        } else {
            $estadoStr = 'actualizada';
        }

        return response()->json([
            'message' => "Cuenta de recepcionista {$estadoStr} exitosamente.",
            'activo' => $user ? (bool) $user->activo : true,
        ], 200);
    }

    /**
     * Restablecer contraseña temporal de un recepcionista.
     */
    public function recepcionistasResetPassword(Request $request, $id)
    {
        $recep = \App\Models\Recepcionista::with('usuario')->where('id_recepcionista', $id)->firstOrFail();
        $user = $recep->usuario;

        if (!$user) {
            return response()->json(['message' => 'No se encontró una cuenta de usuario activa.'], 404);
        }

        $nuevaContrasena = 'Recep#' . rand(10000, 99999);
        $user->contrasena_hash = Hash::make($nuevaContrasena);
        $user->password_temporal = true;
        $user->save();
        $user->tokens()->delete();

        return response()->json([
            'success' => true,
            'message' => 'Contraseña temporal generada con éxito.',
            'nueva_contrasena' => $nuevaContrasena,
            'contrasena_temporal' => $nuevaContrasena,
            'password_temporal' => true,
            'recepcionista' => [
                'id_recepcionista' => $recep->id_recepcionista,
                'nombre' => $recep->nombre,
                'correo' => $user->email,
            ],
        ], 200);
    }
}


