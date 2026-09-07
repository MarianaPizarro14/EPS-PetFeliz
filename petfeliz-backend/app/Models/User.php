<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use App\Models\Cliente;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $table = 'usuario';
    protected $primaryKey = 'id_usuario';

    protected $fillable = [
        'email',
        'contrasena_hash',
        'rol',
        'activo',
        'token_reset',
        'token_reset_expira',
    ];

    public function isAdmin(): bool
    {
        return $this->rol === 'admin';
    }

    protected $hidden = [
        'contrasena_hash',
        'token_reset',
    ];

    protected function casts(): array
    {
        return [
            'activo' => 'boolean',
            'token_reset_expira' => 'datetime',
        ];
    }

    // Le dice a Laravel que la "contraseña" real está en esta columna
    public function getAuthPassword()
    {
        return $this->contrasena_hash;
    }

    public function cliente()
{
    return $this->hasOne(Cliente::class, 'id_usuario', 'id_usuario');
}

}