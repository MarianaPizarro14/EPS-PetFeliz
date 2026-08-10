import { useRef, useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { motion } from 'framer-motion'
import './Nosotros.css'
import CtaBanner from '../CtaBanner'
import { veterinariosData } from '../../data/veterinariosData'
import { veterinariosExtra } from '../../data/veterinariosNosotrosExtra'

// El roster (nombre, especialidad, foto) vive en una sola fuente de verdad:
// src/data/veterinariosData.js (la misma que usa AgendarCitaFlow).
// Aquí solo se le agrega la info exclusiva de esta página (desc, sede, horario,
// gradient, icon) que vive en veterinariosNosotrosExtra.js, indexada por id.
const teamMembers = veterinariosData.map((v) => ({
  name: v.nombre,
  role: v.especialidad,
  foto: v.foto,
  ...veterinariosExtra[v.id],
}))

const timelineItems = [
  { year: '2018', title: 'Nacimos en Laureles',           desc: 'Abrimos nuestra primera clínica con 3 veterinarios y una app en versión beta.' },
  { year: '2019', title: 'Primer plan de salud',          desc: 'Lanzamos nuestro modelo de afiliación mensual, el primero de su tipo en Antioquia.' },
  { year: '2021', title: 'Expansión al Área Metro',       desc: 'Abrimos sedes en Bello y Envigado para acercarnos a más familias antioqueñas.' },
  { year: '2023', title: 'Red de especialistas completa', desc: 'Consolidamos nuestra red con vacunación, desparasitación, medicina general, cirugía y atención de emergencias en toda el Área Metropolitana.' },
  { year: '2025', title: '+6.000 mascotas afiliadas',     desc: 'Superamos los 6.000 afiliados activos y recibimos el Premio Innova Antioquia en salud animal.' },
]

// Ojo: estos valores deben coincidir EXACTO con los valores de `especialidad`
// que vienen en veterinariosData.js (ej. 'Dermatología', no 'Dermatólogo'),
// o el filtro no va a encontrar coincidencias.
const especialidades = ['Todos', 'Medicina General', 'Médico Director', 'Dermatología', 'Urgencias', 'Desparasitación', 'Vacunación', 'Cirugía', 'Odontología']

function Nosotros() {
  const location = useLocation()

  const trackRef = useRef(null)
  const currentIndex = useRef(0)

  // Lee el filtro que viene del Link de RedEspecialistas, si no hay ninguno usa 'Todos'
  const [filtro, setFiltro] = useState(location.state?.filtro ?? 'Todos')

  // Cuando llega un filtro desde RedEspecialistas, hace scroll directo a la sección equipo
  useEffect(() => {
    if (location.state?.filtro) {
      const seccion = document.getElementById('equipo')
      if (seccion) {
        setTimeout(() => {
          seccion.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }, 100)
      }
    }
  }, [location.state?.filtro])

  // Timeline drag scroll
  const tlRef = useRef(null)
  const isDragging = useRef(false)
  const startX = useRef(0)
  const scrollLeft = useRef(0)
  const [tlAtStart, setTlAtStart] = useState(true)
  const [tlAtEnd, setTlAtEnd] = useState(false)

  const updateArrows = () => {
    const el = tlRef.current
    if (!el) return
    setTlAtStart(el.scrollLeft <= 0)
    setTlAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 2)
  }

  const scrollTimeline = (dir) => {
    const el = tlRef.current
    if (!el) return
    el.scrollBy({ left: dir * 320, behavior: 'smooth' })
    setTimeout(updateArrows, 350)
  }

  const onMouseDown = (e) => {
    isDragging.current = true
    startX.current = e.pageX - tlRef.current.offsetLeft
    scrollLeft.current = tlRef.current.scrollLeft
    tlRef.current.style.cursor = 'grabbing'
  }

  const onMouseMove = (e) => {
    if (!isDragging.current) return
    e.preventDefault()
    const x = e.pageX - tlRef.current.offsetLeft
    tlRef.current.scrollLeft = scrollLeft.current - (x - startX.current)
    updateArrows()
  }

  const onMouseUp = () => {
    isDragging.current = false
    if (tlRef.current) tlRef.current.style.cursor = 'grab'
  }

  const equipoFiltrado = filtro === 'Todos'
    ? teamMembers
    : teamMembers.filter(m => m.role === filtro)

  const slide = (dir) => {
    const track = trackRef.current
    if (!track || !track.children[0]) return
    const card = track.children[0]
    const gap = 24
    const cardWidth = card.getBoundingClientRect().width + gap
    const wrapWidth = track.parentElement.getBoundingClientRect().width
    const visibleCards = Math.floor(wrapWidth / cardWidth)
    const maxIndex = equipoFiltrado.length - visibleCards
    currentIndex.current = Math.max(0, Math.min(currentIndex.current + dir, maxIndex))
    track.style.transform = `translateX(-${currentIndex.current * cardWidth}px)`
  }

  const handleFiltro = (esp) => {
    setFiltro(esp)
    currentIndex.current = 0
    if (trackRef.current) trackRef.current.style.transform = 'translateX(0)'
  }

  return (
    <>
      {/* PAGE HERO */}
      <section className="page-hero">
        <div className="page-hero__inner">
          <div className="page-hero__text">
            <div className="hero__badge">
              <FontAwesomeIcon icon="fa-solid fa-heart" />
              Fundada con amor en Medellín, 2018
            </div>
            <h1 className="hero__title">
              Sobre <span className="text-accent">nosotros</span>
            </h1>
            <p className="hero__desc">
              Somos un equipo de veterinarios, tecnólogos y amantes de los animales unidos por una
              misión: hacer que el cuidado de las mascotas en Medellín sea accesible, moderno y lleno de amor.
            </p>
          </div>
          <div className="page-hero__img-wrap">
            <img
              src="https://res.cloudinary.com/dedroug6v/image/upload/v1786322769/veterinaria_nosotros_huyrjh.jpg"
              alt="Centro veterinario"
              className="page-hero__img"
              onError={(e) => { e.currentTarget.style.display = 'none' }}
            />
          </div>
        </div>
      </section>

      {/* HISTORIA */}
      <section className="historia">
        <div className="container">
          <div className="historia__inner">
            <div className="historia__visual">
              <div className="historia__img-wrap">
                <img src="https://res.cloudinary.com/dedroug6v/image/upload/v1786320797/petfeliz_sitio_hi2laz.jpg" alt="EPS PetFeliz Medellín" className="historia__img-card" />
                <div className="historia__img-overlay">
                  <span>
                    <FontAwesomeIcon icon="fa-solid fa-location-dot" />
                    Nuestra clínica en Laureles
                  </span>
  </div>
</div>
              <div className="historia__year-badge">
                <span className="year">2018</span>
                <span className="year-label">Fundación</span>
              </div>
            </div>
            <div className="historia__content">
              <h2>Nuestra <span className="text-accent">historia</span></h2>
              <p>
                Todo comenzó en el barrio Laureles cuando la veterinaria Diana Ríos y las desarrolladoras
                Mariana Pizarro, Jahela Ariza y Eliannis Hernández se dieron cuenta de que llevar a sus mascotas
                al veterinario en Medellín implicaba largas filas, costos inesperados y poca información.
                Con esa frustración como punto de partida, nació EPS PetFeliz en 2018.
              </p>
              <p>
                Arrancamos con una pequeña clínica de 3 profesionales. Hoy contamos con más de 40
                especialistas distribuidos en toda el área metropolitana, una plataforma digital que
                permite agendar citas en minutos y planes de salud que hacen que el cuidado preventivo
                esté al alcance de todos los hogares antioqueños.
              </p>
              <p>
                Creemos que cada mascota merece vivir una vida plena y saludable, y que sus familias
                merecen paz mental. Eso es lo que construimos cada día desde Medellín para el mundo.
              </p>
              <div className="historia__stats">
                <div className="historia__stat">
                  <span className="num">+6.000</span>
                  <span className="label">Mascotas atendidas</span>
                </div>
                <div className="historia__stat">
                  <span className="num">40+</span>
                  <span className="label">Especialistas</span>
                </div>
                <div className="historia__stat">
                  <span className="num">7</span>
                  <span className="label">Años de experiencia</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* MISIÓN, VISIÓN Y VALORES */}
      <section className="mv">
        <div className="container">
          <div className="mv__header">
            <h2>Lo que nos <span className="text-accent">mueve</span></h2>
            <p>
              Nuestra razón de ser va más allá de la medicina veterinaria; es un compromiso
              con el bienestar de cada familia en Medellín.
            </p>
          </div>
          <div className="mv__grid">
            <div className="mv__card mv__card--mision">
              <div className="mv__card__icon">
                <FontAwesomeIcon icon="fa-solid fa-bullseye" />
              </div>
              <h3>Misión</h3>
              <p>
                Brindar atención veterinaria integral, accesible y de alta calidad a las mascotas de
                Medellín y el Área Metropolitana, apoyándonos en tecnología y en un equipo humano
                apasionado, para que cada animal reciba el cuidado que merece y cada propietario
                tenga tranquilidad en todo momento.
              </p>
            </div>
            <div className="mv__card mv__card--vision">
              <div className="mv__card__icon">
                <FontAwesomeIcon icon="fa-solid fa-eye" />
              </div>
              <h3>Visión</h3>
              <p>
                Para 2030, ser la red veterinaria líder en Colombia, reconocida por transformar
                la experiencia de cuidar mascotas a través de la innovación digital, la medicina
                preventiva y un modelo de afiliación que proteja la salud animal sin importar el
                presupuesto de la familia.
              </p>
            </div>
            <div className="mv__card mv__card--valores">
              <div className="mv__card__icon">
                <FontAwesomeIcon icon="fa-solid fa-star" />
              </div>
              <h3>Valores</h3>
              <ul>
                <li>Amor y empatía hacia los animales y sus familias</li>
                <li>Excelencia clínica con evidencia científica actualizada</li>
                <li>Transparencia en costos y diagnósticos</li>
                <li>Innovación constante para mejorar la experiencia</li>
                <li>Compromiso con la comunidad medellinense</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* EQUIPO */}
      <section className="equipo" id="equipo">
        <div className="container">
          <div className="equipo__header">
            <h2>Nuestro <span className="text-accent">equipo</span></h2>
            <p>Profesionales apasionados que hacen posible el cuidado de tu mejor amigo cada día.</p>
          </div>
          <div className="equipo__filtros">
            {especialidades.map(esp => (
              <button
                key={esp}
                className={`equipo__filtro-btn ${filtro === esp ? 'active' : ''}`}
                onClick={() => handleFiltro(esp)}
              >
                {esp}
              </button>
            ))}
          </div>
          <div className="equipo__carousel-wrap">
            <button className="equipo__arrow equipo__arrow--prev" aria-label="Anterior" onClick={() => slide(-1)}>
              <FontAwesomeIcon icon="fa-solid fa-chevron-left" />
            </button>
            <div className="equipo__track-wrap">
              <div className="equipo__track" ref={trackRef}>
                {equipoFiltrado.map((m, i) => (
                  <div className="equipo__card" key={i}>
                    <div className="equipo__card-inner">
                      <div className="equipo__avatar" style={{ background: m.gradient }}>
                        {m.foto ? (
                          <img
                            src={m.foto}
                            alt={m.name}
                            className="equipo__avatar-img"
                            onError={(e) => { e.currentTarget.style.display = 'none' }}
                          />
                        ) : (
                          <FontAwesomeIcon icon={m.icon} />
                        )}
                      </div>
                      <div className="equipo__info">
                        <div className="equipo__name">{m.name}</div>
                        <div className="equipo__role">{m.role}</div>
                        <p className="equipo__desc">{m.desc}</p>
                      </div>
                    </div>
                    <div className="equipo__hover">
                      <div className="equipo__hover-item">
                        <FontAwesomeIcon icon="fa-solid fa-location-dot" /> {m.sede}
                      </div>
                      <div className="equipo__hover-item">
                        <FontAwesomeIcon icon="fa-solid fa-clock" /> {m.horario}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <button className="equipo__arrow equipo__arrow--next" aria-label="Siguiente" onClick={() => slide(1)}>
              <FontAwesomeIcon icon="fa-solid fa-chevron-right" />
            </button>
          </div>
        </div>
      </section>

      {/* TIMELINE */}
      <section className="timeline-section">
        <div className="container">
          <motion.div
            className="timeline-section__header"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.6 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          >
            <h2>Nuestra <span className="text-accent">trayectoria</span></h2>
            <p className="timeline-section__hint">
              <FontAwesomeIcon icon="fa-solid fa-arrows-left-right" /> Desliza para explorar
            </p>
          </motion.div>
        </div>

        {/* Wrapper con flechas */}
        <div className="timeline-wrapper">
          <button
            className={`timeline-arrow timeline-arrow--prev ${tlAtStart ? 'disabled' : ''}`}
            onClick={() => scrollTimeline(-1)}
            aria-label="Anterior"
          >
            <FontAwesomeIcon icon="fa-solid fa-chevron-left" />
          </button>

          <div
            className="timeline-scroll"
            ref={tlRef}
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onMouseLeave={onMouseUp}
            onScroll={updateArrows}
          >
            <div className="timeline-track">
              <div className="timeline-line" />

              {timelineItems.map((item, i) => (
                <motion.div
                  className={`timeline__item timeline__item--${i % 2 === 0 ? 'top' : 'bottom'}`}
                  key={i}
                  initial={{ opacity: 0, y: i % 2 === 0 ? -40 : 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{ duration: 0.55, delay: i * 0.08, ease: 'easeOut' }}
                >
                  {/* Card arriba */}
                  {i % 2 === 0 && (
                    <motion.div
                      className="timeline__card"
                      whileHover={{ y: -5, boxShadow: '0 16px 40px rgba(0,109,65,.15)' }}
                      transition={{ duration: 0.22 }}
                    >
                      <div className="timeline__year">{item.year}</div>
                      <h4>{item.title}</h4>
                      <p>{item.desc}</p>
                    </motion.div>
                  )}

                  {/* Conector vertical + punto */}
                  <div className="timeline__connector">
                    <div className="timeline__connector-line" />
                    <motion.div
                      className="timeline__dot"
                      initial={{ scale: 0 }}
                      whileInView={{ scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.4, delay: i * 0.08 + 0.2, type: 'spring', stiffness: 220, damping: 14 }}
                    />
                    <div className="timeline__connector-line" />
                  </div>

                  {/* Card abajo */}
                  {i % 2 !== 0 && (
                    <motion.div
                      className="timeline__card"
                      whileHover={{ y: 5, boxShadow: '0 16px 40px rgba(0,109,65,.15)' }}
                      transition={{ duration: 0.22 }}
                    >
                      <div className="timeline__year">{item.year}</div>
                      <h4>{item.title}</h4>
                      <p>{item.desc}</p>
                    </motion.div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>

          <button
            className={`timeline-arrow timeline-arrow--next ${tlAtEnd ? 'disabled' : ''}`}
            onClick={() => scrollTimeline(1)}
            aria-label="Siguiente"
          >
            <FontAwesomeIcon icon="fa-solid fa-chevron-right" />
          </button>
        </div>
      </section>

      <CtaBanner />
    </>
  )
}

export default Nosotros