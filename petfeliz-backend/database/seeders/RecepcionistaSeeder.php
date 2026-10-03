<?php

namespace Database\Seeders;

use App\Models\Recepcionista;
use App\Models\Sede;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class RecepcionistaSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // 1. Obtener Sedes activas
        $sedeLaureles = Sede::where('nombre', 'LIKE', '%Laureles%')->first();
        $sedeBello = Sede::where('nombre', 'LIKE', '%Bello%')->first();
        $sedeItagui = Sede::where('nombre', 'LIKE', '%Itag%')->first();

        $idLaureles = $sedeLaureles ? $sedeLaureles->id_sede : 1;
        $idBello = $sedeBello ? $sedeBello->id_sede : 2;
        $idItagui = $sedeItagui ? $sedeItagui->id_sede : 3;

        // 2. Definición de los 6 recepcionistas (2 por sede)
        $recepcionistas = [
            [
                'nombre' => 'Luisa Fernanda Restrepo',
                'email' => 'recepcion.itagui.1@petfeliz.com',
                'telefono' => '3104567812',
                'id_sede' => $idItagui,
                'sede_nombre' => $sedeItagui->nombre ?? 'Itagüí',
            ],
            [
                'nombre' => 'Camila Andrea Zapata',
                'email' => 'recepcion.itagui.2@petfeliz.com',
                'telefono' => '3115678923',
                'id_sede' => $idItagui,
                'sede_nombre' => $sedeItagui->nombre ?? 'Itagüí',
            ],
            [
                'nombre' => 'Valentina Ospina Cardona',
                'email' => 'recepcion.laureles.1@petfeliz.com',
                'telefono' => '3126789034',
                'id_sede' => $idLaureles,
                'sede_nombre' => $sedeLaureles->nombre ?? 'Laureles',
            ],
            [
                'nombre' => 'Santiago Giraldo Mejía',
                'email' => 'recepcion.laureles.2@petfeliz.com',
                'telefono' => '3137890145',
                'id_sede' => $idLaureles,
                'sede_nombre' => $sedeLaureles->nombre ?? 'Laureles',
            ],
            [
                'nombre' => 'Daniela Marín Arango',
                'email' => 'recepcion.bello.1@petfeliz.com',
                'telefono' => '3148901256',
                'id_sede' => $idBello,
                'sede_nombre' => $sedeBello->nombre ?? 'Bello',
            ],
            [
                'nombre' => 'Juan David Hoyos Londoño',
                'email' => 'recepcion.bello.2@petfeliz.com',
                'telefono' => '3159012367',
                'id_sede' => $idBello,
                'sede_nombre' => $sedeBello->nombre ?? 'Bello',
            ],
        ];

        // 3. Obtener o generar la contraseña temporal (12+ caracteres)
        $rawTempPass = env('SEED_RECEPCION_PASSWORD');
        $tempPassword = (!empty($rawTempPass) && strlen(trim($rawTempPass)) >= 8)
            ? trim($rawTempPass)
            : ('Recep2026!' . Str::random(6));

        $tempPasswordHash = Hash::make($tempPassword);

        // Lista de correos oficiales para limpiar/desactivar cuentas de prueba huérfanas previas
        $validEmails = array_column($recepcionistas, 'email');
        User::where('rol', 'recepcionista')
            ->whereNotIn('email', $validEmails)
            ->each(function ($oldUser) {
                Recepcionista::where('id_usuario', $oldUser->id_usuario)->delete();
                $oldUser->tokens()->delete();
                $oldUser->delete();
            });

        $tableRows = [];

        // 4. Crear o actualizar de forma IDEMPOTENTE
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

            $tableRows[] = [
                $data['nombre'],
                $data['email'],
                $data['sede_nombre'] . " (ID: {$data['id_sede']})",
                $data['telefono'],
                $tempPassword,
            ];
        }

        if ($this->command) {
            $this->command->info('=== RECEPCIONISTAS PETFELIZ REGISTRADOS EXITOSAMENTE ===');
            $this->command->table(['Nombre', 'Correo', 'Sede', 'Teléfono', 'Contraseña Temporal'], $tableRows);
        }
    }
}
