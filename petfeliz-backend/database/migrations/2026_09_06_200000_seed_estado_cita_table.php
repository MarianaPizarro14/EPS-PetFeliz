<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        DB::table('estado_cita')->insertOrIgnore([
            ['id_estado' => 1, 'nombre' => 'Pendiente'],
            ['id_estado' => 2, 'nombre' => 'Confirmada'],
            ['id_estado' => 3, 'nombre' => 'Cancelada'],
            ['id_estado' => 4, 'nombre' => 'Completada'],
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::table('estado_cita')->whereIn('id_estado', [1, 2, 3, 4])->delete();
    }
};
