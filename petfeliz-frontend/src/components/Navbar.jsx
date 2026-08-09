import { Link, useLocation } from 'react-router-dom'

function Navbar() {
  const { pathname } = useLocation()

  return (
    <header className="navbar">
      <div className="container navbar__inner">
        <Link to="/" className="navbar__logo">
          <i className="fa-solid fa-paw" style={{ marginRight: '0.45rem', color: '#10b981' }}></i>
          EPS PetFeliz
        </Link>

        <nav className="navbar__links">
          <Link to="/"          className={pathname === '/'          ? 'active' : ''}>Inicio</Link>
          <Link to="/servicios" className={pathname === '/servicios' ? 'active' : ''}>Servicios</Link>
          <Link to="/nosotros"  className={pathname === '/nosotros'  ? 'active' : ''}>Nosotros</Link>
          <Link to="/planes"    className={pathname === '/planes'    ? 'active' : ''}>Planes</Link>
          <Link to="/contacto"  className={pathname === '/contacto'  ? 'active' : ''}>Contacto</Link>
        </nav>
        <div className="navbar__actions">
          <Link to="/login" className="link-login">Iniciar sesión</Link>
          <Link to="/register" className="btn btn-primary btn-register">Regístrate</Link>
        </div>
        <button className="navbar__hamburger" aria-label="Menú">
          <span></span><span></span><span></span>
        </button>
      </div>
    </header>
  )
}

export default Navbar