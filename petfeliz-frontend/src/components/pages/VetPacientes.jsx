import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getStoredToken, getStoredUser, isValidAvatarUrl } from '../../utils/authStorage'
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

      const res = await fetch(`${import.meta.env.VITE_API_URL}/veterinario/pacientes`, {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      })

      if (res.status === 401 || res.status === 403) {
        navigate('/login')
        return
      }

      if (res.ok) {
        const data = await res.json()
        setPacientes(data.pacientes || [])
      } else {
        setErrorGlobal('No se pudo cargar el listado de pacientes.')
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div>
              <h2 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: '1.2rem', color: '#0f172a', margin: 0 }}>
                Listado Único de Pacientes ({pacientesFiltrados.length})
              </h2>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.85rem', color: '#64748b', margin: '0.2rem 0 0 0' }}>
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
                        <span className="field-title">Sexo:</span>
                        <span>{paciente.sexo || 'No registrado'}</span>
                      </div>

                      <div className="vet-paciente-field">
                        <span className="field-title">Alergias / Notas:</span>
                        <span style={{ color: paciente.alergias && paciente.alergias !== 'Ninguna registrada' ? '#dc2626' : '#475569' }}>
                          {paciente.alergias || 'Ninguna registrada'}
                        </span>
                      </div>

                      <div className="vet-paciente-field">
                        <span className="field-title">Dueño / Tutor:</span>
                        <span className="field-highlight">{paciente.dueno?.nombre || 'Cliente EPS'}</span>
                      </div>

                      <div className="vet-paciente-field">
                        <span className="field-title">Teléfono Dueño:</span>
                        <span>{paciente.dueno?.telefono || 'N/R'}</span>
                      </div>

                      <div className="vet-paciente-field">
                        <span className="field-title">Última Atención:</span>
                        <span>{paciente.ultima_cita || 'N/A'}</span>
                      </div>
                    </div>
                  </div>

                  <div style={{ marginTop: '1rem', paddingTop: '0.85rem', borderTop: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span className="vet-paciente-tag">
                      <i className="fa-solid fa-notes-medical"></i> {paciente.total_atenciones || 0} Atenciones
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelectedPaciente(paciente)}
                      style={{
                        background: '#ecfdf5',
                        color: '#059669',
                        border: '1px solid #a7f3d0',
                        borderRadius: '8px',
                        padding: '0.45rem 0.75rem',
                        fontFamily: 'Inter, sans-serif',
                        fontWeight: 600,
                        fontSize: '0.8rem',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem'
                      }}
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
            <div className="vet-modal-box vet-modal-box--wide" style={{ maxWidth: '680px' }}>
              <div className="vet-modal-header" style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '1rem', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                  <img
                    src={
                      selectedPaciente.foto || selectedPaciente.foto_mascota ||
                      (selectedPaciente.especie === 'Gato'
                        ? 'https://res.cloudinary.com/dedroug6v/image/upload/v1782696391/foto_gato_1_nuieol.jpg'
                        : 'https://res.cloudinary.com/dedroug6v/image/upload/v1783709702/golden_retriever_sonriendo_e1mrkw.jpg')
                    }
                    alt={selectedPaciente.nombre}
                    style={{ width: '50px', height: '50px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #059669' }}
                  />
                  <div>
                    <h3 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: '1.2rem', color: '#0f172a', margin: 0 }}>
                      Expediente Clínico de {selectedPaciente.nombre}
                    </h3>
                    <p className="vet-modal-subtitle" style={{ margin: '0.15rem 0 0 0', fontSize: '0.84rem' }}>
                      {selectedPaciente.especie} {selectedPaciente.raza ? `• ${selectedPaciente.raza}` : ''} | Propietario: {selectedPaciente.dueno?.nombre || 'Cliente EPS'}
                    </p>
                  </div>
                </div>
                <button type="button" className="vet-modal-close" onClick={() => setSelectedPaciente(null)}>
                  <i className="fa-solid fa-xmark"></i>
                </button>
              </div>

              {/* Información General del Paciente */}
              <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '1rem', marginBottom: '1.25rem', border: '1px solid #e2e8f0', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block', fontWeight: 600 }}>Sexo</span>
                  <strong style={{ fontSize: '0.88rem', color: '#0f172a' }}>{selectedPaciente.sexo || 'No especificado'}</strong>
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block', fontWeight: 600 }}>Contacto Tutor</span>
                  <strong style={{ fontSize: '0.88rem', color: '#0f172a' }}>{selectedPaciente.dueno?.telefono || 'N/R'}</strong>
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block', fontWeight: 600 }}>Alergias</span>
                  <strong style={{ fontSize: '0.88rem', color: selectedPaciente.alergias && selectedPaciente.alergias !== 'Ninguna registrada' ? '#dc2626' : '#059669' }}>
                    {selectedPaciente.alergias || 'Ninguna registrada'}
                  </strong>
                </div>
              </div>

              {/* Historial de Consultas Atendidas */}
              <h4 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 600, fontSize: '0.98rem', color: '#0f172a', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <i className="fa-solid fa-clock-rotate-left" style={{ color: '#059669' }}></i> Historial de Atenciones ({selectedPaciente.citas ? selectedPaciente.citas.length : selectedPaciente.total_atenciones || 0})
              </h4>

              <div style={{ maxHeight: '320px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem', paddingRight: '0.25rem' }}>
                {selectedPaciente.citas && selectedPaciente.citas.length > 0 ? (
                  selectedPaciente.citas.map((citaItem, idx) => (
                    <div key={idx} style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '0.85rem 1rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                        <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '0.85rem', color: '#0f172a' }}>
                          <i className="fa-regular fa-calendar" style={{ color: '#059669', marginRight: '5px' }}></i>
                          {citaItem.fecha ? new Date(citaItem.fecha).toLocaleDateString('es-CO') : 'Fecha registrada'} — {citaItem.hora || ''}
                        </span>
                        <span style={{ background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0', borderRadius: '6px', padding: '0.15rem 0.5rem', fontSize: '0.72rem', fontWeight: 600 }}>
                          Completada
                        </span>
                      </div>
                      <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.83rem', color: '#334155', margin: '0 0 0.35rem 0', lineHeight: '1.4' }}>
                        <strong>Observaciones Clínicas:</strong> {citaItem.observacion || 'Atención general sin observaciones adicionales registradas.'}
                      </p>
                    </div>
                  ))
                ) : (
                  <div style={{ padding: '1.5rem', textAlign: 'center', background: '#f8fafc', borderRadius: '10px', color: '#64748b', fontSize: '0.85rem' }}>
                    <i className="fa-solid fa-file-medical" style={{ fontSize: '1.5rem', color: '#cbd5e1', marginBottom: '0.4rem', display: 'block' }}></i>
                    El historial clínico consolidado de esta mascota está registrado en el expediente general de EPS PetFeliz.
                  </div>
                )}
              </div>

              <div className="vet-modal-actions" style={{ marginTop: '1.25rem', paddingTop: '0.85rem', borderTop: '1px solid #f1f5f9' }}>
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
