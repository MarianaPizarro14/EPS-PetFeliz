// src/data/serviciosData.js
// Catálogo de Servicios Médicos Veterinarios por defecto para EPS PetFeliz.
// Sirve como catálogo oficial y respaldo en caso de que la tabla 'servicio' en la BD esté vacía.

export const serviciosData = [
  {
    id_servicio: 1,
    nombre: 'Consulta General',
    descripcion: 'Evaluación integral del estado de salud de tu mascota con diagnóstico y plan de tratamiento personalizado.',
    precio_base: 70000, // Precio regular/particular sin afiliación (confirmar si $70.000 o $100.000)
    precio_afiliado: 0, // Incluido en plan EPS ($0 COP)
    incluido_en_plan: true,
    activo: true,
    foto: null,
  },
  {
    id_servicio: 2,
    nombre: 'Vacunación',
    descripcion: 'Esquema completo de vacunas para perros y gatos según edad, raza y estilo de vida.',
    precio_base: 75000,
    precio_afiliado: 20000,
    incluido_en_plan: true,
    activo: true,
    foto: null,
  },
  {
    id_servicio: 3,
    nombre: 'Desparasitación',
    descripcion: 'Tratamiento interno y externo contra parásitos adaptado al peso, edad y hábitos de tu mascota.',
    precio_base: 55000,
    precio_afiliado: 20000,
    incluido_en_plan: true,
    activo: true,
    foto: null,
  },
  {
    id_servicio: 4,
    nombre: 'Urgencias',
    descripcion: 'Atención médica veterinaria prioritaria y de emergencia 24/7 para estabilización e intervenciones requeridas.',
    precio_base: 120000,
    precio_afiliado: 50000,
    incluido_en_plan: false,
    activo: true,
    foto: null,
  },
  {
    id_servicio: 5,
    nombre: 'Laboratorio Clínico',
    descripcion: 'Análisis de sangre, orina, coprológicos y profilaxis para diagnóstico preciso de patologías.',
    precio_base: 110000,
    precio_afiliado: 45000,
    incluido_en_plan: false,
    activo: true,
    foto: null,
  },
  {
    id_servicio: 6,
    nombre: 'Odontología',
    descripcion: 'Profilaxis dental profesional, extracciones y tratamiento de enfermedades periodontales.',
    precio_base: 180000,
    precio_afiliado: 80000,
    incluido_en_plan: false,
    activo: true,
    foto: null,
  },
  {
    id_servicio: 7,
    nombre: 'Cirugía',
    descripcion: 'Procedimientos quirúrgicos generales y especializados con anestesia inhalada y monitoreo constante.',
    precio_base: 450000,
    precio_afiliado: 200000,
    incluido_en_plan: false,
    activo: true,
    foto: null,
  },
]

export default serviciosData
