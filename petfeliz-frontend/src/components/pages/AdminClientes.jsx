// src/components/pages/AdminClientes.jsx
import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getStoredToken, getStoredUser, isValidAvatarUrl } from '../../utils/authStorage'
import SidebarAdmin from '../ui/SidebarAdmin'
import DashboardHeader from '../ui/DashboardHeader'
import UserAvatar from '../ui/UserAvatar'
import './DashboardClient.css'
import './AdminDashboard.css'
import './AdminCitas.css'
import './AdminMascotas.css'

export default function AdminClientes() {
  const navigate = useNavigate()
  const storedUser = getStoredUser()

  const [usuario] = useState({
    nombre: storedUser?.nombre || 'Administrador',
    nombreCompleto: storedUser?.nombreCompleto || 'Director Administrativo',
    foto: isValidAvatarUrl(storedUser?.foto || storedUser?.foto_perfil) ? (storedUser?.foto || storedUser?.foto_perfil) : null,
  })

  const [clientes, setClientes] = useState([])
  const [stats, setStats] = useState({
    total: 0,
    afiliados: 0,
    en_mora: 0,
    desafiliados: 0,
  })

  const [loading, setLoading] = useState(true)
  const [errorGlobal, setErrorGlobal] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterAfiliacion, setFilterAfiliacion] = useState('todos') // 'todos' | 'afiliados' | 'en_mora' | 'desafiliados'

  // Toast Flotante
  const [toast, setToast] = useState(null)
  const triggerToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => {
      setToast(null)
    }, 4000)
  }

  // Drawers & Modals
  const [selectedFicha, setSelectedFicha] = useState(null)
  const [loadingFicha, setLoadingFicha] = useState(false)
  const [fichaTab, setFichaTab] = useState('resumen') // 'resumen' | 'mascotas' | 'citas'

  const [showModalEdit, setShowModalEdit] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [formCliente, setFormCliente] = useState({
    nombre: '',
    telefono: '',
    direccion: '',
    cedula: '',
    fecha_nacimiento: '',
    departamento: '',
    ciudad: '',
    contacto_emergencia_nombre: '',
    contacto_emergencia_telefono: '',
    es_afiliado: false,
  })

  const [submittingForm, setSubmittingForm] = useState(false)
  const [formError, setFormError] = useState('')

  // Cargar Clientes
  const fetchClientesData = async () => {
    const token = getStoredToken()
    if (!token) {
      navigate('/login')
      return
    }

    try {
      setLoading(true)
      setErrorGlobal('')

      const res = await fetch(`${import.meta.env.VITE_API_URL}/admin/clientes`, {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      })

      if (res.status === 401 || res.status === 403) {
        navigate('/login')
        return
      }

      if (res.ok) {
        const data = await res.json()
        setClientes(data.clientes || [])
        if (data.stats) {
          setStats(data.stats)
        }
      } else {
        setErrorGlobal('No se pudo cargar el listado de clientes.')
      }
    } catch (err) {
      console.error('Error al cargar clientes:', err)
      setErrorGlobal('Error de conexión con el servidor.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchClientesData()
  }, [navigate])

  // Abrir Ficha de Cliente
  const handleOpenFicha = async (id_cliente) => {
    const token = getStoredToken()
    setFichaTab('resumen')
    setLoadingFicha(true)
    setSelectedFicha(null)

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/admin/clientes/${id_cliente}`, {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      })

      if (res.ok) {
        const data = await res.json()
        setSelectedFicha(data)
      } else {
        triggerToast('No se pudo cargar la información detallada del cliente.', 'error')
      }
    } catch (err) {
      console.error('Error al abrir expediente de cliente:', err)
      triggerToast('Error de red al consultar expediente.', 'error')
    } finally {
      setLoadingFicha(false)
    }
  }

  // Abrir Formulario Editar
  const handleOpenEdit = (cliente) => {
    setEditingId(cliente.id_cliente)
    setFormError('')
    setFormCliente({
      nombre: cliente.nombre || '',
      telefono: cliente.telefono || '',
      direccion: cliente.direccion || '',
      cedula: cliente.cedula || '',
      fecha_nacimiento: cliente.fecha_nacimiento || '',
      departamento: cliente.departamento || '',
      ciudad: cliente.ciudad || '',
      contacto_emergencia_nombre: cliente.contacto_emergencia_nombre || '',
      contacto_emergencia_telefono: cliente.contacto_emergencia_telefono || '',
      es_afiliado: Boolean(cliente.es_afiliado),
    })
    setShowModalEdit(true)
  }

  // Submit Editar
  const handleSubmitForm = async (e) => {
    e.preventDefault()
    setFormError('')

    if (!formCliente.nombre.trim()) {
      setFormError('El nombre del cliente es obligatorio.')
      return
    }

    if (formCliente.telefono && formCliente.telefono.trim()) {
      if (!/^[0-9]{10}$/.test(formCliente.telefono.trim())) {
        setFormError('El teléfono de contacto debe contener exactamente 10 dígitos numéricos.')
        return
      }
    }

    if (formCliente.contacto_emergencia_telefono && formCliente.contacto_emergencia_telefono.trim()) {
      if (!/^[0-9]{10}$/.test(formCliente.contacto_emergencia_telefono.trim())) {
        setFormError('El teléfono de emergencia debe contener exactamente 10 dígitos numéricos.')
        return
      }
    }

    const token = getStoredToken()
    setSubmittingForm(true)

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/admin/clientes/${editingId}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(formCliente),
      })

      if (res.ok) {
        setShowModalEdit(false)
        triggerToast('Información del cliente actualizada exitosamente.', 'success')
        fetchClientesData()
      } else {
        const errData = await res.json().catch(() => ({}))
        const firstErr = errData.errors ? Object.values(errData.errors)[0][0] : errData.message
        setFormError(firstErr || 'Error al actualizar el cliente.')
      }
    } catch (err) {
      console.error('Error al actualizar cliente:', err)
      setFormError('Error de conexión con el servidor.')
    } finally {
      setSubmittingForm(false)
    }
  }

  // Filtrado
  const searchLower = searchTerm.toLowerCase().trim()
  const clientesFiltrados = clientes.filter((c) => {
    if (filterAfiliacion === 'afiliados' && (!c.es_afiliado || c.estado_afiliacion !== 'al_dia')) return false
    if (filterAfiliacion === 'en_mora' && c.estado_afiliacion !== 'en_mora') return false
    if (filterAfiliacion === 'desafiliados' && c.es_afiliado) return false

    if (!searchLower) return true

    return (
      c.nombre.toLowerCase().includes(searchLower) ||
      c.email.toLowerCase().includes(searchLower) ||
      c.telefono.toLowerCase().includes(searchLower) ||
      c.cedula.toLowerCase().includes(searchLower) ||
      c.ciudad.toLowerCase().includes(searchLower) ||
      String(c.id_cliente).includes(searchLower)
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
          title="Clientes & Afiliados"
          subtitle="Consulta la base de clientes registrados, su grupo familiar de mascotas y estado de su afiliación"
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
              <span className="admin-stat-card__title" style={{ color: '#059669', fontWeight: 700, fontSize: '0.86rem' }}>Total Clientes</span>
              <h3>{loading ? '...' : stats.total}</h3>
              <div className="admin-trend-badge admin-trend-badge--positive">
                <i className="fa-solid fa-users"></i>
                <span>Cuidadores Registrados</span>
              </div>
            </div>
            <div className="admin-stat-card__icon admin-stat-card__icon--green">
              <i className="fa-solid fa-users"></i>
            </div>
          </div>

          <div className="admin-stat-card">
            <div className="admin-stat-card__info">
              <span className="admin-stat-card__title" style={{ color: '#0284c7', fontWeight: 700, fontSize: '0.86rem' }}>Afiliados Al Día</span>
              <h3>{loading ? '...' : stats.afiliados}</h3>
              <div className="admin-trend-badge admin-trend-badge--positive">
                <i className="fa-solid fa-circle-check"></i>
                <span>Cobertura EPS Activa</span>
              </div>
            </div>
            <div className="admin-stat-card__icon admin-stat-card__icon--blue">
              <i className="fa-solid fa-shield-halved"></i>
            </div>
          </div>

          <div className="admin-stat-card">
            <div className="admin-stat-card__info">
              <span className="admin-stat-card__title" style={{ color: '#d97706', fontWeight: 700, fontSize: '0.86rem' }}>Afiliados en Mora</span>
              <h3>{loading ? '...' : stats.en_mora}</h3>
              <div className="admin-trend-badge admin-trend-badge--positive" style={{ color: '#d97706', background: '#fffbe8', borderColor: '#fde68a' }}>
                <i className="fa-solid fa-clock"></i>
                <span>Periodo de Gracia</span>
              </div>
            </div>
            <div className="admin-stat-card__icon admin-stat-card__icon--amber">
              <i className="fa-solid fa-triangle-exclamation"></i>
            </div>
          </div>

          <div className="admin-stat-card">
            <div className="admin-stat-card__info">
              <span className="admin-stat-card__title" style={{ color: '#7e22ce', fontWeight: 700, fontSize: '0.86rem' }}>No Afiliados</span>
              <h3>{loading ? '...' : stats.desafiliados}</h3>
              <div className="admin-trend-badge admin-trend-badge--positive" style={{ color: '#7e22ce', background: '#f3e8ff', borderColor: '#e9d5ff' }}>
                <i className="fa-solid fa-user-xmark"></i>
                <span>Atención Particular</span>
              </div>
            </div>
            <div className="admin-stat-card__icon" style={{ background: '#f3e8ff', color: '#7e22ce', border: '1px solid #e9d5ff' }}>
              <i className="fa-solid fa-user"></i>
            </div>
          </div>
        </div>

        {/* ── BARRA DE HERRAMIENTAS: BÚSQUEDA Y FILTROS ── */}
        <div className="adm-toolbar">
          <div className="adm-toolbar__search">
            <i className="fa-solid fa-magnifying-glass search-icon"></i>
            <input
              type="text"
              placeholder="Buscar cliente por nombre, email, teléfono, cédula o ciudad..."
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
              <label>Afiliación:</label>
              <select value={filterAfiliacion} onChange={(e) => setFilterAfiliacion(e.target.value)}>
                <option value="todos">Todos los clientes</option>
                <option value="afiliados">Afiliados Al Día</option>
                <option value="en_mora">En Mora</option>
                <option value="desafiliados">No Afiliados (Particulares)</option>
              </select>
            </div>
          </div>
        </div>

        {/* ── TABLA PRINCIPAL DE CLIENTES ── */}
        <div className="admin-card">
          <div className="admin-card__header">
            <div className="admin-card__title">
              <div className="admin-card__title-icon" style={{ background: '#ecfdf5', color: '#047857' }}>
                <i className="fa-solid fa-users"></i>
              </div>
              <h3>Directorio de Clientes</h3>
            </div>
            <span style={{ fontSize: '0.82rem', color: '#64748b', fontWeight: 600 }}>
              {clientesFiltrados.length} Registrados
            </span>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
              <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: '1.8rem', color: '#059669', marginBottom: '0.5rem' }}></i>
              <p>Cargando directorio de clientes...</p>
            </div>
          ) : clientesFiltrados.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
              <i className="fa-solid fa-user-slash" style={{ fontSize: '2rem', color: '#cbd5e1', marginBottom: '0.5rem' }}></i>
              <p>No se encontraron clientes con los criterios ingresados.</p>
            </div>
          ) : (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>CLIENTE</th>
                    <th>CONTACTO</th>
                    <th>DOCUMENTO</th>
                    <th>ESTADO AFILIACIÓN</th>
                    <th>MASCOTAS</th>
                    <th style={{ textAlign: 'center' }}>ACCIONES</th>
                  </tr>
                </thead>
                <tbody>
                  {clientesFiltrados.map((c) => (
                    <tr key={c.id_cliente}>
                      <td>
                        <div className="pet-info-cell">
                          <UserAvatar user={c} size="44px" fontSize="1.15rem" />
                          <div>
                            <strong className="pet-name">{c.nombre}</strong>
                            <span className="pet-meta-sub">
                              ID: #{c.id_cliente} • {c.ciudad || 'Colombia'}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontWeight: 600, color: '#0f172a', fontSize: '0.88rem' }}>{c.email}</span>
                          <span className="admin-table__owner-phone">
                            <i className="fa-solid fa-phone" style={{ marginRight: '4px', fontSize: '0.7rem' }}></i>
                            {c.telefono}
                          </span>
                        </div>
                      </td>
                      <td>
                        <span style={{ fontSize: '0.88rem', color: '#334155', fontWeight: 600 }}>
                          {c.cedula || 'Sin cédula'}
                        </span>
                      </td>
                      <td>
                        {c.es_afiliado ? (
                          c.estado_afiliacion === 'en_mora' ? (
                            <span className="cita-tag-badge cita-tag-badge--urgencia">
                              <i className="fa-solid fa-clock"></i> En Mora ({c.dias_mora} días)
                            </span>
                          ) : (
                            <span className="cita-tag-badge cita-tag-badge--asistio">
                              <i className="fa-solid fa-shield-heart"></i> Afiliado Activo
                            </span>
                          )
                        ) : (
                          <span style={{ fontSize: '0.8rem', color: '#64748b', fontStyle: 'italic' }}>
                            Particular (No Afiliado)
                          </span>
                        )}
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <span className="citas-count-badge">
                            <i className="fa-solid fa-paw"></i> {c.total_mascotas} {c.total_mascotas === 1 ? 'Mascota' : 'Mascotas'}
                          </span>
                        </div>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <div className="action-buttons-group">
                          <button
                            type="button"
                            className="act-btn act-btn--view"
                            title="Ver Expediente de Cliente"
                            onClick={() => handleOpenFicha(c.id_cliente)}
                          >
                            <i className="fa-solid fa-address-card"></i>
                            <span>Expediente</span>
                          </button>
                          <button
                            type="button"
                            className="act-btn act-btn--edit"
                            title="Editar Datos"
                            onClick={() => handleOpenEdit(c)}
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

      {/* ── DRAWER LATERAL: EXPEDIENTE DE CLIENTE ── */}
      {(selectedFicha || loadingFicha) && (
        <div className="adm-drawer-overlay" onClick={() => setSelectedFicha(null)}>
          <div className="adm-drawer-panel" onClick={(e) => e.stopPropagation()}>
            {loadingFicha ? (
              <div style={{ padding: '4rem', textAlign: 'center', color: '#64748b' }}>
                <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: '2rem', color: '#059669', marginBottom: '1rem' }}></i>
                <p>Cargando expediente del cliente...</p>
              </div>
            ) : selectedFicha && (
              <>
                <div className="adm-vet-hero" style={{ background: 'linear-gradient(135deg, #064e3b 0%, #047857 55%, #059669 100%)' }}>
                  <div className="adm-vet-hero__avatar-wrap">
                    <UserAvatar
                      user={selectedFicha.cliente}
                      size="76px"
                      fontSize="2rem"
                      style={{
                        border: '3px solid rgba(255,255,255,0.95)',
                        boxShadow: '0 6px 18px rgba(0,0,0,0.25)',
                      }}
                    />
                  </div>
                  <div className="adm-vet-hero__info">
                    <div className="adm-vet-hero__tag">
                      <i className="fa-solid fa-user-shield"></i>
                      <span>Cliente / Cuidador</span>
                    </div>
                    <h2>{selectedFicha.cliente.nombre}</h2>
                    <div className="adm-vet-hero__tp">
                      <span className="adm-vet-hero__badge">ID #{selectedFicha.cliente.id_cliente}</span>
                      <span className="adm-vet-hero__badge adm-vet-hero__badge--tp">
                        {selectedFicha.cliente.es_afiliado ? 'Afiliado EPS' : 'Cliente Particular'}
                      </span>
                    </div>
                  </div>
                  <button className="adm-drawer-close adm-drawer-close--white" onClick={() => setSelectedFicha(null)} title="Cerrar Expediente">
                    <i className="fa-solid fa-xmark"></i>
                  </button>
                </div>

                <div className="adm-drawer-body">
                  <div className="ficha-tabs">
                    <button
                      type="button"
                      className={`ficha-tab-btn ${fichaTab === 'resumen' ? 'ficha-tab-btn--active' : ''}`}
                      onClick={() => setFichaTab('resumen')}
                    >
                      <i className="fa-solid fa-circle-info"></i> Perfil
                    </button>
                    <button
                      type="button"
                      className={`ficha-tab-btn ${fichaTab === 'mascotas' ? 'ficha-tab-btn--active' : ''}`}
                      onClick={() => setFichaTab('mascotas')}
                    >
                      <i className="fa-solid fa-paw"></i> Mascotas ({selectedFicha.mascotas?.length || 0})
                    </button>
                    <button
                      type="button"
                      className={`ficha-tab-btn ${fichaTab === 'citas' ? 'ficha-tab-btn--active' : ''}`}
                      onClick={() => setFichaTab('citas')}
                    >
                      <i className="fa-regular fa-calendar-check"></i> Historial Citas ({selectedFicha.citas?.length || 0})
                    </button>
                  </div>

                  {/* Pestaña 1: Datos Personales */}
                  {fichaTab === 'resumen' && (
                    <div className="grid-2-col">
                      <div className="info-box">
                        <h4 className="info-box__title"><i className="fa-solid fa-user" style={{ color: '#059669' }}></i> Datos Personales</h4>
                        <ul className="info-list">
                          <li><span>Nombre:</span> <strong>{selectedFicha.cliente.nombre}</strong></li>
                          <li><span>Cédula:</span> <strong>{selectedFicha.cliente.cedula || 'Sin cédula'}</strong></li>
                          <li><span>Correo:</span> <strong>{selectedFicha.cliente.email}</strong></li>
                          <li><span>Teléfono:</span> <strong>{selectedFicha.cliente.telefono || 'Sin teléfono'}</strong></li>
                          <li><span>Dirección:</span> <strong>{selectedFicha.cliente.direccion || 'No registrada'}</strong></li>
                          <li><span>Ciudad / Dpto:</span> <strong>{selectedFicha.cliente.ciudad ? `${selectedFicha.cliente.ciudad}, ${selectedFicha.cliente.departamento}` : 'Colombia'}</strong></li>
                        </ul>
                      </div>

                      <div className="info-box">
                        <h4 className="info-box__title"><i className="fa-solid fa-shield-heart" style={{ color: '#0284c7' }}></i> Afiliación & Contacto Emergencia</h4>
                        <ul className="info-list">
                          <li>
                            <span>Estado EPS:</span>
                            <strong style={{ color: selectedFicha.cliente.es_afiliado ? '#059669' : '#dc2626' }}>
                              {selectedFicha.cliente.es_afiliado ? 'Afiliado Activo' : 'No Afiliado'}
                            </strong>
                          </li>
                          {selectedFicha.cliente.fecha_afiliacion && (
                            <li><span>Fecha Afiliación:</span> <strong>{selectedFicha.cliente.fecha_afiliacion}</strong></li>
                          )}
                          <li><span>Contacto Emergencia:</span> <strong>{selectedFicha.cliente.contacto_emergencia_nombre || 'No registrado'}</strong></li>
                          <li><span>Tel. Emergencia:</span> <strong>{selectedFicha.cliente.contacto_emergencia_telefono || 'No registrado'}</strong></li>
                        </ul>
                      </div>
                    </div>
                  )}

                  {/* Pestaña 2: Mascotas del Cliente */}
                  {fichaTab === 'mascotas' && (
                    <div>
                      {selectedFicha.mascotas && selectedFicha.mascotas.length > 0 ? (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                          {selectedFicha.mascotas.map((m) => (
                            <div key={m.id_mascota} className="vet-paciente-card" style={{ padding: '0.9rem' }}>
                              <div className="vet-paciente-card__top">
                                <img
                                  src={m.foto || 'https://res.cloudinary.com/dedroug6v/image/upload/v1/mascotas/default_pet.jpg'}
                                  alt={m.nombre}
                                  className="vet-paciente-img"
                                  style={{ width: '48px', height: '48px' }}
                                />
                                <div className="vet-paciente-title-wrap">
                                  <h4 style={{ fontSize: '1rem' }}>{m.nombre}</h4>
                                  <span className="vet-paciente-species">
                                    {m.especie} • {m.raza}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
                          <i className="fa-solid fa-paw" style={{ fontSize: '2rem', color: '#cbd5e1', marginBottom: '0.5rem' }}></i>
                          <p>Este cliente no registra mascotas asociadas.</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Pestaña 3: Historial de Citas */}
                  {fichaTab === 'citas' && (
                    <div>
                      {selectedFicha.citas && selectedFicha.citas.length > 0 ? (
                        <div className="citas-history-list">
                          {selectedFicha.citas.map((c) => (
                            <div key={c.id_cita} className="cita-history-item">
                              <div className="cita-history-left">
                                <span className="cita-history-date">{c.fecha_formateada}</span>
                                <span className="cita-history-time">{c.hora}</span>
                              </div>
                              <div className="cita-history-body">
                                <div>
                                  <strong>{c.servicio}</strong>
                                </div>
                                <p className="cita-history-vet">
                                  <i className="fa-solid fa-user-doctor"></i> {c.veterinario}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
                          <i className="fa-regular fa-calendar-xmark" style={{ fontSize: '2rem', color: '#cbd5e1', marginBottom: '0.5rem' }}></i>
                          <p>Este cliente no registra historial de citas de atención.</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="adm-drawer-footer">
                  <button
                    type="button"
                    className="adm-btn-primary"
                    onClick={() => {
                      const target = selectedFicha.cliente
                      setSelectedFicha(null)
                      handleOpenEdit(target)
                    }}
                    style={{ width: '100%', justifyContent: 'center', display: 'flex', alignItems: 'center' }}
                  >
                    <i className="fa-solid fa-pen-to-square" style={{ marginRight: '6px' }}></i>
                    Editar Perfil de Cliente
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── DRAWER LATERAL: EDITAR CLIENTE ── */}
      {showModalEdit && (
        <div className="adm-drawer-overlay" onClick={() => setShowModalEdit(false)}>
          <div className="adm-drawer-panel" onClick={(e) => e.stopPropagation()}>
            <div className="adm-drawer-header">
              <div className="adm-drawer-header__title-group">
                <div className="adm-drawer-header__icon">
                  <i className="fa-solid fa-user-pen"></i>
                </div>
                <div>
                  <h3>Editar Cliente / Cuidador</h3>
                  <span className="adm-drawer-header__sub">
                    Modifica los datos personales y el estado de afiliación EPS
                  </span>
                </div>
              </div>
              <button type="button" className="adm-drawer-close" onClick={() => setShowModalEdit(false)} title="Cerrar">
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
                  <h5 className="adm-form-section-title">Datos Principales</h5>

                  <div className="adm-form-group">
                    <label>Nombre Completo (Datos de Identidad - No Modificable)</label>
                    <div className="adm-input-wrap">
                      <i className="fa-solid fa-user input-icon" style={{ color: '#64748b' }}></i>
                      <input
                        type="text"
                        readOnly
                        disabled
                        style={{ background: '#f8fafc', color: '#64748b', cursor: 'not-allowed', fontWeight: 600 }}
                        value={formCliente.nombre}
                      />
                    </div>
                  </div>

                  <div className="form-row-2">
                    <div className="adm-form-group">
                      <label>Cédula / Documento (No Modificable)</label>
                      <div className="adm-input-wrap">
                        <i className="fa-solid fa-id-card input-icon" style={{ color: '#64748b' }}></i>
                        <input
                          type="text"
                          readOnly
                          disabled
                          style={{ background: '#f8fafc', color: '#64748b', cursor: 'not-allowed', fontWeight: 600 }}
                          value={formCliente.cedula || 'Sin cédula registrada'}
                        />
                      </div>
                    </div>

                    <div className="adm-form-group">
                      <label>Teléfono de Contacto</label>
                      <div className="adm-input-wrap">
                        <i className="fa-solid fa-phone input-icon"></i>
                        <input
                          type="text"
                          placeholder="Ej. 3004567890"
                          value={formCliente.telefono}
                          maxLength={10}
                          onChange={(e) => setFormCliente({ ...formCliente, telefono: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="adm-form-group">
                    <label>Dirección de Residencia</label>
                    <div className="adm-input-wrap">
                      <i className="fa-solid fa-location-dot input-icon"></i>
                      <input
                        type="text"
                        placeholder="Ej. Cl. 33 # 74-20, Laureles"
                        value={formCliente.direccion}
                        onChange={(e) => setFormCliente({ ...formCliente, direccion: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="form-row-2">
                    <div className="adm-form-group">
                      <label>Ciudad</label>
                      <div className="adm-input-wrap">
                        <i className="fa-solid fa-city input-icon"></i>
                        <input
                          type="text"
                          placeholder="Ej. Medellín"
                          value={formCliente.ciudad}
                          onChange={(e) => setFormCliente({ ...formCliente, ciudad: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="adm-form-group">
                      <label>Departamento</label>
                      <div className="adm-input-wrap">
                        <i className="fa-solid fa-map input-icon"></i>
                        <input
                          type="text"
                          placeholder="Ej. Antioquia"
                          value={formCliente.departamento}
                          onChange={(e) => setFormCliente({ ...formCliente, departamento: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="adm-form-section">
                  <h5 className="adm-form-section-title">Contacto de Emergencia & Estado de Afiliación EPS</h5>

                  <div className="form-row-2">
                    <div className="adm-form-group">
                      <label>Nombre Contacto Emergencia</label>
                      <div className="adm-input-wrap">
                        <i className="fa-solid fa-user-clock input-icon"></i>
                        <input
                          type="text"
                          placeholder="Ej. Carlos Mendoza"
                          value={formCliente.contacto_emergencia_nombre}
                          onChange={(e) => setFormCliente({ ...formCliente, contacto_emergencia_nombre: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="adm-form-group">
                      <label>Teléfono Emergencia</label>
                      <div className="adm-input-wrap">
                        <i className="fa-solid fa-phone-volume input-icon"></i>
                        <input
                          type="text"
                          placeholder="Ej. 3119876543"
                          value={formCliente.contacto_emergencia_telefono}
                          maxLength={10}
                          onChange={(e) => setFormCliente({ ...formCliente, contacto_emergencia_telefono: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="adm-form-group" style={{ marginTop: '0.85rem' }}>
                    <label style={{ fontWeight: 600, color: '#1e293b', marginBottom: '0.4rem', display: 'block' }}>
                      Estado de Afiliación & Facturación EPS PetFeliz *
                    </label>
                    <div className="adm-input-wrap">
                      <i className="fa-solid fa-shield-halved input-icon" style={{ color: formCliente.es_afiliado ? '#059669' : '#d97706' }}></i>
                      <select
                        style={{ paddingLeft: '2.5rem', width: '100%', height: '44px', borderRadius: '10px', border: '1px solid #cbd5e1', fontFamily: 'Inter, sans-serif', fontSize: '0.88rem' }}
                        value={formCliente.estado_afiliacion || (formCliente.es_afiliado ? 'afiliado' : 'particular')}
                        onChange={(e) => {
                          const val = e.target.value
                          setFormCliente({
                            ...formCliente,
                            estado_afiliacion: val,
                            es_afiliado: val === 'afiliado' || val === 'en_mora',
                          })
                        }}
                      >
                        <option value="afiliado">🟢 Afiliado Activo (Al Día en Cobertura EPS)</option>
                        <option value="en_mora">🟡 Afiliado en Mora (Periodo de Gracia - Pendiente de Pago)</option>
                        <option value="particular">⚪ Particular (Sin Afiliación Activa - Tarifa Plena)</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              <div className="adm-drawer-footer">
                <button type="button" className="adm-btn-secondary" onClick={() => setShowModalEdit(false)}>
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
