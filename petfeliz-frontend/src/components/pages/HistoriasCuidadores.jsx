import { useState, useEffect, useRef } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { motion, AnimatePresence } from 'framer-motion'
import api from '../../api/axios'
import Testimonial from '../Testimonial'
import ZonaCuidadoresBanner from '../ZonaCuidadoresBanner'
import './HistoriasCuidadores.css'

/* ─── MAPEO DE IMÁGENES POR CATEGORÍA ─── */

const IMAGENES_CATEGORIAS = {
  'Medicina General': 'https://res.cloudinary.com/dedroug6v/image/upload/v1787858920/pexels-martabranco-30784707_orn16z.jpg',
  'Dermatología':     'https://res.cloudinary.com/dedroug6v/image/upload/v1787858920/pexels-mikhail-nilov-7468980_zdtnnw.jpg',
  'Urgencias 24/7':   'https://res.cloudinary.com/dedroug6v/image/upload/v1787858914/pexels-mikhail-nilov-28123659_r4px3k.jpg',
  'Urgencias':        'https://res.cloudinary.com/dedroug6v/image/upload/v1787858914/pexels-mikhail-nilov-28123659_r4px3k.jpg',
  'Cirugía':          'https://res.cloudinary.com/dedroug6v/image/upload/v1787858917/pexels-juanjo-7121954_cqfv74.jpg',
  'Vacunación':       'https://res.cloudinary.com/dedroug6v/image/upload/v1787858914/pexels-jorge-chan-515189442-16392319_njis6k.jpg',
}

const getImagenCategoria = (categoria) => {
  return IMAGENES_CATEGORIAS[categoria] || IMAGENES_CATEGORIAS['Medicina General']
}

/* ─── DATA INICIAL ──── */

