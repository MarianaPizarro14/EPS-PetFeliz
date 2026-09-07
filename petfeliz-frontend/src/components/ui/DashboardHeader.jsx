import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import CustomDatePicker from '../ui/CustomDatePicker'
import { DEPARTAMENTOS_Y_CIUDADES_COLOMBIA } from '../../data/departamentosYCiudadesColombia'
import { DEFAULT_USER_AVATAR } from '../../constants/images'
import { getStoredToken, clearStoredAuth } from '../../utils/authStorage'
import './DashboardHeader.css'


// Componente de búsqueda autocompletada de Ciudad
const SearchableCitySelect = ({ value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState(value || '')
  const dropdownRef = useRef(null)

  useEffect(() => {
    setSearchTerm(value || '')
  }, [value])

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const filteredCities = CIUDADES_COLOMBIA.filter((city) =>
    city.toLowerCase().includes((searchTerm || '').toLowerCase())
  )

  return (
    <div className="dh-city-search-wrap" ref={dropdownRef}>
      <div className="dh-city-input-box">
        <input
          type="text"
          className="dh-city-input"
          placeholder="Busca o selecciona tu ciudad (ej. Medellín, Bogotá)"
          value={searchTerm}
          onFocus={() => setIsOpen(true)}
          onChange={(e) => {
            const val = e.target.value
            setSearchTerm(val)
            onChange(val)
            setIsOpen(true)
          }}
        />
        <i className="fa-solid fa-chevron-down dh-city-arrow"></i>
      </div>

      {isOpen && (
        <ul className="dh-city-dropdown">
          {filteredCities.length === 0 ? (
            <li className="dh-city-item dh-city-item--empty">No se encontraron ciudades</li>
          ) : (
            filteredCities.map((city) => (
              <li
                key={city}
                className={`dh-city-item ${city === value ? 'dh-city-item--selected' : ''}`}
                onClick={() => {
                  onChange(city)
                  setSearchTerm(city)
                  setIsOpen(false)
                }}
              >
                <i className="fa-solid fa-location-dot dh-city-item-icon"></i>
                <span>{city}</span>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  )
}


export default function DashboardHeader({
  title,
  subtitle,
  usuario,
  onUserUpdated,
  extraActions,
  openProfileTrigger,
}) {
  const navigate = useNavigate()

  // Estados para desplegables
  const [showNotifs, setShowNotifs] = useState(false)
  const [showProfileMenu, setShowProfileMenu] = useState(false)

  // Modales
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [activeProfileTab, setActiveProfileTab] = useState('info') // 'info' | 'photo'

  useEffect(() => {
    if (openProfileTrigger) {
      setShowProfileModal(true)
      setActiveProfileTab('info')
    }
  }, [openProfileTrigger])

  const [showSettingsModal, setShowSettingsModal] = useState(false)
  const [activeSettingsTab, setActiveSettingsTab] = useState('password') // 'password' | 'notifications' | 'security'
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  // Refs para detectar clic fuera
  const notifRef = useRef(null)
  const profileRef = useRef(null)

  // Estado de Notificaciones
  const [notifications, setNotifications] = useState([])


  // Formulario de edición de perfil completo
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


  // Preferencias de notificaciones
  const [notifPreferences, setNotifPreferences] = useState({
    notificaciones_email: true,
    recordatorios_citas: true,
  })

  // Formulario de cambio de contraseña
  const [passwordForm, setPasswordForm] = useState({
    contrasena_actual: '',
    nueva_contrasena: '',
    confirmar_nueva_contrasena: '',
  })

  const [selectedFile, setSelectedFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)

  const [saving, setSaving] = useState(false)
  const [modalError, setModalError] = useState('')
  const [modalSuccess, setModalSuccess] = useState('')

  // Sincronizar datos del perfil cuando cambia el prop usuario
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
        notificaciones_email: usuario.notificaciones_email !== undefined ? Boolean(usuario.notificaciones_email) : true,
        recordatorios_citas: usuario.recordatorios_citas !== undefined ? Boolean(usuario.recordatorios_citas) : true,
      })
      setImagePreview(usuario.foto || null)
    }
  }, [usuario])

  // Cargar notificaciones desde el backend
  const fetchNotifications = async () => {
    const token = getStoredToken()
    if (!token) return
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/notificaciones`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
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
  }, [])


  // Clic fuera para notificaciones
  useEffect(() => {
    const handleClickOutsideNotif = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifs(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutsideNotif)
    return () => document.removeEventListener('mousedown', handleClickOutsideNotif)
  }, [])

  // Clic fuera para menú de perfil
  useEffect(() => {
    const handleClickOutsideProfile = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setShowProfileMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutsideProfile)
    return () => document.removeEventListener('mousedown', handleClickOutsideProfile)
  }, [])

  // Conteo exacto de no leídas
  const unreadCount = notifications.filter((n) => !n.read).length

  // Marcar todas como leídas en BD
  const handleMarkAllAsRead = async (e) => {
    e?.stopPropagation()
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))

    const token = getStoredToken()
    if (!token) return
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/notificaciones/marcar-leidas`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      })
      if (res.ok) {
        const data = await res.json()
        if (data.notifications) setNotifications(data.notifications)
      }
    } catch (err) {
      console.error('Error al marcar notificaciones:', err)
    }
  }

  // Eliminar una notificación en BD
  const handleRemoveNotif = async (id, e) => {
    e?.stopPropagation()
    setNotifications((prev) => prev.filter((n) => n.id !== id))

    const token = getStoredToken()
    if (!token) return
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/notificaciones/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      })
      if (res.ok) {
        const data = await res.json()
        if (data.notifications) setNotifications(data.notifications)
      }
    } catch (err) {
      console.error('Error al eliminar notificación:', err)
    }
  }


  // Cierre de sesión simple
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

  // Selección de archivo de imagen con validación (Máx. 5 MB)
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
      setModalError('La imagen seleccionada supera el tamaño máximo de 5 MB.')
      return
    }

    setModalError('')
    setSelectedFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  // Abrir modal de Perfil
  const handleOpenProfileModal = (tab = 'info') => {
    setActiveProfileTab(tab)
    setSelectedFile(null)
    setImagePreview(usuario?.foto || null)
    setModalError('')
    setModalSuccess('')
    setShowProfileMenu(false)
    setShowProfileModal(true)
  }

  // Abrir modal de Configuración
  const handleOpenSettingsModal = (tab = 'password') => {
    setActiveSettingsTab(tab)
    setPasswordForm({ contrasena_actual: '', nueva_contrasena: '', confirmar_nueva_contrasena: '' })
    setModalError('')
    setModalSuccess('')
    setShowDeleteConfirm(false)
    setShowProfileMenu(false)
    setShowSettingsModal(true)
  }

  // Guardar datos del Perfil o Foto
  const handleSaveProfile = async (e) => {
    e.preventDefault()
    setSaving(true)
    setModalError('')
    setModalSuccess('')

    // Validación básica de teléfono o documento
    if (profileForm.telefono && !/^[0-9+\s-]{7,15}$/.test(profileForm.telefono)) {
      setModalError('El teléfono ingresado debe contener entre 7 y 15 dígitos numéricos.')
      setSaving(false)
      return
    }

    const token = getStoredToken()
    const bodyFormData = new FormData()

    Object.keys(profileForm).forEach((key) => {
      bodyFormData.append(key, profileForm[key] || '')
    })

    if (selectedFile) {
      bodyFormData.append('foto', selectedFile)
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
        setModalError(data.message || 'Error al actualizar el perfil.')
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

    if (passwordForm.nueva_contrasena !== passwordForm.confirmar_nueva_contrasena) {
      setModalError('La nueva contraseña y su confirmación no coinciden.')
      setSaving(false)
      return
    }

    if (passwordForm.nueva_contrasena.length < 6) {
      setModalError('La nueva contraseña debe tener al menos 6 caracteres.')
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

      setModalSuccess('¡Contraseña cambiada con éxito!')
      setPasswordForm({ contrasena_actual: '', nueva_contrasena: '', confirmar_nueva_contrasena: '' })
    } catch (err) {
      console.error(err)
      setModalError('No se pudo actualizar la contraseña.')
    } finally {
      setSaving(false)
    }
  }

  // Guardar Preferencias de Notificaciones
  const handleSaveNotifPreferences = async (newPrefs) => {
    setNotifPreferences(newPrefs)
    setModalError('')
    setModalSuccess('')

    const token = getStoredToken()
    const bodyFormData = new FormData()
    bodyFormData.append('notificaciones_email', newPrefs.notificaciones_email)
    bodyFormData.append('recordatorios_citas', newPrefs.recordatorios_citas)

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
        setModalSuccess('Preferencias de notificaciones guardadas.')
        if (onUserUpdated && data.cliente) {
          onUserUpdated(data.cliente)
        }
      }
    } catch (err) {
      console.error(err)
    }
  }

  // Cerrar sesión en todos los dispositivos
  const handleLogoutAllDevices = async () => {
    setSaving(true)
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
    clearStoredAuth()
      navigate('/login')
    }
  }

  // Eliminar Cuenta
  const handleDeleteAccountConfirm = async () => {
    setSaving(true)
    const token = getStoredToken()

    try {
      await fetch(`${import.meta.env.VITE_API_URL}/perfil/delete-account`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      })
    } catch (err) {
      console.error(err)
    } finally {
    clearStoredAuth()
      navigate('/login')
    }
  }

  return (
    <header className="dash-header">
      <div>
        <h1 className="dash-header__title">{title}</h1>
        {subtitle && <p className="dash-header__subtitle">{subtitle}</p>}
      </div>

      <div className="dash-header__right">
        {extraActions}

        {/* ── 1. NOTIFICACIONES (Campana con badge y desplegable) ── */}
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
                    Marcar leídas
                  </button>
                )}
              </div>

              <div className="dh-notif-list">
                {notifications.length === 0 ? (
                  <div className="dh-notif-empty">
                    <i className="fa-regular fa-bell-slash"></i>
                    <p>No tienes notificaciones nuevas</p>
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`dh-notif-item ${!n.read ? 'dh-notif-item--unread' : ''}`}
                      onClick={() => {
                        setNotifications((prev) =>
                          prev.map((item) => (item.id === n.id ? { ...item, read: true } : item))
                        )
                      }}
                    >
                      <div className="dh-notif-icon">
                        <i className={n.icon}></i>
                      </div>
                      <div className="dh-notif-content">
                        <span className="dh-notif-title">{n.title}</span>
                        <p className="dh-notif-text">{n.text}</p>
                        <span className="dh-notif-time">{n.time}</span>
                      </div>
                      <button
                        type="button"
                        className="dh-notif-close"
                        onClick={(e) => handleRemoveNotif(n.id, e)}
                        title="Eliminar"
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

        {/* ── 2. FOTO Y MENÚ DE PERFIL ── */}
        <div className="dash-header__user-wrap" ref={profileRef}>
          <button
            type="button"
            className="dash-header__user-btn"
            onClick={() => {
              setShowProfileMenu(!showProfileMenu)
              setShowNotifs(false)
            }}
          >
            <span className="dash-header__user">
              {usuario?.nombreCompleto || usuario?.nombre || 'Usuario'}
            </span>
            <img
              className="dash-header__avatar"
              src={!usuario?.foto || usuario?.foto === 'default.jpg' || usuario?.foto.includes('default.jpg') ? DEFAULT_USER_AVATAR : usuario.foto}
              alt={usuario?.nombreCompleto || usuario?.nombre || 'Usuario'}
              onError={(e) => { e.target.onerror = null; e.target.src = DEFAULT_USER_AVATAR }}
            />
            <i className="fa-solid fa-chevron-down dh-chevron-icon"></i>
          </button>

          {showProfileMenu && (
            <div className="dh-dropdown dh-dropdown--profile">
              <div className="dh-profile-card">
                <img
                  className="dh-profile-card__avatar"
                  src={!usuario?.foto || usuario?.foto === 'default.jpg' || usuario?.foto.includes('default.jpg') ? DEFAULT_USER_AVATAR : usuario.foto}
                  alt={usuario?.nombreCompleto || usuario?.nombre}
                  onError={(e) => { e.target.onerror = null; e.target.src = DEFAULT_USER_AVATAR }}
                />
                <div className="dh-profile-card__info">
                  <strong>{usuario?.nombreCompleto || usuario?.nombre}</strong>
                  <span>{usuario?.email || 'Cliente PetFeliz'}</span>
                </div>
              </div>

              <div className="dh-menu-divider"></div>

              <nav className="dh-menu-links">
                <button type="button" className="dh-menu-item" onClick={() => handleOpenProfileModal('info')}>
                  <i className="fa-regular fa-id-card"></i>
                  <span>Editar información personal</span>
                </button>

                <button type="button" className="dh-menu-item" onClick={() => handleOpenProfileModal('photo')}>
                  <i className="fa-solid fa-camera"></i>
                  <span>Cambiar foto de perfil</span>
                </button>

                <button type="button" className="dh-menu-item" onClick={() => handleOpenSettingsModal('password')}>
                  <i className="fa-solid fa-gear"></i>
                  <span>Configuración de cuenta</span>
                </button>

                <div className="dh-menu-divider"></div>

                <button type="button" className="dh-menu-item dh-menu-item--logout" onClick={handleLogout}>
                  <i className="fa-solid fa-right-from-bracket"></i>
                  <span>Cerrar sesión</span>
                </button>
              </nav>
            </div>
          )}
        </div>
      </div>

      {/* ── 3. MODAL EDITAR INFORMACIÓN PERSONAL / FOTO ── */}
      {showProfileModal && (
        <div className="dh-modal-backdrop">
          <div className="dh-modal-box dh-modal-box--wide">
            <div className="dh-modal-header">
              <h3>Información Personal y Perfil</h3>
              <button
                type="button"
                className="dh-modal-close"
                onClick={() => setShowProfileModal(false)}
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            {/* Pestañas de Navegación del Perfil */}
            <div className="dh-modal-tabs">
              <button
                type="button"
                className={`dh-modal-tab ${activeProfileTab === 'info' ? 'dh-modal-tab--active' : ''}`}
                onClick={() => setActiveProfileTab('info')}
              >
                <i className="fa-regular fa-id-card"></i> Datos Personales
              </button>
              <button
                type="button"
                className={`dh-modal-tab ${activeProfileTab === 'photo' ? 'dh-modal-tab--active' : ''}`}
                onClick={() => setActiveProfileTab('photo')}
              >
                <i className="fa-solid fa-camera"></i> Foto de Perfil
              </button>
            </div>

            {modalError && <div className="dh-modal-alert dh-modal-alert--error">{modalError}</div>}
            {modalSuccess && <div className="dh-modal-alert dh-modal-alert--success">{modalSuccess}</div>}

            <form onSubmit={handleSaveProfile} className="dh-profile-form">
              {activeProfileTab === 'info' ? (
                <div className="dh-info-grid">
                  <div className="dh-form-field">
                    <label>Nombre Completo *</label>
                    <input
                      type="text"
                      required
                      placeholder="Tu nombre completo"
                      value={profileForm.nombre}
                      onChange={(e) => setProfileForm({ ...profileForm, nombre: e.target.value })}
                    />
                  </div>

                  <div className="dh-form-field">
                    <label>Cédula / Documento de Identidad</label>
                    <input
                      type="text"
                      placeholder="ej. 1020304050"
                      value={profileForm.cedula}
                      onChange={(e) => setProfileForm({ ...profileForm, cedula: e.target.value })}
                    />
                  </div>

                  <div className="dh-form-field">
                    <label>Fecha de Nacimiento</label>
                    <CustomDatePicker
                      value={profileForm.fecha_nacimiento}
                      onChange={(val) => setProfileForm({ ...profileForm, fecha_nacimiento: val })}
                      placeholder="Selecciona fecha de nacimiento"
                    />
                  </div>

                  <div className="dh-form-field">
                    <label>Teléfono de Contacto</label>
                    <input
                      type="text"
                      placeholder="ej. 3001234567"
                      value={profileForm.telefono}
                      onChange={(e) => setProfileForm({ ...profileForm, telefono: e.target.value })}
                    />
                  </div>

                  <div className="dh-form-field">
                    <label>Dirección de Residencia</label>
                    <input
                      type="text"
                      placeholder="ej. Calle 10 # 20 - 30"
                      value={profileForm.direccion}
                      onChange={(e) => setProfileForm({ ...profileForm, direccion: e.target.value })}
                    />
                  </div>

                  <div className="dh-form-field">
                    <label>Departamento</label>
                    <select
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
                    <label>Ciudad / Municipio</label>
                    {!profileForm.departamento ? (
                      <select disabled className="dh-select-disabled">
                        <option value="">Selecciona primero un departamento</option>
                      </select>
                    ) : (
                      <select
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
                    <label>Nombre de Contacto</label>
                    <input
                      type="text"
                      placeholder="Nombre del familiar / contacto"
                      value={profileForm.contacto_emergencia_nombre}
                      onChange={(e) => setProfileForm({ ...profileForm, contacto_emergencia_nombre: e.target.value })}
                    />
                  </div>

                  <div className="dh-form-field">
                    <label>Teléfono de Emergencia</label>
                    <input
                      type="text"
                      placeholder="ej. 3109876543"
                      value={profileForm.contacto_emergencia_telefono}
                      onChange={(e) => setProfileForm({ ...profileForm, contacto_emergencia_telefono: e.target.value })}
                    />
                  </div>
                </div>
              ) : (
                <div className="dh-photo-section">
                  <label className="dh-field-label">Foto de Perfil Actual</label>
                  <div className="dh-photo-preview-wrap">
                    <img
                      src={imagePreview || (!usuario?.foto || usuario?.foto === 'default.jpg' || usuario?.foto.includes('default.jpg') ? DEFAULT_USER_AVATAR : usuario.foto)}
                      alt="Vista previa de perfil"
                      className="dh-photo-preview-img"
                      onError={(e) => { e.target.onerror = null; e.target.src = DEFAULT_USER_AVATAR }}
                    />
                  </div>

                  <label className="dh-photo-upload-btn">
                    <input
                      type="file"
                      accept="image/png, image/jpeg, image/jpg, image/webp"
                      onChange={handleFileChange}
                      style={{ display: 'none' }}
                    />
                    <i className="fa-solid fa-cloud-arrow-up"></i>
                    <span>{selectedFile ? 'Cambiar imagen seleccionada' : 'Subir nueva foto desde tu dispositivo'}</span>
                  </label>
                  <span className="dh-photo-hint">Formatos permitidos: JPG, JPEG, PNG o WEBP (Máx. 5 MB)</span>
                </div>
              )}

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

      {/* ── 4. MODAL CONFIGURACIÓN DE CUENTA ── */}
      {showSettingsModal && (
        <div className="dh-modal-backdrop">
          <div className="dh-modal-box dh-modal-box--wide">

            <div className="dh-modal-header">
              <h3>Configuración de Cuenta</h3>
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
                <i className="fa-solid fa-lock"></i> Contraseña
              </button>
              <button
                type="button"
                className={`dh-modal-tab ${activeSettingsTab === 'notifications' ? 'dh-modal-tab--active' : ''}`}
                onClick={() => { setActiveSettingsTab('notifications'); setModalError(''); setModalSuccess('') }}
              >
                <i className="fa-regular fa-bell"></i> Notificaciones
              </button>
              <button
                type="button"
                className={`dh-modal-tab ${activeSettingsTab === 'security' ? 'dh-modal-tab--active' : ''}`}
                onClick={() => { setActiveSettingsTab('security'); setModalError(''); setModalSuccess('') }}
              >
                <i className="fa-solid fa-shield-halved"></i> Seguridad
              </button>
            </div>

            {modalError && <div className="dh-modal-alert dh-modal-alert--error">{modalError}</div>}
            {modalSuccess && <div className="dh-modal-alert dh-modal-alert--success">{modalSuccess}</div>}

            {activeSettingsTab === 'password' && (
              <form onSubmit={handleChangePassword} className="dh-profile-form">
                <div className="dh-info-section">
                  <div className="dh-form-field">
                    <label>Contraseña Actual *</label>
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={passwordForm.contrasena_actual}
                      onChange={(e) => setPasswordForm({ ...passwordForm, contrasena_actual: e.target.value })}
                    />
                  </div>

                  <div className="dh-form-field">
                    <label>Nueva Contraseña * (Mínimo 6 caracteres)</label>
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={passwordForm.nueva_contrasena}
                      onChange={(e) => setPasswordForm({ ...passwordForm, nueva_contrasena: e.target.value })}
                    />
                  </div>

                  <div className="dh-form-field">
                    <label>Confirmar Nueva Contraseña *</label>
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={passwordForm.confirmar_nueva_contrasena}
                      onChange={(e) => setPasswordForm({ ...passwordForm, confirmar_nueva_contrasena: e.target.value })}
                    />
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
                    {saving ? 'Guardando...' : 'Cambiar Contraseña'}
                  </button>
                </div>
              </form>
            )}

            {activeSettingsTab === 'notifications' && (
              <div className="dh-settings-section">
                <p className="dh-settings-desc">
                  Configura cómo deseas recibir avisos, recordatorios médicos de tus mascotas y novedades del sistema.
                </p>

                <div className="dh-toggle-row">
                  <div className="dh-toggle-info">
                    <strong>Notificaciones por Correo Electrónico</strong>
                    <span>Recibe confirmaciones de citas y novedades en tu email</span>
                  </div>
                  <label className="dh-switch">
                    <input
                      type="checkbox"
                      checked={notifPreferences.notificaciones_email}
                      onChange={(e) =>
                        handleSaveNotifPreferences({
                          ...notifPreferences,
                          notificaciones_email: e.target.checked,
                        })
                      }
                    />
                    <span className="dh-switch-slider"></span>
                  </label>
                </div>

                <div className="dh-toggle-row">
                  <div className="dh-toggle-info">
                    <strong>Recordatorios de Citas y Vacunación</strong>
                    <span>Avisos automáticos de citas médicas y calendarios de salud</span>
                  </div>
                  <label className="dh-switch">
                    <input
                      type="checkbox"
                      checked={notifPreferences.recordatorios_citas}
                      onChange={(e) =>
                        handleSaveNotifPreferences({
                          ...notifPreferences,
                          recordatorios_citas: e.target.checked,
                        })
                      }
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
                    Entendido
                  </button>
                </div>
              </div>
            )}

            {activeSettingsTab === 'security' && (
              <div className="dh-settings-section">
                <div className="dh-security-block">
                  <div className="dh-security-info">
                    <strong>Cerrar sesión en todos los dispositivos</strong>
                    <p>Invalida todos los tokens de acceso activos en computadores y celulares.</p>
                  </div>
                  <button
                    type="button"
                    className="dh-btn-outline-danger"
                    onClick={handleLogoutAllDevices}
                    disabled={saving}
                  >
                    <i className="fa-solid fa-power-off"></i> Cerrar sesión global
                  </button>
                </div>

                <div className="dh-menu-divider" style={{ margin: '1.5rem 0' }}></div>

                <div className="dh-security-block dh-security-block--danger">
                  <div className="dh-security-info">
                    <strong style={{ color: '#dc2626' }}>Eliminar mi cuenta</strong>
                    <p>Esta acción deshabilitará permanentemente tu cuenta y tu historial en PetFeliz.</p>
                  </div>
                  <button
                    type="button"
                    className="dh-btn-danger"
                    onClick={() => setShowDeleteConfirm(true)}
                  >
                    <i className="fa-solid fa-trash-can"></i> Eliminar Cuenta
                  </button>
                </div>

                {showDeleteConfirm && (
                  <div className="dh-confirm-box">
                    <h4>¿Estás completamente seguro?</h4>
                    <p>Se desactivará tu acceso a EPS PetFeliz y se cerrará tu sesión de forma permanente.</p>
                    <div className="dh-confirm-actions">
                      <button
                        type="button"
                        className="dh-btn-secondary"
                        onClick={() => setShowDeleteConfirm(false)}
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        className="dh-btn-danger-confirm"
                        onClick={handleDeleteAccountConfirm}
                        disabled={saving}
                      >
                        Sí, Eliminar Cuenta
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
