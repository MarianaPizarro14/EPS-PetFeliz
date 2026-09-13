import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getStoredToken, getStoredUser } from '../../utils/authStorage'
import SidebarAdmin from '../ui/SidebarAdmin'
import DashboardHeader from '../ui/DashboardHeader'
import './DashboardClient.css'
import './AdminDashboard.css'

// Helper para exportar arreglos de objetos a CSV con soporte UTF-8
const exportToCSV = (data, filename = 'Historial_Pagos_EPS_PetFeliz.csv') => {
  if (!data || data.length === 0) return

  const headers = Object.keys(data[0]).join(',')
  const rows = data.map((obj) =>
    Object.values(obj)
      .map((val) => `"${String(val ?? '').replace(/"/g, '""')}"`)
      .join(',')
  )

  const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers, ...rows].join('\n')
  const encodedUri = encodeURI(csvContent)
  const link = document.createElement('a')
  link.setAttribute('href', encodedUri)
  link.setAttribute('download', filename)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

export default function AdminDashboard() {
  const navigate = useNavigate()
  const storedUser = getStoredUser()

  const [usuario, setUsuario] = useState({
    nombre: storedUser?.nombre || 'Administrador',
    nombreCompleto: storedUser?.nombreCompleto || 'Director Administrativo',
    foto: storedUser?.foto || 'https://res.cloudinary.com/dedroug6v/image/upload/v1782673220/felipe-restrepo_qjvdxd.jpg',
  })

  const [dashboardData, setDashboardData] = useState({
    stats: {
      total_citas_hoy: 0,
      citas_hoy_trend: '+0% respecto a ayer',
      citas_hoy_trend_positive: true,
      citas_pendientes: 0,
      pendientes_trend: '0% por atender',
      pendientes_trend_positive: true,
      revisiones_hoy: 0,
      revisiones_trend: '+0% hoy',
      revisiones_trend_positive: true,
    },
    tendencia_citas: [],
    distribucion_servicios: [],
    transacciones_recientes: [],
    historial_completo_pagos: [],
    proximos_pacientes: [],
    recordatorios_hoy: [],
    actividad_reciente: [],
  })

  const [loading, setLoading] = useState(true)
  const [errorGlobal, setErrorGlobal] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCitaDetail, setSelectedCitaDetail] = useState(null)

  useEffect(() => {
    const fetchAdminData = async () => {
      const token = getStoredToken()
      if (!token) {
        navigate('/login')
        return
      }

      try {
        setLoading(true)
        setErrorGlobal('')

        const res = await fetch(`${import.meta.env.VITE_API_URL}/admin/dashboard`, {
          headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
        })

        if (res.status === 401 || res.status === 403) {
          navigate('/login')
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

  // Filtrado dinámico en tiempo real según la barra de búsqueda global
  const searchLower = searchTerm.toLowerCase().trim()

  const pacientesFiltrados = dashboardData.proximos_pacientes.filter((c) => {
    if (!searchLower) return true
    return (
      c.paciente.nombre.toLowerCase().includes(searchLower) ||
      c.paciente.especie.toLowerCase().includes(searchLower) ||
      c.paciente.raza.toLowerCase().includes(searchLower) ||
      c.dueno.nombre.toLowerCase().includes(searchLower) ||
      c.dueno.telefono.toLowerCase().includes(searchLower) ||
      c.servicio.toLowerCase().includes(searchLower) ||
      c.veterinario.nombre.toLowerCase().includes(searchLower)
    )
  })

  const transaccionesFiltradas = dashboardData.transacciones_recientes.filter((t) => {
    if (!searchLower) return true
    return (
      t.cliente.toLowerCase().includes(searchLower) ||
      t.email.toLowerCase().includes(searchLower) ||
      t.metodo_pago.toLowerCase().includes(searchLower) ||
      t.referencia.toLowerCase().includes(searchLower) ||
      t.tipo_cobertura.toLowerCase().includes(searchLower)
    )
  })

  // Cálculo del valor máximo para las barras del gráfico de 14 días
  const maxCitasChart = Math.max(
    5,
    ...dashboardData.tendencia_citas.map((d) => d.total || 0)
  )

  const handleExportCSV = () => {
    const dataToExport =
      dashboardData.historial_completo_pagos.length > 0
        ? dashboardData.historial_completo_pagos
        : dashboardData.transacciones_recientes.map((t) => ({
            'ID Pago': t.id_pago,
            Fecha: t.fecha,
            Cliente: t.cliente,
            Monto: t.monto,
            'Método Pago': t.metodo_pago,
            Cobertura: t.tipo_cobertura,
            Estado: t.estado,
            Referencia: t.referencia,
          }))

    exportToCSV(dataToExport, `Historial_Pagos_EPS_PetFeliz_${new Date().toISOString().slice(0, 10)}.csv`)
  }

  return (
    <div className="dash">
      <SidebarAdmin />

      <main className="dash-main">
        <DashboardHeader
          title={`¡Bienvenido de nuevo, ${usuario.nombre}!`}
          subtitle="Esto es lo que pasa hoy en la red clínica e indicadores de EPS PetFeliz"
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

        {/* ── 3 TARJETAS DE ESTADÍSTICAS CON INDICADORES DE TENDENCIA ── */}
        <div className="admin-dash-grid">
          {/* Card 1: Total Citas Hoy (Verde) */}
          <div className="admin-stat-card">
            <div className="admin-stat-card__info">
              <span>Total Citas Hoy</span>
              <h3>{loading ? '...' : dashboardData.stats.total_citas_hoy}</h3>
              <div
                className={`admin-trend-badge ${
                  dashboardData.stats.citas_hoy_trend_positive
                    ? 'admin-trend-badge--positive'
                    : 'admin-trend-badge--negative'
                }`}
              >
                <i
                  className={`fa-solid ${
                    dashboardData.stats.citas_hoy_trend_positive ? 'fa-arrow-trend-up' : 'fa-arrow-trend-down'
                  }`}
                ></i>
                <span>{dashboardData.stats.citas_hoy_trend || '+12.5% este mes'}</span>
              </div>
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
              <div
                className={`admin-trend-badge ${
                  dashboardData.stats.pendientes_trend_positive
                    ? 'admin-trend-badge--positive'
                    : 'admin-trend-badge--negative'
                }`}
              >
                <i
                  className={`fa-solid ${
                    dashboardData.stats.pendientes_trend_positive ? 'fa-circle-check' : 'fa-clock'
                  }`}
                ></i>
                <span>{dashboardData.stats.pendientes_trend || '42 por atender'}</span>
              </div>
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
              <div
                className={`admin-trend-badge ${
                  dashboardData.stats.revisiones_trend_positive
                    ? 'admin-trend-badge--positive'
                    : 'admin-trend-badge--negative'
                }`}
              >
                <i className="fa-solid fa-user-doctor"></i>
                <span>{dashboardData.stats.revisiones_trend || '+5 hoy'}</span>
              </div>
            </div>
            <div className="admin-stat-card__icon admin-stat-card__icon--amber">
              <i className="fa-solid fa-stethoscope"></i>
            </div>
          </div>
        </div>

        {/* ── SECCIÓN 1: GRÁFICO TENDENCIA DE CITAS + DISTRIBUCIÓN DE SERVICIOS ── */}
        <div className="admin-content-grid" style={{ marginBottom: '1.5rem' }}>
          {/* Gráfico de Barras: Tendencia de Citas (Últimos 14 días) */}
          <div className="admin-card">
            <div className="admin-card__header">
              <div className="admin-card__title">
                <div className="admin-card__title-icon">
                  <i className="fa-solid fa-chart-column"></i>
                </div>
                <h3>Tendencia de Citas (Últimos 14 Días)</h3>
              </div>
              <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>
                Volumen diario de atenciones
              </span>
            </div>

            {loading ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: '1.4rem' }}></i>
              </div>
            ) : (
              <div className="admin-chart-wrap">
                <div className="admin-bar-chart">
                  {dashboardData.tendencia_citas.map((item, idx) => {
                    const todayIso = new Date().toISOString().slice(0, 10)
                    const isToday = item.iso === todayIso || idx === dashboardData.tendencia_citas.length - 1
                    const isMax = item.total > 0 && item.total === maxCitasChart && !isToday
                    const ratio = maxCitasChart > 0 ? item.total / maxCitasChart : 0
                    const heightPct = Math.max(12, Math.round(ratio * 100))

                    // Formatear fecha completa para el tooltip (ej. "Domingo, 13 de Septiembre")
                    let fechaCompleta = item.fecha
                    if (item.iso) {
                      try {
                        const parts = item.iso.split('-')
                        if (parts.length === 3) {
                          const dateObj = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10))
                          const formatted = dateObj.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' })
                          fechaCompleta = formatted.charAt(0).toUpperCase() + formatted.slice(1)
                        }
                      } catch {
                        fechaCompleta = item.fecha
                      }
                    }

                    // Determinación de color por tonos de la paleta institucional de PetFeliz
                    let barColor = '#a7f3d0' // verde tenue claro institucional
                    let barShadow = 'none'

                    if (isToday) {
                      barColor = '#0284c7' // Azul institucional para HOY
                      barShadow = '0 4px 12px rgba(2, 132, 199, 0.35)'
                    } else if (isMax) {
                      barColor = '#047857' // Verde institucional intenso (Pico máximo)
                      barShadow = '0 4px 12px rgba(4, 120, 87, 0.3)'
                    } else if (ratio >= 0.7) {
                      barColor = '#059669' // Verde institucional principal
                    } else if (ratio >= 0.4) {
                      barColor = '#34d399' // Verde medio armónico
                    } else {
                      barColor = '#a7f3d0' // Verde tenue claro
                    }

                    return (
                      <div
                        key={idx}
                        className={`admin-bar-col ${
                          isToday ? 'admin-bar-col--today' : isMax ? 'admin-bar-col--max' : ''
                        }`}
                      >
                        {/* Tooltip flotante en hover */}
                        <div className="admin-bar-tooltip">
                          <span className="admin-bar-tooltip-val">
                            {item.total} {item.total === 1 ? 'Cita' : 'Citas'}
                          </span>
                          <span className="admin-bar-tooltip-date">{fechaCompleta}</span>
                        </div>

                        <div className="admin-bar-area">
                          <div
                            className="admin-bar-item"
                            style={{
                              height: `${heightPct}%`,
                              backgroundColor: barColor,
                              boxShadow: barShadow,
                            }}
                          ></div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Distribución de Servicios */}
          <div className="admin-card">
            <div className="admin-card__header">
              <div className="admin-card__title">
                <div className="admin-card__title-icon" style={{ background: '#f0fdf4', color: '#166534' }}>
                  <i className="fa-solid fa-pie-chart"></i>
                </div>
                <h3>Distribución de Servicios</h3>
              </div>
            </div>

            {loading ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: '1.4rem' }}></i>
              </div>
            ) : (
              <div className="admin-service-dist-list">
                {dashboardData.distribucion_servicios.map((s, idx) => (
                  <div key={idx} className="admin-service-item">
                    <div className="admin-service-info">
                      <span className="admin-service-name">{s.servicio}</span>
                      <span className="admin-service-stats">
                        {s.total} ({s.porcentaje}%)
                      </span>
                    </div>
                    <div className="admin-service-track">
                      <div
                        className="admin-service-fill"
                        style={{
                          width: `${Math.min(100, s.porcentaje)}%`,
                          backgroundColor: s.color || '#059669',
                        }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── SECCIÓN 2: TRANSACCIONES RECIENTES (PAGOS) CON BOTÓN EXPORTAR CSV ── */}
        <div className="admin-card" style={{ marginBottom: '1.5rem' }}>
          <div className="admin-card__header">
            <div className="admin-card__title">
              <div className="admin-card__title-icon" style={{ background: '#ecfdf5', color: '#047857' }}>
                <i className="fa-solid fa-receipt"></i>
              </div>
              <h3>Transacciones Recientes & Facturación</h3>
            </div>

            <button type="button" className="admin-btn-csv" onClick={handleExportCSV}>
              <i className="fa-solid fa-file-csv"></i>
              <span>Exportar Todo a CSV</span>
            </button>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
              <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: '1.4rem' }}></i>
            </div>
          ) : transaccionesFiltradas.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
              <i className="fa-solid fa-inbox" style={{ fontSize: '1.6rem', marginBottom: '0.4rem', color: '#94a3b8' }}></i>
              <p>No se encontraron transacciones con el criterio de búsqueda "{searchTerm}".</p>
            </div>
          ) : (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Ref. Transacción</th>
                    <th>Cliente / Usuario</th>
                    <th>Monto (COP)</th>
                    <th>Método</th>
                    <th>Cobertura</th>
                    <th>Estado</th>
                    <th>Fecha</th>
                  </tr>
                </thead>
                <tbody>
                  {transaccionesFiltradas.map((t) => (
                    <tr key={t.id_pago}>
                      <td style={{ fontWeight: 700, color: '#0f172a' }}>{t.referencia}</td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontWeight: 600, color: '#0f172a' }}>{t.cliente}</span>
                          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{t.email}</span>
                        </div>
                      </td>
                      <td style={{ fontWeight: 700, color: '#059669' }}>{t.monto_formateado}</td>
                      <td>{t.metodo_pago}</td>
                      <td>
                        <span className={`admin-tx-badge admin-tx-badge--${t.tipo_cobertura.toLowerCase()}`}>
                          {t.tipo_cobertura}
                        </span>
                      </td>
                      <td>
                        <span className={`admin-tx-badge admin-tx-badge--${t.estado.toLowerCase()}`}>
                          {t.estado}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.78rem', color: '#64748b' }}>{t.fecha}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ── SECCIÓN 3: PRÓXIMOS PACIENTES + RECORDATORIOS & ACTIVIDAD ── */}
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
                {pacientesFiltrados.length} Pacientes en agenda
              </span>
            </div>

            {loading ? (
              <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: '#64748b' }}>
                <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}></i>
                <p>Cargando lista de atenciones médicas...</p>
              </div>
            ) : pacientesFiltrados.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: '#64748b' }}>
                <i className="fa-solid fa-calendar-xmark" style={{ fontSize: '1.8rem', marginBottom: '0.5rem', color: '#94a3b8' }}></i>
                <p>No hay citas o pacientes que coincidan con la búsqueda.</p>
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
                    {pacientesFiltrados.map((c) => (
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
