<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (Schema::hasTable('pagos')) {
            Schema::table('pagos', function (Blueprint $table) {
                if (!Schema::hasColumn('pagos', 'monto_recibido')) {
                    $table->decimal('monto_recibido', 10, 2)->nullable()->after('monto');
                }
                if (!Schema::hasColumn('pagos', 'cambio_devuelto')) {
                    $table->decimal('cambio_devuelto', 10, 2)->nullable()->after('monto_recibido');
                }
                if (!Schema::hasColumn('pagos', 'recibido_por')) {
                    $table->unsignedBigInteger('recibido_por')->nullable()->after('cambio_devuelto');
                    $table->foreign('recibido_por')->references('id_usuario')->on('usuario')->onDelete('set null');
                }
                if (!Schema::hasColumn('pagos', 'fecha_recepcion_pago')) {
                    $table->timestamp('fecha_recepcion_pago')->nullable()->after('recibido_por');
                }
                if (!Schema::hasColumn('pagos', 'observacion_pago')) {
                    $table->string('observacion_pago', 255)->nullable()->after('fecha_recepcion_pago');
                }
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('pagos')) {
            Schema::table('pagos', function (Blueprint $table) {
                if (Schema::hasColumn('pagos', 'recibido_por')) {
                    $table->dropForeign(['recibido_por']);
                    $table->dropColumn('recibido_por');
                }
                $table->dropColumn(array_filter([
                    Schema::hasColumn('pagos', 'monto_recibido') ? 'monto_recibido' : null,
                    Schema::hasColumn('pagos', 'cambio_devuelto') ? 'cambio_devuelto' : null,
                    Schema::hasColumn('pagos', 'fecha_recepcion_pago') ? 'fecha_recepcion_pago' : null,
                    Schema::hasColumn('pagos', 'observacion_pago') ? 'observacion_pago' : null,
                ]));
            });
        }
    }
};
