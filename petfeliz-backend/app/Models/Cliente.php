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
        'fecha_afiliacion',
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
        'fecha_afiliacion' => 'date',
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

    /**
     * Obtener el último pago confirmado de afiliación.
     */
    public function ultimoPagoAfiliacion()
    {
        return Pago::where('id_cliente', $this->id_cliente)
            ->where('tipo_cobertura', 'afiliacion')
            ->where('estado', 'confirmado')
            ->orderBy('created_at', 'desc')
            ->first();
    }

    /**
     * Obtener la fecha de último pago o alta.
     */
    public function getFechaUltimoPagoAttribute()
    {
        $ultimoPago = $this->ultimoPagoAfiliacion();
        if ($ultimoPago && $ultimoPago->created_at) {
            return $ultimoPago->created_at->format('Y-m-d');
        }
        return $this->fecha_afiliacion ? $this->fecha_afiliacion->format('Y-m-d') : date('Y-m-d');
    }

    /**
     * Calcular fecha de vencimiento (1 mes después del último pago).
     */
    public function getFechaVencimientoAttribute()
    {
        $fechaBase = $this->fecha_ultimo_pago ? \Carbon\Carbon::parse($this->fecha_ultimo_pago) : \Carbon\Carbon::now();
        return $fechaBase->copy()->addMonth()->format('Y-m-d');
    }

    /**
     * Calcular fecha límite del mes de gracia (1 mes después de fecha_vencimiento).
     */
    public function getFechaLimiteGraciaAttribute()
    {
        $vencimiento = \Carbon\Carbon::parse($this->fecha_vencimiento);
        return $vencimiento->copy()->addMonth()->format('Y-m-d');
    }

    /**
     * Estado de la afiliación: 'al_dia', 'en_mora', 'desafiliado'
     */
    public function getEstadoAfiliacionAttribute()
    {
        if (!$this->es_afiliado) {
            return 'desafiliado';
        }

        $now = \Carbon\Carbon::now()->startOfDay();
        $vencimiento = \Carbon\Carbon::parse($this->fecha_vencimiento)->startOfDay();
        $limiteGracia = \Carbon\Carbon::parse($this->fecha_limite_gracia)->startOfDay();

        if ($now->lte($vencimiento)) {
            return 'al_dia';
        }

        if ($now->gt($vencimiento) && $now->lte($limiteGracia)) {
            return 'en_mora';
        }

        return 'desafiliado';
    }

    /**
     * Días de mora (0 si está al día).
     */
    public function getDiasMoraAttribute()
    {
        if ($this->estado_afiliacion !== 'en_mora') {
            return 0;
        }

        $now = \Carbon\Carbon::now()->startOfDay();
        $vencimiento = \Carbon\Carbon::parse($this->fecha_vencimiento)->startOfDay();
        return (int) $vencimiento->diffInDays($now);
    }
}