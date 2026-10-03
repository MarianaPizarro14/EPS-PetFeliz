<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Ampliar reserva_temporal para reconstrucción de citas desde Webhook
        Schema::table('reserva_temporal', function (Blueprint $table) {
            if (!Schema::hasColumn('reserva_temporal', 'id_servicio')) {
                $table->unsignedBigInteger('id_servicio')->nullable()->after('id_usuario');
            }
            if (!Schema::hasColumn('reserva_temporal', 'id_mascota')) {
                $table->unsignedBigInteger('id_mascota')->nullable()->after('id_servicio');
            }
            if (!Schema::hasColumn('reserva_temporal', 'id_cliente')) {
                $table->unsignedBigInteger('id_cliente')->nullable()->after('id_mascota');
            }
            if (!Schema::hasColumn('reserva_temporal', 'id_sede')) {
                $table->unsignedBigInteger('id_sede')->nullable()->after('id_cliente');
            }
            if (!Schema::hasColumn('reserva_temporal', 'motivo')) {
                $table->string('motivo', 255)->nullable()->after('id_sede');
            }
            if (!Schema::hasColumn('reserva_temporal', 'referencia_pago')) {
                $table->string('referencia_pago', 100)->nullable()->index()->after('motivo');
            }
            if (!Schema::hasColumn('reserva_temporal', 'es_usada')) {
                $table->boolean('es_usada')->default(false)->after('referencia_pago');
            }
        });

        // 2. Asegurar que tabla pagos tenga índice único en wompi_transaction_id
        Schema::table('pagos', function (Blueprint $table) {
            if (!Schema::hasColumn('pagos', 'wompi_transaction_id')) {
                $table->string('wompi_transaction_id')->nullable()->unique()->after('referencia_transaccion');
            }
        });

        // 3. Proteger la tabla cita contra citas duplicadas activas para el mismo veterinario, fecha y hora
        Schema::table('cita', function (Blueprint $table) {
            if (!Schema::hasColumn('cita', 'slot_activo')) {
                $driver = DB::getDriverName();
                if ($driver === 'sqlite') {
                    $table->string('slot_activo', 150)
                        ->nullable()
                        ->storedAs("CASE WHEN id_estado != 3 THEN (id_veterinario || '_' || fecha || '_' || hora) ELSE NULL END")
                        ->unique();
                } else {
                    // MySQL 5.7+ / 8.0+
                    $table->string('slot_activo', 150)
                        ->nullable()
                        ->storedAs("IF(id_estado != 3, CONCAT(id_veterinario, '_', fecha, '_', hora), NULL)")
                        ->unique();
                }
            }
        });

        // 4. Asegurar que la columna estado en pagos soporte 'requiere_revision'
        if (Schema::hasTable('pagos') && Schema::hasColumn('pagos', 'estado')) {
            $driver = DB::getDriverName();
            if ($driver === 'mysql') {
                try {
                    DB::statement("ALTER TABLE pagos MODIFY COLUMN estado VARCHAR(50) NOT NULL DEFAULT 'confirmado'");
                } catch (\Throwable $e) {}
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('reserva_temporal', function (Blueprint $table) {
            $cols = [];
            if (Schema::hasColumn('reserva_temporal', 'id_servicio')) $cols[] = 'id_servicio';
            if (Schema::hasColumn('reserva_temporal', 'id_mascota')) $cols[] = 'id_mascota';
            if (Schema::hasColumn('reserva_temporal', 'id_cliente')) $cols[] = 'id_cliente';
            if (Schema::hasColumn('reserva_temporal', 'id_sede')) $cols[] = 'id_sede';
            if (Schema::hasColumn('reserva_temporal', 'motivo')) $cols[] = 'motivo';
            if (Schema::hasColumn('reserva_temporal', 'referencia_pago')) $cols[] = 'referencia_pago';
            if (Schema::hasColumn('reserva_temporal', 'es_usada')) $cols[] = 'es_usada';

            if (!empty($cols)) {
                $table->dropColumn($cols);
            }
        });

        Schema::table('cita', function (Blueprint $table) {
            if (Schema::hasColumn('cita', 'slot_activo')) {
                $table->dropColumn('slot_activo');
            }
        });
    }
};
