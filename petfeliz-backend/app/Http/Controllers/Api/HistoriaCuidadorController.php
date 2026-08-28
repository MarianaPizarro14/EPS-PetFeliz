<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Mail\NuevaHistoriaCuidadorMail;
use App\Models\HistoriaCuidador;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Validator;

class HistoriaCuidadorController extends Controller
{
    /**
     * Obtener el listado de historias aprobadas ordenadas por fecha descendente (público).
     */
    public function index()
    {
        $historias = HistoriaCuidador::aprobadas()
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'status' => 'success',
            'data'   => $historias
        ], 200);
    }

    /**
     * Guardar una nueva historia enviada por un usuario (estado: pendiente por defecto).
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'nombre_cuidador' => 'required|string|max:100',
            'nombre_mascota'  => 'required|string|max:100',
            'categoria'       => 'required|string|in:Medicina General,Urgencias 24/7,Dermatología,Cirugía,Vacunación',
            'historia'        => 'required|string|min:50|max:2000',
        ], [
            'nombre_cuidador.required' => 'El nombre del cuidador es obligatorio.',
            'nombre_cuidador.max'      => 'El nombre no puede exceder los 100 caracteres.',
            'nombre_mascota.required'  => 'El nombre de la mascota es obligatorio.',
            'nombre_mascota.max'       => 'El nombre de la mascota no puede exceder los 100 caracteres.',
            'categoria.required'       => 'La categoría del servicio es obligatoria.',
            'categoria.in'             => 'La categoría seleccionada no es válida.',
            'historia.required'        => 'La historia o testimonio es obligatoria.',
            'historia.min'             => 'La historia debe contener al menos 50 caracteres para ser descriptiva.',
            'historia.max'             => 'La historia no puede exceder los 2000 caracteres.',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Errores de validación en el formulario.',
                'errors'  => $validator->errors()
            ], 422);
        }

        // Sanitización del input contra inyección de scripts HTML (XSS)
        $cleanNombreCuidador = trim(strip_tags($request->nombre_cuidador));
        $cleanNombreMascota  = trim(strip_tags($request->nombre_mascota));
        $cleanCategoria      = trim(strip_tags($request->categoria));
        $cleanHistoria       = trim(strip_tags($request->historia));

        $historia = HistoriaCuidador::create([
            'nombre_cuidador' => $cleanNombreCuidador,
            'nombre_mascota'  => $cleanNombreMascota,
            'categoria'       => $cleanCategoria,
            'historia'        => $cleanHistoria,
            'estado'          => 'pendiente',
        ]);

        // Disparar envío de correo asíncrono al equipo editorial
        try {
            $editorialEmail = env('EDITORIAL_TEAM_EMAIL', 'editorial@petfeliz.com');

            if (!empty($editorialEmail)) {
                Mail::to($editorialEmail)->queue(new NuevaHistoriaCuidadorMail($historia));
            }
        } catch (\Throwable $e) {
            Log::error("Fallo al notificar al equipo editorial sobre la historia ID {$historia->id}: " . $e->getMessage());
        }

        return response()->json([
            'status'  => 'success',
            'message' => '¡Gracias por compartir tu historia! Ha sido registrada exitosamente y será revisada por nuestro equipo antes de ser publicada.',
            'data'    => $historia
        ], 201);
    }

    /**
     * Obtener TODAS las historias para el panel administrativo con filtro opcional por estado.
     */
    public function adminIndex(Request $request)
    {
        $query = HistoriaCuidador::query();

        if ($request->has('estado') && !empty($request->estado) && $request->estado !== 'todas') {
            $query->where('estado', $request->estado);
        }

        $historias = $query->orderBy('created_at', 'desc')->get();

        return response()->json([
            'status' => 'success',
            'data'   => $historias
        ], 200);
    }

    /**
     * Actualizar el estado de una historia (aprobar o rechazar).
     */
    public function updateEstado(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'estado' => 'required|in:aprobado,rechazado,pendiente',
        ], [
            'estado.required' => 'El estado es obligatorio.',
            'estado.in'       => 'El estado debe ser únicamente "aprobado", "rechazado" o "pendiente".',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Error de validación al cambiar estado.',
                'errors'  => $validator->errors()
            ], 422);
        }

        $historia = HistoriaCuidador::find($id);

        if (!$historia) {
            return response()->json([
                'status'  => 'error',
                'message' => 'La historia especificada no existe.'
            ], 44);
        }

        $historia->estado = $request->estado;
        $historia->save();

        return response()->json([
            'status'  => 'success',
            'message' => "La historia ID #{$historia->id} ha sido marcada como '{$historia->estado}' exitosamente.",
            'data'    => $historia
        ], 200);
    }
}
