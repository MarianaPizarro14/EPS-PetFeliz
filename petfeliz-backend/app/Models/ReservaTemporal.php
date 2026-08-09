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
        'token_reserva',
        'expires_at',
    ];

    protected $casts = [
        'expires_at' => 'datetime',
    ];

    public function usuario()
    {
        return $this->belongsTo(User::class, 'id_usuario', 'id_usuario');
    }

    public function veterinario()
    {
        return $this->belongsTo(Veterinario::class, 'id_veterinario', 'id_veterinario');
    }
}
