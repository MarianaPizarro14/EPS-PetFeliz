<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Servicio extends Model
{
    use HasFactory;

    protected $table = 'servicio';
    protected $primaryKey = 'id_servicio';
    public $timestamps = false;

    protected $fillable = [
        'nombre',
        'descripcion',
        'precio_base',
        'activo',
        'precio_afiliado',
        'incluido_en_plan',
        'limite_mensual_incluido',
    ];

    /**
     * Calcular el precio oficial y la cobertura de este servicio para un cliente dado.
     */
    public function calcularPrecio(?Cliente $cliente): array
    {
        $esAfiliado = $cliente && $cliente->es_afiliado && $cliente->estado_afiliacion !== 'en_mora';

        if ($esAfiliado) {
            // 1. Si tiene precio_afiliado asignado (prioridad alta sobre incluido_en_plan)
            if ($this->precio_afiliado !== null && $this->precio_afiliado !== '') {
                $precioAfil = (float) $this->precio_afiliado;
                if ($precioAfil == 0) {
                    return ['monto' => 0.0, 'tipo_cobertura' => 'eps'];
                }
                return ['monto' => $precioAfil, 'tipo_cobertura' => 'copago'];
            }

            // 2. Si está incluido en el plan EPS sin copago adicional
            if ($this->incluido_en_plan) {
                return ['monto' => 0.0, 'tipo_cobertura' => 'eps'];
            }
        }

        // Usuario no afiliado, en mora o servicio sin descuento
        return ['monto' => (float) ($this->precio_base ?? 70000.0), 'tipo_cobertura' => 'particular'];
    }
}
