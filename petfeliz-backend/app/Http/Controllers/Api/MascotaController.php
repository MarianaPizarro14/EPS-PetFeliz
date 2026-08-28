<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Mascota;
use Carbon\Carbon;
use Illuminate\Http\Request;
use App\Services\CloudinaryService;

class MascotaController extends Controller
{
    /**
     * Listar mascotas del usuario (cliente) autenticado.
     */
    public function index(Request $request)
    {
        $cliente = $request->user()->cliente;

        if (!$cliente) {
            return response()->json([
                'message' => 'El usuario no está registrado como cliente.',
            ], 404);
        }

        $mascotas = Mascota::where('id_cliente', $cliente->id_cliente)
            ->orderBy('id_mascota', 'desc')
            ->get()
            ->map(function ($mascota) {
                return $this->formatMascota($mascota);
            });

        return response()->json($mascotas, 200);
    }

    /**
     * Registrar una nueva mascota para el cliente en sesión.
     */
    public function store(Request $request)
    {
        $cliente = $request->user()->cliente;

        if (!$cliente) {
            return response()->json([
                'message' => 'El usuario no está registrado como cliente.',
            ], 404);
        }

        $request->validate([
            'nombre' => 'required|string|max:100',
            'especie' => 'nullable|string|max:50',
            'raza' => 'nullable|string|max:50',
            'sexo' => 'nullable|string|max:20',
            'fecha_nacimiento' => 'nullable|date',
            'peso' => 'nullable|numeric|min:0',
            'foto' => 'nullable|image|mimes:jpeg,jpg,png,webp|max:5120',
            'foto_mascota' => 'nullable',
        ]);

        $fotoUrl = is_string($request->foto_mascota) ? $request->foto_mascota : null;

        if ($request->hasFile('foto')) {
            $fotoUrl = CloudinaryService::upload($request->file('foto'), 'mascotas');
        } elseif ($request->hasFile('foto_mascota')) {
            $fotoUrl = CloudinaryService::upload($request->file('foto_mascota'), 'mascotas');
        }

        $mascota = Mascota::create([
            'id_cliente' => $cliente->id_cliente,
            'nombre' => $request->nombre,
            'especie' => $request->especie ?? 'Canino',
            'raza' => $request->raza ?? 'Criollo',
            'sexo' => $request->sexo ?? 'Macho',
            'fecha_nacimiento' => $request->fecha_nacimiento,
            'peso' => $request->peso,
            'foto_mascota' => $fotoUrl,
        ]);

        return response()->json([
            'message' => 'Mascota registrada correctamente.',
            'mascota' => $this->formatMascota($mascota),
        ], 201);
    }

    /**
     * Obtener el detalle de una mascota específica.
     */
    public function show(Request $request, $id)
    {
        $cliente = $request->user()->cliente;

        $mascota = Mascota::where('id_cliente', $cliente->id_cliente)
            ->where('id_mascota', $id)
            ->firstOrFail();

        return response()->json($this->formatMascota($mascota), 200);
    }

    /**
     * Actualizar la información de una mascota.
     */
    public function update(Request $request, $id)
    {
        $cliente = $request->user()->cliente;

        $mascota = Mascota::where('id_cliente', $cliente->id_cliente)
            ->where('id_mascota', $id)
            ->first();

        if (!$mascota) {
            return response()->json([
                'message' => 'Mascota no encontrada o no tienes permisos para editarla.',
            ], 404);
        }

        $request->validate([
            'nombre' => 'sometimes|required|string|max:100',
            'especie' => 'nullable|string|max:50',
            'raza' => 'nullable|string|max:50',
            'sexo' => 'nullable|string|max:20',
            'fecha_nacimiento' => 'nullable|date',
            'peso' => 'nullable|numeric|min:0',
            'foto' => 'nullable|image|mimes:jpeg,jpg,png,webp|max:5120',
            'foto_mascota' => 'nullable',
        ]);

        $data = $request->only([
            'nombre',
            'especie',
            'raza',
            'sexo',
            'fecha_nacimiento',
            'peso',
        ]);

        if ($request->hasFile('foto')) {
            $data['foto_mascota'] = CloudinaryService::upload($request->file('foto'), 'mascotas');
        } elseif ($request->hasFile('foto_mascota')) {
            $data['foto_mascota'] = CloudinaryService::upload($request->file('foto_mascota'), 'mascotas');
        } elseif ($request->has('foto_mascota') && is_string($request->foto_mascota)) {
            $data['foto_mascota'] = $request->foto_mascota;
        }

        $mascota->update($data);

        return response()->json([
            'message' => 'Información de la mascota actualizada correctamente.',
            'mascota' => $this->formatMascota($mascota),
        ], 200);
    }

    /**
     * Eliminar (soft delete) una mascota.
     */
    public function destroy(Request $request, $id)
    {
        $cliente = $request->user()->cliente;

        $mascota = Mascota::where('id_cliente', $cliente->id_cliente)
            ->where('id_mascota', $id)
            ->first();

        if (!$mascota) {
            return response()->json([
                'message' => 'Mascota no encontrada o no tienes permisos para eliminarla.',
            ], 404);
        }

        $mascota->delete();

        return response()->json([
            'message' => 'Mascota eliminada correctamente.',
        ], 200);
    }

    /**
     * Helper interno para dar formato consistente a la mascota.
     */
    private function formatMascota(Mascota $mascota)
    {
        $edadTexto = 'Edad N/A';
        if ($mascota->fecha_nacimiento) {
            $nacimiento = Carbon::parse($mascota->fecha_nacimiento);
            $anios = (int) $nacimiento->diffInYears(Carbon::now());
            if ($anios > 0) {
                $edadTexto = $anios . ($anios === 1 ? ' Año' : ' Años');
            } else {
                $meses = (int) $nacimiento->diffInMonths(Carbon::now());
                $edadTexto = $meses . ($meses === 1 ? ' Mes' : ' Meses');
            }
        }

        return [
            'id' => $mascota->id_mascota,
            'nombre' => $mascota->nombre,
            'especie' => $mascota->especie ?? 'Canino',
            'raza' => $mascota->raza ?? 'Criollo',
            'sexo' => $mascota->sexo ?? 'Macho',
            'fecha_nacimiento' => $mascota->fecha_nacimiento,
            'edad' => $edadTexto,
            'peso' => $mascota->peso !== null ? (float) $mascota->peso : null,
            'foto' => $mascota->foto_mascota ?? 'https://res.cloudinary.com/dedroug6v/image/upload/v1/mascotas/default_pet.jpg',
            'estado' => 'ok',
        ];
    }
}
