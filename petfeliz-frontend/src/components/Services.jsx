import { useState } from 'react'
import ServiceCard from './ServiceCard'
import ServicioModal from './ServicioModal'

const cards = [
  {
    id: 'chequeos',
    icon: "fa-solid fa-briefcase-medical",
    iconVariant: 'green',
    title: 'Chequeos de rutina',
    description: 'Atención preventiva adaptada a la edad, raza y estilo de vida de tu mascota.',
    detalle: 'Realizamos exámenes físicos completos, control de peso, vacunación y desparasitación según la edad y raza de tu mascota. Ideal para detectar a tiempo cualquier cambio en su salud y mantener su bienestar general.',
    linkText: 'Saber más →',
    linkVariant: 'green',
  },
  {
    id: 'emergencias',
    icon: "fa-solid fa-hospital",
    iconVariant: 'blue',
    title: 'Emergencias 24/7',
    description: 'Siempre disponibles. Nuestra unidad de cuidados críticos está preparada.',
    detalle: 'Contamos con una unidad de cuidados críticos disponible en todo momento, equipada para atender urgencias como traumatismos, intoxicaciones o complicaciones repentinas. Nuestro equipo está listo para responder de inmediato.',
    linkText: 'Ver instalaciones →',
    linkVariant: 'blue',
  },
  {
    id: 'cirugia',
    icon: "fa-solid fa-microscope",
    iconVariant: 'yellow',
    title: 'Cirugía avanzada',
    description: 'Procedimientos quirúrgicos especializados en un entorno moderno y estéril.',
    detalle: 'Ofrecemos procedimientos quirúrgicos especializados (esterilizaciones, cirugías de tejidos blandos, ortopédicas, entre otras) en quirófanos modernos y con protocolos estrictos de esterilidad, garantizando la seguridad de tu mascota.',
    linkText: 'Nuestros cirujanos →',
    linkVariant: 'yellow',
  },
]

function Services() {
  const [modalServicio, setModalServicio] = useState(null)

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
          {cards.map((card) => (
            <ServiceCard
              key={card.id}
              {...card}
              onOpenModal={() => setModalServicio(card)}
            />
          ))}
        </div>
      </div>

      {/* MODAL REUTILIZABLE */}
      {modalServicio && (
        <ServicioModal
          servicio={modalServicio}
          onClose={() => setModalServicio(null)}
        />
      )}
    </section>
  )
}

export default Services