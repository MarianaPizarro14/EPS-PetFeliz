<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Cliente extends Model
{
    use HasFactory;

    protected $table = 'cliente';
    protected $primaryKey = 'id_cliente';

    protected $fillable = [
        'id_usuario',
        'nombre',
        'telefono',
        'direccion',
        'foto_perfil',
        'cedula',
        'fecha_nacimiento',
        'departamento',
        'ciudad',
        'contacto_emergencia_nombre',
        'contacto_emergencia_telefono',
        'notificaciones_email',
        'recordatorios_citas',
    ];



    public function usuario()
    {
        return $this->belongsTo(User::class, 'id_usuario', 'id_usuario');
    }

    public function mascotas()
    {
        return $this->hasMany(Mascota::class, 'id_cliente', 'id_cliente');
    }

    public function citas()
    {
        return $this->hasMany(Cita::class, 'id_cliente', 'id_cliente');
    }
}