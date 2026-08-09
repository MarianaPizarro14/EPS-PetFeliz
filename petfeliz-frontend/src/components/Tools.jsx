import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

const features = [
  {
    icon: "fa-solid fa-file-medical",
    title: 'Historiales médicos digitales',
    description: 'Acceso inmediato al historial de vacunación, resultados de exámenes y recetas desde tu celular.',
  },
  {
    icon: "fa-regular fa-calendar-check",
    title: 'Agendamiento sin fricción',
    description: 'Olvídate de las esperas. Agenda citas con tu especialista preferido en menos de 30 segundos.',
  },
  {
    icon: "fa-regular fa-message",
    title: 'Chat veterinario personalizado',
    description: 'Haz consultas rápidas a nuestros técnicos certificados en cualquier momento, día o noche.',
  },
]

function Tools() {
  return (
    <section className="tools">
      <div className="container">
        <div className="tools__inner">
          <div className="tools__mockup-wrap">
            <img src="/img/card_mascota.png" alt="App PetFeliz" className="tools__mockup-img" />
          </div>
          <div className="tools__content">
            <h2>
              Herramientas modernas<br />
              para <span className="text-accent">dueños de mascotas<br />modernos.</span>
            </h2>
            <div className="feature-list">
              {features.map((f, i) => (
                <div className="feature-item" key={i}>
                  <div className="feature-item__icon">
                    <FontAwesomeIcon icon={f.icon} />
                  </div>
                  <div className="feature-item__text">
                    <h4>{f.title}</h4>
                    <p>{f.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Tools