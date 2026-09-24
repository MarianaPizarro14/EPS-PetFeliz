<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\LoginRequest;
use App\Http\Requests\RegisterRequest;
use App\Models\Cliente;
use App\Models\User;
use App\Services\CloudinaryService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

class AuthController extends Controller
{
    public function register(RegisterRequest $request)
    {
        $result = DB::transaction(function () use ($request) {
            $user = User::create([
                'email' => $request->email,
                'contrasena_hash' => Hash::make($request->password),
                'rol' => 'cliente',
                'activo' => 1,
            ]);

            $cliente = Cliente::create([
                'id_usuario' => $user->id_usuario,
                'nombre' => $request->nombre,
                'telefono' => $request->telefono,
                'direccion' => $request->direccion,
            ]);

            return [$user, $cliente];
        });

        [$user, $cliente] = $result;

        \App\Services\NotificationService::notificar(
            $cliente,
            '¡Bienvenido a EPS PetFeliz!',
            "Tu cuenta ha sido creada exitosamente. Estamos listos para cuidar de tus mascotas con el mejor servicio médico.",
            'fa-solid fa-shield-heart',
            'bienvenida'
        );

        \App\Services\NotificationService::notificarAdmin(
            'Nuevo Usuario Registrado',
            "Se ha registrado el nuevo usuario {$user->email} ({$cliente->nombre}).",
            'fa-solid fa-user-plus',
            'usuario'
        );

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'message' => 'Usuario registrado correctamente.',
            'user' => $user,
            'cliente' => $cliente,
            'token' => $token,
        ], 201);
    }

    public function login(LoginRequest $request)
    {
        if (!Auth::attempt($request->only('email', 'password'))) {
            return response()->json([
                'message' => 'Las credenciales no coinciden.',
            ], 401);
        }

        $user = User::where('email', $request->email)->firstOrFail();
        $token = $user->createToken('auth_token')->plainTextToken;
        $cliente = $user->cliente;
        $vet = $user->veterinario;

        $primerNombre = 'Usuario';
        if ($cliente) {
            $primerNombre = explode(' ', trim($cliente->nombre ?? 'Usuario'))[0];
        } elseif ($vet) {
            $primerNombre = explode(' ', trim($vet->nombre ?? 'Dr. Veterinario'))[0];
        } elseif ($user->rol === 'admin') {
            $primerNombre = 'Administrador';
        }

        $nombreCompleto = $cliente ? $cliente->nombre : ($vet ? $vet->nombre : ($user->rol === 'admin' ? 'Director Administrativo' : ''));
        $foto = $cliente
            ? ($cliente->foto_perfil ?? 'https://res.cloudinary.com/dedroug6v/image/upload/v1/usuarios/default.jpg')
            : ($vet
                ? ($vet->foto_perfil ?? 'https://res.cloudinary.com/dedroug6v/image/upload/v1782673220/felipe-restrepo_qjvdxd.jpg')
                : 'https://res.cloudinary.com/dedroug6v/image/upload/v1782673220/felipe-restrepo_qjvdxd.jpg');

        return response()->json([
            'message' => 'Inicio de sesión exitoso.',
            'token' => $token,
            'user' => [
                'id_usuario' => $user->id_usuario,
                'id_cliente' => $cliente ? $cliente->id_cliente : null,
                'id_veterinario' => $vet ? $vet->id_veterinario : null,
                'email' => $user->email,
                'rol' => $user->rol ?? 'cliente',
                'nombre' => $primerNombre,
                'nombreCompleto' => $nombreCompleto,
                'numero_tarjeta' => $vet ? $vet->numero_tarjeta : null,
                'foto' => $foto,
            ],
        ], 200);
    }

    public function googleAuth(Request $request)
    {
        $request->validate([
            'token' => 'required|string',
            'token_type' => 'nullable|string|in:id_token,access_token',
        ]);

        $token = $request->input('token');
        $tokenType = $request->input('token_type', 'access_token');

        try {
            $email = null;
            $name = null;
            $picture = null;
            $emailVerified = false;
            $aud = null;
            $azp = null;

            if ($tokenType === 'id_token') {
                $response = Http::get("https://oauth2.googleapis.com/tokeninfo?id_token={$token}");
                if ($response->successful()) {
                    $data = $response->json();
                    $email = $data['email'] ?? null;
                    $name = $data['name'] ?? ($data['given_name'] ?? null);
                    $picture = $data['picture'] ?? null;
                    $emailVerified = filter_var($data['email_verified'] ?? false, FILTER_VALIDATE_BOOLEAN);
                    $aud = $data['aud'] ?? null;
                    $azp = $data['azp'] ?? null;
                }
            } else {
                // flow con access_token usando la API userinfo de Google
                $response = Http::withHeaders([
                    'Authorization' => "Bearer {$token}",
                ])->get('https://www.googleapis.com/oauth2/v3/userinfo');

                if ($response->successful()) {
                    $data = $response->json();
                    $email = $data['email'] ?? null;
                    $name = $data['name'] ?? ($data['given_name'] ?? null);
                    $picture = $data['picture'] ?? null;
                    $emailVerified = filter_var($data['email_verified'] ?? false, FILTER_VALIDATE_BOOLEAN);
                }

                $tokenInfoRes = Http::get("https://oauth2.googleapis.com/tokeninfo?access_token={$token}");
                if ($tokenInfoRes->successful()) {
                    $tInfo = $tokenInfoRes->json();
                    $aud = $tInfo['aud'] ?? $aud;
                    $azp = $tInfo['azp'] ?? $azp;
                    if (isset($tInfo['email_verified'])) {
                        $emailVerified = filter_var($tInfo['email_verified'], FILTER_VALIDATE_BOOLEAN);
                    }
                    if (!$email && isset($tInfo['email'])) {
                        $email = $tInfo['email'];
                    }
                }
            }

            if (!$email) {
                return response()->json([
                    'message' => 'No se pudo verificar la sesión con Google o el token ha caducado.',
                ], 401);
            }

            if (!$emailVerified) {
                return response()->json([
                    'message' => 'El correo electrónico asociado a la cuenta de Google no está verificado.',
                ], 401);
            }

            // Validar que el token pertenezca al Client ID configurado de la app
            $expectedClientId = config('services.google.client_id');
            if ($expectedClientId) {
                $matchesAud = $aud && $aud === $expectedClientId;
                $matchesAzp = $azp && $azp === $expectedClientId;

                if (!$matchesAud && !$matchesAzp) {
                    return response()->json([
                        'message' => 'El token de autenticación no pertenece a esta aplicación.',
                    ], 401);
                }
            }

            if (!$name) {
                $name = explode('@', $email)[0];
            }

            $user = User::where('email', $email)->first();

            if (!$user) {
                $result = DB::transaction(function () use ($email, $name, $picture) {
                    $user = User::create([
                        'email' => $email,
                        'contrasena_hash' => Hash::make(Str::random(24)),
                        'rol' => 'cliente',
                        'activo' => 1,
                    ]);

                    $cliente = Cliente::create([
                        'id_usuario' => $user->id_usuario,
                        'nombre' => $name,
                        'foto_perfil' => $picture ?? 'https://res.cloudinary.com/dedroug6v/image/upload/v1/usuarios/default.jpg',
                    ]);

                    return [$user, $cliente];
                });

                [$user, $cliente] = $result;
            } else {
                $cliente = $user->cliente;
                if (!$cliente) {
                    $cliente = Cliente::create([
                        'id_usuario' => $user->id_usuario,
                        'nombre' => $name,
                        'foto_perfil' => $picture ?? 'https://res.cloudinary.com/dedroug6v/image/upload/v1/usuarios/default.jpg',
                    ]);
                } else if ($picture && str_contains($cliente->foto_perfil ?? '', 'default.jpg')) {
                    $cliente->foto_perfil = $picture;
                    $cliente->save();
                }
            }

            if (!$user->activo) {
                return response()->json([
                    'message' => 'Tu cuenta se encuentra desactivada.',
                ], 403);
            }

            $sanctumToken = $user->createToken('auth_token')->plainTextToken;

            $primerNombre = $cliente
                ? explode(' ', trim($cliente->nombre ?? 'Usuario'))[0]
                : ($user->rol === 'admin' ? 'Administrador' : 'Usuario');

            return response()->json([
                'message' => 'Inicio de sesión con Google exitoso.',
                'token' => $sanctumToken,
                'user' => [
                    'id_usuario' => $user->id_usuario,
                    'id_cliente' => $cliente ? $cliente->id_cliente : null,
                    'email' => $user->email,
                    'rol' => $user->rol ?? 'cliente',
                    'nombre' => $primerNombre,
                    'nombreCompleto' => $cliente ? $cliente->nombre : ($user->rol === 'admin' ? 'Director Administrativo' : ''),
                    'foto' => $cliente
                        ? ($cliente->foto_perfil ?? 'https://res.cloudinary.com/dedroug6v/image/upload/v1/usuarios/default.jpg')
                        : 'https://res.cloudinary.com/dedroug6v/image/upload/v1782673220/felipe-restrepo_qjvdxd.jpg',
                ],
            ], 200);

        } catch (\Throwable $e) {
            return response()->json([
                'message' => 'Error de conexión durante la autenticación con Google: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'message' => 'Sesión cerrada correctamente.',
        ]);
    }

    public function me(Request $request)
    {
        $user = $request->user();
        $cliente = $user->cliente;

        $primerNombre = $cliente ? explode(' ', trim($cliente->nombre ?? 'Usuario'))[0] : 'Usuario';

        return response()->json([
            'id_usuario' => $user->id_usuario,
            'id_cliente' => $cliente ? $cliente->id_cliente : null,
            'email' => $user->email,
            'rol' => $user->rol ?? 'cliente',
            'nombre' => $primerNombre,
            'nombreCompleto' => $cliente ? $cliente->nombre : '',
            'telefono' => $cliente ? $cliente->telefono : '',
            'direccion' => $cliente ? $cliente->direccion : '',
            'cedula' => $cliente ? ($cliente->cedula ?? '') : '',
            'fecha_nacimiento' => $cliente ? ($cliente->fecha_nacimiento ?? '') : '',
            'departamento' => $cliente ? ($cliente->departamento ?? '') : '',
            'ciudad' => $cliente ? ($cliente->ciudad ?? '') : '',
            'contacto_emergencia_nombre' => $cliente ? ($cliente->contacto_emergencia_nombre ?? '') : '',
            'contacto_emergencia_telefono' => $cliente ? ($cliente->contacto_emergencia_telefono ?? '') : '',
            'notificaciones_email' => $cliente ? (bool) ($cliente->notificaciones_email ?? true) : true,
            'recordatorios_citas' => $cliente ? (bool) ($cliente->recordatorios_citas ?? true) : true,
            'foto' => $cliente ? ($cliente->foto_perfil ?? 'https://res.cloudinary.com/dedroug6v/image/upload/v1/usuarios/default.jpg') : 'https://res.cloudinary.com/dedroug6v/image/upload/v1/usuarios/default.jpg',
        ]);
    }


    public function updatePerfil(Request $request)
    {
        $user = $request->user();
        $cliente = $user->cliente;

        if (!$cliente) {
            return response()->json([
                'message' => 'El usuario autenticado no está registrado como cliente.',
            ], 404);
        }

        $request->validate([
            'nombre' => 'nullable|string|max:150',
            'telefono' => 'nullable|string|max:50',
            'direccion' => 'nullable|string|max:200',
            'cedula' => 'nullable|string|max:50',
            'fecha_nacimiento' => 'nullable|date',
            'fecha_afiliacion' => 'nullable|date',
            'departamento' => 'nullable|string|max:100',
            'ciudad' => 'nullable|string|max:100',
            'contacto_emergencia_nombre' => 'nullable|string|max:150',
            'contacto_emergencia_telefono' => 'nullable|string|max:50',
            'es_afiliado' => 'nullable',
            'notificaciones_email' => 'nullable',
            'recordatorios_citas' => 'nullable',
            'foto' => 'nullable|image|mimes:jpeg,jpg,png,webp|max:5120',
        ]);

        if ($request->has('nombre')) $cliente->nombre = $request->nombre;
        if ($request->has('telefono')) $cliente->telefono = $request->telefono;
        if ($request->has('direccion')) $cliente->direccion = $request->direccion;
        if ($request->has('cedula')) $cliente->cedula = $request->cedula;
        if ($request->has('fecha_nacimiento')) $cliente->fecha_nacimiento = $request->fecha_nacimiento;
        if ($request->has('fecha_afiliacion')) $cliente->fecha_afiliacion = $request->fecha_afiliacion;
        if ($request->has('es_afiliado')) $cliente->es_afiliado = filter_var($request->es_afiliado, FILTER_VALIDATE_BOOLEAN);
        if ($request->has('departamento')) $cliente->departamento = $request->departamento;
        if ($request->has('ciudad')) $cliente->ciudad = $request->ciudad;
        if ($request->has('contacto_emergencia_nombre')) $cliente->contacto_emergencia_nombre = $request->contacto_emergencia_nombre;
        if ($request->has('contacto_emergencia_telefono')) $cliente->contacto_emergencia_telefono = $request->contacto_emergencia_telefono;
        if ($request->has('notificaciones_email')) $cliente->notificaciones_email = filter_var($request->notificaciones_email, FILTER_VALIDATE_BOOLEAN);
        if ($request->has('recordatorios_citas')) $cliente->recordatorios_citas = filter_var($request->recordatorios_citas, FILTER_VALIDATE_BOOLEAN);

        if ($request->hasFile('foto')) {
            $cliente->foto_perfil = CloudinaryService::upload($request->file('foto'), 'usuarios');
        }

        $cliente->save();

        $primerNombre = explode(' ', trim($cliente->nombre ?? 'Usuario'))[0];

        return response()->json([
            'message' => 'Perfil actualizado correctamente.',
            'cliente' => [
                'id_cliente' => $cliente->id_cliente,
                'nombre' => $primerNombre,
                'nombreCompleto' => $cliente->nombre,
                'email' => $user->email,
                'telefono' => $cliente->telefono,
                'direccion' => $cliente->direccion,
                'cedula' => $cliente->cedula ?? '',
                'fecha_nacimiento' => $cliente->fecha_nacimiento ?? '',
                'departamento' => $cliente->departamento ?? '',
                'ciudad' => $cliente->ciudad ?? '',
                'contacto_emergencia_nombre' => $cliente->contacto_emergencia_nombre ?? '',
                'contacto_emergencia_telefono' => $cliente->contacto_emergencia_telefono ?? '',
                'notificaciones_email' => (bool) $cliente->notificaciones_email,
                'recordatorios_citas' => (bool) $cliente->recordatorios_citas,
                'foto' => $cliente->foto_perfil ?? 'https://res.cloudinary.com/dedroug6v/image/upload/v1/usuarios/default.jpg',
            ],
        ], 200);

    }

    public function changePassword(Request $request)
    {
        $user = $request->user();

        $request->validate([
            'contrasena_actual' => 'nullable|string',
            'nueva_contrasena' => 'required|string|min:6',
            'confirmar_nueva_contrasena' => 'required|string|same:nueva_contrasena',
        ]);

        if (Hash::check($request->nueva_contrasena, $user->contrasena_hash)) {
            return response()->json([
                'message' => 'La nueva contraseña no puede ser igual a la actual.',
            ], 422);
        }

        if ($request->filled('contrasena_actual')) {
            if (!Hash::check($request->contrasena_actual, $user->contrasena_hash)) {
                return response()->json([
                    'message' => 'La contraseña actual no es correcta.',
                ], 422);
            }
        }

        $user->contrasena_hash = Hash::make($request->nueva_contrasena);
        $user->save();

        return response()->json([
            'message' => 'Contraseña actualizada correctamente.',
        ]);
    }

    public function logoutAll(Request $request)
    {
        $user = $request->user();
        $user->tokens()->delete();

        return response()->json([
            'message' => 'Se ha cerrado la sesión en todos los dispositivos.',
        ]);
    }

    public function deleteAccount(Request $request)
    {
        $user = $request->user();
        $user->tokens()->delete();
        $user->activo = 0;
        $user->save();

        return response()->json([
            'message' => 'Tu cuenta ha sido desactivada correctamente.',
        ]);
    }
}
