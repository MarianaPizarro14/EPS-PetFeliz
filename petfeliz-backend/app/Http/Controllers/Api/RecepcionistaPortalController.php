<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Cita;
use App\Models\Cliente;
use App\Models\Mascota;
use App\Models\Notificacion;
use App\Models\Pago;
use App\Models\Recepcionista;
use App\Models\ReservaTemporal;
use App\Models\Sede;
use App\Models\User;
use App\Models\Veterinario;
use App\Services\CloudinaryService;
use Barryvdh\DomPDF\Facade\Pdf;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class RecepcionistaPortalController extends Controller
{
    /**
     * Obtener la ID de la sede asignada al recepcionista autenticado.
     */
    private function getSedeId(Request $request): ?int
    {
        $recep = $request->user()->recepcionista;
        return $recep ? $recep->id_sede : null;
    }

    /**
     * Verificar si la cita pertenece a la misma sede del recepcionista autenticado.
     */
    private function checkSedeAccess(Request $request, Cita $cita): bool
    {
        $idSedeRecep = $this->getSedeId($request);
        if (!$idSedeRecep) return true;
        if (!$cita->id_sede) return (int) $idSedeRecep === 1; // Citas antiguas sin sede (NULL) sólo accesibles en Laureles (id_sede = 1)
        return (int) $cita->id_sede === (int) $idSedeRecep;
    }

    /**
     * Dashboard de recepción: métricas operativas del día y agenda de hoy filtrada por sede.
     */
    public function dashboard(Request $request)
    {
        $user = $request->user();
        $recep = $user->recepcionista;
        $idSede = $this->getSedeId($request);
        $sedeNombre = $recep && $recep->sede ? $recep->sede->nombre : 'Sede Principal Laureles';

        $hoy = Carbon::today()->format('Y-m-d');

        // Consultar citas de hoy para la sede del recepcionista
        $citasHoyQuery = Cita::with(['mascota', 'cliente.usuario', 'servicio', 'estado', 'veterinario', 'sede'])
            ->whereDate('fecha', $hoy);

        if ($idSede) {
            $citasHoyQuery->where(function ($q) use ($idSede) {
                $q->where('id_sede', $idSede);
                if ((int) $idSede === 1) $q->orWhereNull('id_sede');
            });
        }

        $citasHoy = $citasHoyQuery->orderBy('hora', 'asc')->get()->map(function ($c) {
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
                'estado_pago' => $c->estado_pago ?? 'pagado',
                'metodo_pago' => $c->metodo_pago ?? 'eps',
                'monto_pago' => (float) ($c->monto_pago ?? 0),
                'sede_nombre' => $c->sede->nombre ?? 'Laureles',
                'paciente' => [
                    'id_mascota' => $c->mascota->id_mascota ?? null,
                    'nombre' => $c->mascota->nombre ?? 'Paciente',
                    'especie' => $c->mascota->especie ?? 'Canino',
                    'raza' => $c->mascota->raza ?? 'Criollo',
                    'foto' => $c->mascota->foto_mascota ?? null,
                ],
                'dueno' => [
                    'id_cliente' => $c->cliente->id_cliente ?? null,
                    'nombre' => $c->cliente->nombre ?? 'Cliente',
                    'telefono' => $c->cliente->telefono ?? 'N/R',
                    'cedula' => $c->cliente->cedula ?? '',
                    'email' => $c->cliente->usuario->email ?? '',
                ],
                'veterinario' => [
                    'id_veterinario' => $c->veterinario->id_veterinario ?? null,
                    'nombre' => $c->veterinario->nombre ?? 'Por asignar',
                    'especialidad' => $c->veterinario->especialidad ?? '',
                ],
                'servicio' => [
                    'id_servicio' => $c->servicio->id_servicio ?? null,
                    'nombre' => $c->servicio->nombre ?? ($c->motivo ?? 'Consulta General'),
                ],
            ];
        });

        // Métricas del día
        $totalHoy = $citasHoy->count();
        $pendientesConfirmar = $citasHoy->where('id_estado', 1)->count();
        $pagosPendientes = $citasHoy->where('estado_pago', 'pendiente')->count();

        // Ingresos en efectivo de hoy recolectados en sede por recepcionistas de esta sede
        $pagoQuery = Pago::whereDate('created_at', $hoy)
            ->where('metodo_pago', 'efectivo_sede')
            ->where('estado', 'confirmado');

        if ($idSede) {
            $pagoQuery->whereHas('cita', function ($cq) use ($idSede) {
                $cq->where('id_sede', $idSede);
                if ((int) $idSede === 1) $cq->orWhereNull('id_sede');
            });
        }

        $ingresosEfectivoDia = (float) $pagoQuery->sum('monto');

        return response()->json([
            'recepcionista' => [
                'id_recepcionista' => $recep->id_recepcionista ?? null,
                'nombre' => $recep->nombre ?? 'Recepcionista Sede',
                'telefono' => $recep->telefono ?? '',
                'foto_perfil' => $recep->foto_perfil ?? null,
                'correo' => $user->email,
                'id_sede' => $idSede,
                'sede_nombre' => $sedeNombre,
                'password_temporal' => (bool) ($user->password_temporal ?? false),
            ],
            'stats' => [
                'citas_hoy' => $totalHoy,
                'pendientes_confirmar' => $pendientesConfirmar,
                'pagos_pendientes' => $pagosPendientes,
                'ingresos_efectivo_dia' => $ingresosEfectivoDia,
                'ingresos_efectivo_formateado' => '$ ' . number_format($ingresosEfectivoDia, 0, ',', '.'),
            ],
            'citas_hoy' => $citasHoy->values(),
        ], 200);
    }

    /**
     * Listado general de citas con filtros y ámbito de sede.
     */
    public function citas(Request $request)
    {
        $idSede = $this->getSedeId($request);
        $query = Cita::with(['mascota', 'cliente.usuario', 'servicio', 'estado', 'veterinario', 'sede']);

        if ($idSede) {
            $query->where(function ($q) use ($idSede) {
                $q->where('id_sede', $idSede);
                if ((int) $idSede === 1) $q->orWhereNull('id_sede');
            });
        }

        if ($request->filled('fecha')) {
            $query->whereDate('fecha', $request->fecha);
        }

        if ($request->filled('id_estado')) {
            $query->where('id_estado', $request->id_estado);
        }

        if ($request->filled('id_veterinario')) {
            $query->where('id_veterinario', $request->id_veterinario);
        }

        if ($request->filled('search')) {
            $search = strtolower(trim($request->search));
            $query->where(function ($q) use ($search) {
                $q->whereHas('mascota', function ($mq) use ($search) {
                    $mq->where('nombre', 'LIKE', "%{$search}%")
                      ->orWhere('especie', 'LIKE', "%{$search}%");
                })->orWhereHas('cliente', function ($cq) use ($search) {
                    $cq->where('nombre', 'LIKE', "%{$search}%")
                      ->orWhere('cedula', 'LIKE', "%{$search}%")
                      ->orWhere('telefono', 'LIKE', "%{$search}%");
                })->orWhereHas('servicio', function ($sq) use ($search) {
                    $sq->where('nombre', 'LIKE', "%{$search}%");
                });
            });
        }

        $citas = $query->orderBy('fecha', 'desc')->orderBy('hora', 'asc')->get()->map(function ($c) {
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
                'estado_pago' => $c->estado_pago ?? 'pagado',
                'metodo_pago' => $c->metodo_pago ?? 'eps',
                'monto_pago' => (float) ($c->monto_pago ?? 0),
                'sede_nombre' => $c->sede->nombre ?? 'Laureles',
                'paciente' => [
                    'id_mascota' => $c->mascota->id_mascota ?? null,
                    'nombre' => $c->mascota->nombre ?? 'Paciente',
                    'especie' => $c->mascota->especie ?? 'Canino',
                    'raza' => $c->mascota->raza ?? 'Criollo',
                    'foto' => $c->mascota->foto_mascota ?? null,
                ],
                'dueno' => [
                    'id_cliente' => $c->cliente->id_cliente ?? null,
                    'nombre' => $c->cliente->nombre ?? 'Cliente',
                    'telefono' => $c->cliente->telefono ?? 'N/R',
                    'cedula' => $c->cliente->cedula ?? '',
                    'email' => $c->cliente->usuario->email ?? '',
                ],
                'veterinario' => [
                    'id_veterinario' => $c->veterinario->id_veterinario ?? null,
                    'nombre' => $c->veterinario->nombre ?? 'Por asignar',
                    'especialidad' => $c->veterinario->especialidad ?? '',
                ],
                'servicio' => [
                    'id_servicio' => $c->servicio->id_servicio ?? null,
                    'nombre' => $c->servicio->nombre ?? ($c->motivo ?? 'Consulta General'),
                ],
            ];
        });

        return response()->json([
            'citas' => $citas->values(),
            'total' => $citas->count(),
        ], 200);
    }

    /**
     * Detalle completo de una cita para recepción.
     */
    public function detalleCita(Request $request, $id)
    {
        $cita = Cita::with(['mascota.cliente.usuario', 'servicio', 'estado', 'veterinario', 'sede'])
            ->where('id_cita', $id)
            ->first();

        if (!$cita) {
            return response()->json(['message' => 'Cita médica no encontrada.'], 404);
        }

        if (!$this->checkSedeAccess($request, $cita)) {
            return response()->json(['message' => 'Acceso denegado. Esta cita pertenece a otra sede y no puede ser gestionada desde tu sede actual.'], 403);
        }

        $pago = Pago::where('id_cita', $cita->id_cita)->orderBy('created_at', 'desc')->first();

        $recibidoPorUsuario = null;
        if ($pago && $pago->recibido_por) {
            $userRec = User::with(['recepcionista', 'cliente'])->find($pago->recibido_por);
            $recibidoPorUsuario = $userRec ? ($userRec->recepcionista->nombre ?? $userRec->email) : null;
        }

        $montoValor = $cita->monto_pago !== null ? (float) $cita->monto_pago : (float) ($cita->servicio->precio_base ?? 35000);
        $esPagadoOnline = ($pago && !empty($pago->wompi_transaction_id)) || in_array(strtolower($cita->metodo_pago ?? ''), ['web', 'wompi', 'tarjeta', 'pse']);

        return response()->json([
            'cita' => [
                'id_cita' => $cita->id_cita,
                'fecha' => $cita->fecha,
                'fecha_formateada' => Carbon::parse($cita->fecha)->format('d/m/Y'),
                'hora' => date('h:i A', strtotime($cita->hora)),
                'hora_raw' => $cita->hora,
                'motivo' => $cita->motivo ?? ($cita->servicio->nombre ?? 'Consulta Médica General'),
                'id_estado' => $cita->id_estado,
                'estado' => $cita->estado->nombre ?? 'Pendiente',
                'observacion' => $cita->observacion ?? '',
                'medicamentos' => is_array($cita->medicamentos) ? $cita->medicamentos : (json_decode($cita->medicamentos, true) ?? []),
                'metodo_pago' => $cita->metodo_pago ?? 'efectivo_sede',
                'estado_pago' => $cita->estado_pago ?? 'pendiente',
                'monto_pago' => $montoValor,
                'es_pagado_online' => $esPagadoOnline,
                'sede_nombre' => $cita->sede->nombre ?? 'Laureles',
                'pago' => [
                    'id_pago' => $pago->id_pago ?? null,
                    'monto' => $pago ? (float) $pago->monto : $montoValor,
                    'monto_recibido' => $pago ? (float) ($pago->monto_recibido ?? 0) : 0,
                    'cambio_devuelto' => $pago ? (float) ($pago->cambio_devuelto ?? 0) : 0,
                    'metodo_pago' => $pago ? $pago->metodo_pago : ($cita->metodo_pago ?? 'efectivo_sede'),
                    'estado' => $pago ? $pago->estado : ($cita->estado_pago ?? 'pendiente'),
                    'referencia_transaccion' => $pago->referencia_transaccion ?? null,
                    'wompi_transaction_id' => $pago->wompi_transaction_id ?? null,
                    'fecha_recepcion_pago' => $pago->fecha_recepcion_pago ?? null,
                    'recibido_por' => $recibidoPorUsuario,
                    'observacion_pago' => $pago->observacion_pago ?? '',
                ],
                'paciente' => [
                    'id_mascota' => $cita->mascota->id_mascota ?? null,
                    'nombre' => $cita->mascota->nombre ?? 'Paciente',
                    'especie' => $cita->mascota->especie ?? 'Canino',
                    'raza' => $cita->mascota->raza ?? 'Criollo',
                    'sexo' => $cita->mascota->sexo ?? 'Macho',
                    'peso' => $cita->mascota->peso ?? null,
                    'alergias' => $cita->mascota->alergias ?? 'Ninguna registrada',
                    'vacunas' => $cita->mascota->vacunas ?? 'Al día',
                    'foto' => $cita->mascota->foto_mascota ?? null,
                ],
                'dueno' => [
                    'id_cliente' => $cita->cliente->id_cliente ?? null,
                    'nombre' => $cita->cliente->nombre ?? 'Cliente',
                    'telefono' => $cita->cliente->telefono ?? '',
                    'cedula' => $cita->cliente->cedula ?? '',
                    'email' => $cita->cliente->usuario->email ?? '',
                    'direccion' => $cita->cliente->direccion ?? '',
                    'es_afiliado' => (bool) ($cita->cliente->es_afiliado ?? false),
                ],
                'veterinario' => [
                    'id_veterinario' => $cita->veterinario->id_veterinario ?? null,
                    'nombre' => $cita->veterinario->nombre ?? 'Médico Asignado',
                    'especialidad' => $cita->veterinario->especialidad ?? '',
                    'numero_tarjeta' => $cita->veterinario->numero_tarjeta ?? '',
                ],
                'servicio' => [
                    'id_servicio' => $cita->servicio->id_servicio ?? null,
                    'nombre' => $cita->servicio->nombre ?? 'Consulta General',
                    'precio_base' => (float) ($cita->servicio->precio_base ?? 35000),
                ]
            ]
        ], 200);
    }

    /**
     * Confirmar la cita (pasar de Pendiente = 1 a Confirmada = 2).
     */
    public function confirmarCita(Request $request, $id)
    {
        $cita = Cita::with(['mascota', 'cliente'])->findOrFail($id);

        if (!$this->checkSedeAccess($request, $cita)) {
            return response()->json(['message' => 'Acceso denegado. Esta cita pertenece a otra sede.'], 403);
        }

        if ($cita->id_estado == 3) {
            return response()->json(['message' => 'No se puede confirmar una cita que ha sido cancelada.'], 422);
        }

        if ($cita->id_estado == 4) {
            return response()->json(['message' => 'Esta cita ya ha sido completada.'], 422);
        }

        $cita->id_estado = 2; // Confirmada
        $cita->save();

        if ($cita->cliente) {
            Notificacion::create([
                'id_cliente' => $cita->cliente->id_cliente,
                'id_usuario' => $cita->cliente->id_usuario,
                'titulo' => 'Cita Confirmada en Sede',
                'mensaje' => "Tu cita para {$cita->mascota->nombre} el día {$cita->fecha} a las " . date('h:i A', strtotime($cita->hora)) . " ha sido confirmada por recepción.",
                'icono' => 'fa-calendar-check',
                'tipo' => 'success',
            ]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Cita médica confirmada exitosamente.',
            'id_estado' => 2,
            'estado_nombre' => 'Confirmada',
        ], 200);
    }

    /**
     * Cancelar cita desde recepción.
     */
    public function cancelarCita(Request $request, $id)
    {
        $cita = Cita::with(['mascota', 'cliente'])->findOrFail($id);

        if (!$this->checkSedeAccess($request, $cita)) {
            return response()->json(['message' => 'Acceso denegado. Esta cita pertenece a otra sede.'], 403);
        }

        if ($cita->id_estado == 4) {
            return response()->json(['message' => 'No se puede cancelar una cita que ya fue completada por el médico.'], 422);
        }

        $cita->id_estado = 3; // Cancelada
        if ($request->filled('motivo_cancelacion')) {
            $cita->observacion = trim($request->motivo_cancelacion);
        }
        $cita->save();

        ReservaTemporal::where('fecha', $cita->fecha)
            ->where('hora', $cita->hora)
            ->where('id_veterinario', $cita->id_veterinario)
            ->delete();

        if ($cita->cliente) {
            Notificacion::create([
                'id_cliente' => $cita->cliente->id_cliente,
                'id_usuario' => $cita->cliente->id_usuario,
                'titulo' => 'Cita Cancelada',
                'mensaje' => "La cita agendada para {$cita->mascota->nombre} el {$cita->fecha} ha sido cancelada.",
                'icono' => 'fa-calendar-xmark',
                'tipo' => 'warning',
            ]);
        }

        return response()->json([
            'success' => true,
            'message' => 'La cita ha sido cancelada correctamente.',
            'id_estado' => 3,
            'estado_nombre' => 'Cancelada',
        ], 200);
    }

    /**
     * Reprogramar fecha/hora/veterinario de una cita.
     */
    public function reprogramarCita(Request $request, $id)
    {
        $cita = Cita::with(['mascota', 'cliente'])->findOrFail($id);

        if (!$this->checkSedeAccess($request, $cita)) {
            return response()->json(['message' => 'Acceso denegado. Esta cita pertenece a otra sede.'], 403);
        }

        $request->validate([
            'nueva_fecha' => 'required|date|after_or_equal:today',
            'nueva_hora' => 'required|string',
            'id_veterinario' => 'nullable|integer|exists:veterinario,id_veterinario',
        ], [
            'nueva_fecha.required' => 'La nueva fecha es obligatoria.',
            'nueva_fecha.after_or_equal' => 'La nueva fecha debe ser posterior o igual a hoy.',
            'nueva_hora.required' => 'La hora de la cita es obligatoria.',
        ]);

        $vetId = $request->id_veterinario ?? $cita->id_veterinario;

        if ($vetId) {
            $choque = Cita::where('id_veterinario', $vetId)
                ->where('fecha', $request->nueva_fecha)
                ->where('hora', $request->nueva_hora)
                ->where('id_cita', '!=', $cita->id_cita)
                ->whereIn('id_estado', [1, 2])
                ->exists();

            if ($choque) {
                return response()->json(['message' => 'El médico seleccionado ya tiene una cita agendada en ese mismo horario.'], 422);
            }
        }

        $cita->fecha = $request->nueva_fecha;
        $cita->hora = $request->nueva_hora;
        if ($request->filled('id_veterinario')) {
            $cita->id_veterinario = $request->id_veterinario;
        }
        $cita->id_estado = 2; // Pasa a confirmada al reprogramar
        $cita->save();

        if ($cita->cliente) {
            Notificacion::create([
                'id_cliente' => $cita->cliente->id_cliente,
                'id_usuario' => $cita->cliente->id_usuario,
                'titulo' => 'Cita Reprogramada',
                'mensaje' => "Tu cita para {$cita->mascota->nombre} ha sido reprogramada para el {$cita->fecha} a las " . date('h:i A', strtotime($cita->hora)) . ".",
                'icono' => 'fa-clock-rotate-left',
                'tipo' => 'info',
            ]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Cita reprogramada exitosamente.',
            'cita' => [
                'id_cita' => $cita->id_cita,
                'fecha' => $cita->fecha,
                'hora' => date('h:i A', strtotime($cita->hora)),
                'id_estado' => $cita->id_estado,
            ]
        ], 200);
    }

    /**
     * Registrar el cobro presencial en sede (Efectivo / Datáfono / EPS).
     */
    public function registrarPago(Request $request, $id)
    {
        $cita = Cita::with(['cliente', 'servicio'])->findOrFail($id);

        if (!$this->checkSedeAccess($request, $cita)) {
            return response()->json(['message' => 'Acceso denegado. Esta cita pertenece a otra sede.'], 403);
        }

        $pagoExistente = Pago::where('id_cita', $cita->id_cita)->first();
        if ($pagoExistente && !empty($pagoExistente->wompi_transaction_id)) {
            return response()->json([
                'message' => 'Esta cita ya fue pagada previamente a través de la pasarela Web / Wompi. No se permite sobreescribir cobros de la web.'
            ], 422);
        }

        $request->validate([
            'metodo' => 'required|in:efectivo_sede,datafono,eps',
            'monto_recibido' => 'required_if:metodo,efectivo_sede|nullable|numeric|gte:0',
            'observacion_pago' => 'nullable|string|max:255',
        ], [
            'metodo.required' => 'Selecciona un método de pago válido.',
            'metodo.in' => 'El método debe ser efectivo_sede, datafono o eps.',
            'monto_recibido.required_if' => 'Debes ingresar el monto de dinero recibido en efectivo.',
            'monto_recibido.gte' => 'El monto recibido debe ser un número positivo.',
        ]);

        $metodo = $request->metodo;
        $montoBase = $cita->monto_pago !== null ? (float) $cita->monto_pago : (float) ($cita->servicio->precio_base ?? 35000);
        $montoRecibido = 0;
        $cambioDevuelto = 0;

        if ($metodo === 'efectivo_sede') {
            $montoRecibido = (float) $request->monto_recibido;
            if ($montoRecibido < $montoBase) {
                return response()->json([
                    'message' => "El dinero recibido ($ " . number_format($montoRecibido, 0, ',', '.') . ") es insuficiente para cubrir el total a pagar ($ " . number_format($montoBase, 0, ',', '.') . ")."
                ], 422);
            }
            $cambioDevuelto = $montoRecibido - $montoBase;
        } elseif ($metodo === 'eps') {
            $montoBase = 0;
            $montoRecibido = 0;
            $cambioDevuelto = 0;
        } else { // datafono
            $montoRecibido = $montoBase;
            $cambioDevuelto = 0;
        }

        $cita->estado_pago = 'pagado';
        $cita->metodo_pago = $metodo;
        $cita->monto_pago = $montoBase;
        $cita->save();

        $pagoObj = Pago::updateOrCreate(
            ['id_cita' => $cita->id_cita],
            [
                'id_cliente' => $cita->id_cliente,
                'monto' => $montoBase,
                'monto_recibido' => $montoRecibido,
                'cambio_devuelto' => $cambioDevuelto,
                'tipo_cobertura' => ($metodo === 'eps' ? 'eps' : 'particular'),
                'metodo_pago' => $metodo,
                'estado' => 'confirmado',
                'recibido_por' => $request->user()->id_usuario,
                'fecha_recepcion_pago' => now(),
                'observacion_pago' => $request->observacion_pago ? trim($request->observacion_pago) : null,
                'referencia_transaccion' => 'SEDE-' . strtoupper(uniqid()),
            ]
        );

        return response()->json([
            'success' => true,
            'message' => 'Cobro en sede registrado y confirmado exitosamente.',
            'pago' => [
                'id_pago' => $pagoObj->id_pago,
                'monto' => $montoBase,
                'monto_recibido' => $montoRecibido,
                'cambio_devuelto' => $cambioDevuelto,
                'metodo_pago' => $metodo,
                'estado' => 'confirmado',
                'referencia_transaccion' => $pagoObj->referencia_transaccion,
            ]
        ], 200);
    }

    /**
     * Directorio y búsqueda de clientes para recepción.
     */
    public function clientes(Request $request)
    {
        $idSede = $this->getSedeId($request);
        $query = Cliente::with(['usuario', 'mascotas']);

        if ($idSede) {
            $query->whereHas('citas', function ($cq) use ($idSede) {
                $cq->where('id_sede', $idSede)->orWhereNull('id_sede');
            });
        }

        if ($request->filled('search')) {
            $search = strtolower(trim($request->search));
            $query->where(function ($q) use ($search) {
                $q->where('nombre', 'LIKE', "%{$search}%")
                  ->orWhere('cedula', 'LIKE', "%{$search}%")
                  ->orWhere('telefono', 'LIKE', "%{$search}%")
                  ->orWhereHas('usuario', function ($uq) use ($search) {
                      $uq->where('email', 'LIKE', "%{$search}%");
                  });
            });
        }

        $clientes = $query->orderBy('nombre', 'asc')->get()->map(function ($c) {
            return [
                'id_cliente' => $c->id_cliente,
                'nombre' => $c->nombre,
                'cedula' => $c->cedula ?? '',
                'telefono' => $c->telefono ?? '',
                'direccion' => $c->direccion ?? '',
                'departamento' => $c->departamento ?? '',
                'ciudad' => $c->ciudad ?? '',
                'email' => $c->usuario->email ?? '',
                'es_afiliado' => (bool) $c->es_afiliado,
                'estado_afiliacion' => $c->estado_afiliacion,
                'total_mascotas' => $c->mascotas->count(),
                'mascotas' => $c->mascotas->map(function ($m) {
                    return [
                        'id_mascota' => $m->id_mascota,
                        'nombre' => $m->nombre,
                        'especie' => $m->especie,
                        'raza' => $m->raza ?? '',
                        'sexo' => $m->sexo ?? 'Macho',
                        'foto' => $m->foto_mascota ?? null,
                    ];
                })->values(),
            ];
        });

        return response()->json(['clientes' => $clientes->values(), 'total' => $clientes->count()], 200);
    }

    /**
     * Detalle individual de cliente para recepción.
     */
    public function detalleCliente(Request $request, $id)
    {
        $cliente = Cliente::with(['usuario', 'mascotas.citas.servicio', 'citas.veterinario', 'citas.servicio'])->findOrFail($id);

        return response()->json([
            'cliente' => [
                'id_cliente' => $cliente->id_cliente,
                'nombre' => $cliente->nombre,
                'cedula' => $cliente->cedula ?? '',
                'telefono' => $cliente->telefono ?? '',
                'direccion' => $cliente->direccion ?? '',
                'departamento' => $cliente->departamento ?? '',
                'ciudad' => $cliente->ciudad ?? '',
                'contacto_emergencia_nombre' => $cliente->contacto_emergencia_nombre ?? '',
                'contacto_emergencia_telefono' => $cliente->contacto_emergencia_telefono ?? '',
                'email' => $cliente->usuario->email ?? '',
                'es_afiliado' => (bool) $cliente->es_afiliado,
                'estado_afiliacion' => $cliente->estado_afiliacion,
                'fecha_afiliacion' => $cliente->fecha_afiliacion ? $cliente->fecha_afiliacion->format('d/m/Y') : null,
                'mascotas' => $cliente->mascotas->map(function ($m) {
                    return [
                        'id_mascota' => $m->id_mascota,
                        'nombre' => $m->nombre,
                        'especie' => $m->especie,
                        'raza' => $m->raza ?? '',
                        'sexo' => $m->sexo ?? 'Macho',
                        'fecha_nacimiento' => $m->fecha_nacimiento,
                        'peso' => $m->peso,
                        'alergias' => $m->alergias ?? 'Ninguna',
                        'vacunas' => $m->vacunas ?? 'Al día',
                        'foto' => $m->foto_mascota ?? null,
                    ];
                })->values(),
            ]
        ], 200);
    }

    /**
     * Actualizar datos de contacto y tutor del cliente.
     */
    public function actualizarCliente(Request $request, $id)
    {
        $cliente = Cliente::findOrFail($id);

        $request->validate([
            'nombre' => 'required|string|max:150',
            'telefono' => 'required|regex:/^[0-9]+$/|min:7|max:15',
            'cedula' => [
                'required',
                'string',
                'max:30',
                Rule::unique('cliente', 'cedula')->ignore($cliente->id_cliente, 'id_cliente')
            ],
            'direccion' => 'nullable|string|max:255',
            'departamento' => 'nullable|string|max:100',
            'ciudad' => 'nullable|string|max:100',
            'contacto_emergencia_nombre' => 'nullable|string|max:150',
            'contacto_emergencia_telefono' => 'nullable|regex:/^[0-9]+$/|min:7|max:15',
        ], [
            'nombre.required' => 'El nombre del cliente es obligatorio.',
            'telefono.required' => 'El teléfono es obligatorio.',
            'cedula.required' => 'La cédula es obligatoria.',
            'cedula.unique' => 'Esta cédula ya está registrada por otro cliente.',
        ]);

        $cliente->nombre = trim($request->nombre);
        $cliente->telefono = trim($request->telefono);
        $cliente->cedula = trim($request->cedula);
        if ($request->has('direccion')) $cliente->direccion = trim($request->direccion ?? '');
        if ($request->has('departamento')) $cliente->departamento = trim($request->departamento ?? '');
        if ($request->has('ciudad')) $cliente->ciudad = trim($request->ciudad ?? '');
        if ($request->has('contacto_emergencia_nombre')) $cliente->contacto_emergencia_nombre = trim($request->contacto_emergencia_nombre ?? '');
        if ($request->has('contacto_emergencia_telefono')) $cliente->contacto_emergencia_telefono = trim($request->contacto_emergencia_telefono ?? '');

        $cliente->save();

        return response()->json([
            'success' => true,
            'message' => 'Datos del cliente actualizados exitosamente.',
            'cliente' => $cliente,
        ], 200);
    }

    /**
     * Actualizar datos clínicos básicos de una mascota.
     */
    public function actualizarMascota(Request $request, $id)
    {
        $mascota = Mascota::findOrFail($id);

        $request->validate([
            'nombre' => 'required|string|max:100',
            'especie' => 'required|string|max:50',
            'raza' => 'nullable|string|max:100',
            'sexo' => 'required|in:Macho,Hembra',
            'fecha_nacimiento' => 'nullable|date',
            'peso' => 'nullable|numeric|gt:0|max:250',
            'alergias' => 'nullable|string|max:500',
            'vacunas' => 'nullable|string|max:500',
        ], [
            'nombre.required' => 'El nombre de la mascota es obligatorio.',
            'especie.required' => 'La especie es obligatoria.',
            'sexo.required' => 'El sexo es obligatorio.',
        ]);

        $mascota->nombre = trim($request->nombre);
        $mascota->especie = trim($request->especie);
        if ($request->has('raza')) $mascota->raza = trim($request->raza ?? '');
        $mascota->sexo = $request->sexo;
        if ($request->has('fecha_nacimiento')) $mascota->fecha_nacimiento = $request->fecha_nacimiento ?: null;
        if ($request->has('peso')) $mascota->peso = is_numeric($request->peso) ? (float) $request->peso : null;
        if ($request->has('alergias')) $mascota->alergias = trim($request->alergias ?? '');
        if ($request->has('vacunas')) $mascota->vacunas = trim($request->vacunas ?? '');

        $mascota->save();

        return response()->json([
            'success' => true,
            'message' => 'Información de la mascota actualizada correctamente.',
            'mascota' => $mascota,
        ], 200);
    }

    /**
     * Directorio de veterinarios filtrado por la sede del recepcionista.
     */
    public function veterinarios(Request $request)
    {
        $idSede = $this->getSedeId($request);
        $hoy = Carbon::today()->format('Y-m-d');

        $query = Veterinario::with(['usuario', 'sede']);

        if ($idSede) {
            $query->where(function ($q) use ($idSede) {
                $q->where('id_sede', $idSede);
                if ((int) $idSede === 1) $q->orWhereNull('id_sede');
            });
        }

        $vets = $query->get()->map(function ($v) use ($hoy, $idSede) {
            $citasHoyQuery = Cita::where('id_veterinario', $v->id_veterinario)
                ->whereDate('fecha', $hoy)
                ->whereIn('id_estado', [1, 2, 4]);

            if ($idSede) {
                $citasHoyQuery->where(function ($cq) use ($idSede) {
                    $cq->where('id_sede', $idSede);
                    if ((int) $idSede === 1) $cq->orWhereNull('id_sede');
                });
            }

            return [
                'id_veterinario' => $v->id_veterinario,
                'nombre' => $v->nombre,
                'especialidad' => $v->especialidad ?? 'Medicina General',
                'telefono' => $v->telefono ?? 'N/R',
                'numero_tarjeta' => $v->numero_tarjeta ?? 'N/R',
                'foto' => $v->foto_perfil ?? null,
                'email' => $v->usuario->email ?? '',
                'sede_nombre' => $v->sede->nombre ?? 'Laureles',
                'citas_hoy' => $citasHoyQuery->count(),
            ];
        });

        return response()->json(['veterinarios' => $vets->values()], 200);
    }

    /**
     * Generar y descargar el PDF de la Fórmula Médica para impresión.
     */
    public function descargarFormulaPdf(Request $request, $id)
    {
        $cita = Cita::with(['mascota.cliente.usuario', 'veterinario', 'servicio', 'estado', 'sede'])->find($id);

        if (!$cita) {
            return response()->json(['message' => 'Cita médica no encontrada.'], 404);
        }

        if (!$this->checkSedeAccess($request, $cita)) {
            return response()->json(['message' => 'Acceso denegado. Esta cita pertenece a otra sede.'], 403);
        }

        if ($cita->id_estado != 4) {
            return response()->json(['message' => 'La fórmula médica solo puede imprimirse en citas que se encuentren Completadas por el médico.'], 422);
        }

        $medicamentos = is_array($cita->medicamentos) ? $cita->medicamentos : (json_decode($cita->medicamentos, true) ?? []);

        if (empty($medicamentos)) {
            return response()->json(['message' => 'Esta cita no tiene medicamentos o fórmula médica recetada.'], 422);
        }

        $mascota = $cita->mascota;
        $cliente = $cita->cliente;
        $vet = $cita->veterinario;

        $pdfData = [
            'cita' => $cita,
            'cita_id' => $cita->id_cita,
            'fecha_emision' => Carbon::parse($cita->fecha)->format('d/m/Y'),
            'hora_emision' => date('h:i A', strtotime($cita->hora)),
            'fecha' => Carbon::parse($cita->fecha)->format('d/m/Y'),
            'hora' => date('h:i A', strtotime($cita->hora)),
            'servicio_nombre' => $cita->servicio->nombre ?? 'Consulta Médica General',
            'observacion' => $cita->observacion ?? 'Sin observaciones adicionadas.',
            'medicamentos' => $medicamentos,
            'mascota_nombre' => $mascota->nombre ?? 'Paciente',
            'mascota_especie' => $mascota->especie ?? 'Canino',
            'mascota_raza' => $mascota->raza ?? 'Criollo',
            'mascota_sexo' => $mascota->sexo ?? 'Macho',
            'mascota_peso' => $mascota->peso ? number_format((float)$mascota->peso, 2) . ' kg' : 'N/R',
            'tutor_nombre' => $cliente->nombre ?? 'Cliente',
            'tutor_cedula' => $cliente->cedula ?? 'N/R',
            'tutor_telefono' => $cliente->telefono ?? 'N/R',
            'cliente_nombre' => $cliente->nombre ?? 'Cliente',
            'cliente_doc' => $cliente->cedula ?? 'N/R',
            'veterinario_nombre' => $vet->nombre ?? 'Médico Veterinario',
            'veterinario_especialidad' => $vet->especialidad ?? 'Medicina General',
            'veterinario_tarjeta' => $vet->numero_tarjeta ?? 'TP-99999-COL',
            'sede_nombre' => $cita->sede->nombre ?? 'Sede Laureles',
        ];

        $pdf = Pdf::loadView('pdf.receta_medica', $pdfData);
        $pdf->setPaper('A4', 'portrait');

        return $pdf->stream("formula_medica_cita_{$cita->id_cita}.pdf");
    }

    /**
     * Perfil del Recepcionista.
     */
    public function perfilInfo(Request $request)
    {
        $user = $request->user();
        $recep = $user->recepcionista;

        return response()->json([
            'recepcionista' => [
                'id_recepcionista' => $recep->id_recepcionista ?? null,
                'nombre' => $recep->nombre ?? 'Recepcionista Sede',
                'telefono' => $recep->telefono ?? '',
                'foto_perfil' => $recep->foto_perfil ?? null,
                'correo' => $user->email,
                'sede_nombre' => $recep && $recep->sede ? $recep->sede->nombre : 'Laureles',
            ]
        ], 200);
    }

    /**
     * Actualizar perfil del Recepcionista.
     */
    public function updatePerfil(Request $request)
    {
        $user = $request->user();
        $recep = $user->recepcionista;

        if (!$recep) {
            $recep = Recepcionista::create([
                'id_usuario' => $user->id_usuario,
                'nombre' => 'Recepcionista Sede',
            ]);
        }

        $request->validate([
            'nombre' => 'required|string|max:150',
            'telefono' => 'nullable|string|max:20',
        ]);

        $recep->nombre = trim($request->nombre);
        if ($request->has('telefono')) {
            $recep->telefono = trim($request->telefono ?? '');
        }

        $recep->save();

        return response()->json([
            'success' => true,
            'message' => 'Perfil de recepción actualizado correctamente.',
            'recepcionista' => [
                'id_recepcionista' => $recep->id_recepcionista,
                'nombre' => $recep->nombre,
                'telefono' => $recep->telefono ?? '',
                'foto_perfil' => $recep->foto_perfil ?? null,
                'correo' => $user->email,
            ]
        ], 200);
    }

    /**
     * Cambiar clave de recepcionista.
     */
    public function cambiarPassword(Request $request)
    {
        $user = $request->user();

        $request->validate([
            'contrasena_actual' => 'required|string',
            'nueva_contrasena' => 'required|string|min:6',
            'confirmar_nueva_contrasena' => 'required|string|same:nueva_contrasena',
        ], [
            'contrasena_actual.required' => 'Ingresa tu contraseña actual o temporal.',
            'nueva_contrasena.required' => 'Ingresa la nueva contraseña.',
            'nueva_contrasena.min' => 'La contraseña debe tener al menos 6 caracteres.',
            'confirmar_nueva_contrasena.same' => 'Las contraseñas no coinciden.',
        ]);

        if (!Hash::check($request->contrasena_actual, $user->contrasena_hash)) {
            return response()->json(['message' => 'La contraseña actual o temporal es incorrecta.'], 422);
        }

        if (Hash::check($request->nueva_contrasena, $user->contrasena_hash)) {
            return response()->json(['message' => 'La nueva contraseña no puede ser igual a la anterior.'], 422);
        }

        $user->contrasena_hash = Hash::make($request->nueva_contrasena);
        $user->password_temporal = false;
        $user->save();

        return response()->json([
            'success' => true,
            'message' => 'Contraseña de recepción actualizada exitosamente.',
            'password_temporal' => false,
        ], 200);
    }
}
