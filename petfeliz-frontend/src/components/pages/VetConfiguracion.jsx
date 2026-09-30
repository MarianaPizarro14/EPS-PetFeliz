import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { getStoredToken, getStoredUser, updateStoredUser, isValidAvatarUrl } from '../../utils/authStorage'
import SidebarVet from '../ui/SidebarVet'
import DashboardHeader from '../ui/DashboardHeader'
import './DashboardClient.css'
import './DashboardVeterinario.css'

const ESPECIALIDADES_LIST = [
  'Medicina General',
  'Cirugía',
  'Dermatología',
  'Odontología',
  'Cardiología',
  'Oftalmología',
  'Urgencias',
  'Desparasitación',
  'Vacunación',
  'Laboratorio Clínico',
  'Médico Director',
]

// Helper para separar prefijo (Dr. / Dra.) del nombre
const parseNombreYPrefijo = (fullNombre) => {
  if (!fullNombre) return { prefijo: 'Dr.', nombreSolo: '' }
  let str = fullNombre.trim()
  if (/^dra\.?\s+/i.test(str)) {
    return { prefijo: 'Dra.', nombreSolo: str.replace(/^dra\.?\s*/i, '') }
  }
  if (/^dr\.?\s+/i.test(str)) {
    return { prefijo: 'Dr.', nombreSolo: str.replace(/^dr\.?\s*/i, '') }
  }
  return { prefijo: 'Dr.', nombreSolo: str }
}

