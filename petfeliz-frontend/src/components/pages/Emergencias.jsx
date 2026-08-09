import { useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { motion, AnimatePresence } from 'framer-motion'
import './Emergencias.css'
import Hero from '../Hero'
import ServiceCard from '../ServiceCard'
import CtaBanner from '../CtaBanner'

const sedes = [
  {
    nombre: 'Sede Laureles',
    direccion: 'Cra. 76 #34-20, Laureles, Medellín',
    telefono: '(604) 444-7389',
    disponible: '24/7',
    tiempoEspera: '~8 min',
  },
  {
    nombre: 'Sede Itagüí',
    direccion: 'Cra. 52 #49-30, La Paz, Itagüí',
    telefono: '(604) 372-9100',
    disponible: '24/7',
    tiempoEspera: '~12 min',
  },
  {
    nombre: 'Sede Bello',
    direccion: 'Cra. 48 #12-15, Bello, Antioquia',
    telefono: '(604) 480-2211',
    disponible: '24/7',
    tiempoEspera: '~15 min',
  },
]

const casos = [
  {
    icon: 'fa-solid fa-lungs',
    titulo: 'Dificultad respiratoria',
    desc: 'Jadeo excesivo, respiración con la boca abierta en gatos, encías azuladas o moradas.',
    nivel: 'Crítico',
    color: '#ef4444',
    siHacer: [
      'Mantén a tu mascota lo más quieta y tranquila posible; el esfuerzo agrava la falta de oxígeno.',
      'Llévala a un espacio ventilado, sin apretarla ni sostenerla contra su voluntad.',
      'Llama a la sede de urgencias en el camino para que te estén esperando.',
    ],
    noHacer: [
      'No le dañes agua ni comida por la boca, podría ahogarse.',
      'No le abras la boca para "revisar" salvo que sepas exactamente qué buscar.',
      'No esperes a que "se le pase sola"; la dificultad respiratoria puede progresar muy rápido.',
    ],
    telefono: '(604) 444-7389',
  },
  {
    icon: 'fa-solid fa-bolt',
    titulo: 'Convulsiones',
    desc: 'Sacudidas involuntarias, pérdida de consciencia, babeo excesivo o rigidez muscular.',
    nivel: 'Crítico',
    color: '#ef4444',
    siHacer: [
      'Aleja muebles u objetos con los que pueda golpearse durante la convulsión.',
      'Cronometra cuánto dura el episodio; esa información es muy valiosa para el veterinario.',
      'Habla en voz baja y mantén el ambiente con poca luz y poco ruido tras el episodio.',
    ],
    noHacer: [
      'No intentes sujetarla con fuerza ni metas las manos cerca de su boca.',
      'No le ofrezcas agua o comida mientras está convulsionando o justo después.',
      'No la dejes sola si tuvo más de una convulsión seguida; eso es urgencia inmediata.',
    ],
    telefono: '(604) 444-7389',
  },
  {
    icon: 'fa-solid fa-skull',
    titulo: 'Trauma grave',
    desc: 'Accidente de tránsito, caída de altura, herida profunda o fractura visible.',
    nivel: 'Crítico',
    color: '#ef4444',
    siHacer: [
      'Mueve a tu mascota lo menos posible; usa una superficie rígida o manta como camilla improvisada.',
      'Si hay sangrado, aplica presión firme y constante con un paño limpio.',
      'Cúbrela con una manta para conservar su temperatura corporal en el trayecto.',
    ],
    noHacer: [
      'No intentes acomodar huesos o articulaciones que se vean fuera de lugar.',
      'No le des analgésicos humanos; muchos son tóxicos para perros y gatos.',
      'No la cargues por una sola extremidad o por el abdomen si sospechas fractura.',
    ],
    telefono: '(604) 372-9100',
  },
  {
    icon: 'fa-solid fa-triangle-exclamation',
    titulo: 'Intoxicación',
    desc: 'Ingesta de chocolate, uvas, medicamentos humanos, veneno para ratas u otras sustancias.',
    nivel: 'Urgente',
    color: '#f97316',
    siHacer: [
      'Identifica y lleva contigo el empaque, planta o sustancia que ingirió, si es posible.',
      'Anota la hora aproximada en que ocurrió la ingesta y la cantidad estimada.',
      'Llama de inmediato a la línea de urgencias para recibir orientación específica según la sustancia.',
    ],
    noHacer: [
      'No induzcas el vómito sin indicación veterinaria; en algunos casos puede empeorar el cuadro.',
      'No le dañes leche, aceite ni remedios "caseros" sin confirmar primero con un profesional.',
      'No esperes a ver síntomas antes de actuar; muchas toxinas tardan horas en manifestarse.',
    ],
    telefono: '(604) 372-9100',
  },
  {
    icon: 'fa-solid fa-droplet',
    titulo: 'Hemorragia activa',
    desc: 'Sangrado que no cede con presión directa durante más de 5 minutos.',
    nivel: 'Urgente',
    color: '#f97316',
    siHacer: [
      'Aplica presión directa y constante sobre la herida con un paño o gasa limpia.',
      'Eleva la zona afectada por encima del nivel del corazón si es una extremidad y es seguro hacerlo.',
      'Mantén la presión durante todo el trayecto, sin retirar el paño para "revisar".',
    ],
    noHacer: [
      'No uses torniquetes improvisados salvo indicación explícita del veterinario por teléfono.',
      'No retires objetos profundamente incrustados; eso puede aumentar el sangrado.',
      'No limpies la herida con alcohol o agua oxigenada, retrasa la atención y puede dañar el tejido.',
    ],
    telefono: '(604) 480-2211',
  },
  {
    icon: 'fa-solid fa-temperature-high',
    titulo: 'Golpe de calor',
    desc: 'Temperatura corporal elevada, letargo extremo, vómito o pérdida del equilibrio.',
    nivel: 'Urgente',
    color: '#f97316',
    siHacer: [
      'Llévala de inmediato a un lugar fresco y con sombra o ventilación.',
      'Humedece su cuerpo con agua a temperatura ambiente, sobre todo almohadillas y abdomen.',
      'Ofrécele agua en pequeñas cantidades si está consciente y puede tragar sin dificultad.',
    ],
    noHacer: [
      'No uses agua helada ni hielo directo sobre la piel; un enfriamiento muy brusco puede ser perjudicial.',
      'No la fuerces a caminar o hacer esfuerzo mientras se recupera.',
      'No asumas que está bien solo porque deja de jadear; el daño interno puede continuar.',
    ],
    telefono: '(604) 480-2211',
  },
]

const pasos = [
  {
    num: '01',
    titulo: 'Mantén la calma',
    desc: 'Evalúa a tu mascota sin manipularla bruscamente. Un animal asustado puede morder incluso a su dueño.',
  },
  {
    num: '02',
    titulo: 'Llama antes de venir',
    desc: 'Marca nuestra línea de emergencias. El equipo te orientará y preparará la sala de urgencias para recibirte.',
  },
  {
    num: '03',
    titulo: 'Transporte seguro',
    desc: 'Usa una caja transportadora o envuelve a tu mascota en una manta. Evita que se mueva durante el trayecto.',
  },
  {
    num: '04',
    titulo: 'Llega a la sede más cercana',
    desc: 'Nuestras tres sedes atienden urgencias las 24 horas. Al llegar, indica en recepción que es una emergencia.',
  },
]

// Servicios de urgencias usando ServiceCard reutilizable
const serviciosUrgencias = [
  {
    icon: 'fa-solid fa-heart-pulse',
    iconVariant: 'red',
    title: 'UCI Veterinaria',
    description: 'Monitoreo continuo, ventilación mecánica y soporte vital para pacientes críticos.',
    linkText: 'Conocer más →',
    linkVariant: 'red',
  },
  {
    icon: 'fa-solid fa-syringe',
    iconVariant: 'blue',
    title: 'Toxicología de urgencia',
    description: 'Protocolos de desintoxicación y antídotos para intoxicaciones accidentales.',
    linkText: 'Ver protocolo →',
    linkVariant: 'blue',
  },
  {
    icon: 'fa-solid fa-stethoscope',
    iconVariant: 'yellow',
    title: 'Cirugía de emergencia',
    description: 'Quirófano disponible 24/7 para intervenciones urgentes con anestesiólogo de guardia.',
    linkText: 'Nuestro equipo →',
    linkVariant: 'yellow',
  },
]

const equipo = [
  { name: 'Dra. Carolina Muñoz',  role: 'Urgencias · Sede Laureles', horario: '24/7', gradient: 'linear-gradient(135deg,#fca5a5,#f87171)' },
  { name: 'Dr. Esteban Cardona',  role: 'Urgencias · Sede Envigado', horario: '24/7', gradient: 'linear-gradient(135deg,#fca5a5,#f87171)' },
  { name: 'Dra. Mariana Salazar', role: 'Urgencias · Sede Bello',    horario: '24/7', gradient: 'linear-gradient(135deg,#fca5a5,#f87171)' },
]

const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.55, ease: 'easeOut' } },
}

