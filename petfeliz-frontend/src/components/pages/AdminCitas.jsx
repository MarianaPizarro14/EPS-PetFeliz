// src/components/pages/AdminCitas.jsx
import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getStoredToken, getStoredUser } from '../../utils/authStorage'
import SidebarAdmin from '../ui/SidebarAdmin'
import DashboardHeader from '../ui/DashboardHeader'
import './DashboardClient.css'
import './AdminDashboard.css'
import './AdminCitas.css'

export default function AdminCitas() {
  const navigate = useNavigate()
  const storedUser = getStoredUser()

  const [usuario, setUsuario] = useState({
    nombre: storedUser?.nombre || 'Administrador',
    nombreCompleto: storedUser?.nombreCompleto || 'Director Administrativo',
    foto: storedUser?.foto || 'https://res.cloudinary.com/dedroug6v/image/upload/v1782673220/felipe-restrepo_qjvdxd.jpg',
  })

  const [citas, setCitas] = useState([])
  const [stats, setStats] = useState({
    total: 0,
    pendientes: 0,
    atendidas: 0,
    canceladas: 0,
  })

  const [loading, setLoading] = useState(true)
  const [errorGlobal, setErrorGlobal] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState('todas') // 'todas' | 'pendientes' | 'atendidas' | 'canceladas'
  const [selectedCitaDetail, setSelectedCitaDetail] = useState(null)

  useEffect(() => {
    const fetchCitasData = async () => {
      const token = getStoredToken()
      if (!token) {
        navigate('/login')
        return
      }

      try {
        setLoading(true)
        setErrorGlobal('')

        const res = await fetch(`${import.meta.env.VITE_API_URL}/admin/citas`, {
          headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
        })

        if (res.status === 401 || res.status === 403) {
          navigate('/login')
          return
        }

        if (res.ok) {
          const data = await res.json()
          setCitas(data.citas || [])
          if (data.stats) {
            setStats(data.stats)
          }
        } else {
          setErrorGlobal('No se pudo obtener el listado de citas de administración.')
        }
      } catch (err) {
        console.error('Error al cargar citas de administración:', err)
        setErrorGlobal('Error de conexión con el servidor al cargar las citas.')
      } finally {
        setLoading(false)
      }
    }

    fetchCitasData()
  }, [navigate])

  // Filtrado por pestaña de estado y término de búsqueda
  const searchLower = searchTerm.toLowerCase().trim()

  const citasFiltradas = citas.filter((c) => {
    // 1. Filtrado por tab de estado
    if (activeTab === 'pendientes' && c.id_estado !== 1) return false
    if (activeTab === 'atendidas' && c.id_estado !== 2 && c.id_estado !== 4) return false
    if (activeTab === 'canceladas' && c.id_estado !== 3) return false

    // 2. Filtrado por término de búsqueda
    if (!searchLower) return true

    return (
      c.paciente.nombre.toLowerCase().includes(searchLower) ||
      c.paciente.especie.toLowerCase().includes(searchLower) ||
      c.paciente.raza.toLowerCase().includes(searchLower) ||
      c.dueno.nombre.toLowerCase().includes(searchLower) ||
      c.dueno.telefono.toLowerCase().includes(searchLower) ||
      c.dueno.email.toLowerCase().includes(searchLower) ||
      c.servicio.toLowerCase().includes(searchLower) ||
      c.veterinario.nombre.toLowerCase().includes(searchLower) ||
      c.estado.toLowerCase().includes(searchLower) ||
      String(c.id_cita).includes(searchLower)
    )
  })

  return (
    <div className="dash">
      <SidebarAdmin />

      <main className="dash-main">
        <DashboardHeader
          title="Gestión Integral de Citas Médicas"
          subtitle="Monitoreo, búsqueda y expedientes de atenciones programadas en la red EPS PetFeliz"
          usuario={usuario}
          onUserUpdated={setUsuario}
          showSearch={true}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
        />

        {errorGlobal && (
          <div className="dash-alert dash-alert--danger" style={{ marginBottom: '1.5rem' }}>
            <i className="fa-solid fa-triangle-exclamation"></i>
            <span>{errorGlobal}</span>
          </div>
        )}

        {/* ── TARJETAS MÉTRICAS DE FILTRADO POR ESTADO DE CITA ── */}
        <div className="admin-citas-stats-grid">
          {/* Tab 1: Todas las Citas */}
          <div
            className={`admin-citas-filter-card ${
              activeTab === 'todas' ? 'admin-citas-filter-card--active' : ''
            }`}
            onClick={() => setActiveTab('todas')}
          >
            <div className="admin-citas-filter-card__info">
              <span>Todas las Citas</span>
              <h3>{loading ? '...' : stats.total || citas.length}</h3>
            </div>
            <div className="admin-citas-filter-card__icon admin-citas-filter-card__icon--all">
              <i className="fa-regular fa-calendar-days"></i>
            </div>
          </div>

          {/* Tab 2: Pendientes */}
          <div
            className={`admin-citas-filter-card ${
              activeTab === 'pendientes' ? 'admin-citas-filter-card--active' : ''
            }`}
            onClick={() => setActiveTab('pendientes')}
          >
            <div className="admin-citas-filter-card__info">
              <span>Pendientes</span>
              <h3>{loading ? '...' : stats.pendientes}</h3>
            </div>
            <div className="admin-citas-filter-card__icon admin-citas-filter-card__icon--pending">
              <i className="fa-regular fa-clock"></i>
            </div>
          </div>

          {/* Tab 3: Confirmadas / Atendidas */}
          <div
            className={`admin-citas-filter-card ${
              activeTab === 'atendidas' ? 'admin-citas-filter-card--active' : ''
            }`}
            onClick={() => setActiveTab('atendidas')}
          >
            <div className="admin-citas-filter-card__info">
              <span>Atendidas / Confirmadas</span>
              <h3>{loading ? '...' : stats.atendidas}</h3>
            </div>
            <div className="admin-citas-filter-card__icon admin-citas-filter-card__icon--confirmed">
              <i className="fa-solid fa-circle-check"></i>
            </div>
          </div>

          {/* Tab 4: Canceladas */}
          <div
            className={`admin-citas-filter-card ${
              activeTab === 'canceladas' ? 'admin-citas-filter-card--active' : ''
            }`}
            onClick={() => setActiveTab('canceladas')}
          >
            <div className="admin-citas-filter-card__info">
              <span>Canceladas</span>
              <h3>{loading ? '...' : stats.canceladas}</h3>
            </div>
            <div className="admin-citas-filter-card__icon admin-citas-filter-card__icon--cancelled">
              <i className="fa-solid fa-ban"></i>
            </div>
          </div>
        </div>

        {/* ── TABLA GENERAL DE CITAS REGISTRADAS ── */}
        <div className="admin-card">
          <div className="admin-card__header">
            <div className="admin-card__title">
              <div className="admin-card__title-icon">
                <i className="fa-solid fa-clipboard-list"></i>
              </div>
              <h3>
                {activeTab === 'todas'
                  ? 'Listado General de Citas'
                  : activeTab === 'pendientes'
                  ? 'Citas Pendientes por Atender'
                  : activeTab === 'atendidas'
                  ? 'Citas Confirmadas / Atendidas'
                  : 'Citas Canceladas'}
              </h3>
            </div>
            <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>
              {citasFiltradas.length} {citasFiltradas.length === 1 ? 'registro encontrado' : 'registros encontrados'}
            </span>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#64748b' }}>
              <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: '1.6rem', marginBottom: '0.6rem' }}></i>
              <p>Cargando atenciones médicas en sistema...</p>
            </div>
          ) : citasFiltradas.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#64748b' }}>
              <i className="fa-solid fa-calendar-xmark" style={{ fontSize: '2rem', marginBottom: '0.5rem', color: '#94a3b8' }}></i>
              <p style={{ margin: 0, fontWeight: 600, color: '#334155' }}>
                No se encontraron citas en esta categoría.
              </p>
              {searchTerm && (
                <span style={{ fontSize: '0.82rem', color: '#64748b' }}>
                  Intenta cambiar el término de búsqueda "{searchTerm}" o seleccionar otra pestaña.
                </span>
              )}
            </div>
          ) : (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Fecha & Hora</th>
                    <th>Paciente</th>
                    <th>Dueño / Cliente</th>
                    <th>Servicio & Médico</th>
                    <th>Estado</th>
                    <th style={{ textAlign: 'right' }}>Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {citasFiltradas.map((c) => (
                    <tr key={c.id_cita}>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontWeight: 700, color: '#0f172a' }}>{c.fecha_formateada || c.fecha}</span>
                          <span style={{ fontSize: '0.78rem', color: '#059669', fontWeight: 600 }}>{c.hora}</span>
                        </div>
                      </td>
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
                            <i className="fa-solid fa-phone" style={{ marginRight: '4px', fontSize: '0.7rem' }}></i>
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
                            c.id_estado === 2 || c.id_estado === 4
                              ? 'admin-table__badge--confirmada'
                              : c.id_estado === 3
                              ? 'admin-table__badge--cancelada'
                              : 'admin-table__badge--pendiente'
                          }`}
                        >
                          <i
                            className={`fa-solid ${
                              c.id_estado === 2 || c.id_estado === 4
                                ? 'fa-check'
                                : c.id_estado === 3
                                ? 'fa-xmark'
                                : 'fa-clock'
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
      </main>

      {/* ── MODAL DETALLE DE CITAS ── */}
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
                  <div style={{ fontSize: '0.78rem', color: '#64748b' }}>Email: {selectedCitaDetail.dueno.email}</div>
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
                    {selectedCitaDetail.fecha_formateada || selectedCitaDetail.fecha} - {selectedCitaDetail.hora}
                  </div>
                </div>
                <div>
                  <span
                    className={`admin-table__badge ${
                      selectedCitaDetail.id_estado === 2 || selectedCitaDetail.id_estado === 4
                        ? 'admin-table__badge--confirmada'
                        : selectedCitaDetail.id_estado === 3
                        ? 'admin-table__badge--cancelada'
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