const historiasIniciales = [
  {
    id: 'demo-1',
    nombre: 'Camila Restrepo',
    ciudad: 'Laureles, Medellín',
    mascota: 'Luna',
    especie: 'Perra labrador, 4 años',
    categoria: 'Medicina General',
    foto: '/img/cuidadores/camila.jpg',
    avatar: '/img/cuidadores/camila_avatar.jpg',
    extracto: 'Nunca pensé que un plan mensual pudiera cambiar tanto la vida de Luna. Antes cada visita era una sorpresa financiera; hoy simplemente agendo y voy.',
    historia: `Adopté a Luna cuando tenía 8 semanas. Era mi primer perro y no tenía idea de lo que implicaba en términos de salud preventiva. El primer año gasté en consultas de urgencia más de lo que habría costado cualquier plan anual.\n\nUna amiga me habló de EPS PetFeliz. Me costó creerlo: ¿una EPS, pero para mascotas? Me registré en febrero y desde entonces Luna ha tenido tres consultas de medicina general, su vacunación al día y una desparasitación, todo cubierto. El veterinario que la atiende, el Dr. Andrés Gómez, la conoce por nombre y recuerda su historial.\n\nLo que más valoro es la tranquilidad. Antes postergaba visitas por el costo. Ahora, ante cualquier duda, agendo. Eso es lo que debería sentir cualquier dueño de mascota.`,
    etiquetas: ['Prevención', 'Labrador', 'Primer perro'],
    fecha: 'Marzo 2025',
    rating: 5,
  },
  {
    id: 'demo-2',
    nombre: 'Jorge Salazar',
    ciudad: 'Itagüí',
    mascota: 'Manchas',
    especie: 'Gato persa, 7 años',
    categoria: 'Dermatología',
    foto: '/img/cuidadores/jorge.jpg',
    avatar: '/img/cuidadores/jorge_avatar.jpg',
    extracto: 'Manchas sufría de alergias crónicas que nadie había logrado controlar. La Dra. Valentina diseñó un plan personalizado y en dos meses mejoró radicalmente.',
    historia: `Manchas es un gato persa con piel sensible que llevaba dos años con episodios de dermatitis sin una solución duradera. Probé clínicas distintas, tratamientos caros, dietas especiales. El resultado era siempre el mismo: mejora temporal y recaída.\n\nA través del buscador de especialistas de la app encontré a la Dra. Valentina Cruz, dermatóloga veterinaria en la sede de Laureles. La primera consulta duró casi una hora. Hizo preguntas que nunca me habían hecho: el tipo de arena que uso, los materiales de su cama, los productos de limpieza del hogar.\n\nDiseñó un protocolo de ocho semanas. A la tercera semana ya se notaba la diferencia. Hoy, seis meses después, Manchas tiene la piel limpia y el pelaje brillante que no había tenido en años.`,
    etiquetas: ['Dermatología', 'Gato persa', 'Alergias crónicas'],
    fecha: 'Enero 2025',
    rating: 5,
  },
  {
    id: 'demo-3',
    nombre: 'Sofía Mejía',
    ciudad: 'Bello',
    mascota: 'Trueno',
    especie: 'Pastor alemán, 2 años',
    categoria: 'Urgencias 24/7',
    foto: '/img/cuidadores/sofia.jpg',
    avatar: '/img/cuidadores/sofia_avatar.jpg',
    extracto: 'Trueno ingirió algo tóxico un domingo a las 11 pm. En 20 minutos ya estábamos en la sede de urgencias. Esa noche entendí lo que significa contar con una red de verdad.',
    historia: `Era un domingo en la noche. Trueno empezó a vomitar y a mostrar signos de desorientación. Llamé a la línea de emergencias de PetFeliz a las 11:07 pm y me atendieron de inmediato. Me guiaron mientras conducía hacia la sede de urgencias de Laureles.\n\nCuando llegué, el Dr. Esteban Cardona ya tenía información de Trueno gracias a su historial digital en la app. No tuve que explicar nada desde cero: su peso, sus vacunas, sus alergias conocidas, todo estaba ahí.\n\nLe hicieron lavado gástrico y lo monitorearon toda la noche. Al día siguiente me llamaron para informarme de su evolución. El martes ya estaba en casa, con cola en alto.`,
    etiquetas: ['Urgencias 24/7', 'Toxicología', 'Pastor alemán'],
    fecha: 'Noviembre 2024',
    rating: 5,
  },
  {
    id: 'demo-4',
    nombre: 'Mateo Osorio',
    ciudad: 'Envigado',
    mascota: 'Simba',
    especie: 'Gato criollo, 3 años',
    categoria: 'Cirugía',
    foto: '/img/cuidadores/mateo.jpg',
    avatar: '/img/cuidadores/mateo_avatar.jpg',
    extracto: 'La esterilización y cirugía de Simba fue impecable. Desde el protocolo prequirúrgico hasta el seguimiento en casa, el equipo nos dio 100% de tranquilidad.',
    historia: `A Simba le diagnosticaron un problema articular que requería intervención quirúrgica preventiva. Como primerizo con gatos, el miedo a la anestesia y a la recuperación posoperatoria me tenía aterrorizado.\n\nEl cirujano de PetFeliz en la sede de Laureles nos explicó el procedimiento paso a paso con radiografías digitales. Todo el proceso quirúrgico se realizó bajo monitoreo estricto. La recuperación fue rápida y sin complicaciones gracias a las indicaciones del equipo posoperatorio.`,
    etiquetas: ['Cirugía preventiva', 'Gato criollo', 'Ortopedia'],
    fecha: 'Febrero 2025',
    rating: 5,
  },
  {
    id: 'demo-5',
    nombre: 'Mariana Pizarro',
    ciudad: 'Poblado, Medellín',
    mascota: 'Kira',
    especie: 'Perra beagle, 1 año',
    categoria: 'Vacunación',
    foto: '/img/cuidadores/mariana_p.jpg',
    avatar: '/img/cuidadores/mariana_avatar.jpg',
    extracto: 'Completamos todo el esquema de vacunación y desparasitación de Kira sin olvidar ninguna fecha gracias a los recordatorios del sistema.',
    historia: `Con un cachorro inquieto como Kira, mantener el calendario de vacunas al día puede ser caótico. Con la app de PetFeliz recibimos notificaciones preventivas antes de cada dosis.\n\nAcudimos a la sede de Itagüí para su última vacuna múltiple y antirrábica. La atención fue afectuosa, paciente y muy profesional. Kira ni siquiera sintió el pinchazo y nos entregaron su carné digital de vacunación actualizado en la plataforma.`,
    etiquetas: ['Vacunación', 'Beagle', 'Esquema completo'],
    fecha: 'Enero 2025',
    rating: 5,
  }
]

const categorias = ['Todas', 'Medicina General', 'Dermatología', 'Urgencias 24/7', 'Cirugía', 'Vacunación']

const stats = [
  { num: '+6.000', label: 'Mascotas afiliadas',         icon: 'fa-solid fa-paw' },
  { num: '98%',   label: 'Satisfacción de cuidadores',  icon: 'fa-solid fa-heart' },
  { num: '40+',   label: 'Especialistas en la red',     icon: 'fa-solid fa-user-doctor' },
  { num: '3',     label: 'Sedes en el Área Metro',      icon: 'fa-solid fa-location-dot' },
]

/* ─── SUBCOMPONENTES ─── */

function StarRating({ rating }) {
  return (
    <div className="hc-stars" aria-label={`${rating} de 5 estrellas`}>
      {[1, 2, 3, 4, 5].map(n => (
        <FontAwesomeIcon
          key={n}
          icon="fa-solid fa-star"
          className={n <= rating ? 'hc-star--on' : 'hc-star--off'}
        />
      ))}
    </div>
  )
}

