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
        if (!Schema::hasColumn('mascota', 'alergias')) {
            Schema::table('mascota', function (Blueprint $table) {
                $table->text('alergias')->nullable()->after('peso');
                $table->text('vacunas')->nullable()->after('alergias');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasColumn('mascota', 'alergias')) {
            Schema::table('mascota', function (Blueprint $table) {
                $table->dropColumn(['alergias', 'vacunas']);
            });
        }
    }
};
