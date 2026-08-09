import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import DashboardHeader from '../ui/DashboardHeader'
import SidebarClient from '../ui/SidebarClient'
import './DashboardClient.css'



const menuItems = [
  { to: '/dashboard-client', label: 'Panel', icon: 'grid' },
  { to: '/mis-mascotas', label: 'Mis Mascotas', icon: 'paw' },
  { to: '/citas', label: 'Citas', icon: 'calendar' },
  { to: '/dashboard-client/servicios', label: 'Servicios', icon: 'stethoscope' },
  { to: '/dashboard-client/pagos', label: 'Pagos y Facturación', icon: 'invoice' },
  { to: '/dashboard-client/documentos', label: 'Documentos', icon: 'file' },
]

/* ── Íconos Font Awesome Free (Estilo Regular y Ligeros) ── */
const Icon = ({ name, style, className = '', ...props }) => {
  const map = {
    grid: 'fa-solid fa-border-all',
    paw: 'fa-solid fa-paw',
    calendar: 'fa-regular fa-calendar-days',
    stethoscope: 'fa-solid fa-stethoscope',
    invoice: 'fa-regular fa-file-lines',
    file: 'fa-regular fa-file-lines',
    help: 'fa-regular fa-circle-question',
    logout: 'fa-solid fa-right-from-bracket',
    bell: 'fa-regular fa-bell',
    plus: 'fa-solid fa-plus',
    pencil: 'fa-regular fa-pen-to-square',
    trash: 'fa-regular fa-trash-can',
    close: 'fa-solid fa-xmark',
    camera: 'fa-solid fa-camera',
  }
  const faClass = map[name] || 'fa-regular fa-circle-question'
  return (
    <i
      className={`${faClass} ${className}`}
      style={{
        fontSize: '0.95rem',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        ...style,

      }}
      {...props}
    />
  )
}



