import React from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { getStoredToken, clearStoredAuth } from '../../utils/authStorage'

const recepMenuItems = [
  { to: '/recepcion/dashboard', aliases: ['/recepcion'], label: 'Panel Principal', icon: 'fa-solid fa-chart-line' },
  { to: '/recepcion/citas', aliases: [], label: 'Citas y Cobros', icon: 'fa-regular fa-calendar-days' },
  { to: '/recepcion/clientes', aliases: [], label: 'Clientes y Mascotas', icon: 'fa-solid fa-users' },
  { to: '/recepcion/veterinarios', aliases: [], label: 'Directorio Médico', icon: 'fa-solid fa-user-doctor' },
  { to: '/recepcion/formulas', aliases: [], label: 'Fórmulas Médicas', icon: 'fa-solid fa-prescription-bottle-medical' },
  { to: '/recepcion/configuracion', aliases: [], label: 'Configuración', icon: 'fa-solid fa-gear' },
]

export default function SidebarRecepcion() {
  const location = useLocation()
  const navigate = useNavigate()
  const [showSupportModal, setShowSupportModal] = React.useState(false)
  const [copiedEmail, setCopiedEmail] = React.useState(false)
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
        console.error('Error al cerrar sesión de recepcionista:', e)
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
    <>
      {mobileOpen && (
        <div className="dash-side-backdrop" onClick={() => setMobileOpen(false)} />
      )}
      <aside className={`dash-side ${mobileOpen ? 'is-open' : ''}`}>
        <div>
          <div className="dash-side__logo">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <i className="fa-solid fa-hospital-user" style={{ color: '#2563eb', fontSize: '1.1rem' }}></i>
              <span className="dash-side__logo-title">EPS PetFeliz</span>
            </div>
            <span className="dash-side__logo-sub" style={{ color: '#2563eb', fontWeight: 700, marginTop: '6px', display: 'block' }}>
              RECEPCIÓN DE SEDE
            </span>
          </div>

          <nav className="dash-side__nav">
            {recepMenuItems.map((item) => {
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

        <div className="dash-side__nav dash-side__nav--bottom" style={{ marginTop: 'auto', paddingTop: '0.85rem' }}>
          <button
            type="button"
            className="dash-side__link"
            onClick={() => setShowSupportModal(true)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              width: '100%',
              textAlign: 'left',
              fontFamily: 'inherit',
            }}
          >
            <i
              className="fa-regular fa-circle-question"
              style={{
                fontSize: '0.95rem',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '18px',
                color: '#2563eb',
              }}
            ></i>
            <span>Soporte</span>
          </button>

          <button
            type="button"
            className="dash-side__link dash-side__link--logout"
            onClick={handleLogout}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              width: '100%',
              textAlign: 'left',
              fontFamily: 'inherit',
            }}
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

      {/* Modal de Soporte Técnico y Asistencia de Recepción */}
      {showSupportModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.55)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '1rem',
          }}
          onClick={() => setShowSupportModal(false)}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '20px',
              padding: '2.5rem 2.5rem',
              maxWidth: '660px',
              width: '100%',
              boxShadow: '0 25px 40px -10px rgba(0, 0, 0, 0.22), 0 10px 15px -5px rgba(0, 0, 0, 0.1)',
              position: 'relative',
              animation: 'hceFadeInUp 0.22s ease-out',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setShowSupportModal(false)}
              style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                background: '#f1f5f9',
                border: 'none',
                width: '34px',
                height: '34px',
                borderRadius: '50%',
                cursor: 'pointer',
                color: '#64748b',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.15s ease',
              }}
            >
              <i className="fa-solid fa-xmark" style={{ fontSize: '1rem' }}></i>
            </button>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', marginBottom: '1.5rem' }}>
              <div
                style={{
                  width: '54px',
                  height: '54px',
                  borderRadius: '14px',
                  background: '#eff6ff',
                  color: '#2563eb',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.55rem',
                  flexShrink: 0,
                  marginTop: '2px',
                }}
              >
                <i className="fa-solid fa-headset"></i>
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.3rem', color: '#0f172a', fontFamily: 'Sora, sans-serif', fontWeight: 700 }}>
                  Soporte Operativo de Recepción
                </h3>
                <p style={{ margin: '8px 0 0 0', fontSize: '0.92rem', color: '#64748b', lineHeight: '1.45' }}>
                  Asistencia para el equipo de atención al cliente y caja en sede
                </p>
              </div>
            </div>

            <p style={{ fontSize: '0.95rem', color: '#334155', lineHeight: '1.6', margin: '0 0 1.75rem 0' }}>
              ¿Necesitas apoyo con la caja presencial, confirmaciones de pagos, reagendamiento de citas o impresión de documentos? Comunícate directamente con la central técnica:
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem', marginBottom: '1.75rem' }}>
              <a
                href="https://wa.me/573218854748?text=Hola%2C%20soy%20del%20equipo%20de%20recepci%C3%B3n%20de%20EPS%20PetFeliz%20y%20requiero%20asistencia"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.75rem',
                  background: '#16a34a',
                  border: '1.5px solid #15803d',
                  color: '#ffffff',
                  textDecoration: 'none',
                  padding: '0.9rem 1.35rem',
                  borderRadius: '12px',
                  fontWeight: 600,
                  fontSize: '0.98rem',
                  boxShadow: '0 4px 14px rgba(22, 163, 74, 0.25)',
                }}
              >
                <i className="fa-brands fa-whatsapp" style={{ color: '#ffffff', fontSize: '1.5rem' }}></i>
                <span>Abrir Chat de WhatsApp Soporte (+57 321 8854748)</span>
              </a>

              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText('petfelizeps@gmail.com')
                  setCopiedEmail(true)
                  setTimeout(() => setCopiedEmail(false), 2500)
                }}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: copiedEmail ? '#ecfdf5' : '#f8fafc',
                  border: copiedEmail ? '1.5px solid #059669' : '1.5px solid #cbd5e1',
                  color: copiedEmail ? '#047857' : '#1e293b',
                  padding: '0.9rem 1.25rem',
                  borderRadius: '12px',
                  fontWeight: 600,
                  fontSize: '0.94rem',
                  cursor: 'pointer',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <i className="fa-solid fa-envelope" style={{ color: '#2563eb', fontSize: '1.15rem' }}></i>
                  <span>petfelizeps@gmail.com</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.88rem', color: copiedEmail ? '#059669' : '#64748b' }}>
                  <i className={copiedEmail ? 'fa-solid fa-check' : 'fa-regular fa-copy'}></i>
                  <span>{copiedEmail ? '¡Correo copiado!' : 'Copiar correo'}</span>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
