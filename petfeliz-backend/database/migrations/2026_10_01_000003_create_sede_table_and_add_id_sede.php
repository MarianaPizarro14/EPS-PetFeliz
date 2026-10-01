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
        if (!Schema::hasTable('sede')) {
            Schema::create('sede', function (Blueprint $table) {
                $table->id('id_sede');
                $table->string('nombre', 100)->unique();
                $table->string('direccion', 255)->nullable();
                $table->string('telefono', 20)->nullable();
                $table->boolean('es_principal')->default(false);
                $table->boolean('activo')->default(true);
                $table->timestamps();
            });
        }

        if (Schema::hasTable('recepcionista') && !Schema::hasColumn('recepcionista', 'id_sede')) {
            Schema::table('recepcionista', function (Blueprint $table) {
                $table->unsignedBigInteger('id_sede')->nullable()->after('id_usuario');
                $table->foreign('id_sede')->references('id_sede')->on('sede')->onDelete('set null');
            });
        }

        if (Schema::hasTable('cita') && !Schema::hasColumn('cita', 'id_sede')) {
            Schema::table('cita', function (Blueprint $table) {
                $table->unsignedBigInteger('id_sede')->nullable()->after('id_veterinario');
                $table->foreign('id_sede')->references('id_sede')->on('sede')->onDelete('set null');
            });
        }

        if (Schema::hasTable('veterinario') && !Schema::hasColumn('veterinario', 'id_sede')) {
            Schema::table('veterinario', function (Blueprint $table) {
                $table->unsignedBigInteger('id_sede')->nullable()->after('id_usuario');
                $table->foreign('id_sede')->references('id_sede')->on('sede')->onDelete('set null');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('veterinario') && Schema::hasColumn('veterinario', 'id_sede')) {
            Schema::table('veterinario', function (Blueprint $table) {
                $table->dropForeign(['id_sede']);
                $table->dropColumn('id_sede');
            });
        }

        if (Schema::hasTable('cita') && Schema::hasColumn('cita', 'id_sede')) {
            Schema::table('cita', function (Blueprint $table) {
                $table->dropForeign(['id_sede']);
                $table->dropColumn('id_sede');
            });
        }

        if (Schema::hasTable('recepcionista') && Schema::hasColumn('recepcionista', 'id_sede')) {
            Schema::table('recepcionista', function (Blueprint $table) {
                $table->dropForeign(['id_sede']);
                $table->dropColumn('id_sede');
            });
        }

        Schema::dropIfExists('sede');
    }
};
