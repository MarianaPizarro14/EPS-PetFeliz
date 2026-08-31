import CtaBanner from '../CtaBanner'
import './KitPrensa.css'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faPaw,
  faPalette,
  faCamera,
  faFileLines,
  faVideo,
  faUsers,
  faDownload,
} from '@fortawesome/free-solid-svg-icons'

const stats = [
  { num: '2018',  label: 'Año de fundación' },
  { num: '15K+',  label: 'Mascotas atendidas' },
  { num: '30+',  label: 'Especialistas en red' },
  { num: '3',    label: 'Ciudades en Antioquía' },
  { num: '4.9★',  label: 'Calificación promedio' },
  { num: '98%',   label: 'Satisfacción de usuarios' },
]

const assets = [
  {
    icon: faPaw,
    color: 'green',
    title: 'Logo EPS PetFeliz',
    desc: 'SVG • PNG • Versiones en color y blanco',
    downloadUrl: 'https://drive.google.com/uc?export=download&id=1oo8BbtbU4ywONU_DbrcNzsXNMGdLDKuA',
    available: true,
  },
  {
    icon: faPalette,
    color: 'blue',
    title: 'Paleta de colores',
    desc: 'PDF • Brand guidelines completas',
    downloadUrl: 'https://drive.google.com/uc?export=download&id=1jahYZYVIidpy99CX-trGNNX1ade1rMjw',
    available: true,
  },
  {
    icon: faCamera,
    color: 'amber',
    title: 'Fotos de producto',
    desc: 'ZIP • Alta resolución (300 DPI)',
    available: false,
  },
  {
    icon: faFileLines,
    color: 'green',
    title: 'Ficha informativa',
    desc: 'PDF • Una página • ES / EN',
    downloadUrl: 'https://drive.google.com/uc?export=download&id=1XHodCtMA0pcBQDrfo9gl77NXL1ebF12N',
    available: true,
  },
  {
    icon: faVideo,
    color: 'blue',
    title: 'Video institucional',
    desc: 'MP4 • 1080p • 90 segundos',
    available: false,
  },
  {
    icon: faUsers,
    color: 'amber',
    title: 'Fotos del equipo',
    desc: 'ZIP • Directivos y fundadores',
    available: false,
  },
]

const hitos = [
  {
    fecha: '2026',
    tag: 'Expansión',
    texto: 'Consolidación de operaciones en nuestras 3 clínicas en Antioquia: Medellín, Itagüí y Bello.',
  },
  {
    fecha: '2024',
    tag: 'Reconocimiento',
    texto: 'Premio Innova Colombia 2024 a la empresa de mayor impacto social en salud animal.',
  },
  {
    fecha: '2024',
    tag: 'Crecimiento',
    texto: 'Superamos las 15.000 mascotas atendidas desde nuestra fundación en Antioquia.',
  },
  {
    fecha: '2023',
    tag: 'Inversión',
    texto: 'Cierre de ronda de inversión Serie A por COP $5.000 millones para expansión departamental.',
  },
  {
    fecha: '2018',
    tag: 'Fundación',
    texto: 'Fundación de EPS PetFeliz en Medellín, la primera entidad promotora de salud veterinaria de Antioquia.',
  },
]

