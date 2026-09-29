import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getStoredToken, getStoredUser, updateStoredUser, isValidAvatarUrl } from '../../utils/authStorage'
import SidebarVet from '../ui/SidebarVet'
import DashboardHeader from '../ui/DashboardHeader'
import './DashboardClient.css'
import './DashboardVeterinario.css'

export default function VetConfiguracion() {
  const navigate = useNavigate()
  const storedUser = getStoredUser()

  const [usuario, setUsuario] = useState({
    nombre: storedUser?.nombre || 'Dr. Veterinario',
    nombreCompleto: storedUser?.nombre || 'Médico Veterinario',
    especialidad: storedUser?.especialidad || '',
    numero_tarjeta: storedUser?.numero_tarjeta || '',
    telefono: storedUser?.telefono || '',
    foto: isValidAvatarUrl(storedUser?.foto || storedUser?.foto_perfil) ? (storedUser?.foto || storedUser?.foto_perfil) : null,
    rol: 'veterinario',
    email: storedUser?.email || storedUser?.correo || '',
  })

  const [activeTab, setActiveTab] = useState('perfil') // 'perfil' | 'seguridad'

  // Perfil Form State
  const [profileForm, setProfileForm] = useState({
    nombre: storedUser?.nombre || '',
    especialidad: storedUser?.especialidad || '',
    numero_tarjeta: storedUser?.numero_tarjeta || '',
    telefono: storedUser?.telefono || '',
    correo: storedUser?.email || storedUser?.correo || '',
  })

  // Foto State
  const [selectedFile, setSelectedFile] = useState(null)
  const [photoPreview, setPhotoPreview] = useState(storedUser?.foto || storedUser?.foto_perfil || null)

  // Password Form State
  const [changePassForm, setChangePassForm] = useState({
    contrasena_actual: '',
    nueva_contrasena: '',
    confirmar_nueva_contrasena: '',
  })

  const [showActualPass, setShowActualPass] = useState(false)
  const [showNuevaPass, setShowNuevaPass] = useState(false)
  const [showConfirmarPass, setShowConfirmarPass] = useState(false)

  // Feedback states
  const [submittingProfile, setSubmittingProfile] = useState(false)
  const [submittingPass, setSubmittingPass] = useState(false)
  const [profileSuccess, setProfileSuccess] = useState('')
  const [profileError, setProfileError] = useState('')
  const [passSuccess, setPassSuccess] = useState('')
  const [passError, setPassError] = useState('')

  // Toast
  const [toast, setToast] = useState(null)
  const triggerToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 4000)
  }

  // Fetch initial profile
  useEffect(() => {
    const fetchProfile = async () => {
      const token = getStoredToken()
      if (!token) return
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/veterinario/perfil`, {
          headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
        })
        if (res.ok) {
          const data = await res.json()
          if (data.veterinario) {
            setProfileForm({
              nombre: data.veterinario.nombre || '',
              especialidad: data.veterinario.especialidad || '',
              numero_tarjeta: data.veterinario.numero_tarjeta || '',
              telefono: data.veterinario.telefono || '',
              correo: data.veterinario.correo || usuario.email || '',
            })
            setPhotoPreview(data.veterinario.foto_perfil || null)
            setUsuario((prev) => ({
              ...prev,
              nombre: data.veterinario.nombre,
              nombreCompleto: data.veterinario.nombre,
              especialidad: data.veterinario.especialidad || '',
              numero_tarjeta: data.veterinario.numero_tarjeta || '',
              telefono: data.veterinario.telefono || '',
              foto: data.veterinario.foto_perfil || prev.foto,
            }))
          }
        }
      } catch (err) {
        console.error('Error al cargar perfil en configuración:', err)
      }
    }
    fetchProfile()
  }, [])

  // File change handler
  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (!file) return

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      setProfileError('Solo se permiten imágenes en formato JPG, JPEG, PNG o WEBP.')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setProfileError('La imagen seleccionada supera los 5 MB.')
      return
    }

    setProfileError('')
    setSelectedFile(file)
    setPhotoPreview(URL.createObjectURL(file))
  }

  // Submit Perfil
  const handleSubmitProfile = async (e) => {
    e.preventDefault()
    setSubmittingProfile(true)
    setProfileError('')
    setProfileSuccess('')

    if (!profileForm.nombre || !profileForm.nombre.trim()) {
      setProfileError('El nombre completo es obligatorio.')
      setSubmittingProfile(false)
      return
    }

    const token = getStoredToken()
    const formData = new FormData()
    formData.append('nombre', profileForm.nombre.trim())
    formData.append('especialidad', profileForm.especialidad ? profileForm.especialidad.trim() : '')
    formData.append('numero_tarjeta', profileForm.numero_tarjeta ? profileForm.numero_tarjeta.trim() : '')
    formData.append('telefono', profileForm.telefono ? profileForm.telefono.trim() : '')

    if (selectedFile) {
      formData.append('foto', selectedFile)
    }

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/veterinario/perfil/update`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
        body: formData,
      })

      const data = await res.json()

      if (!res.ok) {
        setProfileError(data.message || 'Error al actualizar el perfil del veterinario.')
        return
      }

      setProfileSuccess('¡Perfil del médico veterinario actualizado con éxito!')
      if (data.veterinario) {
        const updatedUserObj = {
          ...usuario,
          nombre: data.veterinario.nombre,
          nombreCompleto: data.veterinario.nombre,
          especialidad: data.veterinario.especialidad || '',
          numero_tarjeta: data.veterinario.numero_tarjeta || '',
          telefono: data.veterinario.telefono || '',
          correo: data.veterinario.correo || usuario.email,
          email: data.veterinario.correo || usuario.email,
          foto: data.veterinario.foto_perfil || usuario.foto,
        }
        setUsuario(updatedUserObj)
        updateStoredUser(updatedUserObj)
      }
      triggerToast('¡Perfil profesional actualizado correctamente!', 'success')
    } catch (err) {
      console.error('Error al actualizar perfil:', err)
      setProfileError('Error de red al intentar guardar los cambios.')
    } finally {
      setSubmittingProfile(false)
    }
  }

  // Submit Password
  const handleSubmitPassword = async (e) => {
    e.preventDefault()
    setSubmittingPass(true)
    setPassError('')
    setPassSuccess('')

    if (!changePassForm.contrasena_actual) {
      setPassError('Ingresa tu contraseña actual o temporal.')
      setSubmittingPass(false)
      return
    }

    if (changePassForm.nueva_contrasena.length < 6) {
      setPassError('La nueva contraseña debe tener al menos 6 caracteres.')
      setSubmittingPass(false)
      return
    }

    if (changePassForm.nueva_contrasena !== changePassForm.confirmar_nueva_contrasena) {
      setPassError('La confirmación de la contraseña no coincide.')
      setSubmittingPass(false)
      return
    }

    const token = getStoredToken()

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/veterinario/cambiar-password`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(changePassForm),
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        setPassError(data.message || 'No se pudo actualizar la contraseña.')
        return
      }

      setPassSuccess('¡Contraseña actualizada exitosamente!')
      setChangePassForm({ contrasena_actual: '', nueva_contrasena: '', confirmar_nueva_contrasena: '' })
      triggerToast('¡Contraseña actualizada con éxito!', 'success')
    } catch (err) {
      console.error('Error al cambiar contraseña:', err)
      setPassError('Error de conexión al intentar cambiar la clave.')
    } finally {
      setSubmittingPass(false)
    }
  }

  return (
    <div className="dash">
      <SidebarVet />

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
          title="Configuración de Cuenta"
          subtitle="Edita tus datos de perfil profesional y administra la seguridad de tu contraseña"
          usuario={usuario}
          onUserUpdated={setUsuario}
        />

        {/* ── BARRA PESTAÑAS ── */}
        <div className="vet-tabs-header" style={{ marginBottom: '1.5rem' }}>
          <div className="vet-tabs-nav">
            <button
              type="button"
              className={`vet-tab-btn ${activeTab === 'perfil' ? 'vet-tab-btn--active' : ''}`}
              onClick={() => setActiveTab('perfil')}
            >
              <i className="fa-solid fa-user-doctor"></i>
              <span>Mi Perfil Profesional</span>
            </button>

            <button
              type="button"
              className={`vet-tab-btn ${activeTab === 'seguridad' ? 'vet-tab-btn--active' : ''}`}
              onClick={() => setActiveTab('seguridad')}
            >
              <i className="fa-solid fa-shield-halved"></i>
              <span>Seguridad & Contraseña</span>
            </button>
          </div>
        </div>

        {/* ── CONTENIDO 1: PERFIL PROFESIONAL ── */}
        {activeTab === 'perfil' && (
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '1.75rem', maxWidth: '780px', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
            <div style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '1rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: '#ecfdf5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.15rem' }}>
                <i className="fa-solid fa-id-card"></i>
              </div>
              <div>
                <h3 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: '1.15rem', color: '#0f172a', margin: 0 }}>
                  Información Profesional de Médico Veterinario
                </h3>
                <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.84rem', color: '#64748b', margin: '0.15rem 0 0 0' }}>
                  Datos visibles para la asignación de citas y registros de atención clínica
                </p>
              </div>
            </div>

            {profileError && <div className="vet-modal-alert vet-modal-alert--error" style={{ marginBottom: '1.25rem' }}>{profileError}</div>}
            {profileSuccess && <div className="vet-modal-alert vet-modal-alert--success" style={{ marginBottom: '1.25rem' }}>{profileSuccess}</div>}

            <form onSubmit={handleSubmitProfile}>
              {/* Foto de perfil */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '1.5rem', padding: '1rem', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <div style={{ width: '80px', height: '80px', borderRadius: '50%', overflow: 'hidden', border: '3px solid #059669', flexShrink: 0 }}>
                  {photoPreview ? (
                    <img src={photoPreview} alt="Perfil" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', background: '#059669', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.75rem', fontWeight: 700 }}>
                      {usuario.nombre ? usuario.nombre[0].toUpperCase() : 'V'}
                    </div>
                  )}
                </div>

                <div>
                  <strong style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.9rem', color: '#0f172a', display: 'block', marginBottom: '0.2rem' }}>
                    Foto de Perfil Profesional
                  </strong>
                  <span style={{ fontSize: '0.78rem', color: '#64748b', display: 'block', marginBottom: '0.65rem' }}>
                    Sube una foto clara en formato JPG, PNG o WEBP (máx. 5 MB).
                  </span>
                  <label className="dh-btn-upload" style={{ display: 'inline-flex', padding: '0.45rem 0.85rem' }}>
                    <input type="file" accept="image/png, image/jpeg, image/jpg, image/webp" onChange={handleFileChange} style={{ display: 'none' }} />
                    <i className="fa-solid fa-camera"></i>
                    <span>{selectedFile ? 'Cambiar archivo' : 'Elegir nueva imagen'}</span>
                  </label>
                </div>
              </div>

              {/* Grid de Campos */}
              <div className="dh-info-grid" style={{ gap: '1.1rem' }}>
                <div className="dh-form-field">
                  <label htmlFor="nombre">Nombre Completo *</label>
                  <input
                    id="nombre"
                    type="text"
                    required
                    placeholder="Dr. Nombre Apellido"
                    value={profileForm.nombre}
                    onChange={(e) => setProfileForm({ ...profileForm, nombre: e.target.value })}
                  />
                </div>

                <div className="dh-form-field">
                  <label htmlFor="especialidad">Especialidad Médica</label>
                  <input
                    id="especialidad"
                    type="text"
                    placeholder="ej. Cirugía Veterinaria, Medicina Interna, Consulta General"
                    value={profileForm.especialidad}
                    onChange={(e) => setProfileForm({ ...profileForm, especialidad: e.target.value })}
                  />
                </div>

                <div className="dh-form-field">
                  <label htmlFor="numero_tarjeta">Número de Tarjeta Profesional</label>
                  <input
                    id="numero_tarjeta"
                    type="text"
                    placeholder="ej. TP-123456"
                    value={profileForm.numero_tarjeta}
                    onChange={(e) => setProfileForm({ ...profileForm, numero_tarjeta: e.target.value })}
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

                <div className="dh-form-field dh-form-field--full">
                  <label htmlFor="correo">Correo Electrónico Institucional (Solo Lectura)</label>
                  <input
                    id="correo"
                    type="email"
                    readOnly
                    disabled
                    style={{ background: '#f8fafc', color: '#64748b', cursor: 'not-allowed' }}
                    value={profileForm.correo}
                  />
                  <span className="dh-field-hint">Tu correo electrónico institucional no se puede modificar desde esta vista.</span>
                </div>
              </div>

              <div style={{ marginTop: '1.75rem', paddingTop: '1.1rem', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'flex-end' }}>
                <button type="submit" className="vet-modal-btn vet-modal-btn--primary" disabled={submittingProfile}>
                  {submittingProfile ? (
                    <>
                      <i className="fa-solid fa-spinner fa-spin"></i>
                      <span>Guardando Cambios...</span>
                    </>
                  ) : (
                    <>
                      <i className="fa-solid fa-floppy-disk"></i>
                      <span>Guardar Perfil Profesional</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ── CONTENIDO 2: SEGURIDAD & CONTRASEÑA ── */}
        {activeTab === 'seguridad' && (
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '1.75rem', maxWidth: '560px', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
            <div style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '1rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: '#fffbeb', color: '#d97706', border: '1px solid #fde68a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.15rem' }}>
                <i className="fa-solid fa-key"></i>
              </div>
              <div>
                <h3 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: '1.15rem', color: '#0f172a', margin: 0 }}>
                  Cambio de Contraseña
                </h3>
                <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.84rem', color: '#64748b', margin: '0.15rem 0 0 0' }}>
                  Actualiza tu contraseña de acceso para mantener segura tu cuenta médica
                </p>
              </div>
            </div>

            {passError && <div className="vet-modal-alert vet-modal-alert--error" style={{ marginBottom: '1.25rem' }}>{passError}</div>}
            {passSuccess && <div className="vet-modal-alert vet-modal-alert--success" style={{ marginBottom: '1.25rem' }}>{passSuccess}</div>}

            <form onSubmit={handleSubmitPassword} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
              <div className="vet-modal-field" style={{ marginBottom: 0 }}>
                <label htmlFor="contrasena_actual" style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '0.86rem', color: '#334155' }}>
                  Contraseña Actual o Temporal *
                </label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <input
                    id="contrasena_actual"
                    type={showActualPass ? 'text' : 'password'}
                    required
                    className="vet-modal-textarea"
                    style={{ height: '44px', minHeight: 'auto', padding: '0.6rem 2.6rem 0.6rem 0.9rem', borderRadius: '10px', width: '100%' }}
                    placeholder="Ingresa tu clave actual o temporal"
                    value={changePassForm.contrasena_actual}
                    onChange={(e) => setChangePassForm({ ...changePassForm, contrasena_actual: e.target.value })}
                  />
                  <button
                    type="button"
                    onClick={() => setShowActualPass(!showActualPass)}
                    style={{ position: 'absolute', right: '10px', background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: '6px' }}
                    title={showActualPass ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    tabIndex={-1}
                  >
                    <i className={`fa-solid ${showActualPass ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                  </button>
                </div>
              </div>

              <div className="vet-modal-field" style={{ marginBottom: 0 }}>
                <label htmlFor="nueva_contrasena" style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '0.86rem', color: '#334155' }}>
                  Nueva Contraseña *
                </label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <input
                    id="nueva_contrasena"
                    type={showNuevaPass ? 'text' : 'password'}
                    required
                    minLength={6}
                    className="vet-modal-textarea"
                    style={{ height: '44px', minHeight: 'auto', padding: '0.6rem 2.6rem 0.6rem 0.9rem', borderRadius: '10px', width: '100%' }}
                    placeholder="Mínimo 6 caracteres"
                    value={changePassForm.nueva_contrasena}
                    onChange={(e) => setChangePassForm({ ...changePassForm, nueva_contrasena: e.target.value })}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNuevaPass(!showNuevaPass)}
                    style={{ position: 'absolute', right: '10px', background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: '6px' }}
                    title={showNuevaPass ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    tabIndex={-1}
                  >
                    <i className={`fa-solid ${showNuevaPass ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                  </button>
                </div>
              </div>

              <div className="vet-modal-field" style={{ marginBottom: 0 }}>
                <label htmlFor="confirmar_nueva_contrasena" style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '0.86rem', color: '#334155' }}>
                  Confirmar Nueva Contraseña *
                </label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <input
                    id="confirmar_nueva_contrasena"
                    type={showConfirmarPass ? 'text' : 'password'}
                    required
                    minLength={6}
                    className="vet-modal-textarea"
                    style={{ height: '44px', minHeight: 'auto', padding: '0.6rem 2.6rem 0.6rem 0.9rem', borderRadius: '10px', width: '100%' }}
                    placeholder="Repite la nueva contraseña"
                    value={changePassForm.confirmar_nueva_contrasena}
                    onChange={(e) => setChangePassForm({ ...changePassForm, confirmar_nueva_contrasena: e.target.value })}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmarPass(!showConfirmarPass)}
                    style={{ position: 'absolute', right: '10px', background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: '6px' }}
                    title={showConfirmarPass ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    tabIndex={-1}
                  >
                    <i className={`fa-solid ${showConfirmarPass ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                  </button>
                </div>
              </div>

              <div style={{ marginTop: '1.25rem', paddingTop: '1.1rem', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'flex-end' }}>
                <button type="submit" className="vet-modal-btn vet-modal-btn--primary" disabled={submittingPass}>
                  {submittingPass ? (
                    <>
                      <i className="fa-solid fa-spinner fa-spin"></i>
                      <span>Actualizando Contraseña...</span>
                    </>
                  ) : (
                    <>
                      <i className="fa-solid fa-shield-halved"></i>
                      <span>Actualizar Contraseña</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </main>
    </div>
  )
}
