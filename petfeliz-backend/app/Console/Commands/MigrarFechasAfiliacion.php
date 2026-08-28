<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Cliente;
use App\Models\Pago;

class MigrarFechasAfiliacion extends Command
{
    /**
     * El nombre y firma del comando artisan.
     *
     * @var string
     */
    protected $signature = 'petfeliz:migrar-fechas-afiliacion';

    /**
     * Descripción del comando.
     *
     * @var string
     */
    protected $description = 'Calcular y asignar retroactivamente la fecha de afiliación real de los clientes basándose en su primer pago confirmado.';

    /**
     * Ejecutar el comando.
     */
    public function handle()
    {
        $this->info('Iniciando proceso de migración de fechas de afiliación...');

        $clientes = Cliente::all();
        $actualizados = 0;
        $sinPagoList = [];

        foreach ($clientes as $cliente) {
            if (!empty($cliente->fecha_afiliacion)) {
                // Ya tiene fecha asignada
                continue;
            }

            // Buscar el primer pago confirmado del cliente
            $primerPago = Pago::where('id_cliente', $cliente->id_cliente)
                ->where('estado', 'confirmado')
                ->orderBy('created_at', 'asc')
                ->orderBy('id_pago', 'asc')
                ->first();

            if ($primerPago && $primerPago->created_at) {
                $fechaReal = $primerPago->created_at->format('Y-m-d');
                $cliente->fecha_afiliacion = $fechaReal;
                $cliente->save();
                $actualizados++;
                $this->line(" -> Cliente #{$cliente->id_cliente} ({$cliente->nombre}): Fecha de afiliación asignada al {$fechaReal} (Pago ID: #{$primerPago->id_pago})");
            } else {
                $sinPagoList[] = [
                    'id_cliente' => $cliente->id_cliente,
                    'nombre' => $cliente->nombre,
                    'cedula' => $cliente->cedula ?? 'SIN CÉDULA',
                    'fecha_registro_usuario' => $cliente->created_at ? $cliente->created_at->format('Y-m-d') : 'N/A',
                ];
            }
        }

        $this->info("==========================================");
        $this->info("Migración completada. Clientes actualizados: {$actualizados}");

        if (count($sinPagoList) > 0) {
            $this->warn("Atención: Los siguientes " . count($sinPagoList) . " clientes NO tienen ningún pago confirmado registrado. Su fecha_afiliacion permanece en NULL:");
            $this->table(['ID Cliente', 'Nombre', 'Cédula / Documento', 'Fecha Registro Cuenta'], $sinPagoList);
        } else {
            $this->info("¡Todos los clientes registrados tenían al menos un pago y fueron actualizados exitosamente!");
        }

        return 0;
    }
}
