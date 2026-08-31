import { useState } from 'react'
import { Link } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import Hero from '../Hero'
import CtaBanner from '../CtaBanner'
import './Servicios.css'
import {
  faStethoscope, faSyringe, faHeartPulse,
  faMicroscope, faTooth, faBone, faShieldHeart,
  faArrowRight, faStar, faCheckCircle, faPaw,
  faTableCells, faShieldVirus
} from '@fortawesome/free-solid-svg-icons'

const services = [
  {
    id: 1,
    icon: faStethoscope,
    category: 'clinico',
    name: 'Consulta general',
    desc: 'Evaluación integral del estado de salud de tu mascota con diagnóstico y plan de tratamiento personalizado.',
    colorClass: 'svc-green',
    priceAfiliado: '3 gratis por mes',
    precioNormal: '$70.000',
    incluido: true,
    precioAprox: false,
  },
  {
    id: 2,
    icon: faSyringe,
    category: 'preventivo',
    name: 'Vacunación',
    desc: 'Esquema completo de vacunas para perros y gatos según edad, raza y estilo de vida.',
    colorClass: 'svc-blue',
    priceAfiliado: 'Desde $20.000',
    precioNormal: 'Desde $75.000',
    incluido: true,
    precioAprox: true,
  },
  {
    id: 4,
    icon: faHeartPulse,
    category: 'clinico',
    name: 'Urgencias',
    desc: 'Atención de emergencias veterinarias con equipo médico disponible para estabilizar y tratar a tu mascota.',
    colorClass: 'svc-red',
    priceAfiliado: '$50.000',
    precioNormal: '$120.000',
    incluido: false,
    precioAprox: false,
  },
  {
    id: 5,
    icon: faMicroscope,
    category: 'clinico',
    name: 'Laboratorio clínico',
    desc: 'Análisis de sangre, orina y otros fluidos para diagnóstico preciso de enfermedades internas.',
    colorClass: 'svc-yellow',
    priceAfiliado: '$45.000',
    precioNormal: '$110.000',
    incluido: false,
    precioAprox: false,
  },
  {
    id: 6,
    icon: faTooth,
    category: 'clinico',
    name: 'Odontología',
    desc: 'Limpieza dental profesional, extracciones y tratamiento de enfermedades periodonales bajo sedación controlada.',
    colorClass: 'svc-purple',
    priceAfiliado: '$80.000',
    precioNormal: '$180.000',
    incluido: false,
    precioAprox: false,
  },
  {
    id: 7,
    icon: faBone,
    category: 'clinico',
    name: 'Cirugía',
    desc: 'Procedimientos quirúrgicos con anestesia, monitoreo constante y seguimiento postoperatorio completo.',
    colorClass: 'svc-orange',
    priceAfiliado: 'Desde $200.000',
    precioNormal: 'Desde $450.000',
    incluido: false,
    precioAprox: true,
  },
  {
    id: 8,
    icon: faShieldHeart,
    category: 'preventivo',
    name: 'Desparasitación',
    desc: 'Tratamiento interno y externo contra parásitos adaptado al peso, edad y hábitos de tu mascota.',
    colorClass: 'svc-green',
    priceAfiliado: 'Desde $20.000',
    precioNormal: 'Desde $55.000',
    incluido: true,
    precioAprox: true,
  },
]

const filters = [
  { key: 'todos',      label: 'Todos',      icon: faTableCells,  colorClass: 'filter-todos' },
  { key: 'clinico',    label: 'Clínico',    icon: faStethoscope, colorClass: 'filter-clinico' },
  { key: 'preventivo', label: 'Preventivo', icon: faShieldVirus,  colorClass: 'filter-preventivo' },
]

