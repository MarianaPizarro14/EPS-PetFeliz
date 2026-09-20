<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Notificacion;
use Illuminate\Http\Request;

class NotificacionController extends Controller
{
    /**
     * Construir la consulta de notificaciones tanto para cliente como para cualquier rol de usuario.
     */
    private function queryUserNotifications($user)
    {
        $cliente = $user->cliente;
        $clienteId = $cliente ? $cliente->id_cliente : null;
        $userId = $user->id_usuario;

        return Notificacion::where(function ($query) use ($clienteId, $userId) {
            $query->where('id_usuario', $userId);
            if ($clienteId) {
                $query->orWhere('id_cliente', $clienteId);
            }
        });
    }

    /**
     * Listar notificaciones del usuario autenticado (Cliente o Admin).
     */
    public function index(Request $request)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['notifications' => [], 'unreadCount' => 0], 200);
        }

        $notificaciones = $this->queryUserNotifications($user)
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
        $this->queryUserNotifications($request->user())->update(['leida' => true]);
        return $this->index($request);
    }

    /**
     * Marcar una notificación individual como leída.
     */
    public function marcarLeida(Request $request, $id)
    {
        $this->queryUserNotifications($request->user())
            ->where('id_notificacion', $id)
            ->update(['leida' => true]);

        return $this->index($request);
    }

    /**
     * Eliminar una notificación específica.
     */
    public function destroy(Request $request, $id)
    {
        $this->queryUserNotifications($request->user())
            ->where('id_notificacion', $id)
            ->delete();

        return $this->index($request);
    }

    /**
     * Eliminar todas las notificaciones.
     */
    public function destroyAll(Request $request)
    {
        $this->queryUserNotifications($request->user())->delete();

        return response()->json([
            'notifications' => [],
            'unreadCount' => 0,
        ], 200);
    }
}
