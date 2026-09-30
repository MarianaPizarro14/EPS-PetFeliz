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
        if (Schema::hasTable('cita') && !Schema::hasColumn('cita', 'medicamentos')) {
            Schema::table('cita', function (Blueprint $table) {
                $table->json('medicamentos')->nullable()->after('observacion');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('cita') && Schema::hasColumn('cita', 'medicamentos')) {
            Schema::table('cita', function (Blueprint $table) {
                $table->dropColumn('medicamentos');
            });
        }
    }
};
