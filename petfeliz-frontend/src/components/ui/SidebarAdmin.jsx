// src/components/ui/SidebarAdmin.jsx
import React from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { getStoredToken, clearStoredAuth } from '../../utils/authStorage'
import AdminCriticalAlert from './AdminCriticalAlert'

const adminMenuItems = [
  { to: '/admin/dashboard', aliases: [], label: 'Panel', icon: 'fa-solid fa-border-all' },
  { to: '/admin/citas', aliases: [], label: 'Citas', icon: 'fa-regular fa-calendar-days' },
  { to: '/admin/veterinarios', aliases: [], label: 'Veterinarios', icon: 'fa-solid fa-user-doctor' },
  { to: '/admin/recepcionistas', aliases: [], label: 'Recepcionistas', icon: 'fa-solid fa-id-card' },
  { to: '/admin/servicios', aliases: [], label: 'Servicios', icon: 'fa-solid fa-stethoscope' },
  { to: '/admin/clientes', aliases: [], label: 'Clientes', icon: 'fa-solid fa-users' },
  { to: '/admin/mascotas', aliases: [], label: 'Mascotas', icon: 'fa-solid fa-paw' },
  { to: '/admin/pagos', aliases: [], label: 'Pagos y Facturación', icon: 'fa-regular fa-file-lines' },
  { to: '/admin/configuracion', aliases: [], label: 'Configuración', icon: 'fa-solid fa-gear' },
]

export default function SidebarAdmin() {
  const location = useLocation()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = React.useState(false)

  React.useEffect(() => {
    const handleToggle = () => setMobileOpen((prev) => !prev)
    const handleClose = () => setMobileOpen(false)

    window.addEventListener('toggle-mobile-sidebar', handleToggle)
    window.addEventListener('close-mobile-sidebar', handleClose)
    return () => {
      window.removeEventListener('toggle-mobile-sidebar', handleToggle)
      window.removeEventListener('close-mobile-sidebar', handleClose)
    }
  }, [])

  // Cerrar al cambiar de ruta
  React.useEffect(() => {
    setMobileOpen(false)
  }, [location.pathname])

  const handleLogout = async () => {
    const token = getStoredToken()
    if (token) {
      try {
        await fetch(`${import.meta.env.VITE_API_URL}/logout`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
          },
        })
      } catch (e) {
        console.error('Error al cerrar sesión de admin:', e)
      }
    }

    clearStoredAuth()
    navigate('/login')
  }

  const isItemActive = (item) => {
    if (location.pathname === item.to) return true
    if (item.aliases && item.aliases.includes(location.pathname)) return true
    return false
  }

  const isHelpActive = location.pathname === '/admin/soporte'

  return (
    <>
      <AdminCriticalAlert />
      {mobileOpen && (
        <div className="dash-side-backdrop" onClick={() => setMobileOpen(false)} />
      )}
      <aside className={`dash-side ${mobileOpen ? 'is-open' : ''}`}>
      <div>
        <div className="dash-side__logo">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <i className="fa-solid fa-shield-halved" style={{ color: '#059669', fontSize: '1.1rem' }}></i>
            <span className="dash-side__logo-title">EPS PetFeliz</span>
          </div>
          <span className="dash-side__logo-sub" style={{ color: '#059669', fontWeight: 700, marginTop: '6px', display: 'block' }}>
            PANEL DE ADMINISTRACIÓN
          </span>
        </div>

        <nav className="dash-side__nav">
          {adminMenuItems.map((item) => {
            const active = isItemActive(item)
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`dash-side__link ${active ? 'dash-side__link--active' : ''}`}
              >
                <i
                  className={item.icon}
                  style={{
                    fontSize: '0.95rem',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '18px',
                  }}
                ></i>
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>
      </div>

      <div className="dash-side__nav dash-side__nav--bottom">
        <button
          type="button"
          className="dash-side__link dash-side__link--logout"
          onClick={handleLogout}
        >
          <i
            className="fa-solid fa-right-from-bracket"
            style={{
              fontSize: '0.95rem',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '18px',
              color: '#dc2626',
            }}
          ></i>
          <span style={{ color: '#dc2626' }}>Cerrar Sesión</span>
        </button>
      </div>
    </aside>
  </>
  )
}
