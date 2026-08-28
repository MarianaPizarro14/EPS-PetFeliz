<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Cita;
use App\Models\Mascota;
use App\Models\Pago;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;

class DocumentoController extends Controller
{
    /**
     * Descargar Factura / Recibo de Pago en PDF.
     */
    public function facturaPdf(Request $request, $id_pago)
    {
        $cliente = $request->user()->cliente;

        if (!$cliente) {
            return response()->json(['message' => 'Cliente no autorizado.'], 403);
        }

        $pago = Pago::with(['cita.servicio', 'cita.mascota', 'cita.veterinario', 'cliente.usuario'])
            ->where('id_cliente', $cliente->id_cliente)
            ->where('id_pago', $id_pago)
            ->first();

        if (!$pago) {
            return response()->json(['message' => 'No se encontró la factura o recibo de pago solicitado.'], 404);
        }

        $cita = $pago->cita;
        $servicioNombre = $cita && $cita->servicio ? $cita->servicio->nombre : ($cita->motivo ?? 'Servicio Veterinario');

        $esAfiliado = $cliente->es_afiliado ?? true;
        $estadoAfiliacionTexto = $esAfiliado ? 'AFILIADO EPS' : 'NO AFILIADO';

        $data = [
            'pago' => $pago,
            'cliente_nombre' => $cliente->usuario ? ($cliente->usuario->nombreCompleto ?? $cliente->usuario->nombre) : ($cliente->nombre ?? 'Cliente PetFeliz'),
            'cliente_doc' => $cliente->cedula ?? ($cliente->num_documento ?? ('DOC-' . $cliente->id_cliente)),
            'es_afiliado' => $esAfiliado,
            'estado_afiliacion' => $estadoAfiliacionTexto,
            'mascota_nombre' => $cita && $cita->mascota ? $cita->mascota->nombre : 'Mascota',
            'mascota_especie' => $cita && $cita->mascota ? $cita->mascota->especie : 'Canino',
            'mascota_raza' => $cita && $cita->mascota ? ($cita->mascota->raza ?? 'Criollo') : 'Criollo',
            'veterinario_nombre' => $cita && $cita->veterinario ? $cita->veterinario->nombre : 'Dra. Laura Martínez',
            'servicio_nombre' => $servicioNombre,
            'fecha_cita' => $cita ? $cita->fecha : date('Y-m-d'),
            'hora_cita' => $cita ? $cita->hora : '10:00 AM',
        ];

        $pdf = Pdf::loadView('pdf.factura', $data);
        return $pdf->download("Factura_EPS_PetFeliz_{$pago->id_pago}.pdf");
    }

    /**
     * Descargar Historial / Constancia de Atenciones de una mascota en PDF.
     */
    public function historialClinicoPdf(Request $request, $id_mascota)
    {
        $cliente = $request->user()->cliente;

        if (!$cliente) {
            return response()->json(['message' => 'Cliente no autorizado.'], 403);
        }

        $mascota = Mascota::where('id_cliente', $cliente->id_cliente)
            ->where('id_mascota', $id_mascota)
            ->first();

        if (!$mascota) {
            return response()->json(['message' => 'Mascota no encontrada.'], 404);
        }

        $citas = Cita::with(['veterinario', 'servicio'])
            ->where('id_cliente', $cliente->id_cliente)
            ->where('id_mascota', $id_mascota)
            ->orderBy('fecha', 'desc')
            ->get();

        if ($citas->count() === 0) {
            return response()->json(['message' => 'No existen atenciones ni consultas médicas registradas para esta mascota.'], 404);
        }

        $historial = $citas->map(function ($c) {
            return [
                'fecha' => $c->fecha,
                'hora' => $c->hora,
                'tipo_servicio' => $c->servicio ? $c->servicio->nombre : ($c->motivo ?? 'Consulta Médica'),
                'especialista' => $c->veterinario ? $c->veterinario->nombre : 'Dra. Laura Martínez',
                'observacion' => $c->observacion,
            ];
        })->toArray();

        $esAfiliado = $cliente->es_afiliado ?? true;

        $data = [
            'mascota' => $mascota,
            'cliente_nombre' => $cliente->usuario ? ($cliente->usuario->nombreCompleto ?? $cliente->usuario->nombre) : ($cliente->nombre ?? 'Cliente PetFeliz'),
            'cliente_doc' => $cliente->cedula ?? ($cliente->num_documento ?? ('DOC-' . $cliente->id_cliente)),
            'es_afiliado' => $esAfiliado,
            'estado_afiliacion' => $esAfiliado ? 'AFILIADO EPS' : 'NO AFILIADO',
            'historial' => $historial,
        ];

        $pdf = Pdf::loadView('pdf.historial_clinico', $data);
        return $pdf->download("Resumen_Atenciones_{$mascota->nombre}.pdf");
    }

