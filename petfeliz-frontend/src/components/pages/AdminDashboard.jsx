import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getStoredToken, getStoredUser } from '../../utils/authStorage'
import SidebarAdmin from '../ui/SidebarAdmin'
import DashboardHeader from '../ui/DashboardHeader'
import './DashboardClient.css'
import './AdminDashboard.css'

export default function AdminDashboard() {
  const navigate = useNavigate()
  const storedUser = getStoredUser()

  const [usuario, setUsuario] = useState({
    nombre: storedUser?.nombre || 'Administrador',
    nombreCompleto: storedUser?.nombreCompleto || 'Director Administrativo',
    foto: storedUser?.foto || 'https://res.cloudinary.com/dedroug6v/image/upload/v1782673220/felipe-restrepo_qjvdxd.jpg',
  })

  const [dashboardData, setDashboardData] = useState({
    stats: { total_citas_hoy: 0, citas_pendientes: 0, revisiones_hoy: 0 },
    proximos_pacientes: [],
    recordatorios_hoy: [],
    actividad_reciente: [],
  })

  const [loading, setLoading] = useState(true)
  const [errorGlobal, setErrorGlobal] = useState('')
  const [selectedCitaDetail, setSelectedCitaDetail] = useState(null)

  useEffect(() => {
    const fetchAdminData = async () => {
      const token = getStoredToken()
      if (!token) {
        navigate('/admin-login')
        return
      }

      try {
        setLoading(true)
        setErrorGlobal('')

        const res = await fetch(`${import.meta.env.VITE_API_URL}/admin/dashboard`, {
          headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
        })

        if (res.status === 401 || res.status === 403) {
          navigate('/admin-login')
          return
        }

        if (res.ok) {
          const data = await res.json()
          setDashboardData(data)
        } else {
          setErrorGlobal('No se pudo cargar la información del panel de administración.')
        }
      } catch (err) {
        console.error('Error al cargar dashboard de administración:', err)
        setErrorGlobal('Error de conexión con el servidor de administración.')
      } finally {
        setLoading(false)
      }
    }

    fetchAdminData()
  }, [navigate])

  return (
    <div className="dash">
      <SidebarAdmin />

      <main className="dash-main">
        <DashboardHeader
          title="Panel de Control Administrativo"
          subtitle="Monitoreo en tiempo real de atenciones clínicas, expedientes de pacientes e indicadores de la EPS"
          usuario={usuario}
          onUserUpdated={setUsuario}
        />

        {errorGlobal && (
          <div className="dash-alert dash-alert--danger" style={{ marginBottom: '1.5rem' }}>
            <i className="fa-solid fa-triangle-exclamation"></i>
            <span>{errorGlobal}</span>
          </div>
        )}

        {/* ── 3 TARJETAS DE ESTADÍSTICAS (VERDE, AZUL, ÁMBAR) ── */}
        <div className="admin-dash-grid">
          {/* Card 1: Total Citas Hoy (Verde) */}
          <div className="admin-stat-card">
            <div className="admin-stat-card__info">
              <span>Total Citas Hoy</span>
              <h3>{loading ? '...' : dashboardData.stats.total_citas_hoy}</h3>
              <div className="admin-stat-card__sub">Atenciones agendadas para el día</div>
            </div>
            <div className="admin-stat-card__icon admin-stat-card__icon--green">
              <i className="fa-solid fa-calendar-check"></i>
            </div>
          </div>

          {/* Card 2: Citas Pendientes (Azul) */}
          <div className="admin-stat-card">
            <div className="admin-stat-card__info">
              <span>Citas Pendientes</span>
              <h3>{loading ? '...' : dashboardData.stats.citas_pendientes}</h3>
              <div className="admin-stat-card__sub">Por confirmar o en espera</div>
            </div>
            <div className="admin-stat-card__icon admin-stat-card__icon--blue">
              <i className="fa-solid fa-clock"></i>
            </div>
          </div>

          {/* Card 3: Revisiones (Ámbar) */}
          <div className="admin-stat-card">
            <div className="admin-stat-card__info">
              <span>Revisiones / Atendidas</span>
              <h3>{loading ? '...' : dashboardData.stats.revisiones_hoy}</h3>
              <div className="admin-stat-card__sub">Consultas procesadas con éxito</div>
            </div>
            <div className="admin-stat-card__icon admin-stat-card__icon--amber">
              <i className="fa-solid fa-user-doctor"></i>
            </div>
          </div>
        </div>

        {/* ── LAYOUT DE CONTENIDO DE DOS COLUMNAS ── */}
        <div className="admin-content-grid">
          {/* Columna Izquierda: Tabla Próximos Pacientes */}
          <div className="admin-card">
            <div className="admin-card__header">
              <div className="admin-card__title">
                <div className="admin-card__title-icon">
                  <i className="fa-solid fa-clipboard-list"></i>
                </div>
                <h3>Próximos Pacientes</h3>
              </div>
              <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>
                {dashboardData.proximos_pacientes.length} Pacientes en agenda
              </span>
            </div>

            {loading ? (
              <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: '#64748b' }}>
                <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}></i>
                <p>Cargando lista de atenciones médicas...</p>
              </div>
            ) : dashboardData.proximos_pacientes.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: '#64748b' }}>
                <i className="fa-solid fa-calendar-xmark" style={{ fontSize: '1.8rem', marginBottom: '0.5rem', color: '#94a3b8' }}></i>
                <p>No hay citas registradas para la fecha seleccionada.</p>
              </div>
            ) : (
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Hora</th>
                      <th>Paciente</th>
                      <th>Dueño / Cliente</th>
                      <th>Servicio & Médico</th>
                      <th>Estado</th>
                      <th style={{ textAlign: 'right' }}>Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dashboardData.proximos_pacientes.map((c) => (
                      <tr key={c.id_cita}>
                        <td className="admin-table__time">{c.hora}</td>
                        <td>
                          <div className="admin-table__patient">
                            <img
                              src={c.paciente.foto}
                              alt={c.paciente.nombre}
                              className="admin-table__avatar"
                            />
                            <div className="admin-table__patient-info">
                              <span className="admin-table__patient-name">{c.paciente.nombre}</span>
                              <span className="admin-table__patient-spec">
                                {c.paciente.especie} • {c.paciente.raza}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className="admin-table__owner-info">
                            <span className="admin-table__owner-name">{c.dueno.nombre}</span>
                            <span className="admin-table__owner-phone">
                              <i className="fa-solid fa-phone" style={{ marginRight: '3px', fontSize: '0.7rem' }}></i>
                              {c.dueno.telefono}
                            </span>
                          </div>
                        </td>
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontWeight: 600, color: '#0f172a' }}>{c.servicio}</span>
                            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                              Dr(a). {c.veterinario.nombre}
                            </span>
                          </div>
                        </td>
                        <td>
                          <span
                            className={`admin-table__badge ${
                              c.id_estado === 2
                                ? 'admin-table__badge--confirmada'
                                : 'admin-table__badge--pendiente'
                            }`}
                          >
                            <i
                              className={`fa-solid ${
                                c.id_estado === 2 ? 'fa-check' : 'fa-clock'
                              }`}
                            ></i>
                            {c.estado}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <button
                            type="button"
                            className="admin-btn-action"
                            onClick={() => setSelectedCitaDetail(c)}
                          >
                            <i className="fa-solid fa-eye"></i>
                            <span>Detalle</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Columna Derecha: Recordatorios y Actividad Reciente */}
          <div>
            {/* Bloque 1: Recordatorios de Hoy */}
            <div className="admin-card">
              <div className="admin-card__header">
                <div className="admin-card__title">
                  <div className="admin-card__title-icon" style={{ background: '#fef3c7', color: '#b45309' }}>
                    <i className="fa-solid fa-bell"></i>
                  </div>
                  <h3>Recordatorios de Hoy</h3>
                </div>
              </div>

              <div className="admin-reminder-list">
                {dashboardData.recordatorios_hoy.map((r) => (
                  <div key={r.id} className={`admin-reminder-item admin-reminder-item--${r.tipo}`}>
                    <i
                      className={`fa-solid ${
                        r.tipo === 'urgente'
                          ? 'fa-triangle-exclamation'
                          : r.tipo === 'exito'
                          ? 'fa-circle-check'
                          : 'fa-circle-info'
                      }`}
                      style={{
                        marginTop: '2px',
                        color: r.tipo === 'urgente' ? '#dc2626' : r.tipo === 'exito' ? '#166534' : '#0369a1',
                      }}
                    ></i>
                    <div className="admin-reminder-content">
                      <h4>{r.titulo}</h4>
                      <p>{r.detalle}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Bloque 2: Actividad Reciente */}
            <div className="admin-card">
              <div className="admin-card__header">
                <div className="admin-card__title">
                  <div className="admin-card__title-icon" style={{ background: '#f0fdf4', color: '#166534' }}>
                    <i className="fa-solid fa-chart-line"></i>
                  </div>
                  <h3>Actividad Reciente</h3>
                </div>
              </div>

              <div className="admin-timeline">
                {dashboardData.actividad_reciente.map((act) => (
                  <div key={act.id} className="admin-timeline-item">
                    <div className={`admin-timeline-icon admin-timeline-icon--${act.color}`}>
                      <i className={act.icono}></i>
                    </div>
                    <div className="admin-timeline-info">
                      <h5>{act.titulo}</h5>
                      <p>{act.descripcion}</p>
                      <div className="admin-timeline-time">{act.tiempo}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ── MODAL DETALLE DE PACIENTE Y CITA ── */}
      {selectedCitaDetail && (
        <div className="dh-modal-backdrop">
          <div className="dh-modal-box">
            <div className="dh-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    background: '#e0f2fe',
                    color: '#0284c7',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1rem',
                  }}
                >
                  <i className="fa-solid fa-stethoscope"></i>
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.15rem' }}>Expediente de Atención Médica</h3>
                  <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                    Cita No. #{selectedCitaDetail.id_cita} — EPS PetFeliz
                  </span>
                </div>
              </div>
              <button
                type="button"
                className="dh-modal-close"
                onClick={() => setSelectedCitaDetail(null)}
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <div
              style={{
                background: '#f8fafc',
                padding: '1.25rem',
                borderRadius: '14px',
                border: '1px solid #e2e8f0',
                marginBottom: '1.25rem',
                fontSize: '0.88rem',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  marginBottom: '1rem',
                  paddingBottom: '0.85rem',
                  borderBottom: '1px solid #e2e8f0',
                }}
              >
                <img
                  src={selectedCitaDetail.paciente.foto}
                  alt={selectedCitaDetail.paciente.nombre}
                  style={{ width: '56px', height: '56px', borderRadius: '14px', objectFit: 'cover' }}
                />
                <div>
                  <h4 style={{ margin: 0, fontSize: '1.1rem', color: '#0f172a' }}>
                    {selectedCitaDetail.paciente.nombre}
                  </h4>
                  <span style={{ color: '#059669', fontWeight: 600, fontSize: '0.82rem' }}>
                    {selectedCitaDetail.paciente.especie} • {selectedCitaDetail.paciente.raza}
                  </span>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <span style={{ color: '#64748b', fontSize: '0.78rem', display: 'block' }}>Propietario / Dueño:</span>
                  <strong style={{ color: '#334155' }}>{selectedCitaDetail.dueno.nombre}</strong>
                  <div style={{ fontSize: '0.78rem', color: '#64748b' }}>Tel: {selectedCitaDetail.dueno.telefono}</div>
                  <div style={{ fontSize: '0.78rem', color: '#64748b' }}>C.C.: {selectedCitaDetail.dueno.cedula}</div>
                </div>

                <div>
                  <span style={{ color: '#64748b', fontSize: '0.78rem', display: 'block' }}>Médico Tratante:</span>
                  <strong style={{ color: '#334155' }}>Dr(a). {selectedCitaDetail.veterinario.nombre}</strong>
                  <div style={{ fontSize: '0.78rem', color: '#0284c7', fontWeight: 600 }}>
                    {selectedCitaDetail.veterinario.especialidad}
                  </div>
                </div>
              </div>

              <div
                style={{
                  marginTop: '0.85rem',
                  paddingTop: '0.85rem',
                  borderTop: '1px dashed #cbd5e1',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <span style={{ color: '#64748b', fontSize: '0.78rem' }}>Fecha y Hora Programada:</span>
                  <div style={{ fontWeight: 700, color: '#0f172a' }}>
                    {selectedCitaDetail.fecha} - {selectedCitaDetail.hora}
                  </div>
                </div>
                <div>
                  <span
                    className={`admin-table__badge ${
                      selectedCitaDetail.id_estado === 2
                        ? 'admin-table__badge--confirmada'
                        : 'admin-table__badge--pendiente'
                    }`}
                  >
                    {selectedCitaDetail.estado}
                  </span>
                </div>
              </div>

              {selectedCitaDetail.observacion && (
                <div style={{ marginTop: '0.75rem', fontSize: '0.82rem', color: '#475569', background: '#ffffff', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                  <strong>Observación registrada:</strong> {selectedCitaDetail.observacion}
                </div>
              )}
            </div>

            <div className="dh-modal-footer">
              <button
                type="button"
                className="dh-btn-primary"
                onClick={() => setSelectedCitaDetail(null)}
              >
                Entendido / Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
