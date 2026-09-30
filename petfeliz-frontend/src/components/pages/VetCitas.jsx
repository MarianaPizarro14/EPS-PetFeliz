import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getStoredToken, getStoredUser, updateStoredUser, isValidAvatarUrl } from '../../utils/authStorage'
import SidebarVet from '../ui/SidebarVet'
import DashboardHeader from '../ui/DashboardHeader'
import './DashboardClient.css'
import './DashboardVeterinario.css'

export default function VetCitas() {
  const navigate = useNavigate()
  const storedUser = getStoredUser()

  const [usuario, setUsuario] = useState({
    nombre: storedUser?.nombre || 'Dr. Veterinario',
    nombreCompleto: storedUser?.nombre || 'Médico Veterinario',
    foto: isValidAvatarUrl(storedUser?.foto || storedUser?.foto_perfil) ? (storedUser?.foto || storedUser?.foto_perfil) : null,
    rol: 'veterinario',
    email: storedUser?.email || '',
  })

  const [agendaSemanal, setAgendaSemanal] = useState([])
  const [loading, setLoading] = useState(true)
  const [errorGlobal, setErrorGlobal] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('todos') // 'todos' | 'pendiente' | 'atendida' | 'cancelada'

  // Toast flotante
  const [toast, setToast] = useState(null)
  const triggerToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 4000)
  }

  const fetchAgenda = async () => {
    const token = getStoredToken()
    if (!token) {
      navigate('/login')
      return
    }

    try {
      setLoading(true)
      setErrorGlobal('')

      const res = await fetch(`${import.meta.env.VITE_API_URL}/veterinario/dashboard`, {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      })

      if (res.status === 401 || res.status === 403) {
        navigate('/login')
        return
      }

      if (res.ok) {
        const data = await res.json()
        setAgendaSemanal(data.agenda_semanal || [])

        if (data.veterinario) {
          const updatedUserObj = {
            ...usuario,
            nombre: data.veterinario.nombre,
            nombreCompleto: data.veterinario.nombre,
            especialidad: data.veterinario.especialidad || '',
            numero_tarjeta: data.veterinario.numero_tarjeta || '',
            telefono: data.veterinario.telefono || '',
            correo: data.veterinario.correo || data.veterinario.email || usuario.email,
            email: data.veterinario.correo || data.veterinario.email || usuario.email,
            foto: data.veterinario.foto_perfil || usuario.foto,
            rol: 'veterinario',
          }
          setUsuario(updatedUserObj)
          updateStoredUser(updatedUserObj)
        }
      } else {
        setErrorGlobal('No se pudo cargar la agenda de citas.')
      }
    } catch (err) {
      console.error('Error al cargar agenda médica:', err)
      setErrorGlobal('Error de conexión con el servidor.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAgenda()
  }, [navigate])

  const searchLower = searchTerm.toLowerCase().trim()

  const agendaFiltrada = agendaSemanal
    .map((dia) => {
      const citasDelDia = dia.citas.filter((c) => {
        if (filterStatus === 'pendiente' && c.id_estado !== 1 && c.id_estado !== 2) return false
        if (filterStatus === 'atendida' && c.id_estado !== 4) return false
        if (filterStatus === 'cancelada' && c.id_estado !== 3) return false

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
          title="Gestión de Citas"
          subtitle="Agenda de consultas médicas programadas y registros de atención"
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

        {/* ── BARRA DE FILTROS ── */}
        <div className="vet-tabs-header" style={{ marginBottom: '1.5rem' }}>
          <div className="vet-tabs-nav">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <i className="fa-regular fa-calendar-days" style={{ color: '#059669', fontSize: '1.1rem' }}></i>
              <strong style={{ fontFamily: 'Sora, sans-serif', fontSize: '1.05rem', color: '#0f172a' }}>
                Agenda Médica Agrupada por Fecha
              </strong>
            </div>
          </div>

          <div className="vet-status-filters">
            <span className="vet-filter-label">Filtrar por estado:</span>
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
            <button
              type="button"
              className={`vet-filter-chip ${filterStatus === 'cancelada' ? 'vet-filter-chip--active' : ''}`}
              onClick={() => setFilterStatus('cancelada')}
            >
              Canceladas
            </button>
          </div>
        </div>

        {/* ── AGENDA CONTENIDO ── */}
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
                        <div className="vet-cita-status-block" style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', alignItems: 'flex-start' }}>
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

                          {cita.estado_pago === 'pendiente' ? (
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.3rem',
                                fontSize: '0.74rem',
                                padding: '0.2rem 0.55rem',
                                borderRadius: '6px',
                                fontWeight: 600,
                                background: '#fffbeb',
                                color: '#b45309',
                                border: '1px solid #fde68a'
                              }}
                              title={`Método: ${cita.metodo_pago || 'Pendiente'}`}
                            >
                              <i className="fa-solid fa-clock"></i> Pago Pendiente
                            </span>
                          ) : (
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.3rem',
                                fontSize: '0.74rem',
                                padding: '0.2rem 0.55rem',
                                borderRadius: '6px',
                                fontWeight: 600,
                                background: '#f0fdf4',
                                color: '#15803d',
                                border: '1px solid #bbf7d0'
                              }}
                              title={`Método: ${cita.metodo_pago || 'En línea'}`}
                            >
                              <i className="fa-solid fa-check"></i> Pagado
                            </span>
                          )}
                        </div>

                        {/* Acciones */}
                        <div className="vet-cita-actions">
                          {isPendiente && (
                            <button
                              type="button"
                              className="vet-btn-atender"
                              onClick={() => navigate(`/veterinario/atender/${cita.id_cita}`)}
                            >
                              <i className="fa-solid fa-stethoscope"></i>
                              <span>Atender Cita</span>
                            </button>
                          )}

                          {isAtendida && (
                            <button
                              type="button"
                              className="vet-btn-obs"
                              onClick={() => navigate(`/veterinario/atender/${cita.id_cita}`)}
                            >
                              <i className="fa-solid fa-file-prescription"></i>
                              <span>Ver Expediente y Receta</span>
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
      </main>
    </div>
  )
}
