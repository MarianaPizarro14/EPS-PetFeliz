import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getStoredToken } from '../../utils/authStorage'
import SidebarClient from '../ui/SidebarClient'
import DashboardHeader from '../ui/DashboardHeader'
import { DEFAULT_USER_AVATAR } from '../../constants/images'
import './DashboardClient.css'
import './ServiciosCliente.css'

const FALLBACK_PET_IMG = '/img/card_mascota.png'
const FALLBACK_USER_IMG = DEFAULT_USER_AVATAR

// Helper de sanitización de URLs para evitar 404
const getPhotoUrl = (url, fallback = FALLBACK_PET_IMG) => {
  if (!url || typeof url !== 'string') return fallback
  const trimmed = url.trim()
  if (
    !trimmed ||
    trimmed === 'default.jpg' ||
    trimmed === 'default_pet.jpg' ||
    trimmed.endsWith('/default.jpg') ||
    trimmed.endsWith('/default_pet.jpg')
  ) {
    return fallback
  }
  return trimmed
}

// Helper para determinar el color de acento del servicio por cobertura
const getServiceColorClass = (srv) => {
  if (srv.incluido_en_plan || Number(srv.precio_afiliado) === 0) {
    return 'servicios-cli-item__icon--green'
  }
  if (srv.precio_afiliado && Number(srv.precio_afiliado) > 0) {
    return 'servicios-cli-item__icon--amber'
  }
  return 'servicios-cli-item__icon--blue'
}

// Mapeo de íconos por nombre/categoría de servicio
const getServiceIcon = (nombre = '') => {
  const n = nombre.toLowerCase()
  if (n.includes('vacun')) return 'fa-solid fa-syringe'
  if (n.includes('desparasit')) return 'fa-solid fa-shield-cat'
  if (n.includes('urgenc') || n.includes('emergenc')) return 'fa-solid fa-heart-pulse'
  if (n.includes('laborator') || n.includes('análisis')) return 'fa-solid fa-microscope'
  if (n.includes('odontol') || n.includes('dent')) return 'fa-solid fa-tooth'
  if (n.includes('cirug')) return 'fa-solid fa-box-tissue'
  if (n.includes('ecograf') || n.includes('rayos')) return 'fa-solid fa-x-ray'
  return 'fa-solid fa-stethoscope'
}

import { useUser } from '../../context/UserContext'
import { serviciosData } from '../../data/serviciosData'