export default function Servicios() {
  const [activeFilter, setActiveFilter] = useState('todos')

  const filtered = activeFilter === 'todos'
    ? services
    : services.filter(s => s.category === activeFilter)

  return (
    <>
      <Hero
        centered
        badgeIcon={faPaw}
        badge="Nuestros servicios"
        title="Cuidado experto para"
        accent="tu mejor amigo"
        desc="Atención veterinaria experta. Los afiliados a nuestros planes EPS disfrutan de descuentos y consultas incluidas cada mes."
      />

      <section className="svc-main">
        <div className="container">

          <div className="svc-pricing-banner">
            <div className="svc-pricing-banner__item svc-pricing-banner__item--afiliado">
              <span className="svc-pricing-banner__eyebrow">
                <FontAwesomeIcon icon={faCheckCircle} className="svc-pricing-banner__eyebrow-icon" />
                Con plan EPS activo
              </span>
              <span className="svc-pricing-banner__label">Precio afiliado</span>
              <p className="svc-pricing-banner__desc">Descuentos exclusivos y consultas incluidas cada mes</p>
            </div>
            <div className="svc-pricing-banner__item svc-pricing-banner__item--particular">
              <span className="svc-pricing-banner__eyebrow">
                <FontAwesomeIcon icon={faStar} className="svc-pricing-banner__eyebrow-icon" />
                Sin plan activo
              </span>
              <span className="svc-pricing-banner__label">Precio particular</span>
              <p className="svc-pricing-banner__desc">Pago directo por servicio, sin ningún compromiso</p>
            </div>
            <div className="svc-pricing-banner__cta-wrap">
              <Link to="/planes" className="btn btn-primary svc-pricing-banner__cta">
                Ver planes EPS
              </Link>
            </div>
          </div>

          <div className="svc-filters">
            {filters.map(f => (
              <button
                key={f.key}
                className={`svc-filter-btn ${f.colorClass}${activeFilter === f.key ? ' active' : ''}`}
                onClick={() => setActiveFilter(f.key)}
              >
                <FontAwesomeIcon icon={f.icon} className="svc-filter-btn__icon" />
                {f.label}
              </button>
            ))}
          </div>

          <div className="svc-grid">
            {filtered.map(svc => (
              <div key={svc.id} className="svc-card">
                <div className="svc-card__top">
                  <div className={`svc-card__icon ${svc.colorClass}`}>
                    <FontAwesomeIcon icon={svc.icon} />
                  </div>
                  {svc.incluido && (
                    <span className="svc-card__badge">
                      <FontAwesomeIcon icon={faCheckCircle} className="svc-card__badge-icon" />
                      Incluido en plan
                    </span>
                  )}
                </div>
                <h3 className="svc-card__name">{svc.name}</h3>
                <p className="svc-card__desc">{svc.desc}</p>
                <div className="svc-card__prices">
                  <div className="svc-card__price svc-card__price--afiliado">
                    <span className="svc-card__price-label">Afiliado</span>
                    <span className="svc-card__price-value">{svc.priceAfiliado}</span>
                  </div>
                  <div className="svc-card__price svc-card__price--normal">
                    <span className="svc-card__price-label">Particular</span>
                    <span className="svc-card__price-value">{svc.precioNormal}</span>
                  </div>
                </div>
                {svc.precioAprox && (
                  <p className="svc-card__price-note">
                    * El precio varía según el medicamento utilizado.
                  </p>
                )}
                <Link to="/login" className="svc-card__link">
                  Agendar cita <FontAwesomeIcon icon={faArrowRight} />
                </Link>
              </div>
            ))}
          </div>

        </div>
      </section>

      <CtaBanner
        title="¿Aún no tienes un plan EPS?"
        subtitle="Afíliate hoy y accede a precios preferenciales, consultas mensuales incluidas y atención prioritaria para tu mascota."
        buttons={[
          { label: 'Ver planes disponibles', href: '/planes', variant: 'btn-primary' },
          { label: 'Contáctanos',            href: '/contacto', variant: 'btn-outline-white' },
        ]}
      />
    </>
  )
}