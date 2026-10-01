<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Sede extends Model
{
    use HasFactory;

    protected $table = 'sede';
    protected $primaryKey = 'id_sede';

    protected $fillable = [
        'nombre',
        'direccion',
        'telefono',
        'es_principal',
        'activo',
    ];

    protected $casts = [
        'es_principal' => 'boolean',
        'activo' => 'boolean',
    ];

    public function recepcionistas()
    {
        return $this->hasMany(Recepcionista::class, 'id_sede', 'id_sede');
    }

    public function veterinarios()
    {
        return $this->hasMany(Veterinario::class, 'id_sede', 'id_sede');
    }

    public function citas()
    {
        return $this->hasMany(Cita::class, 'id_sede', 'id_sede');
    }
}
