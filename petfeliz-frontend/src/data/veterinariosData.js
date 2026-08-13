// src/data/veterinariosData.js
// Roster REAL extraído de la base de datos MySQL (tablas veterinario + veterinario_especialidad + especialidad)
// NOTA: en la BD existen variantes de escritura para la misma especialidad
// (ej. 'Medicina general' vs 'Médico General', 'Dermatologia' vs 'Dermatólogo').
// Se normalizan aquí para que el filtro no muestre duplicados. Lo ideal a futuro
// es limpiar/estandarizar esos valores directamente en la tabla `especialidad`.
//
// 2026-07-28: se corrigieron las especialidades de 22 de los 27 veterinarios,
// que estaban mal asignadas (la mayoría aparecía como "Dermatología" o
// "Medicina General" cuando en realidad pertenecen a Urgencias, Desparasitación,
// Vacunación, Médico Director o Cirugía). Fuente de verdad: roster oficial del equipo.

export const ESPECIALIDAD_NORMALIZE_MAP = {
  'medicina general': 'Medicina General',
  'médico general': 'Medicina General',
  'medico general': 'Medicina General',
  'cirugia': 'Cirugía',
  'cirugía': 'Cirugía',
  'dermatologia': 'Dermatología',
  'dermatología': 'Dermatología',
  'dermatólogo': 'Dermatología',
  'dermatologo': 'Dermatología',
  'odontologia': 'Odontología',
  'odontología': 'Odontología',
  'cardiologia': 'Cardiología',
  'cardiología': 'Cardiología',
  'oftalmologia': 'Oftalmología',
  'oftalmología': 'Oftalmología',
  'urgencia': 'Urgencias',
  'urgencias': 'Urgencias',
  'desparasitacion': 'Desparasitación',
  'desparasitación': 'Desparasitación',
  'vacunacion': 'Vacunación',
  'vacunación': 'Vacunación',
  'medico director': 'Médico Director',
  'médico director': 'Médico Director',
}

// Normaliza cualquier variante de especialidad que venga de la API/BD
export function normalizarEspecialidad(raw) {
  if (!raw) return raw
  const key = raw.trim().toLowerCase()
  return ESPECIALIDAD_NORMALIZE_MAP[key] || raw.trim()
}

