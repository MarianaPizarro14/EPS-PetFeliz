<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminUserSeeder extends Seeder
{
    /**
     * Seed the admin user into the database.
     */
    public function run(): void
    {
        $adminEmail = config('services.admin.email', 'admin@petfeliz.com');
        $initialPassword = config('services.admin.initial_password');

        if (empty($initialPassword)) {
            $this->command?->warn('ADMIN_INITIAL_PASSWORD no está definida. Omitiendo la creación del usuario administrador.');
            return;
        }

        $existingAdmin = User::where('email', $adminEmail)->first();

        if (!$existingAdmin) {
            User::create([
                'email' => $adminEmail,
                'contrasena_hash' => Hash::make($initialPassword),
                'rol' => 'admin',
                'activo' => 1,
            ]);
            $this->command?->info("Usuario administrador {$adminEmail} creado exitosamente.");
        } else {
            $this->command?->info("El usuario administrador {$adminEmail} ya existe. No se modificó la contraseña.");
        }
    }
}
