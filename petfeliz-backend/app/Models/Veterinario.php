<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Veterinario extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'veterinario';
    protected $primaryKey = 'id_veterinario';

    protected $fillable = [
        'id_usuario',
        'id_sede',
        'nombre',
        'especialidad',
        'telefono',
        'numero_tarjeta',
        'foto_perfil',
    ];

    public function usuario()
    {
        return $this->belongsTo(User::class, 'id_usuario', 'id_usuario');
    }

    public function sede()
    {
        return $this->belongsTo(Sede::class, 'id_sede', 'id_sede');
    }
}
