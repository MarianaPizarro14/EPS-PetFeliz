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
        Schema::create('cita', function (Blueprint $table) {
            $table->id('id_cita');
            $table->date('fecha');
            $table->time('hora');
            $table->text('motivo')->nullable();
            $table->unsignedBigInteger('id_estado');
            $table->foreign('id_estado')->references('id_estado')->on('estado_cita');
            $table->text('observacion')->nullable();
            $table->unsignedBigInteger('id_cliente');
            $table->foreign('id_cliente')->references('id_cliente')->on('cliente')->onDelete('cascade');
            $table->unsignedBigInteger('id_mascota');
            $table->foreign('id_mascota')->references('id_mascota')->on('mascota')->onDelete('cascade');
            $table->unsignedBigInteger('id_veterinario');
            $table->foreign('id_veterinario')->references('id_veterinario')->on('veterinario');
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('cita');
    }
};