export const veterinariosData = [
  { id: 1, nombre: 'Dr. Andrés Gómez', foto: 'https://res.cloudinary.com/dedroug6v/image/upload/v1782673207/andres-gomez_nh7kqg.jpg', especialidad: 'Medicina General' },
  { id: 2, nombre: 'Dra. Luisa Fernanda Mora', foto: 'https://res.cloudinary.com/dedroug6v/image/upload/v1782673224/luisa-fernanda-mora_b8ix5z.jpg', especialidad: 'Medicina General' },
  { id: 3, nombre: 'Dr. Felipe Restrepo', foto: 'https://res.cloudinary.com/dedroug6v/image/upload/v1782673220/felipe-restrepo_qjvdxd.jpg', especialidad: 'Medicina General' },
  { id: 4, nombre: 'Dra. Natalia Ospina', foto: 'https://res.cloudinary.com/dedroug6v/image/upload/v1782673226/natalia-ospina_q0c9g2.jpg', especialidad: 'Medicina General' },
  { id: 5, nombre: 'Dr. Juan Pablo Vélez', foto: 'https://res.cloudinary.com/dedroug6v/image/upload/v1782673223/juan-pablo-velez_gcneud.jpg', especialidad: 'Medicina General' },
  { id: 6, nombre: 'Dra. Valentina Cruz', foto: 'https://res.cloudinary.com/dedroug6v/image/upload/v1782673227/valentina-cruz_ktb3po.jpg', especialidad: 'Dermatología' },
  { id: 7, nombre: 'Dr. Sebastián Lozano', foto: 'https://res.cloudinary.com/dedroug6v/image/upload/v1782673226/sebastian-lozano_d2y8p2.jpg', especialidad: 'Dermatología' },
  { id: 8, nombre: 'Dra. Carolina Muñoz', foto: 'https://res.cloudinary.com/dedroug6v/image/upload/v1782673223/carolina-mu%C3%B1oz_de5bpz.jpg', especialidad: 'Urgencias' },
  { id: 9, nombre: 'Dr. Esteban Cardona', foto: 'https://res.cloudinary.com/dedroug6v/image/upload/v1782673223/esteban-cardona_su68zf.jpg', especialidad: 'Urgencias' },
  { id: 10, nombre: 'Dra. Mariana Salazar', foto: 'https://res.cloudinary.com/dedroug6v/image/upload/v1782673224/mariana-salazar_cgfsj4.jpg', especialidad: 'Urgencias' },
  { id: 11, nombre: 'Dr. Ricardo Herrera', foto: 'https://res.cloudinary.com/dedroug6v/image/upload/v1782673226/ricardo-herrera_cri3jl.jpg', especialidad: 'Desparasitación' },
  { id: 12, nombre: 'Dra. Isabela Tobón', foto: 'https://res.cloudinary.com/dedroug6v/image/upload/v1782673223/isabela-tobon_uzmysl.jpg', especialidad: 'Desparasitación' },
  { id: 13, nombre: 'Dr. Tomás Agudelo', foto: 'https://res.cloudinary.com/dedroug6v/image/upload/v1782673227/tomas-agudelo_u6eohz.jpg', especialidad: 'Desparasitación' },
  { id: 14, nombre: 'Dra. Alejandra Patiño', foto: 'https://res.cloudinary.com/dedroug6v/image/upload/v1782673205/alejandra-pati%C3%B1o_m6h1gr.jpg', especialidad: 'Vacunación' },
  { id: 15, nombre: 'Dr. Mauricio Londoño', foto: 'https://res.cloudinary.com/dedroug6v/image/upload/v1782673225/mauricio-londo%C3%B1o_yeonik.jpg', especialidad: 'Vacunación' },
  { id: 16, nombre: 'Dra. Diana Ríos', foto: 'https://res.cloudinary.com/dedroug6v/image/upload/v1782673221/diana-rios_olk7ci.jpg', especialidad: 'Médico Director' },
  { id: 17, nombre: 'Dr. Hernán Zapata', foto: 'https://res.cloudinary.com/dedroug6v/image/upload/v1782673224/hernan-zapata_whxxms.jpg', especialidad: 'Médico Director' },
  { id: 18, nombre: 'Dra. Paola Ríos', foto: 'https://res.cloudinary.com/dedroug6v/image/upload/v1782673227/paola-rios_sydn3f.jpg', especialidad: 'Médico Director' },
  { id: 19, nombre: 'Dr. Camilo Arango', foto: 'https://res.cloudinary.com/dedroug6v/image/upload/v1782673220/camilo-arango_mn8o8q.jpg', especialidad: 'Cirugía' },
  { id: 20, nombre: 'Dra. Juliana Ossa', foto: 'https://res.cloudinary.com/dedroug6v/image/upload/v1782673223/juliana-ossa_bhom4f.jpg', especialidad: 'Cirugía' },
  { id: 21, nombre: 'Dr. Nicolás Gaviria', foto: 'https://res.cloudinary.com/dedroug6v/image/upload/v1782673225/nicolas-gaviria_f9m5i0.jpg', especialidad: 'Cirugía' },
  { id: 22, nombre: 'Dra. Blanca Montoya', foto: 'https://res.cloudinary.com/dedroug6v/image/upload/v1782673219/blanca-montoya_ama4hq.jpg', especialidad: 'Odontología' },
  { id: 23, nombre: 'Dra. Fernanda Restrepo', foto: 'https://res.cloudinary.com/dedroug6v/image/upload/v1784691308/fernanda-restrepo_nsntfs.jpg', especialidad: 'Urgencias' },
  { id: 24, nombre: 'Dr. Julián Correa', foto: 'https://res.cloudinary.com/dedroug6v/image/upload/v1784691307/julian-correa_furug7.jpg', especialidad: 'Urgencias' },
  { id: 25, nombre: 'Dra. Melissa Duarte', foto: 'https://res.cloudinary.com/dedroug6v/image/upload/v1784691306/melissa-duarte_surslq.jpg', especialidad: 'Urgencias' },
  { id: 26, nombre: 'Dr. Santiago Peláez', foto: 'https://res.cloudinary.com/dedroug6v/image/upload/v1784691306/santiago-pelaez_xwhbhq.jpg', especialidad: 'Urgencias' },
  { id: 27, nombre: 'Dra. Camila Sepúlveda', foto: 'https://res.cloudinary.com/dedroug6v/image/upload/v1784691306/camila-sepulveda_f3mf1g.jpg', especialidad: 'Urgencias' },
]

export default veterinariosData