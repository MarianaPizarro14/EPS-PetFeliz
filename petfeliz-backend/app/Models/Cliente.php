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
        'es_afiliado',
    ];

    protected $casts = [
        'notificaciones_email' => 'boolean',
        'recordatorios_citas' => 'boolean',
        'es_afiliado' => 'boolean',
    ];

    /**
     * Obtener el listado de campos obligatorios faltantes en el perfil del cliente.
     */
    public function getCamposFaltantes(): array
    {
        $camposDef = [
            'nombre' => 'Nombre Completo',
            'cedula' => 'Cédula / Documento de Identidad',
            'telefono' => 'Teléfono de Contacto',
            'direccion' => 'Dirección de Residencia',
            'departamento' => 'Departamento',
            'ciudad' => 'Ciudad / Municipio',
            'contacto_emergencia_nombre' => 'Nombre Contacto de Emergencia',
            'contacto_emergencia_telefono' => 'Teléfono Contacto de Emergencia',
        ];

        $faltantes = [];
        foreach ($camposDef as $columna => $etiqueta) {
            if (empty(trim((string) ($this->$columna ?? '')))) {
                $faltantes[$columna] = $etiqueta;
            }
        }

        return $faltantes;
    }

    /**
     * Evaluar si el perfil del cliente está 100% completo.
     */
    public function esPerfilCompleto(): bool
    {
        return count($this->getCamposFaltantes()) === 0;
    }

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