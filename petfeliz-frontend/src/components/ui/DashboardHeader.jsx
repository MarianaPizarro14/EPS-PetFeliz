import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import CustomDatePicker from '../ui/CustomDatePicker'
import { DEPARTAMENTOS_Y_CIUDADES_COLOMBIA } from '../../data/departamentosYCiudadesColombia'
import { DEFAULT_USER_AVATAR } from '../../constants/images'
import { getStoredToken, clearStoredAuth, isValidAvatarUrl } from '../../utils/authStorage'
import './DashboardHeader.css'

// Helper para obtener iniciales del nombre
const getInitials = (name) => {
  if (!name) return 'U'
  const parts = name.trim().split(' ').filter(Boolean)
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase()
  return (parts[0][0] + parts[1][0]).toUpperCase()
}

// Helper para traducir el rol a lenguaje natural
const getFormattedRole = (rol) => {
  switch ((rol || '').toLowerCase()) {
    case 'admin':
      return 'Director Administrativo'
    case 'veterinario':
      return 'Médico Veterinario'
    case 'cliente':
    default:
      return 'Cliente PetFeliz'
  }
}

export default function DashboardHeader({
  title,
  subtitle,
  usuario,
  onUserUpdated,
  extraActions,
  openProfileTrigger,
  searchTerm,
  onSearchChange,
  showSearch = false,
}) {
  const navigate = useNavigate()

  // Desplegables del header
  const [showNotifs, setShowNotifs] = useState(false)
  const [showProfileMenu, setShowProfileMenu] = useState(false)

  // Modales
  const [showProfileModal, setShowProfileModal] = useState(false) // Datos Personales (Sin pestañas)
  const [showPhotoModal, setShowPhotoModal] = useState(false)     // Cambiar Foto de Perfil
  const [showSettingsModal, setShowSettingsModal] = useState(false) // Contraseña y Seguridad
  const [activeSettingsTab, setActiveSettingsTab] = useState('password') // 'password' | 'notifications' | 'security'
  const [showLogoutAllConfirm, setShowLogoutAllConfirm] = useState(false)

  useEffect(() => {
    if (openProfileTrigger) {
      setShowProfileModal(true)
    }
  }, [openProfileTrigger])

  // Refs para detectar clic fuera
  const notifRef = useRef(null)
  const profileRef = useRef(null)

  // Notificaciones y Polling
  const [notifications, setNotifications] = useState([])

  const fetchNotifications = async () => {
    const token = getStoredToken()
    if (!token) return
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/notificaciones`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      })
      if (res.ok) {
        const data = await res.json()
        if (data.notifications) {
          setNotifications(data.notifications)
        }
      }
    } catch (err) {
      console.error('Error al cargar notificaciones:', err)
    }
  }

  useEffect(() => {
    fetchNotifications()

    // Polling ligero cada 45 segundos para notificaciones en tiempo real
    const interval = setInterval(fetchNotifications, 45000)

    // Actualizar inmediatamente cuando la ventana vuelve a tener foco
    const handleFocus = () => {
      if (document.visibilityState === 'visible') {
        fetchNotifications()
      }
    }
    window.addEventListener('focus', handleFocus)
    document.addEventListener('visibilitychange', handleFocus)

    return () => {
      clearInterval(interval)
      window.removeEventListener('focus', handleFocus)
      document.removeEventListener('visibilitychange', handleFocus)
    }
  }, [])

  // Clic fuera para notificaciones y menú de perfil
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifs(false)
      }
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setShowProfileMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Conteo de no leídas
  const unreadCount = notifications.filter((n) => !n.read).length

  // Marcar todas como leídas
  const handleMarkAllAsRead = async (e) => {
    e?.stopPropagation()
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))

    const token = getStoredToken()
    if (!token) return
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/notificaciones/marcar-leidas`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      })
      if (res.ok) {
        const data = await res.json()
        if (data.notifications) setNotifications(data.notifications)
      }
    } catch (err) {
      console.error('Error al marcar notificaciones:', err)
    }
  }

  // Marcar una notificación individual como leída en frontend y backend
  const handleNotificationClick = async (notif) => {
    // Actualización reactiva e inmediata en UI
    setNotifications((prev) =>
      prev.map((item) => (item.id === notif.id ? { ...item, read: true } : item))
    )

    if (notif.read) return

    const token = getStoredToken()
    if (!token) return
    try {
      await fetch(`${import.meta.env.VITE_API_URL}/notificaciones/${notif.id}/marcar-leida`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      })
    } catch (err) {
      console.error('Error al marcar notificación como leída en backend:', err)
    }
  }

  // Eliminar una notificación
  const handleRemoveNotif = async (id, e) => {
    e?.stopPropagation()
    setNotifications((prev) => prev.filter((n) => n.id !== id))

    const token = getStoredToken()
    if (!token) return
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/notificaciones/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      })
      if (res.ok) {
        const data = await res.json()
        if (data.notifications) setNotifications(data.notifications)
      }
    } catch (err) {
      console.error('Error al eliminar notificación:', err)
    }
  }

  // Formularios y estados de modales
  const [profileForm, setProfileForm] = useState({
    nombre: '',
    cedula: '',
    fecha_nacimiento: '',
    telefono: '',
    direccion: '',
    departamento: '',
    ciudad: '',
    contacto_emergencia_nombre: '',
    contacto_emergencia_telefono: '',
  })

  const [notifPreferences, setNotifPreferences] = useState({
    recordatorios_citas: true,
  })

  const [passwordForm, setPasswordForm] = useState({
    contrasena_actual: '',
    nueva_contrasena: '',
    confirmar_nueva_contrasena: '',
  })

  const [showCurrentPass, setShowCurrentPass] = useState(false)
  const [showNewPass, setShowNewPass] = useState(false)
  const [showConfirmPass, setShowConfirmPass] = useState(false)

  // Estado para modal de Foto
  const [selectedFile, setSelectedFile] = useState(null)
  const [photoPreview, setPhotoPreview] = useState(null)
  const [isRemovingPhoto, setIsRemovingPhoto] = useState(false)

  const [saving, setSaving] = useState(false)
  const [modalError, setModalError] = useState('')
  const [modalSuccess, setModalSuccess] = useState('')

  // Sincronización de datos al cambiar el prop usuario
  useEffect(() => {
    if (usuario) {
      setProfileForm({
        nombre: usuario.nombreCompleto || usuario.nombre || '',
        cedula: usuario.cedula || '',
        fecha_nacimiento: usuario.fecha_nacimiento || '',
        telefono: usuario.telefono || '',
        direccion: usuario.direccion || '',
        departamento: usuario.departamento || '',
        ciudad: usuario.ciudad || '',
        contacto_emergencia_nombre: usuario.contacto_emergencia_nombre || '',
        contacto_emergencia_telefono: usuario.contacto_emergencia_telefono || '',
      })

      setNotifPreferences({
        recordatorios_citas: usuario.recordatorios_citas !== undefined ? Boolean(usuario.recordatorios_citas) : true,
      })

      setPhotoPreview(usuario.foto || null)
    }
  }, [usuario])

  // Cierre de sesión individual
  const handleLogout = async () => {
    const token = getStoredToken()
    if (token) {
      try {
        await fetch(`${import.meta.env.VITE_API_URL}/logout`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
          },
        })
      } catch (err) {
        console.error(err)
      }
    }
    clearStoredAuth()
    navigate('/login')
  }

  // Cierre de sesión en todos los dispositivos (global)
  const handleLogoutAllDevices = async () => {
    setSaving(true)
    setModalError('')
    const token = getStoredToken()

    try {
      await fetch(`${import.meta.env.VITE_API_URL}/perfil/logout-all`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      })
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
      clearStoredAuth()
      sessionStorage.setItem('logout_reason', 'Se ha cerrado tu sesión en todos los dispositivos.')
      navigate('/login')
    }
  }

  // Abrir Modal de Información Personal
  const handleOpenProfileModal = () => {
    setModalError('')
    setModalSuccess('')
    setShowProfileMenu(false)
    setShowProfileModal(true)
  }

  // Abrir Modal de Cambiar Foto de Perfil
  const handleOpenPhotoModal = () => {
    setSelectedFile(null)
    setIsRemovingPhoto(false)
    setPhotoPreview(usuario?.foto || null)
    setModalError('')
    setModalSuccess('')
    setShowProfileMenu(false)
    setShowPhotoModal(true)
  }

  // Abrir Modal de Configuración (Contraseña y Seguridad)
  const handleOpenSettingsModal = (tab = 'password') => {
    setActiveSettingsTab(tab)
    setPasswordForm({ contrasena_actual: '', nueva_contrasena: '', confirmar_nueva_contrasena: '' })
    setModalError('')
    setModalSuccess('')
    setShowLogoutAllConfirm(false)
    setShowProfileMenu(false)
    setShowSettingsModal(true)
  }

  // Selección de archivo con validación
  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (!file) return

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      setModalError('Solo se permiten imágenes en formato JPG, JPEG, PNG o WEBP.')
      return
    }

    const maxSize = 5 * 1024 * 1024 // 5 MB
    if (file.size > maxSize) {
      setModalError('La imagen seleccionada supera el tamaño máximo permitido de 5 MB.')
      return
    }

    setModalError('')
    setSelectedFile(file)
    setIsRemovingPhoto(false)
    setPhotoPreview(URL.createObjectURL(file))
  }

  // Guardar Foto de Perfil (o removerla)
  const handleSavePhoto = async (e) => {
    e.preventDefault()
    setSaving(true)
    setModalError('')
    setModalSuccess('')

    const token = getStoredToken()
    const bodyFormData = new FormData()

    if (isRemovingPhoto) {
      bodyFormData.append('foto', '') // reset a default
    } else if (selectedFile) {
      bodyFormData.append('foto', selectedFile)
    } else {
      setModalError('Selecciona una nueva imagen para guardar.')
      setSaving(false)
      return
    }

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/perfil/update`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
        body: bodyFormData,
      })

      const data = await res.json()

      if (!res.ok) {
        setModalError(data.message || 'No se pudo actualizar la foto de perfil.')
        setSaving(false)
        return
      }

      setModalSuccess('¡Foto de perfil actualizada correctamente!')
      if (onUserUpdated && data.cliente) {
        onUserUpdated(data.cliente)
      }

      setTimeout(() => {
        setShowPhotoModal(false)
      }, 1200)
    } catch (err) {
      console.error(err)
      setModalError('No se pudo conectar con el servidor para actualizar la foto.')
    } finally {
      setSaving(false)
    }
  }

  // Guardar Datos Personales
  const handleSaveProfile = async (e) => {
    e.preventDefault()
    setSaving(true)
    setModalError('')
    setModalSuccess('')

    // Validación de Cédula
    if (profileForm.cedula && !/^[0-9]{5,12}$/.test(profileForm.cedula.trim())) {
      setModalError('La cédula de ciudadanía debe contener únicamente números (entre 5 y 12 dígitos).')
      setSaving(false)
      return
    }

    // Validación de Teléfono
    if (profileForm.telefono && !/^[0-9+\s-]{7,15}$/.test(profileForm.telefono.trim())) {
      setModalError('El teléfono ingresado debe contener entre 7 y 15 dígitos numéricos.')
      setSaving(false)
      return
    }

    // Validación de Teléfono de Emergencia
    if (profileForm.contacto_emergencia_telefono && !/^[0-9+\s-]{7,15}$/.test(profileForm.contacto_emergencia_telefono.trim())) {
      setModalError('El teléfono de contacto de emergencia debe contener entre 7 y 15 dígitos.')
      setSaving(false)
      return
    }

    const token = getStoredToken()
    const bodyFormData = new FormData()

    Object.keys(profileForm).forEach((key) => {
      bodyFormData.append(key, profileForm[key] || '')
    })

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/perfil/update`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
        body: bodyFormData,
      })

      const data = await res.json()

      if (!res.ok) {
        setModalError(data.message || 'Error al actualizar la información personal.')
        setSaving(false)
        return
      }

      setModalSuccess('¡Información personal guardada con éxito!')
      if (onUserUpdated && data.cliente) {
        onUserUpdated(data.cliente)
      }

      setTimeout(() => {
        setShowProfileModal(false)
      }, 1200)
    } catch (err) {
      console.error(err)
      setModalError('No se pudo conectar con el servidor.')
    } finally {
      setSaving(false)
    }
  }

  // Guardar Cambio de Contraseña
  const handleChangePassword = async (e) => {
    e.preventDefault()
    setSaving(true)
    setModalError('')
    setModalSuccess('')

    if (passwordForm.nueva_contrasena.length < 6) {
      setModalError('La nueva contraseña debe tener al menos 6 caracteres.')
      setSaving(false)
      return
    }

    // Validación: la nueva contraseña NO puede ser igual a la actual
    if (passwordForm.contrasena_actual && passwordForm.nueva_contrasena === passwordForm.contrasena_actual) {
      setModalError('La nueva contraseña no puede ser igual a la actual.')
      setSaving(false)
      return
    }

    if (passwordForm.nueva_contrasena !== passwordForm.confirmar_nueva_contrasena) {
      setModalError('La nueva contraseña y su confirmación no coinciden.')
      setSaving(false)
      return
    }

    const token = getStoredToken()

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/perfil/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
        body: JSON.stringify(passwordForm),
      })

      const data = await res.json()

      if (!res.ok) {
        setModalError(data.message || 'La contraseña actual no es correcta.')
        setSaving(false)
        return
      }

      setModalSuccess('¡Contraseña actualizada con éxito!')
      setPasswordForm({ contrasena_actual: '', nueva_contrasena: '', confirmar_nueva_contrasena: '' })
    } catch (err) {
      console.error(err)
      setModalError('No se pudo actualizar la contraseña.')
    } finally {
      setSaving(false)
    }
  }

  // Guardar Preferencia de Recordatorios de Citas
  const handleSaveNotifPreference = async (checked) => {
    setNotifPreferences({ recordatorios_citas: checked })
    setModalError('')
    setModalSuccess('')

    const token = getStoredToken()
    const bodyFormData = new FormData()
    bodyFormData.append('recordatorios_citas', checked)

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/perfil/update`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
        body: bodyFormData,
      })

      const data = await res.json()
      if (res.ok) {
        setModalSuccess('Preferencia de recordatorios por correo actualizada.')
        if (onUserUpdated && data.cliente) {
          onUserUpdated(data.cliente)
        }
      }
    } catch (err) {
      console.error(err)
    }
  }

  const userFullName = usuario?.nombreCompleto || usuario?.nombre || 'Usuario'
  const userRoleFormatted = getFormattedRole(usuario?.rol)
  const hasAvatarPhoto = isValidAvatarUrl(usuario?.foto)

  return (
    <header className="dash-header">
      <div>
        <h1 className="dash-header__title">{title}</h1>
        {subtitle && <p className="dash-header__subtitle">{subtitle}</p>}
      </div>

      <div className="dash-header__right">
        {showSearch && (
          <div className="dash-header__search-wrap">
            <i className="fa-solid fa-magnifying-glass dash-header__search-icon"></i>
            <input
              type="text"
              className="dash-header__search-input"
              placeholder="Buscar..."
              value={searchTerm || ''}
              onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
            />
          </div>
        )}

        {extraActions}

        {/* ── 1. CAMPANA DE NOTIFICACIONES ── */}
        <div className="dash-header__notif-wrap" ref={notifRef}>
          <button
            type="button"
            className={`dash-header__bell ${showNotifs ? 'dash-header__bell--active' : ''}`}
            onClick={() => {
              setShowNotifs(!showNotifs)
              setShowProfileMenu(false)
            }}
            aria-label="Notificaciones"
          >
            <i className="fa-regular fa-bell"></i>
            {unreadCount > 0 && <span className="bell-badge" title={`${unreadCount} no leídas`}></span>}
          </button>

          {showNotifs && (
            <div className="dh-dropdown dh-dropdown--notifs">
              <div className="dh-dropdown__header">
                <div className="dh-dropdown__title-wrap">
                  <i className="fa-regular fa-bell"></i>
                  <span>Notificaciones</span>
                  {unreadCount > 0 && <span className="dh-badge-count">{unreadCount}</span>}
                </div>
                {unreadCount > 0 && (
                  <button type="button" className="dh-link-action" onClick={handleMarkAllAsRead}>
                    Marcar todas leídas
                  </button>
                )}
              </div>

              <div className="dh-notif-list">
                {notifications.length === 0 ? (
                  <div className="dh-notif-empty">
                    <i className="fa-regular fa-bell-slash"></i>
                    <p>No tienes notificaciones pendientes</p>
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`dh-notif-item ${!n.read ? 'dh-notif-item--unread' : ''}`}
                      onClick={() => handleNotificationClick(n)}
                    >
                      <div className="dh-notif-icon">
                        <i className={n.icon || 'fa-regular fa-bell'}></i>
                      </div>
                      <div className="dh-notif-content">
                        <span className="dh-notif-title">{n.titulo}</span>
                        <p className="dh-notif-text">{n.text}</p>
                        <span className="dh-notif-time">{n.time}</span>
                      </div>
                      <button
                        type="button"
                        className="dh-notif-close"
                        onClick={(e) => handleRemoveNotif(n.id, e)}
                        title="Eliminar notificación"
                      >
                        <i className="fa-solid fa-xmark"></i>
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* ── 2. MENÚ DESPLEGABLE DEL USUARIO (Rediseñado) ── */}
        <div className="dash-header__user-wrap" ref={profileRef}>
          <button
            type="button"
            className="dash-header__user-btn"
            onClick={() => {
              setShowProfileMenu(!showProfileMenu)
              setShowNotifs(false)
            }}
          >
            <span className="dash-header__user" title={userFullName}>
              {userFullName}
            </span>

            {hasAvatarPhoto ? (
              <img
                className="dash-header__avatar"
                src={usuario.foto}
                alt={userFullName}
                onError={(e) => { e.target.onerror = null; e.target.src = DEFAULT_USER_AVATAR }}
              />
            ) : (
              <div className="dash-header__avatar-initials" title={userFullName}>
                {getInitials(userFullName)}
              </div>
            )}
            <i className="fa-solid fa-chevron-down dh-chevron-icon"></i>
          </button>

          {showProfileMenu && (
            <div className="dh-dropdown dh-dropdown--profile">
              <div className="dh-profile-card">
                {hasAvatarPhoto ? (
                  <img
                    className="dh-profile-card__avatar"
                    src={usuario.foto}
                    alt={userFullName}
                    onError={(e) => { e.target.onerror = null; e.target.src = DEFAULT_USER_AVATAR }}
                  />
                ) : (
                  <div className="dh-profile-card__avatar-initials">
                    {getInitials(userFullName)}
                  </div>
                )}
                <div className="dh-profile-card__info">
                  <strong title={userFullName}>{userFullName}</strong>
                  <span className="dh-profile-card__role">{userRoleFormatted}</span>
                  <span className="dh-profile-card__email" title={usuario?.email}>{usuario?.email}</span>
                </div>
              </div>

              <div className="dh-menu-divider"></div>

              <nav className="dh-menu-links">
                <button type="button" className="dh-menu-item" onClick={handleOpenProfileModal}>
                  <i className="fa-solid fa-user"></i>
                  <span>Mi perfil</span>
                </button>

                <button type="button" className="dh-menu-item" onClick={handleOpenPhotoModal}>
                  <i className="fa-solid fa-camera"></i>
                  <span>Cambiar foto</span>
                </button>

                <button type="button" className="dh-menu-item" onClick={() => handleOpenSettingsModal('password')}>
                  <i className="fa-solid fa-shield-halved"></i>
                  <span>Contraseña y seguridad</span>
                </button>

                <div className="dh-menu-divider"></div>

                <button type="button" className="dh-menu-item dh-menu-item--logout" onClick={handleLogout}>
                  <i className="fa-solid fa-arrow-right-from-bracket"></i>
                  <span>Cerrar sesión</span>
                </button>
              </nav>
            </div>
          )}
        </div>
      </div>

      {/* ── 3. MODAL INFORMACIÓN PERSONAL (Sin pestañas) ── */}
      {showProfileModal && (
        <div className="dh-modal-backdrop">
          <div className="dh-modal-box dh-modal-box--wide">
            <div className="dh-modal-header">
              <div>
                <h3>Información Personal</h3>
                <p className="dh-modal-subtitle">Actualiza tus datos de contacto y residencia</p>
              </div>
              <button
                type="button"
                className="dh-modal-close"
                onClick={() => setShowProfileModal(false)}
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            {modalError && <div className="dh-modal-alert dh-modal-alert--error">{modalError}</div>}
            {modalSuccess && <div className="dh-modal-alert dh-modal-alert--success">{modalSuccess}</div>}

            <form onSubmit={handleSaveProfile} className="dh-profile-form">
              <div className="dh-info-grid">
                <div className="dh-form-field">
                  <label htmlFor="nombre">Nombre Completo *</label>
                  <input
                    id="nombre"
                    type="text"
                    required
                    placeholder="Tu nombre completo"
                    value={profileForm.nombre}
                    onChange={(e) => setProfileForm({ ...profileForm, nombre: e.target.value })}
                  />
                </div>

                <div className="dh-form-field">
                  <label htmlFor="cedula">Cédula / Documento de Identidad</label>
                  <input
                    id="cedula"
                    type="text"
                    placeholder="ej. 1020304050"
                    value={profileForm.cedula}
                    onChange={(e) => setProfileForm({ ...profileForm, cedula: e.target.value })}
                  />
                  <span className="dh-field-hint">Solo números, entre 5 y 12 dígitos</span>
                </div>

                <div className="dh-form-field">
                  <label htmlFor="fecha_nacimiento">Fecha de Nacimiento</label>
                  <CustomDatePicker
                    value={profileForm.fecha_nacimiento}
                    onChange={(val) => setProfileForm({ ...profileForm, fecha_nacimiento: val })}
                    placeholder="Selecciona fecha de nacimiento"
                  />
                </div>

                <div className="dh-form-field">
                  <label htmlFor="telefono">Teléfono de Contacto</label>
                  <input
                    id="telefono"
                    type="text"
                    placeholder="ej. 3001234567"
                    value={profileForm.telefono}
                    onChange={(e) => setProfileForm({ ...profileForm, telefono: e.target.value })}
                  />
                </div>

                <div className="dh-form-field">
                  <label htmlFor="direccion">Dirección de Residencia</label>
                  <input
                    id="direccion"
                    type="text"
                    placeholder="ej. Calle 10 # 20 - 30"
                    value={profileForm.direccion}
                    onChange={(e) => setProfileForm({ ...profileForm, direccion: e.target.value })}
                  />
                </div>

                <div className="dh-form-field">
                  <label htmlFor="departamento">Departamento</label>
                  <select
                    id="departamento"
                    value={profileForm.departamento}
                    onChange={(e) => {
                      const depto = e.target.value
                      const ciudadesDisponibles = DEPARTAMENTOS_Y_CIUDADES_COLOMBIA[depto] || []
                      const ciudadInicial = ciudadesDisponibles.length > 0 ? ciudadesDisponibles[0] : ''
                      setProfileForm({
                        ...profileForm,
                        departamento: depto,
                        ciudad: ciudadInicial,
                      })
                    }}
                  >
                    <option value="">Selecciona departamento...</option>
                    {Object.keys(DEPARTAMENTOS_Y_CIUDADES_COLOMBIA).sort().map((depto) => (
                      <option key={depto} value={depto}>
                        {depto}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="dh-form-field">
                  <label htmlFor="ciudad">Ciudad / Municipio</label>
                  {!profileForm.departamento ? (
                    <select id="ciudad" disabled className="dh-select-disabled">
                      <option value="">Selecciona primero un departamento</option>
                    </select>
                  ) : (
                    <select
                      id="ciudad"
                      value={profileForm.ciudad}
                      onChange={(e) => setProfileForm({ ...profileForm, ciudad: e.target.value })}
                    >
                      <option value="">Selecciona una ciudad...</option>
                      {(DEPARTAMENTOS_Y_CIUDADES_COLOMBIA[profileForm.departamento] || []).map((ciudad) => (
                        <option key={ciudad} value={ciudad}>
                          {ciudad}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div className="dh-form-field dh-form-field--full">
                  <div className="dh-section-title">Contacto de Emergencia</div>
                </div>

                <div className="dh-form-field">
                  <label htmlFor="contacto_emergencia_nombre">Nombre del Contacto</label>
                  <input
                    id="contacto_emergencia_nombre"
                    type="text"
                    placeholder="Nombre del familiar o persona de contacto"
                    value={profileForm.contacto_emergencia_nombre}
                    onChange={(e) => setProfileForm({ ...profileForm, contacto_emergencia_nombre: e.target.value })}
                  />
                </div>

                <div className="dh-form-field">
                  <label htmlFor="contacto_emergencia_telefono">Teléfono de Emergencia</label>
                  <input
                    id="contacto_emergencia_telefono"
                    type="text"
                    placeholder="ej. 3109876543"
                    value={profileForm.contacto_emergencia_telefono}
                    onChange={(e) => setProfileForm({ ...profileForm, contacto_emergencia_telefono: e.target.value })}
                  />
                </div>
              </div>

              <div className="dh-modal-footer">
                <button
                  type="button"
                  className="dh-btn-secondary"
                  onClick={() => setShowProfileModal(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className="dh-btn-primary" disabled={saving}>
                  {saving ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── 4. MODAL DEDICADO "CAMBIAR FOTO DE PERFIL" ── */}
      {showPhotoModal && (
        <div className="dh-modal-backdrop">
          <div className="dh-modal-box dh-modal-box--medium">
            <div className="dh-modal-header">
              <div>
                <h3>Cambiar Foto de Perfil</h3>
                <p className="dh-modal-subtitle">Sube una nueva foto o actualiza tu imagen</p>
              </div>
              <button
                type="button"
                className="dh-modal-close"
                onClick={() => setShowPhotoModal(false)}
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            {modalError && <div className="dh-modal-alert dh-modal-alert--error">{modalError}</div>}
            {modalSuccess && <div className="dh-modal-alert dh-modal-alert--success">{modalSuccess}</div>}

            <form onSubmit={handleSavePhoto} className="dh-photo-form">
              <div className="dh-photo-preview-container">
                {isRemovingPhoto ? (
                  <div className="dh-photo-preview-initials">
                    {getInitials(userFullName)}
                  </div>
                ) : photoPreview ? (
                  <img
                    src={photoPreview}
                    alt="Vista previa"
                    className="dh-photo-preview-img"
                    onError={(e) => { e.target.onerror = null; e.target.src = DEFAULT_USER_AVATAR }}
                  />
                ) : (
                  <div className="dh-photo-preview-initials">
                    {getInitials(userFullName)}
                  </div>
                )}
              </div>

              <div className="dh-photo-actions-wrap">
                <label className="dh-btn-upload">
                  <input
                    type="file"
                    accept="image/png, image/jpeg, image/jpg, image/webp"
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                  />
                  <i className="fa-solid fa-arrow-up-from-bracket"></i>
                  <span>{selectedFile ? 'Cambiar archivo' : 'Elegir nueva imagen'}</span>
                </label>

                {hasAvatarPhoto && !isRemovingPhoto && (
                  <button
                    type="button"
                    className="dh-btn-remove-photo"
                    onClick={() => {
                      setIsRemovingPhoto(true)
                      setSelectedFile(null)
                      setPhotoPreview(null)
                    }}
                  >
                    <i className="fa-solid fa-trash-can"></i> Quitar foto
                  </button>
                )}
              </div>

              <span className="dh-photo-hint">
                Formatos soportados: JPG, PNG o WEBP. Tamaño máximo: 5 MB.
              </span>

              <div className="dh-modal-footer">
                <button
                  type="button"
                  className="dh-btn-secondary"
                  onClick={() => setShowPhotoModal(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className="dh-btn-primary" disabled={saving}>
                  {saving ? 'Guardando...' : 'Guardar Foto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── 5. MODAL CONFIGURACIÓN DE CUENTA (Contraseña & Seguridad) ── */}
      {showSettingsModal && (
        <div className="dh-modal-backdrop">
          <div className="dh-modal-box dh-modal-box--wide">
            <div className="dh-modal-header">
              <div>
                <h3>Contraseña y Seguridad</h3>
                <p className="dh-modal-subtitle">Gestiona la seguridad y preferencias de tu cuenta</p>
              </div>
              <button
                type="button"
                className="dh-modal-close"
                onClick={() => setShowSettingsModal(false)}
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            {/* Pestañas de Configuración */}
            <div className="dh-modal-tabs">
              <button
                type="button"
                className={`dh-modal-tab ${activeSettingsTab === 'password' ? 'dh-modal-tab--active' : ''}`}
                onClick={() => { setActiveSettingsTab('password'); setModalError(''); setModalSuccess('') }}
              >
                Contraseña
              </button>
              <button
                type="button"
                className={`dh-modal-tab ${activeSettingsTab === 'notifications' ? 'dh-modal-tab--active' : ''}`}
                onClick={() => { setActiveSettingsTab('notifications'); setModalError(''); setModalSuccess('') }}
              >
                Notificaciones por correo
              </button>
              <button
                type="button"
                className={`dh-modal-tab ${activeSettingsTab === 'security' ? 'dh-modal-tab--active' : ''}`}
                onClick={() => { setActiveSettingsTab('security'); setModalError(''); setModalSuccess('') }}
              >
                Sesiones y Dispositivos
              </button>
            </div>

            {modalError && <div className="dh-modal-alert dh-modal-alert--error">{modalError}</div>}
            {modalSuccess && <div className="dh-modal-alert dh-modal-alert--success">{modalSuccess}</div>}

            {/* Pestaña: Contraseña */}
            {activeSettingsTab === 'password' && (
              <form onSubmit={handleChangePassword} className="dh-profile-form">
                <div className="dh-info-section">
                  <div className="dh-form-field">
                    <label htmlFor="contrasena_actual">Contraseña Actual</label>
                    <div className="dh-input-password-wrap">
                      <input
                        id="contrasena_actual"
                        type={showCurrentPass ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={passwordForm.contrasena_actual}
                        onChange={(e) => setPasswordForm({ ...passwordForm, contrasena_actual: e.target.value })}
                      />
                      <button
                        type="button"
                        className="dh-toggle-pass-btn"
                        onClick={() => setShowCurrentPass(!showCurrentPass)}
                        aria-label="Mostrar u ocultar contraseña"
                      >
                        <i className={`fa-solid ${showCurrentPass ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                      </button>
                    </div>
                    <span className="dh-field-hint">
                      Si creaste tu cuenta con Google, puedes dejar este campo en blanco para asignar tu primera contraseña.
                    </span>
                  </div>

                  <div className="dh-form-field">
                    <label htmlFor="nueva_contrasena">Nueva Contraseña *</label>
                    <div className="dh-input-password-wrap">
                      <input
                        id="nueva_contrasena"
                        type={showNewPass ? 'text' : 'password'}
                        required
                        minLength={6}
                        placeholder="Mínimo 6 caracteres"
                        value={passwordForm.nueva_contrasena}
                        onChange={(e) => setPasswordForm({ ...passwordForm, nueva_contrasena: e.target.value })}
                      />
                      <button
                        type="button"
                        className="dh-toggle-pass-btn"
                        onClick={() => setShowNewPass(!showNewPass)}
                        aria-label="Mostrar u ocultar contraseña"
                      >
                        <i className={`fa-solid ${showNewPass ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                      </button>
                    </div>
                    <span className="dh-field-hint">
                      La nueva contraseña debe tener al menos 6 caracteres y no puede ser igual a la actual.
                    </span>
                  </div>

                  <div className="dh-form-field">
                    <label htmlFor="confirmar_nueva_contrasena">Confirmar Nueva Contraseña *</label>
                    <div className="dh-input-password-wrap">
                      <input
                        id="confirmar_nueva_contrasena"
                        type={showConfirmPass ? 'text' : 'password'}
                        required
                        minLength={6}
                        placeholder="Repite tu nueva contraseña"
                        value={passwordForm.confirmar_nueva_contrasena}
                        onChange={(e) => setPasswordForm({ ...passwordForm, confirmar_nueva_contrasena: e.target.value })}
                      />
                      <button
                        type="button"
                        className="dh-toggle-pass-btn"
                        onClick={() => setShowConfirmPass(!showConfirmPass)}
                        aria-label="Mostrar u ocultar contraseña"
                      >
                        <i className={`fa-solid ${showConfirmPass ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                      </button>
                    </div>
                  </div>
                </div>

                <div className="dh-modal-footer">
                  <button
                    type="button"
                    className="dh-btn-secondary"
                    onClick={() => setShowSettingsModal(false)}
                  >
                    Cancelar
                  </button>
                  <button type="submit" className="dh-btn-primary" disabled={saving}>
                    {saving ? 'Guardando...' : 'Actualizar Contraseña'}
                  </button>
                </div>
              </form>
            )}

            {/* Pestaña: Notificaciones por correo */}
            {activeSettingsTab === 'notifications' && (
              <div className="dh-settings-section">
                <p className="dh-settings-desc">
                  Configura tus preferencias de correo. Los correos de pagos, facturas y confirmación de citas se envían de forma automática para tu seguridad.
                </p>

                <div className="dh-toggle-row">
                  <div className="dh-toggle-info">
                    <strong>Recordatorios de citas médicas</strong>
                    <span>Recibe avisos automáticos por correo 24 horas antes de cada cita veterinaria</span>
                  </div>
                  <label className="dh-switch">
                    <input
                      type="checkbox"
                      checked={notifPreferences.recordatorios_citas}
                      onChange={(e) => handleSaveNotifPreference(e.target.checked)}
                    />
                    <span className="dh-switch-slider"></span>
                  </label>
                </div>

                <div className="dh-modal-footer" style={{ marginTop: '2rem' }}>
                  <button
                    type="button"
                    className="dh-btn-primary"
                    onClick={() => setShowSettingsModal(false)}
                  >
                    Guardar Preferencias
                  </button>
                </div>
              </div>
            )}

            {/* Pestaña: Sesiones y Dispositivos */}
            {activeSettingsTab === 'security' && (
              <div className="dh-settings-section">
                <div className="dh-security-block">
                  <div className="dh-security-info">
                    <strong>Cerrar sesión en todos los dispositivos</strong>
                    <p className="dh-security-help">
                      Se cerrará tu sesión en este y en los demás dispositivos donde hayas ingresado.
                    </p>
                  </div>
                  <button
                    type="button"
                    className="dh-btn-outline-danger"
                    onClick={() => setShowLogoutAllConfirm(true)}
                    disabled={saving}
                  >
                    Cerrar sesión en todos los dispositivos
                  </button>
                </div>

                {showLogoutAllConfirm && (
                  <div className="dh-confirm-box">
                    <h4>Confirmar cierre de sesión en todos los dispositivos</h4>
                    <p>
                      ¿Deseas revocar el acceso a tu cuenta en todos los computadores y dispositivos móviles activos?
                    </p>
                    <div className="dh-confirm-actions">
                      <button
                        type="button"
                        className="dh-btn-secondary"
                        onClick={() => setShowLogoutAllConfirm(false)}
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        className="dh-btn-danger-confirm"
                        onClick={handleLogoutAllDevices}
                        disabled={saving}
                      >
                        Sí, cerrar en todos
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
