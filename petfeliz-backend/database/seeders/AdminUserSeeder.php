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
        User::updateOrCreate(
            ['email' => 'admin@petfeliz.com'],
            [
                'contrasena_hash' => Hash::make('Admin2026*'),
                'rol' => 'admin',
                'activo' => 1,
            ]
        );
    }
}
