<?php

use App\Http\Controllers\Api\AgendarCitaController;

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CitaController;
use App\Http\Controllers\Api\DashboardClientController;
use App\Http\Controllers\Api\MascotaController;
use App\Http\Controllers\Api\NotificacionController;
use App\Http\Controllers\Api\PasswordResetController;
use App\Http\Controllers\Api\PagoController;
use App\Http\Controllers\Api\DocumentoController;
use App\Http\Controllers\Api\HistoriaCuidadorController;
use App\Http\Controllers\Api\ContactoController;
use App\Http\Controllers\Api\WompiController;
use App\Http\Controllers\Api\AdminController;
use Illuminate\Support\Facades\Route;

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);
Route::post('/admin/login', [AdminController::class, 'login']);
Route::post('/forgot-password', [PasswordResetController::class, 'forgot']);
Route::post('/reset-password', [PasswordResetController::class, 'reset']);
Route::post('/contacto', [ContactoController::class, 'send']);

// Webhooks de Wompi (Público)
Route::post('/webhooks/wompi', [WompiController::class, 'handleWebhook']);

// Rutas públicas de Historias de Cuidadores
Route::get('/historias-cuidadores', [HistoriaCuidadorController::class, 'index']);
Route::post('/historias-cuidadores', [HistoriaCuidadorController::class, 'store']);

// Rutas de Administración de Historias de Cuidadores
Route::get('/admin/historias-cuidadores', [HistoriaCuidadorController::class, 'adminIndex']);
Route::patch('/admin/historias-cuidadores/{id}', [HistoriaCuidadorController::class, 'updateEstado']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/perfil/update', [AuthController::class, 'updatePerfil']);
    Route::post('/perfil/change-password', [AuthController::class, 'changePassword']);
    Route::post('/perfil/logout-all', [AuthController::class, 'logoutAll']);
    Route::post('/perfil/delete-account', [AuthController::class, 'deleteAccount']);
    Route::get('/cliente/dashboard', [DashboardClientController::class, 'index']);
    Route::get('/admin/dashboard', [AdminController::class, 'dashboard']);
    Route::apiResource('mascotas', MascotaController::class);

    // Rutas de Notificaciones persistentes
    Route::get('/notificaciones', [NotificacionController::class, 'index']);
    Route::post('/notificaciones/marcar-leidas', [NotificacionController::class, 'marcarTodasLeidas']);
    Route::post('/notificaciones/{id}/marcar-leida', [NotificacionController::class, 'marcarLeida']);
    Route::delete('/notificaciones/{id}', [NotificacionController::class, 'destroy']);
    Route::delete('/notificaciones', [NotificacionController::class, 'destroyAll']);

    // Rutas de Citas
    Route::get('/citas', [CitaController::class, 'index']);
    Route::post('/citas', [CitaController::class, 'store']);
    Route::post('/citas/{id}/reprogramar', [CitaController::class, 'reprogramar']);
    Route::post('/citas/{id}/cancelar', [CitaController::class, 'cancelar']);
    Route::get('/servicios', [CitaController::class, 'servicios']);
    Route::get('/cliente/historial-servicios', [CitaController::class, 'historialServicios']);
    Route::get('/clientes/{id}/historial-servicios', [CitaController::class, 'historialServicios']);

    // Rutas de Pagos y Afiliación
    Route::get('/cliente/pagos', [PagoController::class, 'index']);
    Route::get('/cliente/pagos/{id}', [PagoController::class, 'show']);
    Route::get('/cliente/afiliacion', [PagoController::class, 'afiliacionInfo']);
    Route::post('/cliente/afiliacion/pagar', [PagoController::class, 'pagarAfiliacion']);

    // Pasarela Wompi (Firma criptográfica SHA256 para Checkout)
    Route::post('/wompi/generar-firma', [WompiController::class, 'generarFirma']);

    // Rutas de Documentos PDF
    Route::get('/cliente/documentos/factura/{id_pago}/pdf', [DocumentoController::class, 'facturaPdf']);
    Route::get('/cliente/documentos/historial-clinico/{id_mascota}/pdf', [DocumentoController::class, 'historialClinicoPdf']);
    Route::get('/cliente/documentos/certificado-vacunacion/{id_mascota}/pdf', [DocumentoController::class, 'certificadoVacunacionPdf']);
    Route::get('/cliente/documentos/carne-eps/pdf', [DocumentoController::class, 'carneEpsPdf']);

    // Rutas del Flujo Completo de Agendar Cita (3 Pasos + Concurrencia)
    Route::get('/agendar/veterinarios', [AgendarCitaController::class, 'veterinarios']);
    Route::get('/agendar/horarios-disponibles', [AgendarCitaController::class, 'horariosDisponibles']);
    Route::get('/agendar/disponibilidad-mes', [AgendarCitaController::class, 'disponibilidadMes']);
    Route::post('/agendar/reservar-slot', [AgendarCitaController::class, 'reservarSlot']);
    Route::post('/agendar/liberar-reserva', [AgendarCitaController::class, 'liberarReserva']);
    Route::post('/agendar/confirmar-pago', [AgendarCitaController::class, 'confirmarPago']);
});