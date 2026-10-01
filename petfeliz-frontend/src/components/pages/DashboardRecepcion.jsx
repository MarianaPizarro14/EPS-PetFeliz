import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getStoredToken, getStoredUser, updateStoredUser, isValidAvatarUrl } from '../../utils/authStorage'
import SidebarRecepcion from '../ui/SidebarRecepcion'
import DashboardHeader from '../ui/DashboardHeader'
import './DashboardClient.css'
import './DashboardVeterinario.css'
import './DashboardRecepcion.css'

export default function DashboardRecepcion() {
  const navigate = useNavigate()
  const storedUser = getStoredUser()

  const [usuario, setUsuario] = useState({
    nombre: storedUser?.nombre || 'Recepcionista Sede',
    nombreCompleto: storedUser?.nombre || 'Recepcionista - EPS PetFeliz',
    foto: isValidAvatarUrl(storedUser?.foto || storedUser?.foto_perfil) ? (storedUser?.foto || storedUser?.foto_perfil) : null,
    rol: 'recepcionista',
    email: storedUser?.email || 'recepcion@petfeliz.com',
    sede_nombre: storedUser?.sede_nombre || 'Laureles',
  })

  const [stats, setStats] = useState({
    citas_hoy: 0,
    pendientes_confirmar: 0,
    pagos_pendientes: 0,
    ingresos_efectivo_dia: 0,
    ingresos_efectivo_formateado: '$ 0',
  })
  const [citasHoy, setCitasHoy] = useState([])
  const [loading, setLoading] = useState(true)
  const [errorGlobal, setErrorGlobal] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [toast, setToast] = useState(null)

  // Modal obligatorio de cambio de contraseña temporal
  const [showPassModal, setShowPassModal] = useState(false)
  const [passForm, setPassForm] = useState({ contrasena_actual: '', nueva_contrasena: '', confirmar_nueva_contrasena: '' })
  const [submittingPass, setSubmittingPass] = useState(false)

  const triggerToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 4000)
  }

  const fetchDashboardData = async () => {
    const token = getStoredToken()
    if (!token) {
      navigate('/login')
      return
    }

    try {
      setLoading(true)
      setErrorGlobal('')

      const res = await fetch(`${import.meta.env.VITE_API_URL}/recepcion/dashboard`, {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      })

      if (res.status === 401 || res.status === 403) {
        navigate('/login')
        return
      }

      if (res.ok) {
        const data = await res.json()
        setStats(data.stats || {})
        setCitasHoy(data.citas_hoy || [])

        if (data.recepcionista) {
          const updatedUserObj = {
            ...usuario,
            nombre: data.recepcionista.nombre,
            nombreCompleto: data.recepcionista.nombre,
            telefono: data.recepcionista.telefono || '',
            correo: data.recepcionista.correo || usuario.email,
            email: data.recepcionista.correo || usuario.email,
            foto: data.recepcionista.foto_perfil || usuario.foto,
            sede_nombre: data.recepcionista.sede_nombre || 'Laureles',
            password_temporal: data.recepcionista.password_temporal,
            rol: 'recepcionista',
          }
          setUsuario(updatedUserObj)
          updateStoredUser(updatedUserObj)

          if (data.recepcionista.password_temporal) {
            setShowPassModal(true)
          }
        }
      } else {
        setErrorGlobal('No se pudo cargar la información del panel de recepción.')
      }
    } catch (err) {
      console.error('Error al cargar dashboard de recepción:', err)
      setErrorGlobal('Error de conexión con el servidor.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboardData()
  }, [navigate])

  const handleConfirmar = async (idCita) => {
    const token = getStoredToken()
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/recepcion/citas/${idCita}/confirmar`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      })
      const data = await res.json()
      if (res.ok) {
        triggerToast(data.message || 'Cita confirmada exitosamente.', 'success')
        fetchDashboardData()
      } else {
        triggerToast(data.message || 'No se pudo confirmar la cita.', 'error')
      }
    } catch (e) {
      console.error('Error al confirmar cita:', e)
      triggerToast('Error al conectar con el servidor.', 'error')
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
        triggerToast('¡Contraseña actualizada exitosamente! Tu cuenta ha sido asegurada.', 'success')
        setShowPassModal(false)
        setPassForm({ contrasena_actual: '', nueva_contrasena: '', confirmar_nueva_contrasena: '' })

        const updatedUser = { ...usuario, password_temporal: false }
        setUsuario(updatedUser)
        updateStoredUser(updatedUser)
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

  const searchLower = searchTerm.toLowerCase().trim()
  const citasFiltradas = citasHoy.filter((c) => {
    if (!searchLower) return true
    return (
      (c.paciente?.nombre || '').toLowerCase().includes(searchLower) ||
      (c.dueno?.nombre || '').toLowerCase().includes(searchLower) ||
      (c.dueno?.cedula || '').toLowerCase().includes(searchLower) ||
      (c.servicio?.nombre || '').toLowerCase().includes(searchLower) ||
      (c.veterinario?.nombre || '').toLowerCase().includes(searchLower)
    )
  })

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
          title={`Recepción — Sede ${usuario.sede_nombre || 'Laureles'}`}
          subtitle="Atención presencial, control de admisiones y caja diaria"
          usuario={usuario}
          onUserUpdated={setUsuario}
          showSearch={true}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
        />

        {errorGlobal && (
          <div className="dash-alert dash-alert--danger" style={{ marginBottom: '1.5rem' }}>
            <i className="fa-solid fa-triangle-exclamation"></i>
            <span>{errorGlobal}</span>
          </div>
        )}

        {/* ── METRICAS OPERATIVAS DE HOY ── */}
        <div className="rec-stats-grid">
          <div className="rec-stat-card">
            <div className="rec-stat-icon rec-stat-icon--blue">
              <i className="fa-regular fa-calendar-check"></i>
            </div>
            <div>
              <div className="rec-stat-val">{stats.citas_hoy || 0}</div>
              <div className="rec-stat-lbl">Citas Agendadas Hoy ({usuario.sede_nombre})</div>
            </div>
          </div>

          <div className="rec-stat-card">
            <div className="rec-stat-icon rec-stat-icon--amber">
              <i className="fa-solid fa-user-clock"></i>
            </div>
            <div>
              <div className="rec-stat-val">{stats.pendientes_confirmar || 0}</div>
              <div className="rec-stat-lbl">Pendientes por Confirmar</div>
            </div>
          </div>

          <div className="rec-stat-card">
            <div className="rec-stat-icon rec-stat-icon--rose">
              <i className="fa-solid fa-receipt"></i>
            </div>
            <div>
              <div className="rec-stat-val">{stats.pagos_pendientes || 0}</div>
              <div className="rec-stat-lbl">Cobros Pendientes</div>
            </div>
          </div>

          <div className="rec-stat-card">
            <div className="rec-stat-icon rec-stat-icon--emerald">
              <i className="fa-solid fa-money-bill-wave"></i>
            </div>
            <div>
              <div className="rec-stat-val">{stats.ingresos_efectivo_formateado || '$ 0'}</div>
              <div className="rec-stat-lbl">Recaudo Efectivo Hoy ({usuario.sede_nombre})</div>
            </div>
          </div>
        </div>

        {/* ── LISTA DE CITAS DE HOY ── */}
        <div className="vet-day-card">
          <div className="vet-day-header">
            <div className="vet-day-title">
              <i className="fa-regular fa-clock" style={{ color: '#2563eb' }}></i>
              <h3>Agenda de Atención de Hoy — Sede {usuario.sede_nombre}</h3>
            </div>
            <span className="vet-day-count">
              {citasFiltradas.length} {citasFiltradas.length === 1 ? 'cita' : 'citas'}
            </span>
          </div>

          {loading ? (
            <div className="vet-loading-box">
              <i className="fa-solid fa-spinner fa-spin"></i>
              <p>Cargando citas del día para Sede {usuario.sede_nombre}...</p>
            </div>
          ) : citasFiltradas.length === 0 ? (
            <div className="vet-empty-box">
              <i className="fa-regular fa-calendar-xmark"></i>
              <h3>No hay citas registradas para hoy en Sede {usuario.sede_nombre}</h3>
              <p>No se encontraron registros de atención médica para el día de hoy en esta sede.</p>
            </div>
          ) : (
            <div className="vet-citas-list">
              {citasFiltradas.map((cita) => {
                const isPendiente = cita.id_estado === 1
                const isConfirmada = cita.id_estado === 2
                const isAtendida = cita.id_estado === 4
                const isPagoPendiente = cita.estado_pago === 'pendiente'

                return (
                  <div key={cita.id_cita} className="vet-cita-row">
                    <div className="vet-cita-time-block">
                      <span className="vet-cita-time">
                        <i className="fa-regular fa-clock"></i> {cita.hora}
                      </span>
                      <span className="vet-cita-service-badge">
                        {cita.servicio?.nombre || cita.motivo}
                      </span>
                    </div>

                    <div className="vet-cita-pet-info">
                      <img
                        src={
                          cita.paciente?.foto ||
                          'https://res.cloudinary.com/dedroug6v/image/upload/v1783709702/golden_retriever_sonriendo_e1mrkw.jpg'
                        }
                        alt={cita.paciente?.nombre}
                        className="vet-pet-avatar"
                      />
                      <div>
                        <strong className="vet-pet-name">{cita.paciente?.nombre}</strong>
                        <span className="vet-pet-detail">
                          {cita.paciente?.especie} {cita.paciente?.raza ? `• ${cita.paciente.raza}` : ''}
                        </span>
                      </div>
                    </div>

                    <div className="vet-cita-owner-info">
                      <span className="vet-owner-label">Dueño / Tutor:</span>
                      <strong className="vet-owner-name">{cita.dueno?.nombre}</strong>
                      <span className="vet-owner-phone">
                        <i className="fa-solid fa-phone"></i> {cita.dueno?.telefono}
                      </span>
                    </div>

                    <div className="vet-cita-status-block">
                      <span
                        className={`vet-badge ${
                          isAtendida
                            ? 'vet-badge--atendida'
                            : isConfirmada
                            ? 'vet-badge--atendida'
                            : isPendiente
                            ? 'vet-badge--pendiente'
                            : 'vet-badge--cancelada'
                        }`}
                      >
                        {cita.estado_nombre || cita.estado}
                      </span>

                      {isPagoPendiente ? (
                        <span className="rec-badge-online" style={{ background: '#fffbeb', color: '#b45309', borderColor: '#fde68a' }}>
                          <i className="fa-solid fa-clock"></i> Cobro Pendiente
                        </span>
                      ) : (
                        <span className="rec-badge-sede">
                          <i className="fa-solid fa-circle-check"></i> Pagado
                        </span>
                      )}
                    </div>

                    <div className="vet-cita-actions">
                      {isPendiente && (
                        <button
                          type="button"
                          className="vet-btn-atender"
                          style={{ background: '#2563eb' }}
                          onClick={() => handleConfirmar(cita.id_cita)}
                        >
                          <i className="fa-solid fa-check"></i>
                          <span>Confirmar</span>
                        </button>
                      )}

                      <button
                        type="button"
                        className="vet-btn-obs"
                        onClick={() => navigate('/recepcion/citas')}
                      >
                        <i className="fa-solid fa-receipt"></i>
                        <span>Gestionar Pago</span>
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </main>

      {/* ── MODAL OBLIGATORIO CAMBIO DE CONTRASEÑA TEMPORAL ── */}
      {showPassModal && (
        <div className="rec-modal-backdrop" style={{ zIndex: 99999 }}>
          <div className="rec-modal" style={{ maxWidth: '500px' }}>
            <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: '#fffbeb', color: '#d97706', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.6rem', marginBottom: '0.75rem' }}>
                <i className="fa-solid fa-key"></i>
              </div>
              <h3 className="rec-modal__title">Actualizar Contraseña Temporal</h3>
              <p className="rec-modal__subtitle" style={{ margin: 0 }}>
                Estás ingresando con una clave provisoria. Por seguridad, debes asignar tu nueva contraseña antes de continuar.
              </p>
            </div>

            <form onSubmit={handleChangePassword}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.88rem', color: '#0f172a', marginBottom: '0.35rem' }}>
                  Contraseña Actual (Temporal):
                </label>
                <input
                  type="password"
                  value={passForm.contrasena_actual}
                  onChange={(e) => setPassForm({ ...passForm, contrasena_actual: e.target.value })}
                  placeholder="Ingresa la clave enviada"
                  style={{ width: '100%', padding: '0.6rem 0.85rem', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontSize: '0.95rem', boxSizing: 'border-box' }}
                  required
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.88rem', color: '#0f172a', marginBottom: '0.35rem' }}>
                  Nueva Contraseña Personalizada:
                </label>
                <input
                  type="password"
                  value={passForm.nueva_contrasena}
                  onChange={(e) => setPassForm({ ...passForm, nueva_contrasena: e.target.value })}
                  placeholder="Mínimo 6 caracteres"
                  style={{ width: '100%', padding: '0.6rem 0.85rem', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontSize: '0.95rem', boxSizing: 'border-box' }}
                  required
                />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.88rem', color: '#0f172a', marginBottom: '0.35rem' }}>
                  Confirmar Nueva Contraseña:
                </label>
                <input
                  type="password"
                  value={passForm.confirmar_nueva_contrasena}
                  onChange={(e) => setPassForm({ ...passForm, confirmar_nueva_contrasena: e.target.value })}
                  placeholder="Repite la nueva contraseña"
                  style={{ width: '100%', padding: '0.6rem 0.85rem', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontSize: '0.95rem', boxSizing: 'border-box' }}
                  required
                />
              </div>

              <button
                type="submit"
                disabled={submittingPass}
                style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', border: 'none', background: '#059669', color: '#ffffff', fontWeight: 600, fontSize: '0.95rem', cursor: submittingPass ? 'wait' : 'pointer' }}
              >
                {submittingPass ? 'Guardando...' : 'Establecer Nueva Contraseña'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
