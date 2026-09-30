<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('cita', function (Blueprint $table) {
            if (!Schema::hasColumn('cita', 'metodo_pago')) {
                $table->string('metodo_pago', 100)->nullable()->default('Pago en línea')->after('medicamentos');
            }
            if (!Schema::hasColumn('cita', 'estado_pago')) {
                $table->string('estado_pago', 50)->default('pendiente')->after('metodo_pago');
            }
            if (!Schema::hasColumn('cita', 'monto_pago')) {
                $table->decimal('monto_pago', 10, 2)->nullable()->after('estado_pago');
            }
        });

        // Migración de datos: citas con texto de pago en observaciones
        DB::table('cita')
            ->where(function ($q) {
                $q->where('observacion', 'like', '%pago%')
                  ->orWhere('observacion', 'like', '%wompi%')
                  ->orWhere('observacion', 'like', '%confirmado%')
                  ->orWhere('observacion', 'like', '%verificado%');
            })
            ->update([
                'metodo_pago' => 'Pago en línea',
                'estado_pago' => 'pagado',
                'observacion' => null,
            ]);

        // Citas ya finalizadas/completadas (estado 4) deben figurar como pagadas por defecto
        DB::table('cita')
            ->where('id_estado', 4)
            ->where('estado_pago', 'pendiente')
            ->update([
                'estado_pago' => 'pagado',
            ]);

        // Sincronizar desde la tabla pagos si existen registros asociados
        if (Schema::hasTable('pagos')) {
            $pagos = DB::table('pagos')->whereNotNull('id_cita')->get();
            foreach ($pagos as $p) {
                DB::table('cita')
                    ->where('id_cita', $p->id_cita)
                    ->update([
                        'metodo_pago' => $p->metodo_pago ?? 'Pago en línea',
                        'estado_pago' => ($p->estado === 'confirmado') ? 'pagado' : 'pendiente',
                        'monto_pago' => $p->monto ?? null,
                    ]);
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('cita', function (Blueprint $table) {
            $columnsToDrop = [];
            if (Schema::hasColumn('cita', 'metodo_pago')) $columnsToDrop[] = 'metodo_pago';
            if (Schema::hasColumn('cita', 'estado_pago')) $columnsToDrop[] = 'estado_pago';
            if (Schema::hasColumn('cita', 'monto_pago')) $columnsToDrop[] = 'monto_pago';

            if (!empty($columnsToDrop)) {
                $table->dropColumn($columnsToDrop);
            }
        });
    }
};
