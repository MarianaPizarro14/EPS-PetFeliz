import { useState, useEffect } from 'react'
import './PoliticaPrivacidad.css'

const sections = [
  {
    title: 'Responsable del tratamiento',
    content: (
      <>
        <p>
          <strong>EPS PetFeliz Inc.</strong> con domicilio en Medellín, Antioquia, Colombia,
          identificada con NIT 901.234.567-8, es la responsable del tratamiento de los datos
          personales recolectados a través de nuestros servicios digitales y físicos.
        </p>
        <p>
          Puedes contactar a nuestro Delegado de Protección de Datos escribiendo a{' '}
          <a href="mailto:petfelizeps@gmail.com" className="text-accent" style={{ fontWeight: 700 }}>
            petfelizeps@gmail.com
          </a>.
        </p>
      </>
    ),
  },
  {
    title: 'Datos que recopilamos',
    content: (
      <>
        <p>Recopilamos únicamente los datos necesarios para prestar nuestros servicios de salud veterinaria:</p>
        <ul className="legal-list">
          {[
            ['Datos del titular:', 'nombre, documento de identidad, correo electrónico, teléfono y dirección.'],
            ['Datos de la mascota:', 'nombre, especie, raza, edad, historial médico y vacunas.'],
            ['Datos de pago:', 'procesados de forma segura por pasarelas certificadas PCI-DSS. No almacenamos números de tarjeta.'],
            ['Datos de uso:', 'interacciones con la app, consultas realizadas y preferencias de navegación.'],
          ].map(([k, v]) => (
            <li className="legal-list__item" key={k}>
              <span className="legal-list__bullet">•</span>
              <span className="legal-list__text"><strong>{k}</strong> {v}</span>
            </li>
          ))}
        </ul>
      </>
    ),
  },
  {
    title: 'Finalidades del tratamiento',
    content: (
      <ul className="legal-list">
        {[
          'Prestación del servicio de salud veterinaria contratado.',
          'Gestión de la historia clínica de tu mascota.',
          'Facturación y procesamiento de pagos.',
          'Comunicación de citas, recordatorios y alertas médicas.',
          'Mejora continua mediante análisis estadístico anonimizado.',
          'Cumplimiento de obligaciones legales y regulatorias.',
        ].map(item => (
          <li className="legal-list__item" key={item}>
            <span className="legal-list__bullet">•</span>
            <span className="legal-list__text">{item}</span>
          </li>
        ))}
      </ul>
    ),
  },
  {
    title: 'Base legal del tratamiento',
    content: (
      <>
        <blockquote className="legal-quote">
          Tratamos tus datos únicamente cuando contamos con una base legal válida conforme
          a la Ley 1581 de 2012 y el Decreto 1377 de 2013.
        </blockquote>
        <p>
          Las bases legales aplicables son: <strong>(a)</strong> ejecución del contrato de
          afiliación, <strong>(b)</strong> tu consentimiento expreso para comunicaciones de
          marketing, <strong>(c)</strong> cumplimiento de obligaciones legales, y{' '}
          <strong>(d)</strong> interés legítimo en mejorar nuestros servicios.
        </p>
      </>
    ),
  },
  {
    title: 'Tus derechos (ARCO)',
    content: (
      <>
        <p>Como titular de datos personales tienes los siguientes derechos que puedes ejercer en cualquier momento:</p>
        <ul className="legal-list">
          {[
            ['Acceso:', 'conocer qué datos tuyos tenemos y cómo los usamos.'],
            ['Rectificación:', 'corregir datos inexactos o incompletos.'],
            ['Cancelación:', 'solicitar la eliminación de tus datos cuando ya no sean necesarios.'],
            ['Oposición:', 'oponerte al tratamiento en los casos permitidos por ley.'],
          ].map(([k, v]) => (
            <li className="legal-list__item" key={k}>
              <span className="legal-list__bullet">•</span>
              <span className="legal-list__text"><strong>{k}</strong> {v}</span>
            </li>
          ))}
        </ul>
        <p>
          Para ejercer tus derechos escribe a{' '}
          <a href="mailto:petfelizeps@gmail.com" className="text-accent" style={{ fontWeight: 700 }}>
            petfelizeps@gmail.com
          </a>. Responderemos en un plazo máximo de <strong>10 días hábiles</strong>.
        </p>
      </>
    ),
  },
  {
    title: 'Retención y seguridad',
    content: (
      <>
        <p>
          Conservamos tus datos durante la vigencia de tu contrato y por el tiempo adicional
          exigido por la ley (mínimo 5 años para historias clínicas).
        </p>
        <p>
          Aplicamos medidas de seguridad técnicas y organizativas que incluyen cifrado AES-256
          en reposo, TLS 1.3 en tránsito, control de acceso por roles, y auditorías de
          seguridad semestrales.
        </p>
      </>
    ),
  },
  {
    title: 'Transferencia de datos a terceros',
    content: (
      <>
        <p>
          EPS PetFeliz puede compartir tus datos con terceros únicamente en los siguientes casos:
        </p>
        <ul className="legal-list">
          {[
            'Clínicas y veterinarios aliados de la red, para la prestación del servicio contratado.',
            'Pasarelas de pago certificadas PCI-DSS para el procesamiento de transacciones.',
            'Proveedores de infraestructura tecnológica (hosting, cloud) bajo acuerdos de confidencialidad.',
            'Autoridades competentes cuando la ley así lo exija.',
          ].map(item => (
            <li className="legal-list__item" key={item}>
              <span className="legal-list__bullet">•</span>
              <span className="legal-list__text">{item}</span>
            </li>
          ))}
        </ul>
        <p>
          Nunca venderemos ni cederemos tus datos personales a terceros con fines comerciales
          sin tu consentimiento previo y expreso.
        </p>
      </>
    ),
  },
  {
    title: 'Cookies y tecnologías similares',
    content: (
      <>
        <p>
          Utilizamos cookies estrictamente necesarias para el funcionamiento del servicio,
          cookies analíticas (Google Analytics 4 con IP anonimizada) y cookies de preferencias.
          Puedes gestionar tus preferencias desde el banner de cookies o desde la configuración
          de tu navegador.
        </p>
        <blockquote className="legal-quote">
          Desactivar las cookies analíticas no afecta el funcionamiento de la plataforma ni
          la prestación de los servicios contratados.
        </blockquote>
      </>
    ),
  },
  {
    title: 'Cambios en esta política',
    content: (
      <>
        <p>
          Podemos actualizar esta política para reflejar cambios en nuestras prácticas o en la
          normativa aplicable. Te notificaremos por correo electrónico con al menos{' '}
          <strong>30 días de antelación</strong> ante cambios materiales.
        </p>
        <p>
          La versión vigente siempre estará disponible en esta página con su fecha de última
          actualización. El uso continuado de la plataforma tras la notificación implica
          aceptación de la nueva política.
        </p>
      </>
    ),
  },
]

