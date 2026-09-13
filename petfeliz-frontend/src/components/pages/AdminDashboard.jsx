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
          subtitle="Resumen de actividad e indicadores clave de hoy"
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
        <div className="admin-content-grid">
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
        <div className="admin-card">
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
                    <th>Método Pago</th>
                    <th>Cobertura</th>
                    <th>Estado</th>
                    <th>Fecha & Hora</th>
                  </tr>
                </thead>
                <tbody>
                  {transaccionesFiltradas.map((t) => (
                    <tr key={t.id_pago}>
                      <td className="admin-tx-ref">{t.referencia}</td>
                      <td>
                        <div className="admin-tx-client">
                          <span className="admin-tx-client-name">{t.cliente}</span>
                          <span className="admin-tx-client-email">{t.email}</span>
                        </div>
                      </td>
                      <td className="admin-tx-amount">{t.monto_formateado}</td>
                      <td className="admin-tx-method">{t.metodo_pago}</td>
                      <td>
                        <span className={`admin-tx-badge admin-tx-badge--${t.tipo_cobertura.toLowerCase()}`}>
                          {t.tipo_cobertura}
                        </span>
                      </td>
                      <td>
                        <span className={`admin-tx-badge admin-tx-badge--${t.estado.toLowerCase()}`}>
                          <i className={`fa-solid ${t.estado === 'confirmado' ? 'fa-check' : 'fa-clock'}`} style={{ fontSize: '0.65rem', marginRight: '4px' }}></i>
                          {t.estado}
                        </span>
                      </td>
                      <td className="admin-tx-date">
                        <i className="fa-regular fa-clock" style={{ marginRight: '4px', color: '#94a3b8' }}></i>
                        {t.fecha}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ── SECCIÓN 3: RECORDATORIOS DE HOY & ACTIVIDAD RECIENTE ── */}
        <div className="admin-content-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
          {/* Bloque 1: Recordatorios de Hoy */}
          <div className="admin-card">
            <div className="admin-card__header">
              <div className="admin-card__title">
                <div className="admin-card__title-icon" style={{ background: '#fef3c7', color: '#b45309' }}>
                  <i className="fa-solid fa-bell"></i>
                </div>
                <h3>Recordatorios de Hoy</h3>
              </div>
              <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>
                {dashboardData.recordatorios_hoy.length} Notificaciones
              </span>
            </div>

            <div className="admin-reminder-list">
              {dashboardData.recordatorios_hoy.map((r) => (
                <div key={r.id} className={`admin-reminder-card admin-reminder-card--${r.tipo}`}>
                  <div className="admin-reminder-card__top">
                    <span className="admin-reminder-card__tag">
                      <i className={`fa-solid ${r.tipo === 'urgente' ? 'fa-triangle-exclamation' : r.tipo === 'exito' ? 'fa-circle-check' : 'fa-circle-info'}`}></i>
                      {r.tipo === 'urgente' ? 'Urgente' : r.tipo === 'exito' ? 'Auditoría' : 'Verificación'}
                    </span>
                    <span className="admin-reminder-card__time">
                      <i className="fa-regular fa-clock"></i> {r.hora}
                    </span>
                  </div>
                  <h4 className="admin-reminder-card__title">{r.titulo}</h4>
                  <p className="admin-reminder-card__detail">{r.detalle}</p>
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
              <span style={{ fontSize: '0.78rem', color: '#059669', fontWeight: 600 }}>
                En tiempo real
              </span>
            </div>

            <div className="admin-timeline">
              {dashboardData.actividad_reciente.map((act) => (
                <div key={act.id} className="admin-timeline-item">
                  <div className={`admin-timeline-node admin-timeline-node--${act.color}`}>
                    <i className={act.icono}></i>
                  </div>
                  <div className="admin-timeline-content">
                    <div className="admin-timeline-header">
                      <h5 className="admin-timeline-title">{act.titulo}</h5>
                      <span className="admin-timeline-time">
                        <i className="fa-regular fa-clock"></i> {act.tiempo}
                      </span>
                    </div>
                    <p className="admin-timeline-desc">{act.descripcion}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
