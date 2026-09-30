import React, { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { getStoredToken, getStoredUser, isValidAvatarUrl } from '../../utils/authStorage'
import SidebarVet from '../ui/SidebarVet'
import DashboardHeader from '../ui/DashboardHeader'
import './DashboardClient.css'
import './DashboardVeterinario.css'
import './VetAtenderCita.css'

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
  const [fieldErrors, setFieldErrors] = useState({})

  // Form states - Paciente
  const [pacienteForm, setPacienteForm] = useState({
    nombre: '',
    especie: 'Canino',
    raza: '',
    sexo: 'Macho',
    fecha_nacimiento: '',
    peso: '',
    alergias: '',
  })

  // Form states - Tutor
  const [duenoForm, setDuenoForm] = useState({
    nombre: '',
    telefono: '',
    email: '',
    cedula: '',
  })

  // Form states - Consulta clínica
  const [observacion, setObservacion] = useState('')
  const [medicamentos, setMedicamentos] = useState([
    { nombre: '', dosis: '', indicaciones: '' }
  ])

  // Control de cambios no guardados
  const [isDirty, setIsDirty] = useState(false)
  const initialDataLoadedRef = useRef(false)

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

        // Cargar datos del paciente
        setPacienteForm({
          nombre: c.paciente?.nombre || '',
          especie: c.paciente?.especie || 'Canino',
          raza: c.paciente?.raza || '',
          sexo: c.paciente?.sexo === 'Hembra' ? 'Hembra' : 'Macho',
          fecha_nacimiento: c.paciente?.fecha_nacimiento || '',
          peso: c.paciente?.peso !== null && c.paciente?.peso !== undefined ? String(c.paciente.peso) : '',
          alergias: c.paciente?.alergias || '',
        })

        // Cargar datos del tutor
        setDuenoForm({
          nombre: c.dueno?.nombre || '',
          telefono: c.dueno?.telefono || '',
          email: c.dueno?.email || '',
          cedula: c.dueno?.cedula || '',
        })

        // Observación médica limpia (nota de pago separada en backend)
        setObservacion(c.observacion || '')

        // Medicamentos
        if (c.medicamentos && Array.isArray(c.medicamentos) && c.medicamentos.length > 0) {
          setMedicamentos(c.medicamentos)
        } else {
          setMedicamentos([{ nombre: '', dosis: '', indicaciones: '' }])
        }

        initialDataLoadedRef.current = true
        setIsDirty(false)
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

  // Aviso al intentar salir con cambios sin guardar
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isDirty) {
        e.preventDefault()
        e.returnValue = ''
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [isDirty])

  // Helper para cambios en paciente
  const handlePacienteChange = (field, value) => {
    setPacienteForm((prev) => ({ ...prev, [field]: value }))
    setIsDirty(true)
    if (fieldErrors[`paciente.${field}`]) {
      setFieldErrors((prev) => {
        const copy = { ...prev }
        delete copy[`paciente.${field}`]
        return copy
      })
    }
  }

  // Helper para cambios en tutor
  const handleDuenoChange = (field, value) => {
    setDuenoForm((prev) => ({ ...prev, [field]: value }))
    setIsDirty(true)
    if (fieldErrors[`dueno.${field}`]) {
      setFieldErrors((prev) => {
        const copy = { ...prev }
        delete copy[`dueno.${field}`]
        return copy
      })
    }
  }

  // Helper para cambios en medicamentos
  const handleAddMedicamento = () => {
    setMedicamentos((prev) => [...prev, { nombre: '', dosis: '', indicaciones: '' }])
    setIsDirty(true)
  }

  const handleRemoveMedicamento = (index) => {
    setMedicamentos((prev) => prev.filter((_, i) => i !== index))
    setIsDirty(true)
  }

  const handleMedicamentoChange = (index, field, value) => {
    setMedicamentos((prev) => {
      const updated = [...prev]
      updated[index] = { ...updated[index], [field]: value }
      return updated
    })
    setIsDirty(true)
  }

  const handleObservacionChange = (value) => {
    setObservacion(value)
    setIsDirty(true)
    if (fieldErrors['observacion']) {
      setFieldErrors((prev) => {
        const copy = { ...prev }
        delete copy['observacion']
        return copy
      })
    }
  }

  // Confirmación de salida manual si hay cambios
  const handleSafeNavigate = (toPath) => {
    if (isDirty) {
      const confirmLeave = window.confirm('Tienes cambios sin guardar en esta atención clínica. ¿Deseas salir de todas formas?')
      if (!confirmLeave) return
    }
    navigate(toPath)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const token = getStoredToken()
    if (!token) return

    setSubmitting(true)
    setErrorGlobal('')
    setSuccessMsg('')
    setFieldErrors({})

    // Filtrar medicamentos vacíos
    const medsFiltrados = medicamentos.filter((m) => m.nombre && m.nombre.trim() !== '')

    // Preparar payload completo con paciente, dueño, observaciones y medicamentos
    const payload = {
      paciente: {
        nombre: pacienteForm.nombre.trim(),
        especie: pacienteForm.especie.trim(),
        raza: pacienteForm.raza.trim(),
        sexo: pacienteForm.sexo,
        fecha_nacimiento: pacienteForm.fecha_nacimiento || null,
        peso: pacienteForm.peso !== '' ? Number(pacienteForm.peso) : null,
        alergias: pacienteForm.alergias.trim() || 'Ninguna registrada',
      },
      dueno: {
        nombre: duenoForm.nombre.trim(),
        telefono: duenoForm.telefono.trim(),
        cedula: duenoForm.cedula.trim(),
        email: duenoForm.email.trim(),
      },
      observacion: observacion.trim(),
      medicamentos: medsFiltrados,
    }

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/veterinario/citas/${idCita}/atender`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(payload),
      })

      const data = await res.json()

      if (!res.ok) {
        if (res.status === 422 && data.errors) {
          setFieldErrors(data.errors)
          setErrorGlobal('Existen errores de validación en el formulario. Por favor revisa los campos señalados.')
        } else {
          setErrorGlobal(data.message || 'Error al guardar la consulta médica.')
        }
        setSubmitting(false)
        return
      }

      setIsDirty(false)
      setSuccessMsg('Atención clínica, actualización de datos y receta médica registradas exitosamente.')
      setTimeout(() => {
        navigate('/veterinario/citas')
      }, 1400)
    } catch (err) {
      console.error('Error al guardar atención:', err)
      setErrorGlobal('Error de red al intentar registrar la consulta.')
    } finally {
      setSubmitting(false)
    }
  }

  const isAtendida = cita?.id_estado === 4

  // Verificar si hay alergias reales para la franja resumen
  const hasAlergias = pacienteForm.alergias &&
    pacienteForm.alergias.trim() !== '' &&
    pacienteForm.alergias.trim().toLowerCase() !== 'ninguna' &&
    pacienteForm.alergias.trim().toLowerCase() !== 'ninguna registrada'

  return (
    <div className="dash">
      <SidebarVet />

      <main className="dash-main">
        <DashboardHeader
          title="Atención Médica en Consulta"
          subtitle={`Historia Clínica Electrónica • Cita N° ${idCita}`}
          usuario={usuario}
          onUserUpdated={setUsuario}
        />

        <div className="hce-container">
          {/* ── BREADCRUMB SOBRIO TIPO ENLACE ── */}
          <div className="hce-page-header">
            <div>
              <button
                type="button"
                onClick={() => handleSafeNavigate('/veterinario/citas')}
                className="hce-breadcrumb"
                style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
              >
                <i className="fa-solid fa-arrow-left"></i>
                <span>Citas / Atender cita N° {idCita}</span>
              </button>
              <h2 className="hce-page-title" style={{ marginTop: '0.4rem' }}>
                {isAtendida ? 'Expediente Clínico Finalizado' : 'Registro de Atención y Receta'}
              </h2>
              <p className="hce-page-subtitle">
                Software clínico veterinario • Ingrese hallazgos, actualización de ficha y prescripción.
              </p>
            </div>

            {isAtendida && (
              <span className="vet-badge vet-badge--atendida" style={{ borderRadius: '6px' }}>
                <i className="fa-solid fa-circle-check"></i> Consulta Finalizada
              </span>
            )}
          </div>

          {/* ── MENSAJES GLOBALES ── */}
          {errorGlobal && (
            <div className="dash-alert dash-alert--danger" style={{ borderRadius: '6px', margin: 0 }}>
              <i className="fa-solid fa-triangle-exclamation"></i>
              <span>{errorGlobal}</span>
            </div>
          )}

          {successMsg && (
            <div
              className="dash-alert dash-alert--success"
              style={{
                borderRadius: '6px',
                margin: 0,
                background: '#f0fdf4',
                color: '#15803d',
                border: '1px solid #bbf7d0',
                padding: '0.85rem 1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem'
              }}
            >
              <i className="fa-solid fa-circle-check" style={{ fontSize: '1.1rem' }}></i>
              <span>{successMsg}</span>
            </div>
          )}

          {loading ? (
            <div className="vet-loading-box" style={{ borderRadius: '6px' }}>
              <i className="fa-solid fa-spinner fa-spin"></i>
              <p>Cargando información del paciente y consulta...</p>
            </div>
          ) : !cita ? (
            <div className="vet-empty-box" style={{ borderRadius: '6px' }}>
              <i className="fa-solid fa-circle-exclamation"></i>
              <h3>No se encontró la cita</h3>
              <p>La cita solicitada no existe o no cuentas con los permisos para atenderla.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              
              {/* ── FRANJA RESUMEN DEL PACIENTE ── */}
              <div className="hce-summary-strip">
                <div className="hce-summary-main">
                  <div className="hce-summary-patient">
                    <img
                      src={cita.paciente?.foto || 'https://res.cloudinary.com/dedroug6v/image/upload/v1/mascotas/default_pet.jpg'}
                      alt={pacienteForm.nombre || 'Paciente'}
                      className="hce-patient-avatar"
                    />
                    <div>
                      <h3 className="hce-patient-name">{pacienteForm.nombre || 'Paciente sin nombre'}</h3>
                      <div className="hce-patient-meta">
                        <span>{pacienteForm.especie} • {pacienteForm.raza || 'Criollo / Mestizo'}</span>
                        <span className="hce-meta-separator">•</span>
                        <span>Sexo: {pacienteForm.sexo}</span>
                        <span className="hce-meta-separator">•</span>
                        <span>Edad: {cita.paciente?.edad || 'N/R'}</span>
                        <span className="hce-meta-separator">•</span>
                        <span>Peso: {pacienteForm.peso ? `${pacienteForm.peso} kg` : 'Sin registrar'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="hce-patient-meta" style={{ justifyContent: 'flex-end' }}>
                    <span><strong>Cita:</strong> #{idCita}</span>
                    <span className="hce-meta-separator">•</span>
                    <span><strong>Servicio:</strong> {cita.servicio?.nombre || 'Consulta General'}</span>
                    <span className="hce-meta-separator">•</span>
                    <span><strong>Fecha:</strong> {cita.fecha_formateada} ({cita.hora})</span>
                  </div>
                </div>

                {/* ALERTA DE ALERGIAS VISIBLE */}
                {hasAlergias && (
                  <div className="hce-alert-allergies">
                    <i className="fa-solid fa-triangle-exclamation"></i>
                    <span><strong>ALERGIAS REGISTRADAS:</strong> {pacienteForm.alergias}</span>
                  </div>
                )}

                {/* NOTA DE LA CITA / RESERVA */}
                {cita.nota_cita && (
                  <div className="hce-note-badge">
                    <i className="fa-solid fa-circle-info"></i>
                    <span><strong>Nota de la cita:</strong> {cita.nota_cita}</span>
                  </div>
                )}
              </div>

              {/* ── SECCIÓN 1: DATOS DEL PACIENTE (EDITABLE IN-PLACE) ── */}
              <div className="hce-card">
                <div className="hce-card-header">
                  <h3 className="hce-section-title">Datos del Paciente</h3>
                  <span className="hce-section-desc">Actualización directa en la ficha clínica de la mascota</span>
                </div>

                <div className="hce-grid-3">
                  <div className="hce-field">
                    <label className="hce-label" htmlFor="paciente-nombre">Nombre de la mascota *</label>
                    <input
                      id="paciente-nombre"
                      type="text"
                      className={`hce-input ${fieldErrors['paciente.nombre'] ? 'hce-input--error' : ''}`}
                      value={pacienteForm.nombre}
                      onChange={(e) => handlePacienteChange('nombre', e.target.value)}
                      disabled={submitting || isAtendida}
                      placeholder="Nombre del paciente"
                    />
                    {fieldErrors['paciente.nombre'] && (
                      <span className="hce-field-error">{fieldErrors['paciente.nombre'][0]}</span>
                    )}
                  </div>

                  <div className="hce-field">
                    <label className="hce-label" htmlFor="paciente-especie">Especie *</label>
                    <input
                      id="paciente-especie"
                      type="text"
                      className={`hce-input ${fieldErrors['paciente.especie'] ? 'hce-input--error' : ''}`}
                      value={pacienteForm.especie}
                      onChange={(e) => handlePacienteChange('especie', e.target.value)}
                      disabled={submitting || isAtendida}
                      placeholder="Canino, Felino, etc."
                    />
                    {fieldErrors['paciente.especie'] && (
                      <span className="hce-field-error">{fieldErrors['paciente.especie'][0]}</span>
                    )}
                  </div>

                  <div className="hce-field">
                    <label className="hce-label" htmlFor="paciente-raza">Raza</label>
                    <input
                      id="paciente-raza"
                      type="text"
                      className={`hce-input ${fieldErrors['paciente.raza'] ? 'hce-input--error' : ''}`}
                      value={pacienteForm.raza}
                      onChange={(e) => handlePacienteChange('raza', e.target.value)}
                      disabled={submitting || isAtendida}
                      placeholder="Criollo / Mestizo o raza"
                    />
                    {fieldErrors['paciente.raza'] && (
                      <span className="hce-field-error">{fieldErrors['paciente.raza'][0]}</span>
                    )}
                  </div>

                  <div className="hce-field">
                    <label className="hce-label" htmlFor="paciente-sexo">Sexo *</label>
                    <select
                      id="paciente-sexo"
                      className={`hce-select ${fieldErrors['paciente.sexo'] ? 'hce-select--error' : ''}`}
                      value={pacienteForm.sexo}
                      onChange={(e) => handlePacienteChange('sexo', e.target.value)}
                      disabled={submitting || isAtendida}
                    >
                      <option value="Macho">Macho</option>
                      <option value="Hembra">Hembra</option>
                    </select>
                    {fieldErrors['paciente.sexo'] && (
                      <span className="hce-field-error">{fieldErrors['paciente.sexo'][0]}</span>
                    )}
                  </div>

                  <div className="hce-field">
                    <label className="hce-label" htmlFor="paciente-fecha-nacimiento">Fecha de nacimiento</label>
                    <input
                      id="paciente-fecha-nacimiento"
                      type="date"
                      className={`hce-input ${fieldErrors['paciente.fecha_nacimiento'] ? 'hce-input--error' : ''}`}
                      value={pacienteForm.fecha_nacimiento}
                      onChange={(e) => handlePacienteChange('fecha_nacimiento', e.target.value)}
                      disabled={submitting || isAtendida}
                    />
                    {fieldErrors['paciente.fecha_nacimiento'] && (
                      <span className="hce-field-error">{fieldErrors['paciente.fecha_nacimiento'][0]}</span>
                    )}
                  </div>

                  <div className="hce-field">
                    <label className="hce-label" htmlFor="paciente-peso">Peso actual (kg)</label>
                    <input
                      id="paciente-peso"
                      type="number"
                      step="0.01"
                      min="0.05"
                      max="250"
                      className={`hce-input ${fieldErrors['paciente.peso'] ? 'hce-input--error' : ''}`}
                      value={pacienteForm.peso}
                      onChange={(e) => handlePacienteChange('peso', e.target.value)}
                      disabled={submitting || isAtendida}
                      placeholder="Ej: 12.50"
                    />
                    {fieldErrors['paciente.peso'] && (
                      <span className="hce-field-error">{fieldErrors['paciente.peso'][0]}</span>
                    )}
                  </div>

                  <div className="hce-field hce-col-span-full">
                    <label className="hce-label" htmlFor="paciente-alergias">Alergias o sensibilidades</label>
                    <input
                      id="paciente-alergias"
                      type="text"
                      className={`hce-input ${fieldErrors['paciente.alergias'] ? 'hce-input--error' : ''}`}
                      value={pacienteForm.alergias}
                      onChange={(e) => handlePacienteChange('alergias', e.target.value)}
                      disabled={submitting || isAtendida}
                      placeholder="Ej: Alérgico a penicilinas, intolerancia al pollo..."
                    />
                    {fieldErrors['paciente.alergias'] && (
                      <span className="hce-field-error">{fieldErrors['paciente.alergias'][0]}</span>
                    )}
                  </div>
                </div>
              </div>

              {/* ── SECCIÓN 2: DATOS DEL TUTOR (EDITABLE IN-PLACE) ── */}
              <div className="hce-card">
                <div className="hce-card-header">
                  <h3 className="hce-section-title">Datos del Tutor</h3>
                  <span className="hce-section-desc">Actualización de contacto del titular responsable</span>
                </div>

                <div className="hce-grid-2">
                  <div className="hce-field">
                    <label className="hce-label" htmlFor="dueno-nombre">Nombres y Apellidos *</label>
                    <input
                      id="dueno-nombre"
                      type="text"
                      className={`hce-input ${fieldErrors['dueno.nombre'] ? 'hce-input--error' : ''}`}
                      value={duenoForm.nombre}
                      onChange={(e) => handleDuenoChange('nombre', e.target.value)}
                      disabled={submitting || isAtendida}
                      placeholder="Nombre completo del tutor"
                    />
                    {fieldErrors['dueno.nombre'] && (
                      <span className="hce-field-error">{fieldErrors['dueno.nombre'][0]}</span>
                    )}
                  </div>

                  <div className="hce-field">
                    <label className="hce-label" htmlFor="dueno-cedula">Cédula / Documento de Identidad *</label>
                    <input
                      id="dueno-cedula"
                      type="text"
                      className={`hce-input ${fieldErrors['dueno.cedula'] ? 'hce-input--error' : ''}`}
                      value={duenoForm.cedula}
                      onChange={(e) => handleDuenoChange('cedula', e.target.value)}
                      disabled={submitting || isAtendida}
                      placeholder="Número de documento"
                    />
                    {fieldErrors['dueno.cedula'] && (
                      <span className="hce-field-error">{fieldErrors['dueno.cedula'][0]}</span>
                    )}
                  </div>

                  <div className="hce-field">
                    <label className="hce-label" htmlFor="dueno-telefono">Teléfono de contacto *</label>
                    <input
                      id="dueno-telefono"
                      type="text"
                      className={`hce-input ${fieldErrors['dueno.telefono'] ? 'hce-input--error' : ''}`}
                      value={duenoForm.telefono}
                      onChange={(e) => handleDuenoChange('telefono', e.target.value)}
                      disabled={submitting || isAtendida}
                      placeholder="Ej: 3001234567"
                    />
                    {fieldErrors['dueno.telefono'] && (
                      <span className="hce-field-error">{fieldErrors['dueno.telefono'][0]}</span>
                    )}
                  </div>

                  <div className="hce-field">
                    <label className="hce-label" htmlFor="dueno-email">Correo Electrónico *</label>
                    <input
                      id="dueno-email"
                      type="email"
                      className={`hce-input ${fieldErrors['dueno.email'] ? 'hce-input--error' : ''}`}
                      value={duenoForm.email}
                      onChange={(e) => handleDuenoChange('email', e.target.value)}
                      disabled={submitting || isAtendida}
                      placeholder="correo@ejemplo.com"
                    />
                    {fieldErrors['dueno.email'] && (
                      <span className="hce-field-error">{fieldErrors['dueno.email'][0]}</span>
                    )}
                  </div>
                </div>
              </div>

              {/* ── SECCIÓN 3: OBSERVACIONES CLÍNICAS Y DIAGNÓSTICO ── */}
              <div className="hce-card">
                <div className="hce-card-header">
                  <h3 className="hce-section-title">Observaciones Clínicas y Diagnóstico</h3>
                  <span className="hce-section-desc">Dictamen médico, signos clínicos y plan terapéutico</span>
                </div>

                <div className="hce-field">
                  <textarea
                    rows={5}
                    id="consulta-observacion"
                    className={`hce-textarea ${fieldErrors['observacion'] ? 'hce-textarea--error' : ''}`}
                    value={observacion}
                    onChange={(e) => handleObservacionChange(e.target.value)}
                    placeholder="Escriba aquí los hallazgos clínicos durante la consulta, constantes fisiológicas, diagnóstico presuntivo o definitivo y recomendaciones generales..."
                    disabled={submitting || isAtendida}
                  />
                  {fieldErrors['observacion'] && (
                    <span className="hce-field-error">{fieldErrors['observacion'][0]}</span>
                  )}
                </div>
              </div>

              {/* ── SECCIÓN 4: MEDICAMENTOS RECETADOS (TABLA REAL) ── */}
              <div className="hce-card">
                <div className="hce-card-header">
                  <h3 className="hce-section-title">Medicamentos Prescritos</h3>
                  <span className="hce-section-desc">Fórmula médica visible en portal cliente y PDF de receta</span>
                </div>

                <div className="hce-table-wrapper">
                  <table className="hce-med-table">
                    <thead>
                      <tr>
                        <th style={{ width: '30%' }}>Medicamento</th>
                        <th style={{ width: '30%' }}>Dosis y Frecuencia</th>
                        <th style={{ width: '34%' }}>Indicaciones Especiales</th>
                        <th style={{ width: '6%', textAlign: 'center' }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {medicamentos.length === 0 ? (
                        <tr>
                          <td colSpan={4} style={{ textAlign: 'center', color: '#94a3b8', padding: '1.25rem' }}>
                            Sin medicamentos prescritos. Use el botón inferior si requiere agregar fármacos.
                          </td>
                        </tr>
                      ) : (
                        medicamentos.map((med, idx) => (
                          <tr key={idx}>
                            <td>
                              <input
                                type="text"
                                className="hce-table-input"
                                placeholder="Ej: Amoxicilina 250mg"
                                value={med.nombre}
                                onChange={(e) => handleMedicamentoChange(idx, 'nombre', e.target.value)}
                                disabled={submitting || isAtendida}
                              />
                            </td>
                            <td>
                              <input
                                type="text"
                                className="hce-table-input"
                                placeholder="Ej: 1 tab cada 12h por 7 días"
                                value={med.dosis}
                                onChange={(e) => handleMedicamentoChange(idx, 'dosis', e.target.value)}
                                disabled={submitting || isAtendida}
                              />
                            </td>
                            <td>
                              <input
                                type="text"
                                className="hce-table-input"
                                placeholder="Ej: Administrar junto a las comidas"
                                value={med.indicaciones}
                                onChange={(e) => handleMedicamentoChange(idx, 'indicaciones', e.target.value)}
                                disabled={submitting || isAtendida}
                              />
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              <button
                                type="button"
                                className="hce-btn-delete-row"
                                onClick={() => handleRemoveMedicamento(idx)}
                                disabled={submitting || isAtendida || medicamentos.length === 1}
                                title="Eliminar fila"
                              >
                                <i className="fa-solid fa-trash-can"></i>
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {!isAtendida && (
                  <button
                    type="button"
                    onClick={handleAddMedicamento}
                    disabled={submitting}
                    className="hce-btn-outline"
                  >
                    <i className="fa-solid fa-plus"></i>
                    <span>Agregar medicamento</span>
                  </button>
                )}
              </div>

              {/* ── BARRA DE ACCIONES FIJA INFERIOR ── */}
              <div className="hce-actions-bar">
                <button
                  type="button"
                  onClick={() => handleSafeNavigate('/veterinario/citas')}
                  className="hce-btn-secondary"
                  disabled={submitting}
                >
                  Cancelar
                </button>

                {!isAtendida ? (
                  <button
                    type="submit"
                    disabled={submitting}
                    className="hce-btn-primary"
                  >
                    {submitting ? (
                      <>
                        <i className="fa-solid fa-spinner fa-spin"></i>
                        <span>Guardando consulta...</span>
                      </>
                    ) : (
                      <>
                        <i className="fa-solid fa-check"></i>
                        <span>Finalizar consulta y guardar receta</span>
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => navigate('/veterinario/citas')}
                    className="hce-btn-primary"
                  >
                    <i className="fa-solid fa-arrow-left"></i>
                    <span>Volver a Citas</span>
                  </button>
                )}
              </div>

            </form>
          )}
        </div>
      </main>
    </div>
  )
}
