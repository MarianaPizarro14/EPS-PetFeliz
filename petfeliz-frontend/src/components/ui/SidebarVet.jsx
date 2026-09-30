import React from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { getStoredToken, clearStoredAuth } from '../../utils/authStorage'

const vetMenuItems = [
  { to: '/veterinario/dashboard', aliases: ['/veterinario'], label: 'Panel', icon: 'fa-solid fa-chart-line' },
  { to: '/veterinario/pacientes', aliases: [], label: 'Mis Pacientes', icon: 'fa-solid fa-paw' },
  { to: '/veterinario/citas', aliases: [], label: 'Citas', icon: 'fa-regular fa-calendar-days' },
  { to: '/veterinario/historial', aliases: [], label: 'Historial Clínico', icon: 'fa-solid fa-file-waveform' },
  { to: '/veterinario/configuracion', aliases: [], label: 'Configuración', icon: 'fa-solid fa-gear' },
]

export default function SidebarVet() {
  const location = useLocation()
  const navigate = useNavigate()
  const [showSupportModal, setShowSupportModal] = React.useState(false)

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
    <>
      <aside
        className="dash-side"
        style={{
          minHeight: '100vh',
          height: '100vh',
          position: 'sticky',
          top: 0,
          boxSizing: 'border-box',
          overflowY: 'auto',
          zIndex: 950,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}
      >
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
                color: '#059669',
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

      {/* Modal de Soporte Técnico y Asistencia Médica */}
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
              borderRadius: '16px',
              padding: '1.75rem',
              maxWidth: '460px',
              width: '100%',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
              position: 'relative',
              animation: 'hceFadeInUp 0.2s ease-out',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setShowSupportModal(false)}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                background: '#f1f5f9',
                border: 'none',
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                cursor: 'pointer',
                color: '#64748b',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <i className="fa-solid fa-xmark"></i>
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '1rem' }}>
              <div
                style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '12px',
                  background: '#ecfdf5',
                  color: '#059669',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.35rem',
                }}
              >
                <i className="fa-solid fa-headset"></i>
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#0f172a', fontFamily: 'Sora, sans-serif', fontWeight: 700 }}>
                  Mesa de Ayuda Médica
                </h3>
                <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>
                  Soporte técnico y asistencial para veterinarios EPS PetFeliz
                </p>
              </div>
            </div>

            <p style={{ fontSize: '0.9rem', color: '#334155', lineHeight: '1.5', margin: '0 0 1.25rem 0' }}>
              ¿Tienes algún problema con el agendamiento, historia clínica, carga de datos o acceso? Comunícate directamente con la mesa de operaciones técnicas:
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.25rem' }}>
              <a
                href="https://wa.me/573023783834?text=Hola%2C%20soy%20m%C3%A9dico%20veterinario%20de%20EPS%20PetFeliz%20y%20necesito%20soporte%20t%C3%A9cnico"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  background: '#25D366',
                  color: '#ffffff',
                  textDecoration: 'none',
                  padding: '0.75rem 1rem',
                  borderRadius: '10px',
                  fontWeight: 600,
                  fontSize: '0.95rem',
                  boxShadow: '0 4px 12px rgba(37, 211, 102, 0.25)',
                }}
              >
                <i className="fa-brands fa-whatsapp" style={{ fontSize: '1.2rem' }}></i>
                <span>Abrir Chat de WhatsApp Soporte</span>
              </a>

              <a
                href="mailto:editorialpetfeliz@gmail.com?subject=Soporte%20Portal%20Veterinario"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  background: '#f8fafc',
                  border: '1.5px solid #cbd5e1',
                  color: '#334155',
                  textDecoration: 'none',
                  padding: '0.7rem 1rem',
                  borderRadius: '10px',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                }}
              >
                <i className="fa-solid fa-envelope"></i>
                <span>Enviar Correo a Soporte Técnico</span>
              </a>
            </div>

            <div style={{ background: '#f8fafc', padding: '0.75rem 1rem', borderRadius: '10px', fontSize: '0.8rem', color: '#64748b' }}>
              <div><i className="fa-regular fa-clock"></i> <strong>Horario de atención:</strong> Lunes a Sábado 8:00 AM - 7:00 PM</div>
              <div style={{ marginTop: '0.25rem' }}><i className="fa-solid fa-phone"></i> <strong>Línea directa:</strong> 302 378 3834 / 324 572 4090</div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
