<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ReservaTemporal extends Model
{
    use HasFactory;

    protected $table = 'reserva_temporal';
    protected $primaryKey = 'id_reserva';

    protected $fillable = [
        'id_veterinario',
        'fecha',
        'hora',
        'id_usuario',
        'id_servicio',
        'id_mascota',
        'id_cliente',
        'id_sede',
        'motivo',
        'referencia_pago',
        'es_usada',
        'token_reserva',
        'expires_at',
    ];

    protected $casts = [
        'expires_at' => 'datetime',
        'es_usada' => 'boolean',
    ];

    /**
     * Limpieza controlada de reservas temporales:
     * - Reservas abandonadas sin referencia de pago: eliminadas tras expirar.
     * - Reservas con referencia de pago (proceso de pasarela iniciado): conservadas durante al menos 24 horas.
     */
    public static function limpiarExpiradas(): void
    {
        // 1. Eliminar reservas sin referencia de pago que hayan expirado
        self::whereNull('referencia_pago')
            ->where('expires_at', '<', now())
            ->delete();

        // 2. Eliminar cualquier reserva que tenga más de 24 horas de antigüedad
        self::where('created_at', '<', now()->subHours(24))
            ->delete();
    }

    public function usuario()
    {
        return $this->belongsTo(User::class, 'id_usuario', 'id_usuario');
    }

    public function veterinario()
    {
        return $this->belongsTo(Veterinario::class, 'id_veterinario', 'id_veterinario');
    }

    public function servicio()
    {
        return $this->belongsTo(Servicio::class, 'id_servicio', 'id_servicio');
    }

    public function mascota()
    {
        return $this->belongsTo(Mascota::class, 'id_mascota', 'id_mascota');
    }

    public function cliente()
    {
        return $this->belongsTo(Cliente::class, 'id_cliente', 'id_cliente');
    }

    public function sede()
    {
        return $this->belongsTo(Sede::class, 'id_sede', 'id_sede');
    }
}
