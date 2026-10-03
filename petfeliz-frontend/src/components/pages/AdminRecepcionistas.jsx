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

  // Drawers y Modales
  const [selectedFicha, setSelectedFicha] = useState(null)
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
  const [resetError, setResetError] = useState('')
  const [resetSuccessData, setResetSuccessData] = useState(null)
  const [copiedToast, setCopiedToast] = useState(false)

  // Cargar sedes
  const fetchSedes = async () => {
    const token = getStoredToken()
    if (!token) return
    try {
      const baseUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api'
      const cleanUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl
      const res = await fetch(`${cleanUrl}/admin/sedes`, {
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
      const baseUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api'
      const cleanUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl
      const res = await fetch(`${cleanUrl}/admin/recepcionistas`, {
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
    setPhotoPreview(isValidAvatarUrl(r.foto_perfil) ? r.foto_perfil : '')
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
    if (!token) return

    const baseUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api'
    const cleanUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl
    const endpoint = isEditing
      ? `${cleanUrl}/admin/recepcionistas/${editingId}`
      : `${cleanUrl}/admin/recepcionistas`

    let res

    try {
      if (selectedFile) {
        const formData = new FormData()
        formData.append('nombre', formRecep.nombre.trim())
        formData.append('correo', formRecep.correo.trim())
        formData.append('telefono', formRecep.telefono.trim())
        formData.append('id_sede', formRecep.id_sede)
        formData.append('foto', selectedFile)

        if (isEditing) {
          formData.append('_method', 'PUT')
        }

        res = await fetch(endpoint, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
          },
          body: formData,
        })
      } else {
        const payload = {
          nombre: formRecep.nombre.trim(),
          correo: formRecep.correo.trim(),
          telefono: formRecep.telefono.trim(),
          id_sede: formRecep.id_sede,
          foto_perfil: formRecep.foto_perfil || '',
        }

        res = await fetch(endpoint, {
          method: isEditing ? 'PUT' : 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify(payload),
        })
      }

      const data = await res.json()

      if (!res.ok) {
        setFormError(data.message || 'Error al procesar la solicitud.')
        return
      }

      triggerToast(
        isEditing
          ? '¡Datos de recepcionista actualizados correctamente!'
          : `¡Recepcionista registrado exitosamente! Clave: ${data.contrasena_temporal || data.nueva_contrasena || ''}`,
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
      const baseUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api'
      const cleanUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl
      const res = await fetch(`${cleanUrl}/admin/recepcionistas/${r.id_recepcionista}/toggle-activo`, {
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

  // Abrir modal de reset contraseña
  const handleOpenResetModal = (recep) => {
    setResetRecep(recep)
    setResetError('')
    setShowModalReset(true)
  }

  // Reset Password
  const handleConfirmReset = async (e) => {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }

    if (!resetRecep) return

    const token = getStoredToken()
    if (!token) {
      setResetError('No se encontró el token de sesión. Por favor inicie sesión de nuevo.')
      return
    }

    try {
      setSubmittingReset(true)
      setResetError('')

      const baseUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api'
      const cleanUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl
      const targetUrl = `${cleanUrl}/admin/recepcionistas/${resetRecep.id_recepcionista}/reset-password`

      const res = await fetch(targetUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      })

      const data = await res.json()

      if (res.ok && (data.success || data.nueva_contrasena || data.contrasena_temporal)) {
        setShowModalReset(false)
        setResetSuccessData({
          nombre: data.recepcionista?.nombre || resetRecep.nombre,
          correo: data.recepcionista?.correo || resetRecep.correo,
          contrasena: data.nueva_contrasena || data.contrasena_temporal,
        })
        triggerToast(`Contraseña temporal de ${resetRecep.nombre} generada con éxito.`, 'success')
        fetchRecepcionistas()
      } else {
        setResetError(data.message || 'No se pudo generar la contraseña temporal.')
      }
    } catch (err) {
      console.error('Error al generar contraseña temporal:', err)
      setResetError('Error de conexión con el servidor.')
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
                    <th style={{ whiteSpace: 'nowrap' }}>RECEPCIONISTA</th>
                    <th style={{ whiteSpace: 'nowrap' }}>SEDE ASIGNADA</th>
                    <th style={{ whiteSpace: 'nowrap' }}>TELÉFONO</th>
                    <th style={{ whiteSpace: 'nowrap' }}>CORREO ELECTRÓNICO</th>
                    <th style={{ whiteSpace: 'nowrap' }}>ESTADO</th>
                    <th style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>ACCIONES</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRecepcionistas.map((r) => (
                    <tr key={r.id_recepcionista}>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        <div className="adm-vet-avatar-cell" style={{ whiteSpace: 'nowrap' }}>
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
                            <span className="adm-vet-name" style={{ whiteSpace: 'nowrap' }}>{r.nombre}</span>
                            <span className="adm-vet-id" style={{ whiteSpace: 'nowrap' }}>ID #{r.id_recepcionista} • Recepción</span>
                          </div>
                        </div>
                      </td>

                      <td style={{ whiteSpace: 'nowrap' }}>
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
                            whiteSpace: 'nowrap',
                          }}
                        >
                          <i className="fa-solid fa-location-dot" style={{ color: '#059669' }}></i>
                          Sede {r.sede_nombre || 'Sin Asignar'}
                        </span>
                      </td>

                      <td style={{ whiteSpace: 'nowrap' }}>
                        {r.telefono ? (
                          <a
                            href={`tel:${r.telefono}`}
                            className="adm-contact-phone"
                            style={{ textDecoration: 'none', color: '#0284c7', display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: 500, whiteSpace: 'nowrap' }}
                            title={`Llamar a ${r.telefono}`}
                          >
                            <i className="fa-solid fa-phone" style={{ color: '#0284c7' }}></i>
                            <span>{r.telefono}</span>
                          </a>
                        ) : (
                          <span style={{ color: '#94a3b8', fontStyle: 'italic', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>Sin teléfono</span>
                        )}
                      </td>

                      <td style={{ whiteSpace: 'nowrap' }}>
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
                              whiteSpace: 'nowrap',
                            }}
                            title={`Enviar correo electrónico a ${r.correo}`}
                          >
                            <i className="fa-regular fa-envelope" style={{ color: '#2563eb' }}></i>
                            <span>{r.correo}</span>
                          </a>
                        ) : (
                          <span style={{ color: '#94a3b8', fontStyle: 'italic', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>Sin correo</span>
                        )}
                      </td>

                      <td style={{ whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}>
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

                      <td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                        <div className="action-buttons-group" style={{ justifyContent: 'center' }}>
                          <button
                            type="button"
                            className="act-btn act-btn--view"
                            onClick={() => setSelectedFicha(r)}
                            title="Ver ficha del recepcionista"
                          >
                            <i className="fa-solid fa-eye"></i>
                            <span>Ver</span>
                          </button>
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
                            onClick={() => handleOpenResetModal(r)}
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

        {/* ── DRAWER LATERAL: FICHA DEL RECEPCIONISTA (VER) ── */}
        {selectedFicha && (
          <div className="adm-drawer-overlay" onClick={() => setSelectedFicha(null)}>
            <div className="adm-drawer-panel" onClick={(e) => e.stopPropagation()}>
              <div className="adm-vet-hero" style={{ background: 'linear-gradient(135deg, #065f46 0%, #059669 100%)', padding: '2rem 1.5rem', color: '#fff', position: 'relative' }}>
                <div className="adm-vet-hero__avatar-wrap" style={{ display: 'inline-block', position: 'relative', marginBottom: '0.85rem' }}>
                  <UserAvatar
                    user={selectedFicha}
                    photoUrl={selectedFicha.foto_perfil}
                    name={selectedFicha.nombre}
                    id={selectedFicha.id_recepcionista}
                    icon="fa-solid fa-headset"
                    size="76px"
                    fontSize="2rem"
                    style={{
                      border: '3px solid rgba(255,255,255,0.95)',
                      boxShadow: '0 6px 18px rgba(0,0,0,0.25)',
                    }}
                  />
                </div>
                <div className="adm-vet-hero__info">
                  <div className="adm-vet-hero__tag" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(255,255,255,0.2)', padding: '0.25rem 0.65rem', borderRadius: '20px', fontSize: '0.78rem', fontWeight: 600, marginBottom: '0.4rem' }}>
                    <i className="fa-solid fa-headset"></i>
                    <span>Personal de Recepción</span>
                  </div>
                  <h2 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: '1.4rem', margin: '0 0 0.4rem 0' }}>{selectedFicha.nombre}</h2>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ background: 'rgba(0,0,0,0.25)', padding: '0.2rem 0.6rem', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 600 }}>
                      ID #{selectedFicha.id_recepcionista}
                    </span>
                    <span style={{ background: 'rgba(255,255,255,0.25)', padding: '0.2rem 0.6rem', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 600 }}>
                      <i className="fa-solid fa-location-dot" style={{ marginRight: '4px' }}></i> Sede {selectedFicha.sede_nombre}
                    </span>
                  </div>
                </div>
                <button className="adm-drawer-close adm-drawer-close--white" onClick={() => setSelectedFicha(null)} title="Cerrar Ficha" style={{ position: 'absolute', top: '1.25rem', right: '1.25rem', background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <i className="fa-solid fa-xmark"></i>
                </button>
              </div>

              <div className="adm-drawer-body" style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>
                <div className="adm-vet-status-banner" style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '12px', padding: '0.85rem 1rem', display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '1.5rem' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#059669', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', flexShrink: 0 }}>
                    <i className="fa-solid fa-circle-check"></i>
                  </div>
                  <div>
                    <strong style={{ display: 'block', color: '#065f46', fontSize: '0.9rem' }}>Cuenta {selectedFicha.activo ? 'Activa y Habilitada' : 'Inhabilitada'}</strong>
                    <span style={{ color: '#047857', fontSize: '0.8rem' }}>Asignado oficialmente a la Sede {selectedFicha.sede_nombre}</span>
                  </div>
                </div>

                <div className="adm-drawer-section" style={{ marginBottom: '1.5rem' }}>
                  <h4 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 600, fontSize: '0.9rem', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0 0 0.85rem 0', paddingBottom: '0.4rem', borderBottom: '1px solid #e2e8f0' }}>
                    <i className="fa-solid fa-address-card" style={{ color: '#059669' }}></i>
                    Información de Contacto
                  </h4>

                  <div className="adm-info-list" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div className="adm-info-row" style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', padding: '0.65rem 0.85rem', background: '#f8fafc', borderRadius: '10px' }}>
                      <div style={{ width: '34px', height: '34px', borderRadius: '8px', background: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.95rem' }}>
                        <i className="fa-solid fa-envelope"></i>
                      </div>
                      <div style={{ flex: 1 }}>
                        <span style={{ display: 'block', fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Correo Electrónico</span>
                        <a href={`mailto:${selectedFicha.correo}`} style={{ color: '#2563eb', fontWeight: 600, fontSize: '0.88rem', textDecoration: 'none' }}>
                          {selectedFicha.correo}
                        </a>
                      </div>
                    </div>

                    <div className="adm-info-row" style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', padding: '0.65rem 0.85rem', background: '#f8fafc', borderRadius: '10px' }}>
                      <div style={{ width: '34px', height: '34px', borderRadius: '8px', background: '#f0fdf4', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.95rem' }}>
                        <i className="fa-solid fa-phone"></i>
                      </div>
                      <div style={{ flex: 1 }}>
                        <span style={{ display: 'block', fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Teléfono</span>
                        {selectedFicha.telefono ? (
                          <a href={`tel:${selectedFicha.telefono}`} style={{ color: '#0f172a', fontWeight: 600, fontSize: '0.88rem', textDecoration: 'none' }}>
                            {selectedFicha.telefono}
                          </a>
                        ) : (
                          <span style={{ color: '#94a3b8', fontStyle: 'italic', fontSize: '0.85rem' }}>Sin teléfono registrado</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="adm-drawer-footer" style={{ padding: '1rem 1.5rem', borderTop: '1px solid #e2e8f0', display: 'flex', gap: '0.6rem', background: '#f8fafc' }}>
                <button
                  className="adm-btn-secondary"
                  onClick={() => {
                    const targetRecep = selectedFicha
                    setSelectedFicha(null)
                    handleOpenResetModal(targetRecep)
                  }}
                  style={{ flex: 1, justifyContent: 'center', display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.65rem 1rem' }}
                >
                  <i className="fa-solid fa-key" style={{ color: '#d97706' }}></i>
                  Contraseña Temporal
                </button>
                <button
                  className="adm-btn-primary"
                  onClick={() => {
                    const targetRecep = selectedFicha
                    setSelectedFicha(null)
                    handleOpenEditModal(targetRecep)
                  }}
                  style={{ flex: 1, justifyContent: 'center', display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.65rem 1rem', background: '#059669', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}
                >
                  <i className="fa-solid fa-pen-to-square"></i>
                  Editar Datos
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── DRAWER LATERAL: CREAR / EDITAR RECEPCIONISTA ── */}
        {showModalForm && (
          <div className="adm-drawer-overlay" onClick={() => setShowModalForm(false)}>
            <div className="adm-drawer-panel" onClick={(e) => e.stopPropagation()}>
              <div className="adm-drawer-header">
                <div className="adm-drawer-header__title-group">
                  <div className="adm-drawer-header__icon" style={{ background: '#ecfdf5', color: '#059669', width: '40px', height: '40px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem' }}>
                    <i className={`fa-solid ${isEditing ? 'fa-pen-to-square' : 'fa-user-plus'}`}></i>
                  </div>
                  <div>
                    <h3 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: '1.15rem', color: '#0f172a', margin: 0 }}>
                      {isEditing ? 'Editar Recepcionista' : 'Registrar Nuevo Recepcionista'}
                    </h3>
                    <span className="adm-drawer-header__sub" style={{ fontSize: '0.8rem', color: '#64748b' }}>
                      {isEditing ? 'Actualiza la información de la cuenta y sede asignada' : 'Ingresa los datos para dar de alta al recepcionista en la sede'}
                    </span>
                  </div>
                </div>
                <button className="adm-drawer-close" onClick={() => setShowModalForm(false)} title="Cerrar">
                  <i className="fa-solid fa-xmark"></i>
                </button>
              </div>

              <form onSubmit={handleSubmitForm} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
                <div className="adm-drawer-body" style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>
                  {formError && (
                    <div className="dash-alert dash-alert--danger" style={{ marginBottom: '1.2rem', padding: '0.75rem 1rem', borderRadius: '10px', background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                      <i className="fa-solid fa-circle-exclamation"></i>
                      <span>{formError}</span>
                    </div>
                  )}

                  <div className="adm-form-section" style={{ marginBottom: '1.5rem' }}>
                    <h5 className="adm-form-section-title" style={{ fontFamily: 'Sora, sans-serif', fontWeight: 600, fontSize: '0.88rem', color: '#059669', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '1rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.4rem' }}>
                      Información Básica
                    </h5>

                    <div className="adm-form-group" style={{ marginBottom: '1.2rem' }}>
                      <label style={{ display: 'block', fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '0.84rem', color: '#334155', marginBottom: '0.35rem' }}>
                        Nombre Completo *
                      </label>
                      <div className="adm-input-wrap">
                        <i className="fa-solid fa-user input-icon"></i>
                        <input
                          type="text"
                          required
                          placeholder="Ej. Luisa Fernanda Restrepo"
                          value={formRecep.nombre}
                          onChange={(e) => setFormRecep({ ...formRecep, nombre: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="adm-form-group" style={{ marginBottom: '1.2rem' }}>
                      <label style={{ display: 'block', fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '0.84rem', color: '#334155', marginBottom: '0.35rem' }}>
                        Correo Electrónico (Acceso al Portal) *
                      </label>
                      <div className="adm-input-wrap">
                        <i className="fa-solid fa-envelope input-icon"></i>
                        <input
                          type="email"
                          required
                          placeholder="Ej. recepcion.itagui.1@petfeliz.com"
                          value={formRecep.correo}
                          onChange={(e) => setFormRecep({ ...formRecep, correo: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="adm-form-group" style={{ marginBottom: '1.2rem' }}>
                      <label style={{ display: 'block', fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '0.84rem', color: '#334155', marginBottom: '0.35rem' }}>
                        Sede Asignada *
                      </label>
                      <div className="adm-input-wrap">
                        <i className="fa-solid fa-location-dot input-icon"></i>
                        <select
                          value={formRecep.id_sede}
                          onChange={(e) => setFormRecep({ ...formRecep, id_sede: e.target.value })}
                          required
                          style={{ width: '100%', padding: '0.65rem 0.85rem 0.65rem 2.5rem', borderRadius: '10px', border: '1px solid #cbd5e1', fontFamily: 'Inter, sans-serif', fontSize: '0.88rem', color: '#0f172a', background: '#fff' }}
                        >
                          {sedes.map((s) => (
                            <option key={s.id_sede} value={s.id_sede}>
                              Sede {s.nombre} {s.es_principal ? '(Sede Principal)' : ''}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="adm-form-group" style={{ marginBottom: '1.2rem' }}>
                      <label style={{ display: 'block', fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '0.84rem', color: '#334155', marginBottom: '0.35rem' }}>
                        Teléfono de Contacto
                      </label>
                      <div className="adm-input-wrap">
                        <i className="fa-solid fa-phone input-icon"></i>
                        <input
                          type="tel"
                          placeholder="Ej. 3104567812"
                          value={formRecep.telefono}
                          onChange={(e) => setFormRecep({ ...formRecep, telefono: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="adm-form-section">
                    <h5 className="adm-form-section-title" style={{ fontFamily: 'Sora, sans-serif', fontWeight: 600, fontSize: '0.88rem', color: '#059669', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '1rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.4rem' }}>
                      Foto de Perfil
                    </h5>

                    <div className="adm-form-group">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', margin: '0.4rem 0 0.75rem 0' }}>
                        {photoPreview ? (
                          <img
                            src={photoPreview}
                            alt="Vista previa"
                            onError={(e) => { e.target.style.display = 'none' }}
                            style={{ width: '52px', height: '52px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #059669', boxShadow: '0 2px 6px rgba(0,0,0,0.1)' }}
                          />
                        ) : (
                          <div style={{ width: '52px', height: '52px', borderRadius: '50%', background: '#ecfdf5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem', border: '2px dashed #a7f3d0' }}>
                            <i className="fa-solid fa-headset"></i>
                          </div>
                        )}
                        <div style={{ flex: 1 }}>
                          <label className="act-btn act-btn--view" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', padding: '0.45rem 0.85rem', fontSize: '0.82rem', fontWeight: 600, background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '8px', color: '#334155' }}>
                            <i className="fa-solid fa-cloud-arrow-up" style={{ color: '#059669' }}></i>
                            <span>{selectedFile ? 'Cambiar archivo' : 'Subir foto desde dispositivo'}</span>
                            <input
                              type="file"
                              accept="image/jpeg,image/png,image/webp,image/jpg"
                              style={{ display: 'none' }}
                              onChange={handleFileChange}
                            />
                          </label>
                          {selectedFile && <span style={{ fontSize: '0.78rem', color: '#059669', display: 'block', marginTop: '0.25rem', fontWeight: 600 }}>✓ {selectedFile.name}</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="adm-drawer-footer" style={{ padding: '1rem 1.5rem', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', background: '#f8fafc' }}>
                  <button type="button" className="adm-btn-secondary" onClick={() => setShowModalForm(false)} style={{ padding: '0.65rem 1.25rem' }}>
                    Cancelar
                  </button>
                  <button type="submit" className="adm-btn-primary" disabled={submittingForm} style={{ padding: '0.65rem 1.5rem', background: '#059669', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>
                    {submittingForm ? (
                      <>
                        <i className="fa-solid fa-spinner fa-spin" style={{ marginRight: '6px' }}></i> Guardando...
                      </>
                    ) : (
                      <>
                        <i className="fa-solid fa-check" style={{ marginRight: '6px' }}></i> {isEditing ? 'Guardar Cambios' : 'Registrar Recepcionista'}
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ── MODAL CENTRADO: GENERAR CONTRASEÑA TEMPORAL ── */}
        {showModalReset && resetRecep && (
          <div className="adm-modal-overlay adm-modal-overlay--center" onClick={() => setShowModalReset(false)}>
            <div className="adm-modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
              <div className="adm-modal-header" style={{ borderBottom: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#d97706' }}>
                  <i className="fa-solid fa-key" style={{ fontSize: '1.2rem' }}></i>
                  <h3 style={{ margin: 0, fontFamily: 'Sora, sans-serif', fontWeight: 700 }}>Generar Contraseña Temporal</h3>
                </div>
                <button className="adm-modal-close" onClick={() => setShowModalReset(false)} title="Cerrar">
                  <i className="fa-solid fa-xmark"></i>
                </button>
              </div>

              <form onSubmit={handleConfirmReset}>
                <div className="adm-modal-body" style={{ padding: '1.5rem' }}>
                  <p style={{ fontSize: '0.9rem', color: '#334155', marginBottom: '1.2rem', lineHeight: '1.5' }}>
                    Vas a generar una nueva contraseña temporal para <strong>{resetRecep.nombre}</strong> ({resetRecep.correo}).
                  </p>

                  {resetError && (
                    <div className="dash-alert dash-alert--danger" style={{ marginBottom: '1.2rem' }}>
                      <i className="fa-solid fa-circle-exclamation"></i>
                      <span>{resetError}</span>
                    </div>
                  )}

                  <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '10px', border: '1px dashed #cbd5e1' }}>
                    <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0, lineHeight: '1.4' }}>
                      <i className="fa-solid fa-wand-magic-sparkles" style={{ color: '#059669', marginRight: '6px' }}></i>
                      Se generará automáticamente una clave temporal segura. Podrás copiarla de inmediato para entregársela al recepcionista.
                    </p>
                  </div>
                </div>

                <div className="adm-modal-footer" style={{ padding: '1rem 1.5rem', background: '#f8fafc', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                  <button type="button" className="adm-btn-secondary" onClick={() => setShowModalReset(false)}>
                    Cancelar
                  </button>
                  <button
                    type="button"
                    className="adm-btn-primary"
                    onClick={(e) => handleConfirmReset(e)}
                    disabled={submittingReset}
                    style={{ background: '#059669', color: '#fff', border: 'none', borderRadius: '8px', padding: '0.65rem 1.25rem', fontWeight: 600, cursor: 'pointer' }}
                  >
                    {submittingReset ? (
                      <>
                        <i className="fa-solid fa-spinner fa-spin" style={{ marginRight: '6px' }}></i> Generando...
                      </>
                    ) : (
                      <>
                        <i className="fa-solid fa-wand-magic-sparkles" style={{ marginRight: '6px' }}></i> Generar Contraseña Temporal
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ── MODAL CENTRADO: NUEVA CONTRASEÑA RESTABLECIDA CON ÉXITO ── */}
        {resetSuccessData && (
          <div className="adm-modal-overlay adm-modal-overlay--center" onClick={() => setResetSuccessData(null)}>
            <div className="adm-modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
              <div className="adm-modal-header" style={{ borderBottom: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#059669' }}>
                  <i className="fa-solid fa-circle-check" style={{ fontSize: '1.2rem' }}></i>
                  <h3 style={{ margin: 0, fontFamily: 'Sora, sans-serif', fontWeight: 700 }}>Contraseña Restablecida</h3>
                </div>
                <button className="adm-modal-close" onClick={() => setResetSuccessData(null)} title="Cerrar">
                  <i className="fa-solid fa-xmark"></i>
                </button>
              </div>

              <div className="adm-modal-body" style={{ padding: '1.5rem' }}>
                <div className="dash-alert dash-alert--success" style={{ marginBottom: '1.25rem', padding: '0.75rem 1rem', background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '10px', color: '#065f46', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.88rem' }}>
                  <i className="fa-solid fa-circle-check"></i>
                  <span>¡La clave de <strong>{resetSuccessData.nombre}</strong> ha sido actualizada exitosamente!</span>
                </div>

                <div style={{ background: '#f8fafc', padding: '1.1rem', borderRadius: '12px', border: '1px solid #cbd5e1', marginBottom: '1rem' }}>
                  <div style={{ marginBottom: '0.8rem' }}>
                    <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '0.2rem' }}>
                      Usuario / Correo
                    </span>
                    <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '1rem', fontWeight: 600, color: '#0f172a' }}>
                      {resetSuccessData.correo}
                    </span>
                  </div>

                  <div>
                    <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '0.2rem' }}>
                      Nueva Contraseña Temporal
                    </span>
                    <span style={{ fontFamily: 'monospace', fontSize: '1.2rem', fontWeight: 700, color: '#059669', background: '#ecfdf5', padding: '0.36rem 0.75rem', borderRadius: '6px', border: '1px solid #a7f3d0', display: 'inline-block' }}>
                      {resetSuccessData.contrasena}
                    </span>
                  </div>
                </div>

                <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '10px', padding: '0.8rem 1rem', display: 'flex', alignItems: 'flex-start', gap: '0.6rem' }}>
                  <i className="fa-solid fa-triangle-exclamation" style={{ color: '#d97706', marginTop: '2px', fontSize: '0.95rem' }}></i>
                  <span style={{ fontSize: '0.82rem', color: '#92400e', lineHeight: '1.4' }}>
                    <strong>Importante:</strong> Entrega esta nueva contraseña al recepcionista. Las sesiones anteriores abiertas han sido cerradas por seguridad.
                  </span>
                </div>
              </div>

              <div className="adm-modal-footer" style={{ padding: '1rem 1.5rem', background: '#f8fafc', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button
                  type="button"
                  className="adm-btn-secondary"
                  onClick={() => setResetSuccessData(null)}
                >
                  Cerrar
                </button>
                <button
                  type="button"
                  className="adm-btn-primary"
                  onClick={() => {
                    navigator.clipboard.writeText(resetSuccessData.contrasena)
                    setCopiedToast(true)
                    setTimeout(() => setCopiedToast(false), 3000)
                  }}
                  style={{ background: '#059669', color: '#fff', border: 'none', borderRadius: '8px', padding: '0.65rem 1.25rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                >
                  <i className="fa-solid fa-copy"></i>
                  <span>{copiedToast ? '¡Copiada al portapapeles!' : 'Copiar Credencial'}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
