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
        Schema::table('cita', function (Blueprint $table) {
            if (!Schema::hasColumn('cita', 'id_servicio')) {
                $table->integer('id_servicio')->nullable()->after('motivo');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('cita', function (Blueprint $table) {
            if (Schema::hasColumn('cita', 'id_servicio')) {
                $table->dropColumn('id_servicio');
            }
        });
    }
};
