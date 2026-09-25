<?php

namespace App\Helpers;

use Illuminate\Support\Facades\DB;

class PhoneHelper
{
    /**
     * Sanitiza un número telefónico extrayendo únicamente sus dígitos.
     */
    public static function cleanPhone(?string $phone): string
    {
        if (!$phone) return '';
        return preg_replace('/[^0-9]/', '', $phone);
    }

    /**
     * Verifica si un número de teléfono/celular es único en todo el sistema
     * (comparando contra las tablas `cliente` y `veterinario`).
     *
     * @param string|null $phone - El teléfono a verificar
     * @param int|null $ignoreClienteId - ID de cliente a ignorar (al editar)
     * @param int|null $ignoreVetId - ID de veterinario a ignorar (al editar)
     * @return bool - true si es único o vacío, false si ya existe en otro registro
     */
    public static function isUniquePhone(?string $phone, ?int $ignoreClienteId = null, ?int $ignoreVetId = null): bool
    {
        $cleanInput = self::cleanPhone($phone);
        if (empty($cleanInput)) {
            return true;
        }

        // 1. Buscar en la tabla `cliente`
        $clienteQuery = DB::table('cliente')
            ->whereNotNull('telefono')
            ->where('telefono', '!=', '');

        if ($ignoreClienteId) {
            $clienteQuery->where('id_cliente', '!=', $ignoreClienteId);
        }

        $clientesPhones = $clienteQuery->pluck('telefono');
        foreach ($clientesPhones as $t) {
            if (self::cleanPhone($t) === $cleanInput) {
                return false;
            }
        }

        // 2. Buscar en la tabla `veterinario`
        $vetQuery = DB::table('veterinario')
            ->whereNotNull('telefono')
            ->where('telefono', '!=', '');

        if ($ignoreVetId) {
            $vetQuery->where('id_veterinario', '!=', $ignoreVetId);
        }

        $vetPhones = $vetQuery->pluck('telefono');
        foreach ($vetPhones as $t) {
            if (self::cleanPhone($t) === $cleanInput) {
                return false;
            }
        }

        return true;
    }
}
