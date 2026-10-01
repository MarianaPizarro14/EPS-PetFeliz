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
        if (!Schema::hasTable('recepcionista')) {
            Schema::create('recepcionista', function (Blueprint $table) {
                $table->id('id_recepcionista');
                $table->unsignedBigInteger('id_usuario')->nullable();
                $table->foreign('id_usuario')->references('id_usuario')->on('usuario')->onDelete('cascade');
                $table->string('nombre', 150);
                $table->string('telefono', 20)->nullable();
                $table->string('foto_perfil', 255)->nullable();
                $table->timestamps();
                $table->softDeletes();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('recepcionista');
    }
};
