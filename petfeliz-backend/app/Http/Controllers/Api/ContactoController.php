<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Mail\ContactoMail;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Validator;

class ContactoController extends Controller
{
    /**
     * Procesar y enviar un mensaje de contacto.
     */
    public function send(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'nombre'  => 'required|string|max:100',
            'correo'  => 'required|email|max:150',
            'asunto'  => 'required|string|max:100',
            'mensaje' => 'required|string|min:10|max:3000',
        ], [
            'nombre.required'  => 'El nombre completo es obligatorio.',
            'nombre.max'       => 'El nombre no puede exceder los 100 caracteres.',
            'correo.required'  => 'El correo electrónico es obligatorio.',
            'correo.email'     => 'Por favor ingresa un correo electrónico válido.',
            'asunto.required'  => 'Por favor selecciona un asunto.',
            'mensaje.required' => 'El mensaje es obligatorio.',
            'mensaje.min'      => 'El mensaje debe tener al menos 10 caracteres.',
            'mensaje.max'      => 'El mensaje no puede exceder los 3000 caracteres.',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Errores de validación en el formulario.',
                'errors'  => $validator->errors()
            ], 422);
        }

        // Sanitizar campos
        $cleanNombre  = trim(strip_tags($request->nombre));
        $cleanCorreo  = trim(filter_var($request->correo, FILTER_SANITIZE_EMAIL));
        $cleanAsunto  = trim(strip_tags($request->asunto));
        $cleanMensaje = trim(strip_tags($request->mensaje));

        // Correo del equipo de soporte de PetFeliz (petfelizeps@gmail.com)
        $recipientEmail = env('CONTACT_RECIPIENT_EMAIL', 'petfelizeps@gmail.com');

        try {
            Mail::to($recipientEmail)->send(
                new ContactoMail($cleanNombre, $cleanCorreo, $cleanAsunto, $cleanMensaje)
            );
        } catch (\Throwable $e) {
            Log::error("Error al enviar mensaje de contacto desde {$cleanCorreo}: " . $e->getMessage());
        }

        return response()->json([
            'status'  => 'success',
            'message' => '¡Gracias por contactarnos! Tu mensaje ha sido recibido exitosamente y te responderemos pronto a tu correo.'
        ], 200);
    }
}
