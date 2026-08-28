// src/components/pages/AgendarCitaFlow.jsx
import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import SidebarClient from '../ui/SidebarClient'
import DashboardHeader from '../ui/DashboardHeader'
import { RAZAS_POR_ESPECIE } from '../../data/razasPorEspecie'
import { veterinariosData, normalizarEspecialidad } from '../../data/veterinariosData'
import './AgendarCitaFlow.css'
import './DashboardClient.css'
import './MisMascotas.css'

// Mapeo de Servicios a Especialidades
// Ajustado a las especialidades REALES que existen hoy en la tabla `especialidad`:
// Medicina General, Cirugía, Dermatología, Odontología, Cardiología, Oftalmología.
// Si en el futuro agregas nuevas especialidades (Urgencias, Vacunación, etc.) a la BD,
// solo hay que sumarlas aquí.
const SERVICE_SPECIALTY_MAP = {
  'Consulta General': ['Medicina General', 'Consulta General'],
  'Consulta Especializada': ['Medicina General', 'Cirugía', 'Dermatología', 'Odontología', 'Cardiología', 'Oftalmología'],
  'Vacunación': ['Medicina General'],
  'Desparasitación': ['Medicina General'],
  'Cirugía Minor/Mayor': ['Cirugía'],
  'Cirugía': ['Cirugía'],
  'Exámenes de Laboratorio': ['Medicina General'],
  'Exámenes': ['Medicina General'],
  'Odontología': ['Odontología'],
  'Dermatología': ['Dermatología'],
  'Cardiología': ['Cardiología'],
  'Oftalmología': ['Oftalmología'],
}

