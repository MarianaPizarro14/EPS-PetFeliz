import { useState, useRef } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { motion, AnimatePresence } from 'framer-motion'
import CtaBanner from '../CtaBanner'
import Testimonial from '../Testimonial'
import './HistoriasCuidadores.css'
import StatsStrip from '../StatsStrip'
import { Link } from 'react-router-dom'

/* ─── DATA ──── */

const historias = [
  {
    id: 1,
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
    id: 2,
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
    id: 3,
    nombre: 'Sofía Mejía',
    ciudad: 'Bello',
    mascota: 'Trueno',
    especie: 'Pastor alemán, 2 años',
    categoria: 'Urgencias',
    foto: '/img/cuidadores/sofia.jpg',
    avatar: '/img/cuidadores/sofia_avatar.jpg',
    extracto: 'Trueno ingirió algo tóxico un domingo a las 11 pm. En 20 minutos ya estábamos en la sede de urgencias. Esa noche entendí lo que significa contar con una red de verdad.',
    historia: `Era un domingo en la noche. Trueno empezó a vomitar y a mostrar signos de desorientación. Llamé a la línea de emergencias de PetFeliz a las 11:07 pm y me atendieron de inmediato. Me guiaron mientras conducía hacia la sede de urgencias de Laureles.\n\nCuando llegué, el Dr. Esteban Cardona ya tenía información de Trueno gracias a su historial digital en la app. No tuve que explicar nada desde cero: su peso, sus vacunas, sus alergias conocidas, todo estaba ahí.\n\nLe hicieron lavado gástrico y lo monitorearon toda la noche. Al día siguiente me llamaron para informarme de su evolución. El martes ya estaba en casa, con cola en alto.`,
    etiquetas: ['Urgencias 24/7', 'Toxicología', 'Pastor alemán'],
    fecha: 'Noviembre 2024',
    rating: 5,
  },
  {
    id: 4,
    nombre: 'Valentina Mendoza',
    ciudad: 'Itagüí',
    mascota: 'Galleta',
    especie: 'Conejo holandés, 3 años',
    categoria: 'Medicina General',
    foto: '/img/cuidadores/valentina.jpg',
    avatar: '/img/cuidadores/valentina_avatar.jpg',
    extracto: 'Tenía miedo de que los veterinarios no supieran tratar a un conejo. Me sorprendió encontrar a alguien que realmente conocía a los animales exóticos.',
    historia: `Galleta es un conejo holandés, y conseguir atención veterinaria de calidad para animales exóticos en el Área Metropolitana no es fácil. La mayoría de las clínicas atienden perros y gatos, pero cuando llegaba con Galleta, el nivel de conocimiento especializado era claramente limitado.\n\nEn PetFeliz me asignaron al Dr. Juan Pablo Vélez, que tiene formación adicional en medicina de pequeños mamíferos. La diferencia fue evidente desde la primera consulta: manejo cuidadoso, preguntas específicas sobre dieta de conejos, evaluación del desgaste dental.\n\nGalleta tiene ahora un esquema de chequeos cada cuatro meses. Su peso se mantiene estable y su digestión mejoró con los ajustes dietéticos que recomendó el doctor.`,
    etiquetas: ['Exóticos', 'Conejo', 'Nutrición'],
    fecha: 'Febrero 2025',
    rating: 5,
  },
  {
    id: 5,
    nombre: 'Andrés Castillo',
    ciudad: 'Laureles, Medellín',
    mascota: 'Dante',
    especie: 'Bulldog francés, 5 años',
    categoria: 'Cirugía',
    foto: '/img/cuidadores/andres.jpg',
    avatar: '/img/cuidadores/andres_avatar.jpg',
    extracto: 'La cirugía de paladar de Dante era inevitable. Gracias al plan, el proceso fue claro desde el presupuesto hasta el posoperatorio. Sin sorpresas.',
    historia: `Los bulldogs franceses tienen problemas respiratorios estructurales conocidos. Dante resoplaba desde cachorro y a los 4 años el veterinario confirmó que necesitaba corrección de paladar blando elongado.\n\nLa noticia me angustió, sobre todo por los costos. Pedí cotizaciones en tres clínicas y los valores variaban enormemente sin claridad sobre qué incluía cada uno. Con PetFeliz fue diferente: me explicaron exactamente el procedimiento, los riesgos, el tiempo de recuperación y lo que cubría el plan.\n\nEl Dr. Camilo Arango realizó la cirugía en la sede de Laureles. El seguimiento posoperatorio duró tres semanas. Dante hoy respira con una facilidad que nunca tuvo.`,
    etiquetas: ['Cirugía', 'Bulldog francés', 'Vías respiratorias'],
    fecha: 'Diciembre 2024',
    rating: 5,
  },
  {
    id: 6,
    nombre: 'Brisa Fernández',
    ciudad: 'Laureles, Medellín',
    mascota: 'Nube y Rocío',
    especie: 'Gatas siamesas, 6 años',
    categoria: 'Vacunación',
    foto: '/img/cuidadores/mariana.jpg',
    avatar: '/img/cuidadores/mariana_avatar.jpg',
    extracto: 'Dos gatas, el doble de todo. Tener el historial de ambas en la misma app, con recordatorios automáticos, simplificó algo que antes era un caos de papeles.',
    historia: `Nube y Rocío son hermanas y llegaron juntas a mi vida hace seis años. Lo que no imaginé es lo complejo que se vuelve gestionar la salud de dos animales: fechas de vacunación distintas, historiales médicos separados, dos carnets físicos que siempre perdía.\n\nCon PetFeliz todo está en la app. Perfiles separados para cada una, con su historial completo, alertas de vacunación y notas del veterinario. Cuando la Dra. Alejandra Patiño detectó que Rocío respondía mejor a cierta marca de biológico, quedó registrado y se aplica automáticamente en cada ciclo.\n\nEl año pasado ninguna de las dos tuvo que ir a urgencias. Eso no es coincidencia: es medicina preventiva bien ejecutada.`,
    etiquetas: ['Gatos', 'Vacunación', 'Medicina preventiva'],
    fecha: 'Abril 2025',
    rating: 5,
  },
]

