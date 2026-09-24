import React from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { getStoredToken, clearStoredAuth } from '../../utils/authStorage'

const vetMenuItems = [
  { to: '/veterinario/dashboard', aliases: [], label: 'Mi Portal', icon: 'fa-solid fa-user-doctor' },
]

export default function SidebarVet() {
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
        console.error('Error al cerrar sesión de veterinario:', e)
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

  return (
    <aside className="dash-side">
      <div>
        <div className="dash-side__logo">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <i className="fa-solid fa-user-doctor" style={{ color: '#059669', fontSize: '1.1rem' }}></i>
            <span className="dash-side__logo-title">EPS PetFeliz</span>
          </div>
          <span className="dash-side__logo-sub" style={{ color: '#059669', fontWeight: 700, marginTop: '6px', display: 'block' }}>
            PORTAL VETERINARIO
          </span>
        </div>

        <nav className="dash-side__nav">
          {vetMenuItems.map((item) => {
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
  )
}
