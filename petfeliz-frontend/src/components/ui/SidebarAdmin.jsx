// src/components/ui/SidebarAdmin.jsx
import React from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { getStoredToken, clearStoredAuth } from '../../utils/authStorage'

const adminMenuItems = [
  { to: '/admin/dashboard', aliases: [], label: 'Panel', icon: 'fa-solid fa-border-all' },
  { to: '/admin/citas', aliases: [], label: 'Citas', icon: 'fa-regular fa-calendar-days' },
  { to: '/admin/veterinarios', aliases: [], label: 'Veterinarios', icon: 'fa-solid fa-user-doctor' },
  { to: '/admin/servicios', aliases: [], label: 'Servicios', icon: 'fa-solid fa-stethoscope' },
  { to: '/admin/clientes', aliases: [], label: 'Clientes', icon: 'fa-solid fa-users' },
  { to: '/admin/pagos', aliases: [], label: 'Pagos y Facturación', icon: 'fa-regular fa-file-lines' },
  { to: '/admin/configuracion', aliases: [], label: 'Configuración', icon: 'fa-solid fa-gear' },
]

export default function SidebarAdmin() {
  const location = useLocation()
  const navigate = useNavigate()

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
    navigate('/admin-login')
  }

  const isItemActive = (item) => {
    if (location.pathname === item.to) return true
    if (item.aliases && item.aliases.includes(location.pathname)) return true
    return false
  }

  const isHelpActive = location.pathname === '/admin/soporte'

  return (
    <aside className="dash-side">
      <div>
        <div className="dash-side__logo">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <i className="fa-solid fa-shield-halved" style={{ color: '#059669', fontSize: '1.1rem' }}></i>
            <span className="dash-side__logo-title">EPS PetFeliz</span>
          </div>
          <span className="dash-side__logo-sub" style={{ color: '#059669', fontWeight: 700 }}>
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
        <Link
          to="/admin/soporte"
          className={`dash-side__link dash-side__link--support ${isHelpActive ? 'dash-side__link--active' : ''}`}
        >
          <i
            className="fa-regular fa-circle-question"
            style={{
              fontSize: '0.95rem',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '18px',
            }}
          ></i>
          <span>Centro de Ayuda</span>
        </Link>

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
  )
}
