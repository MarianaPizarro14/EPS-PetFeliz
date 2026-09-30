import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getStoredToken, getStoredUser, updateStoredUser, isValidAvatarUrl } from '../../utils/authStorage'
import SidebarVet from '../ui/SidebarVet'
import DashboardHeader from '../ui/DashboardHeader'
import './DashboardClient.css'
import './DashboardVeterinario.css'

export default function VetPacientes() {
  const navigate = useNavigate()
  const storedUser = getStoredUser()

  const [usuario, setUsuario] = useState({
    nombre: storedUser?.nombre || 'Dr. Veterinario',
    nombreCompleto: storedUser?.nombre || 'Médico Veterinario',
    foto: isValidAvatarUrl(storedUser?.foto || storedUser?.foto_perfil) ? (storedUser?.foto || storedUser?.foto_perfil) : null,
    rol: 'veterinario',
    email: storedUser?.email || '',
  })

  const [pacientes, setPacientes] = useState([])
  const [loading, setLoading] = useState(true)
  const [errorGlobal, setErrorGlobal] = useState('')
  const [searchTerm, setSearchTerm] = useState('')

  // Modal Expediente del Paciente
  const [selectedPaciente, setSelectedPaciente] = useState(null)

  const fetchPacientes = async () => {
    const token = getStoredToken()
    if (!token) {
      navigate('/login')
      return
    }

    try {
      setLoading(true)
      setErrorGlobal('')

      const [resPac, resDash] = await Promise.all([
        fetch(`${import.meta.env.VITE_API_URL}/veterinario/pacientes`, {
          headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
        }),
        fetch(`${import.meta.env.VITE_API_URL}/veterinario/dashboard`, {
          headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
        }),
      ])

      if (resPac.status === 401 || resPac.status === 403) {
        navigate('/login')
        return
      }

      if (resPac.ok) {
        const data = await resPac.json()
        setPacientes(data.pacientes || [])
      } else {
        setErrorGlobal('No se pudo cargar el listado de pacientes.')
      }

      if (resDash.ok) {
        const dashData = await resDash.json()
        if (dashData.veterinario) {
          const updatedUserObj = {
            ...usuario,
            nombre: dashData.veterinario.nombre,
            nombreCompleto: dashData.veterinario.nombre,
            especialidad: dashData.veterinario.especialidad || '',
            numero_tarjeta: dashData.veterinario.numero_tarjeta || '',
            telefono: dashData.veterinario.telefono || '',
            correo: dashData.veterinario.correo || dashData.veterinario.email || usuario.email,
            email: dashData.veterinario.correo || dashData.veterinario.email || usuario.email,
            foto: dashData.veterinario.foto_perfil || usuario.foto,
            rol: 'veterinario',
          }
          setUsuario(updatedUserObj)
          updateStoredUser(updatedUserObj)
        }
      }
    } catch (err) {
      console.error('Error al cargar pacientes del veterinario:', err)
      setErrorGlobal('Error de conexión con el servidor.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPacientes()
  }, [navigate])

  const searchLower = searchTerm.toLowerCase().trim()

  const pacientesFiltrados = pacientes.filter((p) => {
    if (!searchLower) return true
    return (
      (p.nombre || '').toLowerCase().includes(searchLower) ||
      (p.especie || '').toLowerCase().includes(searchLower) ||
      (p.raza && p.raza.toLowerCase().includes(searchLower)) ||
      (p.dueno?.nombre && p.dueno.nombre.toLowerCase().includes(searchLower))
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
          title="Mis Pacientes"
          subtitle="Historial de mascotas atendidas y consulta de expedientes clínicos"
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

        <div className="vet-pacientes-container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <div>
              <h2 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: '1.25rem', color: '#0f172a', margin: 0 }}>
                Listado Único de Pacientes ({pacientesFiltrados.length})
              </h2>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.86rem', color: '#64748b', margin: '0.2rem 0 0 0' }}>
                Mascotas que han recibido atención médica bajo tu consulta profesional
              </p>
            </div>
          </div>

          {loading ? (
            <div className="vet-loading-box">
              <i className="fa-solid fa-spinner fa-spin"></i>
              <p>Cargando pacientes y expedientes...</p>
            </div>
          ) : pacientesFiltrados.length === 0 ? (
            <div className="vet-empty-box">
              <i className="fa-solid fa-paw"></i>
              <h3>No hay pacientes registrados</h3>
              <p>No se encontraron mascotas en tu historial médico con ese nombre o criterio de búsqueda.</p>
            </div>
          ) : (
            <div className="vet-pacientes-grid">
              {pacientesFiltrados.map((paciente) => (
                <div key={paciente.id_mascota} className="vet-paciente-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
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
                        <span className="field-title"><i className="fa-solid fa-venus-mars"></i> Sexo:</span>
                        <span className="field-highlight">{paciente.sexo || 'No registrado'}</span>
                      </div>

                      <div className="vet-paciente-field">
                        <span className="field-title"><i className="fa-solid fa-shield-virus"></i> Alergias:</span>
                        <span style={{
                          fontWeight: 600,
                          color: paciente.alergias && paciente.alergias !== 'Ninguna registrada' ? '#dc2626' : '#059669',
                          background: paciente.alergias && paciente.alergias !== 'Ninguna registrada' ? '#fef2f2' : '#f0fdf4',
                          padding: '2px 8px',
                          borderRadius: '6px'
                        }}>
                          {paciente.alergias || 'Ninguna registrada'}
                        </span>
                      </div>

                      <div className="vet-paciente-field">
                        <span className="field-title"><i className="fa-solid fa-user"></i> Dueño / Tutor:</span>
                        <span className="field-highlight">{paciente.dueno?.nombre || 'Cliente EPS'}</span>
                      </div>

                      <div className="vet-paciente-field">
                        <span className="field-title"><i className="fa-solid fa-phone"></i> Teléfono Dueño:</span>
                        <span>{paciente.dueno?.telefono || 'N/R'}</span>
                      </div>

                      <div className="vet-paciente-field">
                        <span className="field-title"><i className="fa-solid fa-calendar-check"></i> Última Atención:</span>
                        <span style={{ fontWeight: 600, color: '#0f172a' }}>{paciente.ultima_cita || 'N/A'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="vet-paciente-footer">
                    <span className="vet-paciente-tag">
                      <i className="fa-solid fa-notes-medical"></i> {paciente.total_atenciones || 0} Atenciones
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelectedPaciente(paciente)}
                      className="vet-btn-expediente"
                    >
                      <i className="fa-regular fa-folder-open"></i> Ver Expediente
                    </button>
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
      </main>
    </div>
  )
}
