<?php

namespace App\Http\Requests;

use App\Helpers\PhoneHelper;
use Illuminate\Foundation\Http\FormRequest;

class RegisterRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'nombre' => ['required', 'string', 'max:100'],
            'email' => ['required', 'string', 'email', 'max:100', 'unique:usuario,email'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
            'telefono' => [
                'nullable',
                'string',
                'max:30',
                function ($attribute, $value, $fail) {
                    if (!empty($value) && !PhoneHelper::isUniquePhone($value)) {
                        $fail('Este número de teléfono o celular ya se encuentra registrado por otro usuario en el sistema.');
                    }
                },
            ],
            'direccion' => ['nullable', 'string', 'max:255'],
        ];
    }

    public function messages(): array
    {
        return [
            'nombre.required' => 'El nombre es obligatorio.',
            'email.unique' => 'Este correo ya está registrado.',
            'password.confirmed' => 'Las contraseñas no coinciden.',
            'password.min' => 'La contraseña debe tener al menos 8 caracteres.',
        ];
    }
}