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
        if (Schema::hasTable('notificacion')) {
            Schema::table('notificacion', function (Blueprint $table) {
                if (!Schema::hasColumn('notificacion', 'id_usuario')) {
                    $table->unsignedBigInteger('id_usuario')->nullable()->after('id_cliente')->index();
                }
            });

            // Permitir id_cliente nullable si la notificación va dirigida a un admin sin cliente
            Schema::table('notificacion', function (Blueprint $table) {
                $table->integer('id_cliente')->nullable()->change();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('notificacion')) {
            Schema::table('notificacion', function (Blueprint $table) {
                if (Schema::hasColumn('notificacion', 'id_usuario')) {
                    $table->dropColumn('id_usuario');
                }
            });
        }
    }
};
