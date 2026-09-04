<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Cliente;
use App\Services\NotificationService;
use Carbon\Carbon;

class VerificarAfiliacionesVencidas extends Command
{
    /**
     * El nombre y firma del comando artisan.
     *
     * @var string
     */
    protected $signature = 'petfeliz:verificar-afiliaciones-vencidas';

    /**
     * Descripción del comando.
     *
     * @var string
     */
    protected $description = 'Verificar la fecha de vencimiento y mes de gracia de clientes afiliados. Desafiliar automáticamente a quienes superaron el mes de gracia.';

    /**
     * Ejecutar el comando.
     */
    public function handle()
    {
        $this->info("Verificando estado de mora y vigencia de afiliaciones...");

        $clientesAfiliados = Cliente::where('es_afiliado', true)->get();
        $desafiliadosCount = 0;
        $moraCount = 0;

        foreach ($clientesAfiliados as $cliente) {
            $estado = $cliente->estado_afiliacion;

            if ($estado === 'desafiliado') {
                $cliente->es_afiliado = false;
                $cliente->save();
                $desafiliadosCount++;

                $this->warn("Cliente ID {$cliente->id_cliente} ({$cliente->nombre}) ha sido desafiliado por superar el mes de gracia.");

                NotificationService::notificar(
                    $cliente,
                    'Plan EPS Desactivado',
                    'Tu afiliación a EPS PetFeliz ha sido desactivada por superar el periodo límite de gracia. Puedes afiliarte nuevamente cuando desees.',
                    'fa-solid fa-circle-exclamation',
                    'afiliacion'
                );
            } elseif ($estado === 'en_mora') {
                $moraCount++;
                $dias = $cliente->dias_mora;
                $this->line("Cliente ID {$cliente->id_cliente} ({$cliente->nombre}) se encuentra en MORA ({$dias} días de mora).");
            }
        }

        $this->info("Proceso completado: {$desafiliadosCount} clientes desafiliados, {$moraCount} clientes en estado de mora.");
        return Command::SUCCESS;
    }
}
