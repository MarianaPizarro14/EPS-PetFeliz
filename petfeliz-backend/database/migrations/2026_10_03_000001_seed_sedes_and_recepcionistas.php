<?php

use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        $sedeSeeder = new \Database\Seeders\SedeSeeder();
        $sedeSeeder->run();

        $recepcionistaSeeder = new \Database\Seeders\RecepcionistaSeeder();
        $recepcionistaSeeder->run();
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // No destructivo para rollback
    }
};
