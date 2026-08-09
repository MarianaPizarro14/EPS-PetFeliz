import { Link } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faUserDoctor,
  faHandSparkles,
  faKitMedical,
  faShieldVirus,
  faSyringe,
  faStar,
  faScissors,
  faTooth,
  faStethoscope,
  faChevronRight
} from '@fortawesome/free-solid-svg-icons'
import './RedEspecialistas.css'
import CtaBanner from '../CtaBanner'

const especialidades = [
  {
    title: 'Médico General',
    filtro: 'Médico General',
    count: 5,
    desc: 'Atención primaria, chequeos preventivos y seguimiento de salud integral.',
    colorClass: 'esp-teal',
    icon: faUserDoctor
  },
  {
    title: 'Dermatólogo',
    filtro: 'Dermatólogo',
    count: 2,
    desc: 'Tratamiento de alergias, infecciones de piel y problemas de pelaje.',
    colorClass: 'esp-purple',
    icon: faHandSparkles
  },
  {
    title: 'Urgencias',
    filtro: 'Urgencias',
    count: 3,
    desc: 'Atención de emergencias críticas y estabilización de pacientes, 24/7.',
    colorClass: 'esp-red',
    icon: faKitMedical
  },
  {
    title: 'Desparasitación',
    filtro: 'Desparasitación',
    count: 3,
    desc: 'Programas de desparasitación interna y externa para toda la familia.',
    colorClass: 'esp-green',
    icon: faShieldVirus
  },
  {
    title: 'Vacunación',
    filtro: 'Vacunación',
    count: 2,
    desc: 'Esquemas de vacunación completos para perros, gatos y exóticos.',
    colorClass: 'esp-blue',
    icon: faSyringe
  },
  {
    title: 'Médico Director',
    filtro: 'Médico Director',
    count: 3,
    desc: 'Dirección médica general y de sede, con seguimiento clínico integral.',
    colorClass: 'esp-yellow',
    icon: faStar
  },
  {
    title: 'Cirugía',
    filtro: 'Cirugía',
    count: 3,
    desc: 'Cirugía de tejidos blandos, ortopedia y procedimientos especializados.',
    colorClass: 'esp-orange',
    icon: faScissors
  },
  {
    title: 'Odontología',
    filtro: 'Odontología',
    count: 1,
    desc: 'Salud bucal y tratamiento de enfermedades dentales en mascotas.',
    colorClass: 'esp-indigo',
    icon: faTooth
  },
]

const totalEspecialistas = especialidades.reduce((sum, e) => sum + e.count, 0)

function RedEspecialistas() {
  return (
    <>
      {/* PAGE HERO */}
      <section className="red-hero">
        <div className="red-hero__inner">
          <div className="hero__badge">
            <FontAwesomeIcon icon={faStethoscope} />
            Red de especialistas
          </div>
          <h1 className="hero__title">
            Una especialidad para <span className="text-accent">cada necesidad</span>
          </h1>
          <p className="hero__desc">
            {totalEspecialistas} especialistas distribuidos en nuestras 3 sedes propias —
            Laureles, Envigado y Bello — listos para atender a tu mascota.
          </p>
        </div>
      </section>

      {/* LISTA DE ESPECIALIDADES */}
      <section className="especialidades-list-section">
        <div className="container">
          <ul className="especialidades-list">
            {especialidades.map((esp) => (
              <li key={esp.title}>
                <Link
                  to="/nosotros"
                  state={{ filtro: esp.filtro }}
                  className="especialidades-list__item"
                >
                  <span className={`especialidades-list__icon ${esp.colorClass}`}>
                    <FontAwesomeIcon icon={esp.icon} />
                  </span>
                  <div className="especialidades-list__text">
                    <h3>{esp.title}</h3>
                    <p>{esp.desc}</p>
                  </div>
                  <span className="especialidades-list__count">
                    {esp.count} especialista{esp.count > 1 ? 's' : ''}
                  </span>
                  <FontAwesomeIcon icon={faChevronRight} className="especialidades-list__arrow" />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <CtaBanner />
    </>
  )
}

export default RedEspecialistas