<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('mascota', function (Blueprint $table) {
            $table->string('sexo', 20)->nullable()->after('raza');
            $table->decimal('peso', 5, 2)->nullable()->after('fecha_nacimiento');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('mascota', function (Blueprint $table) {
            $table->dropColumn(['sexo', 'peso']);
        });
    }
};
