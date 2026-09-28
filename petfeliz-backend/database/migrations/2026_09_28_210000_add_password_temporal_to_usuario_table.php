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
        if (!Schema::hasColumn('usuario', 'password_temporal')) {
            Schema::table('usuario', function (Blueprint $table) {
                $table->boolean('password_temporal')->default(false)->after('contrasena_hash');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasColumn('usuario', 'password_temporal')) {
            Schema::table('usuario', function (Blueprint $table) {
                $table->dropColumn('password_temporal');
            });
        }
    }
};
