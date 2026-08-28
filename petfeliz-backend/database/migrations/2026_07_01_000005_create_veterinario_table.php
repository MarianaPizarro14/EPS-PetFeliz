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
        Schema::create('veterinario', function (Blueprint $table) {
            $table->id('id_veterinario');
            $table->unsignedBigInteger('id_usuario')->unique();
            $table->foreign('id_usuario')->references('id_usuario')->on('usuario')->onDelete('cascade');
            $table->integer('id_sucursal')->default(1);
            $table->string('nombre', 100);
            $table->string('telefono', 20)->nullable();
            $table->string('numero_tarjeta', 50)->nullable();
            $table->string('foto_perfil', 255)->nullable();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('veterinario');
    }
};
