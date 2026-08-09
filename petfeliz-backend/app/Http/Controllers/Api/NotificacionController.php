<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Notificacion;
use Illuminate\Http\Request;

class NotificacionController extends Controller
{
    /**
     * Listar notificaciones del cliente autenticado.
     */
    public function index(Request $request)
    {
        $cliente = $request->user()->cliente;

        if (!$cliente) {
            return response()->json(['notifications' => [], 'unreadCount' => 0], 200);
        }

        $count = Notificacion::where('id_cliente', $cliente->id_cliente)->count();

        // Si el cliente no tiene notificaciones iniciales en BD, las sembramos automáticamente
        if ($count === 0) {
            $defaultNotifs = [
                [
                    'id_cliente' => $cliente->id_cliente,
                    'titulo' => 'Recordatorio de Cita',
                    'mensaje' => 'Recuerda que tienes una cita de control programada pronto.',
                    'leida' => false,
                    'icono' => 'fa-regular fa-calendar-days',
                    'tipo' => 'cita',
                    'created_at' => now()->subHours(2),
                ],
                [
                    'id_cliente' => $cliente->id_cliente,
                    'titulo' => 'Seguridad de la Cuenta',
                    'mensaje' => 'Tus datos de contacto e historial médico se encuentran protegidos.',
                    'leida' => false,
                    'icono' => 'fa-solid fa-shield-halved',
                    'tipo' => 'seguridad',
                    'created_at' => now()->subHours(5),
                ],
                [
                    'id_cliente' => $cliente->id_cliente,
                    'titulo' => 'Bienvenido a PetFeliz',
                    'mensaje' => '¡Gracias por confiar en nuestra EPS veterinaria para el cuidado de tus mascotas!',
                    'leida' => false,
                    'icono' => 'fa-solid fa-paw',
                    'tipo' => 'bienvenida',
                    'created_at' => now()->subDays(1),
                ],
            ];

            foreach ($defaultNotifs as $n) {
                Notificacion::create($n);
            }
        }

        $notificaciones = Notificacion::where('id_cliente', $cliente->id_cliente)
            ->orderBy('id_notificacion', 'desc')
            ->get()
            ->map(function ($n) {
                return [
                    'id' => $n->id_notificacion,
                    'titulo' => $n->titulo,
                    'text' => $n->mensaje,
                    'read' => (bool) $n->leida,
                    'icon' => $n->icono,
                    'time' => $n->created_at ? $n->created_at->diffForHumans() : 'Hace un momento',
                ];
            });

        $unreadCount = $notificaciones->filter(fn($n) => !$n['read'])->count();

        return response()->json([
            'notifications' => $notificaciones->values(),
            'unreadCount' => $unreadCount,
        ], 200);
    }

    /**
     * Marcar todas las notificaciones como leídas.
     */
    public function marcarTodasLeidas(Request $request)
    {
        $cliente = $request->user()->cliente;

        if ($cliente) {
            Notificacion::where('id_cliente', $cliente->id_cliente)->update(['leida' => true]);
        }

        return $this->index($request);
    }

    /**
     * Marcar una notificación individual como leída.
     */
    public function marcarLeida(Request $request, $id)
    {
        $cliente = $request->user()->cliente;

        if ($cliente) {
            Notificacion::where('id_cliente', $cliente->id_cliente)
                ->where('id_notificacion', $id)
                ->update(['leida' => true]);
        }

        return $this->index($request);
    }

    /**
     * Eliminar una notificación específica.
     */
    public function destroy(Request $request, $id)
    {
        $cliente = $request->user()->cliente;

        if ($cliente) {
            Notificacion::where('id_cliente', $cliente->id_cliente)
                ->where('id_notificacion', $id)
                ->delete();
        }

        return $this->index($request);
    }

    /**
     * Eliminar todas las notificaciones.
     */
    public function destroyAll(Request $request)
    {
        $cliente = $request->user()->cliente;

        if ($cliente) {
            Notificacion::where('id_cliente', $cliente->id_cliente)->delete();
        }

        return response()->json([
            'notifications' => [],
            'unreadCount' => 0,
        ], 200);
    }
}
