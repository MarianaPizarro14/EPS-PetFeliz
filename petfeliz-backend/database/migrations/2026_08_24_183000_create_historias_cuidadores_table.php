<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('historias_cuidadores', function (Blueprint $table) {
            $table->id();
            $table->string('nombre_cuidador', 100);
            $table->string('nombre_mascota', 100);
            $table->string('categoria', 100);
            $table->text('historia');
            $table->enum('estado', ['pendiente', 'aprobado', 'rechazado'])->default('pendiente');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('historias_cuidadores');
    }
};
