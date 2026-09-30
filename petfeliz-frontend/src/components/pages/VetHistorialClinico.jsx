import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getStoredToken, getStoredUser, updateStoredUser, isValidAvatarUrl } from '../../utils/authStorage'
import SidebarVet from '../ui/SidebarVet'
import DashboardHeader from '../ui/DashboardHeader'
import './DashboardClient.css'
import './DashboardVeterinario.css'

export default function VetHistorialClinico() {
  const navigate = useNavigate()
  const storedUser = getStoredUser()

  const [usuario, setUsuario] = useState({
    nombre: storedUser?.nombre || 'Dr. Veterinario',
    nombreCompleto: storedUser?.nombre || 'Médico Veterinario',
    foto: isValidAvatarUrl(storedUser?.foto || storedUser?.foto_perfil) ? (storedUser?.foto || storedUser?.foto_perfil) : null,
    rol: 'veterinario',
    email: storedUser?.email || '',
  })

  const [todasCitas, setTodasCitas] = useState([])
  const [loading, setLoading] = useState(true)
  const [errorGlobal, setErrorGlobal] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedConsulta, setSelectedConsulta] = useState(null)

  const fetchHistorial = async () => {
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
        const citasData = data.todas_citas || data.citas || []
        setTodasCitas(citasData)

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
        setErrorGlobal('No se pudo obtener el historial clínico.')
      }
    } catch (err) {
      console.error('Error al cargar historial clínico:', err)
      setErrorGlobal('Error de conexión con el servidor.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchHistorial()
  }, [navigate])

  const searchLower = searchTerm.toLowerCase().trim()

  const consultasFiltradas = todasCitas.filter((c) => {
    if (!searchLower) return true
    const pNombre = (c.paciente?.nombre || c.mascota?.nombre || '').toLowerCase()
    const pEspecie = (c.paciente?.especie || c.mascota?.especie || '').toLowerCase()
    const dNombre = (c.dueno?.nombre || c.cliente?.nombre || '').toLowerCase()
    const sNombre = (c.servicio?.nombre_servicio || c.servicio?.nombre || c.motivo || '').toLowerCase()
    const obsText = (c.observacion || '').toLowerCase()

    return (
      pNombre.includes(searchLower) ||
      pEspecie.includes(searchLower) ||
      dNombre.includes(searchLower) ||
      sNombre.includes(searchLower) ||
      obsText.includes(searchLower)
    )
  })

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

  return (
    <div className="dash">
      <SidebarVet />

      <main className="dash-main">
        <DashboardHeader
          title="Historial Clínico"
          subtitle="Consulta general de registros de atención médica y observaciones clínicas de pacientes"
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

        <div className="vet-agenda-container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem' }}>
            <div>
              <h2 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: '1.25rem', color: '#0f172a', margin: '0 0 0.55rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <i className="fa-solid fa-file-waveform" style={{ color: '#059669' }}></i>
                Registros Clínicos de Atenciones ({consultasFiltradas.length})
              </h2>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.86rem', color: '#64748b', margin: 0 }}>
                Buscador y consulta detallada de dictámenes médicos, diagnósticos e indicaciones registradas
              </p>
            </div>
          </div>

          {loading ? (
            <div className="vet-loading-box">
              <i className="fa-solid fa-spinner fa-spin"></i>
              <p>Cargando registros clínicos...</p>
            </div>
          ) : consultasFiltradas.length === 0 ? (
            <div className="vet-empty-box">
              <i className="fa-solid fa-file-circle-xmark"></i>
              <h3>No se encontraron registros clínicos</h3>
              <p>No se encontraron consultas registradas que coincidan con la búsqueda ingresada.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {consultasFiltradas.map((cita) => {
                const isAtendida = cita.id_estado === 4
                const isPendiente = cita.id_estado === 1 || cita.id_estado === 2
                const fechaFmt = cita.fecha_formateada || cita.fecha
                const servicioNombre = cita.servicio?.nombre_servicio || cita.servicio?.nombre || cita.motivo || 'Consulta General'

                return (
                  <div
                    key={cita.id_cita}
                    style={{
                      background: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '16px',
                      padding: '1.35rem 1.6rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '1.35rem',
                      boxShadow: '0 4px 20px rgba(15, 23, 42, 0.03)',
                      transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1.25rem', flex: 1 }}>
                      <img
                        src={
                          cita.paciente?.foto || cita.paciente?.foto_mascota || cita.mascota?.foto_mascota ||
                          (cita.mascota?.especie === 'Gato'
                            ? 'https://res.cloudinary.com/dedroug6v/image/upload/v1782696391/foto_gato_1_nuieol.jpg'
                            : 'https://res.cloudinary.com/dedroug6v/image/upload/v1783709702/golden_retriever_sonriendo_e1mrkw.jpg')
                        }
                        alt={cita.paciente?.nombre || 'Paciente'}
                        style={{
                          width: '58px',
                          height: '58px',
                          borderRadius: '50%',
                          objectFit: 'cover',
                          aspectRatio: '1 / 1',
                          flexShrink: 0,
                          border: '2.5px solid #10b981',
                          boxShadow: '0 3px 10px rgba(16, 185, 129, 0.15)'
                        }}
                      />

                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.6rem', flexWrap: 'wrap' }}>
                          <strong style={{ fontFamily: 'Sora, sans-serif', fontSize: '1.08rem', color: '#0f172a', fontWeight: 700 }}>
                            {cita.paciente?.nombre || cita.mascota?.nombre || 'Paciente'}
                          </strong>
                          <span style={{
                            fontSize: '0.78rem',
                            fontFamily: 'Inter, sans-serif',
                            background: '#f1f5f9',
                            color: '#334155',
                            padding: '3px 10px',
                            borderRadius: '6px',
                            fontWeight: 600,
                            border: '1px solid #cbd5e1'
                          }}>
                            {cita.paciente?.especie || cita.mascota?.especie || 'Mascota'}
                          </span>
                          <span style={{
                            fontSize: '0.78rem',
                            fontFamily: 'Inter, sans-serif',
                            background: '#ecfdf5',
                            color: '#047857',
                            padding: '3px 10px',
                            borderRadius: '6px',
                            fontWeight: 600,
                            border: '1px solid #a7f3d0'
                          }}>
                            <i className="fa-solid fa-stethoscope" style={{ marginRight: '5px' }}></i>
                            {servicioNombre}
                          </span>
                        </div>

                        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.86rem', color: '#475569', margin: '0 0 0.75rem 0', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                          <span><strong><i className="fa-solid fa-user" style={{ color: '#059669', marginRight: '5px' }}></i> Tutor:</strong> {cita.cliente?.nombre || cita.dueno?.nombre || 'Cliente EPS'}</span>
                          <span><strong><i className="fa-regular fa-calendar-days" style={{ color: '#059669', marginRight: '5px' }}></i> Fecha:</strong> {fechaFmt} ({cita.hora})</span>
                        </p>

                        {/* Dictamen / Observación Médica */}
                        {cita.observacion ? (
                          <div style={{
                            background: '#f8fafc',
                            border: '1px solid #e2e8f0',
                            borderRadius: '12px',
                            padding: '0.75rem 1rem',
                            marginTop: '0.75rem',
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '0.65rem'
                          }}>
                            <i className="fa-solid fa-notes-medical" style={{ color: '#059669', marginTop: '4px', fontSize: '0.9rem' }}></i>
                            <div style={{ flex: 1 }}>
                              <span style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: '#047857', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.25rem' }}>
                                Diagnóstico:
                              </span>
                              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.86rem', color: '#334155', margin: 0, lineHeight: '1.5' }}>
                                {cita.observacion}
                              </p>
                            </div>
                          </div>
                        ) : (
                          <div style={{ marginTop: '0.65rem', fontSize: '0.82rem', color: '#94a3b8', fontStyle: 'italic', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <i className="fa-regular fa-clock"></i> Sin observaciones registradas todavía
                          </div>
                        )}
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.75rem', flexShrink: 0 }}>
                      <span className={`vet-badge ${isAtendida ? 'vet-badge--atendida' : isPendiente ? 'vet-badge--pendiente' : 'vet-badge--cancelada'}`}>
                        <i className={`fa-solid ${isAtendida ? 'fa-circle-check' : isPendiente ? 'fa-clock' : 'fa-circle-xmark'}`}></i>
                        {isAtendida ? 'Atendida' : isPendiente ? 'Pendiente' : 'Cancelada'}
                      </span>

                      <button
                        type="button"
                        onClick={() => setSelectedConsulta(cita)}
                        style={{
                          background: '#eff6ff',
                          color: '#1d4ed8',
                          border: '1px solid #bfdbfe',
                          borderRadius: '10px',
                          padding: '0.55rem 1rem',
                          fontFamily: 'Inter, sans-serif',
                          fontWeight: 600,
                          fontSize: '0.84rem',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.45rem',
                          transition: 'all 0.2s ease',
                          boxShadow: '0 2px 6px rgba(29, 78, 216, 0.08)'
                        }}
                      >
                        <i className="fa-regular fa-folder-open" style={{ color: '#2563eb' }}></i> Ver Registro
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* ── MODAL: DETALLE DE REGISTRO CLÍNICO ── */}
        {selectedConsulta && (
          <div className="vet-modal-backdrop" style={{ zIndex: 1100 }}>
            <div className="vet-modal-box" style={{ maxWidth: '720px' }}>
              <div className="vet-modal-header" style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem', marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                  <img
                    src={
                      selectedConsulta.paciente?.foto || selectedConsulta.paciente?.foto_mascota || selectedConsulta.mascota?.foto_mascota ||
                      (selectedConsulta.mascota?.especie === 'Gato'
                        ? 'https://res.cloudinary.com/dedroug6v/image/upload/v1782696391/foto_gato_1_nuieol.jpg'
                        : 'https://res.cloudinary.com/dedroug6v/image/upload/v1783709702/golden_retriever_sonriendo_e1mrkw.jpg')
                    }
                    alt={selectedConsulta.paciente?.nombre || 'Paciente'}
                    style={{
                      width: '56px',
                      height: '56px',
                      borderRadius: '50%',
                      objectFit: 'cover',
                      aspectRatio: '1 / 1',
                      flexShrink: 0,
                      border: '2.5px solid #059669'
                    }}
                  />
                  <div>
                    <h3 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: '1.2rem', color: '#0f172a', margin: 0 }}>
                      Registro Clínico — {selectedConsulta.paciente?.nombre || selectedConsulta.mascota?.nombre}
                    </h3>
                    <p className="vet-modal-subtitle" style={{ margin: '0.2rem 0 0 0', fontSize: '0.84rem', color: '#475569' }}>
                      <strong>{selectedConsulta.servicio?.nombre_servicio || selectedConsulta.motivo}</strong> — {selectedConsulta.fecha_formateada || selectedConsulta.fecha} a las {selectedConsulta.hora}
                    </p>
                  </div>
                </div>
                <button type="button" className="vet-modal-close" onClick={() => setSelectedConsulta(null)}>
                  <i className="fa-solid fa-xmark"></i>
                </button>
              </div>

              <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '1rem', marginBottom: '1.25rem', border: '1px solid #e2e8f0', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.85rem' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block', fontWeight: 600 }}>Tutor / Cliente</span>
                  <strong style={{ fontSize: '0.88rem', color: '#0f172a' }}>{selectedConsulta.cliente?.nombre || selectedConsulta.dueno?.nombre || 'Cliente EPS'}</strong>
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block', fontWeight: 600 }}>Contacto Teléfono</span>
                  <strong style={{ fontSize: '0.88rem', color: '#0f172a' }}>{selectedConsulta.cliente?.telefono || selectedConsulta.dueno?.telefono || 'N/R'}</strong>
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block', fontWeight: 600 }}>Estado Cita</span>
                  <strong style={{ fontSize: '0.88rem', color: selectedConsulta.id_estado === 4 ? '#059669' : '#d97706' }}>
                    {selectedConsulta.id_estado === 4 ? 'Atendida' : 'Pendiente'}
                  </strong>
                </div>
              </div>

              <div className="vet-modal-field">
                <label style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: '0.9rem', color: '#0f172a', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <i className="fa-solid fa-stethoscope" style={{ color: '#059669' }}></i> Observaciones Clínicas y Recomendaciones
                </label>
                <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '12px', padding: '1rem', minHeight: '90px', fontFamily: 'Inter, sans-serif', fontSize: '0.9rem', color: '#1e293b', lineHeight: '1.5' }}>
                  {selectedConsulta.observacion || 'No se registraron observaciones adicionales para esta cita médica.'}
                </div>
              </div>

              {selectedConsulta.medicamentos && Array.isArray(selectedConsulta.medicamentos) && selectedConsulta.medicamentos.length > 0 && (
                <div className="vet-modal-field" style={{ marginTop: '1.25rem' }}>
                  <label style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: '0.9rem', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem' }}>
                    <i className="fa-solid fa-pills" style={{ color: '#2563eb' }}></i> Medicamentos Prescritos
                  </label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {selectedConsulta.medicamentos.map((m, idx) => (
                      <div key={idx} style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '10px', padding: '0.75rem 1rem' }}>
                        <strong style={{ color: '#1e3a8a', fontSize: '0.88rem', display: 'block' }}>
                          <i className="fa-solid fa-capsules" style={{ color: '#2563eb', marginRight: '6px' }}></i>
                          {m.nombre || m.medicamento}
                        </strong>
                        <span style={{ color: '#1d4ed8', fontSize: '0.82rem', fontWeight: 600, display: 'block', marginTop: '3px' }}>Dosis: {m.dosis} {m.duracion ? `• ${m.duracion}` : ''}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="vet-modal-actions" style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button
                  type="button"
                  onClick={() => handleDownloadReceta(selectedConsulta.id_cita)}
                  style={{
                    background: '#eff6ff',
                    color: '#1d4ed8',
                    border: '1px solid #bfdbfe',
                    borderRadius: '10px',
                    padding: '0.5rem 1rem',
                    fontFamily: 'Inter, sans-serif',
                    fontWeight: 600,
                    fontSize: '0.84rem',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.45rem'
                  }}
                >
                  <i className="fa-solid fa-file-pdf" style={{ color: '#2563eb' }}></i> Descargar Receta Médica PDF
                </button>
                <button type="button" className="vet-modal-btn vet-modal-btn--secondary" onClick={() => setSelectedConsulta(null)}>
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
