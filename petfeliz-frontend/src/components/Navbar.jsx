import React, { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'

function Navbar() {
  const { pathname } = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)

  // Cerrar menú al cambiar de ruta
  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  // Cerrar con Escape y bloquear scroll de fondo cuando esté abierto en móviles
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setMobileOpen(false)
    }
    window.addEventListener('keydown', handleKeyDown)
    if (mobileOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [mobileOpen])

  return (
    <header className="navbar">
      <div className="container navbar__inner">
        <Link to="/" className="navbar__logo" onClick={() => setMobileOpen(false)}>
          EPS PetFeliz
        </Link>

        {/* Navegación de escritorio */}
        <nav className="navbar__links" aria-label="Navegación principal">
          <Link to="/" className={pathname === '/' ? 'active' : ''}>Inicio</Link>
          <Link to="/servicios" className={pathname === '/servicios' ? 'active' : ''}>Servicios</Link>
          <Link to="/nosotros" className={pathname === '/nosotros' ? 'active' : ''}>Nosotros</Link>
          <Link to="/planes" className={pathname === '/planes' ? 'active' : ''}>Planes</Link>
          <Link to="/contacto" className={pathname === '/contacto' ? 'active' : ''}>Contacto</Link>
        </nav>

        {/* Acciones de escritorio */}
        <div className="navbar__actions">
          <Link to="/login" className="link-login">Iniciar sesión</Link>
          <Link to="/register" className="btn btn-primary btn-register">Regístrate</Link>
        </div>

        {/* Botón hamburguesa accesible para móvil / tablet */}
        <button
          type="button"
          className={`navbar__hamburger ${mobileOpen ? 'is-active' : ''}`}
          aria-label={mobileOpen ? 'Cerrar menú' : 'Abrir menú'}
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
      </div>

      {/* Menú desplegable móvil */}
      {mobileOpen && (
        <div className="navbar__mobile-backdrop" onClick={() => setMobileOpen(false)}>
          <div className="navbar__mobile-menu" onClick={(e) => e.stopPropagation()}>
            <nav className="navbar__mobile-links">
              <Link to="/" className={pathname === '/' ? 'active' : ''}>
                <i className="fa-solid fa-house"></i>
                <span>Inicio</span>
              </Link>
              <Link to="/servicios" className={pathname === '/servicios' ? 'active' : ''}>
                <i className="fa-solid fa-stethoscope"></i>
                <span>Servicios</span>
              </Link>
              <Link to="/nosotros" className={pathname === '/nosotros' ? 'active' : ''}>
                <i className="fa-solid fa-users"></i>
                <span>Nosotros</span>
              </Link>
              <Link to="/planes" className={pathname === '/planes' ? 'active' : ''}>
                <i className="fa-solid fa-shield-heart"></i>
                <span>Planes</span>
              </Link>
              <Link to="/contacto" className={pathname === '/contacto' ? 'active' : ''}>
                <i className="fa-solid fa-envelope"></i>
                <span>Contacto</span>
              </Link>
            </nav>

            <div className="navbar__mobile-actions">
              <Link to="/login" className="btn btn-ghost btn-mobile-login">
                <i className="fa-solid fa-arrow-right-to-bracket"></i>
                <span>Iniciar sesión</span>
              </Link>
              <Link to="/register" className="btn btn-primary btn-mobile-register">
                <i className="fa-solid fa-user-plus"></i>
                <span>Regístrate</span>
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}

export default Navbar