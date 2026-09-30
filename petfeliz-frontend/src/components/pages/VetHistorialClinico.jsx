import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getStoredToken, getStoredUser, isValidAvatarUrl } from '../../utils/authStorage'
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
        // Filtrar consultas atendidas o con observaciones
        setTodasCitas(citasData)
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div>
              <h2 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: '1.2rem', color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <i className="fa-solid fa-file-waveform" style={{ color: '#059669' }}></i>
                Registros Clínicos de Atenciones ({consultasFiltradas.length})
              </h2>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.85rem', color: '#64748b', margin: '0.2rem 0 0 0' }}>
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {consultasFiltradas.map((cita) => {
                const isAtendida = cita.id_estado === 4
                const fechaFmt = cita.fecha_formateada || cita.fecha
                const servicioNombre = cita.servicio?.nombre_servicio || cita.servicio?.nombre || cita.motivo || 'Consulta General'

                return (
                  <div
                    key={cita.id_cita}
                    style={{
                      background: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '12px',
                      padding: '1.1rem 1.25rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '1rem',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                      transition: 'border-color 0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1 }}>
                      <img
                        src={
                          cita.paciente?.foto || cita.paciente?.foto_mascota || cita.mascota?.foto_mascota ||
                          (cita.mascota?.especie === 'Gato'
                            ? 'https://res.cloudinary.com/dedroug6v/image/upload/v1782696391/foto_gato_1_nuieol.jpg'
                            : 'https://res.cloudinary.com/dedroug6v/image/upload/v1783709702/golden_retriever_sonriendo_e1mrkw.jpg')
                        }
                        alt={cita.paciente?.nombre || 'Paciente'}
                        style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #a7f3d0', flexShrink: 0 }}
                      />

                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.2rem' }}>
                          <strong style={{ fontFamily: 'Sora, sans-serif', fontSize: '0.95rem', color: '#0f172a', fontWeight: 600 }}>
                            {cita.paciente?.nombre || cita.mascota?.nombre || 'Paciente'}
                          </strong>
                          <span style={{ fontSize: '0.75rem', background: '#f1f5f9', color: '#475569', padding: '0.1rem 0.45rem', borderRadius: '6px', fontWeight: 600 }}>
                            {cita.paciente?.especie || cita.mascota?.especie || 'Mascota'}
                          </span>
                          <span style={{ fontSize: '0.78rem', color: '#059669', fontWeight: 600 }}>
                            • {servicioNombre}
                          </span>
                        </div>

                        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.83rem', color: '#475569', margin: '0 0 0.25rem 0', lineHeight: '1.4' }}>
                          <strong>Tutor:</strong> {cita.cliente?.nombre || cita.dueno?.nombre || 'Cliente EPS'} | <strong>Fecha:</strong> {fechaFmt} ({cita.hora})
                        </p>

                        {cita.observacion ? (
                          <div style={{ fontSize: '0.81rem', color: '#334155', background: '#f8fafc', padding: '0.4rem 0.65rem', borderRadius: '6px', borderLeft: '3px solid #059669', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '580px' }}>
                            <i className="fa-solid fa-notes-medical" style={{ color: '#059669', marginRight: '6px' }}></i>
                            {cita.observacion}
                          </div>
                        ) : (
                          <span style={{ fontSize: '0.78rem', color: '#94a3b8', italic: 'true' }}>Sin observaciones registradas todavía</span>
                        )}
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
                      <span className={`vet-badge ${isAtendida ? 'vet-badge--atendida' : 'vet-badge--pendiente'}`}>
                        <i className={`fa-solid ${isAtendida ? 'fa-circle-check' : 'fa-clock'}`}></i>
                        {isAtendida ? 'Atendida' : 'Pendiente'}
                      </span>

                      <button
                        type="button"
                        onClick={() => setSelectedConsulta(cita)}
                        style={{
                          background: '#ecfdf5',
                          color: '#059669',
                          border: '1px solid #a7f3d0',
                          borderRadius: '8px',
                          padding: '0.45rem 0.8rem',
                          fontFamily: 'Inter, sans-serif',
                          fontWeight: 600,
                          fontSize: '0.8rem',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem'
                        }}
                      >
                        <i className="fa-regular fa-eye"></i> Detalle
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
            <div className="vet-modal-box" style={{ maxWidth: '600px' }}>
              <div className="vet-modal-header" style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '0.85rem', marginBottom: '1rem' }}>
                <div>
                  <h3 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: '1.15rem', color: '#0f172a', margin: 0 }}>
                    Registro Clínico — {selectedConsulta.paciente?.nombre || selectedConsulta.mascota?.nombre}
                  </h3>
                  <p className="vet-modal-subtitle" style={{ margin: '0.2rem 0 0 0' }}>
                    {selectedConsulta.servicio?.nombre_servicio || selectedConsulta.motivo} — {selectedConsulta.fecha_formateada || selectedConsulta.fecha} a las {selectedConsulta.hora}
                  </p>
                </div>
                <button type="button" className="vet-modal-close" onClick={() => setSelectedConsulta(null)}>
                  <i className="fa-solid fa-xmark"></i>
                </button>
              </div>

              <div style={{ background: '#f8fafc', borderRadius: '10px', padding: '0.85rem 1rem', marginBottom: '1rem', border: '1px solid #e2e8f0', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block', fontWeight: 600 }}>Propietario / Cliente</span>
                  <strong style={{ fontSize: '0.88rem', color: '#0f172a' }}>{selectedConsulta.cliente?.nombre || selectedConsulta.dueno?.nombre}</strong>
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block', fontWeight: 600 }}>Teléfono Contacto</span>
                  <strong style={{ fontSize: '0.88rem', color: '#0f172a' }}>{selectedConsulta.cliente?.telefono || selectedConsulta.dueno?.telefono || 'N/R'}</strong>
                </div>
              </div>

              <div className="vet-modal-field">
                <label style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '0.86rem', color: '#334155' }}>
                  Observaciones Clínicas y Recomendaciones
                </label>
                <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '10px', padding: '1rem', minHeight: '80px', fontFamily: 'Inter, sans-serif', fontSize: '0.88rem', color: '#0f172a', lineHeight: '1.5' }}>
                  {selectedConsulta.observacion || 'No se registraron observaciones adicionales para esta cita médica.'}
                </div>
              </div>

              {selectedConsulta.medicamentos && Array.isArray(selectedConsulta.medicamentos) && selectedConsulta.medicamentos.length > 0 && (
                <div className="vet-modal-field" style={{ marginTop: '1rem' }}>
                  <label style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '0.86rem', color: '#334155', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <i className="fa-solid fa-pills" style={{ color: '#059669' }}></i> Medicamentos Recetados
                  </label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.4rem' }}>
                    {selectedConsulta.medicamentos.map((m, idx) => (
                      <div key={idx} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0.65rem 0.85rem' }}>
                        <strong style={{ color: '#0f172a', fontSize: '0.85rem', display: 'block' }}>{m.nombre}</strong>
                        <span style={{ color: '#059669', fontSize: '0.8rem', fontWeight: 600, display: 'block' }}>{m.dosis}</span>
                        {m.indicaciones && <span style={{ color: '#64748b', fontSize: '0.78rem', display: 'block', fontStyle: 'italic' }}>{m.indicaciones}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="vet-modal-actions" style={{ marginTop: '1.25rem' }}>
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