function DashboardClient() {
  const location = useLocation()
  const navigate = useNavigate()
  const [tab, setTab] = useState('proximas')

  const [usuario, setUsuario] = useState({ nombre: 'Usuario', nombreCompleto: '', foto: '' })
  const [mascotas, setMascotas] = useState([])
  const [citas, setCitas] = useState({ proximas: [], anteriores: [] })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchDashboardData = async () => {
      const token = localStorage.getItem('token')
      if (!token) {
        navigate('/login')
        return
      }

      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/cliente/dashboard`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          }
        })

        if (response.status === 401) {
          localStorage.removeItem('token')
          localStorage.removeItem('user')
          navigate('/login')
          return
        }

        const data = await response.json()

        if (!response.ok) {
          setError(data.message || 'Error al cargar información del dashboard.')
          setLoading(false)
          return
        }

        if (data.usuario) setUsuario(data.usuario)
        if (data.mascotas) setMascotas(data.mascotas)
        if (data.citas) setCitas(data.citas)
      } catch (err) {
        console.error(err)
        setError('No se pudo conectar con el servidor.')
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [navigate])

  const handleLogout = async () => {
    const token = localStorage.getItem('token')
    if (token) {
      try {
        await fetch(`${import.meta.env.VITE_API_URL}/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          }
        })
      } catch (e) {
        console.error('Error al cerrar sesión en servidor:', e)
      }
    }

    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/login')
  }

  const listadoCitas = citas[tab] || []

  return (
    <div className="dash">
      <SidebarClient />


      {/* ── MAIN ── */}
      <main className="dash-main">
        <DashboardHeader
          title={`Bienvenido de nuevo, ${usuario.nombre}`}
          subtitle="Todo se ve excelente con tus mascotas hoy"
          usuario={usuario}
          onUserUpdated={(updatedUser) => setUsuario(updatedUser)}
        />


        {loading ? (
          <div style={{ padding: '3rem 1rem', textAlign: 'center', color: '#64748b' }}>
            <p>Cargando información de tu cuenta...</p>
          </div>
        ) : error ? (
          <div style={{ padding: '2rem 1rem', color: '#ef4444', textAlign: 'center' }}>
            <p>{error}</p>
          </div>
        ) : (
          <>
            <section className="dash-top">
              <button className="dash-cta" onClick={() => navigate('/citas')}>
                <span className="dash-cta__icon"><Icon name="plus" /></span>
                <span className="dash-cta__title">Agendar Nueva Cita</span>
                <span className="dash-cta__desc">Agendar una consulta o una atención urgente</span>
              </button>

              <div className="dash-pets">
                <div className="dash-pets__header">
                  <span className="dash-pets__title">Mascotas</span>
                  <Link to="/mis-mascotas" className="dash-pets__link">Ver Todo →</Link>
                </div>

                <div className="dash-pets__grid">
                  {mascotas.length === 0 ? (
                    <p style={{ color: '#94a3b8', fontSize: '0.9rem', gridColumn: '1 / -1' }}>
                      No tienes mascotas registradas aún.
                    </p>
                  ) : (
                    mascotas.map((m) => (
                      <div key={m.id} className="dash-pet-card">
                        <div className="dash-pet-card__photo-wrap">
                          <img src={m.foto} alt={m.nombre} />
                          <span className={'dash-pet-card__status dash-pet-card__status--' + m.estado}>
                            {m.estado === 'ok' ? '✓' : '!'}
                          </span>
                        </div>
                        <div className="dash-pet-card__info">
                          <h4>{m.nombre}</h4>
                          <p>{m.raza} • {m.edad}</p>
                          <span className="dash-pet-card__badge">
                            <Icon name="calendar" width="12" height="12" /> {m.proximaCita}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </section>

            <section className="dash-appointments">
              <div className="dash-appointments__header">
                <h3>{tab === 'proximas' ? 'Próximas Citas' : 'Citas Anteriores'}</h3>
                <div className="dash-tabs">
                  <button
                    className={'dash-tabs__btn' + (tab === 'proximas' ? ' dash-tabs__btn--active' : '')}
                    onClick={() => setTab('proximas')}
                  >
                    Próximas citas ({citas.proximas ? citas.proximas.length : 0})
                  </button>
                  <button
                    className={'dash-tabs__btn' + (tab === 'anteriores' ? ' dash-tabs__btn--active' : '')}
                    onClick={() => setTab('anteriores')}
                  >
                    Citas anteriores ({citas.anteriores ? citas.anteriores.length : 0})
                  </button>
                </div>
              </div>

              <div className="dash-appointments__list">
                {listadoCitas.length === 0 ? (
                  <p style={{ color: '#94a3b8', padding: '1rem', textAlign: 'center' }}>
                    No hay citas {tab === 'proximas' ? 'programadas' : 'anteriores'}.
                  </p>
                ) : (
                  listadoCitas.map((c) => (
                    <div key={c.id} className="dash-appointment-row">
                      <div className="dash-appointment-row__date">
                        <span className="dash-appointment-row__month">{c.mes}</span>
                        <span className="dash-appointment-row__day">{c.dia}</span>
                      </div>

                      <div className="dash-appointment-row__body">
                        <div className="dash-appointment-row__meta">
                          <span className={'dash-appointment-row__badge dash-appointment-row__badge--' + c.tipoClase}>
                            {c.tipo}
                          </span>
                          <span className="dash-appointment-row__hora">• {c.hora}</span>
                        </div>
                        <h4>{c.titulo}</h4>
                        <p>{c.doctor} • {c.sede}</p>
                      </div>

                      <div className="dash-appointment-row__actions">
                        <button className="dash-appointment-row__edit" aria-label="Editar">
                          <Icon name="pencil" width="15" height="15" />
                        </button>
                        <button className="btn-appointment">Ver Detalles</button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>
          </>
        )}

        <footer className="dash-footer">
          © 2026 PetFeliz tus datos médicos están protegidos y encriptados.
        </footer>
      </main>
    </div>
  )
}

export default DashboardClient