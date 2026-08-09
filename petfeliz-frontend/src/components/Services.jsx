import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import ServiceCard from './ServiceCard'

const cards = [
  {
    icon: "fa-solid fa-briefcase-medical",
    iconVariant: 'green',
    title: 'Chequeos de rutina',
    description: 'Atención preventiva adaptada a la edad, raza y estilo de vida de tu mascota.',
    linkText: 'Saber más →',
    linkVariant: 'green',
  },
  {
    icon: "fa-solid fa-hospital",
    iconVariant: 'blue',
    title: 'Emergencias 24/7',
    description: 'Siempre disponibles. Nuestra unidad de cuidados críticos está preparada.',
    linkText: 'Ver instalaciones →',
    linkVariant: 'blue',
  },
  {
    icon: "fa-solid fa-microscope",
    iconVariant: 'yellow',
    title: 'Cirugía avanzada',
    description: 'Procedimientos quirúrgicos especializados en un entorno moderno y estéril.',
    linkText: 'Nuestros cirujanos →',
    linkVariant: 'yellow',
  },
]

function Services() {
  return (
    <section className="services" id="servicios">
      <div className="container">
        <div className="section-header">
          <h2>Servicios integrales</h2>
          <p>
            Combinamos tecnología médica de vanguardia con un enfoque humano y compasivo
            para mantener a tus mascotas felices.
          </p>
        </div>
        <div className="services__grid">
          {cards.map((card, i) => (
            <ServiceCard key={i} {...card} />
          ))}
        </div>
      </div>
    </section>
  )
}

export default Services