<?php

namespace Tests\Feature;

use App\Models\Cita;
use App\Models\Cliente;
use App\Models\Mascota;
use App\Models\Pago;
use App\Models\ReservaTemporal;
use App\Models\Sede;
use App\Models\Servicio;
use App\Models\User;
use App\Models\Veterinario;
use App\Services\PaymentAppointmentService;
use App\Services\WompiService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class PaymentAndConcurrencyTest extends TestCase
{
    use RefreshDatabase;

    protected $user1;
    protected $cliente1;
    protected $mascota1;

    protected $user2;
    protected $cliente2;
    protected $mascota2;

    protected $sede;
    protected $vet;
    protected $servicio;

    protected function setUp(): void
    {
        parent::setUp();

        // Seed estado_cita
        DB::table('estado_cita')->insertOrIgnore([
            ['id_estado' => 1, 'nombre' => 'Pendiente'],
            ['id_estado' => 2, 'nombre' => 'Confirmada'],
            ['id_estado' => 3, 'nombre' => 'Cancelada'],
            ['id_estado' => 4, 'nombre' => 'Completada'],
        ]);

        // Sede
        $this->sede = Sede::create([
            'nombre' => 'Sede Laureles',
            'direccion' => 'Circular 73B # 39B - 45',
            'telefono' => '6044481234',
            'ciudad' => 'Medellín',
            'activo' => true,
        ]);

        // Veterinario
        $userVet = User::create([
            'nombre' => 'Dra. Laura Martínez',
            'email' => 'laura.vet@petfeliz.com',
            'contrasena_hash' => Hash::make('password123'),
            'rol' => 'veterinario',
        ]);

        $this->vet = Veterinario::create([
            'id_usuario' => $userVet->id_usuario,
            'nombre' => 'Dra. Laura Martínez',
            'especialidad' => 'Medicina General',
            'id_sede' => $this->sede->id_sede,
            'telefono' => '3001234567',
        ]);

        // Servicio
        $this->servicio = Servicio::create([
            'nombre' => 'Consulta General',
            'descripcion' => 'Consulta médica general para mascotas',
            'precio_base' => 70000,
            'precio_afiliado' => 0,
            'incluido_en_plan' => true,
            'activo' => true,
        ]);

        // User 1 & Cliente 1 & Mascota 1
        $this->user1 = User::create([
            'nombre' => 'Cliente Uno',
            'email' => 'cliente1@petfeliz.com',
            'contrasena_hash' => Hash::make('password123'),
            'rol' => 'cliente',
        ]);

        $this->cliente1 = Cliente::create([
            'id_usuario' => $this->user1->id_usuario,
            'nombre' => 'Cliente Uno',
            'cedula' => '10000001',
            'telefono' => '3001111111',
            'es_afiliado' => false,
        ]);

        $this->mascota1 = Mascota::create([
            'id_cliente' => $this->cliente1->id_cliente,
            'nombre' => 'Firulais',
            'especie' => 'Canino',
            'raza' => 'Criollo',
            'sexo' => 'Macho',
        ]);

        // User 2 & Cliente 2 & Mascota 2
        $this->user2 = User::create([
            'nombre' => 'Cliente Dos',
            'email' => 'cliente2@petfeliz.com',
            'contrasena_hash' => Hash::make('password123'),
            'rol' => 'cliente',
        ]);

        $this->cliente2 = Cliente::create([
            'id_usuario' => $this->user2->id_usuario,
            'nombre' => 'Cliente Dos',
            'cedula' => '10000002',
            'telefono' => '3002222222',
            'es_afiliado' => false,
        ]);

        $this->mascota2 = Mascota::create([
            'id_cliente' => $this->cliente2->id_cliente,
            'nombre' => 'Michi',
            'especie' => 'Felino',
            'raza' => 'Siamés',
            'sexo' => 'Hembra',
        ]);
    }

    /**
     * Test 1: IDOR en CitaController::store (No se puede agendar con mascota de otro usuario)
     */
    public function test_idor_prevented_in_cita_controller_store()
    {
        $response = $this->actingAs($this->user1)->postJson('/api/citas', [
            'id_mascota' => $this->mascota2->id_mascota, // Mascota de Cliente 2
            'id_veterinario' => $this->vet->id_veterinario,
            'id_servicio' => $this->servicio->id_servicio,
            'fecha' => now()->addDays(2)->toDateString(),
            'hora' => '09:00 AM',
        ]);

        $response->assertStatus(403);
        $response->assertJson([
            'message' => 'No autorizado. La mascota no pertenece al cliente autenticado.',
        ]);
    }

    /**
     * Test 2: Concurrencia - Dos clientes intentan reservar el mismo slot simultáneamente
     */
    public function test_concurrency_reservar_slot_prevents_duplicate_booking()
    {
        $fecha = now()->addDays(3)->toDateString();
        $hora = '10:00 AM';

        // Cliente 1 reserva el slot
        $res1 = $this->actingAs($this->user1)->postJson('/api/agendar/reservar-slot', [
            'id_veterinario' => $this->vet->id_veterinario,
            'fecha' => $fecha,
            'hora' => $hora,
            'id_servicio' => $this->servicio->id_servicio,
            'id_mascota' => $this->mascota1->id_mascota,
        ]);

        $res1->assertStatus(200);
        $res1->assertJsonStructure(['token_reserva', 'expires_at']);

        // Cliente 2 intenta reservar el mismo slot mientras está activo
        $res2 = $this->actingAs($this->user2)->postJson('/api/agendar/reservar-slot', [
            'id_veterinario' => $this->vet->id_veterinario,
            'fecha' => $fecha,
            'hora' => $hora,
            'id_servicio' => $this->servicio->id_servicio,
            'id_mascota' => $this->mascota2->id_mascota,
        ]);

        $res2->assertStatus(409);
        $res2->assertJson([
            'message' => 'El horario seleccionado se encuentra en proceso de pago por otro usuario. Por favor elige otro horario.',
        ]);
    }

    /**
     * Test 3: Flujo de Pago Resiliente - Webhook llega primero, confirmarPago llega segundo (Idempotencia)
     */
    public function test_webhook_first_then_confirmar_pago_is_idempotent()
    {
        $fecha = now()->addDays(4)->toDateString();
        $hora = '11:00 AM';
        $wompiTxId = 'TX_WOMPI_TEST_001';
        $referencia = 'REF_TEST_001';

        // 1. Cliente 1 inicia reserva temporal
        $reserva = ReservaTemporal::create([
            'id_veterinario' => $this->vet->id_veterinario,
            'fecha' => $fecha,
            'hora' => $hora,
            'id_usuario' => $this->user1->id_usuario,
            'id_cliente' => $this->cliente1->id_cliente,
            'id_servicio' => $this->servicio->id_servicio,
            'id_mascota' => $this->mascota1->id_mascota,
            'id_sede' => $this->sede->id_sede,
            'referencia_pago' => $referencia,
            'token_reserva' => 'TOKEN_RES_001',
            'expires_at' => now()->addMinutes(10),
        ]);

        // 2. Wompi Webhook llega PRIMERO con estado APPROVED
        $webhookData = [
            'id' => $wompiTxId,
            'status' => 'APPROVED',
            'reference' => $referencia,
            'amount_in_cents' => 7000000,
            'currency' => 'COP',
            'payment_method_type' => 'CARD',
        ];

        $webhookResult = PaymentAppointmentService::procesarDesdeWebhook($webhookData);
        $this->assertTrue($webhookResult['success'], 'Error: ' . json_encode($webhookResult));
        $this->assertEquals(201, $webhookResult['code']);

        // Verificar que Cita y Pago se crearon
        $this->assertDatabaseHas('cita', [
            'id_cliente' => $this->cliente1->id_cliente,
            'id_mascota' => $this->mascota1->id_mascota,
            'id_servicio' => $this->servicio->id_servicio,
            'fecha' => $fecha,
            'id_estado' => 2, // Confirmada
        ]);

        $this->assertDatabaseHas('pagos', [
            'wompi_transaction_id' => $wompiTxId,
            'estado' => 'confirmado',
            'monto' => 70000,
        ]);

        $this->assertEquals(1, Cita::count());
        $this->assertEquals(1, Pago::count());

        // 3. El cliente vuelve al frontend y se dispara confirmarPago
        $confirmResult = PaymentAppointmentService::procesarConfirmacion([
            'token_reserva' => 'TOKEN_RES_001',
            'id_transaccion_wompi' => $wompiTxId,
            'id_mascota' => $this->mascota1->id_mascota,
            'id_servicio' => $this->servicio->id_servicio,
        ], $this->user1);

        $this->assertTrue($confirmResult['success']);
        $this->assertTrue($confirmResult['idempotent'] ?? false);

        // Asegurar que NO se duplicaron registros
        $this->assertEquals(1, Cita::count(), 'No debe duplicarse la Cita');
        $this->assertEquals(1, Pago::count(), 'No debe duplicarse el Pago');
    }

    /**
     * Test 4: Flujo de Pago Resiliente - confirmarPago primero, Webhook duplicado después
     */
    public function test_confirmar_pago_first_then_webhook_is_idempotent()
    {
        $fecha = now()->addDays(5)->toDateString();
        $hora = '02:00 PM';
        $wompiTxId = 'TX_WOMPI_TEST_002';
        $referencia = 'REF_TEST_002';

        $reserva = ReservaTemporal::create([
            'id_veterinario' => $this->vet->id_veterinario,
            'fecha' => $fecha,
            'hora' => $hora,
            'id_usuario' => $this->user1->id_usuario,
            'id_cliente' => $this->cliente1->id_cliente,
            'id_servicio' => $this->servicio->id_servicio,
            'id_mascota' => $this->mascota1->id_mascota,
            'id_sede' => $this->sede->id_sede,
            'referencia_pago' => $referencia,
            'token_reserva' => 'TOKEN_RES_002',
            'expires_at' => now()->addMinutes(10),
        ]);

        $txData = [
            'id' => $wompiTxId,
            'status' => 'APPROVED',
            'reference' => $referencia,
            'amount_in_cents' => 7000000,
            'currency' => 'COP',
            'payment_method_type' => 'NEQUI',
        ];

        // 1. Confirmar pago desde frontend
        $confirmResult = PaymentAppointmentService::procesarConfirmacion([
            'token_reserva' => 'TOKEN_RES_002',
            'id_transaccion_wompi' => $wompiTxId,
            'id_mascota' => $this->mascota1->id_mascota,
            'id_servicio' => $this->servicio->id_servicio,
            'tx_data' => $txData,
        ], $this->user1);

        $this->assertTrue($confirmResult['success']);
        $this->assertEquals(201, $confirmResult['code']);

        // 2. Webhook llega después
        $webhookResult = PaymentAppointmentService::procesarDesdeWebhook($txData);
        $this->assertTrue($webhookResult['success']);
        $this->assertTrue($webhookResult['idempotent'] ?? false);

        // Sin duplicación
        $this->assertEquals(1, Cita::count());
        $this->assertEquals(1, Pago::count());
    }

    /**
     * Test 5: Pago Rechazado (DECLINED) libera la reserva temporal y no crea cita
     */
    public function test_webhook_declined_frees_reservation_and_creates_no_cita()
    {
        $fecha = now()->addDays(6)->toDateString();
        $hora = '03:00 PM';
        $referencia = 'REF_TEST_DECLINED_001';

        $reserva = ReservaTemporal::create([
            'id_veterinario' => $this->vet->id_veterinario,
            'fecha' => $fecha,
            'hora' => $hora,
            'id_usuario' => $this->user1->id_usuario,
            'id_cliente' => $this->cliente1->id_cliente,
            'id_servicio' => $this->servicio->id_servicio,
            'id_mascota' => $this->mascota1->id_mascota,
            'referencia_pago' => $referencia,
            'token_reserva' => 'TOKEN_RES_DECLINED',
            'expires_at' => now()->addMinutes(10),
        ]);

        $this->assertDatabaseHas('reserva_temporal', ['token_reserva' => 'TOKEN_RES_DECLINED']);

        // Webhook DECLINED
        $webhookData = [
            'id' => 'TX_DECLINED_001',
            'status' => 'DECLINED',
            'reference' => $referencia,
        ];

        $result = PaymentAppointmentService::procesarDesdeWebhook($webhookData);
        $this->assertTrue($result['success']);

        // Reserva temporal fue eliminada/liberada
        $this->assertDatabaseMissing('reserva_temporal', ['token_reserva' => 'TOKEN_RES_DECLINED']);
        // No se creó cita ni pago
        $this->assertEquals(0, Cita::count());
        $this->assertEquals(0, Pago::count());
    }

    /**
     * Test 6: Validación de autenticación en /api devuelve 401 JSON sin buscar login
     */
    public function test_unauthenticated_api_request_returns_401_json()
    {
        $response = $this->getJson('/api/cliente/dashboard');
        $response->assertStatus(401);
        $response->assertJson([
            'message' => 'Unauthenticated.',
        ]);
    }

    /**
     * Test 7: Concurrencia - Restricción de base de datos slot_activo impide citas duplicadas (reemplazo de verify_mysql_concurrency.php)
     */
    public function test_mysql_concurrency_unique_slot_activo_constraint()
    {
        $fecha = '2099-12-31';
        $hora = '10:00:00';

        // 1. Insertar primera cita activa
        $cita1 = Cita::create([
            'id_cliente' => $this->cliente1->id_cliente,
            'id_mascota' => $this->mascota1->id_mascota,
            'id_servicio' => $this->servicio->id_servicio,
            'id_sede' => $this->sede->id_sede,
            'motivo' => 'Test Concurrencia 1',
            'fecha' => $fecha,
            'hora' => $hora,
            'id_estado' => 2, // Confirmada (Activa)
            'id_veterinario' => $this->vet->id_veterinario,
        ]);

        $this->assertNotNull($cita1->id_cita);

        // 2. Intentar insertar segunda cita activa en el mismo horario exacto (debe arrojar QueryException 23000)
        $this->expectException(\Illuminate\Database\QueryException::class);

        Cita::create([
            'id_cliente' => $this->cliente2->id_cliente,
            'id_mascota' => $this->mascota2->id_mascota,
            'id_servicio' => $this->servicio->id_servicio,
            'id_sede' => $this->sede->id_sede,
            'motivo' => 'Test Concurrencia 2 (Conflicto)',
            'fecha' => $fecha,
            'hora' => $hora,
            'id_estado' => 2, // Confirmada (Activa)
            'id_veterinario' => $this->vet->id_veterinario,
        ]);
    }

    /**
     * Test 8: Discrepancia de monto en Webhook registra Pago como 'requiere_revision'
     */
    public function test_webhook_amount_mismatch_creates_requiere_revision_pago()
    {
        $fecha = now()->addDays(7)->toDateString();
        $hora = '04:00 PM';
        $wompiTxId = 'TX_MISMATCH_001';
        $referencia = 'REF_MISMATCH_001';

        $reserva = ReservaTemporal::create([
            'id_veterinario' => $this->vet->id_veterinario,
            'fecha' => $fecha,
            'hora' => $hora,
            'id_usuario' => $this->user1->id_usuario,
            'id_cliente' => $this->cliente1->id_cliente,
            'id_servicio' => $this->servicio->id_servicio,
            'id_mascota' => $this->mascota1->id_mascota,
            'id_sede' => $this->sede->id_sede,
            'referencia_pago' => $referencia,
            'token_reserva' => 'TOKEN_MISMATCH',
            'expires_at' => now()->addMinutes(10),
        ]);

        // Webhook envía monto inferior ($20.000 en vez de $70.000)
        $webhookData = [
            'id' => $wompiTxId,
            'status' => 'APPROVED',
            'reference' => $referencia,
            'amount_in_cents' => 2000000, // 20.000 COP
            'currency' => 'COP',
            'payment_method_type' => 'CARD',
        ];

        $result = PaymentAppointmentService::procesarDesdeWebhook($webhookData);
        $this->assertFalse($result['success']);
        $this->assertEquals(422, $result['code']);

        // El pago debe quedar registrado para revisión
        $this->assertDatabaseHas('pagos', [
            'wompi_transaction_id' => $wompiTxId,
            'id_cliente' => $this->cliente1->id_cliente,
            'monto' => 20000,
            'estado' => 'requiere_revision',
        ]);

        // No debe haberse creado la cita
        $this->assertEquals(0, Cita::count());
    }

    /**
     * Test 9: Webhook recibido cuando la reserva expiró pero el horario sigue libre crea la Cita
     */
    public function test_webhook_creates_cita_when_reserva_expired_but_slot_is_still_free()
    {
        $fecha = now()->addDays(8)->toDateString();
        $hora = '05:00 PM';
        $wompiTxId = 'TX_EXPIRED_SLOT_FREE_001';
        $referencia = 'REF_EXPIRED_SLOT_FREE_001';

        // Reserva creada con expires_at en el pasado (expirada) pero con referencia_pago (conservada)
        $reserva = ReservaTemporal::create([
            'id_veterinario' => $this->vet->id_veterinario,
            'fecha' => $fecha,
            'hora' => $hora,
            'id_usuario' => $this->user1->id_usuario,
            'id_cliente' => $this->cliente1->id_cliente,
            'id_servicio' => $this->servicio->id_servicio,
            'id_mascota' => $this->mascota1->id_mascota,
            'id_sede' => $this->sede->id_sede,
            'referencia_pago' => $referencia,
            'token_reserva' => 'TOKEN_EXPIRED_FREE',
            'expires_at' => now()->subMinutes(5), // Ya expiró
        ]);

        $webhookData = [
            'id' => $wompiTxId,
            'status' => 'APPROVED',
            'reference' => $referencia,
            'amount_in_cents' => 7000000,
            'currency' => 'COP',
            'payment_method_type' => 'CARD',
        ];

        $result = PaymentAppointmentService::procesarDesdeWebhook($webhookData);
        $this->assertTrue($result['success']);
        $this->assertEquals(201, $result['code']);

        // Se crea la cita porque el cupo seguía disponible
        $this->assertDatabaseHas('cita', [
            'id_cliente' => $this->cliente1->id_cliente,
            'id_mascota' => $this->mascota1->id_mascota,
            'id_servicio' => $this->servicio->id_servicio,
            'fecha' => $fecha,
            'id_estado' => 2,
        ]);

        $this->assertDatabaseHas('pagos', [
            'wompi_transaction_id' => $wompiTxId,
            'estado' => 'confirmado',
            'monto' => 70000,
        ]);
    }

    /**
     * Test 10: Validación de generarFirma requiere token_reserva válido y no expirado
     */
    public function test_generar_firma_validates_token_reserva()
    {
        // 1. Intento sin token_reserva
        $res1 = $this->actingAs($this->user1)->postJson('/api/wompi/generar-firma', [
            'id_servicio' => $this->servicio->id_servicio,
        ]);
        $res1->assertStatus(422);

        // 2. Intento con token_reserva inexistente
        $res2 = $this->actingAs($this->user1)->postJson('/api/wompi/generar-firma', [
            'id_servicio' => $this->servicio->id_servicio,
            'token_reserva' => 'TOKEN_INEXISTENTE',
        ]);
        $res2->assertStatus(422);

        // 3. Crear reserva para user2 e intentar firmar con user1 (IDOR)
        $reservaUser2 = ReservaTemporal::create([
            'id_veterinario' => $this->vet->id_veterinario,
            'fecha' => now()->addDays(9)->toDateString(),
            'hora' => '08:00 AM',
            'id_usuario' => $this->user2->id_usuario,
            'token_reserva' => 'TOKEN_USER_2',
            'expires_at' => now()->addMinutes(10),
        ]);

        $res3 = $this->actingAs($this->user1)->postJson('/api/wompi/generar-firma', [
            'id_servicio' => $this->servicio->id_servicio,
            'token_reserva' => 'TOKEN_USER_2',
        ]);
        $res3->assertStatus(422);
    }
}
