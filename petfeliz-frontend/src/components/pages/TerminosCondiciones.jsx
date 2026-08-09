import { useState, useEffect, useRef } from 'react'
import './TerminosCondiciones.css'

const sections = [
  {
    title: 'Aceptación de los términos',
    content: (
      <>
        <p>
          Al contratar cualquier plan de <strong>EPS PetFeliz</strong>, registrarte en nuestra
          plataforma o usar nuestros servicios, aceptas estos Términos y Condiciones en su
          totalidad. Si no estás de acuerdo, debes abstenerte de usar el servicio.
        </p>
        <blockquote className="legal-quote">
          Estos términos constituyen un contrato legalmente vinculante entre tú y EPS PetFeliz Inc.,
          regido por las leyes de la República de Colombia (Ley 1480 de 2011 — Estatuto del Consumidor).
        </blockquote>
      </>
    ),
  },
  {
    title: 'Descripción del servicio',
    content: (
      <>
        <p>EPS PetFeliz ofrece planes de salud veterinaria integral que incluyen:</p>
        <ul className="legal-list">
          {[
            'Consultas de medicina general y especializada para perros, gatos y animales exóticos.',
            'Acceso a red de más de 200 especialistas veterinarios certificados en 3 ciudades.',
            'Atención de urgencias y emergencias 24/7 en clínicas aliadas del Área Metropolitana.',
            'Gestión digital del historial médico, vacunas y desparasitación de tu mascota.',
            'Cobertura de medicamentos formulados y procedimientos según el plan contratado.',
          ].map(item => (
            <li className="legal-list__item" key={item}>
              <span className="legal-list__bullet">•</span>
              <span className="legal-list__text">{item}</span>
            </li>
          ))}
        </ul>
      </>
    ),
  },
  {
    title: 'Elegibilidad y registro',
    content: (
      <>
        <p>Para afiliarte a EPS PetFeliz debes cumplir los siguientes requisitos:</p>
        <ul className="legal-list">
          {[
            'Ser mayor de 18 años y residente en Colombia con documento de identidad vigente.',
            'Ser propietario o responsable legal de la mascota a afiliar.',
            'Proporcionar datos verídicos, completos y actualizados en el formulario de registro.',
            'Aceptar expresamente estos Términos y la Política de Privacidad antes de completar la afiliación.',
          ].map(item => (
            <li className="legal-list__item" key={item}>
              <span className="legal-list__bullet">•</span>
              <span className="legal-list__text">{item}</span>
            </li>
          ))}
        </ul>
        <p>
          Eres responsable de mantener la confidencialidad de tus credenciales de acceso y de
          notificarnos de inmediato ante cualquier uso no autorizado escribiendo a{' '}
          <a href="mailto:petfelizeps@gmail.com" className="text-accent" style={{ fontWeight: 700 }}>
            petfelizeps@gmail.com
          </a>.
        </p>
      </>
    ),
  },
  {
    title: 'Planes, precios y pagos',
    content: (
      <>
        <p>
          Los planes se contratan de forma mensual. Los precios vigentes están publicados en{' '}
          <strong>petfeliz.com.co/planes</strong> y pueden ser actualizados con previo aviso de
          30 días calendario por correo electrónico.
        </p>
        <ul className="legal-list">
          {[
            'Aceptamos tarjetas débito/crédito Visa y Mastercard, PSE y transferencias bancarias.',
            'Las facturas electrónicas se envían al correo registrado dentro de las 24 horas siguientes al pago.',
            'Todos los precios están expresados en pesos colombianos (COP) con IVA incluido.',
          ].map(item => (
            <li className="legal-list__item" key={item}>
              <span className="legal-list__bullet">•</span>
              <span className="legal-list__text">{item}</span>
            </li>
          ))}
        </ul>
      </>
    ),
  },
  {
    title: 'Cancelaciones y reembolsos',
    content: (
      <>
        <p>
          Puedes cancelar tu plan en cualquier momento desde la app o escribiendo a{' '}
          <a href="mailto:petfelizeps@gmail.com" className="text-accent" style={{ fontWeight: 700 }}>
            petfelizeps@gmail.com
          </a>. La cancelación tendrá efecto al final del período de facturación vigente, sin cobros adicionales.
        </p>
        <p>
          Aplicamos reembolso proporcional únicamente cuando la cancelación se produce dentro
          de los <strong>primeros 5 días hábiles</strong> del período contratado y no se ha
          utilizado ningún servicio.
        </p>
        <blockquote className="legal-quote">
          En caso de fallecimiento de la mascota afiliada, tramitamos la cancelación inmediata
          y el reembolso proporcional de los días no utilizados, previa presentación del
          certificado veterinario correspondiente.
        </blockquote>
      </>
    ),
  },
  {
    title: 'Cobertura y exclusiones',
    content: (
      <>
        <p>
          La cobertura específica del plan está detallada en el Reglamento de Servicios
          disponible en nuestra web. De manera general, están excluidos de todos los planes:
        </p>
        <ul className="legal-list">
          {[
            'Condiciones preexistentes diagnosticadas antes de la fecha de afiliación.',
            'Enfermedades o lesiones derivadas de negligencia, maltrato o accidentes provocados.',
            'Medicamentos no prescritos por veterinarios de la red PetFeliz.',
            'Tratamientos experimentales sin aval científico reconocido por el gremio veterinario.',
            'Reproducción, fertilidad asistida y procedimientos relacionados con la cría.',
          ].map(item => (
            <li className="legal-list__item" key={item}>
              <span className="legal-list__bullet">•</span>
              <span className="legal-list__text">{item}</span>
            </li>
          ))}
        </ul>
      </>
    ),
  },
  {
    title: 'Período de carencia',
    content: (
      <>
        <p>Al momento de la afiliación aplican los siguientes períodos de carencia:</p>
        <ul className="legal-list">
          {[
            'Consulta de medicina general: sin carencia, disponible desde el primer día.',
            'Urgencias y emergencias: 3 días calendario desde la fecha de afiliación.',
            'Cirugías programadas: 30 días calendario desde la fecha de afiliación.',
            'Especialidades (dermatología, cardiología, oncología): 15 días calendario.',
          ].map(item => (
            <li className="legal-list__item" key={item}>
              <span className="legal-list__bullet">•</span>
              <span className="legal-list__text">{item}</span>
            </li>
          ))}
        </ul>
        <blockquote className="legal-quote">
          Los períodos de carencia se eliminan si el usuario traslada su afiliación desde otra
          entidad veterinaria reconocida, previa verificación de historial de afiliación continua.
        </blockquote>
      </>
    ),
  },
  {
    title: 'Responsabilidades y limitaciones',
    content: (
      <>
        <p>
          EPS PetFeliz actúa como aseguradora y coordinadora de servicios veterinarios.
          La responsabilidad médica directa recae en los profesionales veterinarios que
          prestan el servicio en cada clínica aliada.
        </p>
        <p>
          Nuestra responsabilidad máxima frente a cualquier reclamación económica se limita al
          valor de las cuotas pagadas por el usuario en los últimos 12 meses. No somos responsables
          por daños indirectos, lucro cesante, daño emergente ni perjuicios derivados de fuerza mayor.
        </p>
        <p>
          EPS PetFeliz no garantiza disponibilidad ininterrumpida de la plataforma digital y se
          reserva el derecho de realizar mantenimientos programados con previo aviso de 24 horas.
        </p>
      </>
    ),
  },
  {
    title: 'Propiedad intelectual',
    content: (
      <>
        <p>
          Todos los contenidos de la plataforma EPS PetFeliz incluyendo marca, logotipos,
          textos, imágenes, ilustraciones, código fuente y software son propiedad de EPS PetFeliz Inc.
          o de sus licenciantes y están protegidos por la Ley 23 de 1982 y normativa internacional
          de propiedad intelectual.
        </p>
        <p>
          Queda expresamente prohibida la reproducción, distribución, modificación o uso comercial
          de cualquier contenido sin autorización escrita previa de EPS PetFeliz Inc.
        </p>
      </>
    ),
  },
  {
    title: 'Resolución de disputas',
    content: (
      <>
        <p>
          Ante cualquier conflicto derivado de estos términos, las partes se comprometen a
          intentar una resolución amistosa en un plazo de <strong>30 días calendario</strong>{' '}
          mediante comunicación directa a{' '}
          <a href="mailto:petfelizeps@gmail.com" className="text-accent" style={{ fontWeight: 700 }}>
            petfelizeps@gmail.com
          </a>.
        </p>
        <p>
          De no lograrse acuerdo, las controversias se someterán a la jurisdicción de los
          jueces civiles del Circuito de Medellín, Colombia.
        </p>
        <blockquote className="legal-quote">
          Como consumidor también puedes presentar tu reclamación ante la Superintendencia de
          Industria y Comercio (SIC) a través de www.sic.gov.co o llamando al 601 592 0400.
        </blockquote>
      </>
    ),
  },
  {
    title: 'Modificaciones a los términos',
    content: (
      <p>
        Podemos modificar estos términos en cualquier momento para reflejar cambios en nuestros
        servicios o en la normativa aplicable. Notificaremos los cambios materiales por correo
        electrónico con al menos <strong>15 días de anticipación</strong>. El uso continuado
        del servicio tras la notificación implica aceptación de los nuevos términos. Si no estás
        de acuerdo con los cambios, puedes cancelar tu plan sin penalización dentro de los 15 días
        siguientes a la notificación.
      </p>
    ),
  },
]

