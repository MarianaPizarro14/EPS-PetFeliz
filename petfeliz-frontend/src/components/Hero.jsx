import { useState, useEffect } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

function Hero({
  badge, badgeIcon, title, titlePrefix, accent, titleSuffix, desc, ctas,
  image, imageAlt, centered,
  slides, interval = 7000
}) {

  const usingSlides = Array.isArray(slides) && slides.length > 0
  const [activeIndex, setActiveIndex] = useState(0)

  useEffect(() => {
    if (!usingSlides || slides.length < 2) return
    const timer = setInterval(() => {
      setActiveIndex(prev => (prev + 1) % slides.length)
    }, interval)
    return () => clearInterval(timer)
  }, [usingSlides, slides, interval])

  const goTo = (index) => {
    if (!usingSlides) return
    const total = slides.length
    setActiveIndex(((index % total) + total) % total)
  }

  const goPrev = () => goTo(activeIndex - 1)
  const goNext = () => goTo(activeIndex + 1)

  const current = usingSlides
    ? slides[activeIndex]
    : { title, titlePrefix, accent, titleSuffix, desc, badge, badgeIcon, image, imageAlt, ctas }

  if (centered) {
    return (
      <section className="planes-hero">
        <div className="container">
          {(badge || badgeIcon) && (
            <span className="planes-hero__eyebrow">
              {badgeIcon && <FontAwesomeIcon icon={badgeIcon} />}
              {badge}
            </span>
          )}
          <h1 className="planes-hero__title">
            {title}
            {accent && (
              <>
                <br />
                <span className="highlight">{accent}</span>
              </>
            )}
          </h1>
          {desc && <p className="planes-hero__sub">{desc}</p>}
          {ctas && <div className="planes-hero__ctas">{ctas}</div>}
        </div>
      </section>
    )
  }

  return (
    <section className="hero">
      {usingSlides && slides.length > 1 && (
        <button className="hero__arrow hero__arrow--prev" onClick={goPrev} aria-label="Anterior">
          <FontAwesomeIcon icon="fa-solid fa-chevron-left" />
        </button>
      )}
      {usingSlides && slides.length > 1 && (
        <button className="hero__arrow hero__arrow--next" onClick={goNext} aria-label="Siguiente">
          <FontAwesomeIcon icon="fa-solid fa-chevron-right" />
        </button>
      )}

      <div className="container">
        <div className="hero__inner">
          <div className="hero__text" key={usingSlides ? activeIndex : 'static'}>
            {(current.badge || current.badgeIcon) && (
              <div className="hero__badge">
                {current.badgeIcon && <FontAwesomeIcon icon={current.badgeIcon} />}
                {current.badge}
              </div>
            )}
            <h1 className="hero__title">
              {current.title}
              {current.accent && (
                <>
                  <br />
                  {current.titlePrefix && `${current.titlePrefix} `}
                  <span className="text-accent">{current.accent}</span>
                  {current.titleSuffix && ` ${current.titleSuffix}`}
                </>
              )}
            </h1>
            {current.desc && <p className="hero__desc">{current.desc}</p>}
            {current.ctas && <div className="hero__ctas">{current.ctas}</div>}
          </div>

          {current.image && (
            <div className="hero__image-wrap">
              <img
                key={current.image}
                className="hero__image hero__image--fade"
                src={current.image}
                alt={current.imageAlt || ''}
              />
            </div>
          )}
        </div>

        {usingSlides && slides.length > 1 && (
          <div className="hero__dots">
            {slides.map((_, i) => (
              <button
                key={i}
                className={`hero__dot ${i === activeIndex ? 'active' : ''}`}
                onClick={() => goTo(i)}
                aria-label={`Ir a la diapositiva ${i + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

export default Hero