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
  const [copiedEmail, setCopiedEmail] = React.useState(false)

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
              borderRadius: '20px',
              padding: '2.25rem 2.25rem',
              maxWidth: '560px',
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
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#e2e8f0'
                e.currentTarget.style.color = '#0f172a'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#f1f5f9'
                e.currentTarget.style.color = '#64748b'
              }}
            >
              <i className="fa-solid fa-xmark" style={{ fontSize: '1rem' }}></i>
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem' }}>
              <div
                style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '14px',
                  background: '#ecfdf5',
                  color: '#059669',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.5rem',
                  flexShrink: 0,
                }}
              >
                <i className="fa-solid fa-headset"></i>
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#0f172a', fontFamily: 'Sora, sans-serif', fontWeight: 700 }}>
                  Mesa de Ayuda Médica
                </h3>
                <p style={{ margin: '3px 0 0 0', fontSize: '0.88rem', color: '#64748b' }}>
                  Soporte técnico y asistencial para veterinarios EPS PetFeliz
                </p>
              </div>
            </div>

            <p style={{ fontSize: '0.92rem', color: '#334155', lineHeight: '1.55', margin: '0 0 1.5rem 0' }}>
              ¿Tienes algún problema con el agendamiento, historia clínica, carga de datos o acceso al portal? Comunícate de inmediato con la mesa de operaciones técnicas:
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', marginBottom: '1.5rem' }}>
              {/* Botón WhatsApp: fondo elegante oscuro, logo con color neón original */}
              <a
                href="https://wa.me/573218854748?text=Hola%2C%20soy%20m%C3%A9dico%20veterinario%20de%20EPS%20PetFeliz%20y%20necesito%20soporte%20t%C3%A9cnico"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.65rem',
                  background: '#0f172a',
                  border: '1.5px solid #1e293b',
                  color: '#ffffff',
                  textDecoration: 'none',
                  padding: '0.85rem 1.25rem',
                  borderRadius: '12px',
                  fontWeight: 600,
                  fontSize: '0.96rem',
                  boxShadow: '0 4px 14px rgba(15, 23, 42, 0.25)',
                  transition: 'all 0.2s ease',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#1e293b'
                  e.currentTarget.style.transform = 'translateY(-1px)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#0f172a'
                  e.currentTarget.style.transform = 'none'
                }}
              >
                <i className="fa-brands fa-whatsapp" style={{ color: '#25D366', fontSize: '1.45rem', filter: 'drop-shadow(0 0 4px rgba(37,211,102,0.3))' }}></i>
                <span>Abrir Chat de WhatsApp Soporte (+57 321 8854748)</span>
              </a>

              {/* Botón Correo con copia de seguridad para garantizar que siempre funcione */}
              <div style={{ display: 'flex', gap: '0.5rem', width: '100%' }}>
                <a
                  href="mailto:petfelizeps@gmail.com?subject=Soporte%20Portal%20Veterinario%20EPS%20PetFeliz"
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.6rem',
                    background: '#f8fafc',
                    border: '1.5px solid #cbd5e1',
                    color: '#1e293b',
                    textDecoration: 'none',
                    padding: '0.85rem 1rem',
                    borderRadius: '12px',
                    fontWeight: 600,
                    fontSize: '0.92rem',
                    transition: 'all 0.18s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#f1f5f9'
                    e.currentTarget.style.borderColor = '#94a3b8'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#f8fafc'
                    e.currentTarget.style.borderColor = '#cbd5e1'
                  }}
                  onClick={() => {
                    window.open('mailto:petfelizeps@gmail.com?subject=Soporte%20Portal%20Veterinario%20EPS%20PetFeliz', '_blank')
                  }}
                >
                  <i className="fa-solid fa-envelope" style={{ color: '#2563eb', fontSize: '1.1rem' }}></i>
                  <span>petfelizeps@gmail.com</span>
                </a>

                <button
                  type="button"
                  title="Copiar correo electrónico al portapapeles"
                  onClick={() => {
                    navigator.clipboard.writeText('petfelizeps@gmail.com')
                    setCopiedEmail(true)
                    setTimeout(() => setCopiedEmail(false), 2500)
                  }}
                  style={{
                    background: copiedEmail ? '#ecfdf5' : '#f8fafc',
                    border: copiedEmail ? '1.5px solid #059669' : '1.5px solid #cbd5e1',
                    color: copiedEmail ? '#059669' : '#334155',
                    borderRadius: '12px',
                    padding: '0 1.15rem',
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: '0.88rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.45rem',
                    transition: 'all 0.18s ease',
                    whiteSpace: 'nowrap',
                  }}
                >
                  <i className={copiedEmail ? 'fa-solid fa-check' : 'fa-regular fa-copy'}></i>
                  <span>{copiedEmail ? '¡Copiado!' : 'Copiar'}</span>
                </button>
              </div>
            </div>

            <div style={{ background: '#f8fafc', padding: '0.9rem 1.15rem', borderRadius: '12px', fontSize: '0.85rem', color: '#475569', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <i className="fa-regular fa-clock" style={{ color: '#059669' }}></i>
                <span><strong>Horario de atención:</strong> Lunes a Sábado 8:00 AM - 7:00 PM</span>
              </div>
              <div style={{ marginTop: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <i className="fa-solid fa-phone" style={{ color: '#059669' }}></i>
                <span><strong>Línea directa y WhatsApp:</strong> +57 321 8854748</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
