<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Cita extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'cita';
    protected $primaryKey = 'id_cita';

    protected $fillable = [
        'fecha',
        'hora',
        'motivo',
        'id_servicio',
        'id_estado',
        'observacion',
        'id_cliente',
        'id_mascota',
        'id_veterinario',
    ];

    public function cliente()
    {
        return $this->belongsTo(Cliente::class, 'id_cliente', 'id_cliente');
    }

    public function mascota()
    {
        return $this->belongsTo(Mascota::class, 'id_mascota', 'id_mascota');
    }

    public function servicio()
    {
        return $this->belongsTo(Servicio::class, 'id_servicio', 'id_servicio');
    }

    public function veterinario()
    {
        return $this->belongsTo(Veterinario::class, 'id_veterinario', 'id_veterinario');
    }

    public function estado()
    {
        return $this->belongsTo(EstadoCita::class, 'id_estado', 'id_estado');
    }
}
