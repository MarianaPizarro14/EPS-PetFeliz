// src/components/pages/AdminRecepcionistas.jsx
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
import './AdminVeterinarios.css'

export default function AdminRecepcionistas() {
  const navigate = useNavigate()
  const storedUser = getStoredUser()

  const [usuario] = useState({
    nombre: storedUser?.nombre || 'Administrador',
    nombreCompleto: storedUser?.nombreCompleto || 'Director Administrativo',
    foto: isValidAvatarUrl(storedUser?.foto || storedUser?.foto_perfil) ? (storedUser?.foto || storedUser?.foto_perfil) : null,
  })

  const [recepcionistas, setRecepcionistas] = useState([])
  const [sedes, setSedes] = useState([])
  const [stats, setStats] = useState({
    total: 0,
    activos: 0,
    inactivos: 0,
  })

  const [loading, setLoading] = useState(true)
  const [errorGlobal, setErrorGlobal] = useState('')
  const [searchTerm, setSearchTerm] = useState('')

  // Toast de confirmación flotante
  const [toast, setToast] = useState(null)
  const triggerToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => {
      setToast(null)
    }, 4000)
  }

  // Modales
  const [showModalForm, setShowModalForm] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editingId, setEditingId] = useState(null)

  const [formRecep, setFormRecep] = useState({
    nombre: '',
    correo: '',
    telefono: '',
    id_sede: '',
    foto_perfil: '',
  })

  const [selectedFile, setSelectedFile] = useState(null)
  const [photoPreview, setPhotoPreview] = useState('')
  const [submittingForm, setSubmittingForm] = useState(false)
  const [formError, setFormError] = useState('')

  // Modal para contraseña temporal
  const [resetRecep, setResetRecep] = useState(null)
  const [showModalReset, setShowModalReset] = useState(false)
  const [submittingReset, setSubmittingReset] = useState(false)
  const [resetSuccessData, setResetSuccessData] = useState(null)
  const [copiedToast, setCopiedToast] = useState(false)

  // Cargar sedes
  const fetchSedes = async () => {
    const token = getStoredToken()
    if (!token) return
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/admin/sedes`, {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      })
      if (res.ok) {
        const data = await res.json()
        setSedes(data.sedes || [])
      }
    } catch (e) {
      console.error('Error al cargar sedes:', e)
    }
  }

  // Cargar recepcionistas
  const fetchRecepcionistas = async () => {
    setLoading(true)
    setErrorGlobal('')
    const token = getStoredToken()

    if (!token) {
      navigate('/login')
      return
    }

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/admin/recepcionistas`, {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      })

      if (res.ok) {
        const data = await res.json()
        const rawList = data.recepcionistas || []
        const filteredList = rawList.filter((r) => {
          const email = (r.correo || '').toLowerCase()
          return !email.includes('admin@petfeliz') && !email.startsWith('vet_')
        })
        setRecepcionistas(filteredList)
        if (data.stats) {
          setStats(data.stats)
        } else {
          setStats({
            total: filteredList.length,
            activos: filteredList.filter((r) => r.activo).length,
            inactivos: filteredList.filter((r) => !r.activo).length,
          })
        }
      } else {
        setErrorGlobal('No se pudo obtener el listado de recepcionistas.')
      }
    } catch (e) {
      console.error('Error al consultar recepcionistas:', e)
      setErrorGlobal('Error de conexión con el servidor.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSedes()
    fetchRecepcionistas()
  }, [])

  // Abrir modal de creación
  const handleOpenCreateModal = () => {
    setIsEditing(false)
    setEditingId(null)
    setFormRecep({
      nombre: '',
      correo: '',
      telefono: '',
      id_sede: sedes.length > 0 ? sedes[0].id_sede : '',
      foto_perfil: '',
    })
    setSelectedFile(null)
    setPhotoPreview('')
    setFormError('')
    setShowModalForm(true)
  }

  // Abrir modal de edición
  const handleOpenEditModal = (r) => {
    setIsEditing(true)
    setEditingId(r.id_recepcionista)
    setFormRecep({
      nombre: r.nombre || '',
      correo: r.correo || '',
      telefono: r.telefono || '',
      id_sede: r.id_sede || (sedes.length > 0 ? sedes[0].id_sede : ''),
      foto_perfil: r.foto_perfil || '',
    })
    setSelectedFile(null)
    setPhotoPreview(r.foto_perfil || '')
    setFormError('')
    setShowModalForm(true)
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (!file) return

    if (!['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type)) {
      setFormError('Solo se permiten imágenes en formato JPG, PNG o WEBP.')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setFormError('La imagen supera el tamaño máximo permitido de 5 MB.')
      return
    }

    setFormError('')
    setSelectedFile(file)
    setPhotoPreview(URL.createObjectURL(file))
  }

  const handleSubmitForm = async (e) => {
    e.preventDefault()
    setSubmittingForm(true)
    setFormError('')

    const token = getStoredToken()
    const formData = new FormData()

    formData.append('nombre', formRecep.nombre.trim())
    formData.append('correo', formRecep.correo.trim())
    formData.append('telefono', formRecep.telefono.trim())
    formData.append('id_sede', formRecep.id_sede)

    if (selectedFile) {
      formData.append('foto', selectedFile)
    }

    const endpoint = isEditing
      ? `${import.meta.env.VITE_API_URL}/admin/recepcionistas/${editingId}`
      : `${import.meta.env.VITE_API_URL}/admin/recepcionistas`

    if (isEditing) {
      formData.append('_method', 'PUT')
    }

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
        body: formData,
      })

      const data = await res.json()

      if (!res.ok) {
        setFormError(data.message || 'Error al procesar la solicitud.')
        return
      }

      triggerToast(
        isEditing
          ? '¡Datos de recepcionista actualizados correctamente!'
          : `¡Recepcionista registrado! Clave temporal: ${data.contrasena_temporal || ''}`,
        'success'
      )
      setShowModalForm(false)
      fetchRecepcionistas()
    } catch (err) {
      console.error(err)
      setFormError('Error de red al intentar guardar los datos.')
    } finally {
      setSubmittingForm(false)
    }
  }

  // Toggle Activo
  const handleToggleActivo = async (r) => {
    const token = getStoredToken()
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/admin/recepcionistas/${r.id_recepcionista}/toggle-activo`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      })
      if (res.ok) {
        const data = await res.json()
        triggerToast(data.message || 'Estado actualizado.', 'success')
        fetchRecepcionistas()
      }
    } catch (e) {
      console.error(e)
    }
  }

  // Reset Password
  const handleConfirmReset = async (r) => {
    const token = getStoredToken()
    setSubmittingReset(true)
    setResetSuccessData(null)

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/admin/recepcionistas/${r.id_recepcionista}/reset-password`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      })
      const data = await res.json()
      if (res.ok && data.success) {
        setResetSuccessData(data)
        triggerToast('¡Contraseña temporal restablecida exitosamente!', 'success')
      }
    } catch (e) {
      console.error(e)
    } finally {
      setSubmittingReset(false)
    }
  }

  // Filtrado de búsqueda
  const filteredRecepcionistas = recepcionistas.filter((r) => {
    if (!searchTerm) return true
    const term = searchTerm.toLowerCase()
    return (
      (r.nombre && r.nombre.toLowerCase().includes(term)) ||
      (r.correo && r.correo.toLowerCase().includes(term)) ||
      (r.telefono && r.telefono.toLowerCase().includes(term)) ||
      (r.sede_nombre && r.sede_nombre.toLowerCase().includes(term))
    )
  })

  return (
    <div className="dash">
      <SidebarAdmin />

      {/* ── TOAST NOTIFICATION FLOTANTE DE CONFIRMACIÓN ── */}
      {toast && (
        <div className={`adm-toast ${toast.type === 'error' ? 'adm-toast--error' : ''}`}>
          <i className={`adm-toast__icon fa-solid ${toast.type === 'error' ? 'fa-triangle-exclamation' : 'fa-circle-check'}`}></i>
          <span>{toast.message}</span>
          <button className="adm-toast__close" onClick={() => setToast(null)} title="Cerrar notificación">
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>
      )}

      <main className="dash-main">
        <DashboardHeader
          title="Gestión de Recepcionistas por Sede"
          subtitle="Administra las cuentas de recepción, asignación de sedes y credenciales de acceso"
          usuario={usuario}
        />

        {/* ── TARJETAS KPI DE ESTADÍSTICAS ── */}
        <div className="admin-dash-grid">
          <div className="admin-stat-card">
            <div className="admin-stat-card__info">
              <span>Total Recepcionistas</span>
              <h3>{loading ? '...' : stats.total}</h3>
              <div className="admin-trend-badge admin-trend-badge--positive">
                <i className="fa-solid fa-id-card"></i>
                <span>Personal de Sedes</span>
              </div>
            </div>
            <div className="admin-stat-card__icon" style={{ background: '#ecfdf5', color: '#047857' }}>
              <i className="fa-solid fa-headset"></i>
            </div>
          </div>

          <div className="admin-stat-card">
            <div className="admin-stat-card__info">
              <span>Cuentas Activas</span>
              <h3>{loading ? '...' : stats.activos}</h3>
              <div className="admin-trend-badge admin-trend-badge--positive">
                <i className="fa-solid fa-user-check"></i>
                <span>Acceso Habilitado</span>
              </div>
            </div>
            <div className="admin-stat-card__icon" style={{ background: '#f0f9ff', color: '#0284c7' }}>
              <i className="fa-solid fa-user-check"></i>
            </div>
          </div>

          <div className="admin-stat-card">
            <div className="admin-stat-card__info">
              <span>Inactivas / Inhabilitadas</span>
              <h3>{loading ? '...' : stats.inactivos}</h3>
              <div className="admin-trend-badge admin-trend-badge--neutral">
                <i className="fa-solid fa-user-xmark"></i>
                <span>Sin Acceso</span>
              </div>
            </div>
            <div className="admin-stat-card__icon" style={{ background: '#fef3c7', color: '#d97706' }}>
              <i className="fa-solid fa-user-xmark"></i>
            </div>
          </div>
        </div>

        {/* ── BARRA DE HERRAMIENTAS: BÚSQUEDA Y NUEVO RECEPCIONISTA ── */}
        <div className="adm-toolbar">
          <div className="adm-toolbar__search">
            <i className="fa-solid fa-magnifying-glass search-icon"></i>
            <input
              type="text"
              placeholder="Buscar por nombre, correo, teléfono o sede..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button className="clear-btn" onClick={() => setSearchTerm('')} title="Limpiar búsqueda">
                <i className="fa-solid fa-xmark"></i>
              </button>
            )}
          </div>

          <div className="adm-toolbar__filters">
            <button
              type="button"
              className="admin-btn-csv"
              onClick={handleOpenCreateModal}
              style={{ height: '42px', padding: '0 1.2rem' }}
            >
              <i className="fa-solid fa-plus"></i>
              <span>Nuevo Recepcionista</span>
            </button>
          </div>
        </div>

        {/* ── TABLA PRINCIPAL DEL PERSONAL DE RECEPCIÓN ── */}
        <div className="admin-card">
          <div className="admin-card__header">
            <div className="admin-card__title">
              <div className="admin-card__title-icon" style={{ background: '#ecfdf5', color: '#047857' }}>
                <i className="fa-solid fa-headset"></i>
              </div>
              <h3>Listado de Personal de Recepción</h3>
            </div>
            <span style={{ fontSize: '0.82rem', color: '#64748b', fontWeight: 600 }}>
              {filteredRecepcionistas.length} Registrados
            </span>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
              <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: '1.8rem', color: '#059669', marginBottom: '0.5rem' }}></i>
              <p>Cargando información del equipo de recepción...</p>
            </div>
          ) : errorGlobal ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#dc2626' }}>
              <p>{errorGlobal}</p>
            </div>
          ) : filteredRecepcionistas.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
              <i className="fa-solid fa-user-slash" style={{ fontSize: '2rem', color: '#94a3b8', marginBottom: '0.5rem' }}></i>
              <p>No se encontraron recepcionistas registrados con los criterios ingresados.</p>
            </div>
          ) : (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>RECEPCIONISTA</th>
                    <th>SEDE ASIGNADA</th>
                    <th>TELÉFONO</th>
                    <th>CORREO ELECTRÓNICO</th>
                    <th>ESTADO</th>
                    <th style={{ textAlign: 'center' }}>ACCIONES</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRecepcionistas.map((r) => (
                    <tr key={r.id_recepcionista}>
                      <td>
                        <div className="adm-vet-avatar-cell">
                          <UserAvatar
                            user={r}
                            photoUrl={r.foto_perfil}
                            name={r.nombre}
                            id={r.id_recepcionista}
                            icon="fa-solid fa-headset"
                            size="44px"
                            fontSize="1.15rem"
                          />
                          <div className="adm-vet-name-box">
                            <span className="adm-vet-name">{r.nombre}</span>
                            <span className="adm-vet-id">ID #{r.id_recepcionista} • Recepción</span>
                          </div>
                        </div>
                      </td>

                      <td>
                        <span
                          className="adm-tp-text"
                          style={{
                            background: '#f0fdf4',
                            color: '#166534',
                            border: '1px solid #bbf7d0',
                            borderRadius: '8px',
                            padding: '4px 10px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            fontWeight: 600,
                            fontSize: '0.85rem',
                          }}
                        >
                          <i className="fa-solid fa-location-dot" style={{ color: '#059669' }}></i>
                          Sede {r.sede_nombre || 'Sin Asignar'}
                        </span>
                      </td>

                      <td>
                        {r.telefono ? (
                          <a
                            href={`tel:${r.telefono}`}
                            className="adm-contact-phone"
                            style={{ textDecoration: 'none', color: '#0284c7', display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: 500 }}
                            title={`Llamar a ${r.telefono}`}
                          >
                            <i className="fa-solid fa-phone" style={{ color: '#0284c7' }}></i>
                            <span>{r.telefono}</span>
                          </a>
                        ) : (
                          <span style={{ color: '#94a3b8', fontStyle: 'italic', fontSize: '0.85rem' }}>Sin teléfono</span>
                        )}
                      </td>

                      <td>
                        {r.correo ? (
                          <a
                            href={`mailto:${r.correo}`}
                            className="adm-contact-email"
                            style={{
                              textDecoration: 'none',
                              color: '#2563eb',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              fontWeight: 500,
                            }}
                            title={`Enviar correo electrónico a ${r.correo}`}
                          >
                            <i className="fa-regular fa-envelope" style={{ color: '#2563eb' }}></i>
                            <span>{r.correo}</span>
                          </a>
                        ) : (
                          <span style={{ color: '#94a3b8', fontStyle: 'italic', fontSize: '0.85rem' }}>Sin correo</span>
                        )}
                      </td>

                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span
                            className={`adm-badge ${r.activo ? 'adm-badge--success' : 'adm-badge--danger'}`}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                          >
                            <i className={`fa-solid ${r.activo ? 'fa-circle-check' : 'fa-circle-xmark'}`}></i>
                            {r.activo ? 'Activo' : 'Inactivo'}
                          </span>
                          {r.password_temporal && (
                            <span
                              style={{
                                fontSize: '0.72rem',
                                background: '#fef3c7',
                                color: '#b45309',
                                border: '1px solid #fde68a',
                                padding: '2px 6px',
                                borderRadius: '4px',
                                fontWeight: 600,
                                display: 'inline-block',
                              }}
                              title="Requiere cambio de clave en el próximo inicio de sesión"
                            >
                              Temporal
                            </span>
                          )}
                        </div>
                      </td>

                      <td style={{ textAlign: 'center' }}>
                        <div className="action-buttons-group">
                          <button
                            type="button"
                            className="act-btn act-btn--edit"
                            onClick={() => handleOpenEditModal(r)}
                            title="Editar datos del recepcionista"
                          >
                            <i className="fa-solid fa-pen-to-square"></i>
                            <span>Editar</span>
                          </button>
                          <button
                            type="button"
                            className="act-btn act-btn--view"
                            onClick={() => {
                              setResetRecep(r)
                              setShowModalReset(true)
                              setResetSuccessData(null)
                            }}
                            title="Restablecer contraseña temporal"
                            style={{ background: '#fef3c7', color: '#b45309', borderColor: '#fde68a' }}
                          >
                            <i className="fa-solid fa-key"></i>
                            <span>Clave</span>
                          </button>
                          <button
                            type="button"
                            className={`act-btn ${r.activo ? 'act-btn--delete' : 'act-btn--view'}`}
                            onClick={() => handleToggleActivo(r)}
                            title={r.activo ? 'Inhabilitar acceso' : 'Habilitar acceso'}
                            style={!r.activo ? { background: '#ecfdf5', color: '#047857', borderColor: '#a7f3d0' } : {}}
                          >
                            <i className={`fa-solid ${r.activo ? 'fa-ban' : 'fa-check'}`}></i>
                            <span>{r.activo ? 'Bloquear' : 'Activar'}</span>
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

        {/* ── MODAL CREAR / EDITAR RECEPCIONISTA ── */}
        {showModalForm && (
          <div className="adm-modal-backdrop">
            <div className="adm-modal-box" style={{ maxWidth: '520px' }}>
              <div className="adm-modal-header">
                <h3>{isEditing ? 'Editar Recepcionista' : 'Registrar Nuevo Recepcionista'}</h3>
                <button type="button" className="adm-modal-close" onClick={() => setShowModalForm(false)}>
                  <i className="fa-solid fa-xmark"></i>
                </button>
              </div>

              {formError && <div className="adm-modal-alert adm-modal-alert--error">{formError}</div>}

              <form onSubmit={handleSubmitForm}>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                    Nombre Completo *
                  </label>
                  <input
                    type="text"
                    value={formRecep.nombre}
                    onChange={(e) => setFormRecep({ ...formRecep, nombre: e.target.value })}
                    style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1.5px solid #cbd5e1' }}
                    required
                  />
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                    Correo Electrónico *
                  </label>
                  <input
                    type="email"
                    value={formRecep.correo}
                    onChange={(e) => setFormRecep({ ...formRecep, correo: e.target.value })}
                    style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1.5px solid #cbd5e1' }}
                    required
                  />
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                    Sede Asignada *
                  </label>
                  <select
                    value={formRecep.id_sede}
                    onChange={(e) => setFormRecep({ ...formRecep, id_sede: e.target.value })}
                    style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1.5px solid #cbd5e1' }}
                    required
                  >
                    {sedes.map((s) => (
                      <option key={s.id_sede} value={s.id_sede}>
                        {s.nombre} {s.es_principal ? '(Principal)' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                    Teléfono
                  </label>
                  <input
                    type="text"
                    value={formRecep.telefono}
                    onChange={(e) => setFormRecep({ ...formRecep, telefono: e.target.value })}
                    style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1.5px solid #cbd5e1' }}
                  />
                </div>

                {/* Subida de foto administrada por Admin */}
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                    Foto de Perfil (Gestionada por Admin)
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    {photoPreview && (
                      <img src={photoPreview} alt="Preview" style={{ width: '50px', height: '50px', borderRadius: '50%', objectFit: 'cover' }} />
                    )}
                    <label className="dh-btn-upload" style={{ cursor: 'pointer', padding: '0.5rem 1rem' }}>
                      <input type="file" accept="image/png, image/jpeg, image/jpg, image/webp" onChange={handleFileChange} style={{ display: 'none' }} />
                      <i className="fa-solid fa-camera"></i>
                      <span>{selectedFile ? 'Cambiar foto' : 'Subir foto'}</span>
                    </label>
                  </div>
                </div>

                <div className="adm-modal-footer">
                  <button type="button" className="adm-btn-secondary" onClick={() => setShowModalForm(false)}>
                    Cancelar
                  </button>
                  <button type="submit" className="adm-btn-primary" disabled={submittingForm}>
                    {submittingForm ? 'Guardando...' : isEditing ? 'Guardar Cambios' : 'Registrar Recepcionista'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ── MODAL RESTABLECER CLAVE TEMPORAL ── */}
        {showModalReset && resetRecep && (
          <div className="adm-modal-backdrop">
            <div className="adm-modal-box" style={{ maxWidth: '460px' }}>
              <div className="adm-modal-header">
                <h3>Restablecer Contraseña</h3>
                <button type="button" className="adm-modal-close" onClick={() => setShowModalReset(false)}>
                  <i className="fa-solid fa-xmark"></i>
                </button>
              </div>

              {!resetSuccessData ? (
                <div>
                  <p style={{ fontSize: '0.92rem', color: '#475569', marginBottom: '1.5rem' }}>
                    ¿Deseas generar una nueva contraseña temporal para <strong>{resetRecep.nombre}</strong> ({resetRecep.correo})?
                    El usuario deberá cambiarla obligatoriamente en su próximo inicio de sesión.
                  </p>
                  <div className="adm-modal-footer">
                    <button type="button" className="adm-btn-secondary" onClick={() => setShowModalReset(false)}>
                      Cancelar
                    </button>
                    <button type="button" className="adm-btn-primary" disabled={submittingReset} onClick={() => handleConfirmReset(resetRecep)}>
                      {submittingReset ? 'Generando...' : 'Generar Clave Temporal'}
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                  <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#ecfdf5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem auto', fontSize: '1.5rem' }}>
                    <i className="fa-solid fa-key"></i>
                  </div>
                  <h4 style={{ color: '#0f172a', margin: '0 0 0.5rem 0' }}>¡Contraseña Temporal Creada!</h4>
                  <p style={{ fontSize: '0.88rem', color: '#64748b' }}>Comparte esta clave única con el recepcionista:</p>

                  <div style={{ background: '#f8fafc', border: '1.5px dashed #059669', padding: '1rem', borderRadius: '12px', margin: '1rem 0', fontFamily: 'monospace', fontSize: '1.25rem', color: '#059669', fontWeight: 700 }}>
                    {resetSuccessData.nueva_contrasena}
                  </div>

                  <button
                    type="button"
                    className="adm-btn-secondary"
                    onClick={() => {
                      navigator.clipboard.writeText(resetSuccessData.nueva_contrasena)
                      setCopiedToast(true)
                      setTimeout(() => setCopiedToast(false), 3000)
                    }}
                    style={{ marginBottom: '1.25rem' }}
                  >
                    <i className="fa-solid fa-copy"></i>
                    <span>{copiedToast ? '¡Copiada al portapapeles!' : 'Copiar Contraseña'}</span>
                  </button>

                  <div className="adm-modal-footer">
                    <button type="button" className="adm-btn-primary" onClick={() => setShowModalReset(false)}>
                      Entendido y Cerrar
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