function HistoriaCard({ historia, onClick }) {
  const fotoBanner = getImagenCategoria(historia.categoria)

  return (
    <motion.article
      className="hc-card"
      layout
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 12 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      onClick={() => onClick(historia)}
      tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && onClick(historia)}
      role="button"
      aria-label={`Leer historia de ${historia.nombre}`}
    >
      <div className="hc-card__img-wrap">
        <img
          src={fotoBanner}
          alt={`${historia.mascota}, mascota de ${historia.nombre}`}
          className="hc-card__img"
        />
        <div className="hc-card__img-overlay" />
        <span className="hc-card__categoria">{historia.categoria}</span>
      </div>
      <div className="hc-card__body">
        <StarRating rating={historia.rating} />
        <p className="hc-card__extracto">"{historia.extracto}"</p>
        <div className="hc-card__footer">
          <div className="hc-card__autor">
            <div className="hc-card__avatar-wrap">
              <img
                src={historia.avatar}
                alt={historia.nombre}
                className="hc-card__avatar"
                onError={e => {
                  e.currentTarget.style.display = 'none'
                  e.currentTarget.nextSibling.style.display = 'flex'
                }}
              />
              <div className="hc-card__avatar-fallback">
                <FontAwesomeIcon icon="fa-solid fa-user" />
              </div>
            </div>
            <div>
              <div className="hc-card__nombre">{historia.nombre}</div>
              <div className="hc-card__ciudad">
                <FontAwesomeIcon icon="fa-solid fa-location-dot" /> {historia.ciudad}
              </div>
            </div>
          </div>
          <div className="hc-card__mascota-chip">
            <FontAwesomeIcon icon="fa-solid fa-paw" />
            {historia.mascota}
          </div>
        </div>
      </div>
    </motion.article>
  )
}

