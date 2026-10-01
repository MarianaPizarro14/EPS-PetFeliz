import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getStoredToken, getStoredUser, updateStoredUser, isValidAvatarUrl } from '../../utils/authStorage'
import SidebarRecepcion from '../ui/SidebarRecepcion'
import DashboardHeader from '../ui/DashboardHeader'
import './DashboardClient.css'
import './DashboardVeterinario.css'
import './DashboardRecepcion.css'

export default function RecepcionConfiguracion() {
  const navigate = useNavigate()
  const storedUser = getStoredUser()

  const [usuario, setUsuario] = useState({
    nombre: storedUser?.nombre || 'Laura Ramírez',
    nombreCompleto: storedUser?.nombre || 'Laura Ramírez - Recepción Sede',
    foto: isValidAvatarUrl(storedUser?.foto || storedUser?.foto_perfil) ? (storedUser?.foto || storedUser?.foto_perfil) : null,
    rol: 'recepcionista',
    email: storedUser?.email || 'recepcion@petfeliz.com',
  })

  const [profileForm, setProfileForm] = useState({
    nombre: '',
    telefono: '',
    correo: '',
  })
  const [submittingProfile, setSubmittingProfile] = useState(false)

  const [passForm, setPassForm] = useState({
    contrasena_actual: '',
    nueva_contrasena: '',
    confirmar_nueva_contrasena: '',
  })
  const [submittingPass, setSubmittingPass] = useState(false)

  const [toast, setToast] = useState(null)
  const triggerToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 4000)
  }

  const fetchPerfil = async () => {
    const token = getStoredToken()
    if (!token) {
      navigate('/login')
      return
    }

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/recepcion/perfil`, {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      })

      if (res.ok) {
        const data = await res.json()
        if (data.recepcionista) {
          setProfileForm({
            nombre: data.recepcionista.nombre || '',
            telefono: data.recepcionista.telefono || '',
            correo: data.recepcionista.correo || usuario.email,
          })
          const updated = {
            ...usuario,
            nombre: data.recepcionista.nombre,
            nombreCompleto: data.recepcionista.nombre,
            telefono: data.recepcionista.telefono || '',
            foto: data.recepcionista.foto_perfil || usuario.foto,
          }
          setUsuario(updated)
          updateStoredUser(updated)
        }
      }
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    fetchPerfil()
  }, [navigate])

  const handleUpdateProfile = async (e) => {
    e.preventDefault()
    const token = getStoredToken()

    try {
      setSubmittingProfile(true)
      const res = await fetch(`${import.meta.env.VITE_API_URL}/recepcion/perfil/update`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(profileForm),
      })

      const data = await res.json()

      if (res.ok) {
        triggerToast(data.message || 'Perfil de recepción actualizado correctamente.', 'success')
        fetchPerfil()
      } else {
        triggerToast(data.message || 'Error al actualizar perfil.', 'error')
      }
    } catch (e) {
      console.error(e)
      triggerToast('Error de conexión.', 'error')
    } finally {
      setSubmittingProfile(false)
    }
  }

  const handleChangePassword = async (e) => {
    e.preventDefault()
    if (passForm.nueva_contrasena !== passForm.confirmar_nueva_contrasena) {
      triggerToast('La nueva contraseña y su confirmación no coinciden.', 'error')
      return
    }

    const token = getStoredToken()
    try {
      setSubmittingPass(true)

      const res = await fetch(`${import.meta.env.VITE_API_URL}/recepcion/cambiar-password`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(passForm),
      })

      const data = await res.json()

      if (res.ok) {
        triggerToast(data.message || 'Contraseña actualizada exitosamente.', 'success')
        setPassForm({ contrasena_actual: '', nueva_contrasena: '', confirmar_nueva_contrasena: '' })
      } else {
        triggerToast(data.message || 'No se pudo actualizar la contraseña.', 'error')
      }
    } catch (e) {
      console.error(e)
      triggerToast('Error de conexión.', 'error')
    } finally {
      setSubmittingPass(false)
    }
  }

  return (
    <div className="dash">
      <SidebarRecepcion />

      {toast && (
        <div className={`adm-toast ${toast.type === 'error' ? 'adm-toast--error' : ''}`}>
          <i className={`adm-toast__icon fa-solid ${toast.type === 'error' ? 'fa-triangle-exclamation' : 'fa-circle-check'}`}></i>
          <span>{toast.message}</span>
          <button className="adm-toast__close" onClick={() => setToast(null)}>
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>
      )}

      <main className="dash-main">
        <DashboardHeader
          title="Configuración de Cuenta"
          subtitle="Gestión de datos de recepcionista de sede y seguridad de acceso"
          usuario={usuario}
          onUserUpdated={setUsuario}
        />

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem', marginTop: '1.5rem' }}>
          {/* Formulario Perfil */}
          <div style={{ background: '#ffffff', padding: '1.75rem', borderRadius: '18px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(15, 23, 42, 0.04)' }}>
            <h3 style={{ margin: '0 0 1.25rem 0', fontFamily: 'Sora, sans-serif', color: '#0f172a', fontSize: '1.15rem' }}>
              <i className="fa-solid fa-user-gear" style={{ color: '#2563eb', marginRight: '0.5rem' }}></i>
              Perfil de Recepción
            </h3>

            <form onSubmit={handleUpdateProfile}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                  Nombre Completo:
                </label>
                <input
                  type="text"
                  value={profileForm.nombre}
                  onChange={(e) => setProfileForm({ ...profileForm, nombre: e.target.value })}
                  style={{ width: '100%', padding: '0.6rem 0.85rem', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontSize: '0.92rem', boxSizing: 'border-box' }}
                  required
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                  Teléfono de Contacto:
                </label>
                <input
                  type="text"
                  value={profileForm.telefono}
                  onChange={(e) => setProfileForm({ ...profileForm, telefono: e.target.value })}
                  style={{ width: '100%', padding: '0.6rem 0.85rem', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontSize: '0.92rem', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                  Correo Electrónico (Solo Lectura):
                </label>
                <input
                  type="email"
                  value={profileForm.correo}
                  disabled
                  style={{ width: '100%', padding: '0.6rem 0.85rem', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#f8fafc', color: '#64748b', fontSize: '0.92rem', boxSizing: 'border-box' }}
                />
              </div>

              <button
                type="submit"
                disabled={submittingProfile}
                style={{ width: '100%', padding: '0.7rem', borderRadius: '10px', border: 'none', background: '#2563eb', color: '#ffffff', fontWeight: 600, cursor: 'pointer' }}
              >
                {submittingProfile ? 'Guardando...' : 'Actualizar Perfil'}
              </button>
            </form>
          </div>

          {/* Formulario Cambio de Contraseña */}
          <div style={{ background: '#ffffff', padding: '1.75rem', borderRadius: '18px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(15, 23, 42, 0.04)' }}>
            <h3 style={{ margin: '0 0 1.25rem 0', fontFamily: 'Sora, sans-serif', color: '#0f172a', fontSize: '1.15rem' }}>
              <i className="fa-solid fa-lock" style={{ color: '#059669', marginRight: '0.5rem' }}></i>
              Cambio de Contraseña
            </h3>

            <form onSubmit={handleChangePassword}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                  Contraseña Actual o Temporal:
                </label>
                <input
                  type="password"
                  value={passForm.contrasena_actual}
                  onChange={(e) => setPassForm({ ...passForm, contrasena_actual: e.target.value })}
                  style={{ width: '100%', padding: '0.6rem 0.85rem', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontSize: '0.92rem', boxSizing: 'border-box' }}
                  required
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                  Nueva Contraseña:
                </label>
                <input
                  type="password"
                  value={passForm.nueva_contrasena}
                  onChange={(e) => setPassForm({ ...passForm, nueva_contrasena: e.target.value })}
                  style={{ width: '100%', padding: '0.6rem 0.85rem', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontSize: '0.92rem', boxSizing: 'border-box' }}
                  required
                />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                  Confirmar Nueva Contraseña:
                </label>
                <input
                  type="password"
                  value={passForm.confirmar_nueva_contrasena}
                  onChange={(e) => setPassForm({ ...passForm, confirmar_nueva_contrasena: e.target.value })}
                  style={{ width: '100%', padding: '0.6rem 0.85rem', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontSize: '0.92rem', boxSizing: 'border-box' }}
                  required
                />
              </div>

              <button
                type="submit"
                disabled={submittingPass}
                style={{ width: '100%', padding: '0.7rem', borderRadius: '10px', border: 'none', background: '#059669', color: '#ffffff', fontWeight: 600, cursor: 'pointer' }}
              >
                {submittingPass ? 'Cambiando clave...' : 'Guardar Nueva Contraseña'}
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  )
}
