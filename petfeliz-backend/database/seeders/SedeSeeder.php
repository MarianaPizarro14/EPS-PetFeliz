<?php

namespace Database\Seeders;

use App\Models\Sede;
use Illuminate\Database\Seeder;

class SedeSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        Sede::updateOrCreate(
            ['nombre' => 'Laureles'],
            [
                'direccion' => null,
                'telefono' => null,
                'es_principal' => true,
                'activo' => true,
            ]
        );

        Sede::updateOrCreate(
            ['nombre' => 'Bello'],
            [
                'direccion' => null,
                'telefono' => null,
                'es_principal' => false,
                'activo' => true,
            ]
        );

        Sede::updateOrCreate(
            ['nombre' => 'Itagüí'],
            [
                'direccion' => null,
                'telefono' => null,
                'es_principal' => false,
                'activo' => true,
            ]
        );

        if ($this->command) {
            $this->command->info('Sedes creadas/actualizadas exitosamente: Laureles (Principal), Bello e Itagüí.');
        }
    }
}