function Modal({ historia, onClose }) {
  if (!historia) return null
  const fotoBanner = getImagenCategoria(historia.categoria)

  return (
    <AnimatePresence>
      <motion.div
        className="hc-modal-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="hc-modal"
          initial={{ opacity: 0, y: 40, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.97 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          onClick={e => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-label={`Historia de ${historia.nombre}`}
        >
          <button className="hc-modal__close" onClick={onClose} aria-label="Cerrar">
            <FontAwesomeIcon icon="fa-solid fa-xmark" />
          </button>

          <div className="hc-modal__img-wrap">
            <img
              src={fotoBanner}
              alt={historia.mascota}
              className="hc-modal__img"
            />
            <div className="hc-modal__img-overlay" />
            <div className="hc-modal__img-meta">
              <span className="hc-modal__categoria">{historia.categoria}</span>
              <h2 className="hc-modal__mascota-nombre">{historia.mascota}</h2>
              <p className="hc-modal__especie">{historia.especie}</p>
            </div>
          </div>

          <div className="hc-modal__content">
            <div className="hc-modal__autor-row">
              <div className="hc-modal__avatar-wrap">
                <img
                  src={historia.avatar}
                  alt={historia.nombre}
                  className="hc-modal__avatar"
                  onError={e => { e.currentTarget.style.display = 'none' }}
                />
                <div className="hc-modal__avatar-fallback">
                  <FontAwesomeIcon icon="fa-solid fa-user" />
                </div>
              </div>
              <div>
                <div className="hc-modal__nombre">{historia.nombre}</div>
                <div className="hc-modal__ciudad">
                  <FontAwesomeIcon icon="fa-solid fa-location-dot" /> {historia.ciudad}
                </div>
              </div>
              <div className="hc-modal__fecha-wrap">
                <FontAwesomeIcon icon="fa-solid fa-calendar" />
                {historia.fecha}
              </div>
            </div>

            <StarRating rating={historia.rating} />

            <div className="hc-modal__texto">
              {historia.historia.split('\n\n').filter(Boolean).map((parrafo, i) => (
                <p key={i}>{parrafo.trim()}</p>
              ))}
            </div>

            <div className="hc-modal__etiquetas">
              {historia.etiquetas.map(tag => (
                <span key={tag} className="hc-modal__tag">
                  <FontAwesomeIcon icon="fa-solid fa-tag" /> {tag}
                </span>
              ))}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

/* ─── COMPONENTE PRINCIPAL ─── */

function HistoriasCuidadores() {
  const [listaHistorias, setListaHistorias] = useState(historiasIniciales)
  const [categoriaActiva, setCategoriaActiva] = useState('Todas')
  const [historiaAbierta, setHistoriaAbierta] = useState(null)
  const [cargandoApi, setCargandoApi] = useState(true)
  const gridRef = useRef(null)

  // Cargar historias aprobadas directamente de la API REST del backend Laravel
  useEffect(() => {
    const fetchHistoriasAprobadas = async () => {
      setCargandoApi(true)
      try {
        const response = await api.get('/historias-cuidadores')
        if (response.data?.status === 'success' && Array.isArray(response.data.data)) {
          const apiHistorias = response.data.data.map(h => ({
            id: `api-${h.id}`,
            nombre: h.nombre_cuidador,
            ciudad: 'Medellín, Antioquia',
            mascota: h.nombre_mascota,
            especie: h.nombre_mascota,
            categoria: h.categoria,
            foto: '/img/cuidadores/mariana.jpg',
            avatar: '/img/cuidadores/mariana_avatar.jpg',
            extracto: h.historia ? (h.historia.substring(0, 140) + (h.historia.length > 140 ? '...' : '')) : '',
            historia: h.historia,
            etiquetas: ['Comunidad PetFeliz', h.categoria],
            fecha: new Date(h.created_at || Date.now()).toLocaleDateString('es-CO', { month: 'long', year: 'numeric' }),
            rating: 5
          }))

          // Combinar historias traídas de la API al inicio del listado público
          setListaHistorias([...apiHistorias, ...historiasIniciales])
        }
      } catch (err) {
        console.error('Error al obtener historias aprobadas de la API:', err)
      } finally {
        setCargandoApi(false)
      }
    }

    fetchHistoriasAprobadas()
  }, [])

  const historiasFiltradas = categoriaActiva === 'Todas'
    ? listaHistorias
    : listaHistorias.filter(h => h.categoria === categoriaActiva)

  const handleFiltro = (cat) => {
    setCategoriaActiva(cat)
  }

  return (
    <>
      {/* PAGE HERO */}
      <section className="page-hero hc-hero">
        <div className="container">
          <div className="page-hero__inner">
            <div className="page-hero__text">
              <div className="hero__badge">
                <FontAwesomeIcon icon="fa-solid fa-paw" />
                Historias reales de Medellín
              </div>
              <h1 className="hero__title">
                Historias de<br />
                <span className="text-accent">cuidadores</span>
              </h1>
              <p className="hero__desc">
                Cada mascota tiene una historia. Aquí las cuentan quienes las viven:
                familias de Medellín y el Área Metropolitana que encontraron en PetFeliz
                algo más que un servicio veterinario.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* STATS STRIP */}
      <section className="hc-stats">
        <div className="container">
          <div className="hc-stats__grid">
            {stats.map((s, i) => (
              <div className="hc-stats__item" key={i}>
                <div className="hc-stats__icon">
                  <FontAwesomeIcon icon={s.icon} />
                </div>
                <span className="hc-stats__num">{s.num}</span>
                <span className="hc-stats__label">{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HISTORIAS */}
      <section className="hc-historias">
        <div className="container">
          <div className="section-header">
            <h2>Lo que dicen <span className="text-accent">las familias</span></h2>
            <p>
              No son testimonios de marketing. Son las palabras de cuidadores que enfrentaron
              situaciones reales y encontraron en PetFeliz una red en la que confiar.
            </p>
          </div>

          {/* FILTROS */}
          <div className="hc-filtros" role="group" aria-label="Filtrar por categoría">
            {categorias.map(cat => (
              <button
                key={cat}
                className={`hc-filtro-btn ${categoriaActiva === cat ? 'active' : ''}`}
                onClick={() => handleFiltro(cat)}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* GRID */}
          <motion.div className="hc-grid" ref={gridRef} layout>
            <AnimatePresence mode="popLayout">
              {historiasFiltradas.map(h => (
                <HistoriaCard
                  key={h.id}
                  historia={h}
                  onClick={setHistoriaAbierta}
                />
              ))}
            </AnimatePresence>
          </motion.div>

          {historiasFiltradas.length === 0 && (
            <div className="hc-empty">
              <FontAwesomeIcon icon="fa-solid fa-magnifying-glass" />
              <p>No hay historias en esta categoría todavía.</p>
            </div>
          )}
        </div>
      </section>

      <Testimonial
        quote="Tener un plan de salud para Trueno no es un lujo. Es la diferencia entre actuar a tiempo y lamentar haber esperado. PetFeliz nos dio esa red cuando más la necesitamos."
        name="Sofía Mejía"
        role="Cuidadora de Trueno · Bello, Antioquia"
        avatar="/img/cuidadores/sofia_avatar.jpg"
      />

      {/* ZONA DE CUIDADORES / COMPARTE TU HISTORIA */}
      <ZonaCuidadoresBanner />

      {/* MODAL DETALLE */}
      {historiaAbierta && (
        <Modal
          historia={historiaAbierta}
          onClose={() => setHistoriaAbierta(null)}
        />
      )}
    </>
  )
}

export default HistoriasCuidadores