function AgendarCitaFlow() {
  const navigate = useNavigate()

  // Pasos: 1 = Agendar | 2 = Pagar | 3 = Confirmación
  const [step, setStep] = useState(1)

  // Datos base
  const [usuario, setUsuario] = useState({ nombre: '', foto: '' })
  const [mascotas, setMascotas] = useState([])
  const [servicios, setServicios] = useState([])
  const [veterinarios, setVeterinarios] = useState(veterinariosData)

  // Selecciones del usuario
  const [selectedPet, setSelectedPet] = useState(null)
  const [selectedService, setSelectedService] = useState(null)
  const [selectedVet, setSelectedVet] = useState(null)
  const [specialtyFilter, setSpecialtyFilter] = useState('Todas')

  // Calendario Real Estado (Fecha actual)
  const today = new Date()
  const [currentYear, setCurrentYear] = useState(today.getFullYear())
  const [currentMonth, setCurrentMonth] = useState(today.getMonth())
  const [selectedDate, setSelectedDate] = useState(today.toISOString().split('T')[0])
  const [selectedTime, setSelectedTime] = useState('10:30 AM')
  const [observacion, setObservacion] = useState('')

  // Disponibilidad de horarios
  const [horariosDisponibles, setHorariosDisponibles] = useState([])
  const [loadingHorarios, setLoadingHorarios] = useState(false)

  // Reserva temporal & Concurrencia
  const [tokenReserva, setTokenReserva] = useState(null)
  const [timerSeconds, setTimerSeconds] = useState(600) // 10 minutos
  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  // Formulario de Pago en Paso 2
  const [paymentMethod, setPaymentMethod] = useState('card')
  const [cardForm, setCardForm] = useState({
    titular: '',
    numero: '',
    expiracion: '',
    cvv: '',
    guardar: true,
  })

  // Cita confirmada para el Paso 3
  const [confirmedCita, setConfirmedCita] = useState(null)

  // Modales adicionales
  const [showPetModal, setShowPetModal] = useState(false)
  const [showReceiptModal, setShowReceiptModal] = useState(false)

  // Formulario rápido para crear mascota
  const [newPetForm, setNewPetForm] = useState({
    nombre: '',
    especie: 'Canino',
    raza: 'Criollo/Mestizo',
    sexo: 'Macho',
    fecha_nacimiento: '',
    peso: '',
  })
  const [savingPet, setSavingPet] = useState(false)
  const [petModalError, setPetModalError] = useState('')

  // Cargar datos iniciales desde el Backend
  useEffect(() => {
    const loadInitialData = async () => {
      const token = localStorage.getItem('token')
      if (!token) {
        navigate('/login')
        return
      }

      try {
        // 1. Perfil
        const resUser = await fetch(`${import.meta.env.VITE_API_URL}/me`, {
          headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
        })
        if (resUser.ok) {
          const uData = await resUser.json()
          setUsuario(uData)
          if (!cardForm.titular && uData.nombreCompleto) {
            setCardForm((prev) => ({ ...prev, titular: uData.nombreCompleto }))
          }
        }

        // 2. Mascotas
        const resPets = await fetch(`${import.meta.env.VITE_API_URL}/mascotas`, {
          headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
        })
        if (resPets.ok) {
          const pData = await resPets.json()
          setMascotas(pData)
          if (pData.length > 0) setSelectedPet(pData[0])
        }

        // 3. Servicios
        const resSrv = await fetch(`${import.meta.env.VITE_API_URL}/servicios`, {
          headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
        })
        if (resSrv.ok) {
          const sData = await resSrv.json()
          setServicios(sData)
          if (sData.length > 0) setSelectedService(sData[0])
        }

        // 4. Veterinarios
        // El roster completo del equipo (veterinariosData) sirve como respaldo/complemento
        // para que el filtro de especialidades siempre muestre a TODOS los especialistas,
        // incluso si la BD todavía no tiene registrados a todos.
        const resVets = await fetch(`${import.meta.env.VITE_API_URL}/agendar/veterinarios`, {
          headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
        })
        if (resVets.ok) {
          const vDataRaw = await resVets.json()
          if (Array.isArray(vDataRaw) && vDataRaw.length > 0) {
            // Normaliza variantes de escritura de especialidad que puedan venir
            // de la BD (ej. "Medicina general" / "Médico General" / "Dermatólogo")
            // para que el filtro nunca muestre la misma especialidad duplicada.
            const vData = vDataRaw.map((v) => ({
              ...v,
              especialidad: normalizarEspecialidad(v.especialidad),
            }))
            // Combina lo que responde la API con el resto del equipo que no
            // esté ya incluido (evita duplicados comparando por nombre).
            const combinados = [
              ...vData,
              ...veterinariosData.filter(
                (local) => !vData.some((v) => v.nombre === local.nombre)
              ),
            ]
            setVeterinarios(combinados)
            setSelectedVet(combinados[0])
          } else {
            setVeterinarios(veterinariosData)
            setSelectedVet(veterinariosData[0])
          }
        } else {
          // Si la API falla, usamos el roster local completo como respaldo
          setVeterinarios(veterinariosData)
          setSelectedVet(veterinariosData[0])
        }
      } catch (err) {
        console.error('Error al cargar datos iniciales:', err)
        setVeterinarios(veterinariosData)
        setSelectedVet(veterinariosData[0])
      }
    }

    loadInitialData()
  }, [])

  // Al seleccionar servicio, filtrar médicos por la especialidad asociada
  const handleSelectService = (service) => {
    setSelectedService(service)
    const expectedSpecs = SERVICE_SPECIALTY_MAP[service.nombre] || [service.nombre]

    // Buscar si existe un médico de esa especialidad en BD
    const matchingVet = veterinarios.find((v) =>
      expectedSpecs.some((spec) => v.especialidad.toLowerCase().includes(spec.toLowerCase()) || spec.toLowerCase().includes(v.especialidad.toLowerCase()))
    )

    if (matchingVet) {
      setSpecialtyFilter(matchingVet.especialidad)
      setSelectedVet(matchingVet)
    } else {
      setSpecialtyFilter('Todas')
    }
  }

  // Cargar horarios disponibles cuando cambia el veterinario o la fecha
  useEffect(() => {
    if (!selectedVet || !selectedDate) return

    const fetchHorarios = async () => {
      const token = localStorage.getItem('token')
      try {
        setLoadingHorarios(true)
        const res = await fetch(
          `${import.meta.env.VITE_API_URL}/agendar/horarios-disponibles?id_veterinario=${selectedVet.id}&fecha=${selectedDate}`,
          {
            headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
          }
        )
        if (res.ok) {
          const data = await res.json()
          setHorariosDisponibles(data.disponibles || [])
          if (data.disponibles.length > 0 && !data.disponibles.includes(selectedTime)) {
            setSelectedTime(data.disponibles[0])
          }
        }
      } catch (err) {
        console.error('Error al cargar horarios:', err)
      } finally {
        setLoadingHorarios(false)
      }
    }

    fetchHorarios()
  }, [selectedVet, selectedDate])

  // Contador regresivo para la reserva de 10 minutos (Paso 2)
  useEffect(() => {
    let timer = null
    if (step === 2 && timerSeconds > 0) {
      timer = setInterval(() => {
        setTimerSeconds((prev) => prev - 1)
      }, 1000)
    } else if (step === 2 && timerSeconds === 0) {
      setErrorMsg('El tiempo de reserva ha expirado. Por favor selecciona nuevamente tu horario.')
      handleCancelarReserva()
    }

    return () => clearInterval(timer)
  }, [step, timerSeconds])

  // Reservar Slot temporalmente y pasar al Paso 2
  const handleProceedToPayment = async () => {
    setErrorMsg('')
    if (!selectedPet) {
      setErrorMsg('Debes seleccionar una mascota.')
      return
    }
    if (!selectedService) {
      setErrorMsg('Debes seleccionar un servicio.')
      return
    }
    if (!selectedVet) {
      setErrorMsg('Debes seleccionar un médico veterinario.')
      return
    }
    if (!selectedDate || !selectedTime) {
      setErrorMsg('Debes seleccionar un día y un horario disponible.')
      return
    }

    const token = localStorage.getItem('token')
    try {
      setSubmitting(true)
      const res = await fetch(`${import.meta.env.VITE_API_URL}/agendar/reservar-slot`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
        body: JSON.stringify({
          id_veterinario: selectedVet.id,
          fecha: selectedDate,
          hora: selectedTime,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        setErrorMsg(data.message || 'No se pudo reservar el horario.')
        return
      }

      setTokenReserva(data.token_reserva)
      setTimerSeconds(600)
      setStep(2)
    } catch (err) {
      console.error('Error al reservar slot:', err)
      setErrorMsg('Error de conexión al reservar el horario.')
    } finally {
      setSubmitting(false)
    }
  }

  // Liberar reserva temporal y volver al Paso 1
  const handleCancelarReserva = async () => {
    if (tokenReserva) {
      const token = localStorage.getItem('token')
      try {
        await fetch(`${import.meta.env.VITE_API_URL}/agendar/liberar-reserva`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
          },
          body: JSON.stringify({ token_reserva: tokenReserva }),
        })
      } catch (err) {
        console.error(err)
      }
    }
    setTokenReserva(null)
    setStep(1)
  }

  // Confirmar Pago en Paso 2 y avanzar a Confirmación (Paso 3)
  const handleConfirmarPago = async (e) => {
    e.preventDefault()
    setErrorMsg('')

    if (paymentMethod === 'card') {
      if (!cardForm.titular || !cardForm.numero || !cardForm.expiracion || !cardForm.cvv) {
        setErrorMsg('Por favor completa todos los campos del formulario de tarjeta.')
        return
      }
    }

    const token = localStorage.getItem('token')
    try {
      setSubmitting(true)
      const res = await fetch(`${import.meta.env.VITE_API_URL}/agendar/confirmar-pago`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
        body: JSON.stringify({
          token_reserva: tokenReserva,
          id_mascota: selectedPet.id,
          id_servicio: selectedService.id_servicio,
          observacion: observacion,
          metodo_pago: paymentMethod,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        setErrorMsg(data.message || 'No se pudo procesar el pago.')
        if (res.status === 409 || res.status === 410) {
          setTimeout(() => {
            setStep(1)
          }, 3000)
        }
        return
      }

      setConfirmedCita(data.cita)
      setStep(3)
    } catch (err) {
      console.error('Error al confirmar pago:', err)
      setErrorMsg('Error de conexión al procesar el pago.')
    } finally {
      setSubmitting(false)
    }
  }

  // Crear nueva mascota desde modal de Paso 1
  const handleCreatePetSubmit = async (e) => {
    e.preventDefault()
    setPetModalError('')

    if (!newPetForm.nombre) {
      setPetModalError('El nombre de la mascota es obligatorio.')
      return
    }

    const token = localStorage.getItem('token')
    try {
      setSavingPet(true)
      const formData = new FormData()
      formData.append('nombre', newPetForm.nombre)
      formData.append('especie', newPetForm.especie)
      formData.append('raza', newPetForm.raza)
      formData.append('sexo', newPetForm.sexo)
      if (newPetForm.fecha_nacimiento) formData.append('fecha_nacimiento', newPetForm.fecha_nacimiento)
      if (newPetForm.peso) formData.append('peso', newPetForm.peso)

      const res = await fetch(`${import.meta.env.VITE_API_URL}/mascotas`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
        body: formData,
      })

      const data = await res.json()
      if (!res.ok) {
        setPetModalError(data.message || 'No se pudo guardar la mascota.')
        return
      }

      setShowPetModal(false)
      const resPets = await fetch(`${import.meta.env.VITE_API_URL}/mascotas`, {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      })
      if (resPets.ok) {
        const pData = await resPets.json()
        setMascotas(pData)
        if (data.mascota) setSelectedPet(data.mascota)
      }
    } catch (err) {
      console.error(err)
      setPetModalError('Error al conectar con el servidor.')
    } finally {
      setSavingPet(false)
    }
  }

  // Formatear precio en COP
  const formatCOP = (val) => {
    const num = parseInt(val || 70000)
    return `$${num.toLocaleString('es-CO')}`
  }

  // Formatear minutos y segundos
  const formatTimer = (sec) => {
    const mins = Math.floor(sec / 60)
    const remSec = sec % 60
    return `${mins.toString().padStart(2, '0')}:${remSec.toString().padStart(2, '0')} min`
  }

  // 1. Obtener TODAS las especialidades reales registradas (BD + roster local completo,
  // así el filtro siempre incluye a todos los especialistas del equipo).
  const especialidadesDisponibles = [
    'Todas',
    ...Array.from(
      new Set([
        ...veterinarios.map((v) => v.especialidad),
        ...veterinariosData.map((v) => v.especialidad),
      ])
    ).sort(),
  ]

  // Filtrado estricto de veterinarios por el dropdown de especialidad
  const filteredVets = veterinarios.filter((v) => {
    if (specialtyFilter !== 'Todas') {
      return v.especialidad.toLowerCase() === specialtyFilter.toLowerCase()
    }
    return true
  })

  // Nombres de meses en español
  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ]

  // 3. CALENDARIO MENSUAL REAL Y MATEMÁTICAMENTE EXACTO (Lun-Dom)
  const getDaysInMonth = (y, m) => new Date(y, m + 1, 0).getDate()
  const getFirstDayOfWeek = (y, m) => {
    const day = new Date(y, m, 1).getDay()
    return day === 0 ? 6 : day - 1 // Ajustar a Lunes = 0, Domingo = 6
  }

  const renderRealCalendar = () => {
    const totalDays = getDaysInMonth(currentYear, currentMonth)
    const startDay = getFirstDayOfWeek(currentYear, currentMonth)

    const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate())

    const cells = []
    // Celdas vacías para desfase del primer día
    for (let i = 0; i < startDay; i++) {
      cells.push(<div key={`empty-${i}`} className="agendar-cal-cell agendar-cal-cell--empty"></div>)
    }

    // Celdas de los días del mes
    for (let d = 1; d <= totalDays; d++) {
      const monthStr = String(currentMonth + 1).padStart(2, '0')
      const dayStr = String(d).padStart(2, '0')
      const fullDate = `${currentYear}-${monthStr}-${dayStr}`
      const isSelected = selectedDate === fullDate

      // Marcar domingos y días pasados como no disponibles
      const dayDate = new Date(currentYear, currentMonth, d)
      const isSunday = dayDate.getDay() === 0
      const isPast = dayDate < todayDate
      const isUnavailable = isSunday || isPast

      cells.push(
        <button
          key={fullDate}
          type="button"
          disabled={isUnavailable}
          className={`agendar-cal-cell ${isSelected ? 'agendar-cal-cell--selected' : ''} ${isUnavailable ? 'agendar-cal-cell--disabled' : ''}`}
          onClick={() => !isUnavailable && setSelectedDate(fullDate)}
          title={isUnavailable ? 'Día no disponible para consulta' : `Seleccionar ${d} de ${monthNames[currentMonth]}`}
        >
          {d}
        </button>
      )
    }

    return (
      <div className="agendar-real-cal">
        <div className="agendar-cal-header">
          <span>{monthNames[currentMonth]} {currentYear}</span>
          <div className="agendar-cal-arrows">
            <button
              type="button"
              onClick={() => {
                if (currentMonth === 0) {
                  setCurrentMonth(11)
                  setCurrentYear((prev) => prev - 1)
                } else {
                  setCurrentMonth((prev) => prev - 1)
                }
              }}
              title="Mes anterior"
            >
              <i className="fa-solid fa-chevron-left"></i>
            </button>
            <button
              type="button"
              onClick={() => {
                if (currentMonth === 11) {
                  setCurrentMonth(0)
                  setCurrentYear((prev) => prev + 1)
                } else {
                  setCurrentMonth((prev) => prev + 1)
                }
              }}
              title="Mes siguiente"
            >
              <i className="fa-solid fa-chevron-right"></i>
            </button>
          </div>
        </div>

        <div className="agendar-cal-weekdays">
          <span>Lun</span>
          <span>Mar</span>
          <span>Mié</span>
          <span>Jue</span>
          <span>Vie</span>
          <span>Sáb</span>
          <span>Dom</span>
        </div>

        <div className="agendar-cal-month-grid">
          {cells}
        </div>
      </div>
    )
  }

  // Formatear Fecha y Hora para el Resumen
  const formatSummaryDate = () => {
    if (!selectedDate) return 'Por elegir'
    const parts = selectedDate.split('-')
    if (parts.length === 3) {
      const monthShort = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'][parseInt(parts[1]) - 1]
      return `${monthShort} ${parts[2]}, ${selectedTime || ''}`
    }
    return `${selectedDate} ${selectedTime || ''}`
  }

  return (
    <div className="agendar-flow-page">
      <SidebarClient />

      <main className="agendar-flow-main">
        <div className="agendar-flow-inner">
          <DashboardHeader
            title="Programa tu Cita"
            subtitle="Completa los siguientes pasos para agendar tu cita"
            usuario={usuario}
            onUserUpdated={setUsuario}
          />

          {/* ── STEPPER DE PROGRESO ── */}
          <div className="agendar-stepper-box">
            <div className="agendar-stepper">
              <div className={`agendar-step-item ${step === 1 ? 'agendar-step-item--active' : step > 1 ? 'agendar-step-item--completed' : ''}`}>
                <div className="agendar-step-circle">{step > 1 ? <i className="fa-solid fa-check"></i> : '1'}</div>
                <span>Agendar</span>
              </div>

              <div style={{ flex: 1, height: '1px', background: step > 1 ? '#059669' : '#e2e8f0', margin: '0 0.5rem' }}></div>

              <div className={`agendar-step-item ${step === 2 ? 'agendar-step-item--active' : step > 2 ? 'agendar-step-item--completed' : ''}`}>
                <div className="agendar-step-circle">{step > 2 ? <i className="fa-solid fa-check"></i> : '2'}</div>
                <span>Pagar</span>
              </div>

              <div style={{ flex: 1, height: '1px', background: step > 2 ? '#059669' : '#e2e8f0', margin: '0 0.5rem' }}></div>

              <div className={`agendar-step-item ${step === 3 ? 'agendar-step-item--active' : ''}`}>
                <div className="agendar-step-circle">3</div>
                <span>Confirmación</span>
              </div>
            </div>
          </div>

          {/* ── ALERTA DE ERROR GENERAL ── */}
          {errorMsg && (
            <div className="dh-modal-alert dh-modal-alert--error" style={{ marginBottom: '1.25rem' }}>
              <i className="fa-solid fa-triangle-exclamation" style={{ marginRight: '0.5rem' }}></i>
              {errorMsg}
            </div>
          )}

          {/* ── PASO 1 Y PASO 2: LAYOUT COMPACTO DE 2 COLUMNAS ── */}
          {step < 3 ? (
            <div className="agendar-layout">
              {/* Columna Izquierda */}
              <div className="agendar-content-box">
                {step === 1 && (
                  <>
                    {/* 1. Selecciona tu Mascota */}
                    <h3 className="agendar-section-title">
                      <span className="agendar-section-num">1</span>
                      <span>Selecciona tu Mascota</span>
                    </h3>
                    <div className="agendar-pets-grid">
                      {mascotas.map((m) => (
                        <div
                          key={m.id}
                          className={`agendar-pet-card ${selectedPet?.id === m.id ? 'agendar-pet-card--selected' : ''}`}
                          onClick={() => setSelectedPet(m)}
                        >
                          {selectedPet?.id === m.id && (
                            <div className="agendar-pet-card__check">
                              <i className="fa-solid fa-check"></i>
                            </div>
                          )}
                          <img
                            src={m.foto || 'https://res.cloudinary.com/dedroug6v/image/upload/v1/mascotas/default_pet.jpg'}
                            alt={m.nombre}
                            className="agendar-pet-card__avatar"
                          />
                          <strong className="agendar-pet-card__name">{m.nombre}</strong>
                          <span className="agendar-pet-card__spec">{m.especie?.toUpperCase()}</span>
                        </div>
                      ))}

                      {/* Botón "+ AGREGAR" */}
                      <div
                        className="agendar-pet-card agendar-pet-card--add"
                        onClick={() => setShowPetModal(true)}
                      >
                        <i className="fa-solid fa-plus" style={{ fontSize: '1.1rem', color: '#94a3b8', marginBottom: '0.35rem' }}></i>
                        <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#64748b' }}>+ AGREGAR</span>
                      </div>
                    </div>

                    {/* 2. Seleccionar Servicio */}
                    <h3 className="agendar-section-title">
                      <span className="agendar-section-num">2</span>
                      <span>Selecciona el Servicio</span>
                    </h3>
                    <div className="agendar-service-pills">
                      {servicios.map((s) => (
                        <button
                          key={s.id_servicio}
                          type="button"
                          className={`agendar-service-pill ${selectedService?.id_servicio === s.id_servicio ? 'agendar-service-pill--active' : ''}`}
                          onClick={() => handleSelectService(s)}
                        >
                          {s.nombre}
                        </button>
                      ))}
                    </div>

                    {/* 3. Selecciona Un Veterinario con Filtro de Especialidad */}
                    <div className="agendar-section-header-row">
                      <h3 className="agendar-section-title">
                        <span className="agendar-section-num">3</span>
                        <span>Selecciona un Veterinario</span>
                      </h3>

                      {/* Dropdown con Filtro y Etiqueta de Contexto */}
                      <div className="agendar-filter-group">
                        <label className="agendar-filter-lbl">
                          <i className="fa-solid fa-filter"></i> Especialidad:
                        </label>
                        <select
                          className="agendar-spec-filter"
                          value={specialtyFilter}
                          onChange={(e) => setSpecialtyFilter(e.target.value)}
                        >
                          {especialidadesDisponibles.map((spec) => (
                            <option key={spec} value={spec}>{spec}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="agendar-vets-grid">
                      {filteredVets.map((v) => (
                        <div
                          key={v.id}
                          className={`agendar-vet-card ${selectedVet?.id === v.id ? 'agendar-vet-card--selected' : ''}`}
                          onClick={() => setSelectedVet(v)}
                        >
                          <img src={v.foto} alt={v.nombre} className="agendar-vet-card__avatar" />
                          <div className="agendar-vet-card__info">
                            <strong className="agendar-vet-card__name">{v.nombre}</strong>
                            <span className="agendar-vet-card__spec">{v.especialidad}</span>
                          </div>

                          {selectedVet?.id === v.id && (
                            <div className="agendar-vet-card__check">
                              <i className="fa-solid fa-check"></i>
                            </div>
                          )}
                        </div>
                      ))}

                      {filteredVets.length === 0 && (
                        <p style={{ fontSize: '0.8rem', color: '#94a3b8', gridColumn: '1 / -1', padding: '0.5rem 0' }}>
                          No hay veterinarios disponibles para esta especialidad.
                        </p>
                      )}
                    </div>

                    {/* 4. Selecciona Fecha y Hora */}
                    <h3 className="agendar-section-title">
                      <span className="agendar-section-num">4</span>
                      <span>Selecciona Fecha y Hora</span>
                    </h3>

                    <div className="agendar-mini-calendar-box">
                      {renderRealCalendar()}

                      {/* Leyenda de Disponibilidad del Calendario */}
                      <div className="agendar-cal-legend">
                        <span className="agendar-legend-item">
                          <span className="agendar-legend-dot agendar-legend-dot--available"></span> Disponible
                        </span>
                        <span className="agendar-legend-item">
                          <span className="agendar-legend-dot agendar-legend-dot--selected"></span> Seleccionado
                        </span>
                        <span className="agendar-legend-item">
                          <span className="agendar-legend-dot agendar-legend-dot--disabled"></span> No disponible
                        </span>
                      </div>

                      {/* Horarios Disponibles */}
                      <div className="agendar-slots-container">
                        <div className="agendar-slots-header">
                          <span className="agendar-slots-label">HORARIOS DISPONIBLES</span>
                          {selectedVet && <span className="agendar-slots-vet-name">Con {selectedVet.nombre}</span>}
                        </div>

                        {loadingHorarios ? (
                          <p className="agendar-slots-loading">
                            <i className="fa-solid fa-spinner fa-spin"></i> Consultando disponibilidad...
                          </p>
                        ) : horariosDisponibles.length > 0 ? (
                          <div className="agendar-slots-row">
                            {horariosDisponibles.map((h) => (
                              <button
                                key={h}
                                type="button"
                                className={`agendar-slot-pill ${selectedTime === h ? 'agendar-slot-pill--active' : ''}`}
                                onClick={() => setSelectedTime(h)}
                              >
                                {h}
                              </button>
                            ))}
                          </div>
                        ) : (
                          <div className="agendar-slots-empty">
                            <i className="fa-solid fa-circle-exclamation"></i>
                            <span>No hay horarios disponibles para este médico en la fecha seleccionada. Por favor elige otra fecha o médico.</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}

                {step === 2 && (
                  <>
                    <div className="agendar-timer-banner">
                      <span>
                        <i className="fa-regular fa-clock" style={{ marginRight: '0.4rem' }}></i>
                        Reserva temporal activa
                      </span>
                      <span>⏱️ {formatTimer(timerSeconds)}</span>
                    </div>

                    <h3 className="agendar-section-title">
                      <i className="fa-solid fa-credit-card"></i> Método de Pago
                    </h3>

                    <div className="agendar-payment-tabs">
                      <button
                        type="button"
                        className={`agendar-payment-tab ${paymentMethod === 'card' ? 'agendar-payment-tab--active' : ''}`}
                        onClick={() => setPaymentMethod('card')}
                      >
                        <i className="fa-solid fa-credit-card"></i>
                        <span>Tarjeta Crédito / Débito</span>
                      </button>
                      <button
                        type="button"
                        className={`agendar-payment-tab ${paymentMethod === 'pse' ? 'agendar-payment-tab--active' : ''}`}
                        onClick={() => setPaymentMethod('pse')}
                      >
                        <i className="fa-solid fa-building-columns"></i>
                        <span>PSE (Débito Bancario)</span>
                      </button>
                      <button
                        type="button"
                        className={`agendar-payment-tab ${paymentMethod === 'nequi' ? 'agendar-payment-tab--active' : ''}`}
                        onClick={() => setPaymentMethod('nequi')}
                      >
                        <i className="fa-solid fa-mobile-screen-button"></i>
                        <span>Nequi / Daviplata</span>
                      </button>
                    </div>

                    {paymentMethod === 'card' && (
                      <div className="agendar-payment-form">
                        <div className="pet-form__field">
                          <label>Nombre del Titular de la Tarjeta *</label>
                          <input type="text" placeholder="Como aparece en la tarjeta" required />
                        </div>
                        <div className="pet-form__field">
                          <label>Número de Tarjeta *</label>
                          <input type="text" placeholder="0000 0000 0000 0000" maxLength="19" required />
                        </div>
                        <div className="pet-form__row">
                          <div className="pet-form__field">
                            <label>Fecha Exp. (MM/AA) *</label>
                            <input type="text" placeholder="MM/AA" maxLength="5" required />
                          </div>
                          <div className="pet-form__field">
                            <label>Código CVC *</label>
                            <input type="password" placeholder="123" maxLength="4" required />
                          </div>
                        </div>

                        <div className="agendar-form-actions">
                          <button type="button" className="btn-modal-secondary" onClick={() => setStep(1)}>
                            ← Volver
                          </button>
                          <button type="button" className="btn-primary-pet" style={{ flex: 1 }} onClick={handleConfirmarPago} disabled={submitting}>
                            {submitting ? 'Procesando...' : `Pagar ${formatCOP(selectedService?.precio_base)}`}
                          </button>
                        </div>
                      </div>
                    )}

                    {paymentMethod === 'pse' && (
                      <div className="agendar-payment-form">
                        <div className="pet-form__field">
                          <label>Selecciona tu Banco *</label>
                          <select required defaultValue="">
                            <option value="" disabled>-- Elige tu entidad financiera --</option>
                            <option value="bancolombia">Bancolombia</option>
                            <option value="banco_bogota">Banco de Bogotá</option>
                            <option value="davivienda">Davivienda</option>
                            <option value="bbva">BBVA Colombia</option>
                            <option value="nequi">Nequi</option>
                            <option value="rappipay">RappiPay</option>
                          </select>
                        </div>

                        <div className="pet-form__row">
                          <div className="pet-form__field">
                            <label>Tipo de Cliente *</label>
                            <select required defaultValue="natural">
                              <option value="natural">Persona Natural</option>
                              <option value="juridica">Persona Jurídica</option>
                            </select>
                          </div>

                          <div className="pet-form__field">
                            <label>Número de Documento *</label>
                            <input type="text" placeholder="Número de C.C." required />
                          </div>
                        </div>

                        <div className="agendar-form-actions">
                          <button type="button" className="btn-modal-secondary" onClick={() => setStep(1)}>
                            ← Volver
                          </button>
                          <button type="button" className="btn-primary-pet" style={{ flex: 1 }} onClick={handleConfirmarPago} disabled={submitting}>
                            {submitting ? 'Procesando...' : 'Ir a PSE a Pagar'}
                          </button>
                        </div>
                      </div>
                    )}

                    {paymentMethod === 'nequi' && (
                      <div className="agendar-payment-form">
                        <div className="pet-form__field">
                          <label>Número Celular Registrado *</label>
                          <input type="tel" placeholder="300 000 0000" maxLength="10" required />
                        </div>

                        <p className="text-muted" style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '1rem' }}>
                          Recibirás una notificación en tu app móvil para autorizar la transacción de manera segura.
                        </p>

                        <div className="agendar-form-actions">
                          <button type="button" className="btn-modal-secondary" onClick={() => setStep(1)}>
                            ← Volver
                          </button>
                          <button type="button" className="btn-primary-pet" style={{ flex: 1 }} onClick={handleConfirmarPago} disabled={submitting}>
                            {submitting ? 'Procesando...' : `Continuar a ${paymentMethod === 'nequi' ? 'Nequi' : 'PSE'}`}
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Columna Derecha: Panel de Resumen Fijo Rediseñado */}
              <aside className="agendar-sidebar-summary">
                <div className="agendar-summary-header-box">
                  <div className="agendar-summary-badge">
                    <i className="fa-solid fa-receipt"></i>
                  </div>
                  <div>
                    <h3 className="agendar-summary-header">Resumen de Pago</h3>
                    <p className="agendar-summary-subtitle">Expediente de Reserva Clínica</p>
                  </div>
                </div>

                <div className="agendar-summary-list">
                  <div className="agendar-summary-card">
                    <div className="agendar-summary-card__icon agendar-summary-card__icon--blue">
                      <i className="fa-solid fa-stethoscope"></i>
                    </div>
                    <div className="agendar-summary-card__content">
                      <span className="agendar-summary-label">SERVICIO MÉDICO</span>
                      <strong className="agendar-summary-title">{selectedService?.nombre || 'Consulta General'}</strong>
                    </div>
                    <span className="agendar-summary-val">{formatCOP(selectedService?.precio_base)}</span>
                  </div>

                  <div className="agendar-summary-card">
                    <div className="agendar-summary-card__icon agendar-summary-card__icon--green">
                      <i className="fa-solid fa-paw"></i>
                    </div>
                    <div className="agendar-summary-card__content">
                      <span className="agendar-summary-label">PACIENTE ATENDIDO</span>
                      <strong className="agendar-summary-title">{selectedPet?.nombre || 'Mascota'}</strong>
                    </div>
                  </div>

                  <div className="agendar-summary-card">
                    <div className="agendar-summary-card__icon agendar-summary-card__icon--teal">
                      <i className="fa-solid fa-user-doctor"></i>
                    </div>
                    <div className="agendar-summary-card__content">
                      <span className="agendar-summary-label">MÉDICO VETERINARIO</span>
                      <strong className="agendar-summary-title">{selectedVet?.nombre || 'Médico Asignado'}</strong>
                      {selectedVet?.especialidad && <span className="agendar-summary-subspec">{selectedVet.especialidad}</span>}
                    </div>
                  </div>

                  <div className="agendar-summary-card">
                    <div className="agendar-summary-card__icon agendar-summary-card__icon--amber">
                      <i className="fa-regular fa-calendar-days"></i>
                    </div>
                    <div className="agendar-summary-card__content">
                      <span className="agendar-summary-label">FECHA Y HORA</span>
                      <strong className="agendar-summary-title">{formatSummaryDate()}</strong>
                    </div>
                  </div>
                </div>

                <div className="agendar-summary-total-box">
                  <div className="agendar-summary-total-info">
                    <span className="agendar-summary-total-lbl">Total a pagar</span>
                    <span className="agendar-summary-total-sub">Tarifa oficial EPS PetFeliz</span>
                  </div>
                  <strong className="agendar-summary-total-amount">{formatCOP(selectedService?.precio_base)}</strong>
                </div>

                {step === 1 && (
                  <button
                    type="button"
                    className="btn-primary-pet agendar-summary-btn"
                    onClick={handleProceedToPayment}
                    disabled={submitting || !selectedTime}
                  >
                    {submitting ? 'Reservando...' : 'Continuar al Pago →'}
                  </button>
                )}

                <p className="agendar-summary-disclaimer">
                  <i className="fa-solid fa-lock" style={{ marginRight: '0.35rem', color: '#059669' }}></i>
                  Al continuar aceptas nuestras políticas de agendamiento y reserva
                </p>
              </aside>
            </div>
          ) : (
            /* ── PASO 3: CONFIRMACIÓN DE CITA ── */
            <div className="agendar-success-box">
              <div className="agendar-success-icon">
                <i className="fa-solid fa-check"></i>
              </div>
              <h2 className="agendar-success-title">¡Cita Confirmada!</h2>
              <p className="agendar-success-sub">
                Tu agendamiento y pago han sido procesados exitosamente. Hemos enviado la confirmación y el comprobante a tu correo electrónico.
              </p>

              <div className="modal-detail-grid" style={{ textAlign: 'left', marginBottom: '1.75rem' }}>
                <div className="modal-detail-item">
                  <span className="modal-detail-label">Mascota</span>
                  <span className="modal-detail-value">{confirmedCita?.mascota?.nombre}</span>
                </div>
                <div className="modal-detail-item">
                  <span className="modal-detail-label">Servicio</span>
                  <span className="modal-detail-value">{confirmedCita?.servicioNombre}</span>
                </div>
                <div className="modal-detail-item">
                  <span className="modal-detail-label">Fecha y Hora</span>
                  <span className="modal-detail-value">{confirmedCita?.fecha} - {confirmedCita?.hora}</span>
                </div>
                <div className="modal-detail-item">
                  <span className="modal-detail-label">Médico Asignado</span>
                  <span className="modal-detail-value">{confirmedCita?.veterinario?.nombre}</span>
                </div>
                <div className="modal-detail-item">
                  <span className="modal-detail-label">Estado</span>
                  <span className="modal-detail-value" style={{ color: '#059669' }}>
                    <i className="fa-solid fa-circle-check" style={{ marginRight: '0.3rem' }}></i> Confirmada
                  </span>
                </div>
                <div className="modal-detail-item">
                  <span className="modal-detail-label">Monto Pagado</span>
                  <span className="modal-detail-value">{formatCOP(confirmedCita?.precio)}</span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.85rem', justifyContent: 'center' }}>
                <button type="button" className="btn-primary-pet" onClick={() => navigate('/dashboard-client')}>
                  Volver al Inicio
                </button>
                <button type="button" className="btn-action-sm btn-action-sm--secondary" onClick={() => setShowReceiptModal(true)}>
                  <i className="fa-solid fa-receipt"></i> Ver Recibo
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* ── MODAL AGREGAR RÁPIDO NUEVA MASCOTA ── */}
      {showPetModal && (
        <div className="dh-modal-backdrop">
          <div className="dh-modal-box">
            <div className="dh-modal-header">
              <h3>Agregar Nueva Mascota</h3>
              <button type="button" className="dh-modal-close" onClick={() => setShowPetModal(false)}>
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            {petModalError && <div className="dh-modal-alert dh-modal-alert--error">{petModalError}</div>}

            <form onSubmit={handleCreatePetSubmit} className="dh-profile-form">
              <div className="dh-form-field" style={{ marginBottom: '0.85rem' }}>
                <label>Nombre de la Mascota *</label>
                <input
                  type="text"
                  required
                  placeholder="ej. Toby, Lupe"
                  value={newPetForm.nombre}
                  onChange={(e) => setNewPetForm({ ...newPetForm, nombre: e.target.value })}
                />
              </div>

              <div className="dh-info-grid" style={{ marginBottom: '0.85rem' }}>
                <div className="dh-form-field">
                  <label>Especie</label>
                  <select
                    value={newPetForm.especie}
                    onChange={(e) => {
                      const esp = e.target.value
                      const razas = RAZAS_POR_ESPECIE[esp] || []
                      setNewPetForm({ ...newPetForm, especie: esp, raza: razas[0] || '' })
                    }}
                  >
                    <option value="Canino">Perro / Canino</option>
                    <option value="Felino">Gato / Felino</option>
                    <option value="Ave">Ave</option>
                    <option value="Roedor">Roedor</option>
                    <option value="Otro">Otro</option>
                  </select>
                </div>

                <div className="dh-form-field">
                  <label>Raza</label>
                  <select
                    value={newPetForm.raza}
                    onChange={(e) => setNewPetForm({ ...newPetForm, raza: e.target.value })}
                  >
                    {(RAZAS_POR_ESPECIE[newPetForm.especie] || []).map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="dh-modal-footer">
                <button type="button" className="dh-btn-secondary" onClick={() => setShowPetModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="dh-btn-primary" disabled={savingPet}>
                  {savingPet ? 'Guardando...' : 'Guardar Mascota'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL VER RECIBO DE PAGO ── */}
      {showReceiptModal && confirmedCita && (
        <div className="dh-modal-backdrop">
          <div className="dh-modal-box">
            <div className="dh-modal-header">
              <h3>Comprobante de Pago</h3>
              <button type="button" className="dh-modal-close" onClick={() => setShowReceiptModal(false)}>
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <div style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '1.25rem', fontSize: '0.85rem' }}>
              <div style={{ textAlign: 'center', marginBottom: '1rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem' }}>
                <h4 style={{ fontSize: '1.1rem', color: '#059669', margin: 0 }}>EPS PetFeliz S.A.S</h4>
                <span style={{ color: '#64748b', fontSize: '0.78rem' }}>NIT: 901.234.567-8 • Recibo No. #{confirmedCita.id}892</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                <span>Cliente:</span> <strong>{usuario.nombreCompleto || usuario.nombre}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                <span>Paciente:</span> <strong>{confirmedCita.mascota?.nombre} ({confirmedCita.mascota?.especie})</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                <span>Servicio:</span> <strong>{confirmedCita.servicioNombre}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                <span>Médico:</span> <strong>{confirmedCita.veterinario?.nombre}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                <span>Fecha y Hora:</span> <strong>{confirmedCita.fecha} {confirmedCita.hora}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.75rem', paddingTop: '0.5rem', borderTop: '1.5px dashed #cbd5e1', fontSize: '1rem' }}>
                <span>Total Pagado:</span> <strong style={{ color: '#059669' }}>{formatCOP(confirmedCita.precio)}</strong>
              </div>
            </div>

            <div className="dh-modal-footer">
              <button type="button" className="dh-btn-secondary" onClick={() => window.print()}>
                <i className="fa-solid fa-print" style={{ marginRight: '0.3rem' }}></i> Imprimir
              </button>
              <button type="button" className="dh-btn-primary" onClick={() => setShowReceiptModal(false)}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AgendarCitaFlow