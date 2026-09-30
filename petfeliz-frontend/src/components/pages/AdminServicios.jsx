// src/components/pages/AdminServicios.jsx
import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getStoredToken, getStoredUser, isValidAvatarUrl } from '../../utils/authStorage'
import SidebarAdmin from '../ui/SidebarAdmin'
import DashboardHeader from '../ui/DashboardHeader'
import './DashboardClient.css'
import './AdminDashboard.css'
import './AdminCitas.css'
import './AdminMascotas.css'

export default function AdminServicios() {
  const navigate = useNavigate()
  const storedUser = getStoredUser()

  const [usuario] = useState({
    nombre: storedUser?.nombre || 'Administrador',
    nombreCompleto: storedUser?.nombreCompleto || 'Director Administrativo',
    foto: isValidAvatarUrl(storedUser?.foto || storedUser?.foto_perfil) ? (storedUser?.foto || storedUser?.foto_perfil) : null,
  })

  const [servicios, setServicios] = useState([])
  const [stats, setStats] = useState({
    total: 0,
    activos: 0,
    inactivos: 0,
    incluidos_plan: 0,
  })

  const [loading, setLoading] = useState(true)
  const [errorGlobal, setErrorGlobal] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterEstado, setFilterEstado] = useState('todos') // 'todos' | 'activos' | 'inactivos' | 'plan'

  const [toast, setToast] = useState(null)
  const triggerToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => {
      setToast(null)
    }, 4000)
  }

  // Drawers & Modals
  const [selectedServicio, setSelectedServicio] = useState(null)
  const [showDrawerForm, setShowDrawerForm] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editingId, setEditingId] = useState(null)

  const [formServicio, setFormServicio] = useState({
    nombre: '',
    descripcion: '',
    precio_base: '',
    precio_afiliado: '',
    incluido_en_plan: false,
    limite_mensual_incluido: '',
    activo: true,
  })

  const [submittingForm, setSubmittingForm] = useState(false)
  const [formError, setFormError] = useState('')

