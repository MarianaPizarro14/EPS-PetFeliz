<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Veterinario;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class ResetVetPasswords extends Command
{
    /**
     * El nombre y firma del comando artisan.
     *
     * @var string
     */
    protected $signature = 'petfeliz:reset-vet-passwords';

    /**
     * Descripción del comando.
     *
     * @var string
     */
    protected $description = 'Resetear de forma masiva las contraseñas de los usuarios veterinarios a un formato legible (Vet#XXXX) e imprimir la tabla completa de credenciales.';

    /**
     * Ejecutar el comando.
     */
    public function handle()
    {
        $this->info("Iniciando reseteo masivo de contraseñas de veterinarios...");

        $vets = Veterinario::with('usuario')->orderBy('id_veterinario', 'asc')->get();

        if ($vets->isEmpty()) {
            $this->warn("No se encontraron registros de veterinarios en la base de datos.");
            return Command::FAILURE;
        }

        $tableData = [];

        foreach ($vets as $vet) {
            $user = $vet->usuario;
            $tempPassword = 'Vet#' . str_pad($vet->id_veterinario, 4, '0', STR_PAD_LEFT);

            if (!$user) {
                $email = 'vet_' . $vet->id_veterinario . '@petfeliz.com';
                $user = User::create([
                    'email' => $email,
                    'contrasena_hash' => Hash::make($tempPassword),
                    'rol' => 'veterinario',
                    'activo' => 1,
                ]);
                $vet->id_usuario = $user->id_usuario;
                $vet->save();
            } else {
                $user->contrasena_hash = Hash::make($tempPassword);
                $user->rol = 'veterinario';
                $user->activo = 1;
                $user->save();
            }

            $tableData[] = [
                'ID' => $vet->id_veterinario,
                'Nombre' => $vet->nombre,
                'Correo (Usuario)' => $user->email,
                'Contraseña Temporal' => $tempPassword,
            ];
        }

        $this->info("\n=== LISTADO COMPLETO DE CREDENCIALES DE VETERINARIOS ===");
        $this->table(
            ['ID Vet', 'Nombre', 'Correo (Usuario)', 'Contraseña Temporal'],
            $tableData
        );

        $this->info("\nReseteo masivo completado exitosamente para " . count($tableData) . " veterinarios.");
        return Command::SUCCESS;
    }
}
