import React, { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { getStoredToken, getStoredUser, updateStoredUser, isValidAvatarUrl } from '../../utils/authStorage'
import SidebarVet from '../ui/SidebarVet'
import DashboardHeader from '../ui/DashboardHeader'
import './DashboardClient.css'
import './DashboardVeterinario.css'

export default function DashboardVeterinario() {
  const navigate = useNavigate()
  const storedUser = getStoredUser()

  const [usuario, setUsuario] = useState({
    nombre: storedUser?.nombre || 'Dr. Veterinario',
    nombreCompleto: storedUser?.nombre || 'Médico Veterinario',
    foto: isValidAvatarUrl(storedUser?.foto || storedUser?.foto_perfil) ? (storedUser?.foto || storedUser?.foto_perfil) : null,
    rol: 'veterinario',
    email: storedUser?.email || '',
  })

  const [vetProfile, setVetProfile] = useState(null)
  const isTempPass = Boolean(storedUser?.password_temporal)
  const [passwordTemporal, setPasswordTemporal] = useState(isTempPass)

  // Data states
  const [stats, setStats] = useState({
    total_citas: 0,
    atendidas: 0,
    pendientes: 0,
    pacientes_unicos: 0,
  })
  const [todasCitas, setTodasCitas] = useState([])
  const [pacientes, setPacientes] = useState([])
  const [loading, setLoading] = useState(true)
  const [errorGlobal, setErrorGlobal] = useState('')

  // Modal para atender cita desde el panel
  const [selectedCita, setSelectedCita] = useState(null)
  const [observacion, setObservacion] = useState('')
  const [submittingAtender, setSubmittingAtender] = useState(false)
  const [modalSuccess, setModalSuccess] = useState('')
  const [modalError, setModalError] = useState('')
  const [viewOnlyObs, setViewOnlyObs] = useState(false)

  // Toast flotante
  const [toast, setToast] = useState(null)
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

      const [resDash, resPacientes] = await Promise.all([
        fetch(`${import.meta.env.VITE_API_URL}/veterinario/dashboard`, {
          headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
        }),
        fetch(`${import.meta.env.VITE_API_URL}/veterinario/pacientes`, {
          headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
        }),
      ])

      if (resDash.status === 401 || resDash.status === 403) {
        navigate('/login')
        return
      }

      if (resDash.ok) {
        const dashData = await resDash.json()
        setVetProfile(dashData.veterinario)
        setStats(dashData.stats || {})
        setTodasCitas(dashData.todas_citas || dashData.citas || [])

        if (dashData.veterinario) {
          setUsuario((prev) => ({
            ...prev,
            nombre: dashData.veterinario.nombre,
            nombreCompleto: dashData.veterinario.nombre,
            especialidad: dashData.veterinario.especialidad || '',
            numero_tarjeta: dashData.veterinario.numero_tarjeta || '',
            telefono: dashData.veterinario.telefono || '',
            correo: dashData.veterinario.correo || dashData.veterinario.email || prev.email,
            email: dashData.veterinario.correo || dashData.veterinario.email || prev.email,
            foto: dashData.veterinario.foto_perfil || prev.foto,
            rol: 'veterinario',
          }))

          if (dashData.veterinario.password_temporal) {
            setPasswordTemporal(true)
          }
        }
      } else {
        setErrorGlobal('No se pudo obtener la información del panel.')
      }

      if (resPacientes.ok) {
        const pacData = await resPacientes.json()
        setPacientes(pacData.pacientes || [])
      }
    } catch (err) {
      console.error('Error al cargar panel de veterinario:', err)
      setErrorGlobal('Error de conexión con el servidor.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboardData()
  }, [navigate])

  const handleOpenAtenderModal = (cita, isReadOnly = false) => {
    setSelectedCita(cita)
    setObservacion(cita.observacion || '')
    setViewOnlyObs(isReadOnly)
    setModalSuccess('')
    setModalError('')
  }

  const handleCloseModal = () => {
    setSelectedCita(null)
    setObservacion('')
    setViewOnlyObs(false)
    setModalSuccess('')
    setModalError('')
  }

  const handleSubmitAtender = async (e) => {
    e.preventDefault()
    if (!selectedCita) return

    const token = getStoredToken()
    setSubmittingAtender(true)
    setModalError('')
    setModalSuccess('')

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/veterinario/citas/${selectedCita.id_cita}/atender`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({ observacion }),
      })

      const data = await res.json()

      if (!res.ok) {
        setModalError(data.message || 'No se pudo guardar la consulta.')
        setSubmittingAtender(false)
        return
      }

      setModalSuccess('¡Consulta registrada y cita marcada como atendida exitosamente!')
      setTimeout(() => {
        handleCloseModal()
        fetchDashboardData()
        triggerToast('¡Consulta registrada con éxito!')
      }, 1200)
    } catch (err) {
      console.error('Error al atender cita:', err)
      setModalError('Error de red al registrar la atención.')
    } finally {
      setSubmittingAtender(false)
    }
  }

  // Próximas citas pendientes
  const proximasCitas = todasCitas.slice(0, 6)

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
          title={`¡Bienvenido, ${usuario.nombre}!`}
          subtitle={
            vetProfile?.numero_tarjeta
              ? `Tarjeta Profesional N° ${vetProfile.numero_tarjeta} — Gestión de Consultas Médicas`
              : 'Portal de Atención y Consulta Médica Veterinaria'
          }
          usuario={usuario}
          onUserUpdated={setUsuario}
        />

        {passwordTemporal && (
          <div className="dash-alert dash-alert--warning" style={{ marginBottom: '1.5rem', background: '#fffbeb', border: '1px solid #fde68a', color: '#b45309', padding: '0.85rem 1.1rem', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <i className="fa-solid fa-shield-cat" style={{ fontSize: '1.25rem', color: '#d97706' }}></i>
              <div>
                <strong style={{ fontSize: '0.9rem', color: '#92400e', display: 'block' }}>Contraseña Temporal Activa</strong>
                <span style={{ fontSize: '0.82rem', color: '#a16207' }}>Estás navegando con una clave temporal. Actualízala desde Configuración.</span>
              </div>
            </div>
            <Link
              to="/veterinario/configuracion"
              style={{ background: '#d97706', color: '#ffffff', textDecoration: 'none', padding: '0.45rem 0.85rem', borderRadius: '8px', fontWeight: 600, fontSize: '0.82rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <i className="fa-solid fa-key"></i> Ir a Configuración
            </Link>
          </div>
        )}

        {errorGlobal && (
          <div className="dash-alert dash-alert--danger" style={{ marginBottom: '1.5rem' }}>
            <i className="fa-solid fa-triangle-exclamation"></i>
            <span>{errorGlobal}</span>
          </div>
        )}

        {/* ── 4 TARJETAS DE ESTADÍSTICAS VETERINARIO ── */}
        <div className="vet-stats-grid" style={{ marginBottom: '2rem' }}>
          <div className="vet-stat-card">
            <div className="vet-stat-card__icon vet-stat-card__icon--teal">
              <i className="fa-regular fa-calendar-check"></i>
            </div>
            <div className="vet-stat-card__info">
              <span>Total Citas</span>
              <h3>{loading ? '...' : stats.total_citas}</h3>
            </div>
          </div>

          <div className="vet-stat-card">
            <div className="vet-stat-card__icon vet-stat-card__icon--blue">
              <i className="fa-solid fa-clock"></i>
            </div>
            <div className="vet-stat-card__info">
              <span>Pendientes</span>
              <h3>{loading ? '...' : stats.pendientes}</h3>
            </div>
          </div>

          <div className="vet-stat-card">
            <div className="vet-stat-card__icon vet-stat-card__icon--emerald">
              <i className="fa-solid fa-circle-check"></i>
            </div>
            <div className="vet-stat-card__info">
              <span>Atendidas</span>
              <h3>{loading ? '...' : stats.atendidas}</h3>
            </div>
          </div>

          <div className="vet-stat-card">
            <div className="vet-stat-card__icon vet-stat-card__icon--purple">
              <i className="fa-solid fa-paw"></i>
            </div>
            <div className="vet-stat-card__info">
              <span>Pacientes Únicos</span>
              <h3>{loading ? '...' : stats.pacientes_unicos}</h3>
            </div>
          </div>
        </div>

        {/* ── SECCIÓN 1: PRÓXIMOS PACIENTES / CONSULTAS DEL DÍA ── */}
        <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '1.5rem', marginBottom: '2rem', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div>
              <h3 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: '1.15rem', color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <i className="fa-solid fa-user-doctor" style={{ color: '#059669' }}></i>
                Próximos Pacientes y Consultas
              </h3>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.84rem', color: '#64748b', margin: '0.2rem 0 0 0' }}>
                Citas más recientes programadas en tu agenda médica
              </p>
            </div>

            <Link
              to="/veterinario/citas"
              style={{
                background: '#ecfdf5',
                color: '#059669',
                border: '1px solid #a7f3d0',
                borderRadius: '8px',
                padding: '0.45rem 0.85rem',
                fontFamily: 'Inter, sans-serif',
                fontWeight: 600,
                fontSize: '0.82rem',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem'
              }}
            >
              <span>Ver Agenda Completa</span>
              <i className="fa-solid fa-arrow-right"></i>
            </Link>
          </div>

          {loading ? (
            <div className="vet-loading-box">
              <i className="fa-solid fa-spinner fa-spin"></i>
              <p>Cargando próximos pacientes...</p>
            </div>
          ) : proximasCitas.length === 0 ? (
            <div className="vet-empty-box">
              <i className="fa-regular fa-calendar-check"></i>
              <h3>No hay consultas registradas</h3>
              <p>No tienes citas agendadas actualmente en el sistema.</p>
            </div>
          ) : (
            <div className="vet-citas-list">
              {proximasCitas.map((cita) => {
                const isPendiente = cita.id_estado === 1 || cita.id_estado === 2
                const isAtendida = cita.id_estado === 4
                const servicioNombre = cita.servicio?.nombre_servicio || cita.servicio?.nombre || cita.motivo || 'Consulta General'
                const estadoTexto = cita.estado_nombre || cita.estado || (isAtendida ? 'Atendida' : (isPendiente ? 'Pendiente' : 'Cancelada'))

                return (
                  <div key={cita.id_cita} className="vet-cita-row">
                    <div className="vet-cita-time-block">
                      <span className="vet-cita-time">
                        <i className="fa-regular fa-clock"></i> {cita.hora}
                      </span>
                      <span className="vet-cita-service-badge">
                        {servicioNombre}
                      </span>
                    </div>

                    <div className="vet-cita-pet-info">
                      <img
                        src={
                          cita.paciente?.foto || cita.paciente?.foto_mascota || cita.mascota?.foto_mascota ||
                          (cita.mascota?.especie === 'Gato'
                            ? 'https://res.cloudinary.com/dedroug6v/image/upload/v1782696391/foto_gato_1_nuieol.jpg'
                            : 'https://res.cloudinary.com/dedroug6v/image/upload/v1783709702/golden_retriever_sonriendo_e1mrkw.jpg')
                        }
                        alt={cita.mascota?.nombre || 'Paciente'}
                        className="vet-pet-avatar"
                      />
                      <div>
                        <strong className="vet-pet-name">{cita.mascota?.nombre || 'Paciente'}</strong>
                        <span className="vet-pet-detail">
                          {cita.mascota?.especie || 'Mascota'} {cita.mascota?.raza ? `• ${cita.mascota.raza}` : ''}
                        </span>
                      </div>
                    </div>

                    <div className="vet-cita-owner-info">
                      <span className="vet-owner-label">Dueño / Solicitante:</span>
                      <strong className="vet-owner-name">{cita.cliente?.nombre || cita.dueno?.nombre || 'Cliente EPS'}</strong>
                      <span className="vet-owner-phone">
                        <i className="fa-solid fa-phone"></i> {cita.cliente?.telefono || cita.dueno?.telefono || 'N/R'}
                      </span>
                    </div>

                    <div className="vet-cita-status-block">
                      <span className={`vet-badge ${isAtendida ? 'vet-badge--atendida' : isPendiente ? 'vet-badge--pendiente' : 'vet-badge--cancelada'}`}>
                        <i className={`fa-solid ${isAtendida ? 'fa-circle-check' : isPendiente ? 'fa-clock' : 'fa-circle-xmark'}`}></i>
                        {estadoTexto}
                      </span>
                    </div>

                    <div className="vet-cita-actions">
                      {isPendiente && (
                        <button type="button" className="vet-btn-atender" onClick={() => navigate(`/veterinario/atender/${cita.id_cita}`)}>
                          <i className="fa-solid fa-stethoscope"></i>
                          <span>Atender Cita</span>
                        </button>
                      )}
                      {isAtendida && (
                        <button type="button" className="vet-btn-obs" onClick={() => navigate(`/veterinario/atender/${cita.id_cita}`)}>
                          <i className="fa-regular fa-file-lines"></i>
                          <span>Ver Expediente</span>
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* ── SECCIÓN 2: ACCESO RÁPIDO A PACIENTES RECIENTES ── */}
        <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '1.5rem', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div>
              <h3 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: '1.15rem', color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <i className="fa-solid fa-paw" style={{ color: '#059669' }}></i>
                Mascotas en Consulta Reciente
              </h3>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.84rem', color: '#64748b', margin: '0.2rem 0 0 0' }}>
                Mascotas atendidas en tus últimos registros médicos
              </p>
            </div>

            <Link
              to="/veterinario/pacientes"
              style={{
                background: '#f8fafc',
                color: '#334155',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                padding: '0.45rem 0.85rem',
                fontFamily: 'Inter, sans-serif',
                fontWeight: 600,
                fontSize: '0.82rem',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem'
              }}
            >
              <span>Ver Todos los Pacientes</span>
              <i className="fa-solid fa-arrow-right"></i>
            </Link>
          </div>

          {loading ? (
            <div className="vet-loading-box">
              <i className="fa-solid fa-spinner fa-spin"></i>
              <p>Cargando lista de mascotas...</p>
            </div>
          ) : pacientes.length === 0 ? (
            <div className="vet-empty-box">
              <i className="fa-solid fa-paw"></i>
              <h3>Sin pacientes registrados</h3>
              <p>No se encontraron mascotas en tu lista de atención.</p>
            </div>
          ) : (
            <div className="vet-pacientes-grid">
              {pacientes.slice(0, 3).map((paciente) => (
                <div key={paciente.id_mascota} className="vet-paciente-card">
                  <div className="vet-paciente-card__top">
                    <img
                      src={
                        paciente.foto || paciente.foto_mascota ||
                        (paciente.especie === 'Gato'
                          ? 'https://res.cloudinary.com/dedroug6v/image/upload/v1782696391/foto_gato_1_nuieol.jpg'
                          : 'https://res.cloudinary.com/dedroug6v/image/upload/v1783709702/golden_retriever_sonriendo_e1mrkw.jpg')
                      }
                      alt={paciente.nombre}
                      className="vet-paciente-img"
                    />
                    <div className="vet-paciente-title-wrap">
                      <h4>{paciente.nombre}</h4>
                      <span className="vet-paciente-species">
                        {paciente.especie} {paciente.raza ? `• ${paciente.raza}` : ''}
                      </span>
                    </div>
                  </div>

                  <div className="vet-paciente-card__body">
                    <div className="vet-paciente-field">
                      <span className="field-title">Tutor / Dueño:</span>
                      <span className="field-highlight">{paciente.dueno?.nombre || 'Cliente EPS'}</span>
                    </div>
                    <div className="vet-paciente-field">
                      <span className="field-title">Teléfono:</span>
                      <span>{paciente.dueno?.telefono || 'N/R'}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── MODAL ATENDER CITA / VER OBSERVACIONES ── */}
        {selectedCita && (
          <div className="vet-modal-backdrop">
            <div className="vet-modal-box">
              <div className="vet-modal-header">
                <div>
                  <h3>
                    {viewOnlyObs
                      ? `Constancia / Observaciones de ${selectedCita.mascota.nombre}`
                      : `Atender Cita Médica de ${selectedCita.mascota.nombre}`}
                  </h3>
                  <p className="vet-modal-subtitle">
                    {selectedCita.servicio.nombre_servicio} — {selectedCita.fecha} a las {selectedCita.hora}
                  </p>
                </div>
                <button type="button" className="vet-modal-close" onClick={handleCloseModal}>
                  <i className="fa-solid fa-xmark"></i>
                </button>
              </div>

              {modalError && <div className="vet-modal-alert vet-modal-alert--error">{modalError}</div>}
              {modalSuccess && <div className="vet-modal-alert vet-modal-alert--success">{modalSuccess}</div>}

              <div className="vet-modal-summary-box">
                <div className="vet-modal-pet-header">
                  <img
                    src={
                      selectedCita.mascota.foto_mascota ||
                      (selectedCita.mascota.especie === 'Gato'
                        ? 'https://res.cloudinary.com/dedroug6v/image/upload/v1782696391/foto_gato_1_nuieol.jpg'
                        : 'https://res.cloudinary.com/dedroug6v/image/upload/v1783709702/golden_retriever_sonriendo_e1mrkw.jpg')
                    }
                    alt={selectedCita.mascota.nombre}
                    className="vet-modal-pet-img"
                  />
                  <div>
                    <h4 className="vet-modal-pet-title">{selectedCita.mascota.nombre}</h4>
                    <p className="vet-modal-pet-sub">
                      Especie: {selectedCita.mascota.especie} {selectedCita.mascota.raza ? `| Raza: ${selectedCita.mascota.raza}` : ''}
                    </p>
                  </div>
                </div>

                <div className="vet-modal-details-grid">
                  <div>
                    <span className="detail-lbl">Propietario / Cliente:</span>
                    <strong>{selectedCita.cliente.nombre}</strong>
                  </div>
                  <div>
                    <span className="detail-lbl">Teléfono Contacto:</span>
                    <strong>{selectedCita.cliente.telefono}</strong>
                  </div>
                </div>
              </div>

              <form onSubmit={handleSubmitAtender}>
                <div className="vet-modal-field">
                  <label htmlFor="observacion">
                    {viewOnlyObs ? 'Observaciones Registradas' : 'Observaciones Clínicas / Indicaciones Médicas'}
                  </label>
                  <textarea
                    id="observacion"
                    rows={5}
                    className="vet-modal-textarea"
                    placeholder="Escribe aquí las observaciones clínicas de la consulta, diagnóstico, medicamentos recetados o recomendaciones para la mascota..."
                    value={observacion}
                    onChange={(e) => setObservacion(e.target.value)}
                    disabled={viewOnlyObs || submittingAtender}
                  />
                </div>

                <div className="vet-modal-actions">
                  <button
                    type="button"
                    className="vet-modal-btn vet-modal-btn--secondary"
                    onClick={handleCloseModal}
                  >
                    {viewOnlyObs ? 'Cerrar' : 'Cancelar'}
                  </button>

                  {!viewOnlyObs && (
                    <button
                      type="submit"
                      className="vet-modal-btn vet-modal-btn--primary"
                      disabled={submittingAtender}
                    >
                      {submittingAtender ? (
                        <>
                          <i className="fa-solid fa-spinner fa-spin"></i>
                          <span>Guardando...</span>
                        </>
                      ) : (
                        <>
                          <i className="fa-solid fa-check"></i>
                          <span>Marcar Atendida y Guardar</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