const DEFAULT_SERVICIOS_CATALOG = [
  {
    id_servicio: 1,
    nombre: 'Consulta General',
    descripcion: 'Evaluación integral del estado de salud de tu mascota con diagnóstico y plan de tratamiento personalizado.',
    precio_base: 70000,
    precio_afiliado: 0,
    incluido_en_plan: true,
    activo: true,
    limite_mensual_incluido: 3,
  },
  {
    id_servicio: 2,
    nombre: 'Vacunación',
    descripcion: 'Esquema completo de vacunas para perros y gatos según edad, raza y estilo de vida.',
    precio_base: 75000,
    precio_afiliado: 20000,
    incluido_en_plan: true,
    activo: true,
    limite_mensual_incluido: null,
  },
  {
    id_servicio: 3,
    nombre: 'Desparasitación',
    descripcion: 'Tratamiento interno y externo contra parásitos adaptado al peso, edad y hábitos de tu mascota.',
    precio_base: 55000,
    precio_afiliado: 20000,
    incluido_en_plan: true,
    activo: true,
    limite_mensual_incluido: null,
  },
  {
    id_servicio: 4,
    nombre: 'Urgencias & Cuidados Críticos',
    descripcion: 'Atención médica veterinaria prioritaria y de emergencia 24/7 para estabilización e intervenciones requeridas.',
    precio_base: 120000,
    precio_afiliado: 50000,
    incluido_en_plan: false,
    activo: true,
    limite_mensual_incluido: null,
  },
  {
    id_servicio: 5,
    nombre: 'Exámenes & Diagnóstico (Laboratorio)',
    descripcion: 'Análisis de sangre, orina, coprológicos y profilaxis para diagnóstico preciso de patologías.',
    precio_base: 110000,
    precio_afiliado: 45000,
    incluido_en_plan: false,
    activo: true,
    limite_mensual_incluido: null,
  },
  {
    id_servicio: 6,
    nombre: 'Odontología Veterinaria',
    descripcion: 'Profilaxis dental profesional, extracciones y tratamiento de enfermedades periodontales.',
    precio_base: 180000,
    precio_afiliado: 80000,
    incluido_en_plan: false,
    activo: true,
    limite_mensual_incluido: null,
  },
  {
    id_servicio: 7,
    nombre: 'Cirugía Veterinaria',
    descripcion: 'Procedimientos quirúrgicos generales y especializados con anestesia inhalada y monitoreo constante.',
    precio_base: 450000,
    precio_afiliado: 200000,
    incluido_en_plan: false,
    activo: true,
    limite_mensual_incluido: null,
  },
]

  // Cargar catálogo de servicios
  const fetchServiciosData = async () => {
    const token = getStoredToken()
    if (!token) {
      navigate('/login')
      return
    }

    try {
      setLoading(true)
      setErrorGlobal('')

      const res = await fetch(`${import.meta.env.VITE_API_URL}/admin/servicios`, {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      })

      if (res.status === 401 || res.status === 403) {
        navigate('/login')
        return
      }

      if (res.ok) {
        const data = await res.json()
        const fetchedList = data.servicios && data.servicios.length > 0 ? data.servicios : DEFAULT_SERVICIOS_CATALOG
        setServicios(fetchedList)
        setStats({
          total: fetchedList.length,
          activos: fetchedList.filter((s) => s.activo).length,
          inactivos: fetchedList.filter((s) => !s.activo).length,
          incluidos_plan: fetchedList.filter((s) => s.incluido_en_plan).length,
        })
      } else {
        setServicios(DEFAULT_SERVICIOS_CATALOG)
        setStats({
          total: DEFAULT_SERVICIOS_CATALOG.length,
          activos: DEFAULT_SERVICIOS_CATALOG.filter((s) => s.activo).length,
          inactivos: DEFAULT_SERVICIOS_CATALOG.filter((s) => !s.activo).length,
          incluidos_plan: DEFAULT_SERVICIOS_CATALOG.filter((s) => s.incluido_en_plan).length,
        })
      }
    } catch (err) {
      console.error('Error al obtener servicios:', err)
      setServicios(DEFAULT_SERVICIOS_CATALOG)
      setStats({
        total: DEFAULT_SERVICIOS_CATALOG.length,
        activos: DEFAULT_SERVICIOS_CATALOG.filter((s) => s.activo).length,
        inactivos: DEFAULT_SERVICIOS_CATALOG.filter((s) => !s.activo).length,
        incluidos_plan: DEFAULT_SERVICIOS_CATALOG.filter((s) => s.incluido_en_plan).length,
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchServiciosData()
  }, [navigate])

  // Abrir Formulario Crear
  const handleOpenCreate = () => {
    setIsEditing(false)
    setEditingId(null)
    setFormError('')
    setFormServicio({
      nombre: '',
      descripcion: '',
      precio_base: '',
      precio_afiliado: '',
      incluido_en_plan: false,
      limite_mensual_incluido: '',
      activo: true,
    })
    setShowDrawerForm(true)
  }

  // Abrir Formulario Editar
  const handleOpenEdit = (servicio) => {
    setIsEditing(true)
    setEditingId(servicio.id_servicio)
    setFormError('')
    setFormServicio({
      nombre: servicio.nombre || '',
      descripcion: servicio.descripcion || '',
      precio_base: servicio.precio_base !== null && servicio.precio_base !== undefined ? String(servicio.precio_base) : '',
      precio_afiliado: servicio.precio_afiliado !== null && servicio.precio_afiliado !== undefined ? String(servicio.precio_afiliado) : '',
      incluido_en_plan: Boolean(servicio.incluido_en_plan),
      limite_mensual_incluido: servicio.limite_mensual_incluido !== null && servicio.limite_mensual_incluido !== undefined ? String(servicio.limite_mensual_incluido) : '',
      activo: Boolean(servicio.activo),
    })
    setShowDrawerForm(true)
  }

  // Alternar Estado Activo / Inactivo
  const handleToggleActivo = async (id_servicio) => {
    const token = getStoredToken()
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/admin/servicios/${id_servicio}/toggle-activo`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      })

      if (res.ok) {
        const data = await res.json()
        triggerToast(data.message, 'success')
        fetchServiciosData()
      } else {
        triggerToast('No se pudo cambiar el estado del servicio.', 'error')
      }
    } catch (err) {
      console.error('Error al cambiar estado de servicio:', err)
      triggerToast('Error de conexión al cambiar el estado del servicio.', 'error')
    }
  }

  // Guardar (Crear o Editar)
  const handleSubmitForm = async (e) => {
    e.preventDefault()
    setFormError('')

    if (!formServicio.nombre.trim()) {
      setFormError('El nombre del servicio es obligatorio.')
      return
    }

    if (!formServicio.precio_base || parseFloat(formServicio.precio_base) < 0) {
      setFormError('Ingresa un precio base válido igual o mayor a $0.')
      return
    }

    const token = getStoredToken()
    setSubmittingForm(true)

    try {
      const url = isEditing
        ? `${import.meta.env.VITE_API_URL}/admin/servicios/${editingId}`
        : `${import.meta.env.VITE_API_URL}/admin/servicios`

      const payload = {
        nombre: formServicio.nombre.trim(),
        descripcion: formServicio.descripcion.trim() || null,
        precio_base: parseFloat(formServicio.precio_base),
        precio_afiliado: formServicio.precio_afiliado !== '' ? parseFloat(formServicio.precio_afiliado) : null,
        incluido_en_plan: formServicio.incluido_en_plan,
        limite_mensual_incluido: formServicio.limite_mensual_incluido !== '' ? parseInt(formServicio.limite_mensual_incluido, 10) : null,
        activo: formServicio.activo,
      }

      const res = await fetch(url, {
        method: isEditing ? 'PUT' : 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(payload),
      })

      if (res.ok || res.status === 201) {
        setShowDrawerForm(false)
        triggerToast(
          isEditing ? 'Servicio actualizado correctamente.' : 'Nuevo servicio agregado al catálogo.',
          'success'
        )
        fetchServiciosData()
      } else {
        const errData = await res.json().catch(() => ({}))
        const firstErr = errData.errors ? Object.values(errData.errors)[0][0] : errData.message
        setFormError(firstErr || 'Error al guardar el servicio.')
      }
    } catch (err) {
      console.error('Error al guardar servicio:', err)
      setFormError('Error de red al conectar con el servidor.')
    } finally {
      setSubmittingForm(false)
    }
  }

  // Filtrado de la tabla
  const searchLower = searchTerm.toLowerCase().trim()
  const serviciosFiltrados = servicios.filter((s) => {
    if (filterEstado === 'activos' && !s.activo) return false
    if (filterEstado === 'inactivos' && s.activo) return false
    if (filterEstado === 'plan' && !s.incluido_en_plan) return false

    if (!searchLower) return true

    return (
      s.nombre.toLowerCase().includes(searchLower) ||
      s.descripcion.toLowerCase().includes(searchLower) ||
      String(s.id_servicio).includes(searchLower)
    )
  })

  return (
    <div className="dash">
      <SidebarAdmin />

      {/* Toast Notification */}
      {toast && (
        <div className={`adm-toast ${toast.type === 'error' ? 'adm-toast--error' : ''}`}>
          <i className={`adm-toast__icon fa-solid ${toast.type === 'error' ? 'fa-triangle-exclamation' : 'fa-circle-check'}`}></i>
          <span>{toast.message}</span>
          <button className="adm-toast__close" onClick={() => setToast(null)} title="Cerrar">
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>
      )}

      <main className="dash-main">
        <DashboardHeader
          title="Servicios Médicos"
          subtitle="Administra el catálogo de servicios clínicos, tarifas particulares y coberturas del plan EPS"
          usuario={usuario}
        />

        {errorGlobal && (
          <div className="dash-alert dash-alert--danger" style={{ marginBottom: '1.5rem' }}>
            <i className="fa-solid fa-triangle-exclamation"></i>
            <span>{errorGlobal}</span>
          </div>
        )}

        {/* ── 4 TARJETAS MÉTRICAS ── */}
        <div className="admin-dash-grid-4">
          <div className="admin-stat-card">
            <div className="admin-stat-card__info">
              <span className="admin-stat-card__title" style={{ color: '#059669', fontWeight: 700, fontSize: '0.86rem' }}>Total Servicios</span>
              <h3>{loading ? '...' : stats.total}</h3>
              <div className="admin-trend-badge admin-trend-badge--positive">
                <i className="fa-solid fa-stethoscope"></i>
                <span>Catálogo Médico</span>
              </div>
            </div>
            <div className="admin-stat-card__icon admin-stat-card__icon--green">
              <i className="fa-solid fa-stethoscope"></i>
            </div>
          </div>

          <div className="admin-stat-card">
            <div className="admin-stat-card__info">
              <span className="admin-stat-card__title" style={{ color: '#0284c7', fontWeight: 700, fontSize: '0.86rem' }}>Servicios Activos</span>
              <h3>{loading ? '...' : stats.activos}</h3>
              <div className="admin-trend-badge admin-trend-badge--positive">
                <i className="fa-solid fa-circle-check"></i>
                <span>Disponibles en Agenda</span>
              </div>
            </div>
            <div className="admin-stat-card__icon admin-stat-card__icon--blue">
              <i className="fa-solid fa-circle-check"></i>
            </div>
          </div>

          <div className="admin-stat-card">
            <div className="admin-stat-card__info">
              <span className="admin-stat-card__title" style={{ color: '#d97706', fontWeight: 700, fontSize: '0.86rem' }}>Incluidos en Plan EPS</span>
              <h3>{loading ? '...' : stats.incluidos_plan}</h3>
              <div className="admin-trend-badge admin-trend-badge--positive">
                <i className="fa-solid fa-shield-heart"></i>
                <span>Cobertura Afiliados</span>
              </div>
            </div>
            <div className="admin-stat-card__icon admin-stat-card__icon--amber">
              <i className="fa-solid fa-shield-heart"></i>
            </div>
          </div>

          <div className="admin-stat-card">
            <div className="admin-stat-card__info">
              <span className="admin-stat-card__title" style={{ color: '#64748b', fontWeight: 700, fontSize: '0.86rem' }}>Inactivos</span>
              <h3>{loading ? '...' : stats.inactivos}</h3>
              <div className="admin-trend-badge admin-trend-badge--positive" style={{ color: '#64748b', background: '#f1f5f9', borderColor: '#cbd5e1' }}>
                <i className="fa-solid fa-eye-slash"></i>
                <span>Deshabilitados</span>
              </div>
            </div>
            <div className="admin-stat-card__icon" style={{ background: '#f1f5f9', color: '#64748b', border: '1px solid #cbd5e1' }}>
              <i className="fa-solid fa-eye-slash"></i>
            </div>
          </div>
        </div>

        {/* ── BARRA DE HERRAMIENTAS: BÚSQUEDA Y BOTÓN NUEVO SERVICIO ── */}
        <div className="adm-toolbar">
          <div className="adm-toolbar__search">
            <i className="fa-solid fa-magnifying-glass search-icon"></i>
            <input
              type="text"
              placeholder="Buscar servicio por nombre o descripción..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button type="button" className="clear-btn" onClick={() => setSearchTerm('')}>
                <i className="fa-solid fa-xmark"></i>
              </button>
            )}
          </div>

          <div className="adm-toolbar__filters">
            <div className="adm-filter-group">
              <label>Filtrar:</label>
              <select value={filterEstado} onChange={(e) => setFilterEstado(e.target.value)}>
                <option value="todos">Todos los servicios</option>
                <option value="activos">Solo Activos</option>
                <option value="inactivos">Solo Inactivos</option>
                <option value="plan">Incluidos en Plan EPS</option>
              </select>
            </div>

            <button type="button" className="adm-btn-primary" onClick={handleOpenCreate}>
              <i className="fa-solid fa-plus" style={{ marginRight: '6px' }}></i>
              Nuevo Servicio
            </button>
          </div>
        </div>

        {/* ── TABLA DE SERVICIOS ── */}
        <div className="admin-card">
          <div className="admin-card__header">
            <div className="admin-card__title">
              <div className="admin-card__title-icon" style={{ background: '#ecfdf5', color: '#047857' }}>
                <i className="fa-solid fa-stethoscope"></i>
              </div>
              <h3>Catálogo de Servicios Clínicos</h3>
            </div>
            <span style={{ fontSize: '0.82rem', color: '#64748b', fontWeight: 600 }}>
              {serviciosFiltrados.length} Mostrados
            </span>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
              <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: '1.8rem', color: '#059669', marginBottom: '0.5rem' }}></i>
              <p>Cargando catálogo de servicios...</p>
            </div>
          ) : serviciosFiltrados.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
              <i className="fa-solid fa-notes-medical" style={{ fontSize: '2rem', color: '#cbd5e1', marginBottom: '0.5rem' }}></i>
              <p>No se encontraron servicios médicos con esos criterios de búsqueda.</p>
            </div>
          ) : (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>SERVICIO</th>
                    <th>TARIFA PARTICULAR</th>
                    <th>TARIFA AFILIADO / EPS</th>
                    <th>COBERTURA PLAN</th>
                    <th>ESTADO</th>
                    <th style={{ textAlign: 'center' }}>ACCIONES</th>
                  </tr>
                </thead>
                <tbody>
                  {serviciosFiltrados.map((s) => (
                    <tr key={s.id_servicio}>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <strong style={{ fontWeight: 600, color: '#0f172a', fontSize: '0.94rem' }}>{s.nombre}</strong>
                          <span style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.15rem', maxWidth: '380px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {s.descripcion || 'Sin descripción detallada registrada.'}
                          </span>
                        </div>
                      </td>
                      <td>
                        <span style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.94rem' }}>
                          ${Number(s.precio_base).toLocaleString('es-CO')} COP
                        </span>
                      </td>
                      <td>
                        {s.precio_afiliado !== null ? (
                          <span style={{ fontWeight: 600, color: '#059669', fontSize: '0.9rem' }}>
                            ${Number(s.precio_afiliado).toLocaleString('es-CO')} COP (Copago)
                          </span>
                        ) : s.incluido_en_plan ? (
                          <span className="cita-tag-badge cita-tag-badge--asistio">
                            <i className="fa-solid fa-check"></i> $0 COP (CUBIERTO 100%)
                          </span>
                        ) : (
                          <span style={{ fontSize: '0.82rem', color: '#64748b', fontStyle: 'italic' }}>
                            Misma tarifa particular
                          </span>
                        )}
                      </td>
                      <td>
                        {s.incluido_en_plan ? (
                          <span className="species-pill species-pill--canino" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <i className="fa-solid fa-shield-heart"></i>
                            Incluido {s.limite_mensual_incluido ? `(${s.limite_mensual_incluido}/mes)` : 'Ilimitado'}
                          </span>
                        ) : (
                          <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>No incluido</span>
                        )}
                      </td>
                      <td>
                        <button
                          type="button"
                          onClick={() => handleToggleActivo(s.id_servicio)}
                          className={`act-btn ${s.activo ? 'act-btn--view' : ''}`}
                          style={{
                            padding: '0.25rem 0.65rem',
                            borderRadius: '20px',
                            fontSize: '0.78rem',
                            fontWeight: 600,
                            background: s.activo ? '#ecfdf5' : '#f1f5f9',
                            color: s.activo ? '#047857' : '#64748b',
                            border: `1px solid ${s.activo ? '#a7f3d0' : '#cbd5e1'}`,
                            cursor: 'pointer',
                          }}
                          title="Haz clic para cambiar estado"
                        >
                          <i className={`fa-solid ${s.activo ? 'fa-circle-check' : 'fa-circle-xmark'}`} style={{ marginRight: '4px' }}></i>
                          {s.activo ? 'Activo' : 'Inactivo'}
                        </button>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <div className="action-buttons-group">
                          <button
                            type="button"
                            className="act-btn act-btn--view"
                            title="Ver Detalle"
                            onClick={() => setSelectedServicio(s)}
                          >
                            <i className="fa-regular fa-eye"></i>
                          </button>
                          <button
                            type="button"
                            className="act-btn act-btn--edit"
                            title="Editar Servicio"
                            onClick={() => handleOpenEdit(s)}
                          >
                            <i className="fa-solid fa-pen"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* ── MODAL DETALLE DE SERVICIO ── */}
      {selectedServicio && (
        <div className="dh-modal-backdrop" onClick={() => setSelectedServicio(null)}>
          <div className="dh-modal-box" style={{ maxWidth: '480px', padding: 0, overflow: 'hidden', borderRadius: '20px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <span className="pet-badge-count" style={{ fontSize: '0.8rem', fontWeight: 600 }}>
                  Servicio #{selectedServicio.id_servicio}
                </span>
                <span
                  style={{
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    padding: '0.2rem 0.6rem',
                    borderRadius: '6px',
                    background: selectedServicio.activo ? '#ecfdf5' : '#f1f5f9',
                    color: selectedServicio.activo ? '#047857' : '#64748b',
                    border: `1px solid ${selectedServicio.activo ? '#a7f3d0' : '#cbd5e1'}`,
                  }}
                >
                  {selectedServicio.activo ? 'Activo' : 'Inactivo'}
                </span>
              </div>
              <button
                type="button"
                className="dh-modal-close"
                onClick={() => setSelectedServicio(null)}
                style={{ background: '#f1f5f9', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <i className="fa-solid fa-xmark" style={{ fontSize: '0.9rem', color: '#64748b' }}></i>
              </button>
            </div>

            <div style={{ padding: '1.5rem' }}>
              <div style={{ background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)', padding: '1.2rem', borderRadius: '16px', border: '1px solid #a7f3d0', marginBottom: '1.25rem' }}>
                <h3 style={{ margin: '0 0 0.4rem 0', fontFamily: "'Sora', sans-serif", fontSize: '1.2rem', fontWeight: 700, color: '#064e3b' }}>
                  {selectedServicio.nombre}
                </h3>
                <p style={{ margin: 0, fontSize: '0.88rem', color: '#047857', lineHeight: '1.45' }}>
                  {selectedServicio.descripcion || 'Sin descripción detallada.'}
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '0.9rem 1rem' }}>
                  <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600, display: 'block', marginBottom: '0.2rem' }}>TARIFA PARTICULAR</span>
                  <strong style={{ fontSize: '1.1rem', color: '#0f172a', fontWeight: 700 }}>
                    ${Number(selectedServicio.precio_base).toLocaleString('es-CO')} COP
                  </strong>
                </div>

                <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '0.9rem 1rem' }}>
                  <span style={{ fontSize: '0.78rem', color: '#059669', fontWeight: 600, display: 'block', marginBottom: '0.2rem' }}>TARIFA AFILIADO EPS</span>
                  <strong style={{ fontSize: '1.1rem', color: '#059669', fontWeight: 700 }}>
                    {selectedServicio.precio_afiliado !== null
                      ? `$${Number(selectedServicio.precio_afiliado).toLocaleString('es-CO')} COP`
                      : selectedServicio.incluido_en_plan
                      ? '$0 COP (Incluido)'
                      : 'Sin Descuento'}
                  </strong>
                </div>
              </div>

              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '0.9rem 1rem' }}>
                <span style={{ fontSize: '0.8rem', color: '#334155', fontWeight: 600, display: 'block', marginBottom: '0.25rem' }}>
                  <i className="fa-solid fa-shield-heart" style={{ color: '#059669', marginRight: '6px' }}></i>
                  Cobertura Plan de Afiliación EPS:
                </span>
                <span style={{ fontSize: '0.85rem', color: '#475569' }}>
                  {selectedServicio.incluido_en_plan
                    ? `Incluido sin costo adicional${selectedServicio.limite_mensual_incluido ? ` (Hasta ${selectedServicio.limite_mensual_incluido} por mes)` : ' (Ilimitado)'}.`
                    : 'Este servicio requiere pago de tarifa particular o copago estándar.'}
                </span>
              </div>
            </div>

            <div style={{ padding: '1rem 1.5rem 1.25rem', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', background: '#fafafa' }}>
              <button
                type="button"
                className="adm-btn-secondary"
                onClick={() => {
                  const s = selectedServicio
                  setSelectedServicio(null)
                  handleOpenEdit(s)
                }}
              >
                <i className="fa-solid fa-pen" style={{ marginRight: '6px' }}></i> Editar
              </button>
              <button type="button" className="btn-primary-adm" onClick={() => setSelectedServicio(null)}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── DRAWER LATERAL: CREAR / EDITAR SERVICIO ── */}
      {showDrawerForm && (
        <div className="adm-drawer-overlay" onClick={() => setShowDrawerForm(false)}>
          <div className="adm-drawer-panel" onClick={(e) => e.stopPropagation()}>
            <div className="adm-drawer-header">
              <div className="adm-drawer-header__title-group">
                <div className="adm-drawer-header__icon">
                  <i className="fa-solid fa-stethoscope"></i>
                </div>
                <div>
                  <h3>{isEditing ? 'Editar Servicio Médico' : 'Crear Nuevo Servicio'}</h3>
                  <span className="adm-drawer-header__sub">
                    Configura el nombre, tarifas y beneficios de afiliación
                  </span>
                </div>
              </div>
              <button type="button" className="adm-drawer-close" onClick={() => setShowDrawerForm(false)} title="Cerrar">
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <form onSubmit={handleSubmitForm} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
              <div className="adm-drawer-body">
                {formError && (
                  <div className="dash-alert dash-alert--danger" style={{ marginBottom: '1.2rem' }}>
                    <i className="fa-solid fa-circle-exclamation"></i>
                    <span>{formError}</span>
                  </div>
                )}

                <div className="adm-form-section">
                  <h5 className="adm-form-section-title">Información Básica</h5>

                  <div className="adm-form-group">
                    <label>Nombre del Servicio *</label>
                    <div className="adm-input-wrap">
                      <i className="fa-solid fa-heading input-icon"></i>
                      <input
                        type="text"
                        required
                        placeholder="Ej. Consulta Veterinaria General, Ecografía..."
                        value={formServicio.nombre}
                        onChange={(e) => setFormServicio({ ...formServicio, nombre: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="adm-form-group">
                    <label>Descripción del Servicio</label>
                    <textarea
                      rows="3"
                      className="adm-textarea"
                      placeholder="Detalla qué incluye la atención clínica, requisitos previa cita..."
                      value={formServicio.descripcion}
                      onChange={(e) => setFormServicio({ ...formServicio, descripcion: e.target.value })}
                    ></textarea>
                  </div>
                </div>

                <div className="adm-form-section">
                  <h5 className="adm-form-section-title">Tarifas y Cobertura</h5>

                  <div className="form-row-2">
                    <div className="adm-form-group">
                      <label>Precio Base Particular ($ COP) *</label>
                      <div className="adm-input-wrap">
                        <i className="fa-solid fa-dollar-sign input-icon"></i>
                        <input
                          type="number"
                          step="1000"
                          min="0"
                          required
                          placeholder="Ej. 70000"
                          value={formServicio.precio_base}
                          onChange={(e) => setFormServicio({ ...formServicio, precio_base: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="adm-form-group">
                      <label>Copago Afiliado ($ COP)</label>
                      <div className="adm-input-wrap">
                        <i className="fa-solid fa-tag input-icon"></i>
                        <input
                          type="number"
                          step="1000"
                          min="0"
                          placeholder="Dejar vacío si es $0 o sin descuento"
                          value={formServicio.precio_afiliado}
                          onChange={(e) => setFormServicio({ ...formServicio, precio_afiliado: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="adm-form-group" style={{ marginTop: '0.5rem' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={formServicio.incluido_en_plan}
                        onChange={(e) => setFormServicio({ ...formServicio, incluido_en_plan: e.target.checked })}
                        style={{ width: '18px', height: '18px', accentColor: '#059669' }}
                      />
                      <span style={{ fontWeight: 600, color: '#1e293b' }}>
                        Servicio Incluido 100% en el Plan de Afiliación EPS (Sin Copago)
                      </span>
                    </label>
                  </div>

                  {formServicio.incluido_en_plan && (
                    <div className="adm-form-group" style={{ marginTop: '0.75rem' }}>
                      <label>Límite Mensual de Cobertura (Opcional)</label>
                      <div className="adm-input-wrap">
                        <i className="fa-solid fa-hashtag input-icon"></i>
                        <input
                          type="number"
                          min="1"
                          placeholder="Dejar vacío para cobertura ilimitada"
                          value={formServicio.limite_mensual_incluido}
                          onChange={(e) => setFormServicio({ ...formServicio, limite_mensual_incluido: e.target.value })}
                        />
                      </div>
                    </div>
                  )}

                  <div className="adm-form-group" style={{ marginTop: '1rem' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={formServicio.activo}
                        onChange={(e) => setFormServicio({ ...formServicio, activo: e.target.checked })}
                        style={{ width: '18px', height: '18px', accentColor: '#059669' }}
                      />
                      <span style={{ fontWeight: 600, color: '#1e293b' }}>
                        Servicio Activo en la Plataforma
                      </span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="adm-drawer-footer">
                <button type="button" className="adm-btn-secondary" onClick={() => setShowDrawerForm(false)}>
                  Cancelar
                </button>
                <button type="submit" className="adm-btn-primary" disabled={submittingForm}>
                  {submittingForm ? (
                    <>
                      <i className="fa-solid fa-spinner fa-spin" style={{ marginRight: '6px' }}></i>
                      <span>Guardando...</span>
                    </>
                  ) : (
                    <span>Guardar Cambios</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
