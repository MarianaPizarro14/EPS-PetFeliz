<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Cita;
use App\Models\Mascota;
use Carbon\Carbon;
use Illuminate\Http\Request;

class DashboardClientController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        
        // Obtener el cliente asociado al usuario autenticado
        $cliente = $user->cliente;

        if (!$cliente) {
            return response()->json([
                'message' => 'El usuario autenticado no está registrado como cliente.',
            ], 404);
        }

        // 1. Datos del Perfil del Cliente
        $primerNombre = explode(' ', trim($cliente->nombre ?? 'Usuario'))[0];
        
        $perfil = [
            'id_cliente' => $cliente->id_cliente,
            'nombre' => $primerNombre,
            'nombreCompleto' => $cliente->nombre,
            'email' => $user->email,
            'telefono' => $cliente->telefono,
            'direccion' => $cliente->direccion,
            'cedula' => $cliente->cedula ?? '',
            'fecha_nacimiento' => $cliente->fecha_nacimiento ?? '',
            'departamento' => $cliente->departamento ?? '',
            'ciudad' => $cliente->ciudad ?? '',

            'contacto_emergencia_nombre' => $cliente->contacto_emergencia_nombre ?? '',
            'contacto_emergencia_telefono' => $cliente->contacto_emergencia_telefono ?? '',
            'notificaciones_email' => (bool) ($cliente->notificaciones_email ?? true),
            'recordatorios_citas' => (bool) ($cliente->recordatorios_citas ?? true),
            'foto' => $cliente->foto_perfil ?? 'https://res.cloudinary.com/dedroug6v/image/upload/v1/usuarios/default.jpg',
        ];


        // 2. Mascotas del Cliente
        $mascotas = Mascota::where('id_cliente', $cliente->id_cliente)->get()->map(function ($mascota) {
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

            // Próxima cita de la mascota
            $proximaCita = Cita::where('id_mascota', $mascota->id_mascota)
                ->where('fecha', '>=', Carbon::today())
                ->orderBy('fecha', 'asc')
                ->orderBy('hora', 'asc')
                ->first();

            $proximaCitaTexto = 'SIN CITAS PROGRAMADAS';
            $estadoSalud = 'ok';

            if ($proximaCita) {
                $fechaCarbon = Carbon::parse($proximaCita->fecha);
                $mesesEs = ['JAN' => 'ENE', 'FEB' => 'FEB', 'MAR' => 'MAR', 'APR' => 'ABR', 'MAY' => 'MAY', 'JUN' => 'JUN', 'JUL' => 'JUL', 'AUG' => 'AGO', 'SEP' => 'SEP', 'OCT' => 'OCT', 'NOV' => 'NOV', 'DEC' => 'DIC'];
                $mesAbrev = strtoupper($fechaCarbon->format('M'));
                $mesAbrevEs = $mesesEs[$mesAbrev] ?? $mesAbrev;
                $proximaCitaTexto = 'PRÓXIMA CITA: ' . $fechaCarbon->format('d') . ' ' . $mesAbrevEs;
            }

            return [
                'id' => $mascota->id_mascota,
                'nombre' => $mascota->nombre,
                'especie' => $mascota->especie ?? 'Mascota',
                'raza' => $mascota->raza ?? 'Desconocida',
                'edad' => $edadTexto,
                'foto' => $mascota->foto_mascota ?? 'https://res.cloudinary.com/dedroug6v/image/upload/v1/mascotas/default_pet.jpg',
                'estado' => $estadoSalud,
                'proximaCita' => $proximaCitaTexto,
            ];
        });

        // 3. Citas del Cliente
        $todasLasCitas = Cita::with(['mascota', 'veterinario', 'estado'])
            ->where('id_cliente', $cliente->id_cliente)
            ->orderBy('fecha', 'asc')
            ->orderBy('hora', 'asc')
            ->get();

        $formatearCita = function ($cita) {
            $fechaCarbon = Carbon::parse($cita->fecha);
            $mesesEs = ['JAN' => 'ENE', 'FEB' => 'FEB', 'MAR' => 'MAR', 'APR' => 'ABR', 'MAY' => 'MAY', 'JUN' => 'JUN', 'JUL' => 'JUL', 'AUG' => 'AGO', 'SEP' => 'SEP', 'OCT' => 'OCT', 'NOV' => 'NOV', 'DEC' => 'DIC'];
            $mesAbrev = strtoupper($fechaCarbon->format('M'));
            $mesAbrevEs = $mesesEs[$mesAbrev] ?? $mesAbrev;

            $horaFormateada = $cita->hora ? Carbon::parse($cita->hora)->format('g:i A') : '10:00 AM';

            $motivoLower = strtolower($cita->motivo ?? '');
            $tipoClase = 'chequeo';
            if (str_contains($motivoLower, 'vacun')) {
                $tipoClase = 'vacunacion';
            } elseif (str_contains($motivoLower, 'urgenc') || str_contains($motivoLower, 'emergen')) {
                $tipoClase = 'urgencia';
            }

            $nombreMascota = $cita->mascota ? $cita->mascota->nombre : 'tu mascota';
            $doctorNombre = $cita->veterinario ? $cita->veterinario->nombre : 'Dra. Laura Martínez';

            return [
                'id' => $cita->id_cita,
                'fechaOriginal' => $cita->fecha,
                'dia' => $fechaCarbon->format('d'),
                'mes' => $mesAbrevEs,
                'hora' => $horaFormateada,
                'tipo' => $cita->motivo ?? 'Consulta General',
                'tipoClase' => $tipoClase,
                'titulo' => ($cita->motivo ?? 'Consulta General') . ' para ' . $nombreMascota,
                'doctor' => $doctorNombre,
                'sede' => 'PetFeliz - Sede Principal',
                'estado' => $cita->estado ? $cita->estado->nombre : 'Programada',
            ];
        };

        $hoy = Carbon::today()->toDateString();

        $proximasCitas = $todasLasCitas->filter(fn($c) => $c->fecha >= $hoy)->values()->map($formatearCita);
        $citasAnteriores = $todasLasCitas->filter(fn($c) => $c->fecha < $hoy)->values()->map($formatearCita);

        return response()->json([
            'usuario' => $perfil,
            'mascotas' => $mascotas,
            'citas' => [
                'proximas' => $proximasCitas,
                'anteriores' => $citasAnteriores,
            ],
        ]);
    }
}
