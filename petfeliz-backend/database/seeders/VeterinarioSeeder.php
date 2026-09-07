<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class VeterinarioSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $vets = [
            ['id' => 1, 'nombre' => 'Dr. Andrés Gómez', 'foto' => 'https://res.cloudinary.com/dedroug6v/image/upload/v1782673207/andres-gomez_nh7kqg.jpg'],
            ['id' => 2, 'nombre' => 'Dra. Luisa Fernanda Mora', 'foto' => 'https://res.cloudinary.com/dedroug6v/image/upload/v1782673224/luisa-fernanda-mora_b8ix5z.jpg'],
            ['id' => 3, 'nombre' => 'Dr. Felipe Restrepo', 'foto' => 'https://res.cloudinary.com/dedroug6v/image/upload/v1782673220/felipe-restrepo_qjvdxd.jpg'],
            ['id' => 4, 'nombre' => 'Dra. Natalia Ospina', 'foto' => 'https://res.cloudinary.com/dedroug6v/image/upload/v1782673226/natalia-ospina_q0c9g2.jpg'],
            ['id' => 5, 'nombre' => 'Dr. Juan Pablo Vélez', 'foto' => 'https://res.cloudinary.com/dedroug6v/image/upload/v1782673223/juan-pablo-velez_gcneud.jpg'],
            ['id' => 6, 'nombre' => 'Dra. Valentina Cruz', 'foto' => 'https://res.cloudinary.com/dedroug6v/image/upload/v1782673227/valentina-cruz_ktb3po.jpg'],
            ['id' => 7, 'nombre' => 'Dr. Sebastián Lozano', 'foto' => 'https://res.cloudinary.com/dedroug6v/image/upload/v1782673226/sebastian-lozano_d2y8p2.jpg'],
            ['id' => 8, 'nombre' => 'Dra. Carolina Muñoz', 'foto' => 'https://res.cloudinary.com/dedroug6v/image/upload/v1782673223/carolina-mu%C3%B1oz_de5bpz.jpg'],
            ['id' => 9, 'nombre' => 'Dr. Esteban Cardona', 'foto' => 'https://res.cloudinary.com/dedroug6v/image/upload/v1782673223/esteban-cardona_su68zf.jpg'],
            ['id' => 10, 'nombre' => 'Dra. Mariana Salazar', 'foto' => 'https://res.cloudinary.com/dedroug6v/image/upload/v1782673224/mariana-salazar_cgfsj4.jpg'],
            ['id' => 11, 'nombre' => 'Dr. Ricardo Herrera', 'foto' => 'https://res.cloudinary.com/dedroug6v/image/upload/v1782673226/ricardo-herrera_cri3jl.jpg'],
            ['id' => 12, 'nombre' => 'Dra. Isabela Tobón', 'foto' => 'https://res.cloudinary.com/dedroug6v/image/upload/v1782673223/isabela-tobon_uzmysl.jpg'],
            ['id' => 13, 'nombre' => 'Dr. Tomás Agudelo', 'foto' => 'https://res.cloudinary.com/dedroug6v/image/upload/v1782673227/tomas-agudelo_u6eohz.jpg'],
            ['id' => 14, 'nombre' => 'Dra. Alejandra Patiño', 'foto' => 'https://res.cloudinary.com/dedroug6v/image/upload/v1782673205/alejandra-pati%C3%B1o_m6h1gr.jpg'],
            ['id' => 15, 'nombre' => 'Dr. Mauricio Londoño', 'foto' => 'https://res.cloudinary.com/dedroug6v/image/upload/v1782673225/mauricio-londo%C3%B1o_yeonik.jpg'],
            ['id' => 16, 'nombre' => 'Dra. Diana Ríos', 'foto' => 'https://res.cloudinary.com/dedroug6v/image/upload/v1782673221/diana-rios_olk7ci.jpg'],
            ['id' => 17, 'nombre' => 'Dr. Hernán Zapata', 'foto' => 'https://res.cloudinary.com/dedroug6v/image/upload/v1782673224/hernan-zapata_whxxms.jpg'],
            ['id' => 18, 'nombre' => 'Dra. Paola Ríos', 'foto' => 'https://res.cloudinary.com/dedroug6v/image/upload/v1782673227/paola-rios_sydn3f.jpg'],
            ['id' => 19, 'nombre' => 'Dr. Camilo Arango', 'foto' => 'https://res.cloudinary.com/dedroug6v/image/upload/v1782673220/camilo-arango_mn8o8q.jpg'],
            ['id' => 20, 'nombre' => 'Dra. Juliana Ossa', 'foto' => 'https://res.cloudinary.com/dedroug6v/image/upload/v1782673223/juliana-ossa_bhom4f.jpg'],
            ['id' => 21, 'nombre' => 'Dr. Nicolás Gaviria', 'foto' => 'https://res.cloudinary.com/dedroug6v/image/upload/v1782673225/nicolas-gaviria_f9m5i0.jpg'],
            ['id' => 22, 'nombre' => 'Dra. Blanca Montoya', 'foto' => 'https://res.cloudinary.com/dedroug6v/image/upload/v1782673219/blanca-montoya_ama4hq.jpg'],
            ['id' => 23, 'nombre' => 'Dra. Fernanda Restrepo', 'foto' => 'https://res.cloudinary.com/dedroug6v/image/upload/v1784691308/fernanda-restrepo_nsntfs.jpg'],
            ['id' => 24, 'nombre' => 'Dr. Julián Correa', 'foto' => 'https://res.cloudinary.com/dedroug6v/image/upload/v1784691307/julian-correa_furug7.jpg'],
            ['id' => 25, 'nombre' => 'Dra. Melissa Duarte', 'foto' => 'https://res.cloudinary.com/dedroug6v/image/upload/v1784691306/melissa-duarte_surslq.jpg'],
            ['id' => 26, 'nombre' => 'Dr. Santiago Peláez', 'foto' => 'https://res.cloudinary.com/dedroug6v/image/upload/v1784691306/santiago-pelaez_xwhbhq.jpg'],
            ['id' => 27, 'nombre' => 'Dra. Camila Sepúlveda', 'foto' => 'https://res.cloudinary.com/dedroug6v/image/upload/v1784691306/camila-sepulveda_f3mf1g.jpg'],
            ['id' => 28, 'nombre' => 'Dra. Laura Martínez', 'foto' => 'https://res.cloudinary.com/dedroug6v/image/upload/v1788216413/pexels-eric-moura-859101902-32788234_flbyor.jpg'],
        ];

        foreach ($vets as $vet) {
            $userId = 1000 + $vet['id'];
            $email = 'vet_' . $vet['id'] . '@petfeliz.com';

            // Crear usuario si no existe
            $existingUser = DB::table('usuario')->where('id_usuario', $userId)->orWhere('email', $email)->first();
            if (!$existingUser) {
                DB::table('usuario')->insert([
                    'id_usuario' => $userId,
                    'email' => $email,
                    'contrasena_hash' => Hash::make('password123'),
                    'activo' => true,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            } else {
                $userId = $existingUser->id_usuario;
            }

            // Crear o actualizar veterinario con id_veterinario exacto
            DB::table('veterinario')->updateOrInsert(
                ['id_veterinario' => $vet['id']],
                [
                    'id_usuario' => $userId,
                    'id_sucursal' => 1,
                    'nombre' => $vet['nombre'],
                    'telefono' => '30000000' . str_pad($vet['id'], 2, '0', STR_PAD_LEFT),
                    'numero_tarjeta' => 'MP-' . str_pad($vet['id'], 5, '0', STR_PAD_LEFT),
                    'foto_perfil' => $vet['foto'],
                    'created_at' => now(),
                    'updated_at' => now(),
                ]
            );
        }
    }
}
