<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Recepcionista extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'recepcionista';
    protected $primaryKey = 'id_recepcionista';

    protected $fillable = [
        'id_usuario',
        'id_sede',
        'nombre',
        'telefono',
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
