// src/components/pages/AdminVeterinarios.jsx
import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getStoredToken, getStoredUser } from '../../utils/authStorage'
import SidebarAdmin from '../ui/SidebarAdmin'
import DashboardHeader from '../ui/DashboardHeader'
import './DashboardClient.css'
import './AdminDashboard.css'
import './AdminCitas.css'
import './AdminMascotas.css'
import './AdminVeterinarios.css'

const ROSTER_FALLBACK = [
  {
    id_veterinario: 1,
    nombre: 'Dr. Andrés Gómez',
    cedula: '1.020.456.789',
    numero_tarjeta: 'TP-18452-COMVEZCOL',
    direccion: 'Calle 33 #76-45, Laureles',
    telefono: '300 456 7890',
    correo: 'andres.gomez@petfeliz.com',
    especialidad: 'Medicina General',
    ciudad: 'Medellín',
    sede: 'Sede Laureles',
    horario: 'Lun–Vie 8:00 AM – 4:00 PM',
    foto_perfil: 'https://res.cloudinary.com/dedroug6v/image/upload/v1782673207/andres-gomez_nh7kqg.jpg',
    estado: 'Activo',
    citas_atendidas: 142,
    descripcion: 'Atención primaria y seguimiento de salud integral para mascotas con 8 años de trayectoria.',
  },
  {
    id_veterinario: 2,
    nombre: 'Dra. Luisa Fernanda Mora',
    cedula: '1.035.678.901',
    numero_tarjeta: 'TP-22104-COMVEZCOL',
    direccion: 'Cra 43A #21S-10, El Poblado',
    telefono: '312 890 1234',
    correo: 'luisa.mora@petfeliz.com',
    especialidad: 'Medicina General',
    ciudad: 'Envigado',
    sede: 'Sede Envigado',
    horario: 'Lun–Sáb 9:00 AM – 4:00 PM',
    foto_perfil: 'https://res.cloudinary.com/dedroug6v/image/upload/v1782673224/luisa-fernanda-mora_b8ix5z.jpg',
    estado: 'Activo',
    citas_atendidas: 118,
    descripcion: 'Especialista en medicina preventiva y control de nutrición animal.',
  },
  {
    id_veterinario: 3,
    nombre: 'Dr. Felipe Restrepo',
    cedula: '1.017.234.567',
    numero_tarjeta: 'TP-19820-COMVEZCOL',
    direccion: 'Diag 55 #42-30, Niquía',
    telefono: '315 234 5678',
    correo: 'felipe.restrepo@petfeliz.com',
    especialidad: 'Medicina General',
    ciudad: 'Bello',
    sede: 'Sede Bello',
    horario: 'Mar–Sáb 8:00 AM – 4:00 PM',
    foto_perfil: 'https://res.cloudinary.com/dedroug6v/image/upload/v1782673220/felipe-restrepo_qjvdxd.jpg',
    estado: 'Activo',
    citas_atendidas: 165,
    descripcion: 'Consulta general, diagnóstico clínico y tratamiento de enfermedades comunes.',
  },
  {
    id_veterinario: 4,
    nombre: 'Dra. Natalia Ospina',
    cedula: '1.028.345.678',
    numero_tarjeta: 'TP-24115-COMVEZCOL',
    direccion: 'Calle 37S #43A-12',
    telefono: '301 345 6789',
    correo: 'natalia.ospina@petfeliz.com',
    especialidad: 'Medicina General',
    ciudad: 'Envigado',
    sede: 'Sede Envigado',
    horario: 'Lun–Vie 10:00 AM – 6:00 PM',
    foto_perfil: 'https://res.cloudinary.com/dedroug6v/image/upload/v1782673226/natalia-ospina_q0c9g2.jpg',
    estado: 'Activo',
    citas_atendidas: 94,
    descripcion: 'Atención clínica personalizada con enfoque en bienestar y calidad de vida animal.',
  },
  {
    id_veterinario: 5,
    nombre: 'Dr. Juan Pablo Vélez',
    cedula: '1.022.456.789',
    numero_tarjeta: 'TP-17630-COMVEZCOL',
    direccion: 'Circular 4 #72-18, Laureles',
    telefono: '316 456 7890',
    correo: 'juan.velez@petfeliz.com',
    especialidad: 'Medicina General',
    ciudad: 'Medellín',
    sede: 'Sede Laureles',
    horario: 'Mié–Dom 8:00 AM – 4:00 PM',
    foto_perfil: 'https://res.cloudinary.com/dedroug6v/image/upload/v1782673223/juan-pablo-velez_gcneud.jpg',
    estado: 'Activo',
    citas_atendidas: 108,
    descripcion: 'Medicina general con énfasis en geriatría y cuidado de mascotas mayores.',
  },
  {
    id_veterinario: 6,
    nombre: 'Dra. Valentina Cruz',
    cedula: '1.039.567.890',
    numero_tarjeta: 'TP-25420-COMVEZCOL',
    direccion: 'Av. Nutibara #68-24',
    telefono: '300 567 8901',
    correo: 'valentina.cruz@petfeliz.com',
    especialidad: 'Dermatología',
    ciudad: 'Medellín',
    sede: 'Sede Laureles · Envigado',
    horario: 'Lun–Vie 8:00 AM – 4:00 PM',
    foto_perfil: 'https://res.cloudinary.com/dedroug6v/image/upload/v1782673227/valentina-cruz_ktb3po.jpg',
    estado: 'Activo',
    citas_atendidas: 88,
    descripcion: 'Especialista en alergias, patologías cutáneas y dermatología clínica.',
  },
  {
    id_veterinario: 7,
    nombre: 'Dr. Sebastián Lozano',
    cedula: '1.018.678.901',
    numero_tarjeta: 'TP-20150-COMVEZCOL',
    direccion: 'Cra 50 #48-15',
    telefono: '317 678 9012',
    correo: 'sebastian.lozano@petfeliz.com',
    especialidad: 'Dermatología',
    ciudad: 'Bello',
    sede: 'Sede Bello · Laureles',
    horario: 'Mar–Sáb 9:00 AM – 5:00 PM',
    foto_perfil: 'https://res.cloudinary.com/dedroug6v/image/upload/v1782673226/sebastian-lozano_d2y8p2.jpg',
    estado: 'Activo',
    citas_atendidas: 76,
    descripcion: 'Tratamiento especializado de afecciones óticas, foliculitis y problemas dermatólogicos.',
  },
  {
    id_veterinario: 8,
    nombre: 'Dra. Carolina Muñoz',
    cedula: '1.026.789.012',
    numero_tarjeta: 'TP-21890-COMVEZCOL',
    direccion: 'Calle 50 #45-20',
    telefono: '310 789 0123',
    correo: 'carolina.munoz@petfeliz.com',
    especialidad: 'Urgencias',
    ciudad: 'Medellín',
    sede: 'Todas las sedes',
    horario: '24/7 Rotativo · Turno Noche',
    foto_perfil: 'https://res.cloudinary.com/dedroug6v/image/upload/v1782673223/carolina-mu%C3%B1oz_de5bpz.jpg',
    estado: 'Activo',
    citas_atendidas: 210,
    descripcion: 'Atención de urgencias críticas, emergencias y soporte vital de pacientes.',
  },
  {
    id_veterinario: 9,
    nombre: 'Dr. Esteban Cardona',
    cedula: '1.037.890.123',
    numero_tarjeta: 'TP-23410-COMVEZCOL',
    direccion: 'Cra 48 #12S-30',
    telefono: '302 890 1234',
    correo: 'esteban.cardona@petfeliz.com',
    especialidad: 'Urgencias',
    ciudad: 'Sabaneta',
    sede: 'Todas las sedes',
    horario: '24/7 Rotativo · Turno Mañana',
    foto_perfil: 'https://res.cloudinary.com/dedroug6v/image/upload/v1782673223/esteban-cardona_su68zf.jpg',
    estado: 'Activo',
    citas_atendidas: 185,
    descripcion: 'Manejo de traumatismos, cuadros agudos e intoxicaciones.',
  },
  {
    id_veterinario: 10,
    nombre: 'Dra. Mariana Salazar',
    cedula: '1.024.901.234',
    numero_tarjeta: 'TP-19280-COMVEZCOL',
    direccion: 'Calle 36D #27A-15',
    telefono: '314 901 2345',
    correo: 'mariana.salazar@petfeliz.com',
    especialidad: 'Urgencias',
    ciudad: 'Envigado',
    sede: 'Todas las sedes',
    horario: '24/7 Rotativo · Turno Tarde',
    foto_perfil: 'https://res.cloudinary.com/dedroug6v/image/upload/v1782673224/mariana-salazar_cgfsj4.jpg',
    estado: 'Activo',
    citas_atendidas: 198,
    descripcion: 'Intensivista veterinaria encargada de monitorización continua e internación.',
  },
  {
    id_veterinario: 11,
    nombre: 'Dr. Ricardo Herrera',
    cedula: '1.029.012.345',
    numero_tarjeta: 'TP-26150-COMVEZCOL',
    direccion: 'Transversal 39 #74B-10',
    telefono: '305 012 3456',
    correo: 'ricardo.herrera@petfeliz.com',
    especialidad: 'Desparasitación',
    ciudad: 'Medellín',
    sede: 'Sede Laureles',
    horario: 'Lun–Sáb 8:00 AM – 3:00 PM',
    foto_perfil: 'https://res.cloudinary.com/dedroug6v/image/upload/v1782673226/ricardo-herrera_cri3jl.jpg',
    estado: 'Activo',
    citas_atendidas: 134,
    descripcion: 'Planes preventivos anti-parasitarios internos y externos.',
  },
  {
    id_veterinario: 12,
    nombre: 'Dra. Isabela Tobón',
    cedula: '1.019.123.456',
    numero_tarjeta: 'TP-20940-COMVEZCOL',
    direccion: 'Calle 53 #49-33',
    telefono: '318 123 4567',
    correo: 'isabela.tobon@petfeliz.com',
    especialidad: 'Desparasitación',
    ciudad: 'Bello',
    sede: 'Sede Bello',
    horario: 'Mar–Dom 9:00 AM – 4:00 PM',
    foto_perfil: 'https://res.cloudinary.com/dedroug6v/image/upload/v1782673223/isabela-tobon_uzmysl.jpg',
    estado: 'Activo',
    citas_atendidas: 122,
    descripcion: 'Evaluación de carga parasitaria y programas profilácticos personalizados.',
  },
  {
    id_veterinario: 13,
    nombre: 'Dr. Tomás Agudelo',
    cedula: '1.036.234.567',
    numero_tarjeta: 'TP-24830-COMVEZCOL',
    direccion: 'Cra 42 #38S-22',
    telefono: '301 234 5678',
    correo: 'tomas.agudelo@petfeliz.com',
    especialidad: 'Desparasitación',
    ciudad: 'Envigado',
    sede: 'Sede Envigado',
    horario: 'Lun–Vie 8:00 AM – 4:00 PM',
    foto_perfil: 'https://res.cloudinary.com/dedroug6v/image/upload/v1782673227/tomas-agudelo_u6eohz.jpg',
    estado: 'Activo',
    citas_atendidas: 95,
    descripcion: 'Control profiláctico y desparasitación de cachorros y felinos.',
  },
  {
    id_veterinario: 14,
    nombre: 'Dra. Alejandra Patiño',
    cedula: '1.021.345.678',
    numero_tarjeta: 'TP-18970-COMVEZCOL',
    direccion: 'Circular 1 #70-08',
    telefono: '313 345 6789',
    correo: 'alejandra.patino@petfeliz.com',
    especialidad: 'Vacunación',
    ciudad: 'Medellín',
    sede: 'Sede Laureles · Envigado',
    horario: 'Lun–Sáb 8:00 AM – 3:00 PM',
    foto_perfil: 'https://res.cloudinary.com/dedroug6v/image/upload/v1782673205/alejandra-pati%C3%B1o_m6h1gr.jpg',
    estado: 'Activo',
    citas_atendidas: 160,
    descripcion: 'Inmunización clínica, certificados de vacunación oficial y esquemas puppy.',
  },
  {
    id_veterinario: 15,
    nombre: 'Dr. Mauricio Londoño',
    cedula: '1.016.456.789',
    numero_tarjeta: 'TP-17450-COMVEZCOL',
    direccion: 'Calle 46 #52-19',
    telefono: '316 456 7891',
    correo: 'mauricio.londono@petfeliz.com',
    especialidad: 'Vacunación',
    ciudad: 'Bello',
    sede: 'Sede Bello',
    horario: 'Mar–Dom 9:00 AM – 4:00 PM',
    foto_perfil: 'https://res.cloudinary.com/dedroug6v/image/upload/v1782673225/mauricio-londo%C3%B1o_yeonik.jpg',
    estado: 'Activo',
    citas_atendidas: 140,
    descripcion: 'Esquemas completos de vacunación canina y felina con biológicos certificados.',
  },
  {
    id_veterinario: 16,
    nombre: 'Dra. Diana Ríos',
    cedula: '1.025.567.890',
    numero_tarjeta: 'TP-21340-COMVEZCOL',
    direccion: 'Av. San Juan #73-50',
    telefono: '300 567 8902',
    correo: 'diana.rios@petfeliz.com',
    especialidad: 'Laboratorio Clínico',
    ciudad: 'Medellín',
    sede: 'Sede Laureles',
    horario: 'Lun–Vie 8:00 AM – 4:00 PM',
    foto_perfil: 'https://res.cloudinary.com/dedroug6v/image/upload/v1782673221/diana-rios_olk7ci.jpg',
    estado: 'Activo',
    citas_atendidas: 105,
    descripcion: 'Procesamiento de muestras, hematología, coprológicos y perfiles bioquímicos.',
  },
  {
    id_veterinario: 17,
    nombre: 'Dr. Hernán Zapata',
    cedula: '1.015.678.901',
    numero_tarjeta: 'TP-16890-COMVEZCOL',
    direccion: 'Cra 51 #50-12',
    telefono: '311 678 9013',
    correo: 'hernan.zapata@petfeliz.com',
    especialidad: 'Laboratorio Clínico',
    ciudad: 'Bello',
    sede: 'Sede Bello',
    horario: 'Lun–Sáb 8:00 AM – 3:00 PM',
    foto_perfil: 'https://res.cloudinary.com/dedroug6v/image/upload/v1782673224/hernan-zapata_whxxms.jpg',
    estado: 'Activo',
    citas_atendidas: 98,
    descripcion: 'Análisis microscópico, uroanálisis e histopatología clínica veterinaria.',
  },
  {
    id_veterinario: 18,
    nombre: 'Dra. Paola Ríos',
    cedula: '1.038.789.012',
    numero_tarjeta: 'TP-25910-COMVEZCOL',
    direccion: 'Calle 38S #43A-05',
    telefono: '304 789 0124',
    correo: 'paola.rios@petfeliz.com',
    especialidad: 'Médico Director',
    ciudad: 'Envigado',
    sede: 'Sede Envigado',
    horario: 'Lun–Vie 9:00 AM – 5:00 PM',
    foto_perfil: 'https://res.cloudinary.com/dedroug6v/image/upload/v1782673227/paola-rios_sydn3f.jpg',
    estado: 'Activo',
    citas_atendidas: 155,
    descripcion: 'Directora Médica General EPS PetFeliz y coordinadora de auditoría clínica.',
  },
  {
    id_veterinario: 19,
    nombre: 'Dr. Camilo Arango',
    cedula: '1.023.890.123',
    numero_tarjeta: 'TP-19560-COMVEZCOL',
    direccion: 'Calle 33A #71-25',
    telefono: '317 890 1235',
    correo: 'camilo.arango@petfeliz.com',
    especialidad: 'Cirugía',
    ciudad: 'Medellín',
    sede: 'Sede Laureles',
    horario: 'Lun–Vie 7:00 AM – 3:00 PM',
    foto_perfil: 'https://res.cloudinary.com/dedroug6v/image/upload/v1782673220/camilo-arango_mn8o8q.jpg',
    estado: 'Activo',
    citas_atendidas: 130,
    descripcion: 'Cirujano principal de tejidos blandos y traumatología ortopédica.',
  },
  {
    id_veterinario: 20,
    nombre: 'Dra. Juliana Ossa',
    cedula: '1.034.901.234',
    numero_tarjeta: 'TP-23120-COMVEZCOL',
    direccion: 'Cra 45 #32S-18',
    telefono: '302 901 2346',
    correo: 'juliana.ossa@petfeliz.com',
    especialidad: 'Cirugía',
    ciudad: 'Envigado',
    sede: 'Sede Envigado',
    horario: 'Mar–Sáb 7:00 AM – 2:00 PM',
    foto_perfil: 'https://res.cloudinary.com/dedroug6v/image/upload/v1782673223/juliana-ossa_bhom4f.jpg',
    estado: 'Activo',
    citas_atendidas: 112,
    descripcion: 'Cirugía reconstructiva, esterilización profiláctica e intervenciones abdominales.',
  },
  {
    id_veterinario: 21,
    nombre: 'Dr. Nicolás Gaviria',
    cedula: '1.014.012.345',
    numero_tarjeta: 'TP-15980-COMVEZCOL',
    direccion: 'Calle 55 #47-08',
    telefono: '319 012 3457',
    correo: 'nicolas.gaviria@petfeliz.com',
    especialidad: 'Cirugía',
    ciudad: 'Bello',
    sede: 'Sede Bello',
    horario: 'Lun–Vie 7:00 AM – 3:00 PM',
    foto_perfil: 'https://res.cloudinary.com/dedroug6v/image/upload/v1782673225/nicolas-gaviria_f9m5i0.jpg',
    estado: 'Activo',
    citas_atendidas: 124,
    descripcion: 'Procedimientos quirúrgicos mínimamente invasivos y oncología veterinaria.',
  },
  {
    id_veterinario: 22,
    nombre: 'Dra. Blanca Montoya',
    cedula: '1.027.123.456',
    numero_tarjeta: 'TP-22870-COMVEZCOL',
    direccion: 'Circular 3 #74-40',
    telefono: '305 123 4568',
    correo: 'blanca.montoya@petfeliz.com',
    especialidad: 'Odontología',
    ciudad: 'Medellín',
    sede: 'Sede Laureles',
    horario: 'Lun–Jue 9:00 AM – 3:00 PM',
    foto_perfil: 'https://res.cloudinary.com/dedroug6v/image/upload/v1782673219/blanca-montoya_ama4hq.jpg',
    estado: 'Activo',
    citas_atendidas: 89,
    descripcion: 'Profilaxis ultrasonora, tratamiento periodontal y extracciones dentales.',
  },
  {
    id_veterinario: 23,
    nombre: 'Dra. Fernanda Restrepo',
    cedula: '1.033.234.567',
    numero_tarjeta: 'TP-24190-COMVEZCOL',
    direccion: 'Calle 36S #42-10',
    telefono: '312 234 5679',
    correo: 'fernanda.restrepo@petfeliz.com',
    especialidad: 'Urgencias',
    ciudad: 'Envigado',
    sede: 'Todas las sedes',
    horario: '24/7 Rotativo · Nocturno',
    foto_perfil: 'https://res.cloudinary.com/dedroug6v/image/upload/v1784691308/fernanda-restrepo_nsntfs.jpg',
    estado: 'Activo',
    citas_atendidas: 145,
    descripcion: 'Atención de emergencias graves en turno nocturno y triaje.',
  },
  {
    id_veterinario: 24,
    nombre: 'Dr. Julián Correa',
    cedula: '1.013.345.678',
    numero_tarjeta: 'TP-15340-COMVEZCOL',
    direccion: 'Cra 49 #51-22',
    telefono: '300 345 6780',
    correo: 'julian.correa@petfeliz.com',
    especialidad: 'Urgencias',
    ciudad: 'Bello',
    sede: 'Todas las sedes',
    horario: '24/7 Rotativo · Madrugada',
    foto_perfil: 'https://res.cloudinary.com/dedroug6v/image/upload/v1784691307/julian-correa_furug7.jpg',
    estado: 'Activo',
    citas_atendidas: 138,
    descripcion: 'Estabilización de pacientes traumáticos y soporte cardiorrespiratorio.',
  },
  {
    id_veterinario: 25,
    nombre: 'Dra. Melissa Duarte',
    cedula: '1.031.456.789',
    numero_tarjeta: 'TP-23850-COMVEZCOL',
    direccion: 'Transversal 74 #32-15',
    telefono: '315 456 7892',
    correo: 'melissa.duarte@petfeliz.com',
    especialidad: 'Urgencias',
    ciudad: 'Medellín',
    sede: 'Todas las sedes',
    horario: '24/7 Rotativo · Mañana',
    foto_perfil: 'https://res.cloudinary.com/dedroug6v/image/upload/v1784691306/melissa-duarte_surslq.jpg',
    estado: 'Activo',
    citas_atendidas: 129,
    descripcion: 'Manejo de emergencias intoxicativas e insuficiencia metabólica aguda.',
  },
  {
    id_veterinario: 26,
    nombre: 'Dr. Santiago Peláez',
    cedula: '1.020.567.890',
    numero_tarjeta: 'TP-18320-COMVEZCOL',
    direccion: 'Calle 33B #78-04',
    telefono: '318 567 8903',
    correo: 'santiago.pelaez@petfeliz.com',
    especialidad: 'Urgencias',
    ciudad: 'Medellín',
    sede: 'Todas las sedes',
    horario: '24/7 Rotativo · Tarde',
    foto_perfil: 'https://res.cloudinary.com/dedroug6v/image/upload/v1784691306/santiago-pelaez_xwhbhq.jpg',
    estado: 'Activo',
    citas_atendidas: 140,
    descripcion: 'Reanimación cerebro-cardiopulmonar y manejo de shock circulatorio.',
  },
  {
    id_veterinario: 27,
    nombre: 'Dra. Camila Sepúlveda',
    cedula: '1.032.678.901',
    numero_tarjeta: 'TP-24670-COMVEZCOL',
    direccion: 'Cra 43 #30S-14',
    telefono: '301 678 9014',
    correo: 'camila.sepulveda@petfeliz.com',
    especialidad: 'Urgencias',
    ciudad: 'Envigado',
    sede: 'Todas las sedes',
    horario: '24/7 Rotativo · Noche',
    foto_perfil: 'https://res.cloudinary.com/dedroug6v/image/upload/v1784691306/camila-sepulveda_f3mf1g.jpg',
    estado: 'Activo',
    citas_atendidas: 152,
    descripcion: 'Estabilización de hemorragias agudas y quemaduras severas.',
  },
  {
    id_veterinario: 28,
    nombre: 'Dra. Laura Martínez',
    cedula: '1.012.789.012',
    numero_tarjeta: 'TP-14920-COMVEZCOL',
    direccion: 'Calle 52 #48-40',
    telefono: '316 789 0125',
    correo: 'laura.martinez@petfeliz.com',
    especialidad: 'Medicina General',
    ciudad: 'Bello',
    sede: 'Sede Bello',
    horario: 'Mar–Sáb 8:00 AM – 4:00 PM',
    foto_perfil: 'https://res.cloudinary.com/dedroug6v/image/upload/v1788216413/pexels-eric-moura-859101902-32788234_flbyor.jpg',
    estado: 'Activo',
    citas_atendidas: 87,
    descripcion: 'Atención integral con calidez y trato cercano a cada paciente y su familia.',
  },
]

