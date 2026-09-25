import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getStoredToken, getStoredUser, isValidAvatarUrl } from '../../utils/authStorage'
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
        if (filterStatus === 'pendiente' && c.id_estado !== 1) return false
        if (filterStatus === 'atendida' && c.id_estado !== 2) return false

        // Filtro búsqueda
        if (!searchLower) return true
        return (
          c.mascota.nombre.toLowerCase().includes(searchLower) ||
          c.mascota.especie.toLowerCase().includes(searchLower) ||
          c.cliente.nombre.toLowerCase().includes(searchLower) ||
          c.servicio.nombre_servicio.toLowerCase().includes(searchLower)
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
        />

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
                      const isPendiente = cita.id_estado === 1
                      const isAtendida = cita.id_estado === 2
                      const isCancelada = cita.id_estado === 3

                      return (
                        <div key={cita.id_cita} className="vet-cita-row">
                          {/* Hora y Servicio */}
                          <div className="vet-cita-time-block">
                            <span className="vet-cita-time">
                              <i className="fa-regular fa-clock"></i> {cita.hora}
                            </span>
                            <span className="vet-cita-service-badge">
                              {cita.servicio.nombre_servicio}
                            </span>
                          </div>

                          {/* Mascota */}
                          <div className="vet-cita-pet-info">
                            <img
                              src={
                                cita.mascota.foto_mascota ||
                                (cita.mascota.especie === 'Gato'
                                  ? 'https://res.cloudinary.com/dedroug6v/image/upload/v1782696391/foto_gato_1_nuieol.jpg'
                                  : 'https://res.cloudinary.com/dedroug6v/image/upload/v1783709702/golden_retriever_sonriendo_e1mrkw.jpg')
                              }
                              alt={cita.mascota.nombre}
                              className="vet-pet-avatar"
                            />
                            <div>
                              <strong className="vet-pet-name">{cita.mascota.nombre}</strong>
                              <span className="vet-pet-detail">
                                {cita.mascota.especie} {cita.mascota.raza ? `• ${cita.mascota.raza}` : ''}
                              </span>
                            </div>
                          </div>

                          {/* Cliente / Dueño */}
                          <div className="vet-cita-owner-info">
                            <span className="vet-owner-label">Dueño / Solicitante:</span>
                            <strong className="vet-owner-name">{cita.cliente.nombre}</strong>
                            <span className="vet-owner-phone">
                              <i className="fa-solid fa-phone"></i> {cita.cliente.telefono}
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
                              {cita.estado_nombre}
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
      </main>
    </div>
  )
}
