function CtaBanner({
  title    = '¿Listo para priorizar su felicidad?',
  subtitle = 'Únete a miles de dueños de mascotas que ya mejoraron su experiencia con PetFeliz.',
  variant  = 'default',
  buttons  = [
    { label: 'Únete ahora',  href: '#', variant: 'btn-primary'       },
    { label: 'Ver precios',  href: '#', variant: 'btn-outline-white'  },
  ],
}) {
  return (
    <section className={`cta-banner cta-banner--${variant}`}>
      <div className="container">
        <div className="cta-banner__box">
          <h2>{title}</h2>
          <p>{subtitle}</p>
          <div className="cta-banner__actions">
            {buttons.map((btn, i) => (
              <a key={i} href={btn.href} className={`btn ${btn.variant}`}>
                {btn.label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

export default CtaBanner