function TerminosCondiciones() {
  const [activeIdx, setActiveIdx] = useState(0)
  const sectionRefs = useRef([])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const idx = sectionRefs.current.indexOf(entry.target)
            if (idx !== -1) setActiveIdx(idx)
          }
        })
      },
      {
        threshold: 0,
        rootMargin: '-30% 0px -65% 0px',
      }
    )

    sectionRefs.current.forEach((el) => {
      if (el) observer.observe(el)
    })

    return () => observer.disconnect()
  }, [])

  return (
    <>
      {/* ── HERO ── */}
      <section className="hero terms-hero">
        <div className="container">
          <div className="terms-hero__inner">
            <span className="hero__badge">Legal</span>
            <h1 className="hero__title">Términos y<br />Condiciones</h1>
            <p className="hero__desc">
              Conoce las reglas que rigen el uso de nuestros servicios de salud veterinaria.
            </p>
            <div className="terms-hero__meta">
              <span className="terms-hero__meta-item">
                <i className="fa-solid fa-calendar-days" style={{ marginRight: '0.3rem' }}></i>
                Última actualización: 1 de enero de 2026
              </span>
              <span className="terms-hero__meta-item">
                <i className="fa-solid fa-file-lines" style={{ marginRight: '0.3rem' }}></i>
                Versión 3.0
              </span>
              <span className="terms-hero__meta-item">
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
            <div className="legal-toc__heading">Secciones</div>
            {sections.map((s, i) => (
              <a
                key={i}
                href={'#terms-' + i}
                className={'legal-toc__link' + (activeIdx === i ? ' legal-toc__link--active' : '')}
              >
                {i + 1}. {s.title}
              </a>
            ))}
          </aside>

          <div className="legal-sections">
            {sections.map((s, i) => (
              <div
                key={i}
                id={'terms-' + i}
                className="legal-section-card"
                ref={(el) => (sectionRefs.current[i] = el)}
              >
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

export default TerminosCondiciones