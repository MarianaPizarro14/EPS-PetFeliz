import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
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
  const [activeTab, setActiveTab] = useState('agenda') // 'agenda' | 'pacientes'

  // Flag y modal de contraseña temporal
  const isTempPass = Boolean(storedUser?.password_temporal)
  const [passwordTemporal, setPasswordTemporal] = useState(isTempPass)
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(isTempPass)
  const [changePassForm, setChangePassForm] = useState({
    contrasena_actual: '',
    nueva_contrasena: '',
    confirmar_nueva_contrasena: '',
  })
  const [submittingChangePass, setSubmittingChangePass] = useState(false)
  const [changePassError, setChangePassError] = useState('')
  const [changePassSuccess, setChangePassSuccess] = useState('')

  // Toast flotante
  const [toast, setToast] = useState(null)
  const triggerToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 4000)
  }

  // Data states
  const [stats, setStats] = useState({
    total_citas: 0,
    atendidas: 0,
    pendientes: 0,
    pacientes_unicos: 0,
  })
  const [agendaSemanal, setAgendaSemanal] = useState([])
  const [todasCitas, setTodasCitas] = useState([])
  const [pacientes, setPacientes] = useState([])

  const [loading, setLoading] = useState(true)
  const [errorGlobal, setErrorGlobal] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('todos') // 'todos' | 'pendiente' | 'atendida'

  // Modal para atender cita / ver observaciones
  const [selectedCita, setSelectedCita] = useState(null)
  const [observacion, setObservacion] = useState('')
  const [submittingAtender, setSubmittingAtender] = useState(false)
  const [modalSuccess, setModalSuccess] = useState('')
  const [modalError, setModalError] = useState('')
  const [viewOnlyObs, setViewOnlyObs] = useState(false)

  // Handler cambio de contraseña
  const handleSubmitChangePassword = async (e) => {
    if (e) e.preventDefault()
    setChangePassError('')
    setChangePassSuccess('')

    if (!changePassForm.contrasena_actual) {
      setChangePassError('Ingresa tu contraseña actual o temporal.')
      return
    }
    if (changePassForm.nueva_contrasena.length < 6) {
      setChangePassError('La nueva contraseña debe tener al menos 6 caracteres.')
      return
    }
    if (changePassForm.nueva_contrasena !== changePassForm.confirmar_nueva_contrasena) {
      setChangePassError('Las contraseñas confirmadas no coinciden.')
      return
    }

    const token = getStoredToken()
    if (!token) return

    try {
      setSubmittingChangePass(true)

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

      if (res.ok && data.success) {
        setChangePassSuccess('¡Contraseña actualizada exitosamente!')
        setPasswordTemporal(false)

        const currentUser = getStoredUser()
        if (currentUser) {
          updateStoredUser({ ...currentUser, password_temporal: false })
        }

        setTimeout(() => {
          setShowChangePasswordModal(false)
          setChangePassForm({ contrasena_actual: '', nueva_contrasena: '', confirmar_nueva_contrasena: '' })
          setChangePassSuccess('')
          triggerToast('¡Contraseña actualizada con éxito! Tu portal está activo y seguro.', 'success')
        }, 1200)
      } else {
        setChangePassError(data.message || 'No se pudo actualizar la contraseña.')
      }
    } catch (err) {
      console.error('Error al cambiar contraseña:', err)
      setChangePassError('Error de conexión al guardar la nueva contraseña.')
    } finally {
      setSubmittingChangePass(false)
    }
  }

  // Cargar dashboard
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
        setAgendaSemanal(dashData.agenda_semanal || [])
        setTodasCitas(dashData.todas_citas || [])

        if (dashData.veterinario) {
          setUsuario((prev) => ({
            ...prev,
            nombre: dashData.veterinario.nombre,
            nombreCompleto: dashData.veterinario.nombre,
            foto: dashData.veterinario.foto_perfil || prev.foto,
          }))

          if (dashData.veterinario.password_temporal) {
            setPasswordTemporal(true)
            setShowChangePasswordModal(true)
          }
        }
      } else {
        setErrorGlobal('No se pudo obtener la agenda médica.')
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

  // Abrir modal atender
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

  // Submit guardar atención de cita
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
      }, 1200)
    } catch (err) {
      console.error('Error al atender cita:', err)
      setModalError('Error de red al registrar la atención.')
    } finally {
      setSubmittingAtender(false)
    }
  }

  // Filtrado de la agenda
  const searchLower = searchTerm.toLowerCase().trim()

  const agendaFiltrada = agendaSemanal
    .map((dia) => {
      const citasDelDia = dia.citas.filter((c) => {
        // Filtro estado
        if (filterStatus === 'pendiente' && c.id_estado !== 1 && c.id_estado !== 2) return false
        if (filterStatus === 'atendida' && c.id_estado !== 4) return false

        // Filtro búsqueda
        if (!searchLower) return true
        const sNombre = c.servicio?.nombre_servicio || c.servicio?.nombre || c.motivo || ''
        return (
          (c.mascota?.nombre || '').toLowerCase().includes(searchLower) ||
          (c.mascota?.especie || '').toLowerCase().includes(searchLower) ||
          (c.cliente?.nombre || c.dueno?.nombre || '').toLowerCase().includes(searchLower) ||
          sNombre.toLowerCase().includes(searchLower)
        )
      })

      return {
        ...dia,
        citas: citasDelDia,
      }
    })
    .filter((dia) => dia.citas.length > 0)

  // Filtrado de pacientes
  const pacientesFiltrados = pacientes.filter((p) => {
    if (!searchLower) return true
    return (
      p.nombre.toLowerCase().includes(searchLower) ||
      p.especie.toLowerCase().includes(searchLower) ||
      (p.raza && p.raza.toLowerCase().includes(searchLower)) ||
      (p.dueno?.nombre && p.dueno.nombre.toLowerCase().includes(searchLower))
    )
  })

  return (
    <div className="dash">
      <SidebarVet />

      {/* ── TOAST FLOTANTE DE CONFIRMACIÓN ── */}
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
          showSearch={true}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          extraActions={
            <button
              type="button"
              className="act-btn act-btn--edit"
              onClick={() => {
                setChangePassError('')
                setChangePassSuccess('')
                setChangePassForm({ contrasena_actual: '', nueva_contrasena: '', confirmar_nueva_contrasena: '' })
                setShowChangePasswordModal(true)
              }}
              style={{ background: '#fef3c7', color: '#b45309', borderColor: '#fde68a', padding: '0.5rem 0.85rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', height: '40px' }}
              title="Cambiar contraseña de la cuenta"
            >
              <i className="fa-solid fa-key"></i>
              <span>Cambiar Contraseña</span>
            </button>
          }
        />

        {passwordTemporal && (
          <div className="dash-alert dash-alert--warning" style={{ marginBottom: '1.5rem', background: '#fffbeb', border: '1px solid #fde68a', color: '#b45309', padding: '0.85rem 1.1rem', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <i className="fa-solid fa-shield-cat" style={{ fontSize: '1.25rem', color: '#d97706' }}></i>
              <div>
                <strong style={{ fontSize: '0.9rem', color: '#92400e', display: 'block' }}>Contraseña Temporal Activa</strong>
                <span style={{ fontSize: '0.82rem', color: '#a16207' }}>Estás navegando con una clave temporal. Debes actualizar tu contraseña para proteger tu cuenta.</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setChangePassError('')
                setChangePassSuccess('')
                setChangePassForm({ contrasena_actual: '', nueva_contrasena: '', confirmar_nueva_contrasena: '' })
                setShowChangePasswordModal(true)
              }}
              style={{ background: '#d97706', color: '#ffffff', border: 'none', padding: '0.45rem 0.85rem', borderRadius: '8px', fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer', whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <i className="fa-solid fa-key"></i> Cambiar Ahora
            </button>
          </div>
        )}

        {errorGlobal && (
          <div className="dash-alert dash-alert--danger" style={{ marginBottom: '1.5rem' }}>
            <i className="fa-solid fa-triangle-exclamation"></i>
            <span>{errorGlobal}</span>
          </div>
        )}

        {/* ── 4 TARJETAS DE ESTADÍSTICAS VETERINARIO ── */}
        <div className="vet-stats-grid">
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

        {/* ── BARRA DE PESTAÑAS (AGENDA Y PACIENTES) ── */}
        <div className="vet-tabs-header">
          <div className="vet-tabs-nav">
            <button
              type="button"
              className={`vet-tab-btn ${activeTab === 'agenda' ? 'vet-tab-btn--active' : ''}`}
              onClick={() => setActiveTab('agenda')}
            >
              <i className="fa-regular fa-calendar-days"></i>
              <span>Mi Agenda Médica</span>
              {stats.pendientes > 0 && (
                <span className="vet-tab-badge">{stats.pendientes}</span>
              )}
            </button>

            <button
              type="button"
              className={`vet-tab-btn ${activeTab === 'pacientes' ? 'vet-tab-btn--active' : ''}`}
              onClick={() => setActiveTab('pacientes')}
            >
              <i className="fa-solid fa-paw"></i>
              <span>Mis Pacientes</span>
              <span className="vet-tab-badge vet-tab-badge--subtle">{pacientes.length}</span>
            </button>
          </div>

          {activeTab === 'agenda' && (
            <div className="vet-status-filters">
              <span className="vet-filter-label">Estado:</span>
              <button
                type="button"
                className={`vet-filter-chip ${filterStatus === 'todos' ? 'vet-filter-chip--active' : ''}`}
                onClick={() => setFilterStatus('todos')}
              >
                Todos
              </button>
              <button
                type="button"
                className={`vet-filter-chip ${filterStatus === 'pendiente' ? 'vet-filter-chip--active' : ''}`}
                onClick={() => setFilterStatus('pendiente')}
              >
                Pendientes
              </button>
              <button
                type="button"
                className={`vet-filter-chip ${filterStatus === 'atendida' ? 'vet-filter-chip--active' : ''}`}
                onClick={() => setFilterStatus('atendida')}
              >
                Atendidas
              </button>
            </div>
          )}
        </div>

        {/* ── CONTENIDO PESTAÑA 1: MI AGENDA ── */}
        {activeTab === 'agenda' && (
          <div className="vet-agenda-container">
            {loading ? (
              <div className="vet-loading-box">
                <i className="fa-solid fa-spinner fa-spin"></i>
                <p>Cargando agenda médica...</p>
              </div>
            ) : agendaFiltrada.length === 0 ? (
              <div className="vet-empty-box">
                <i className="fa-regular fa-calendar-xmark"></i>
                <h3>No hay citas programadas</h3>
                <p>No se encontraron citas con los filtros o criterios de búsqueda seleccionados.</p>
              </div>
            ) : (
              agendaFiltrada.map((diaGroup, index) => (
                <div key={index} className="vet-day-card">
                  <div className="vet-day-header">
                    <div className="vet-day-title">
                      <i className="fa-regular fa-calendar"></i>
                      <h3>{diaGroup.dia_nombre}</h3>
                    </div>
                    <span className="vet-day-count">
                      {diaGroup.citas.length} {diaGroup.citas.length === 1 ? 'cita' : 'citas'}
                    </span>
                  </div>

                  <div className="vet-citas-list">
                    {diaGroup.citas.map((cita) => {
                      const isPendiente = cita.id_estado === 1 || cita.id_estado === 2
                      const isAtendida = cita.id_estado === 4
                      const isCancelada = cita.id_estado === 3
                      const servicioNombre = cita.servicio?.nombre_servicio || cita.servicio?.nombre || cita.motivo || 'Consulta General'
                      const estadoTexto = cita.estado_nombre || cita.estado || (isAtendida ? 'Atendida' : (isPendiente ? 'Pendiente' : 'Cancelada'))

                      return (
                        <div key={cita.id_cita} className="vet-cita-row">
                          {/* Hora y Servicio */}
                          <div className="vet-cita-time-block">
                            <span className="vet-cita-time">
                              <i className="fa-regular fa-clock"></i> {cita.hora}
                            </span>
                            <span className="vet-cita-service-badge">
                              {servicioNombre}
                            </span>
                          </div>

                          {/* Mascota */}
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

                          {/* Cliente / Dueño */}
                          <div className="vet-cita-owner-info">
                            <span className="vet-owner-label">Dueño / Solicitante:</span>
                            <strong className="vet-owner-name">{cita.cliente?.nombre || cita.dueno?.nombre || 'Cliente EPS'}</strong>
                            <span className="vet-owner-phone">
                              <i className="fa-solid fa-phone"></i> {cita.cliente?.telefono || cita.dueno?.telefono || 'N/R'}
                            </span>
                          </div>

                          {/* Estado */}
                          <div className="vet-cita-status-block">
                            <span
                              className={`vet-badge ${
                                isAtendida
                                  ? 'vet-badge--atendida'
                                  : isPendiente
                                  ? 'vet-badge--pendiente'
                                  : 'vet-badge--cancelada'
                              }`}
                            >
                              <i
                                className={`fa-solid ${
                                  isAtendida
                                    ? 'fa-circle-check'
                                    : isPendiente
                                    ? 'fa-clock'
                                    : 'fa-circle-xmark'
                                }`}
                              ></i>
                              {estadoTexto}
                            </span>
                          </div>

                          {/* Acciones */}
                          <div className="vet-cita-actions">
                            {isPendiente && (
                              <button
                                type="button"
                                className="vet-btn-atender"
                                onClick={() => handleOpenAtenderModal(cita, false)}
                              >
                                <i className="fa-solid fa-stethoscope"></i>
                                <span>Atender Cita</span>
                              </button>
                            )}

                            {isAtendida && (
                              <button
                                type="button"
                                className="vet-btn-obs"
                                onClick={() => handleOpenAtenderModal(cita, true)}
                              >
                                <i className="fa-regular fa-file-lines"></i>
                                <span>Ver Historial / Obs.</span>
                              </button>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* ── CONTENIDO PESTAÑA 2: MIS PACIENTES ── */}
        {activeTab === 'pacientes' && (
          <div className="vet-pacientes-container">
            {loading ? (
              <div className="vet-loading-box">
                <i className="fa-solid fa-spinner fa-spin"></i>
                <p>Cargando pacientes...</p>
              </div>
            ) : pacientesFiltrados.length === 0 ? (
              <div className="vet-empty-box">
                <i className="fa-solid fa-paw"></i>
                <h3>No hay pacientes registrados</h3>
                <p>No se encontraron mascotas en tu historial médico con ese nombre o criterio.</p>
              </div>
            ) : (
              <div className="vet-pacientes-grid">
                {pacientesFiltrados.map((paciente) => (
                  <div key={paciente.id_mascota} className="vet-paciente-card">
                    <div className="vet-paciente-card__top">
                      <img
                        src={
                          paciente.foto_mascota ||
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
                        <span className="field-title">Sexo:</span>
                        <span>{paciente.sexo || 'No registrado'}</span>
                      </div>

                      <div className="vet-paciente-field">
                        <span className="field-title">Peso:</span>
                        <span>{paciente.peso_kg ? `${paciente.peso_kg} kg` : 'N/R'}</span>
                      </div>

                      <div className="vet-paciente-field">
                        <span className="field-title">Dueño / Tutor:</span>
                        <span className="field-highlight">{paciente.dueno?.nombre || 'Desconocido'}</span>
                      </div>

                      <div className="vet-paciente-field">
                        <span className="field-title">Teléfono Dueño:</span>
                        <span>{paciente.dueno?.telefono || 'N/R'}</span>
                      </div>

                      <div className="vet-paciente-stats-row">
                        <span className="vet-paciente-tag">
                          <i className="fa-solid fa-notes-medical"></i> {paciente.total_citas} Atenciones
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

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

              {/* Resumen del paciente y dueño */}
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
        {/* ── MODAL: CAMBIO DE CONTRASEÑA VETERINARIO ── */}
        {showChangePasswordModal && (
          <div className="vet-modal-backdrop" style={{ zIndex: 1100 }}>
            <div className="vet-modal-box" style={{ maxWidth: '480px' }}>
              <div className="vet-modal-header" style={{ borderBottom: '1px solid #e2e8f0' }}>
                <div>
                  <h3 style={{ color: passwordTemporal ? '#d97706' : '#0f172a', fontFamily: 'Sora, sans-serif', fontSize: '1.15rem' }}>
                    {passwordTemporal ? '⚠️ Cambio de Contraseña Obligatorio' : 'Cambiar Contraseña'}
                  </h3>
                  <p className="vet-modal-subtitle">
                    {passwordTemporal
                      ? 'Por seguridad debes configurar una nueva contraseña antes de continuar'
                      : 'Actualiza la clave de acceso a tu portal médico en EPS PetFeliz'}
                  </p>
                </div>
                {!passwordTemporal && (
                  <button type="button" className="vet-modal-close" onClick={() => setShowChangePasswordModal(false)}>
                    <i className="fa-solid fa-xmark"></i>
                  </button>
                )}
              </div>

              {passwordTemporal && (
                <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '10px', padding: '0.85rem 1rem', margin: '1rem 1.25rem 0 1.25rem', display: 'flex', alignItems: 'flex-start', gap: '0.6rem' }}>
                  <i className="fa-solid fa-triangle-exclamation" style={{ color: '#d97706', marginTop: '2px', fontSize: '1rem' }}></i>
                  <span style={{ fontSize: '0.82rem', color: '#92400e', lineHeight: '1.45' }}>
                    <strong>Contraseña Temporal Detectada:</strong> El administrador generó tu clave actual. Para proteger la información médica de tus pacientes, ingresa la clave actual y crea una nueva contraseña.
                  </span>
                </div>
              )}

              {changePassError && (
                <div className="vet-modal-alert vet-modal-alert--error" style={{ margin: '1rem 1.25rem 0 1.25rem' }}>
                  <i className="fa-solid fa-circle-exclamation"></i> {changePassError}
                </div>
              )}

              {changePassSuccess && (
                <div className="vet-modal-alert vet-modal-alert--success" style={{ margin: '1rem 1.25rem 0 1.25rem' }}>
                  <i className="fa-solid fa-circle-check"></i> {changePassSuccess}
                </div>
              )}

              <form onSubmit={handleSubmitChangePassword} style={{ padding: '1.25rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
                  <div className="vet-modal-field" style={{ marginBottom: 0 }}>
                    <label htmlFor="contrasena_actual">Contraseña Actual o Temporal *</label>
                    <input
                      id="contrasena_actual"
                      type="password"
                      required
                      className="vet-modal-textarea"
                      style={{ height: '42px', minHeight: 'auto', padding: '0.6rem 0.85rem' }}
                      placeholder="Ingresa tu clave actual o la temporal recibida"
                      value={changePassForm.contrasena_actual}
                      onChange={(e) => setChangePassForm({ ...changePassForm, contrasena_actual: e.target.value })}
                    />
                  </div>

                  <div className="vet-modal-field" style={{ marginBottom: 0 }}>
                    <label htmlFor="nueva_contrasena">Nueva Contraseña *</label>
                    <input
                      id="nueva_contrasena"
                      type="password"
                      required
                      minLength={6}
                      className="vet-modal-textarea"
                      style={{ height: '42px', minHeight: 'auto', padding: '0.6rem 0.85rem' }}
                      placeholder="Mínimo 6 caracteres"
                      value={changePassForm.nueva_contrasena}
                      onChange={(e) => setChangePassForm({ ...changePassForm, nueva_contrasena: e.target.value })}
                    />
                  </div>

                  <div className="vet-modal-field" style={{ marginBottom: 0 }}>
                    <label htmlFor="confirmar_nueva_contrasena">Confirmar Nueva Contraseña *</label>
                    <input
                      id="confirmar_nueva_contrasena"
                      type="password"
                      required
                      minLength={6}
                      className="vet-modal-textarea"
                      style={{ height: '42px', minHeight: 'auto', padding: '0.6rem 0.85rem' }}
                      placeholder="Repite la nueva contraseña"
                      value={changePassForm.confirmar_nueva_contrasena}
                      onChange={(e) => setChangePassForm({ ...changePassForm, confirmar_nueva_contrasena: e.target.value })}
                    />
                  </div>
                </div>

                <div className="vet-modal-actions" style={{ marginTop: '1.5rem', borderTop: '1px solid #f1f5f9', paddingTop: '1rem' }}>
                  {!passwordTemporal && (
                    <button
                      type="button"
                      className="vet-modal-btn vet-modal-btn--secondary"
                      onClick={() => setShowChangePasswordModal(false)}
                    >
                      Cancelar
                    </button>
                  )}

                  <button
                    type="submit"
                    className="vet-modal-btn vet-modal-btn--primary"
                    disabled={submittingChangePass}
                    style={{ width: passwordTemporal ? '100%' : 'auto' }}
                  >
                    {submittingChangePass ? (
                      <>
                        <i className="fa-solid fa-spinner fa-spin"></i>
                        <span>Guardando...</span>
                      </>
                    ) : (
                      <>
                        <i className="fa-solid fa-check"></i>
                        <span>Actualizar Contraseña</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