function PoliticaPrivacidad() {
  const [activeIdx, setActiveIdx] = useState(0)

  useEffect(() => {
    const observers = []

    sections.forEach((_, i) => {
      const el = document.getElementById('privacy-' + i)
      if (!el) return

      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) setActiveIdx(i)
        },
        { threshold: 0.3 }
      )

      observer.observe(el)
      observers.push(observer)
    })

    return () => observers.forEach(o => o.disconnect())
  }, [])

  return (
    <>
      {/* ── HERO ── */}
      <section className="hero privacy-hero">
        <div className="container">
          <div className="privacy-hero__inner">
            <span className="hero__badge">Legal</span>
            <h1 className="hero__title">
              Política de<br />Privacidad
            </h1>
            <p className="hero__desc">
              Conoce cómo recopilamos, usamos y protegemos la información
              personal de ti y tu mascota.
            </p>
            <div className="privacy-hero__meta">
              <span className="privacy-hero__meta-item">
                <i className="fa-solid fa-calendar-days" style={{ marginRight: '0.3rem' }}></i>
                Última actualización: 1 de enero de 2026
              </span>
              <span className="privacy-hero__meta-item">
                <i className="fa-solid fa-file-lines" style={{ marginRight: '0.3rem' }}></i>
                Versión 2.1
              </span>
              <span className="privacy-hero__meta-item">
                <i className="fa-solid fa-globe" style={{ marginRight: '0.3rem' }}></i>
                Aplica en Colombia
              </span>
            </div>

          </div>
        </div>
      </section>

      {/* ── BODY ── */}
      <section className="legal-body">
        <div className="container legal-body__inner">

          <aside className="legal-toc">
            <div className="legal-toc__heading">Contenido</div>
            {sections.map((s, i) => (
              <a
                key={i}
                href={'#privacy-' + i}
                className={'legal-toc__link' + (activeIdx === i ? ' legal-toc__link--active' : '')}
                onClick={() => setActiveIdx(i)}
              >
                {i + 1}. {s.title}
              </a>
            ))}
          </aside>

          <div className="legal-sections">
            {sections.map((s, i) => (
              <div key={i} id={'privacy-' + i} className="legal-section-card">
                <h2 className="legal-section-card__title">
                  <span className="legal-section-card__num">{i + 1}</span>
                  {s.title}
                </h2>
                {s.content}
              </div>
            ))}
          </div>

        </div>
      </section>
    </>
  )
}

export default PoliticaPrivacidad