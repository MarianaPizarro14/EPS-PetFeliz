// src/components/ui/SidebarClient.jsx
import React from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'

const menuItems = [
  { to: '/dashboard-client', aliases: ['/dashboard-cliente'], label: 'Panel', icon: 'fa-solid fa-border-all' },
  { to: '/mis-mascotas', aliases: [], label: 'Mis Mascotas', icon: 'fa-solid fa-paw' },
  { to: '/citas', aliases: [], label: 'Citas', icon: 'fa-regular fa-calendar-days' },
  { to: '/dashboard-client/servicios', aliases: ['/servicios-cliente'], label: 'Servicios', icon: 'fa-solid fa-stethoscope' },
  { to: '/dashboard-client/pagos', aliases: ['/pagos'], label: 'Pagos y Facturación', icon: 'fa-regular fa-file-lines' },
  { to: '/dashboard-client/documentos', aliases: ['/documentos'], label: 'Documentos', icon: 'fa-regular fa-folder-open' },
]

export default function SidebarClient() {
  const location = useLocation()
  const navigate = useNavigate()

  const handleLogout = async () => {
    const token = localStorage.getItem('token')
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
        console.error('Error al cerrar sesión en servidor:', e)
      }
    }

    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/login')
  }

  const isItemActive = (item) => {
    if (location.pathname === item.to) return true
    if (item.aliases && item.aliases.includes(location.pathname)) return true
    return false
  }

  const isSupportActive =
    location.pathname === '/dashboard-client/soporte' ||
    location.pathname === '/soporte' ||
    location.pathname === '/contacto'

  return (
    <aside className="dash-side">
      <div>
        <div className="dash-side__logo">
          <span className="dash-side__logo-title">EPS PetFeliz</span>
          <span className="dash-side__logo-sub">Veterinaria</span>
        </div>

        <nav className="dash-side__nav">
          {menuItems.map((item) => {
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
          to="/dashboard-client/soporte"
          className={`dash-side__link dash-side__link--support ${isSupportActive ? 'dash-side__link--active' : ''}`}
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
          <span>Soporte</span>
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
          <span style={{ color: '#dc2626' }}>Cerrar sesión</span>
        </button>
      </div>
    </aside>
  )
}