export default function AdminVeterinarios() {
  const navigate = useNavigate()
  const storedUser = getStoredUser()

  const [usuario] = useState({
    nombre: storedUser?.nombre || 'Administrador',
    nombreCompleto: storedUser?.nombreCompleto || 'Director Administrativo',
    foto: storedUser?.foto || 'https://res.cloudinary.com/dedroug6v/image/upload/v1782673220/felipe-restrepo_qjvdxd.jpg',
  })

  const [veterinarios, setVeterinarios] = useState(ROSTER_FALLBACK)
  const [stats, setStats] = useState({
    total: 28,
    generales: 6,
    urgencias: 8,
    otros: 14,
    sedes_activas: 3,
  })

  const [loading, setLoading] = useState(true)
  const [errorGlobal, setErrorGlobal] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [especialidadFilter, setEspecialidadFilter] = useState('todas')
  const [sedeFilter, setSedeFilter] = useState('todas')

  // Modales
  const [selectedFicha, setSelectedFicha] = useState(null)
  const [fichaTab, setFichaTab] = useState('info') // 'info' | 'citas' | 'horario'

  const [showModalForm, setShowModalForm] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editingId, setEditingId] = useState(null)

  const [formVet, setFormVet] = useState({
    nombre: '',
    cedula: '',
    numero_tarjeta: '',
    telefono: '',
    correo: '',
    especialidad: 'Medicina General',
    ciudad: 'Medellín',
    sede: 'Sede Laureles',
    direccion: '',
    horario: 'Lun–Vie 8:00 AM – 4:00 PM',
    foto_perfil: '',
  })

  const [submittingForm, setSubmittingForm] = useState(false)
  const [formError, setFormError] = useState('')

  const [deletingVet, setDeletingVet] = useState(null)
  const [submittingDelete, setSubmittingDelete] = useState(false)

  const calculateStats = (list) => {
    const total = list.length
    const generales = list.filter((v) => (v.especialidad || '').toLowerCase().includes('general')).length
    const urgencias = list.filter((v) => (v.especialidad || '').toLowerCase().includes('urgencia')).length
    const otrosCalc = total - (generales + urgencias)
    setStats({
      total,
      generales,
      urgencias,
      otros: otrosCalc > 0 ? otrosCalc : 14,
      sedes_activas: 3,
    })
  }

  // Cargar Veterinarios de Administración
  const fetchVeterinariosData = async () => {
    const token = getStoredToken()
    if (!token) {
      navigate('/login')
      return
    }

    try {
      setLoading(true)
      setErrorGlobal('')

      const res = await fetch(`${import.meta.env.VITE_API_URL}/admin/veterinarios`, {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      })

      if (res.status === 401 || res.status === 403) {
        navigate('/login')
        return
      }

      if (res.ok) {
        const data = await res.json()
        const vetsList = data.veterinarios && data.veterinarios.length > 0 ? data.veterinarios : ROSTER_FALLBACK
        setVeterinarios(vetsList)
        calculateStats(vetsList)
      } else {
        setVeterinarios(ROSTER_FALLBACK)
        calculateStats(ROSTER_FALLBACK)
      }
    } catch (err) {
      console.error('Error al cargar veterinarios de administración:', err)
      setVeterinarios(ROSTER_FALLBACK)
      calculateStats(ROSTER_FALLBACK)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchVeterinariosData()
  }, [navigate])

  // Filtrado de Veterinarios
  const searchLower = searchTerm.toLowerCase().trim()

  const veterinariosFiltrados = veterinarios.filter((v) => {
    // 1. Filtro por especialidad
    if (especialidadFilter !== 'todas') {
      const espLower = (v.especialidad || '').toLowerCase()
      if (!espLower.includes(especialidadFilter.toLowerCase())) return false
    }

    // 2. Filtro por sede
    if (sedeFilter !== 'todas') {
      const sedeLower = (v.sede || '').toLowerCase()
      if (!sedeLower.includes(sedeFilter.toLowerCase())) return false
    }

    // 3. Filtro por término de búsqueda
    if (!searchLower) return true
    return (
      (v.nombre || '').toLowerCase().includes(searchLower) ||
      (v.cedula || '').toLowerCase().includes(searchLower) ||
      (v.numero_tarjeta || '').toLowerCase().includes(searchLower) ||
      (v.correo || '').toLowerCase().includes(searchLower) ||
      (v.telefono || '').toLowerCase().includes(searchLower) ||
      (v.ciudad || '').toLowerCase().includes(searchLower) ||
      (v.direccion || '').toLowerCase().includes(searchLower) ||
      (v.especialidad || '').toLowerCase().includes(searchLower)
    )
  })

  // Obtener especialidad badge CSS class
  const getBadgeClass = (especialidad = '') => {
    const esp = especialidad.toLowerCase()
    if (esp.includes('urgencia')) return 'adm-spec-badge--urgencias'
    if (esp.includes('cirug')) return 'adm-spec-badge--cirugia'
    if (esp.includes('dermatolog')) return 'adm-spec-badge--dermatologia'
    if (esp.includes('vacunac')) return 'adm-spec-badge--vacunacion'
    if (esp.includes('desparasit')) return 'adm-spec-badge--desparasitacion'
    if (esp.includes('odontolog')) return 'adm-spec-badge--odontologia'
    if (esp.includes('laboratorio')) return 'adm-spec-badge--laboratorio'
    if (esp.includes('director')) return 'adm-spec-badge--director'
    return 'adm-spec-badge--general'
  }

  // Abrir Modal Crear
  const handleOpenCreateModal = () => {
    setFormVet({
      nombre: '',
      cedula: '',
      numero_tarjeta: '',
      telefono: '',
      correo: '',
      especialidad: 'Medicina General',
      ciudad: 'Medellín',
      sede: 'Sede Laureles',
      direccion: '',
      horario: 'Lun–Vie 8:00 AM – 4:00 PM',
      foto_perfil: '',
    })
    setIsEditing(false)
    setEditingId(null)
    setFormError('')
    setShowModalForm(true)
  }

  // Abrir Modal Editar
  const handleOpenEditModal = (vet) => {
    setFormVet({
      nombre: vet.nombre || '',
      cedula: vet.cedula || '',
      numero_tarjeta: vet.numero_tarjeta || '',
      telefono: vet.telefono || '',
      correo: vet.correo || '',
      especialidad: vet.especialidad || 'Medicina General',
      ciudad: vet.ciudad || 'Medellín',
      sede: vet.sede || 'Sede Laureles',
      direccion: vet.direccion || '',
      horario: vet.horario || 'Lun–Vie 8:00 AM – 4:00 PM',
      foto_perfil: vet.foto_perfil || '',
    })
    setIsEditing(true)
    setEditingId(vet.id_veterinario)
    setFormError('')
    setShowModalForm(true)
  }

  // Enviar Formulario (Crear / Editar)
  const handleSubmitForm = async (e) => {
    e.preventDefault()
    if (!formVet.nombre.trim()) {
      setFormError('El nombre del veterinario es obligatorio.')
      return
    }

    const token = getStoredToken()
    if (!token) return

    try {
      setSubmittingForm(true)
      setFormError('')

      const url = isEditing
        ? `${import.meta.env.VITE_API_URL}/admin/veterinarios/${editingId}`
        : `${import.meta.env.VITE_API_URL}/admin/veterinarios`

      const method = isEditing ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(formVet),
      })

      if (res.ok || res.status === 201) {
        if (isEditing) {
          setVeterinarios((prev) =>
            prev.map((v) => (v.id_veterinario === editingId ? { ...v, ...formVet } : v))
          )
        } else {
          const newVetObj = {
            id_veterinario: Date.now(),
            ...formVet,
            estado: 'Activo',
            citas_atendidas: 0,
            foto_perfil: formVet.foto_perfil || 'https://res.cloudinary.com/dedroug6v/image/upload/v1782673220/felipe-restrepo_qjvdxd.jpg',
          }
          setVeterinarios((prev) => [newVetObj, ...prev])
        }
        setShowModalForm(false)
      } else {
        const errData = await res.json().catch(() => ({}))
        setFormError(errData.message || 'No se pudo guardar la información del veterinario.')
      }
    } catch (err) {
      console.error('Error al guardar veterinario:', err)
      setFormError('Error de comunicación con el servidor.')
    } finally {
      setSubmittingForm(false)
    }
  }

  // Eliminar Veterinario
  const handleConfirmDelete = async () => {
    if (!deletingVet) return
    const token = getStoredToken()

    try {
      setSubmittingDelete(true)
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/admin/veterinarios/${deletingVet.id_veterinario}`,
        {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
        }
      )

      setVeterinarios((prev) => prev.filter((v) => v.id_veterinario !== deletingVet.id_veterinario))
      setDeletingVet(null)
    } catch (err) {
      console.error('Error al eliminar veterinario:', err)
      setVeterinarios((prev) => prev.filter((v) => v.id_veterinario !== deletingVet.id_veterinario))
      setDeletingVet(null)
    } finally {
      setSubmittingDelete(false)
    }
  }

  return (
    <div className="dash">
      <SidebarAdmin />

      <main className="dash-main">
        <DashboardHeader
          title="Veterinarios"
          subtitle="Consulta y administra el personal médico de EPS PetFeliz"
          usuario={usuario}
          showSearch={true}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
        />

        {errorGlobal && (
          <div className="dash-alert dash-alert--danger" style={{ marginBottom: '1.5rem' }}>
            <i className="fa-solid fa-triangle-exclamation"></i>
            <span>{errorGlobal}</span>
          </div>
        )}

        {/* ── 4 TARJETAS DE ESTADÍSTICAS DEL PERSONAL MÉDICO ── */}
        <div className="admin-dash-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
          <div className="admin-stat-card">
            <div className="admin-stat-card__info">
              <span>Total Veterinarios</span>
              <h3>{loading ? '...' : stats.total}</h3>
              <div className="admin-trend-badge admin-trend-badge--positive">
                <i className="fa-solid fa-user-doctor"></i>
                <span>Roster Oficial</span>
              </div>
            </div>
            <div className="admin-stat-card__icon admin-stat-card__icon--green">
              <i className="fa-solid fa-user-nurse"></i>
            </div>
          </div>

          <div className="admin-stat-card">
            <div className="admin-stat-card__info">
              <span>Medicina General</span>
              <h3>{loading ? '...' : stats.generales}</h3>
              <div className="admin-trend-badge admin-trend-badge--positive">
                <i className="fa-solid fa-stethoscope"></i>
                <span>Consulta primaria</span>
              </div>
            </div>
            <div className="admin-stat-card__icon admin-stat-card__icon--blue">
              <i className="fa-solid fa-stethoscope"></i>
            </div>
          </div>

          <div className="admin-stat-card">
            <div className="admin-stat-card__info">
              <span>Urgencias 24/7</span>
              <h3>{loading ? '...' : stats.urgencias}</h3>
              <div className="admin-trend-badge admin-trend-badge--positive">
                <i className="fa-solid fa-kit-medical"></i>
                <span>Turnos activos</span>
              </div>
            </div>
            <div className="admin-stat-card__icon admin-stat-card__icon--amber">
              <i className="fa-solid fa-truck-medical"></i>
            </div>
          </div>

          <div className="admin-stat-card">
            <div className="admin-stat-card__info">
              <span>Otras Especialidades</span>
              <h3>{loading ? '...' : stats.otros}</h3>
              <div className="admin-trend-badge admin-trend-badge--positive">
                <i className="fa-solid fa-briefcase-medical"></i>
                <span>Especialidades diversas</span>
              </div>
            </div>
            <div className="admin-stat-card__icon" style={{ background: '#f3e8ff', color: '#6b21a8' }}>
              <i className="fa-solid fa-briefcase-medical"></i>
            </div>
          </div>
        </div>

        {/* ── BARRA DE HERRAMIENTAS: BÚSQUEDA, FILTROS & NUEVO VETERINARIO ── */}
        <div className="adm-toolbar">
          <div className="adm-toolbar__search">
            <i className="fa-solid fa-magnifying-glass search-icon"></i>
            <input
              type="text"
              placeholder="Buscar por nombre, cédula, correo, teléfono, especialidad o sede..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button className="clear-btn" onClick={() => setSearchTerm('')}>
                <i className="fa-solid fa-xmark"></i>
              </button>
            )}
          </div>

          <div className="adm-toolbar__filters">
            <div className="adm-filter-group">
              <label>Especialidad:</label>
              <select
                value={especialidadFilter}
                onChange={(e) => setEspecialidadFilter(e.target.value)}
              >
                <option value="todas">Todas las especialidades</option>
                <option value="Medicina General">Medicina General</option>
                <option value="Dermatología">Dermatología</option>
                <option value="Urgencias">Urgencias</option>
                <option value="Cirugía">Cirugía</option>
                <option value="Desparasitación">Desparasitación</option>
                <option value="Vacunación">Vacunación</option>
                <option value="Odontología">Odontología</option>
                <option value="Laboratorio Clínico">Laboratorio Clínico</option>
                <option value="Médico Director">Médico Director</option>
              </select>
            </div>

            <div className="adm-filter-group">
              <label>Sede:</label>
              <select
                value={sedeFilter}
                onChange={(e) => setSedeFilter(e.target.value)}
              >
                <option value="todas">Todas las sedes</option>
                <option value="Laureles">Sede Laureles</option>
                <option value="Envigado">Sede Envigado</option>
                <option value="Bello">Sede Bello</option>
              </select>
            </div>

            <button type="button" className="admin-btn-csv" onClick={handleOpenCreateModal} style={{ height: '42px', padding: '0 1.2rem' }}>
              <i className="fa-solid fa-plus"></i>
              <span>Nuevo Veterinario</span>
            </button>
          </div>
        </div>

        {/* ── TABLA GENERAL DE VETERINARIOS ── */}
        <div className="admin-card">
          <div className="admin-card__header">
            <div className="admin-card__title">
              <div className="admin-card__title-icon" style={{ background: '#ecfdf5', color: '#047857' }}>
                <i className="fa-solid fa-user-doctor"></i>
              </div>
              <h3>Listado de Personal Médico Veterinario</h3>
            </div>
            <span style={{ fontSize: '0.82rem', color: '#64748b', fontWeight: 600 }}>
              {veterinariosFiltrados.length} Registrados
            </span>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
              <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: '1.8rem', color: '#059669', marginBottom: '0.5rem' }}></i>
              <p>Cargando información del equipo médico...</p>
            </div>
          ) : veterinariosFiltrados.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
              <i className="fa-solid fa-user-slash" style={{ fontSize: '2rem', color: '#94a3b8', marginBottom: '0.5rem' }}></i>
              <p>No se encontraron veterinarios con los criterios seleccionados.</p>
            </div>
          ) : (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>VETERINARIO</th>
                    <th>ESPECIALIDAD</th>
                    <th>SEDE & CIUDAD</th>
                    <th>CONTACTO</th>
                    <th>DIRECCIÓN</th>
                    <th>ESTADO</th>
                    <th style={{ textAlign: 'center' }}>ACCIONES</th>
                  </tr>
                </thead>
                <tbody>
                  {veterinariosFiltrados.map((vet) => (
                    <tr key={vet.id_veterinario}>
                      <td>
                        <div className="adm-vet-avatar-cell">
                          <img
                            src={vet.foto_perfil || 'https://res.cloudinary.com/dedroug6v/image/upload/v1782673220/felipe-restrepo_qjvdxd.jpg'}
                            alt={vet.nombre}
                            className="adm-vet-avatar"
                          />
                          <div className="adm-vet-name-box">
                            <span className="adm-vet-name">{vet.nombre}</span>
                            <span className="adm-vet-id">C.C. {vet.cedula} &bull; {vet.numero_tarjeta}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`adm-spec-badge ${getBadgeClass(vet.especialidad)}`}>
                          <i className="fa-solid fa-stethoscope" style={{ fontSize: '0.7rem' }}></i>
                          {vet.especialidad}
                        </span>
                      </td>
                      <td>
                        <div className="adm-location-box">
                          <span className="adm-sede-text">
                            <i className="fa-solid fa-building" style={{ color: '#059669', fontSize: '0.78rem' }}></i>
                            {vet.sede}
                          </span>
                          <span className="adm-ciudad-text">
                            <i className="fa-solid fa-location-dot" style={{ color: '#94a3b8', fontSize: '0.75rem', marginRight: '3px' }}></i>
                            {vet.ciudad}
                          </span>
                        </div>
                      </td>
                      <td>
                        <div className="adm-contact-box">
                          <span className="adm-contact-phone">
                            <i className="fa-solid fa-phone" style={{ color: '#0284c7', fontSize: '0.75rem', marginRight: '4px' }}></i>
                            {vet.telefono}
                          </span>
                          <span className="adm-contact-email">{vet.correo}</span>
                        </div>
                      </td>
                      <td>
                        <span className="adm-address-text">
                          <i className="fa-solid fa-map-pin" style={{ color: '#64748b', fontSize: '0.75rem', marginRight: '4px' }}></i>
                          {vet.direccion}
                        </span>
                      </td>
                      <td>
                        <span className="admin-tx-badge admin-tx-badge--confirmado">
                          <i className="fa-solid fa-circle-check" style={{ fontSize: '0.65rem', marginRight: '4px' }}></i>
                          {vet.estado || 'Activo'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', gap: '0.4rem' }}>
                          <button
                            type="button"
                            className="adm-action-btn adm-action-btn--view"
                            onClick={() => { setSelectedFicha(vet); setFichaTab('info'); }}
                            title="Ver ficha completa del veterinario"
                          >
                            <i className="fa-solid fa-eye"></i>
                          </button>
                          <button
                            type="button"
                            className="adm-action-btn adm-action-btn--edit"
                            onClick={() => handleOpenEditModal(vet)}
                            title="Editar datos del veterinario"
                          >
                            <i className="fa-solid fa-pen-to-square"></i>
                          </button>
                          <button
                            type="button"
                            className="adm-action-btn adm-action-btn--delete"
                            onClick={() => setDeletingVet(vet)}
                            title="Desactivar o eliminar veterinario"
                          >
                            <i className="fa-solid fa-trash-can"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* ── MODAL: FICHA COMPLETA DEL VETERINARIO ── */}
      {selectedFicha && (
        <div className="adm-modal-overlay" onClick={() => setSelectedFicha(null)}>
          <div className="adm-modal-card" style={{ maxWidth: '680px', padding: 0 }} onClick={(e) => e.stopPropagation()}>
            <div className="adm-vet-hero">
              <img
                src={selectedFicha.foto_perfil || 'https://res.cloudinary.com/dedroug6v/image/upload/v1782673220/felipe-restrepo_qjvdxd.jpg'}
                alt={selectedFicha.nombre}
                className="adm-vet-hero__img"
              />
              <div className="adm-vet-hero__info">
                <h2>{selectedFicha.nombre}</h2>
                <div className="adm-vet-hero__tp">
                  <span>C.C. {selectedFicha.cedula}</span>
                  <span>&bull;</span>
                  <span>{selectedFicha.numero_tarjeta}</span>
                </div>
                <div className="adm-vet-hero__badges">
                  <span className={`adm-spec-badge ${getBadgeClass(selectedFicha.especialidad)}`} style={{ background: '#ffffff', color: '#047857' }}>
                    {selectedFicha.especialidad}
                  </span>
                </div>
              </div>
              <button className="adm-modal-close" style={{ color: '#ffffff' }} onClick={() => setSelectedFicha(null)}>
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <div className="adm-vet-body">
              {/* Pestañas de la Ficha */}
              <div className="adm-modal-tabs" style={{ marginBottom: '1.2rem' }}>
                <button
                  className={`adm-tab-btn ${fichaTab === 'info' ? 'adm-tab-btn--active' : ''}`}
                  onClick={() => setFichaTab('info')}
                >
                  <i className="fa-solid fa-id-card"></i> Datos Personales & Laborales
                </button>
                <button
                  className={`adm-tab-btn ${fichaTab === 'horario' ? 'adm-tab-btn--active' : ''}`}
                  onClick={() => setFichaTab('horario')}
                >
                  <i className="fa-regular fa-clock"></i> Sede & Horario
                </button>
              </div>

              {fichaTab === 'info' && (
                <div>
                  <div className="adm-detail-grid">
                    <div className="adm-detail-item">
                      <span className="adm-detail-item__label"><i className="fa-solid fa-id-card"></i> Cédula de Ciudadanía</span>
                      <span className="adm-detail-item__val">{selectedFicha.cedula}</span>
                    </div>
                    <div className="adm-detail-item">
                      <span className="adm-detail-item__label"><i className="fa-solid fa-file-medical"></i> Tarjeta Profesional</span>
                      <span className="adm-detail-item__val">{selectedFicha.numero_tarjeta}</span>
                    </div>
                    <div className="adm-detail-item">
                      <span className="adm-detail-item__label"><i className="fa-solid fa-phone"></i> Teléfono Móvil</span>
                      <span className="adm-detail-item__val">{selectedFicha.telefono}</span>
                    </div>
                    <div className="adm-detail-item">
                      <span className="adm-detail-item__label"><i className="fa-solid fa-envelope"></i> Correo Electrónico</span>
                      <span className="adm-detail-item__val">{selectedFicha.correo}</span>
                    </div>
                    <div className="adm-detail-item">
                      <span className="adm-detail-item__label"><i className="fa-solid fa-city"></i> Ciudad</span>
                      <span className="adm-detail-item__val">{selectedFicha.ciudad}</span>
                    </div>
                    <div className="adm-detail-item">
                      <span className="adm-detail-item__label"><i className="fa-solid fa-location-dot"></i> Dirección Residencia</span>
                      <span className="adm-detail-item__val">{selectedFicha.direccion}</span>
                    </div>
                  </div>

                  <div style={{ background: '#f0fdf4', padding: '1rem', borderRadius: '12px', border: '1px solid #bbf7d0' }}>
                    <h4 style={{ margin: '0 0 0.4rem 0', fontFamily: 'Sora, sans-serif', color: '#166534', fontSize: '0.92rem' }}>
                      <i className="fa-solid fa-user-doctor" style={{ marginRight: '6px' }}></i> Resumen de Perfil Médico
                    </h4>
                    <p style={{ margin: 0, fontSize: '0.88rem', color: '#15803d', lineHeight: '1.4' }}>
                      {selectedFicha.descripcion || 'Profesional registrado en la red médica veterinaria de EPS PetFeliz con atención integral para mascotas.'}
                    </p>
                  </div>
                </div>
              )}

              {fichaTab === 'horario' && (
                <div>
                  <div className="adm-detail-grid">
                    <div className="adm-detail-item">
                      <span className="adm-detail-item__label"><i className="fa-solid fa-building"></i> Sede Principal Asignada</span>
                      <span className="adm-detail-item__val">{selectedFicha.sede}</span>
                    </div>
                    <div className="adm-detail-item">
                      <span className="adm-detail-item__label"><i className="fa-regular fa-clock"></i> Horario de Atención</span>
                      <span className="adm-detail-item__val">{selectedFicha.horario}</span>
                    </div>
                    <div className="adm-detail-item">
                      <span className="adm-detail-item__label"><i className="fa-solid fa-stethoscope"></i> Especialidad Clínica</span>
                      <span className="adm-detail-item__val">{selectedFicha.especialidad}</span>
                    </div>
                    <div className="adm-detail-item">
                      <span className="adm-detail-item__label"><i className="fa-solid fa-calendar-check"></i> Citas Atendidas</span>
                      <span className="adm-detail-item__val">{selectedFicha.citas_atendidas || 0} Pacientes</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="adm-modal-footer">
              <button className="adm-btn-secondary" onClick={() => setSelectedFicha(null)}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: CREAR / EDITAR VETERINARIO ── */}
      {showModalForm && (
        <div className="adm-modal-overlay" onClick={() => setShowModalForm(false)}>
          <div className="adm-modal-card" style={{ maxWidth: '640px' }} onClick={(e) => e.stopPropagation()}>
            <div className="adm-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <i className={`fa-solid ${isEditing ? 'fa-pen-to-square' : 'fa-user-plus'}`} style={{ color: '#059669' }}></i>
                <h3>{isEditing ? 'Editar Veterinario' : 'Registrar Nuevo Veterinario'}</h3>
              </div>
              <button className="adm-modal-close" onClick={() => setShowModalForm(false)}>
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="adm-modal-body">
              {formError && (
                <div className="dash-alert dash-alert--danger" style={{ marginBottom: '1rem' }}>
                  <i className="fa-solid fa-circle-exclamation"></i>
                  <span>{formError}</span>
                </div>
              )}

              <div className="adm-form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="adm-form-group" style={{ gridColumn: 'span 2' }}>
                  <label>Nombre Completo del Veterinario *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Dr. Andrés Gómez"
                    value={formVet.nombre}
                    onChange={(e) => setFormVet({ ...formVet, nombre: e.target.value })}
                  />
                </div>

                <div className="adm-form-group">
                  <label>Cédula de Ciudadanía *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. 1.020.456.789"
                    value={formVet.cedula}
                    onChange={(e) => setFormVet({ ...formVet, cedula: e.target.value })}
                  />
                </div>

                <div className="adm-form-group">
                  <label>Tarjeta Profesional (TP) *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. TP-18452-COMVEZCOL"
                    value={formVet.numero_tarjeta}
                    onChange={(e) => setFormVet({ ...formVet, numero_tarjeta: e.target.value })}
                  />
                </div>

                <div className="adm-form-group">
                  <label>Teléfono de Contacto *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. 300 456 7890"
                    value={formVet.telefono}
                    onChange={(e) => setFormVet({ ...formVet, telefono: e.target.value })}
                  />
                </div>

                <div className="adm-form-group">
                  <label>Correo Electrónico *</label>
                  <input
                    type="email"
                    required
                    placeholder="Ej. andres.gomez@petfeliz.com"
                    value={formVet.correo}
                    onChange={(e) => setFormVet({ ...formVet, correo: e.target.value })}
                  />
                </div>

                <div className="adm-form-group">
                  <label>Especialidad Clínica *</label>
                  <select
                    value={formVet.especialidad}
                    onChange={(e) => setFormVet({ ...formVet, especialidad: e.target.value })}
                  >
                    <option value="Medicina General">Medicina General</option>
                    <option value="Dermatología">Dermatología</option>
                    <option value="Urgencias">Urgencias</option>
                    <option value="Cirugía">Cirugía</option>
                    <option value="Desparasitación">Desparasitación</option>
                    <option value="Vacunación">Vacunación</option>
                    <option value="Odontología">Odontología</option>
                    <option value="Laboratorio Clínico">Laboratorio Clínico</option>
                    <option value="Médico Director">Médico Director</option>
                  </select>
                </div>

                <div className="adm-form-group">
                  <label>Ciudad *</label>
                  <select
                    value={formVet.ciudad}
                    onChange={(e) => setFormVet({ ...formVet, ciudad: e.target.value })}
                  >
                    <option value="Medellín">Medellín</option>
                    <option value="Envigado">Envigado</option>
                    <option value="Bello">Bello</option>
                    <option value="Sabaneta">Sabaneta</option>
                    <option value="Itagüí">Itagüí</option>
                    <option value="Rionegro">Rionegro</option>
                  </select>
                </div>

                <div className="adm-form-group">
                  <label>Sede donde trabaja *</label>
                  <select
                    value={formVet.sede}
                    onChange={(e) => setFormVet({ ...formVet, sede: e.target.value })}
                  >
                    <option value="Sede Laureles">Sede Laureles</option>
                    <option value="Sede Envigado">Sede Envigado</option>
                    <option value="Sede Bello">Sede Bello</option>
                    <option value="Todas las sedes">Todas las sedes (Rotativo)</option>
                  </select>
                </div>

                <div className="adm-form-group">
                  <label>Horario de Atención</label>
                  <input
                    type="text"
                    placeholder="Ej. Lun–Vie 8:00 AM – 4:00 PM"
                    value={formVet.horario}
                    onChange={(e) => setFormVet({ ...formVet, horario: e.target.value })}
                  />
                </div>

                <div className="adm-form-group" style={{ gridColumn: 'span 2' }}>
                  <label>Dirección de Residencia / Contacto</label>
                  <input
                    type="text"
                    placeholder="Ej. Calle 33 #76-45, Laureles"
                    value={formVet.direccion}
                    onChange={(e) => setFormVet({ ...formVet, direccion: e.target.value })}
                  />
                </div>

                <div className="adm-form-group" style={{ gridColumn: 'span 2' }}>
                  <label>URL Foto de Perfil (Opcional)</label>
                  <input
                    type="url"
                    placeholder="Ej. https://res.cloudinary.com/..."
                    value={formVet.foto_perfil}
                    onChange={(e) => setFormVet({ ...formVet, foto_perfil: e.target.value })}
                  />
                </div>
              </div>

              <div className="adm-modal-footer" style={{ marginTop: '1.5rem' }}>
                <button type="button" className="adm-btn-secondary" onClick={() => setShowModalForm(false)}>
                  Cancelar
                </button>
                <button type="submit" className="adm-btn-primary" disabled={submittingForm}>
                  {submittingForm ? (
                    <>
                      <i className="fa-solid fa-spinner fa-spin"></i> Guardando...
                    </>
                  ) : isEditing ? (
                    'Guardar Cambios'
                  ) : (
                    'Registrar Veterinario'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: CONFIRMAR ELIMINACIÓN ── */}
      {deletingVet && (
        <div className="adm-modal-overlay" onClick={() => setDeletingVet(null)}>
          <div className="adm-modal-card" style={{ maxWidth: '440px' }} onClick={(e) => e.stopPropagation()}>
            <div className="adm-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#dc2626' }}>
                <i className="fa-solid fa-triangle-exclamation"></i>
                <h3>Desactivar Veterinario</h3>
              </div>
              <button className="adm-modal-close" onClick={() => setDeletingVet(null)}>
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <div className="adm-modal-body">
              <p style={{ fontSize: '0.92rem', color: '#334155', lineHeight: '1.5', margin: 0 }}>
                ¿Estás seguro de que deseas desactivar a <strong>{deletingVet.nombre}</strong> (C.C. {deletingVet.cedula})?
              </p>
            </div>

            <div className="adm-modal-footer">
              <button className="adm-btn-secondary" onClick={() => setDeletingVet(null)}>
                Cancelar
              </button>
              <button
                className="adm-btn-danger"
                onClick={handleConfirmDelete}
                disabled={submittingDelete}
              >
                {submittingDelete ? 'Desactivando...' : 'Sí, Desactivar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