    /**
     * Descargar Certificado de Vacunación de una mascota en PDF.
     */
    public function certificadoVacunacionPdf(Request $request, $id_mascota)
    {
        $cliente = $request->user()->cliente;

        if (!$cliente) {
            return response()->json(['message' => 'Cliente no autorizado.'], 403);
        }

        $mascota = Mascota::where('id_cliente', $cliente->id_cliente)
            ->where('id_mascota', $id_mascota)
            ->first();

        if (!$mascota) {
            return response()->json(['message' => 'Mascota no encontrada.'], 404);
        }

        $citasVacunas = Cita::with(['servicio', 'veterinario'])
            ->where('id_mascota', $id_mascota)
            ->whereHas('servicio', function ($q) {
                $q->where('nombre', 'LIKE', '%vacun%')
                  ->orWhere('nombre', 'LIKE', '%desparasit%');
            })
            ->get();

        if ($citasVacunas->count() === 0) {
            return response()->json(['message' => 'No existen registros de vacunación o desparasitación aplicados a esta mascota.'], 404);
        }

        $vacunas = $citasVacunas->map(function ($c) {
            return [
                'servicio' => $c->servicio ? $c->servicio->nombre : 'Vacunación General',
                'fecha' => $c->fecha,
                'veterinario' => $c->veterinario ? $c->veterinario->nombre : 'Dra. Laura Martínez',
            ];
        })->toArray();

        $esAfiliado = $cliente->es_afiliado ?? true;

        $data = [
            'mascota' => $mascota,
            'cliente_nombre' => $cliente->usuario ? ($cliente->usuario->nombreCompleto ?? $cliente->usuario->nombre) : ($cliente->nombre ?? 'Cliente PetFeliz'),
            'cliente_doc' => $cliente->cedula ?? ($cliente->num_documento ?? ('DOC-' . $cliente->id_cliente)),
            'es_afiliado' => $esAfiliado,
            'estado_afiliacion' => $esAfiliado ? 'AFILIADO EPS' : 'NO AFILIADO',
            'vacunas' => $vacunas,
        ];

        $pdf = Pdf::loadView('pdf.certificado_vacunacion', $data);
        return $pdf->download("Certificado_Vacunacion_{$mascota->nombre}.pdf");
    }

    /**
     * Descargar Carné Digital de Afiliación EPS en PDF.
     */
    public function carneEpsPdf(Request $request)
    {
        $cliente = $request->user()->cliente;

        if (!$cliente) {
            return response()->json(['message' => 'Cliente no autorizado.'], 403);
        }

        // VALIDACIÓN: El perfil debe estar 100% completo antes de permitir generar el carnet
        $faltantes = $cliente->getCamposFaltantes();
        if (count($faltantes) > 0) {
            return response()->json([
                'message' => 'Debes completar el 100% de tu información personal antes de generar el Carnet Digital EPS.',
                'perfil_incompleto' => true,
                'campos_faltantes' => array_values($faltantes),
                'campos_map' => $faltantes,
            ], 422);
        }

        $mascotas = Mascota::where('id_cliente', $cliente->id_cliente)->get();

        if ($mascotas->count() === 0) {
            return response()->json(['message' => 'Debes registrar al menos una mascota en tu plan EPS para generar el carné.'], 404);
        }

        $user = $request->user();
        $rawNombre = $cliente->nombre 
            ?? ($user ? ($user->name ?? ($user->nombre ?? $user->nombre_completo)) : null)
            ?? ($cliente->usuario ? ($cliente->usuario->name ?? ($cliente->usuario->nombre ?? $cliente->usuario->nombreCompleto)) : null)
            ?? 'Titular Afiliado';

        $clienteNombre = mb_strtoupper($rawNombre, 'UTF-8');
        $clienteDoc = mb_strtoupper($cliente->cedula ?? ($cliente->num_documento ?? ('DOC-' . $cliente->id_cliente)), 'UTF-8');

        $mascotasFormatted = $mascotas->map(function ($m) {
            return [
                'id' => $m->id ?? $m->id_mascota,
                'nombre' => mb_strtoupper($m->nombre, 'UTF-8'),
                'especie' => mb_strtoupper($m->especie ?? 'CANINO', 'UTF-8'),
                'raza' => mb_strtoupper($m->raza ?? 'CRIOLLO', 'UTF-8'),
                'sexo' => mb_strtoupper($m->sexo ?? 'MACHO/HEMBRA', 'UTF-8'),
                'chip' => mb_strtoupper($m->chip ?? ('CHIP-PET-' . ($m->id ?? $m->id_mascota)), 'UTF-8'),
            ];
        });

        $esAfiliado = $cliente->es_afiliado ?? true;

        $data = [
            'cliente' => $cliente,
            'cliente_nombre' => $clienteNombre,
            'cliente_doc' => $clienteDoc,
            'es_afiliado' => $esAfiliado,
            'estado_afiliacion' => $esAfiliado ? 'AFILIADO EPS • COBERTURA ACTIVA' : 'NO AFILIADO • PACIENTE PARTICULAR',
            'mascotas' => $mascotasFormatted,
        ];

        $pdf = Pdf::loadView('pdf.carne_eps', $data);
        return $pdf->download("Carnet_EPS_PetFeliz_{$cliente->id_cliente}.pdf");
    }
}
