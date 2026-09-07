<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class EstadoCitaSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        DB::table('estado_cita')->insertOrIgnore([
            ['id_estado' => 1, 'nombre' => 'Pendiente'],
            ['id_estado' => 2, 'nombre' => 'Confirmada'],
            ['id_estado' => 3, 'nombre' => 'Cancelada'],
            ['id_estado' => 4, 'nombre' => 'Completada'],
        ]);
    }
}
