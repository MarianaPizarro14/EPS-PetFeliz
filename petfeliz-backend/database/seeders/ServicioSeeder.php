<?php

namespace Database\Seeders;

use App\Models\Servicio;
use Illuminate\Database\Seeder;

class ServicioSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $servicios = [
            [
                'id_servicio' => 1,
                'nombre' => 'Consulta General',
                'descripcion' => 'Evaluación integral del estado de salud de tu mascota con diagnóstico y plan de tratamiento personalizado.',
                'precio_base' => 70000.00,
                'precio_afiliado' => 0.00,
                'incluido_en_plan' => true,
                'activo' => true,
                'limite_mensual_incluido' => 3,
            ],
            [
                'id_servicio' => 2,
                'nombre' => 'Vacunación',
                'descripcion' => 'Esquema completo de vacunas para perros y gatos según edad, raza y estilo de vida.',
                'precio_base' => 75000.00,
                'precio_afiliado' => 20000.00,
                'incluido_en_plan' => true,
                'activo' => true,
                'limite_mensual_incluido' => null,
            ],
            [
                'id_servicio' => 3,
                'nombre' => 'Desparasitación',
                'descripcion' => 'Tratamiento interno y externo contra parásitos adaptado al peso, edad y hábitos de tu mascota.',
                'precio_base' => 55000.00,
                'precio_afiliado' => 20000.00,
                'incluido_en_plan' => true,
                'activo' => true,
                'limite_mensual_incluido' => null,
            ],
            [
                'id_servicio' => 4,
                'nombre' => 'Urgencias',
                'descripcion' => 'Atención médica veterinaria prioritaria y de emergencia 24/7 para estabilización e intervenciones requeridas.',
                'precio_base' => 120000.00,
                'precio_afiliado' => 50000.00,
                'incluido_en_plan' => false,
                'activo' => true,
                'limite_mensual_incluido' => null,
            ],
            [
                'id_servicio' => 5,
                'nombre' => 'Laboratorio Clínico',
                'descripcion' => 'Análisis de sangre, orina, coprológicos y profilaxis para diagnóstico preciso de patologías.',
                'precio_base' => 110000.00,
                'precio_afiliado' => 45000.00,
                'incluido_en_plan' => false,
                'activo' => true,
                'limite_mensual_incluido' => null,
            ],
            [
                'id_servicio' => 6,
                'nombre' => 'Odontología',
                'descripcion' => 'Profilaxis dental profesional, extracciones y tratamiento de enfermedades periodontales.',
                'precio_base' => 180000.00,
                'precio_afiliado' => 80000.00,
                'incluido_en_plan' => false,
                'activo' => true,
                'limite_mensual_incluido' => null,
            ],
            [
                'id_servicio' => 7,
                'nombre' => 'Cirugía',
                'descripcion' => 'Procedimientos quirúrgicos generales y especializados con anestesia inhalada y monitoreo constante.',
                'precio_base' => 450000.00,
                'precio_afiliado' => 200000.00,
                'incluido_en_plan' => false,
                'activo' => true,
                'limite_mensual_incluido' => null,
            ],
        ];

        foreach ($servicios as $datos) {
            Servicio::updateOrCreate(
                ['id_servicio' => $datos['id_servicio']],
                $datos
            );
        }
    }
}
