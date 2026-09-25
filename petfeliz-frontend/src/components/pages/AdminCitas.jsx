// src/components/pages/AdminCitas.jsx
import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getStoredToken, getStoredUser, isValidAvatarUrl } from '../../utils/authStorage'
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
    foto: isValidAvatarUrl(storedUser?.foto || storedUser?.foto_perfil) ? (storedUser?.foto || storedUser?.foto_perfil) : null,
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
          title="Citas"
          subtitle="Consulta y administra las citas agendadas en la clínica"
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
            <span className="pet-badge-count">
              {citasFiltradas.length} {citasFiltradas.length === 1 ? 'cita' : 'citas'}
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
                    <th>Fecha</th>
                    <th>Paciente</th>
                    <th>Cliente</th>
                    <th>Servicio</th>
                    <th>Estado</th>
                    <th style={{ textAlign: 'right', paddingRight: '1.25rem' }}>
                      <i className="fa-solid fa-ellipsis" style={{ color: '#94a3b8' }}></i>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {citasFiltradas.map((c) => (
                    <tr key={c.id_cita}>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontWeight: 600, color: '#0f172a' }}>{c.fecha_formateada || c.fecha}</span>
                          <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 400 }}>{c.hora}</span>
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
                              {c.paciente.especie} • {(c.paciente.raza || '').replace(' / Mestizo (Sin raza definida)', '').replace(' (Sin raza definida)', '')}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="admin-table__owner-info">
                          <span style={{ fontWeight: 400, color: '#334155', fontSize: '0.88rem' }}>{c.dueno.nombre}</span>
                          <span className="admin-table__owner-phone">
                            <i className="fa-solid fa-phone" style={{ marginRight: '4px', fontSize: '0.7rem' }}></i>
                            {c.dueno.telefono}
                          </span>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontWeight: 400, color: '#334155', fontSize: '0.88rem' }}>{c.servicio}</span>
                          <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 400 }}>
                            {c.veterinario.nombre ? (c.veterinario.nombre.startsWith('Dr') ? c.veterinario.nombre : `Dr(a). ${c.veterinario.nombre}`) : 'Veterinario Asignado'}
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
                          title="Ver detalle de la cita"
                        >
                          <i className="fa-regular fa-eye" style={{ fontSize: '0.85rem' }}></i>
                          <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Ver</span>
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
          <div className="dh-modal-box" style={{ maxWidth: '480px', padding: 0, overflow: 'hidden', borderRadius: '20px' }}>
            {/* Header del Modal */}
            <div style={{ padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <span className="pet-badge-count" style={{ fontSize: '0.8rem', fontWeight: 600 }}>
                  Cita #{selectedCitaDetail.id_cita}
                </span>
                <span
                  className={`admin-table__badge ${
                    selectedCitaDetail.id_estado === 2 || selectedCitaDetail.id_estado === 4
                      ? 'admin-table__badge--confirmada'
                      : selectedCitaDetail.id_estado === 3
                      ? 'admin-table__badge--cancelada'
                      : 'admin-table__badge--pendiente'
                  }`}
                >
                  <i
                    className={`fa-solid ${
                      selectedCitaDetail.id_estado === 2 || selectedCitaDetail.id_estado === 4
                        ? 'fa-check'
                        : selectedCitaDetail.id_estado === 3
                        ? 'fa-xmark'
                        : 'fa-clock'
                    }`}
                  ></i>
                  {selectedCitaDetail.estado}
                </span>
              </div>
              <button
                type="button"
                className="dh-modal-close"
                onClick={() => setSelectedCitaDetail(null)}
                style={{ background: '#f1f5f9', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <i className="fa-solid fa-xmark" style={{ fontSize: '0.9rem', color: '#64748b' }}></i>
              </button>
            </div>

            <div style={{ padding: '1.5rem' }}>
              {/* Tarjeta Destacada del Paciente / Mascota */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)',
                  padding: '1.1rem 1.25rem',
                  borderRadius: '16px',
                  border: '1px solid #a7f3d0',
                  marginBottom: '1.25rem',
                }}
              >
                <img
                  src={selectedCitaDetail.paciente.foto}
                  alt={selectedCitaDetail.paciente.nombre}
                  style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '50%',
                    objectFit: 'cover',
                    border: '3px solid #ffffff',
                    boxShadow: '0 4px 12px rgba(5, 150, 105, 0.15)',
                  }}
                  onError={(e) => {
                    e.target.onerror = null
                    e.target.src = 'https://res.cloudinary.com/dedroug6v/image/upload/v1/mascotas/default_pet.jpg'
                  }}
                />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                  <h3 style={{ margin: 0, fontFamily: "'Sora', sans-serif", fontSize: '1.25rem', fontWeight: 700, color: '#064e3b' }}>
                    {selectedCitaDetail.paciente.nombre}
                  </h3>
                  <span style={{ fontSize: '0.85rem', color: '#047857', fontWeight: 500 }}>
                    <i className="fa-solid fa-paw" style={{ fontSize: '0.75rem', marginRight: '5px' }}></i>
                    {selectedCitaDetail.paciente.especie} • {(selectedCitaDetail.paciente.raza || '').replace(' / Mestizo (Sin raza definida)', '').replace(' (Sin raza definida)', '')}
                  </span>
                </div>
              </div>

              {/* Grid de 2 Columnas: Dueño y Veterinario */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
                {/* Columna Dueño */}
                <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '0.9rem 1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#059669', fontSize: '0.78rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                    <i className="fa-regular fa-user"></i>
                    <span>Dueño</span>
                  </div>
                  <div style={{ fontSize: '0.92rem', fontWeight: 600, color: '#0f172a' }}>
                    {selectedCitaDetail.dueno.nombre}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.3rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <i className="fa-solid fa-phone" style={{ fontSize: '0.7rem' }}></i>
                    <span>{selectedCitaDetail.dueno.telefono}</span>
                  </div>
                  {selectedCitaDetail.dueno.email && (
                    <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '0.15rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {selectedCitaDetail.dueno.email}
                    </div>
                  )}
                </div>

                {/* Columna Veterinario */}
                <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '0.9rem 1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#0284c7', fontSize: '0.78rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                    <i className="fa-solid fa-user-doctor"></i>
                    <span>Veterinario</span>
                  </div>
                  <div style={{ fontSize: '0.92rem', fontWeight: 600, color: '#0f172a' }}>
                    {selectedCitaDetail.veterinario.nombre ? (selectedCitaDetail.veterinario.nombre.startsWith('Dr') ? selectedCitaDetail.veterinario.nombre : `Dr(a). ${selectedCitaDetail.veterinario.nombre}`) : 'Veterinario Asignado'}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#0284c7', fontWeight: 500, marginTop: '0.2rem' }}>
                    {selectedCitaDetail.veterinario.especialidad || 'Medicina General'}
                  </div>
                </div>
              </div>

              {/* Barra Informativa: Fecha, Hora y Servicio */}
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '0.85rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#334155', fontSize: '0.88rem' }}>
                  <i className="fa-regular fa-calendar-days" style={{ color: '#059669' }}></i>
                  <span style={{ fontWeight: 600 }}>{selectedCitaDetail.fecha_formateada || selectedCitaDetail.fecha}</span>
                  <span style={{ color: '#94a3b8' }}>•</span>
                  <i className="fa-regular fa-clock" style={{ color: '#0284c7' }}></i>
                  <span>{selectedCitaDetail.hora}</span>
                </div>
                <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#059669', background: '#ecfdf5', padding: '0.25rem 0.65rem', borderRadius: '6px' }}>
                  {selectedCitaDetail.servicio}
                </span>
              </div>

              {/* Bloque de Observación / Nota de la Cita */}
              {selectedCitaDetail.observacion && (
                <div style={{ background: '#fffbe8', border: '1px solid #fde68a', borderRadius: '12px', padding: '0.85rem 1rem', display: 'flex', gap: '0.6rem', alignItems: 'flex-start' }}>
                  <i className="fa-regular fa-note-sticky" style={{ color: '#d97706', fontSize: '1rem', marginTop: '0.15rem' }}></i>
                  <div style={{ fontSize: '0.85rem', color: '#92400e', lineHeight: '1.4' }}>
                    <strong style={{ display: 'block', marginBottom: '0.15rem' }}>Observación:</strong>
                    {selectedCitaDetail.observacion}
                  </div>
                </div>
              )}
            </div>

            {/* Footer con botón de cierre limpio */}
            <div style={{ padding: '1rem 1.5rem 1.25rem', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'flex-end', background: '#fafafa' }}>
              <button
                type="button"
                className="btn-primary-adm"
                onClick={() => setSelectedCitaDetail(null)}
                style={{ padding: '0.55rem 1.5rem', fontSize: '0.88rem' }}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
