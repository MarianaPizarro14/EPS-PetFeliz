import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { getStoredToken, getStoredUser, isValidAvatarUrl } from '../../utils/authStorage'
import SidebarVet from '../ui/SidebarVet'
import DashboardHeader from '../ui/DashboardHeader'
import './DashboardClient.css'
import './DashboardVeterinario.css'

export default function VetAtenderCita() {
  const { idCita } = useParams()
  const navigate = useNavigate()
  const storedUser = getStoredUser()

  const [usuario, setUsuario] = useState({
    nombre: storedUser?.nombre || 'Dr. Veterinario',
    nombreCompleto: storedUser?.nombre || 'Médico Veterinario',
    foto: isValidAvatarUrl(storedUser?.foto || storedUser?.foto_perfil) ? (storedUser?.foto || storedUser?.foto_perfil) : null,
    rol: 'veterinario',
    email: storedUser?.email || '',
  })

  const [cita, setCita] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [errorGlobal, setErrorGlobal] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  // Form states
  const [observacion, setObservacion] = useState('')
  const [medicamentos, setMedicamentos] = useState([
    { nombre: '', dosis: '', indicaciones: '' }
  ])

  const fetchCitaDetalle = async () => {
    const token = getStoredToken()
    if (!token) {
      navigate('/login')
      return
    }

    try {
      setLoading(true)
      setErrorGlobal('')

      const res = await fetch(`${import.meta.env.VITE_API_URL}/veterinario/citas/${idCita}`, {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      })

      if (res.status === 401 || res.status === 403) {
        navigate('/login')
        return
      }

      if (res.ok) {
        const data = await res.json()
        const c = data.cita
        setCita(c)
        setObservacion(c.observacion || '')

        if (c.medicamentos && Array.isArray(c.medicamentos) && c.medicamentos.length > 0) {
          setMedicamentos(c.medicamentos)
        } else {
          setMedicamentos([{ nombre: '', dosis: '', indicaciones: '' }])
        }
      } else {
        setErrorGlobal('No se pudo cargar la información de la cita médica.')
      }
    } catch (err) {
      console.error('Error al obtener detalle de la cita:', err)
      setErrorGlobal('Error de conexión con el servidor backend.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCitaDetalle()
  }, [idCita])

  // Manejo de tabla dinámica de medicamentos
  const handleAddMedicamento = () => {
    setMedicamentos((prev) => [...prev, { nombre: '', dosis: '', indicaciones: '' }])
  }

  const handleRemoveMedicamento = (index) => {
    setMedicamentos((prev) => prev.filter((_, i) => i !== index))
  }

  const handleMedicamentoChange = (index, field, value) => {
    setMedicamentos((prev) => {
      const updated = [...prev]
      updated[index] = { ...updated[index], [field]: value }
      return updated
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const token = getStoredToken()
    if (!token) return

    setSubmitting(true)
    setErrorGlobal('')
    setSuccessMsg('')

    // Filtrar medicamentos vacíos
    const medsFiltrados = medicamentos.filter((m) => m.nombre.trim() !== '')

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/veterinario/citas/${idCita}/atender`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          observacion: observacion.trim(),
          medicamentos: medsFiltrados,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setErrorGlobal(data.message || 'Error al guardar la consulta médica.')
        setSubmitting(false)
        return
      }

      setSuccessMsg('¡Atención médica y receta registradas exitosamente!')
      setTimeout(() => {
        navigate('/veterinario/citas')
      }, 1500)
    } catch (err) {
      console.error('Error al guardar atención:', err)
      setErrorGlobal('Error de red al intentar registrar la consulta.')
    } finally {
      setSubmitting(false)
    }
  }

  const isAtendida = cita?.id_estado === 4

  return (
    <div className="dash">
      <SidebarVet />

      <main className="dash-main">
        <DashboardHeader
          title={isAtendida ? 'Expediente de Atención Médica' : 'Atención Médica en Consulta'}
          subtitle={`Registro clínico y prescripción para la cita N° ${idCita}`}
          usuario={usuario}
          onUserUpdated={setUsuario}
        />

        {/* BREADCRUMB Y BOTÓN REGRESAR */}
        <div style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link
            to="/veterinario/citas"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              color: '#059669',
              fontFamily: 'Inter, sans-serif',
              fontWeight: 600,
              fontSize: '0.9rem',
              textDecoration: 'none',
              background: '#ecfdf5',
              padding: '0.4rem 0.85rem',
              borderRadius: '8px',
              border: '1px solid #a7f3d0'
            }}
          >
            <i className="fa-solid fa-arrow-left"></i> Volver a Gestión de Citas
          </Link>

          {isAtendida && (
            <span className="vet-badge vet-badge--atendida" style={{ padding: '0.4rem 0.85rem', fontSize: '0.85rem' }}>
              <i className="fa-solid fa-circle-check"></i> Consulta Finalizada / Atendida
            </span>
          )}
        </div>

        {errorGlobal && (
          <div className="dash-alert dash-alert--danger" style={{ marginBottom: '1.5rem' }}>
            <i className="fa-solid fa-triangle-exclamation"></i>
            <span>{errorGlobal}</span>
          </div>
        )}

        {successMsg && (
          <div className="dash-alert dash-alert--success" style={{ marginBottom: '1.5rem', background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0', padding: '0.9rem 1.1rem', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <i className="fa-solid fa-circle-check" style={{ fontSize: '1.2rem' }}></i>
            <strong style={{ fontFamily: 'Inter, sans-serif' }}>{successMsg}</strong>
          </div>
        )}

        {loading ? (
          <div className="vet-loading-box">
            <i className="fa-solid fa-spinner fa-spin"></i>
            <p>Cargando información del paciente y consulta...</p>
          </div>
        ) : !cita ? (
          <div className="vet-empty-box">
            <i className="fa-solid fa-circle-exclamation"></i>
            <h3>No se encontró la cita</h3>
            <p>La cita médica solicitada no existe o no tienes permiso para acceder a ella.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* ── GRID DE RESUMEN PACIENTE Y DUEÑO ── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
              
              {/* SECCIÓN 1: PACIENTE (MASCOTA) */}
              <div style={{ background: '#ffffff', borderRadius: '14px', padding: '1.35rem', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.65rem' }}>
                  <i className="fa-solid fa-paw" style={{ color: '#059669', fontSize: '1.15rem' }}></i>
                  <h3 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: '1.05rem', color: '#0f172a', margin: 0 }}>
                    Información del Paciente
                  </h3>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1.1rem', marginBottom: '1rem' }}>
                  <img
                    src={cita.paciente?.foto || 'https://res.cloudinary.com/dedroug6v/image/upload/v1783709702/golden_retriever_sonriendo_e1mrkw.jpg'}
                    alt={cita.paciente?.nombre}
                    style={{ width: '64px', height: '64px', borderRadius: '50%', objectFit: 'cover', border: '3px solid #a7f3d0', flexShrink: 0 }}
                  />
                  <div>
                    <h4 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: '1.15rem', color: '#0f172a', margin: '0 0 0.2rem 0' }}>
                      {cita.paciente?.nombre}
                    </h4>
                    <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.85rem', color: '#059669', fontWeight: 600 }}>
                      {cita.paciente?.especie} • {cita.paciente?.raza}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.85rem', background: '#f8fafc', padding: '0.85rem', borderRadius: '10px', border: '1px solid #f1f5f9' }}>
                  <div>
                    <span style={{ color: '#64748b', display: 'block', fontSize: '0.75rem', fontWeight: 600 }}>Sexo:</span>
                    <strong style={{ color: '#0f172a' }}>{cita.paciente?.sexo}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748b', display: 'block', fontSize: '0.75rem', fontWeight: 600 }}>Edad Aproximada:</span>
                    <strong style={{ color: '#0f172a' }}>{cita.paciente?.edad}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748b', display: 'block', fontSize: '0.75rem', fontWeight: 600 }}>Peso Corporal:</span>
                    <strong style={{ color: '#0f172a' }}>{cita.paciente?.peso}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748b', display: 'block', fontSize: '0.75rem', fontWeight: 600 }}>Alergias Registradas:</span>
                    <strong style={{ color: cita.paciente?.alergias !== 'Ninguna registrada' ? '#dc2626' : '#0f172a' }}>
                      {cita.paciente?.alergias}
                    </strong>
                  </div>
                </div>
              </div>

              {/* SECCIÓN 2: INFORMACIÓN DEL DUEÑO / TUTOR */}
              <div style={{ background: '#ffffff', borderRadius: '14px', padding: '1.35rem', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.65rem' }}>
                  <i className="fa-solid fa-user-doctor" style={{ color: '#059669', fontSize: '1.15rem' }}></i>
                  <h3 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: '1.05rem', color: '#0f172a', margin: 0 }}>
                    Tutor / Dueño del Paciente
                  </h3>
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <h4 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: '1.05rem', color: '#0f172a', margin: '0 0 0.2rem 0' }}>
                    {cita.dueno?.nombre}
                  </h4>
                  <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.85rem', color: '#64748b' }}>
                    Cédula / Doc: {cita.dueno?.cedula}
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.85rem', background: '#f8fafc', padding: '0.85rem', borderRadius: '10px', border: '1px solid #f1f5f9' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <i className="fa-solid fa-phone" style={{ color: '#059669', width: '16px' }}></i>
                    <span style={{ color: '#64748b' }}>Teléfono:</span>
                    <strong style={{ color: '#0f172a' }}>{cita.dueno?.telefono}</strong>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <i className="fa-solid fa-envelope" style={{ color: '#059669', width: '16px' }}></i>
                    <span style={{ color: '#64748b' }}>Correo:</span>
                    <strong style={{ color: '#0f172a' }}>{cita.dueno?.email}</strong>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <i className="fa-solid fa-stethoscope" style={{ color: '#059669', width: '16px' }}></i>
                    <span style={{ color: '#64748b' }}>Servicio:</span>
                    <strong style={{ color: '#059669' }}>{cita.servicio?.nombre}</strong>
                  </div>
                </div>
              </div>

            </div>

            {/* ── SECCIÓN 3: OBSERVACIONES CLÍNICAS Y DIAGNÓSTICO ── */}
            <div style={{ background: '#ffffff', borderRadius: '14px', padding: '1.5rem', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.65rem' }}>
                <i className="fa-solid fa-notes-medical" style={{ color: '#059669', fontSize: '1.2rem' }}></i>
                <div>
                  <h3 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: '1.05rem', color: '#0f172a', margin: 0 }}>
                    Observaciones Clínicas y Diagnóstico
                  </h3>
                  <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.82rem', color: '#64748b', margin: '0.1rem 0 0 0' }}>
                    Dictamen médico interno, síntomas observados, recomendaciones generales y constante vitales.
                  </p>
                </div>
              </div>

              <textarea
                rows={6}
                value={observacion}
                onChange={(e) => setObservacion(e.target.value)}
                placeholder="Escriba aquí los hallazgos clínicos durante la consulta, constantes fisiológicas, diagnóstico presuntivo/definitivo y recomendaciones para el paciente..."
                disabled={submitting}
                style={{
                  width: '100%',
                  padding: '0.85rem 1rem',
                  borderRadius: '10px',
                  border: '1px solid #cbd5e1',
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '0.9rem',
                  color: '#0f172a',
                  lineHeight: '1.5',
                  resize: 'vertical',
                  boxSizing: 'border-box',
                  outline: 'none',
                }}
              />
            </div>

            {/* ── SECCIÓN 4: PRESCRIPCIÓN DE MEDICAMENTOS (TABLA DINÁMICA) ── */}
            <div style={{ background: '#ffffff', borderRadius: '14px', padding: '1.5rem', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.65rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <i className="fa-solid fa-pills" style={{ color: '#059669', fontSize: '1.2rem' }}></i>
                  <div>
                    <h3 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: '1.05rem', color: '#0f172a', margin: 0 }}>
                      Medicamentos Recetados (Fórmula Médica)
                    </h3>
                    <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.82rem', color: '#64748b', margin: '0.1rem 0 0 0' }}>
                      Listado de fármacos prescriptos. Esta información será visible en el portal del cliente y en su PDF de receta.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleAddMedicamento}
                  disabled={submitting}
                  style={{
                    background: '#ecfdf5',
                    color: '#059669',
                    border: '1px solid #a7f3d0',
                    borderRadius: '8px',
                    padding: '0.45rem 0.9rem',
                    fontFamily: 'Inter, sans-serif',
                    fontWeight: 600,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem'
                  }}
                >
                  <i className="fa-solid fa-plus"></i> Agregar Medicamento
                </button>
              </div>

              {medicamentos.length === 0 ? (
                <p style={{ textAlign: 'center', color: '#94a3b8', fontFamily: 'Inter, sans-serif', padding: '1.5rem 0' }}>
                  No ha agregado ningún medicamento. Haga clic en "+ Agregar Medicamento" si requiere prescribir fármacos.
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  {medicamentos.map((med, idx) => (
                    <div
                      key={idx}
                      style={{
                        background: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        borderRadius: '10px',
                        padding: '1rem',
                        display: 'grid',
                        gridTemplateColumns: '1.2fr 1fr 1.5fr auto',
                        gap: '0.75rem',
                        alignItems: 'center'
                      }}
                    >
                      <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginBottom: '0.3rem' }}>
                          Nombre del Medicamento:
                        </label>
                        <input
                          type="text"
                          placeholder="Ej: Amoxicilina 250mg"
                          value={med.nombre}
                          onChange={(e) => handleMedicamentoChange(idx, 'nombre', e.target.value)}
                          disabled={submitting}
                          style={{
                            width: '100%',
                            padding: '0.45rem 0.65rem',
                            borderRadius: '6px',
                            border: '1px solid #cbd5e1',
                            fontFamily: 'Inter, sans-serif',
                            fontSize: '0.85rem',
                            boxSizing: 'border-box'
                          }}
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginBottom: '0.3rem' }}>
                          Dosis y Frecuencia:
                        </label>
                        <input
                          type="text"
                          placeholder="Ej: 1 tab c/12h por 7 días"
                          value={med.dosis}
                          onChange={(e) => handleMedicamentoChange(idx, 'dosis', e.target.value)}
                          disabled={submitting}
                          style={{
                            width: '100%',
                            padding: '0.45rem 0.65rem',
                            borderRadius: '6px',
                            border: '1px solid #cbd5e1',
                            fontFamily: 'Inter, sans-serif',
                            fontSize: '0.85rem',
                            boxSizing: 'border-box'
                          }}
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginBottom: '0.3rem' }}>
                          Indicaciones Especiales:
                        </label>
                        <input
                          type="text"
                          placeholder="Ej: Administrar junto a las comidas"
                          value={med.indicaciones}
                          onChange={(e) => handleMedicamentoChange(idx, 'indicaciones', e.target.value)}
                          disabled={submitting}
                          style={{
                            width: '100%',
                            padding: '0.45rem 0.65rem',
                            borderRadius: '6px',
                            border: '1px solid #cbd5e1',
                            fontFamily: 'Inter, sans-serif',
                            fontSize: '0.85rem',
                            boxSizing: 'border-box'
                          }}
                        />
                      </div>

                      <div style={{ marginTop: '1.1rem' }}>
                        <button
                          type="button"
                          onClick={() => handleRemoveMedicamento(idx)}
                          disabled={submitting || medicamentos.length === 1}
                          title="Eliminar medicamento"
                          style={{
                            background: medicamentos.length === 1 ? '#f1f5f9' : '#fef2f2',
                            color: medicamentos.length === 1 ? '#cbd5e1' : '#ef4444',
                            border: '1px solid #fecaca',
                            borderRadius: '6px',
                            padding: '0.5rem 0.65rem',
                            cursor: medicamentos.length === 1 ? 'not-allowed' : 'pointer'
                          }}
                        >
                          <i className="fa-solid fa-trash-can"></i>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ── BARRA DE ACCIÓN (GUARDAR / CANCELAR) ── */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '1rem', marginTop: '0.5rem' }}>
              <Link
                to="/veterinario/citas"
                style={{
                  padding: '0.65rem 1.25rem',
                  borderRadius: '10px',
                  background: '#f1f5f9',
                  color: '#475569',
                  fontFamily: 'Inter, sans-serif',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  textDecoration: 'none'
                }}
              >
                Cancelar
              </Link>

              <button
                type="submit"
                disabled={submitting}
                style={{
                  padding: '0.65rem 1.5rem',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                  color: '#ffffff',
                  fontFamily: 'Inter, sans-serif',
                  fontWeight: 600,
                  fontSize: '0.92rem',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  boxShadow: '0 4px 6px -1px rgba(5, 150, 105, 0.2)'
                }}
              >
                {submitting ? (
                  <>
                    <i className="fa-solid fa-spinner fa-spin"></i>
                    <span>Guardando Consulta...</span>
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-check"></i>
                    <span>Finalizar Consulta y Guardar Receta</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </main>
    </div>
  )
}
