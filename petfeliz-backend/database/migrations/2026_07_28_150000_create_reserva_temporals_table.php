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
        Schema::create('reserva_temporal', function (Blueprint $table) {
            $table->id('id_reserva');
            $table->integer('id_veterinario');
            $table->date('fecha');
            $table->string('hora', 20);
            $table->unsignedBigInteger('id_usuario');
            $table->string('token_reserva', 100)->unique();
            $table->timestamp('expires_at');
            $table->timestamps();

            $table->index(['id_veterinario', 'fecha', 'hora']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('reserva_temporal');
    }
};