function CasoModal({ caso, onClose }) {
  if (!caso) return null
  return (
    <AnimatePresence>
      <motion.div
        className="em-modal-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="em-modal"
          initial={{ opacity: 0, y: 40, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.97 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          onClick={e => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-label={caso.titulo}
          style={{ '--nivel-color': caso.color }}
        >
          <button className="em-modal__close" onClick={onClose} aria-label="Cerrar">
            <FontAwesomeIcon icon="fa-solid fa-xmark" />
          </button>

          <div className="em-modal__header">
            <div className="em-modal__icon-wrap">
              <FontAwesomeIcon icon={caso.icon} />
            </div>
            <span className="em-modal__badge">{caso.nivel}</span>
            <h2 className="em-modal__titulo">{caso.titulo}</h2>
            <p className="em-modal__desc">{caso.desc}</p>
          </div>

          <div className="em-modal__content">
            <div className="em-modal__col em-modal__col--si">
              <h3><FontAwesomeIcon icon="fa-solid fa-circle-check" /> Qué hacer</h3>
              <ul>
                {caso.siHacer.map((item, i) => <li key={i}>{item}</li>)}
              </ul>
            </div>
            <div className="em-modal__col em-modal__col--no">
              <h3><FontAwesomeIcon icon="fa-solid fa-circle-xmark" /> Qué evitar</h3>
              <ul>
                {caso.noHacer.map((item, i) => <li key={i}>{item}</li>)}
              </ul>
            </div>
          </div>

          <a href={`tel:${caso.telefono.replace(/\D/g, '')}`} className="btn btn-primary em-modal__cta">
            <FontAwesomeIcon icon="fa-solid fa-phone" /> Llamar a urgencias ahora
          </a>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

function Emergencias() {
  const [casoAbierto, setCasoAbierto] = useState(null)

  const heroCtas = (
    <>
      <a href="tel:6044447389" className="btn btn-primary">
        <FontAwesomeIcon icon="fa-solid fa-phone" />
        Llamar ahora
      </a>
      <a href="#sedes" className="btn-how">
        <FontAwesomeIcon icon="fa-solid fa-location-dot" />
        Ver sedes
      </a>
    </>
  )

  return (
    <>
      {/* ── HERO — reutiliza el componente compartido ─── */}
      <div className="em-hero-wrap">
        <Hero
          centered
          badge="Atención de urgencias 24 / 7"
          badgeIcon="fa-solid fa-circle-exclamation"
          title="Emergencias"
          accent="veterinarias"
          desc="Cuando cada minuto cuenta, estamos listos. Nuestras tres sedes en el Área Metropolitana
                de Medellín cuentan con sala de urgencias equipada y un equipo especializado disponible
                las 24 horas, los 365 días del año."
          ctas={heroCtas}
        />

        {/* Panel de stats pegado debajo del hero — estilo tarjeta vertical (como HistoriasCuidadores) */}
        <div className="em-hero-stats">
          <div className="container">
            <div className="em-hero-stats__grid">
              <div className="em-hero-stats__item">
                <div className="em-hero-stats__icon">
                  <FontAwesomeIcon icon="fa-solid fa-hospital" />
                </div>
                <span className="em-hero-stats__num">3</span>
                <span className="em-hero-stats__label">Sedes activas</span>
              </div>
              <div className="em-hero-stats__item">
                <div className="em-hero-stats__icon">
                  <FontAwesomeIcon icon="fa-solid fa-clock" />
                </div>
                <span className="em-hero-stats__num">24/7</span>
                <span className="em-hero-stats__label">Disponibilidad</span>
              </div>
              <div className="em-hero-stats__item">
                <div className="em-hero-stats__icon">
                  <FontAwesomeIcon icon="fa-solid fa-hourglass-half" />
                </div>
                <span className="em-hero-stats__num">&lt;15'</span>
                <span className="em-hero-stats__label">Tiempo de espera</span>
              </div>
              <div className="em-hero-stats__item">
                <div className="em-hero-stats__icon">
                  <FontAwesomeIcon icon="fa-solid fa-user-doctor" />
                </div>
                <span className="em-hero-stats__num">3</span>
                <span className="em-hero-stats__label">Especialistas de guardia</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── SERVICIOS — reutiliza ServiceCard ── */}
      <section className="services em-servicios">
        <div className="container">
          <div className="section-header">
            <h2>Capacidad de <span className="text-accent">respuesta</span></h2>
            <p>
              Contamos con la infraestructura y el talento humano para atender
              cualquier emergencia veterinaria sin importar la hora.
            </p>
          </div>
          <div className="services__grid">
            {serviciosUrgencias.map((card, i) => (
              <ServiceCard key={i} {...card} />
            ))}
          </div>
        </div>
      </section>

      {/* ── SEÑALES DE ALERTA ──── */}
      <section className="em-casos">
        <div className="container">
          <motion.div
            className="section-header"
            variants={fadeUp} initial="hidden" whileInView="show"
            viewport={{ once: true, amount: 0.5 }}
          >
            <h2>¿Cuándo es una <span className="text-accent">emergencia</span>?</h2>
            <p>
              Reconocer a tiempo una urgencia puede salvar la vida de tu mascota.
              Si identificas alguno de estos signos, acude de inmediato a la sede más cercana.
            </p>
          </motion.div>

          <div className="em-casos__grid">
            {casos.map((c, i) => (
              <motion.div
                className="em-caso-card"
                key={i}
                variants={fadeUp} initial="hidden" whileInView="show"
                viewport={{ once: true, amount: 0.3 }}
                transition={{ delay: i * 0.07 }}
                style={{ '--nivel-color': c.color }}
                onClick={() => setCasoAbierto(c)}
                tabIndex={0}
                role="button"
                aria-label={`Ver qué hacer en caso de ${c.titulo}`}
                onKeyDown={e => e.key === 'Enter' && setCasoAbierto(c)}
              >
                <div className="em-caso-card__icon-wrap">
                  <FontAwesomeIcon icon={c.icon} />
                </div>
                <span className="em-caso-card__badge">{c.nivel}</span>
                <h3>{c.titulo}</h3>
                <p>{c.desc}</p>
                <span className="em-caso-card__link">
                  Qué hacer <FontAwesomeIcon icon="fa-solid fa-arrow-right" />
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <CasoModal caso={casoAbierto} onClose={() => setCasoAbierto(null)} />

      {/* ── QUÉ HACER ─── */}
      <section className="em-pasos">
        <div className="container">
          <motion.div
            className="section-header"
            variants={fadeUp} initial="hidden" whileInView="show"
            viewport={{ once: true, amount: 0.5 }}
          >
            <h2>Qué hacer en una <span className="text-accent">emergencia</span></h2>
            <p>Cuatro pasos claros para actuar con rapidez y seguridad.</p>
          </motion.div>

          <div className="em-pasos__track">
            <div className="em-pasos__line" />
            {pasos.map((p, i) => (
              <motion.div
                className="em-paso"
                key={i}
                variants={fadeUp} initial="hidden" whileInView="show"
                viewport={{ once: true, amount: 0.4 }}
                transition={{ delay: i * 0.1 }}
              >
                <div className="em-paso__num">{p.num}</div>
                <div className="em-paso__content">
                  <h4>{p.titulo}</h4>
                  <p>{p.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SEDES 24/7 ─── */}
      <section className="em-sedes" id="sedes">
        <div className="container">
          <motion.div
            className="section-header"
            variants={fadeUp} initial="hidden" whileInView="show"
            viewport={{ once: true, amount: 0.5 }}
          >
            <h2>Sedes de <span className="text-accent">urgencias</span></h2>
            <p>Las tres sedes atienden emergencias las 24 horas. Elige la más cercana a ti.</p>
          </motion.div>

          <div className="em-sedes__grid">
            {sedes.map((s, i) => (
              <motion.div
                className="em-sede-card"
                key={i}
                variants={fadeUp} initial="hidden" whileInView="show"
                viewport={{ once: true, amount: 0.3 }}
                transition={{ delay: i * 0.1 }}
              >
                <div className="em-sede-card__header">
                  <div className="em-sede-card__dot" />
                  <h3>{s.nombre}</h3>
                </div>
                <div className="em-sede-card__info">
                  <span><FontAwesomeIcon icon="fa-solid fa-location-dot" /> {s.direccion}</span>
                  <span><FontAwesomeIcon icon="fa-solid fa-phone" /> {s.telefono}</span>
                  <span><FontAwesomeIcon icon="fa-solid fa-clock" /> {s.disponible}</span>
                  <span><FontAwesomeIcon icon="fa-solid fa-hourglass-half" /> Espera aprox. {s.tiempoEspera}</span>
                </div>
                <div className="em-sede-card__actions">
                  <a href={`tel:${s.telefono.replace(/\D/g,'')}`} className="btn btn-primary em-sede-card__btn">
                    <FontAwesomeIcon icon="fa-solid fa-phone" /> Llamar
                  </a>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(s.direccion)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="em-sede-card__btn-map"
                  >
                    <FontAwesomeIcon icon="fa-solid fa-location-dot" /> Ver ubicación
                  </a>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── EQUIPO DE URGENCIAS ─── */}
      <section className="em-equipo">
        <div className="container">
          <motion.div
            className="section-header"
            variants={fadeUp} initial="hidden" whileInView="show"
            viewport={{ once: true, amount: 0.5 }}
          >
            <h2>Equipo de <span className="text-accent">urgencias</span></h2>
            <p>Especialistas en emergencias veterinarias listos para actuar en cualquier momento.</p>
          </motion.div>

          <div className="em-equipo__grid">
            {equipo.map((m, i) => (
              <motion.div
                className="em-equipo__card"
                key={i}
                variants={fadeUp} initial="hidden" whileInView="show"
                viewport={{ once: true, amount: 0.3 }}
                transition={{ delay: i * 0.12 }}
              >
                <div className="em-equipo__avatar" style={{ background: m.gradient }}>
                  <FontAwesomeIcon icon="fa-solid fa-kit-medical" />
                </div>
                <div className="em-equipo__name">{m.name}</div>
                <div className="em-equipo__role">{m.role}</div>
                <div className="em-equipo__horario">
                  <FontAwesomeIcon icon="fa-solid fa-clock" /> {m.horario}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA — reutiliza CtaBanner con props custom ───────── */}
      <CtaBanner
        variant="danger"
        title="¿Tu mascota necesita atención urgente?"
        subtitle="No esperes. Llama a la sede más cercana o escríbenos por WhatsApp. Estamos disponibles las 24 horas."
        buttons={[
          { label: 'Llamar ahora',          href: 'tel:6044447389', variant: 'btn-primary'      },
          { label: 'Escribir por WhatsApp', href: '#',              variant: 'btn-outline-white' },
        ]}
      />
    </>
  )
}

export default Emergencias