<?php

namespace Database\Seeders;

use App\Models\Recepcionista;
use App\Models\Sede;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class RecepcionistaSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // 1. Desactivar usuario de prueba previo si existe
        User::where('email', 'recepcion@petfeliz.com')->update(['activo' => false]);

        // 2. Obtener IDs de Sedes
        $sedeLaureles = Sede::where('nombre', 'Laureles')->first();
        $sedeBello = Sede::where('nombre', 'Bello')->first();
        $sedeItagui = Sede::where('nombre', 'Itagüí')->first();

        $recepcionistas = [
            // Sede Laureles
            [
                'email' => 'dayanna.echavarria@petfeliz.com',
                'nombre' => 'Dayanna Echavarría',
                'telefono' => '3001001001',
                'id_sede' => $sedeLaureles->id_sede ?? null,
            ],
            [
                'email' => 'sergio.bedoya@petfeliz.com',
                'nombre' => 'Sergio Bedoya',
                'telefono' => '3001001002',
                'id_sede' => $sedeLaureles->id_sede ?? null,
            ],
            // Sede Bello
            [
                'email' => 'yurany.zapata@petfeliz.com',
                'nombre' => 'Yurany Zapata',
                'telefono' => '3002002001',
                'id_sede' => $sedeBello->id_sede ?? null,
            ],
            [
                'email' => 'simon.mesa@petfeliz.com',
                'nombre' => 'Simón Mesa',
                'telefono' => '3002002002',
                'id_sede' => $sedeBello->id_sede ?? null,
            ],
            // Sede Itagüí
            [
                'email' => 'vanessa.cardona@petfeliz.com',
                'nombre' => 'Vanessa Cardona',
                'telefono' => '3003003001',
                'id_sede' => $sedeItagui->id_sede ?? null,
            ],
            [
                'email' => 'natalia.franco@petfeliz.com',
                'nombre' => 'Natalia Franco',
                'telefono' => '3003003002',
                'id_sede' => $sedeItagui->id_sede ?? null,
            ],
        ];

        $tempPasswordHash = Hash::make('PetRecep2026#');

        foreach ($recepcionistas as $data) {
            $user = User::updateOrCreate(
                ['email' => $data['email']],
                [
                    'contrasena_hash' => $tempPasswordHash,
                    'rol' => 'recepcionista',
                    'activo' => true,
                    'password_temporal' => true,
                ]
            );

            Recepcionista::updateOrCreate(
                ['id_usuario' => $user->id_usuario],
                [
                    'id_sede' => $data['id_sede'],
                    'nombre' => $data['nombre'],
                    'telefono' => $data['telefono'],
                    'foto_perfil' => 'https://res.cloudinary.com/dedroug6v/image/upload/v1783709702/recepcionista_default.jpg',
                ]
            );
        }

        $this->command->info('6 usuarios Recepcionistas creados/actualizados exitosamente con sus sedes correspondientes.');
    }
}