const categorias = ['Todas', 'Medicina General', 'Dermatología', 'Urgencias', 'Cirugía', 'Vacunación']

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
          src={historia.foto}
          alt={`${historia.mascota}, mascota de ${historia.nombre}`}
          className="hc-card__img"
          onError={e => { e.currentTarget.style.display = 'none' }}
        />
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
              src={historia.foto}
              alt={historia.mascota}
              className="hc-modal__img"
              onError={e => { e.currentTarget.style.display = 'none' }}
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
  const [categoriaActiva, setCategoriaActiva] = useState('Todas')
  const [historiaAbierta, setHistoriaAbierta] = useState(null)
  const gridRef = useRef(null)

  const historiasFiltradas = categoriaActiva === 'Todas'
    ? historias
    : historias.filter(h => h.categoria === categoriaActiva)

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
            <div className="page-hero__img-wrap">
              <img
                src="/img/cuidadores/hero_cuidadores.jpg"
                alt="Familia con su mascota en EPS PetFeliz"
                className="page-hero__img"
                onError={e => { e.currentTarget.style.display = 'none' }}
              />
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

      {/* COMPARTE TU HISTORIA */}
      <section className="hc-comparte">
        <div className="container">
          <div className="hc-comparte__inner">
            <div className="hc-comparte__text">
              <h2>¿Tienes una historia <span className="text-accent">que contar</span>?</h2>
              <p>
                Si eres afiliado de PetFeliz y tu mascota vivió algo que vale la pena compartir,
                queremos escucharte. Las mejores historias se publican aquí y en nuestras redes.
              </p>
              <div className="hc-comparte__ctas">
                <a href="#" className="btn btn-primary">
                  <FontAwesomeIcon icon="fa-solid fa-pen-to-square" />
                  Compartir mi historia
                </a>
                <a href="#" className="btn btn-ghost">
                  <FontAwesomeIcon icon="fa-solid fa-circle-question" />
                  ¿Cómo funciona?
                </a>
              </div>
            </div>
            <div className="hc-comparte__visual">
              <div className="hc-comparte__paws">
                {['🐾', '🐾', '🐾', '🐾', '🐾', '🐾'].map((p, i) => (
                  <span key={i} className={`hc-paw hc-paw--${i}`}>{p}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <CtaBanner />

      {/* MODAL */}
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