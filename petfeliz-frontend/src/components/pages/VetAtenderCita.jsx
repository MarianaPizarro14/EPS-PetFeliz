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
    edad_aproximada: '16',
    peso: '12.00',
    alergias: '',
  })

  // Form states - Tutor
  const [duenoForm, setDuenoForm] = useState({
    nombre: '',
    telefono: '',
    email: '',
    cedula: '',
  })

  // Form states - Pago de la consulta
  const [pagoForm, setPagoForm] = useState({
    metodo_pago: 'Pago en línea',
    estado_pago: 'pagado',
    monto: 35000,
  })

  // Form states - Consulta clínica
  const [observacion, setObservacion] = useState('')
  const [medicamentos, setMedicamentos] = useState([
    { nombre: '', dosis: '', indicaciones: '' }
  ])

  // Control de cambios no guardados
  const [isDirty, setIsDirty] = useState(false)
  const isLoadedRef = useRef(false)

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

        // Resolver peso y edad/fecha_nacimiento de forma consistente
        const pesoVal = (c.paciente?.peso !== null && c.paciente?.peso !== undefined && Number(c.paciente.peso) > 0)
          ? String(c.paciente.peso)
          : '12.00'

        const fechaNacVal = c.paciente?.fecha_nacimiento || ''
        let edadAproxVal = '16'
        if (fechaNacVal) {
          const anioNac = new Date(fechaNacVal).getFullYear()
          if (!isNaN(anioNac)) {
            edadAproxVal = String(Math.max(0, new Date().getFullYear() - anioNac))
          }
        } else if (c.paciente?.edad_aproximada) {
          edadAproxVal = String(c.paciente.edad_aproximada)
        }

        // Cargar paciente
        setPacienteForm({
          nombre: c.paciente?.nombre || '',
          especie: c.paciente?.especie || 'Canino',
          raza: c.paciente?.raza || '',
          sexo: c.paciente?.sexo === 'Hembra' ? 'Hembra' : 'Macho',
          fecha_nacimiento: fechaNacVal,
          edad_aproximada: edadAproxVal,
          peso: pesoVal,
          alergias: (c.paciente?.alergias && c.paciente.alergias !== 'Ninguna registrada') ? c.paciente.alergias : '',
        })

        // Cargar tutor
        setDuenoForm({
          nombre: c.dueno?.nombre || '',
          telefono: c.dueno?.telefono || '',
          email: c.dueno?.email || '',
          cedula: c.dueno?.cedula || '',
        })

        // Cargar pago de consulta
        setPagoForm({
          metodo_pago: c.pago?.metodo_pago || c.metodo_pago || 'Pago en línea',
          estado_pago: c.pago?.estado_pago || c.estado_pago || 'pagado',
          monto: c.pago?.monto || c.monto_pago || (c.servicio?.precio ?? 35000),
        })

        // Observación médica limpia (inicia vacía si era nota de pago)
        setObservacion(c.observacion || '')

        // Medicamentos
        if (c.medicamentos && Array.isArray(c.medicamentos) && c.medicamentos.length > 0) {
          setMedicamentos(c.medicamentos)
        } else {
          setMedicamentos([{ nombre: '', dosis: '', indicaciones: '' }])
        }

        isLoadedRef.current = true
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

  // Alerta de cambios no guardados
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

  // Cambios en paciente con sincronización de fecha y edad
  const handlePacienteChange = (field, value) => {
    setPacienteForm((prev) => {
      const updated = { ...prev, [field]: value }

      if (field === 'fecha_nacimiento' && value) {
        const year = new Date(value).getFullYear()
        if (!isNaN(year)) {
          const calcAge = Math.max(0, new Date().getFullYear() - year)
          updated.edad_aproximada = String(calcAge)
        }
      } else if (field === 'edad_aproximada' && value) {
        const ageNum = parseInt(value, 10)
        if (!isNaN(ageNum) && ageNum >= 0) {
          const targetYear = new Date().getFullYear() - ageNum
          updated.fecha_nacimiento = `${targetYear}-01-01`
        }
      }

      return updated
    })

    setIsDirty(true)
    if (fieldErrors[`paciente.${field}`]) {
      setFieldErrors((prev) => {
        const copy = { ...prev }
        delete copy[`paciente.${field}`]
        return copy
      })
    }
  }

  // Cambios en tutor
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

  // Cambios en pago
  const handlePagoChange = (field, value) => {
    setPagoForm((prev) => ({ ...prev, [field]: value }))
    setIsDirty(true)
  }

  // Cambios en medicamentos
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

    const medsFiltrados = medicamentos.filter((m) => m.nombre && m.nombre.trim() !== '')

    const payload = {
      paciente: {
        nombre: pacienteForm.nombre.trim(),
        especie: pacienteForm.especie.trim(),
        raza: pacienteForm.raza.trim() || 'Criollo / Mestizo',
        sexo: pacienteForm.sexo,
        fecha_nacimiento: pacienteForm.fecha_nacimiento || null,
        edad_aproximada: pacienteForm.edad_aproximada ? Number(pacienteForm.edad_aproximada) : null,
        peso: pacienteForm.peso !== '' ? Number(pacienteForm.peso) : 12.0,
        alergias: pacienteForm.alergias.trim() || 'Ninguna registrada',
      },
      dueno: {
        nombre: duenoForm.nombre.trim(),
        telefono: duenoForm.telefono.trim(),
        cedula: duenoForm.cedula.trim(),
        email: duenoForm.email.trim(),
      },
      pago: {
        metodo_pago: pagoForm.metodo_pago,
        estado_pago: pagoForm.estado_pago,
        monto: Number(pagoForm.monto) || 0,
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
          setErrorGlobal('Hay campos pendientes de corrección. Por favor revisa las advertencias marcadas en rojo.')
        } else {
          setErrorGlobal(data.message || 'Error al guardar la consulta médica.')
        }
        setSubmitting(false)
        return
      }

      setIsDirty(false)
      setSuccessMsg('¡Consulta clínica, receta médica y pago registrados con éxito!')
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

  const hasAlergias = pacienteForm.alergias &&
    pacienteForm.alergias.trim() !== '' &&
    pacienteForm.alergias.trim().toLowerCase() !== 'ninguna' &&
    pacienteForm.alergias.trim().toLowerCase() !== 'ninguna registrada'

  // Métodos de pago disponibles
  const metodosPago = [
    { id: 'Pago en línea', label: 'Pago en línea', icon: 'fa-solid fa-globe' },
    { id: 'Pago en sede - efectivo', label: 'En sede (Efectivo)', icon: 'fa-solid fa-money-bill-wave' },
    { id: 'Pago en sede - tarjeta/datáfono', label: 'En sede (Datáfono)', icon: 'fa-solid fa-credit-card' },
    { id: 'Transferencia', label: 'Transferencia', icon: 'fa-solid fa-building-columns' },
  ]

  return (
    <div className="dash hce-modern-bg">
      <SidebarVet />

      <main className="dash-main">
        <DashboardHeader
          title="Atención Médica Veterinaria"
          subtitle={`Historia Clínica Digital • Cita N° ${idCita}`}
          usuario={usuario}
          onUserUpdated={setUsuario}
        />

        <div className="hce-page-wrap">
          {/* ── BREADCRUMB ── */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
            <button
              type="button"
              onClick={() => handleSafeNavigate('/veterinario/citas')}
              className="hce-modern-breadcrumb"
            >
              <i className="fa-solid fa-arrow-left"></i>
              <span>Citas / Atender cita N° {idCita}</span>
            </button>

            {isAtendida && (
              <span className="vet-badge vet-badge--atendida" style={{ borderRadius: '20px', padding: '0.45rem 1rem' }}>
                <i className="fa-solid fa-circle-check"></i> Consulta Finalizada
              </span>
            )}
          </div>

          {/* ── ALERTAS GLOBALES ── */}
          {errorGlobal && (
            <div className="dash-alert dash-alert--danger" style={{ borderRadius: '12px', margin: 0 }}>
              <i className="fa-solid fa-triangle-exclamation"></i>
              <span>{errorGlobal}</span>
            </div>
          )}

          {successMsg && (
            <div
              className="dash-alert dash-alert--success"
              style={{
                borderRadius: '12px',
                margin: 0,
                background: '#ecfdf5',
                color: '#047857',
                border: '1.5px solid #a7f3d0',
                padding: '0.9rem 1.25rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                boxShadow: '0 4px 12px rgba(5, 150, 105, 0.12)'
              }}
            >
              <i className="fa-solid fa-circle-check" style={{ fontSize: '1.25rem' }}></i>
              <strong style={{ fontFamily: 'Inter, sans-serif' }}>{successMsg}</strong>
            </div>
          )}

          {loading ? (
            <div className="vet-loading-box" style={{ borderRadius: '16px', background: '#ffffff', padding: '3.5rem 1rem' }}>
              <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: '2rem', color: '#0d9488' }}></i>
              <p style={{ marginTop: '0.75rem', fontWeight: 600, color: '#334155' }}>Cargando expediente clínico del paciente...</p>
            </div>
          ) : !cita ? (
            <div className="vet-empty-box" style={{ borderRadius: '16px', background: '#ffffff' }}>
              <i className="fa-solid fa-circle-exclamation" style={{ fontSize: '2.5rem', color: '#f59e0b' }}></i>
              <h3>Cita no disponible</h3>
              <p>La cita solicitada no existe o no cuentas con los permisos para acceder.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

              {/* ── HERO BANNER DEL PACIENTE ── */}
              <div className="hce-hero-card">
                <div className="hce-hero-left">
                  <div className="hce-hero-avatar-wrap">
                    <img
                      src={cita.paciente?.foto || 'https://res.cloudinary.com/dedroug6v/image/upload/v1783709702/golden_retriever_sonriendo_e1mrkw.jpg'}
                      alt={pacienteForm.nombre || 'Paciente'}
                      className="hce-hero-avatar"
                    />
                  </div>

                  <div className="hce-hero-info">
                    <div className="hce-hero-title-row">
                      <h2 className="hce-hero-name">{pacienteForm.nombre || 'Paciente sin nombre'}</h2>
                      <span className="hce-hero-chip" style={{ background: 'rgba(255,255,255,0.3)' }}>
                        <i className="fa-solid fa-shield-cat"></i> Paciente Activo
                      </span>
                    </div>

                    <div className="hce-hero-chips">
                      <span className="hce-hero-chip">
                        <i className="fa-solid fa-paw"></i> {pacienteForm.especie}
                      </span>
                      <span className="hce-hero-chip">
                        <i className="fa-solid fa-dna"></i> {pacienteForm.raza || 'Criollo / Mestizo'}
                      </span>
                      <span className="hce-hero-chip">
                        <i className="fa-solid fa-venus-mars"></i> {pacienteForm.sexo}
                      </span>
                      <span className="hce-hero-chip">
                        <i className="fa-regular fa-clock"></i> {pacienteForm.edad_aproximada ? `${pacienteForm.edad_aproximada} años aprox.` : '16 años aprox.'}
                      </span>
                      <span className="hce-hero-chip">
                        <i className="fa-solid fa-weight-scale"></i> {pacienteForm.peso ? `${pacienteForm.peso} kg` : '12.00 kg'}
                      </span>

                      {/* Chip visible de alerta por alergias */}
                      {hasAlergias && (
                        <span className="hce-hero-chip hce-hero-chip--allergy">
                          <i className="fa-solid fa-triangle-exclamation"></i>
                          <span>ALERGIAS: {pacienteForm.alergias}</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="hce-hero-right">
                  <div className="hce-hero-meta-box">
                    <span className="hce-hero-meta-title">Cita Médica N° #{idCita}</span>
                    <span className="hce-hero-meta-sub">
                      <i className="fa-solid fa-stethoscope"></i> {cita.servicio?.nombre || 'Consulta General'}
                    </span>
                    <span className="hce-hero-meta-sub">
                      <i className="fa-regular fa-calendar-check"></i> {cita.fecha_formateada} ({cita.hora})
                    </span>
                  </div>
                </div>
              </div>

              {/* ── SECCIÓN 1: PACIENTE (TEAL) ── */}
              <div className="hce-section-card hce-card--teal">
                <div className="hce-card-header-styled">
                  <div className="hce-card-header-left">
                    <div className="hce-section-icon-badge hce-icon-badge--teal">
                      <i className="fa-solid fa-paw"></i>
                    </div>
                    <div className="hce-card-header-text">
                      <h3>Información del Paciente</h3>
                      <p>Datos biométricos y de identificación de la mascota</p>
                    </div>
                  </div>
                </div>

                <div className="hce-grid-3">
                  <div className="hce-field-group">
                    <label className="hce-field-label" htmlFor="paciente-nombre">
                      Nombre de la mascota *
                    </label>
                    <div className="hce-input-wrapper">
                      <i className="fa-solid fa-tag hce-input-icon"></i>
                      <input
                        id="paciente-nombre"
                        type="text"
                        className={`hce-form-input hce-form-input--has-icon ${fieldErrors['paciente.nombre'] ? 'hce-form-input--error' : ''}`}
                        value={pacienteForm.nombre}
                        onChange={(e) => handlePacienteChange('nombre', e.target.value)}
                        disabled={submitting || isAtendida}
                        placeholder="Nombre de la mascota"
                      />
                    </div>
                    {fieldErrors['paciente.nombre'] && (
                      <span className="hce-input-error-msg"><i className="fa-solid fa-circle-exclamation"></i> {fieldErrors['paciente.nombre'][0]}</span>
                    )}
                  </div>

                  <div className="hce-field-group">
                    <label className="hce-field-label" htmlFor="paciente-especie">
                      Especie *
                    </label>
                    <div className="hce-input-wrapper">
                      <i className="fa-solid fa-paw hce-input-icon"></i>
                      <input
                        id="paciente-especie"
                        type="text"
                        className={`hce-form-input hce-form-input--has-icon ${fieldErrors['paciente.especie'] ? 'hce-form-input--error' : ''}`}
                        value={pacienteForm.especie}
                        onChange={(e) => handlePacienteChange('especie', e.target.value)}
                        disabled={submitting || isAtendida}
                        placeholder="Canino, Felino..."
                      />
                    </div>
                    {fieldErrors['paciente.especie'] && (
                      <span className="hce-input-error-msg"><i className="fa-solid fa-circle-exclamation"></i> {fieldErrors['paciente.especie'][0]}</span>
                    )}
                  </div>

                  <div className="hce-field-group">
                    <label className="hce-field-label" htmlFor="paciente-raza">
                      Raza
                    </label>
                    <div className="hce-input-wrapper">
                      <i className="fa-solid fa-dna hce-input-icon"></i>
                      <input
                        id="paciente-raza"
                        type="text"
                        className={`hce-form-input hce-form-input--has-icon ${fieldErrors['paciente.raza'] ? 'hce-form-input--error' : ''}`}
                        value={pacienteForm.raza}
                        onChange={(e) => handlePacienteChange('raza', e.target.value)}
                        disabled={submitting || isAtendida}
                        placeholder="Criollo / Mestizo o raza"
                      />
                    </div>
                    {fieldErrors['paciente.raza'] && (
                      <span className="hce-input-error-msg"><i className="fa-solid fa-circle-exclamation"></i> {fieldErrors['paciente.raza'][0]}</span>
                    )}
                  </div>

                  <div className="hce-field-group">
                    <label className="hce-field-label" htmlFor="paciente-sexo">
                      Sexo *
                    </label>
                    <div className="hce-input-wrapper">
                      <i className="fa-solid fa-venus-mars hce-input-icon"></i>
                      <select
                        id="paciente-sexo"
                        className={`hce-form-select hce-form-input--has-icon ${fieldErrors['paciente.sexo'] ? 'hce-form-select--error' : ''}`}
                        value={pacienteForm.sexo}
                        onChange={(e) => handlePacienteChange('sexo', e.target.value)}
                        disabled={submitting || isAtendida}
                      >
                        <option value="Macho">Macho</option>
                        <option value="Hembra">Hembra</option>
                      </select>
                    </div>
                    {fieldErrors['paciente.sexo'] && (
                      <span className="hce-input-error-msg"><i className="fa-solid fa-circle-exclamation"></i> {fieldErrors['paciente.sexo'][0]}</span>
                    )}
                  </div>

                  <div className="hce-field-group">
                    <label className="hce-field-label" htmlFor="paciente-edad-aprox">
                      Edad aproximada (Años)
                    </label>
                    <div className="hce-input-wrapper">
                      <i className="fa-regular fa-clock hce-input-icon"></i>
                      <input
                        id="paciente-edad-aprox"
                        type="number"
                        min="0"
                        max="35"
                        className="hce-form-input hce-form-input--has-icon"
                        value={pacienteForm.edad_aproximada}
                        onChange={(e) => handlePacienteChange('edad_aproximada', e.target.value)}
                        disabled={submitting || isAtendida}
                        placeholder="Ej: 16"
                      />
                    </div>
                  </div>

                  <div className="hce-field-group">
                    <label className="hce-field-label" htmlFor="paciente-fecha-nacimiento">
                      Fecha de nacimiento
                    </label>
                    <div className="hce-input-wrapper">
                      <i className="fa-regular fa-calendar hce-input-icon"></i>
                      <input
                        id="paciente-fecha-nacimiento"
                        type="date"
                        className={`hce-form-input hce-form-input--has-icon ${fieldErrors['paciente.fecha_nacimiento'] ? 'hce-form-input--error' : ''}`}
                        value={pacienteForm.fecha_nacimiento}
                        onChange={(e) => handlePacienteChange('fecha_nacimiento', e.target.value)}
                        disabled={submitting || isAtendida}
                      />
                    </div>
                    {fieldErrors['paciente.fecha_nacimiento'] && (
                      <span className="hce-input-error-msg"><i className="fa-solid fa-circle-exclamation"></i> {fieldErrors['paciente.fecha_nacimiento'][0]}</span>
                    )}
                  </div>

                  <div className="hce-field-group">
                    <label className="hce-field-label" htmlFor="paciente-peso">
                      Peso actual (kg) *
                    </label>
                    <div className="hce-input-wrapper">
                      <i className="fa-solid fa-weight-scale hce-input-icon"></i>
                      <input
                        id="paciente-peso"
                        type="number"
                        step="0.01"
                        min="0.1"
                        max="250"
                        className={`hce-form-input hce-form-input--has-icon ${fieldErrors['paciente.peso'] ? 'hce-form-input--error' : ''}`}
                        value={pacienteForm.peso}
                        onChange={(e) => handlePacienteChange('peso', e.target.value)}
                        disabled={submitting || isAtendida}
                        placeholder="Ej: 12.00"
                      />
                    </div>
                    {fieldErrors['paciente.peso'] && (
                      <span className="hce-input-error-msg"><i className="fa-solid fa-circle-exclamation"></i> {fieldErrors['paciente.peso'][0]}</span>
                    )}
                  </div>

                  <div className="hce-field-group hce-col-span-2">
                    <label className="hce-field-label" htmlFor="paciente-alergias">
                      Alergias o sensibilidades conocidas
                    </label>
                    <div className="hce-input-wrapper">
                      <i className="fa-solid fa-triangle-exclamation hce-input-icon"></i>
                      <input
                        id="paciente-alergias"
                        type="text"
                        className={`hce-form-input hce-form-input--has-icon ${fieldErrors['paciente.alergias'] ? 'hce-form-input--error' : ''}`}
                        value={pacienteForm.alergias}
                        onChange={(e) => handlePacienteChange('alergias', e.target.value)}
                        disabled={submitting || isAtendida}
                        placeholder="Ej: Alergia a la penicilina, intolerancia alimentaria al pollo..."
                      />
                    </div>
                    {fieldErrors['paciente.alergias'] && (
                      <span className="hce-input-error-msg"><i className="fa-solid fa-circle-exclamation"></i> {fieldErrors['paciente.alergias'][0]}</span>
                    )}
                  </div>
                </div>
              </div>

              {/* ── SECCIÓN 2: TUTOR (AZUL) ── */}
              <div className="hce-section-card hce-card--blue">
                <div className="hce-card-header-styled">
                  <div className="hce-card-header-left">
                    <div className="hce-section-icon-badge hce-icon-badge--blue">
                      <i className="fa-solid fa-user-shield"></i>
                    </div>
                    <div className="hce-card-header-text">
                      <h3>Información del Tutor</h3>
                      <p>Titular de la cuenta y contacto directo del paciente</p>
                    </div>
                  </div>
                </div>

                <div className="hce-grid-2">
                  <div className="hce-field-group">
                    <label className="hce-field-label" htmlFor="dueno-nombre">
                      Nombres y Apellidos *
                    </label>
                    <div className="hce-input-wrapper">
                      <i className="fa-solid fa-user hce-input-icon"></i>
                      <input
                        id="dueno-nombre"
                        type="text"
                        className={`hce-form-input hce-form-input--has-icon ${fieldErrors['dueno.nombre'] ? 'hce-form-input--error' : ''}`}
                        value={duenoForm.nombre}
                        onChange={(e) => handleDuenoChange('nombre', e.target.value)}
                        disabled={submitting || isAtendida}
                        placeholder="Nombre completo del tutor"
                      />
                    </div>
                    {fieldErrors['dueno.nombre'] && (
                      <span className="hce-input-error-msg"><i className="fa-solid fa-circle-exclamation"></i> {fieldErrors['dueno.nombre'][0]}</span>
                    )}
                  </div>

                  <div className="hce-field-group">
                    <label className="hce-field-label" htmlFor="dueno-cedula">
                      Cédula / Documento de Identidad *
                    </label>
                    <div className="hce-input-wrapper">
                      <i className="fa-solid fa-id-card hce-input-icon"></i>
                      <input
                        id="dueno-cedula"
                        type="text"
                        className={`hce-form-input hce-form-input--has-icon ${fieldErrors['dueno.cedula'] ? 'hce-form-input--error' : ''}`}
                        value={duenoForm.cedula}
                        onChange={(e) => handleDuenoChange('cedula', e.target.value)}
                        disabled={submitting || isAtendida}
                        placeholder="Número de documento"
                      />
                    </div>
                    {fieldErrors['dueno.cedula'] && (
                      <span className="hce-input-error-msg"><i className="fa-solid fa-circle-exclamation"></i> {fieldErrors['dueno.cedula'][0]}</span>
                    )}
                  </div>

                  <div className="hce-field-group">
                    <label className="hce-field-label" htmlFor="dueno-telefono">
                      Teléfono de contacto *
                    </label>
                    <div className="hce-input-wrapper">
                      <i className="fa-solid fa-phone hce-input-icon"></i>
                      <input
                        id="dueno-telefono"
                        type="text"
                        className={`hce-form-input hce-form-input--has-icon ${fieldErrors['dueno.telefono'] ? 'hce-form-input--error' : ''}`}
                        value={duenoForm.telefono}
                        onChange={(e) => handleDuenoChange('telefono', e.target.value)}
                        disabled={submitting || isAtendida}
                        placeholder="Ej: 3245724090"
                      />
                    </div>
                    {fieldErrors['dueno.telefono'] && (
                      <span className="hce-input-error-msg"><i className="fa-solid fa-circle-exclamation"></i> {fieldErrors['dueno.telefono'][0]}</span>
                    )}
                  </div>

                  <div className="hce-field-group">
                    <label className="hce-field-label" htmlFor="dueno-email">
                      Correo Electrónico *
                    </label>
                    <div className="hce-input-wrapper">
                      <i className="fa-solid fa-envelope hce-input-icon"></i>
                      <input
                        id="dueno-email"
                        type="email"
                        className={`hce-form-input hce-form-input--has-icon ${fieldErrors['dueno.email'] ? 'hce-form-input--error' : ''}`}
                        value={duenoForm.email}
                        onChange={(e) => handleDuenoChange('email', e.target.value)}
                        disabled={submitting || isAtendida}
                        placeholder="correo@ejemplo.com"
                      />
                    </div>
                    {fieldErrors['dueno.email'] && (
                      <span className="hce-input-error-msg"><i className="fa-solid fa-circle-exclamation"></i> {fieldErrors['dueno.email'][0]}</span>
                    )}
                  </div>
                </div>
              </div>

              {/* ── SECCIÓN 3: PAGO DE LA CONSULTA (ÁMBAR) ── */}
              <div className="hce-section-card hce-card--amber">
                <div className="hce-card-header-styled">
                  <div className="hce-card-header-left">
                    <div className="hce-section-icon-badge hce-icon-badge--amber">
                      <i className="fa-solid fa-receipt"></i>
                    </div>
                    <div className="hce-card-header-text">
                      <h3>Pago de la Consulta</h3>
                      <p>Método seleccionado, estado del cobro y monto del servicio</p>
                    </div>
                  </div>
                </div>

                {/* Tarjetas seleccionables de método de pago */}
                <div style={{ marginBottom: '0.65rem' }}>
                  <label className="hce-field-label" style={{ marginBottom: '0.5rem' }}>
                    Método de Pago:
                  </label>
                  <div className="hce-payment-methods-grid">
                    {metodosPago.map((m) => {
                      const isSelected = pagoForm.metodo_pago === m.id
                      return (
                        <div
                          key={m.id}
                          className={`hce-payment-card-option ${isSelected ? 'hce-payment-card-option--selected' : ''}`}
                          onClick={() => !isAtendida && handlePagoChange('metodo_pago', m.id)}
                        >
                          {isSelected && (
                            <i className="fa-solid fa-circle-check hce-payment-card-check"></i>
                          )}
                          <i className={`${m.icon} hce-payment-card-icon`}></i>
                          <span className="hce-payment-card-label">{m.label}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Fila de Estado de Pago y Monto */}
                <div className="hce-payment-status-row">
                  <div>
                    <label className="hce-field-label" style={{ marginBottom: '0.45rem' }}>
                      Estado del Pago:
                    </label>
                    <div className="hce-payment-status-chips">
                      <button
                        type="button"
                        className={`hce-status-chip-btn ${pagoForm.estado_pago === 'pagado' ? 'hce-status-chip-btn--pagado-active' : ''}`}
                        onClick={() => !isAtendida && handlePagoChange('estado_pago', 'pagado')}
                      >
                        <i className="fa-solid fa-circle-check"></i> Pagado
                      </button>

                      <button
                        type="button"
                        className={`hce-status-chip-btn ${pagoForm.estado_pago === 'pendiente' ? 'hce-status-chip-btn--pendiente-active' : ''}`}
                        onClick={() => !isAtendida && handlePagoChange('estado_pago', 'pendiente')}
                      >
                        <i className="fa-solid fa-clock"></i> Pendiente
                      </button>
                    </div>
                  </div>

                  <div style={{ minWidth: '220px' }}>
                    <label className="hce-field-label" htmlFor="pago-monto" style={{ marginBottom: '0.45rem' }}>
                      Valor de la Consulta (COP):
                    </label>
                    <div className="hce-input-wrapper">
                      <i className="fa-solid fa-dollar-sign hce-input-icon"></i>
                      <input
                        id="pago-monto"
                        type="number"
                        className="hce-form-input hce-form-input--has-icon"
                        value={pagoForm.monto}
                        onChange={(e) => handlePagoChange('monto', e.target.value)}
                        disabled={submitting || isAtendida}
                        placeholder="35000"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* ── SECCIÓN 4: OBSERVACIONES CLÍNICAS (VIOLETA) ── */}
              <div className="hce-section-card hce-card--purple">
                <div className="hce-card-header-styled">
                  <div className="hce-card-header-left">
                    <div className="hce-section-icon-badge hce-icon-badge--purple">
                      <i className="fa-solid fa-stethoscope"></i>
                    </div>
                    <div className="hce-card-header-text">
                      <h3>Observaciones Clínicas y Diagnóstico</h3>
                      <p>Dictamen veterinario, signos observados y plan médico terapéutico</p>
                    </div>
                  </div>
                </div>

                <div className="hce-field-group">
                  <textarea
                    rows={5}
                    id="consulta-observacion"
                    className={`hce-form-textarea ${fieldErrors['observacion'] ? 'hce-form-textarea--error' : ''}`}
                    value={observacion}
                    onChange={(e) => handleObservacionChange(e.target.value)}
                    placeholder="Describe hallazgos clínicos, signos observados, constantes vitales, diagnóstico presuntivo o definitivo y recomendaciones médicas..."
                    disabled={submitting || isAtendida}
                    style={{ resize: 'vertical', lineHeight: '1.6' }}
                  />
                  {fieldErrors['observacion'] && (
                    <span className="hce-input-error-msg"><i className="fa-solid fa-circle-exclamation"></i> {fieldErrors['observacion'][0]}</span>
                  )}
                </div>
              </div>

              {/* ── SECCIÓN 5: MEDICAMENTOS RECETADOS (ESMERALDA) ── */}
              <div className="hce-section-card hce-card--emerald">
                <div className="hce-card-header-styled">
                  <div className="hce-card-header-left">
                    <div className="hce-section-icon-badge hce-icon-badge--emerald">
                      <i className="fa-solid fa-pills"></i>
                    </div>
                    <div className="hce-card-header-text">
                      <h3>Medicamentos Prescritos (Fórmula Médica)</h3>
                      <p>Prescripción oficial visible en el portal del tutor y en el PDF de receta</p>
                    </div>
                  </div>
                </div>

                <div className="hce-meds-table-container">
                  <table className="hce-modern-table">
                    <thead>
                      <tr>
                        <th style={{ width: '32%' }}>Nombre del Medicamento</th>
                        <th style={{ width: '30%' }}>Dosis y Frecuencia</th>
                        <th style={{ width: '32%' }}>Indicaciones Especiales</th>
                        <th style={{ width: '6%', textAlign: 'center' }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {medicamentos.length === 0 ? (
                        <tr>
                          <td colSpan={4} style={{ textAlign: 'center', color: '#94a3b8', padding: '1.5rem' }}>
                            Sin medicamentos formulados. Haz clic en "+ Agregar Medicamento" si necesitas prescribir fármacos.
                          </td>
                        </tr>
                      ) : (
                        medicamentos.map((med, idx) => (
                          <tr key={idx} className="hce-table-animated-row">
                            <td>
                              <input
                                type="text"
                                className="hce-table-inline-input"
                                placeholder="Ej: Amoxicilina 250mg"
                                value={med.nombre}
                                onChange={(e) => handleMedicamentoChange(idx, 'nombre', e.target.value)}
                                disabled={submitting || isAtendida}
                              />
                            </td>
                            <td>
                              <input
                                type="text"
                                className="hce-table-inline-input"
                                placeholder="Ej: 1 tab cada 12h por 7 días"
                                value={med.dosis}
                                onChange={(e) => handleMedicamentoChange(idx, 'dosis', e.target.value)}
                                disabled={submitting || isAtendida}
                              />
                            </td>
                            <td>
                              <input
                                type="text"
                                className="hce-table-inline-input"
                                placeholder="Ej: Administrar con alimento húmedo"
                                value={med.indicaciones}
                                onChange={(e) => handleMedicamentoChange(idx, 'indicaciones', e.target.value)}
                                disabled={submitting || isAtendida}
                              />
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              <button
                                type="button"
                                className="hce-btn-delete-circle"
                                onClick={() => handleRemoveMedicamento(idx)}
                                disabled={submitting || isAtendida || medicamentos.length === 1}
                                title="Eliminar medicamento"
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
                    className="hce-btn-add-med"
                  >
                    <i className="fa-solid fa-plus"></i>
                    <span>Agregar Medicamento</span>
                  </button>
                )}
              </div>

              {/* ── BARRA DE ACCIONES FIJA INFERIOR ── */}
              <div className="hce-sticky-action-bar">
                <div className="hce-bar-content">
                  <button
                    type="button"
                    onClick={() => handleSafeNavigate('/veterinario/citas')}
                    className="hce-btn-cancel-outline"
                    disabled={submitting}
                  >
                    Cancelar
                  </button>

                  {!isAtendida ? (
                    <button
                      type="submit"
                      disabled={submitting}
                      className="hce-btn-submit-primary"
                    >
                      {submitting ? (
                        <>
                          <i className="fa-solid fa-spinner fa-spin"></i>
                          <span>Guardando consulta...</span>
                        </>
                      ) : (
                        <>
                          <i className="fa-solid fa-check"></i>
                          <span>Finalizar Consulta y Guardar Receta</span>
                        </>
                      )}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => navigate('/veterinario/citas')}
                      className="hce-btn-submit-primary"
                    >
                      <i className="fa-solid fa-arrow-left"></i>
                      <span>Volver a Citas</span>
                    </button>
                  )}
                </div>
              </div>

            </form>
          )}
        </div>
      </main>
    </div>
  )
}
