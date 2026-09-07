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
        if (!Schema::hasColumn('usuario', 'rol')) {
            Schema::table('usuario', function (Blueprint $table) {
                $table->string('rol', 50)->default('cliente')->after('email');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasColumn('usuario', 'rol')) {
            Schema::table('usuario', function (Blueprint $table) {
                $table->dropColumn('rol');
            });
        }
    }
};
