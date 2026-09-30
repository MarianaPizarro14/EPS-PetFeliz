<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Cita;
use App\Models\Mascota;
use App\Services\CloudinaryService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

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
                'estado_pago' => $c->estado_pago ?? 'pagado',
                'metodo_pago' => $c->metodo_pago ?? 'Pago en línea',
                'observacion' => $c->observacion ?? '',
                'medicamentos' => is_array($c->medicamentos) ? $c->medicamentos : (json_decode($c->medicamentos, true) ?? []),
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
                'especialidad' => $vet->especialidad ?? '',
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
     * Obtener el detalle individual de una cita médica para el veterinario.
     */
    public function detalleCita(Request $request, $id)
    {
        $user = $request->user();
        $vet = $user->veterinario;

        if (!$vet) {
            return response()->json(['message' => 'Perfil veterinario no encontrado.'], 404);
        }

        $cita = Cita::with(['mascota.cliente.usuario', 'servicio', 'estado', 'veterinario'])
            ->where('id_cita', $id)
            ->where('id_veterinario', $vet->id_veterinario)
            ->first();

        if (!$cita) {
            return response()->json(['message' => 'Cita médica no encontrada.'], 404);
        }

        $mascota = $cita->mascota;
        $cliente = $cita->cliente;
        $servicio = $cita->servicio;

        $pesoValor = ($mascota && $mascota->peso !== null && $mascota->peso > 0) ? (float) $mascota->peso : 12.00;
        $fechaNacimiento = ($mascota && $mascota->fecha_nacimiento) ? Carbon::parse($mascota->fecha_nacimiento)->format('Y-m-d') : null;
        $edadAprox = 16;
        if ($fechaNacimiento) {
            $edadAprox = Carbon::parse($fechaNacimiento)->age;
        } else {
            $fechaNacimiento = Carbon::now()->subYears(16)->format('Y-01-01');
        }
        $edadTexto = $edadAprox . ($edadAprox === 1 ? ' año' : ' años');

        $medicamentosList = [];
        if (!empty($cita->medicamentos)) {
            $medicamentosList = is_array($cita->medicamentos) ? $cita->medicamentos : (json_decode($cita->medicamentos, true) ?? []);
        }

        $rawObservacion = $cita->observacion ?? '';
        $notaCita = '';
        $observacionMedica = $rawObservacion;

        // Si la observación contenía notas de pago o de reserva, limpiarla por completo
        if (preg_match('/pago|wompi|verificado|confirmado|agendada|reserva/i', $rawObservacion)) {
            $notaCita = $rawObservacion;
            $observacionMedica = '';
        }

        $montoValor = $cita->monto_pago !== null ? (float) $cita->monto_pago : (float) ($servicio->precio ?? 35000);
        $metodoPagoFinal = $cita->metodo_pago ?? 'Pago en línea';
        $estadoPagoFinal = $cita->estado_pago ?? 'pagado';

        return response()->json([
            'cita' => [
                'id_cita' => $cita->id_cita,
                'fecha' => $cita->fecha,
                'fecha_formateada' => Carbon::parse($cita->fecha)->format('d/m/Y'),
                'hora' => date('h:i A', strtotime($cita->hora)),
                'hora_raw' => $cita->hora,
                'motivo' => $cita->motivo ?? ($servicio->nombre ?? 'Consulta Médica General'),
                'id_estado' => $cita->id_estado,
                'estado' => $cita->estado->nombre ?? 'Pendiente',
                'observacion' => $observacionMedica,
                'nota_cita' => $notaCita,
                'medicamentos' => $medicamentosList,
                'metodo_pago' => $metodoPagoFinal,
                'estado_pago' => $estadoPagoFinal,
                'monto_pago' => $montoValor,
                'pago' => [
                    'metodo_pago' => $metodoPagoFinal,
                    'estado_pago' => $estadoPagoFinal,
                    'monto' => $montoValor,
                    'monto_formateado' => '$ ' . number_format($montoValor, 0, ',', '.'),
                ],
                'paciente' => [
                    'id_mascota' => $mascota->id_mascota ?? null,
                    'nombre' => $mascota->nombre ?? 'Paciente',
                    'especie' => $mascota->especie ?? 'Canino',
                    'raza' => $mascota->raza ?? 'Criollo / Mestizo',
                    'sexo' => $mascota->sexo ?? 'Macho',
                    'fecha_nacimiento' => $fechaNacimiento,
                    'edad' => $edadTexto,
                    'edad_aproximada' => $edadAprox,
                    'peso' => $pesoValor,
                    'peso_formateado' => number_format($pesoValor, 2) . ' kg',
                    'alergias' => $mascota->alergias ?? 'Ninguna registrada',
                    'vacunas' => $mascota->vacunas ?? 'Al día',
                    'foto' => $mascota->foto_mascota ?? 'https://res.cloudinary.com/dedroug6v/image/upload/v1/mascotas/default_pet.jpg',
                ],
                'dueno' => [
                    'id_cliente' => $cliente->id_cliente ?? null,
                    'nombre' => $cliente->nombre ?? ($cliente->usuario->nombre ?? 'Cliente EPS'),
                    'telefono' => $cliente->telefono ?? '',
                    'email' => $cliente->usuario->email ?? ($cliente->email ?? ''),
                    'cedula' => $cliente->cedula ?? '',
                ],
                'servicio' => [
                    'id_servicio' => $servicio->id_servicio ?? null,
                    'nombre' => $servicio->nombre ?? 'Consulta Médica General',
                    'descripcion' => $servicio->descripcion ?? '',
                    'precio' => $montoValor,
                ]
            ]
        ], 200);
    }

    /**
     * Actualizar los datos del paciente (mascota) y tutor (cliente/usuario) asociados a la cita.
     */
    public function actualizarDatos(Request $request, $id)
    {
        $user = $request->user();
        $vet = $user->veterinario;

        if (!$vet) {
            return response()->json(['message' => 'Perfil veterinario no encontrado.'], 404);
        }

        $cita = Cita::with(['mascota', 'cliente.usuario'])
            ->where('id_cita', $id)
            ->where('id_veterinario', $vet->id_veterinario)
            ->firstOrFail();

        $cliente = $cita->cliente;
        $usuarioCliente = $cliente ? $cliente->usuario : null;
        $mascota = $cita->mascota;

        if (!$cliente || !$mascota) {
            return response()->json(['message' => 'No se encontraron los registros de mascota o tutor asociados.'], 404);
        }

        $request->validate([
            'paciente.nombre' => 'required|string|max:100',
            'paciente.especie' => 'required|string|max:50',
            'paciente.raza' => 'nullable|string|max:100',
            'paciente.sexo' => 'required|in:Macho,Hembra',
            'paciente.fecha_nacimiento' => 'nullable|date',
            'paciente.peso' => 'nullable|numeric|gt:0|max:250',
            'paciente.alergias' => 'nullable|string|max:500',

            'dueno.nombre' => 'required|string|max:150',
            'dueno.telefono' => 'required|regex:/^[0-9]+$/|min:7|max:15',
            'dueno.cedula' => [
                'required',
                'string',
                'max:30',
                Rule::unique('cliente', 'cedula')->ignore($cliente->id_cliente, 'id_cliente')
            ],
            'dueno.email' => [
                'required',
                'email',
                'max:150',
                $usuarioCliente ? Rule::unique('usuario', 'email')->ignore($usuarioCliente->id_usuario, 'id_usuario') : 'nullable'
            ],
        ], [
            'paciente.nombre.required' => 'El nombre del paciente es obligatorio.',
            'paciente.especie.required' => 'La especie es obligatoria.',
            'paciente.sexo.required' => 'El sexo de la mascota es obligatorio.',
            'paciente.sexo.in' => 'El sexo debe ser Macho o Hembra.',
            'paciente.peso.numeric' => 'El peso debe ser un número válido.',
            'paciente.peso.gt' => 'El peso debe ser mayor a 0 kg.',
            'dueno.nombre.required' => 'El nombre del tutor es obligatorio.',
            'dueno.telefono.required' => 'El teléfono de contacto es obligatorio.',
            'dueno.telefono.regex' => 'El teléfono solo debe contener números.',
            'dueno.cedula.required' => 'La cédula o documento es obligatorio.',
            'dueno.cedula.unique' => 'Esta cédula ya se encuentra registrada por otro cliente.',
            'dueno.email.required' => 'El correo electrónico es obligatorio.',
            'dueno.email.email' => 'El formato del correo electrónico no es válido.',
            'dueno.email.unique' => 'Este correo electrónico ya está registrado por otro usuario.',
        ]);

        DB::transaction(function () use ($request, $mascota, $cliente, $usuarioCliente) {
            $pData = $request->input('paciente', []);
            $mascota->nombre = trim($pData['nombre']);
            $mascota->especie = trim($pData['especie']);
            $mascota->raza = isset($pData['raza']) ? trim($pData['raza']) : $mascota->raza;
            $mascota->sexo = $pData['sexo'];
            if (array_key_exists('fecha_nacimiento', $pData)) {
                $mascota->fecha_nacimiento = !empty($pData['fecha_nacimiento']) ? $pData['fecha_nacimiento'] : null;
            } elseif (isset($pData['edad_aproximada']) && is_numeric($pData['edad_aproximada'])) {
                $mascota->fecha_nacimiento = Carbon::now()->subYears((int) $pData['edad_aproximada'])->format('Y-01-01');
            }
            if (array_key_exists('peso', $pData)) {
                $mascota->peso = is_numeric($pData['peso']) ? (float) $pData['peso'] : null;
            }
            if (array_key_exists('alergias', $pData)) {
                $mascota->alergias = !empty(trim($pData['alergias'])) ? trim($pData['alergias']) : 'Ninguna registrada';
            }
            $mascota->save();

            $dData = $request->input('dueno', []);
            $cliente->nombre = trim($dData['nombre']);
            $cliente->telefono = trim($dData['telefono']);
            $cliente->cedula = trim($dData['cedula']);
            $cliente->save();

            if ($usuarioCliente && !empty($dData['email'])) {
                $usuarioCliente->email = strtolower(trim($dData['email']));
                $usuarioCliente->save();
            }

            if ($request->has('pago')) {
                $pagoData = $request->input('pago', []);
                if (!empty($pagoData['metodo_pago'])) $cita->metodo_pago = trim($pagoData['metodo_pago']);
                if (!empty($pagoData['estado_pago'])) $cita->estado_pago = trim($pagoData['estado_pago']);
                if (isset($pagoData['monto']) && is_numeric($pagoData['monto'])) $cita->monto_pago = (float) $pagoData['monto'];
                $cita->save();
            }
        });

        return response()->json([
            'success' => true,
            'message' => 'Datos de la mascota y del tutor actualizados exitosamente.',
        ], 200);
    }

    /**
     * Registrar la atención médica de una cita, observaciones clínicas y medicamentos recetados.
     * Guarda todo en una sola transacción incluyendo datos actualizados de paciente y tutor si se proveen.
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

        $cita = Cita::with(['mascota', 'cliente.usuario'])
            ->where('id_cita', $id)
            ->where('id_veterinario', $vet->id_veterinario)
            ->firstOrFail();

        $cliente = $cita->cliente;
        $usuarioCliente = $cliente ? $cliente->usuario : null;
        $mascota = $cita->mascota;

        $validationRules = [
            'observacion' => 'nullable|string|max:2500',
            'medicamentos' => 'nullable|array',
            'medicamentos.*.nombre' => 'required_with:medicamentos|string|max:200',
            'medicamentos.*.dosis' => 'nullable|string|max:200',
            'medicamentos.*.indicaciones' => 'nullable|string|max:500',
            'id_estado' => 'nullable|integer|in:1,2,3,4',
        ];

        if ($request->has('paciente') && $mascota) {
            $validationRules['paciente.nombre'] = 'required|string|max:100';
            $validationRules['paciente.especie'] = 'required|string|max:50';
            $validationRules['paciente.raza'] = 'nullable|string|max:100';
            $validationRules['paciente.sexo'] = 'required|in:Macho,Hembra';
            $validationRules['paciente.fecha_nacimiento'] = 'nullable|date';
            $validationRules['paciente.peso'] = 'nullable|numeric|gt:0|max:250';
            $validationRules['paciente.alergias'] = 'nullable|string|max:500';
        }

        if ($request->has('dueno') && $cliente) {
            $validationRules['dueno.nombre'] = 'required|string|max:150';
            $validationRules['dueno.telefono'] = 'required|regex:/^[0-9]+$/|min:7|max:15';
            $validationRules['dueno.cedula'] = [
                'required',
                'string',
                'max:30',
                Rule::unique('cliente', 'cedula')->ignore($cliente->id_cliente, 'id_cliente')
            ];
            $validationRules['dueno.email'] = [
                'required',
                'email',
                'max:150',
                $usuarioCliente ? Rule::unique('usuario', 'email')->ignore($usuarioCliente->id_usuario, 'id_usuario') : 'nullable'
            ];
        }

        $request->validate($validationRules, [
            'paciente.nombre.required' => 'El nombre del paciente es obligatorio.',
            'paciente.especie.required' => 'La especie es obligatoria.',
            'paciente.sexo.required' => 'El sexo de la mascota es obligatorio.',
            'paciente.sexo.in' => 'El sexo debe ser Macho o Hembra.',
            'paciente.peso.numeric' => 'El peso debe ser un número válido.',
            'paciente.peso.gt' => 'El peso debe ser mayor a 0 kg.',
            'dueno.nombre.required' => 'El nombre del tutor es obligatorio.',
            'dueno.telefono.required' => 'El teléfono de contacto es obligatorio.',
            'dueno.telefono.regex' => 'El teléfono solo debe contener números.',
            'dueno.cedula.required' => 'La cédula o documento es obligatorio.',
            'dueno.cedula.unique' => 'Esta cédula ya se encuentra registrada por otro cliente.',
            'dueno.email.required' => 'El correo electrónico es obligatorio.',
            'dueno.email.email' => 'El formato del correo electrónico no es válido.',
            'dueno.email.unique' => 'Este correo electrónico ya está registrado por otro usuario.',
        ]);

        DB::transaction(function () use ($request, $cita, $mascota, $cliente, $usuarioCliente) {
            // 1. Actualizar paciente si se incluyeron datos
            if ($request->has('paciente') && $mascota) {
                $pData = $request->input('paciente', []);
                $mascota->nombre = trim($pData['nombre']);
                $mascota->especie = trim($pData['especie']);
                if (isset($pData['raza'])) $mascota->raza = trim($pData['raza']);
                if (isset($pData['sexo'])) $mascota->sexo = $pData['sexo'];
                if (array_key_exists('fecha_nacimiento', $pData)) {
                    $mascota->fecha_nacimiento = !empty($pData['fecha_nacimiento']) ? $pData['fecha_nacimiento'] : null;
                } elseif (isset($pData['edad_aproximada']) && is_numeric($pData['edad_aproximada'])) {
                    $mascota->fecha_nacimiento = Carbon::now()->subYears((int) $pData['edad_aproximada'])->format('Y-01-01');
                }
                if (array_key_exists('peso', $pData)) {
                    $mascota->peso = is_numeric($pData['peso']) ? (float) $pData['peso'] : null;
                }
                if (array_key_exists('alergias', $pData)) {
                    $mascota->alergias = !empty(trim($pData['alergias'])) ? trim($pData['alergias']) : 'Ninguna registrada';
                }
                $mascota->save();
            }

            // 2. Actualizar tutor si se incluyeron datos
            if ($request->has('dueno') && $cliente) {
                $dData = $request->input('dueno', []);
                $cliente->nombre = trim($dData['nombre']);
                $cliente->telefono = trim($dData['telefono']);
                $cliente->cedula = trim($dData['cedula']);
                $cliente->save();

                if ($usuarioCliente && !empty($dData['email'])) {
                    $usuarioCliente->email = strtolower(trim($dData['email']));
                    $usuarioCliente->save();
                }
            }

            // 3. Actualizar cita clínica, pago y medicamentos
            $cita->id_estado = $request->id_estado ?? 4;

            if ($request->has('pago')) {
                $pData = $request->input('pago', []);
                if (!empty($pData['metodo_pago'])) $cita->metodo_pago = trim($pData['metodo_pago']);
                if (!empty($pData['estado_pago'])) $cita->estado_pago = trim($pData['estado_pago']);
                if (isset($pData['monto']) && is_numeric($pData['monto'])) $cita->monto_pago = (float) $pData['monto'];
            }

            if ($request->has('observacion')) {
                $cita->observacion = trim(strip_tags($request->observacion));
            }

            if ($request->has('medicamentos')) {
                $meds = array_values(array_filter($request->medicamentos, function ($m) {
                    return !empty($m['nombre']);
                }));
                $cita->medicamentos = $meds;
            }

            $cita->save();
        });

        $cita->load(['mascota', 'cliente.usuario', 'servicio', 'estado']);

        return response()->json([
            'success' => true,
            'message' => 'Atención médica y receta registradas exitosamente.',
            'cita' => [
                'id_cita' => $cita->id_cita,
                'fecha' => $cita->fecha,
                'hora' => date('h:i A', strtotime($cita->hora)),
                'motivo' => $cita->motivo,
                'id_estado' => $cita->id_estado,
                'estado' => $cita->estado->nombre ?? 'Completada',
                'observacion' => $cita->observacion,
                'medicamentos' => $cita->medicamentos ?? [],
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

    /**
     * Obtener la información del perfil del médico veterinario autenticado.
     */
    public function perfilInfo(Request $request)
    {
        $user = $request->user();
        $vet = $user->veterinario;

        if (!$vet) {
            return response()->json([
                'message' => 'No se encontró un perfil de médico veterinario asociado a esta cuenta.'
            ], 404);
        }

        return response()->json([
            'veterinario' => [
                'id_veterinario' => $vet->id_veterinario,
                'nombre' => $vet->nombre,
                'especialidad' => $vet->especialidad ?? '',
                'numero_tarjeta' => $vet->numero_tarjeta ?? '',
                'telefono' => $vet->telefono ?? '',
                'foto_perfil' => $vet->foto_perfil ?? null,
                'correo' => $user->email,
            ]
        ], 200);
    }

    /**
     * Actualizar la información del perfil del médico veterinario autenticado.
     */
    public function updatePerfil(Request $request)
    {
        $user = $request->user();
        $vet = $user->veterinario;

        if (!$vet) {
            return response()->json([
                'message' => 'No se encontró un perfil de médico veterinario asociado a esta cuenta.'
            ], 404);
        }

        $request->validate([
            'nombre' => 'required|string|max:150',
            'especialidad' => 'nullable|string|max:150',
            'numero_tarjeta' => 'nullable|string|max:50',
            'telefono' => 'nullable|string|max:20',
            'foto' => 'nullable',
            'foto_perfil' => 'nullable',
        ], [
            'nombre.required' => 'El nombre completo es obligatorio.',
        ]);

        $vet->nombre = trim($request->nombre);
        if ($request->has('especialidad')) {
            $vet->especialidad = trim($request->especialidad ?? '');
        }
        if ($request->has('numero_tarjeta')) {
            $vet->numero_tarjeta = trim($request->numero_tarjeta ?? '');
        }
        if ($request->has('telefono')) {
            $vet->telefono = trim($request->telefono ?? '');
        }

        if ($request->hasFile('foto')) {
            $fotoUrl = CloudinaryService::upload($request->file('foto'), 'veterinarios');
            if ($fotoUrl) {
                $vet->foto_perfil = $fotoUrl;
            }
        } elseif ($request->hasFile('foto_perfil')) {
            $fotoUrl = CloudinaryService::upload($request->file('foto_perfil'), 'veterinarios');
            if ($fotoUrl) {
                $vet->foto_perfil = $fotoUrl;
            }
        }

        $vet->save();

        return response()->json([
            'success' => true,
            'message' => 'Perfil del médico veterinario actualizado exitosamente.',
            'veterinario' => [
                'id_veterinario' => $vet->id_veterinario,
                'nombre' => $vet->nombre,
                'especialidad' => $vet->especialidad ?? '',
                'numero_tarjeta' => $vet->numero_tarjeta ?? '',
                'telefono' => $vet->telefono ?? '',
                'foto_perfil' => $vet->foto_perfil ?? null,
                'correo' => $user->email,
            ]
        ], 200);
    }
}