export default function VetConfiguracion() {
  const navigate = useNavigate()
  const storedUser = getStoredUser()
  const initialParsed = parseNombreYPrefijo(storedUser?.nombre || '')

  const [usuario, setUsuario] = useState({
    prefijo: initialParsed.prefijo,
    nombreSolo: initialParsed.nombreSolo,
    nombre: storedUser?.nombre || 'Dr. Veterinario',
    nombreCompleto: storedUser?.nombre || 'Médico Veterinario',
    cedula: storedUser?.cedula || storedUser?.documento || '',
    especialidad: storedUser?.especialidad || 'Medicina General',
    numero_tarjeta: storedUser?.numero_tarjeta || '',
    telefono: storedUser?.telefono || '',
    foto: isValidAvatarUrl(storedUser?.foto || storedUser?.foto_perfil) ? (storedUser?.foto || storedUser?.foto_perfil) : null,
    rol: 'veterinario',
    email: storedUser?.email || storedUser?.correo || '',
  })

  const [activeTab, setActiveTab] = useState('perfil') // 'perfil' | 'seguridad'

  // Perfil Form State
  const [profileForm, setProfileForm] = useState({
    prefijo: initialParsed.prefijo,
    nombreSolo: initialParsed.nombreSolo,
    cedula: storedUser?.cedula || storedUser?.documento || '',
    especialidad: storedUser?.especialidad || 'Medicina General',
    numero_tarjeta: storedUser?.numero_tarjeta || '',
    telefono: storedUser?.telefono || '',
    correo: storedUser?.email || storedUser?.correo || '',
  })

  // Selected & Cropped Photo State
  const [selectedFile, setSelectedFile] = useState(null)
  const [photoPreview, setPhotoPreview] = useState(storedUser?.foto || storedUser?.foto_perfil || null)

  // Interactive Crop Modal Pop-up State
  const [showCropModal, setShowCropModal] = useState(false)
  const [tempPhotoFile, setTempPhotoFile] = useState(null)
  const [tempPhotoPreview, setTempPhotoPreview] = useState(null)
  const [tempZoom, setTempZoom] = useState(1)
  const [cropCirclePos, setCropCirclePos] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })

  const cropStageRef = useRef(null)
  const cropImgRef = useRef(null)

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

  // Password Validation Helpers
  const nuevaPass = changePassForm.nueva_contrasena
  const passHasMinLength = nuevaPass.length >= 6
  const passHasUppercase = /[A-Z]/.test(nuevaPass)
  const digitMatches = nuevaPass.match(/\d/g)
  const passHas4Digits = digitMatches ? digitMatches.length >= 4 : false

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
            const parsed = parseNombreYPrefijo(data.veterinario.nombre || '')
            setProfileForm({
              prefijo: parsed.prefijo,
              nombreSolo: parsed.nombreSolo,
              cedula: data.veterinario.cedula || data.veterinario.documento || '',
              especialidad: data.veterinario.especialidad || 'Medicina General',
              numero_tarjeta: data.veterinario.numero_tarjeta || '',
              telefono: data.veterinario.telefono || '',
              correo: data.veterinario.correo || usuario.email || '',
            })
            setPhotoPreview(data.veterinario.foto_perfil || null)
            setUsuario((prev) => ({
              ...prev,
              prefijo: parsed.prefijo,
              nombreSolo: parsed.nombreSolo,
              nombre: `${parsed.prefijo} ${parsed.nombreSolo}`.trim(),
              nombreCompleto: `${parsed.prefijo} ${parsed.nombreSolo}`.trim(),
              cedula: data.veterinario.cedula || data.veterinario.documento || '',
              especialidad: data.veterinario.especialidad || 'Medicina General',
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

  // File select handler -> opens crop modal
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
    setTempPhotoFile(file)
    setTempPhotoPreview(URL.createObjectURL(file))
    setTempZoom(1)
    setCropCirclePos({ x: 0, y: 0 })
    setShowCropModal(true)
    e.target.value = null // reset input
  }

  // Dragging event handlers for crop circle
  const handleMouseDown = (e) => {
    setIsDragging(true)
    const clientX = e.touches ? e.touches[0].clientX : e.clientX
    const clientY = e.touches ? e.touches[0].clientY : e.clientY
    setDragStart({ x: clientX - cropCirclePos.x, y: clientY - cropCirclePos.y })
  }

  const handleMouseMove = (e) => {
    if (!isDragging) return
    const clientX = e.touches ? e.touches[0].clientX : e.clientX
    const clientY = e.touches ? e.touches[0].clientY : e.clientY

    let newX = clientX - dragStart.x
    let newY = clientY - dragStart.y

    const maxLimit = 130
    newX = Math.max(-maxLimit, Math.min(maxLimit, newX))
    newY = Math.max(-maxLimit, Math.min(maxLimit, newY))

    setCropCirclePos({ x: newX, y: newY })
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  // Confirm photo crop in modal using Canvas
  const handleConfirmPhotoCrop = () => {
    if (!cropImgRef.current || !cropStageRef.current) {
      setShowCropModal(false)
      return
    }

    const img = cropImgRef.current
    const stage = cropStageRef.current
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')

    const targetSize = 500
    canvas.width = targetSize
    canvas.height = targetSize

    const imgRect = img.getBoundingClientRect()
    const stageRect = stage.getBoundingClientRect()

    const stageCenterX = stageRect.left + stageRect.width / 2
    const stageCenterY = stageRect.top + stageRect.height / 2

    const circleCenterX = stageCenterX + cropCirclePos.x
    const circleCenterY = stageCenterY + cropCirclePos.y

    const circleRadiusScreen = 80 // 160px diameter / 2

    const cropXOnImg = circleCenterX - circleRadiusScreen - imgRect.left
    const cropYOnImg = circleCenterY - circleRadiusScreen - imgRect.top
    const cropSizeOnImg = circleRadiusScreen * 2

    const scaleX = img.naturalWidth / imgRect.width
    const scaleY = img.naturalHeight / imgRect.height

    const srcX = cropXOnImg * scaleX
    const srcY = cropYOnImg * scaleY
    const srcW = cropSizeOnImg * scaleX
    const srcH = cropSizeOnImg * scaleY

    try {
      ctx.drawImage(img, srcX, srcY, srcW, srcH, 0, 0, targetSize, targetSize)

      canvas.toBlob((blob) => {
        if (blob) {
          const fileName = tempPhotoFile?.name || 'perfil-vet.jpg'
          const croppedFile = new File([blob], fileName, { type: 'image/jpeg' })
          setSelectedFile(croppedFile)
          setPhotoPreview(URL.createObjectURL(blob))
        }
        setShowCropModal(false)
      }, 'image/jpeg', 0.95)
    } catch (err) {
      console.error('Error al recortar la imagen en canvas:', err)
      setSelectedFile(tempPhotoFile)
      setPhotoPreview(tempPhotoPreview)
      setShowCropModal(false)
    }
  }

  // Submit Perfil
  const handleSubmitProfile = async (e) => {
    e.preventDefault()
    setSubmittingProfile(true)
    setProfileError('')
    setProfileSuccess('')

    if (!profileForm.nombreSolo || !profileForm.nombreSolo.trim()) {
      setProfileError('Ingresa el nombre del médico.')
      setSubmittingProfile(false)
      return
    }

    if (!profileForm.cedula || !profileForm.cedula.trim()) {
      setProfileError('Ingresa el número de cédula.')
      setSubmittingProfile(false)
      return
    }

    const fullNombre = `${profileForm.prefijo} ${profileForm.nombreSolo.trim()}`
    const token = getStoredToken()
    const formData = new FormData()
    formData.append('nombre', fullNombre)
    formData.append('cedula', profileForm.cedula ? profileForm.cedula.trim() : '')
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
          nombre: data.veterinario.nombre || fullNombre,
          nombreCompleto: data.veterinario.nombre || fullNombre,
          cedula: data.veterinario.cedula || profileForm.cedula,
          especialidad: data.veterinario.especialidad || profileForm.especialidad,
          numero_tarjeta: data.veterinario.numero_tarjeta || profileForm.numero_tarjeta,
          telefono: data.veterinario.telefono || profileForm.telefono,
          correo: data.veterinario.correo || usuario.email,
          email: data.veterinario.correo || usuario.email,
          foto: data.veterinario.foto_perfil || usuario.foto,
        }
        setUsuario(updatedUserObj)
        updateStoredUser(updatedUserObj)
      } else {
        const updatedUserObj = {
          ...usuario,
          nombre: fullNombre,
          nombreCompleto: fullNombre,
          cedula: profileForm.cedula,
          especialidad: profileForm.especialidad,
          telefono: profileForm.telefono,
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

    if (!passHasMinLength) {
      setPassError('La nueva contraseña debe tener al menos 6 caracteres.')
      setSubmittingPass(false)
      return
    }

    if (!passHasUppercase) {
      setPassError('La nueva contraseña debe incluir al menos 1 letra mayúscula (A-Z).')
      setSubmittingPass(false)
      return
    }

    if (!passHas4Digits) {
      setPassError('La nueva contraseña debe incluir al menos 4 números (0-9).')
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

      {/* ── MODAL INTERACTIVO: FOTO COMPLETA Y CÍRCULO ARRASTRABLE ── */}
      {showCropModal && (
        <div className="vet-modal-backdrop">
          <div className="vet-modal-box" style={{ maxWidth: '580px', padding: '1.75rem' }}>
            <div className="vet-modal-header">
              <div>
                <h3 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: '1.25rem', color: '#0f172a', margin: 0 }}>
                  Ajustar Encuadre de Foto
                </h3>
                <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.85rem', color: '#64748b', margin: '0.2rem 0 0 0' }}>
                  Arrastra el círculo verde sobre tu foto para seleccionar el encuadre perfecto
                </p>
              </div>
              <button
                type="button"
                className="vet-modal-close"
                onClick={() => setShowCropModal(false)}
                title="Cerrar"
                style={{ background: 'none', border: 'none', fontSize: '1.2rem', color: '#94a3b8', cursor: 'pointer' }}
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            {/* Stage con la foto completa y círculo arrastrable */}
            <div
              ref={cropStageRef}
              style={{
                position: 'relative',
                width: '100%',
                height: '320px',
                background: '#0f172a',
                borderRadius: '16px',
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: isDragging ? 'grabbing' : 'grab',
                userSelect: 'none',
                margin: '1.25rem 0',
                touchAction: 'none',
              }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onTouchStart={handleMouseDown}
              onTouchMove={handleMouseMove}
              onTouchEnd={handleMouseUp}
            >
              {/* Foto Original Completa */}
              {tempPhotoPreview && (
                <img
                  ref={cropImgRef}
                  src={tempPhotoPreview}
                  alt="Foto completa"
                  style={{
                    maxWidth: '100%',
                    maxHeight: '100%',
                    objectFit: 'contain',
                    transform: `scale(${tempZoom})`,
                    transition: isDragging ? 'none' : 'transform 0.1s ease-out',
                    pointerEvents: 'none',
                  }}
                />
              )}

              {/* Máscara oscura con círculo de recorte verde arrastrable */}
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  pointerEvents: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <div
                  style={{
                    width: '160px',
                    height: '160px',
                    borderRadius: '50%',
                    border: '3.5px solid #059669',
                    boxShadow: '0 0 0 9999px rgba(15, 23, 42, 0.65), 0 0 20px rgba(5, 150, 105, 0.4)',
                    transform: `translate(${cropCirclePos.x}px, ${cropCirclePos.y}px)`,
                    transition: isDragging ? 'none' : 'transform 0.05s ease-out',
                    position: 'relative',
                  }}
                >
                  <div style={{ position: 'absolute', top: '50%', left: '20%', right: '20%', height: '1px', background: 'rgba(255,255,255,0.35)', transform: 'translateY(-50%)' }} />
                  <div style={{ position: 'absolute', left: '50%', top: '20%', bottom: '20%', width: '1px', background: 'rgba(255,255,255,0.35)', transform: 'translateX(-50%)' }} />
                </div>
              </div>
            </div>

            {/* Controles de Zoom y Reseteo */}
            <div style={{ background: '#f8fafc', padding: '0.9rem 1.1rem', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '0.84rem', color: '#334155', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <i className="fa-solid fa-[#059669] fa-magnifying-glass-plus" style={{ color: '#059669' }}></i>
                  Zoom de Imagen ({tempZoom.toFixed(1)}x)
                </span>
                <button
                  type="button"
                  onClick={() => { setTempZoom(1); setCropCirclePos({ x: 0, y: 0 }); }}
                  style={{ background: 'none', border: 'none', color: '#059669', fontFamily: 'Inter, sans-serif', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                >
                  <i className="fa-solid fa-rotate-left"></i>
                  Centrar círculo
                </button>
              </div>

              <input
                type="range"
                min="1"
                max="2.5"
                step="0.05"
                value={tempZoom}
                onChange={(e) => setTempZoom(parseFloat(e.target.value))}
                style={{ width: '100%', accentColor: '#059669', cursor: 'pointer' }}
              />
            </div>

            {/* Acciones Modal */}
            <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                type="button"
                className="vet-modal-btn vet-modal-btn--secondary"
                onClick={() => setShowCropModal(false)}
                style={{ padding: '0.65rem 1.25rem' }}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="vet-modal-btn vet-modal-btn--primary"
                onClick={handleConfirmPhotoCrop}
                style={{ padding: '0.65rem 1.5rem' }}
              >
                <i className="fa-solid fa-check"></i>
                <span>Confirmar y Guardar Encuadre</span>
              </button>
            </div>
          </div>
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

        {/* CONTENEDOR ANCHO COMPLETO (1200px MAX, CENTRADO) */}
        <div style={{ maxWidth: '1200px', margin: '0 auto', width: '100%' }}>

          {/* ── CONTENIDO 1: PERFIL PROFESIONAL ── */}
          {activeTab === 'perfil' && (
            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '2.25rem', boxShadow: '0 4px 16px rgba(0,0,0,0.03)' }}>
              <div style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '1.1rem', marginBottom: '1.75rem', display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: '#ecfdf5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>
                  <i className="fa-solid fa-id-card"></i>
                </div>
                <div>
                  <h3 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: '1.25rem', color: '#0f172a', margin: 0 }}>
                    Información Profesional de Médico Veterinario
                  </h3>
                  <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.86rem', color: '#64748b', margin: '0.15rem 0 0 0' }}>
                    Datos visibles para la asignación de citas y registros de atención clínica
                  </p>
                </div>
              </div>

              {profileError && <div className="vet-modal-alert vet-modal-alert--error" style={{ marginBottom: '1.25rem' }}>{profileError}</div>}
              {profileSuccess && <div className="vet-modal-alert vet-modal-alert--success" style={{ marginBottom: '1.25rem' }}>{profileSuccess}</div>}

              <form onSubmit={handleSubmitProfile}>
                {/* Foto de perfil limpia */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.75rem', marginBottom: '1.75rem', padding: '1.25rem 1.5rem', background: '#f8fafc', borderRadius: '14px', border: '1px solid #e2e8f0', flexWrap: 'wrap' }}>
                  <div style={{ width: '90px', height: '90px', borderRadius: '50%', overflow: 'hidden', border: '3px solid #059669', flexShrink: 0, position: 'relative', background: '#e2e8f0', boxShadow: '0 4px 10px rgba(0,0,0,0.06)' }}>
                    {photoPreview ? (
                      <img
                        src={photoPreview}
                        alt="Perfil"
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                        }}
                      />
                    ) : (
                      <div style={{ width: '100%', height: '100%', background: '#059669', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', fontWeight: 700 }}>
                        {profileForm.nombreSolo ? profileForm.nombreSolo[0].toUpperCase() : 'V'}
                      </div>
                    )}
                  </div>

                  <div style={{ flex: 1, minWidth: '240px' }}>
                    <strong style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.98rem', fontWeight: 600, color: '#0f172a', display: 'block', marginBottom: '0.2rem' }}>
                      Foto de Perfil Profesional
                    </strong>
                    <span style={{ fontSize: '0.82rem', color: '#64748b', display: 'block', marginBottom: '0.75rem' }}>
                      Sube una foto clara en formato JPG, PNG o WEBP (máx. 5 MB). Al elegir una nueva foto podrás arrastrar el círculo de encuadre.
                    </span>
                    <label className="dh-btn-upload" style={{ display: 'inline-flex', padding: '0.55rem 1.1rem', cursor: 'pointer' }}>
                      <input type="file" accept="image/png, image/jpeg, image/jpg, image/webp" onChange={handleFileChange} style={{ display: 'none' }} />
                      <i className="fa-solid fa-camera"></i>
                      <span>{selectedFile ? 'Cambiar y encuadrar foto' : 'Elegir nueva imagen'}</span>
                    </label>
                  </div>
                </div>

                {/* Grid de Campos en 2 Columnas anchas */}
                <div className="dh-info-grid" style={{ gap: '1.25rem' }}>

                  {/* Prefijo Dr./Dra. y Nombre Completo */}
                  <div className="dh-form-field">
                    <label htmlFor="nombreSolo">Nombre Completo *</label>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <select
                        value={profileForm.prefijo}
                        onChange={(e) => setProfileForm({ ...profileForm, prefijo: e.target.value })}
                        style={{
                          width: '95px',
                          padding: '0.6rem 0.6rem',
                          border: '1px solid #cbd5e1',
                          borderRadius: '8px',
                          fontFamily: 'Inter, sans-serif',
                          fontSize: '0.86rem',
                          fontWeight: 600,
                          color: '#0f172a',
                          background: '#ffffff',
                          cursor: 'pointer',
                        }}
                      >
                        <option value="Dr.">Dr.</option>
                        <option value="Dra.">Dra.</option>
                      </select>

                      <input
                        id="nombreSolo"
                        type="text"
                        required
                        placeholder="Nombres y Apellidos"
                        value={profileForm.nombreSolo}
                        onChange={(e) => setProfileForm({ ...profileForm, nombreSolo: e.target.value })}
                        style={{ flex: 1 }}
                      />
                    </div>
                  </div>

                  {/* Cédula de Ciudadanía */}
                  <div className="dh-form-field">
                    <label htmlFor="cedula">Cédula de Ciudadanía *</label>
                    <input
                      id="cedula"
                      type="text"
                      required
                      placeholder="ej. 1012345678"
                      value={profileForm.cedula}
                      onChange={(e) => setProfileForm({ ...profileForm, cedula: e.target.value })}
                    />
                  </div>

                  {/* Especialidad Médica Dropdown */}
                  <div className="dh-form-field">
                    <label htmlFor="especialidad">Especialidad Médica *</label>
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                      <select
                        id="especialidad"
                        required
                        value={profileForm.especialidad}
                        onChange={(e) => setProfileForm({ ...profileForm, especialidad: e.target.value })}
                        style={{
                          width: '100%',
                          paddingRight: '2.5rem',
                          appearance: 'none',
                          WebkitAppearance: 'none',
                          cursor: 'pointer',
                          background: '#ffffff',
                        }}
                      >
                        {ESPECIALIDADES_LIST.map((esp) => (
                          <option key={esp} value={esp}>
                            {esp}
                          </option>
                        ))}
                      </select>
                      <i
                        className="fa-solid fa-chevron-down"
                        style={{
                          position: 'absolute',
                          right: '12px',
                          pointerEvents: 'none',
                          color: '#64748b',
                          fontSize: '0.8rem',
                        }}
                      ></i>
                    </div>
                  </div>

                  {/* Número de Tarjeta Profesional (Solo Lectura) */}
                  <div className="dh-form-field">
                    <label htmlFor="numero_tarjeta">Número de Tarjeta Profesional (Solo Lectura)</label>
                    <input
                      id="numero_tarjeta"
                      type="text"
                      readOnly
                      disabled
                      style={{ background: '#f8fafc', color: '#64748b', cursor: 'not-allowed' }}
                      value={profileForm.numero_tarjeta || 'No asignado'}
                    />
                    <span className="dh-field-hint" style={{ fontSize: '0.74rem', color: '#94a3b8' }}>
                      El número de tarjeta profesional institucional no es modificable.
                    </span>
                  </div>

                  {/* Teléfono de Contacto */}
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

                  {/* Correo Electrónico Institucional */}
                  <div className="dh-form-field">
                    <label htmlFor="correo">Correo Electrónico Institucional (Solo Lectura)</label>
                    <input
                      id="correo"
                      type="email"
                      readOnly
                      disabled
                      style={{ background: '#f8fafc', color: '#64748b', cursor: 'not-allowed' }}
                      value={profileForm.correo}
                    />
                    <span className="dh-field-hint" style={{ fontSize: '0.74rem', color: '#94a3b8' }}>
                      Correo asignado por administración.
                    </span>
                  </div>
                </div>

                <div style={{ marginTop: '2rem', paddingTop: '1.25rem', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'flex-end' }}>
                  <button type="submit" className="vet-modal-btn vet-modal-btn--primary" disabled={submittingProfile} style={{ padding: '0.7rem 1.6rem' }}>
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
            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '2.25rem', boxShadow: '0 4px 16px rgba(0,0,0,0.03)' }}>
              <div style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '1.1rem', marginBottom: '1.75rem', display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: '#fffbeb', color: '#d97706', border: '1px solid #fde68a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>
                  <i className="fa-solid fa-key"></i>
                </div>
                <div>
                  <h3 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: '1.25rem', color: '#0f172a', margin: 0 }}>
                    Cambio de Contraseña
                  </h3>
                  <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.86rem', color: '#64748b', margin: '0.15rem 0 0 0' }}>
                    Actualiza tu contraseña de acceso para mantener segura tu cuenta médica
                  </p>
                </div>
              </div>

              {passError && <div className="vet-modal-alert vet-modal-alert--error" style={{ marginBottom: '1.25rem' }}>{passError}</div>}
              {passSuccess && <div className="vet-modal-alert vet-modal-alert--success" style={{ marginBottom: '1.25rem' }}>{passSuccess}</div>}

              <form onSubmit={handleSubmitPassword} style={{ display: 'flex', flexDirection: 'column', gap: '1.35rem' }}>
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
                      style={{ height: '46px', minHeight: 'auto', padding: '0.6rem 2.6rem 0.6rem 0.95rem', borderRadius: '10px', width: '100%' }}
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
                      style={{ height: '46px', minHeight: 'auto', padding: '0.6rem 2.6rem 0.6rem 0.95rem', borderRadius: '10px', width: '100%' }}
                      placeholder="Nueva contraseña segura"
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

                  {/* Especificaciones y Requisitos de la nueva contraseña */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: '0.65rem', padding: '0.75rem 1rem', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '0.82rem' }}>
                    <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, color: '#334155' }}>
                      Requisitos de la nueva contraseña:
                    </span>
                    <span style={{ color: passHasMinLength ? '#059669' : '#64748b', display: 'flex', alignItems: 'center', gap: '0.45rem', fontWeight: passHasMinLength ? 600 : 400 }}>
                      <i className={`fa-solid ${passHasMinLength ? 'fa-circle-check' : 'fa-circle-dot'}`}></i>
                      Mínimo 6 caracteres
                    </span>
                    <span style={{ color: passHasUppercase ? '#059669' : '#64748b', display: 'flex', alignItems: 'center', gap: '0.45rem', fontWeight: passHasUppercase ? 600 : 400 }}>
                      <i className={`fa-solid ${passHasUppercase ? 'fa-circle-check' : 'fa-circle-dot'}`}></i>
                      Al menos 1 letra mayúscula (A-Z)
                    </span>
                    <span style={{ color: passHas4Digits ? '#059669' : '#64748b', display: 'flex', alignItems: 'center', gap: '0.45rem', fontWeight: passHas4Digits ? 600 : 400 }}>
                      <i className={`fa-solid ${passHas4Digits ? 'fa-circle-check' : 'fa-circle-dot'}`}></i>
                      Al menos 4 números (0-9)
                    </span>
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
                      style={{ height: '46px', minHeight: 'auto', padding: '0.6rem 2.6rem 0.6rem 0.95rem', borderRadius: '10px', width: '100%' }}
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

                <div style={{ marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'flex-end' }}>
                  <button type="submit" className="vet-modal-btn vet-modal-btn--primary" disabled={submittingPass} style={{ padding: '0.7rem 1.6rem' }}>
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
        </div>
      </main>
    </div>
  )
}