export default function ServiciosCliente() {
  const navigate = useNavigate()
  const { usuario, setUsuario } = useUser()

  const [activeTab, setActiveTab] = useState('catalogo') // 'catalogo' | 'historial'
  const [servicios, setServicios] = useState(serviciosData)
  const [historial, setHistorial] = useState([])
  const [mascotas, setMascotas] = useState([])
  const [selectedMascotaFilter, setSelectedMascotaFilter] = useState('todas')

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchDatosServicios = async () => {
      const token = getStoredToken()
      if (!token) {
        navigate('/login')
        return
      }

      try {
        setLoading(true)
        setError('')

        const headers = { Authorization: `Bearer ${token}`, Accept: 'application/json' }
        
        // Usamos Promise.allSettled para asegurar que si un endpoint falla, no rompa los demás
        const results = await Promise.allSettled([
          fetch(`${import.meta.env.VITE_API_URL}/me`, { headers }),
          fetch(`${import.meta.env.VITE_API_URL}/servicios`, { headers }),
          fetch(`${import.meta.env.VITE_API_URL}/mascotas`, { headers }),
          fetch(`${import.meta.env.VITE_API_URL}/cliente/historial-servicios`, { headers }),
        ])

        const [resUser, resSrv, resMasc, resHist] = results

        // 1. Usuario
        if (resUser.status === 'fulfilled' && resUser.value.ok) {
          const uData = await resUser.value.json()
          setUsuario(uData.usuario || uData)
        } else if (resUser.status === 'rejected') {
          console.error('[ServiciosCliente] Error al consultar /me:', resUser.reason)
        }

        // 2. Servicios (Catálogo)
        if (resSrv.status === 'fulfilled' && resSrv.value.ok) {
          const sData = await resSrv.value.json()
          console.log('[ServiciosCliente] Respuesta de /servicios API:', sData)
          const listaExtraida = Array.isArray(sData)
            ? sData
            : Array.isArray(sData?.data)
            ? sData.data
            : Array.isArray(sData?.servicios)
            ? sData.servicios
            : []
          
          if (listaExtraida.length > 0) {
            setServicios(listaExtraida)
          } else {
            console.warn('[ServiciosCliente] La API /servicios retornó un arreglo vacío. Se usará el catálogo por defecto.')
            setServicios(serviciosData)
          }
        } else {
          console.warn('[ServiciosCliente] Falló /servicios o no retornó HTTP 200. Usando catálogo por defecto.')
          setServicios(serviciosData)
        }

        // 3. Mascotas
        if (resMasc.status === 'fulfilled' && resMasc.value.ok) {
          const mData = await resMasc.value.json()
          setMascotas(Array.isArray(mData) ? mData : (mData?.data || []))
        } else if (resMasc.status === 'rejected') {
          console.error('[ServiciosCliente] Error al consultar /mascotas:', resMasc.reason)
        }

        // 4. Historial de Servicios
        if (resHist.status === 'fulfilled' && resHist.value.ok) {
          const hData = await resHist.value.json()
          setHistorial(Array.isArray(hData) ? hData : (hData?.data || []))
        } else if (resHist.status === 'rejected') {
          console.error('[ServiciosCliente] Error al consultar /cliente/historial-servicios:', resHist.reason)
        }
      } catch (err) {
        console.error('[ServiciosCliente] Error general al cargar datos de servicios:', err)
        setError('Ocurrió un inconveniente al sincronizar los servicios. Se están mostrando los datos del catálogo activo.')
        setServicios(serviciosData)
      } finally {
        setLoading(false)
      }
    }

    fetchDatosServicios()
  }, [navigate])

  // Filtrar historial según la mascota seleccionada
  const historialFiltrado = selectedMascotaFilter === 'todas'
    ? historial
    : historial.filter((item) => String(item.id_mascota) === String(selectedMascotaFilter))

  const handleAgendarServicio = (servicio) => {
    navigate('/agendar-cita', { state: { selectedServiceId: servicio.id_servicio } })
  }

  const formatPrecio = (valor) => {
    if (valor === null || valor === undefined || isNaN(valor)) return '$0'
    const num = Number(valor)
    if (num === 0) return 'Incluido en plan'
    return `$${num.toLocaleString('es-CO')}`
  }

  return (
    <div className="dash">
      <SidebarClient />

      <main className="dash-main">
        <DashboardHeader
          title="Catálogo & Historial de Servicios"
          subtitle="Explora los servicios médicos veterinarios disponibles en tu plan EPS y consulta tu historial prestado"
          usuario={usuario}
          onUserUpdated={setUsuario}
        />

        <div className="dash-card-box">
          {/* Tabs Nav */}
          <div className="servicios-cli-tabs">
            <button
              type="button"
              className={`servicios-cli-tab ${activeTab === 'catalogo' ? 'servicios-cli-tab--active' : ''}`}
              onClick={() => setActiveTab('catalogo')}
            >
              <i className="fa-solid fa-stethoscope"></i>
              <span>Catálogo de Servicios ({servicios.length})</span>
            </button>

            <button
              type="button"
              className={`servicios-cli-tab ${activeTab === 'historial' ? 'servicios-cli-tab--active' : ''}`}
              onClick={() => setActiveTab('historial')}
            >
              <i className="fa-solid fa-clock-rotate-left"></i>
              <span>Historial de Servicios ({historial.length})</span>
            </button>
          </div>

          {error && (
            <div className="dash-alert dash-alert--danger" style={{ marginBottom: '1.5rem' }}>
              <i className="fa-solid fa-triangle-exclamation"></i>
              <span>{error}</span>
            </div>
          )}

          {loading ? (
            <div className="servicios-cli-grid">
              {[1, 2, 3, 4, 5, 6].map((idx) => (
                <div key={idx} className="servicios-skeleton-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div className="skeleton-box" style={{ width: '46px', height: '46px', borderRadius: '12px' }}></div>
                    <div className="skeleton-box" style={{ width: '90px', height: '24px', borderRadius: '12px' }}></div>
                  </div>
                  <div className="skeleton-box" style={{ width: '70%', height: '20px', marginTop: '0.5rem' }}></div>
                  <div className="skeleton-box" style={{ width: '100%', height: '40px' }}></div>
                  <div className="skeleton-box" style={{ width: '100%', height: '38px', borderRadius: '10px', marginTop: 'auto' }}></div>
                </div>
              ))}
            </div>
          ) : activeTab === 'catalogo' ? (
            /* ── SECCIÓN A: CATÁLOGO DE SERVICIOS ── */
            <div>
              {servicios.length === 0 ? (
                <div className="servicios-cli-empty">
                  <i className="fa-solid fa-folder-open servicios-cli-empty__icon"></i>
                  <p className="servicios-cli-empty__title">No hay servicios disponibles actualmente</p>
                  <p style={{ fontSize: '0.875rem' }}>Intenta recargar más tarde.</p>
                </div>
              ) : (
                <div className="servicios-cli-grid">
                  {servicios.map((srv) => {
                    const photoSrc = srv.foto || srv.imagen
                    return (
                      <div key={srv.id_servicio} className="servicios-cli-item">
                        <div className="servicios-cli-item__content">
                          <div className="servicios-cli-item__header">
                            {photoSrc ? (
                              <img
                                src={getPhotoUrl(photoSrc, FALLBACK_PET_IMG)}
                                alt={srv.nombre}
                                className="servicios-cli-item__img"
                                onError={(e) => {
                                  e.target.onerror = null
                                  e.target.src = FALLBACK_PET_IMG
                                }}
                              />
                            ) : (
                              <div className={`servicios-cli-item__icon ${getServiceColorClass(srv)}`}>
                                <i className={getServiceIcon(srv.nombre)}></i>
                              </div>
                            )}

                            {srv.incluido_en_plan ? (
                              <span className="servicios-cli-item__badge servicios-cli-item__badge--eps">
                                Incluido EPS
                              </span>
                            ) : (
                              <span className="servicios-cli-item__badge servicios-cli-item__badge--copago">
                                Copago / Particular
                              </span>
                            )}
                          </div>

                          <h3 className="servicios-cli-item__title">{srv.nombre}</h3>
                          <p className="servicios-cli-item__desc">
                            {srv.descripcion || 'Servicio veterinario especializado con atención profesional integral.'}
                          </p>
                        </div>

                        <div className="servicios-cli-item__footer">
                          <div className="servicios-cli-item__meta">
                            <div className="servicios-cli-item__price">
                              <span className="servicios-cli-item__price-val">
                                {srv.incluido_en_plan || Number(srv.precio_afiliado) === 0
                                  ? 'Incluido en plan'
                                  : formatPrecio(srv.precio_afiliado)}
                              </span>
                              {Boolean(srv.precio_base && Number(srv.precio_base) > 0) && (
                                <span className="servicios-cli-item__price-sub">
                                  Regular: {formatPrecio(srv.precio_base)}
                                </span>
                              )}
                            </div>
                            <div className="servicios-cli-item__dur">
                              <i className="fa-regular fa-clock"></i>
                              <span>30 min est.</span>
                            </div>
                          </div>

                          <button
                            type="button"
                            className="servicios-cli-btn-agendar"
                            onClick={() => handleAgendarServicio(srv)}
                          >
                            <i className="fa-regular fa-calendar-plus"></i>
                            <span>Agendar Cita</span>
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          ) : (
            /* ── SECCIÓN B: HISTORIAL DE SERVICIOS ── */
            <div>
              <div className="servicios-cli-filter-bar">
                <div className="servicios-cli-filter-group">
                  <label htmlFor="mascota-filter" className="servicios-cli-filter-label">
                    Filtrar por Mascota:
                  </label>
                  <select
                    id="mascota-filter"
                    className="servicios-cli-select"
                    value={selectedMascotaFilter}
                    onChange={(e) => setSelectedMascotaFilter(e.target.value)}
                  >
                    <option value="todas">Todas las mascotas ({historial.length})</option>
                    {mascotas.map((m) => (
                      <option key={m.id_mascota} value={m.id_mascota}>
                        {m.nombre} ({m.especie})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {historialFiltrado.length === 0 ? (
                <div className="servicios-cli-empty">
                  <i className="fa-solid fa-receipt servicios-cli-empty__icon"></i>
                  <p className="servicios-cli-empty__title">No se encontraron registros de atención</p>
                  <p style={{ fontSize: '0.875rem' }}>
                    {selectedMascotaFilter !== 'todas'
                      ? 'No hay atenciones prestadas a la mascota seleccionada.'
                      : 'Cuando tus mascotas asistan a sus citas, su historial aparecerá aquí.'}
                  </p>
                </div>
              ) : (
                <div className="servicios-cli-table-container">
                  <table className="servicios-cli-table">
                    <thead>
                      <tr>
                        <th>Fecha / Hora</th>
                        <th>Mascota</th>
                        <th>Servicio</th>
                        <th>Especialista</th>
                        <th>Estado</th>
                        <th>Costo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {historialFiltrado.map((item) => {
                        const estadoClass = item.estado === 'Completado'
                          ? 'servicios-cli-status-badge--completado'
                          : item.estado === 'Cancelado'
                          ? 'servicios-cli-status-badge--cancelado'
                          : 'servicios-cli-status-badge--pendiente'

                        return (
                          <tr key={item.id_cita}>
                            <td>
                              <div style={{ fontWeight: 600, color: '#1e293b' }}>{item.fecha}</div>
                              <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{item.hora}</div>
                            </td>
                            <td>
                              <div className="servicios-cli-pet-cell">
                                <img
                                  src={getPhotoUrl(item.mascota_foto, FALLBACK_PET_IMG)}
                                  alt={item.mascota_nombre}
                                  className="servicios-cli-pet-img"
                                  onError={(e) => {
                                    e.target.onerror = null
                                    e.target.src = FALLBACK_PET_IMG
                                  }}
                                />
                                <span>{item.mascota_nombre}</span>
                              </div>
                            </td>
                            <td>
                              <div style={{ fontWeight: 600, color: '#0f172a' }}>{item.tipo_servicio}</div>
                              {item.descripcion_servicio && (
                                <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                                  {item.descripcion_servicio}
                                </div>
                              )}
                            </td>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                <i className="fa-solid fa-user-doctor" style={{ color: '#0d9488', fontSize: '0.85rem' }}></i>
                                <span>{item.especialista}</span>
                              </div>
                            </td>
                            <td>
                              <span className={`servicios-cli-status-badge ${estadoClass}`}>
                                <i className={
                                  item.estado === 'Completado'
                                    ? 'fa-solid fa-circle-check'
                                    : item.estado === 'Cancelado'
                                    ? 'fa-solid fa-circle-xmark'
                                    : 'fa-regular fa-clock'
                                }></i>
                                {item.estado}
                              </span>
                            </td>
                            <td>
                              <span style={{ fontWeight: 600, color: '#0f172a' }}>{formatPrecio(item.costo)}</span>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
