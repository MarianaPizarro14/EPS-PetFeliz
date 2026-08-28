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

class AuthController extends Controller
{
    public function register(RegisterRequest $request)
    {
        $result = DB::transaction(function () use ($request) {
            $user = User::create([
                'email' => $request->email,
                'contrasena_hash' => Hash::make($request->password),
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

        return response()->json([
            'message' => 'Inicio de sesión exitoso.',
            'user' => $user,
            'token' => $token,
        ]);
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
        $request->validate([
            'contrasena_actual' => 'required|string',
            'nueva_contrasena' => 'required|string|min:6',
            'confirmar_nueva_contrasena' => 'required|string|same:nueva_contrasena',
        ]);

        $user = $request->user();

        if (!Hash::check($request->contrasena_actual, $user->contrasena_hash)) {
            return response()->json([
                'message' => 'La contraseña actual no es correcta.',
            ], 422);
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
