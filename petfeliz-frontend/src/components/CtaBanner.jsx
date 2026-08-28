import { Link } from 'react-router-dom'

function CtaBanner({
  title    = '¿Listo para priorizar su felicidad?',
  subtitle = 'Únete a miles de dueños de mascotas que ya mejoraron su experiencia con PetFeliz.',
  variant  = 'default',
  buttons  = [
    { label: 'Únete ahora',  href: '/register', variant: 'btn-primary'       },
    { label: 'Ver precios',  href: '/planes',    variant: 'btn-outline-white'  },
  ],
}) {
  return (
    <section className={`cta-banner cta-banner--${variant}`}>
      <div className="container">
        <div className="cta-banner__box">
          <h2>{title}</h2>
          <p>{subtitle}</p>
          <div className="cta-banner__actions">
            {buttons.map((btn, i) => {
              const isExternal = btn.href?.startsWith('http') || btn.href?.startsWith('mailto:') || btn.href?.startsWith('tel:')

              if (isExternal) {
                return (
                  <a
                    key={i}
                    href={btn.href}
                    className={`btn ${btn.variant}`}
                    target={btn.target}
                    rel={btn.rel}
                  >
                    {btn.label}
                  </a>
                )
              }

              return (
                <Link
                  key={i}
                  to={btn.href}
                  className={`btn ${btn.variant}`}
                >
                  {btn.label}
                </Link>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}

export default CtaBanner