<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class HistoriaCuidador extends Model
{
    use HasFactory;

    protected $table = 'historias_cuidadores';

    protected $fillable = [
        'nombre_cuidador',
        'nombre_mascota',
        'categoria',
        'historia',
        'estado',
    ];

    /**
     * Scope para filtrar únicamente las historias aprobadas.
     */
    public function scopeAprobadas($query)
    {
        return $query->where('estado', 'aprobado');
    }
}
