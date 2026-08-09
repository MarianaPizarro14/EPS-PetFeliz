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
        Schema::table('cliente', function (Blueprint $table) {
            $table->string('cedula', 50)->nullable()->after('nombre');
            $table->date('fecha_nacimiento')->nullable()->after('cedula');
            $table->string('ciudad', 100)->nullable()->after('direccion');
            $table->string('contacto_emergencia_nombre', 150)->nullable()->after('ciudad');
            $table->string('contacto_emergencia_telefono', 50)->nullable()->after('contacto_emergencia_nombre');
            $table->boolean('notificaciones_email')->default(true)->after('contacto_emergencia_telefono');
            $table->boolean('recordatorios_citas')->default(true)->after('notificaciones_email');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('cliente', function (Blueprint $table) {
            $table->dropColumn([
                'cedula',
                'fecha_nacimiento',
                'ciudad',
                'contacto_emergencia_nombre',
                'contacto_emergencia_telefono',
                'notificaciones_email',
                'recordatorios_citas',
            ]);
        });
    }
};
