<?php

namespace Database\Seeders;

use App\Models\Cita;
use App\Models\Cliente;
use App\Models\Mascota;
use App\Models\Pago;
use App\Models\Servicio;
use App\Models\User;
use App\Models\Veterinario;
use Illuminate\Database\Seeder;

class DevScreenshotSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Asegurar Mascota para Cliente 1
        $cliente = Cliente::find(1);
        if (!$cliente) {
            return;
        }

        $mascota = Mascota::where('id_cliente', $cliente->id_cliente)->first();
        if (!$mascota) {
            $mascota = Mascota::create([
                'id_cliente' => $cliente->id_cliente,
                'nombre' => 'Tobias',
                'especie' => 'Canino',
                'raza' => 'Golden Retriever',
                'sexo' => 'Macho',
                'fecha_nacimiento' => '2022-05-15',
                'peso' => '28.5',
            ]);
        }

        $vet = Veterinario::first();
        $servicioVacunacion = Servicio::find(2) ?? Servicio::first();
        $servicioConsulta = Servicio::find(1) ?? Servicio::first();

        // 2. Cita Completada con Fórmula Médica Prescrita (para Captura de PDF)
        $citaCompleta = Cita::updateOrCreate(
            ['id_cita' => 1001],
            [
                'id_cliente' => $cliente->id_cliente,
                'id_mascota' => $mascota->id_mascota,
                'id_veterinario' => $vet ? $vet->id_veterinario : 1,
                'id_servicio' => $servicioConsulta ? $servicioConsulta->id_servicio : 1,
                'id_sede' => 1,
                'fecha' => date('Y-m-d', strtotime('-2 days')),
                'hora' => '10:00:00',
                'motivo' => 'Consulta Médica General y Control de Salud',
                'observacion' => 'Paciente presenta excelente estado de salud general. Signos vitales normales.',
                'medicamentos' => json_encode([
                    [
                        'nombre' => 'Amoxicilina 250mg',
                        'dosis' => '1 tableta',
                        'frecuencia' => 'Cada 12 horas',
                        'duracion' => '7 días',
                        'indicaciones' => 'Administrar junto con el alimento en la mañana y en la noche.'
                    ],
                    [
                        'nombre' => 'Vitamina Canina Senior',
                        'dosis' => '5ml',
                        'frecuencia' => 'Cada 24 horas',
                        'duracion' => '30 días',
                        'indicaciones' => 'Suplemento nutricional.'
                    ]
                ]),
                'id_estado' => 4, // Completada
                'estado_pago' => 'pagado',
                'metodo_pago' => 'eps',
                'monto_pago' => 0.00,
            ]
        );

        // 3. Cita Pendiente en Recepción para Cobro Presencial (para Captura de Recepción y Cambio)
        $citaPendiente = Cita::updateOrCreate(
            ['id_cita' => 1002],
            [
                'id_cliente' => $cliente->id_cliente,
                'id_mascota' => $mascota->id_mascota,
                'id_veterinario' => $vet ? $vet->id_veterinario : 1,
                'id_servicio' => $servicioVacunacion ? $servicioVacunacion->id_servicio : 2,
                'id_sede' => 1, // Sede Laureles
                'fecha' => date('Y-m-d'),
                'hora' => '11:30:00',
                'motivo' => 'Vacunación y Refuerzo Anual',
                'observacion' => 'Paciente agendado en recepción para vacunación.',
                'id_estado' => 1, // Pendiente
                'estado_pago' => 'pendiente',
                'metodo_pago' => 'efectivo_sede',
                'monto_pago' => 20000.00,
            ]
        );
    }
}
