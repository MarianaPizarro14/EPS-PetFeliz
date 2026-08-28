<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Cita;
use App\Models\Cliente;
use App\Models\Mascota;
use App\Models\Veterinario;
use App\Models\Servicio;
use App\Models\Notificacion;
use App\Services\NotificationService;
use App\Mail\RecordatorioCitaMail;
use Carbon\Carbon;

class EnviarRecordatoriosCitas extends Command
{
    /**
     * El nombre y firma del comando artisan.
     *
     * @var string
     */
    protected $signature = 'petfeliz:enviar-recordatorios-citas';

    /**
     * Descripción del comando.
     *
     * @var string
     */
    protected $description = 'Escanear citas programadas para las próximas 24 horas y enviar notificaciones web + correo de recordatorio.';

    /**
     * Ejecutar el comando.
     */
    public function handle()
    {
        $this->info("Buscando citas programadas para las próximas 24 horas...");

        $mananaStr = Carbon::tomorrow()->toDateString();
        $citasManana = Cita::where('fecha', $mananaStr)
            ->where('id_estado', '!=', 3) // Excluir canceladas
            ->get();

        $enviados = 0;

        foreach ($citasManana as $cita) {
            $cliente = Cliente::find($cita->id_cliente);
            if (!$cliente) continue;

            $tipoNotif = "recordatorio_cita_{$cita->id_cita}";

            // Verificar si ya se le envió el recordatorio para esta cita en particular
            $yaNotificado = Notificacion::where('id_cliente', $cliente->id_cliente)
                ->where('tipo', $tipoNotif)
                ->exists();

            if ($yaNotificado) {
                continue;
            }

            $pet = Mascota::find($cita->id_mascota);
            $vet = Veterinario::find($cita->id_veterinario);
            $srv = Servicio::find($cita->id_servicio);

            $citaData = [
                'mascota' => $pet ? $pet->nombre : 'tu mascota',
                'fecha' => $cita->fecha,
                'hora' => $cita->hora,
                'servicio' => $cita->motivo ?: ($srv ? $srv->nombre : 'Consulta Veterinaria'),
                'veterinario' => $vet ? $vet->nombre : 'Médico Asignado',
                'sede' => 'Sede Principal Laureles (Cl. 33 # 74-20)',
            ];

            NotificationService::notificar(
                $cliente,
                '⏰ Recordatorio de Cita Médica Mañana',
                "Recuerda que mañana tienes una cita veterinaria para {$citaData['mascota']} a las {$citaData['hora']} en {$citaData['sede']}.",
                'fa-regular fa-clock',
                $tipoNotif,
                new RecordatorioCitaMail($cliente, $citaData),
                true // esRecordatorioCita = true
            );

            $enviados++;
            $this->line(" -> Recordatorio enviado a Cliente #{$cliente->id_cliente} ({$cliente->nombre}) para cita #{$cita->id_cita} el {$cita->fecha}");
        }

        $this->info("Proceso completado. Recordatorios enviados: {$enviados}");

        return 0;
    }
}
