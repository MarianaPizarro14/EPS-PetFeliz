<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Pago extends Model
{
    use HasFactory;

    protected $table = 'pagos';
    protected $primaryKey = 'id_pago';

    protected $fillable = [
        'id_cita',
        'id_cliente',
        'monto',
        'tipo_cobertura',
        'metodo_pago',
        'estado',
        'referencia_transaccion',
    ];

    /**
     * Boot logic: Al registrar el primer pago confirmado del cliente, asigna automáticamente fecha_afiliacion si aún es nula.
     */
    protected static function booted(): void
    {
        static::created(function (Pago $pago) {
            if (($pago->estado === 'confirmado' || strtolower($pago->estado ?? '') === 'confirmado') && $pago->id_cliente) {
                $cliente = Cliente::find($pago->id_cliente);
                if ($cliente && empty($cliente->fecha_afiliacion)) {
                    $fechaPago = $pago->created_at ? $pago->created_at->format('Y-m-d') : date('Y-m-d');
                    $cliente->fecha_afiliacion = $fechaPago;
                    $cliente->save();
                }
            }
        });
    }

    public function cita()
    {
        return $this->belongsTo(Cita::class, 'id_cita', 'id_cita');
    }

    public function cliente()
    {
        return $this->belongsTo(Cliente::class, 'id_cliente', 'id_cliente');
    }
}
