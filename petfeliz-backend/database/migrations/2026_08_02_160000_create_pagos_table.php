<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pagos', function (Blueprint $table) {
            $table->id('id_pago');
            $table->integer('id_cita')->nullable();
            $table->integer('id_cliente');
            $table->decimal('monto', 10, 2)->default(0.00);
            $table->enum('tipo_cobertura', ['eps', 'particular', 'copago'])->default('eps');
            $table->string('metodo_pago')->default('tarjeta');
            $table->enum('estado', ['confirmado', 'fallido', 'reembolsado'])->default('confirmado');
            $table->string('referencia_transaccion')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pagos');
    }
};
