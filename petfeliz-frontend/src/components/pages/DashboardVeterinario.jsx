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

  // Modal Expediente Clínico de la Mascota
  const [selectedPaciente, setSelectedPaciente] = useState(null)

  const handleOpenExpediente = (cita) => {
    const targetId = cita.mascota?.id_mascota || cita.id_mascota || cita.paciente?.id_mascota
    const pMatch = pacientes.find((p) => p.id_mascota === targetId)

    if (pMatch) {
      setSelectedPaciente(pMatch)
    } else {
      const fallbackPaciente = {
        id_mascota: targetId || 1,
        nombre: cita.mascota?.nombre || cita.paciente?.nombre || 'Paciente',
        especie: cita.mascota?.especie || cita.paciente?.especie || 'Canino',
        raza: cita.mascota?.raza || cita.paciente?.raza || 'Criollo',
        sexo: cita.mascota?.sexo || cita.paciente?.sexo || 'Macho',
        alergias: cita.mascota?.alergias || cita.paciente?.alergias || 'Ninguna registrada',
        foto: cita.mascota?.foto_mascota || cita.paciente?.foto || cita.paciente?.foto_mascota,
        dueno: cita.cliente || cita.dueno,
        total_atenciones: 1,
        ultima_cita: cita.fecha_formateada || cita.fecha,
        citas: [{
          id_cita: cita.id_cita,
          fecha: cita.fecha,
          fecha_formateada: cita.fecha_formateada || cita.fecha,
          hora: cita.hora,
          servicio: cita.servicio?.nombre_servicio || cita.servicio?.nombre || cita.motivo || 'Consulta Médica General',
          id_estado: cita.id_estado,
          estado_nombre: 'Atendida',
          observacion: cita.observacion,
          medicamentos: cita.medicamentos,
          veterinario: usuario.nombreCompleto || 'Médico Veterinario'
        }]
      }
      setSelectedPaciente(fallbackPaciente)
    }
  }

  const handleDownloadReceta = async (idCita) => {
    const token = getStoredToken()
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/cliente/documentos/receta-medica/${idCita}/pdf`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (!res.ok) {
        alert('No se pudo descargar la receta médica para esta cita.')
        return
      }
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Receta_Medica_PetFeliz_${idCita}.pdf`
      document.body.appendChild(a)
      a.click()
      a.remove()
    } catch (err) {
      console.error('Error al descargar la receta:', err)
      alert('Error al descargar el archivo de la receta médica.')
    }
  }

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
                        <button type="button" className="vet-btn-obs" onClick={() => handleOpenExpediente(cita)}>
                          <i className="fa-solid fa-file-prescription"></i>
                          <span>Ver Expediente y Receta</span>
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

        {/* ── MODAL: EXPEDIENTE CLÍNICO DE LA MASCOTA ── */}
        {selectedPaciente && (
          <div className="vet-modal-backdrop" style={{ zIndex: 1100 }}>
            <div className="vet-modal-box vet-modal-box--wide" style={{ maxWidth: '820px' }}>
              <div className="vet-modal-header" style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem', marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <img
                    src={
                      selectedPaciente.foto || selectedPaciente.foto_mascota ||
                      (selectedPaciente.especie === 'Gato'
                        ? 'https://res.cloudinary.com/dedroug6v/image/upload/v1782696391/foto_gato_1_nuieol.jpg'
                        : 'https://res.cloudinary.com/dedroug6v/image/upload/v1783709702/golden_retriever_sonriendo_e1mrkw.jpg')
                    }
                    alt={selectedPaciente.nombre}
                    style={{
                      width: '60px',
                      height: '60px',
                      borderRadius: '50%',
                      objectFit: 'cover',
                      aspectRatio: '1 / 1',
                      flexShrink: 0,
                      border: '3px solid #059669',
                      boxShadow: '0 4px 12px rgba(5, 150, 105, 0.2)'
                    }}
                  />
                  <div>
                    <h3 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: '1.3rem', color: '#0f172a', margin: 0 }}>
                      Expediente Clínico de {selectedPaciente.nombre}
                    </h3>
                    <p className="vet-modal-subtitle" style={{ margin: '0.2rem 0 0 0', fontSize: '0.86rem', color: '#475569' }}>
                      <strong>{selectedPaciente.especie}</strong> {selectedPaciente.raza ? `• ${selectedPaciente.raza}` : ''} | <strong>Tutor:</strong> {selectedPaciente.dueno?.nombre || 'Cliente EPS'}
                    </p>
                  </div>
                </div>
                <button type="button" className="vet-modal-close" onClick={() => setSelectedPaciente(null)}>
                  <i className="fa-solid fa-xmark"></i>
                </button>
              </div>

              {/* Resumen del Paciente */}
              <div style={{
                background: '#f8fafc',
                borderRadius: '14px',
                padding: '1.1rem',
                marginBottom: '1.5rem',
                border: '1px solid #e2e8f0',
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '1rem'
              }}>
                <div>
                  <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block', fontWeight: 600 }}>Sexo</span>
                  <strong style={{ fontSize: '0.9rem', color: '#0f172a' }}>{selectedPaciente.sexo || 'No especificado'}</strong>
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block', fontWeight: 600 }}>Teléfono Tutor</span>
                  <strong style={{ fontSize: '0.9rem', color: '#0f172a' }}>{selectedPaciente.dueno?.telefono || 'N/R'}</strong>
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block', fontWeight: 600 }}>Alergias</span>
                  <strong style={{
                    fontSize: '0.88rem',
                    color: selectedPaciente.alergias && selectedPaciente.alergias !== 'Ninguna registrada' ? '#dc2626' : '#059669'
                  }}>
                    {selectedPaciente.alergias || 'Ninguna registrada'}
                  </strong>
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block', fontWeight: 600 }}>Total Atenciones</span>
                  <strong style={{ fontSize: '0.9rem', color: '#047857' }}>
                    {selectedPaciente.citas ? selectedPaciente.citas.length : selectedPaciente.total_atenciones || 0} Consultas
                  </strong>
                </div>
              </div>

              {/* Timeline de Atenciones Previas */}
              <h4 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: '1.05rem', color: '#0f172a', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <i className="fa-solid fa-clock-rotate-left" style={{ color: '#059669' }}></i> Historial Clínico & Evolución de Consultas
              </h4>

              <div style={{ maxHeight: '420px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem', paddingRight: '0.35rem' }}>
                {selectedPaciente.citas && selectedPaciente.citas.length > 0 ? (
                  selectedPaciente.citas.map((citaItem, idx) => (
                    <div key={idx} style={{
                      background: '#ffffff',
                      border: '1px solid #cbd5e1',
                      borderRadius: '14px',
                      padding: '1.1rem 1.25rem',
                      boxShadow: '0 4px 12px rgba(15, 23, 42, 0.03)'
                    }}>
                      {/* Cabecera de la Consulta */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                          <span style={{
                            background: '#ecfdf5',
                            color: '#047857',
                            border: '1px solid #a7f3d0',
                            borderRadius: '8px',
                            padding: '0.25rem 0.65rem',
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.35rem'
                          }}>
                            <i className="fa-regular fa-calendar"></i>
                            {citaItem.fecha_formateada || (citaItem.fecha ? new Date(citaItem.fecha).toLocaleDateString('es-CO') : 'Fecha N/A')}
                            <i className="fa-regular fa-clock" style={{ marginLeft: '4px' }}></i>
                            {citaItem.hora || ''}
                          </span>
                          <strong style={{ fontFamily: 'Sora, sans-serif', fontSize: '0.95rem', color: '#0f172a' }}>
                            {citaItem.servicio || 'Consulta Médica General'}
                          </strong>
                        </div>
                        <span style={{ background: '#d1fae5', color: '#065f46', borderRadius: '20px', padding: '0.2rem 0.65rem', fontSize: '0.75rem', fontWeight: 600 }}>
                          <i className="fa-solid fa-circle-check" style={{ marginRight: '4px' }}></i>
                          {citaItem.estado_nombre || 'Atendida'}
                        </span>
                      </div>

                      <div style={{ fontSize: '0.82rem', color: '#64748b', marginBottom: '0.65rem', fontWeight: 600 }}>
                        <i className="fa-solid fa-user-doctor" style={{ marginRight: '4px', color: '#059669' }}></i>
                        Atendido por: {citaItem.veterinario || usuario.nombreCompleto || 'Médico Veterinario'}
                      </div>

                      {/* Diagnóstico / Observaciones */}
                      <div style={{
                        background: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        borderRadius: '12px',
                        padding: '0.75rem 1rem',
                        marginBottom: '0.75rem'
                      }}>
                        <span style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: '#047857', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.25rem' }}>
                          Diagnóstico:
                        </span>
                        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.88rem', color: '#1e293b', margin: 0, lineHeight: '1.5' }}>
                          {citaItem.observacion || 'Atención general sin observaciones adicionales registradas.'}
                        </p>
                      </div>

                      {/* Medicamentos Recetados */}
                      {citaItem.medicamentos && citaItem.medicamentos.length > 0 ? (
                        <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '10px', padding: '0.75rem 1rem', marginBottom: '0.75rem' }}>
                          <span style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#1d4ed8', marginBottom: '0.4rem' }}>
                            <i className="fa-solid fa-pills" style={{ marginRight: '5px' }}></i> Medicamentos Prescritos ({citaItem.medicamentos.length}):
                          </span>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                            {citaItem.medicamentos.map((med, mIdx) => (
                              <div key={mIdx} style={{ fontSize: '0.84rem', color: '#1e3a8a', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.3rem' }}>
                                <strong>
                                  <i className="fa-solid fa-capsules" style={{ color: '#2563eb', marginRight: '6px' }}></i>
                                  {med.nombre || med.medicamento || 'Medicamento'}
                                </strong>
                                <span style={{ background: '#dbeafe', padding: '2px 8px', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 600 }}>
                                  Dosis: {med.dosis || 'Según indicación'} {med.duracion ? `• ${med.duracion}` : ''}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div style={{ fontSize: '0.8rem', color: '#94a3b8', fontStyle: 'italic', marginBottom: '0.75rem' }}>
                          <i className="fa-solid fa-info-circle" style={{ marginRight: '4px' }}></i> No se registraron medicamentos prescritos en esta consulta.
                        </div>
                      )}

                      {/* Botón Descargar Receta PDF */}
                      <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '0.4rem', borderTop: '1px dashed #e2e8f0' }}>
                        <button
                          type="button"
                          onClick={() => handleDownloadReceta(citaItem.id_cita)}
                          style={{
                            background: '#eff6ff',
                            color: '#1d4ed8',
                            border: '1px solid #bfdbfe',
                            borderRadius: '8px',
                            padding: '0.4rem 0.85rem',
                            fontFamily: 'Inter, sans-serif',
                            fontWeight: 600,
                            fontSize: '0.8rem',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.4rem',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <i className="fa-solid fa-file-pdf" style={{ color: '#2563eb' }}></i> Descargar Receta Médica PDF
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{ padding: '2rem', textAlign: 'center', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', color: '#64748b' }}>
                    <i className="fa-solid fa-file-medical" style={{ fontSize: '2rem', color: '#94a3b8', marginBottom: '0.5rem', display: 'block' }}></i>
                    <p style={{ margin: 0, fontWeight: 600, fontSize: '0.9rem' }}>No existen registros previos de atención médica para este paciente.</p>
                  </div>
                )}
              </div>

              <div className="vet-modal-actions" style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid #e2e8f0' }}>
                <button type="button" className="vet-modal-btn vet-modal-btn--secondary" onClick={() => setSelectedPaciente(null)}>
                  Cerrar Expediente
                </button>
              </div>
            </div>
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
