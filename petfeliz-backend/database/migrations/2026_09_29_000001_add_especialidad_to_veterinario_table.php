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
        if (Schema::hasTable('veterinario') && !Schema::hasColumn('veterinario', 'especialidad')) {
            Schema::table('veterinario', function (Blueprint $table) {
                $table->string('especialidad', 150)->nullable()->after('nombre');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('veterinario') && Schema::hasColumn('veterinario', 'especialidad')) {
            Schema::table('veterinario', function (Blueprint $table) {
                $table->dropColumn('especialidad');
            });
        }
    }
};
