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
        Schema::create('servicio', function (Blueprint $table) {
            $table->id('id_servicio');
            $table->string('nombre', 100);
            $table->text('descripcion')->nullable();
            $table->decimal('precio_base', 10, 2)->nullable();
            $table->boolean('activo')->default(true);
            $table->decimal('precio_afiliado', 10, 2)->nullable();
            $table->boolean('incluido_en_plan')->default(false);
            $table->integer('limite_mensual_incluido')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('servicio');
    }
};