function KitDePrensa() {
  return (
    <>
      {/* ── HERO ── */}
      <section className="hero press-hero">
        <div className="container">
          <div className="press-hero__inner">
            <span className="hero__badge">Sala de Prensa</span>
            <h1 className="hero__title">
              Kit de Prensa<br />
              <span className="press-hero__title-accent">EPS PetFeliz</span>
            </h1>
            <p className="hero__desc">
              Todo lo que necesitas para cubrir nuestra historia. Recursos oficiales,
              datos verificados y contactos directos para periodistas y medios.
            </p>
          </div>
        </div>
      </section>

      <section className="press-stats">
        <div className="container">
          <div className="press-stats__grid">
            {stats.map(s => (
              <div className="press-stat-card" key={s.label}>
                <div className="press-stat-card__num">{s.num}</div>
                <div className="press-stat-card__label">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="press-about">
        <div className="container press-about__inner">
          <h2 className="press-section-title">Quiénes <span className="title-accent">somos</span></h2>
          <p className="press-about__text">
            <strong>EPS PetFeliz</strong> es la primera entidad promotora de salud veterinaria
            de Antioquía diseñada para la vida moderna de las mascotas. Nacimos en 2018 con la
            misión de democratizar el acceso a atención veterinaria especializada y de calidad
            para todos los hogares antioqueños.
          </p>
          <p className="press-about__text">
            Nuestra plataforma conecta a dueños de mascotas con una red de más de 30
            especialistas veterinarios certificados en 3 ciudades de Antioquía. Ofrecemos un plan
            de salud integral, atención de emergencias 24/7 y seguimiento digital del
            historial médico de cada mascota.
          </p>
          <p className="press-about__text">
            Desde nuestra fundación en Medellín hemos atendido más de 15.000 mascotas,
            recibido el Premio Innova Colombia 2024 y cerrado una ronda Serie A de
            COP $5.000 millones para continuar nuestra expansión departamental.
          </p>
          <blockquote className="press-about__quote">
            "La EPS veterinaria diseñada para la vida moderna de las mascotas.
            Donde la compasión se encuentra con la innovación."
          </blockquote>
        </div>
      </section>

      <section className="press-assets">
        <div className="container">
          <h2 className="press-section-title">Recursos <span className="title-accent">descargables</span></h2>
          <div className="press-assets__grid">
            {assets.map(a => (
              a.available ? (
                <a
                  href={a.downloadUrl}
                  download
                  target="_blank"
                  rel="noopener noreferrer"
                  className="press-asset-card press-asset-card--available"
                  key={a.title}
                  title={`Descargar ${a.title}`}
                >
                  <div className={`press-asset-card__icon press-asset-card__icon--${a.color}`}>
                    <FontAwesomeIcon icon={a.icon} />
                  </div>
                  <div className="press-asset-card__body">
                    <div className="press-asset-card__title">{a.title}</div>
                    <div className="press-asset-card__desc">{a.desc}</div>
                  </div>
                  <div className="press-asset-card__dl" aria-label={`Descargar ${a.title}`}>
                    <FontAwesomeIcon icon={faDownload} />
                  </div>
                </a>
              ) : (
                <div className="press-asset-card press-asset-card--disabled" key={a.title}>
                  <div className={`press-asset-card__icon press-asset-card__icon--${a.color}`}>
                    <FontAwesomeIcon icon={a.icon} />
                  </div>
                  <div className="press-asset-card__body">
                    <div className="press-asset-card__title">{a.title}</div>
                    <div className="press-asset-card__desc">{a.desc}</div>
                  </div>
                  <span className="press-asset-card__badge-soon">
                    Próximamente
                  </span>
                </div>
              )
            ))}
          </div>
        </div>
      </section>

      {/* ── HITOS RECIENTES ── */}
      <section className="press-hitos">
        <div className="container press-hitos__inner">
          <div className="press-hitos__header">
            <h2 className="press-section-title">Hitos <span className="title-accent">recientes</span></h2>
            <p className="press-hitos__subtitle">
              Un recorrido por los momentos que definen nuestra historia.
            </p>
          </div>

          <div className="press-hitos__timeline">
            {/* Línea vertical decorativa */}
            <div className="press-hitos__line" aria-hidden="true" />

            {hitos.map(({ fecha, tag, texto }, i) => (
              <div className="press-hito-item" key={i}>
                {/* Año flotante a la izquierda */}
                <div className="press-hito-item__year-col">
                  <span className="press-hito-item__year">{fecha}</span>
                </div>

                {/* Punto en la línea */}
                <div className="press-hito-item__dot" aria-hidden="true" />

                {/* Tarjeta del hito */}
                <div className="press-hito-item__card">
                  <span className="press-hito-item__tag">{tag}</span>
                  <p className="press-hito-item__text">{texto}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <CtaBanner
        title="¿Necesitas más información?"
        subtitle="Nuestro equipo de comunicaciones responde en menos de 24 horas."
        buttons={[
          { label: 'petfelizeps@gmail.com', href: 'mailto:petfelizeps@gmail.com', variant: 'btn-primary' },
        ]}
      />
    </>
  )
}

export default KitDePrensa