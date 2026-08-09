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
        'nombre',
        'telefono',
        'numero_tarjeta',
        'foto_perfil',
    ];

    public function usuario()
    {
        return $this->belongsTo(User::class, 'id_usuario', 'id_usuario');
    }
}
