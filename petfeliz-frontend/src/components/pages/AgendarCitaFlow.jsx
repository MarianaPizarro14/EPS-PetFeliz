// src/components/pages/AgendarCitaFlow.jsx
import React, { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { getStoredToken } from '../../utils/authStorage'
import SidebarClient from '../ui/SidebarClient'
import DashboardHeader from '../ui/DashboardHeader'
import CustomDatePicker from '../ui/CustomDatePicker'
import { RAZAS_POR_ESPECIE } from '../../data/razasPorEspecie'
import { serviciosData } from '../../data/serviciosData'
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
  'Vacunación': ['Vacunación', 'Medicina General'],
  'Desparasitación': ['Desparasitación', 'Medicina General'],
  'Urgencias': ['Urgencias'],
  'Laboratorio Clínico': ['Laboratorio Clínico', 'Laboratorio', 'Medicina General'],
  'Odontología': ['Odontología'],
  'Cirugía': ['Cirugía'],
  'Consulta Especializada': ['Medicina General', 'Cirugía', 'Dermatología', 'Odontología', 'Cardiología', 'Oftalmología'],
  'Cirugía Minor/Mayor': ['Cirugía'],
  'Exámenes de Laboratorio': ['Laboratorio Clínico', 'Medicina General'],
  'Exámenes': ['Laboratorio Clínico', 'Medicina General'],
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
  const [afiliacionInfo, setAfiliacionInfo] = useState(null)
  const [mascotas, setMascotas] = useState([])
  const [servicios, setServicios] = useState([])
  const [veterinarios, setVeterinarios] = useState(veterinariosData)

  // Selecciones del usuario
  const [selectedPet, setSelectedPet] = useState(null)
  const [selectedService, setSelectedService] = useState(null)
  const [selectedVet, setSelectedVet] = useState(null)

  // Calendario Real Estado (Fecha actual)
  const today = new Date()
  const [currentYear, setCurrentYear] = useState(today.getFullYear())
  const [currentMonth, setCurrentMonth] = useState(today.getMonth())
  const [selectedDate, setSelectedDate] = useState(today.toISOString().split('T')[0])
  const [selectedTime, setSelectedTime] = useState('10:30 AM')
  const [observacion, setObservacion] = useState('')

  // Disponibilidad de horarios y mes
  const [horariosDisponibles, setHorariosDisponibles] = useState([])
  const [loadingHorarios, setLoadingHorarios] = useState(false)
  const [diasDisponiblesMap, setDiasDisponiblesMap] = useState({})

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

  // Formulario para crear mascota en modal
  const [newPetForm, setNewPetForm] = useState({
    nombre: '',
    especie: 'Canino',
    raza: RAZAS_POR_ESPECIE['Canino']?.[0] || 'Criollo/Mestizo',
    sexo: 'Macho',
    fecha_nacimiento: '',
    peso: '',
  })
  const [selectedFile, setSelectedFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [isDragging, setIsDragging] = useState(false)
  const [savingPet, setSavingPet] = useState(false)
  const [petModalError, setPetModalError] = useState('')

  // Cargar datos iniciales desde el Backend
  useEffect(() => {
    const loadInitialData = async () => {
      const token = getStoredToken()
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

        // 1b. Estado de Afiliación (Vencimientos y Mora)
        const resAfil = await fetch(`${import.meta.env.VITE_API_URL}/cliente/afiliacion`, {
          headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
        })
        if (resAfil.ok) {
          const aData = await resAfil.json()
          setAfiliacionInfo(aData)
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
          const sDataRaw = await resSrv.json()
          const sData = Array.isArray(sDataRaw)
            ? sDataRaw
            : Array.isArray(sDataRaw?.data)
            ? sDataRaw.data
            : Array.isArray(sDataRaw?.servicios)
            ? sDataRaw.servicios
            : []

          if (sData.length > 0) {
            setServicios(sData)
            setSelectedService(sData[0])
          } else {
            setServicios(serviciosData)
            setSelectedService(serviciosData[0])
          }
        } else {
          setServicios(serviciosData)
          setSelectedService(serviciosData[0])
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

  // Al seleccionar servicio desde las píldoras
  const handleSelectService = (service) => {
    setSelectedService(service)
    const expectedSpecs = SERVICE_SPECIALTY_MAP[service.nombre] || [service.nombre]

    const matchingVet = veterinarios.find((v) =>
      expectedSpecs.some((spec) => v.especialidad.toLowerCase().includes(spec.toLowerCase()) || spec.toLowerCase().includes(v.especialidad.toLowerCase()))
    )

    if (matchingVet) {
      setSelectedVet(matchingVet)
    }
  }

  // Al seleccionar un veterinario directamente
  const handleSelectVet = (vet) => {
    setSelectedVet(vet)
  }

  // Cargar horarios disponibles cuando cambia el veterinario o la fecha
  useEffect(() => {
    if (!selectedVet || !selectedDate) return

    const fetchHorarios = async () => {
      const token = getStoredToken()
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

  // Consultar mapa de disponibilidad por día del mes para el médico seleccionado
  useEffect(() => {
    if (!selectedVet) return

    const fetchDisponibilidadMes = async () => {
      const token = getStoredToken()
      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_URL}/agendar/disponibilidad-mes?id_veterinario=${selectedVet.id}&mes=${currentMonth + 1}&anio=${currentYear}`,
          {
            headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
          }
        )
        if (res.ok) {
          const data = await res.json()
          setDiasDisponiblesMap(data.disponibilidad || {})
        }
      } catch (err) {
        console.error('Error al cargar disponibilidad del mes:', err)
      }
    }

    fetchDisponibilidadMes()
  }, [selectedVet, currentMonth, currentYear])

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

    const token = getStoredToken()
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
      const token = getStoredToken()
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

    const token = getStoredToken()
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
          id_mascota: selectedPet?.id || selectedPet?.id_mascota,
          id_servicio: selectedService?.id_servicio,
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

  // Manejadores para carga de foto en modal
  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      setImagePreview(URL.createObjectURL(file))
    }
  }

  const handleRemoveImage = () => {
    setSelectedFile(null)
    setImagePreview(null)
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) {
      setSelectedFile(file)
      setImagePreview(URL.createObjectURL(file))
    }
  }

  const handleEspecieChange = (newEspecie) => {
    const razasDisponibles = RAZAS_POR_ESPECIE[newEspecie] || []
    setNewPetForm((prev) => ({
      ...prev,
      especie: newEspecie,
      raza: razasDisponibles[0] || '',
    }))
  }

  const handleOpenPetModal = () => {
    setNewPetForm({
      nombre: '',
      especie: 'Canino',
      raza: RAZAS_POR_ESPECIE['Canino']?.[0] || 'Criollo/Mestizo',
      sexo: 'Macho',
      fecha_nacimiento: '',
      peso: '',
    })
    setSelectedFile(null)
    setImagePreview(null)
    setPetModalError('')
    setShowPetModal(true)
  }

  // Crear nueva mascota desde modal de Paso 1
  const handleCreatePetSubmit = async (e) => {
    e.preventDefault()
    setPetModalError('')

    if (!newPetForm.nombre) {
      setPetModalError('El nombre de la mascota es obligatorio.')
      return
    }

    const token = getStoredToken()
    try {
      setSavingPet(true)
      const formData = new FormData()
      formData.append('nombre', newPetForm.nombre)
      formData.append('especie', newPetForm.especie)
      formData.append('raza', newPetForm.raza || '')
      formData.append('sexo', newPetForm.sexo)
      if (newPetForm.fecha_nacimiento) formData.append('fecha_nacimiento', newPetForm.fecha_nacimiento)
      if (newPetForm.peso) formData.append('peso', newPetForm.peso)
      if (selectedFile) formData.append('foto', selectedFile)

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
        setSavingPet(false)
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
    const num = parseInt(val ?? 70000)
    return `$${num.toLocaleString('es-CO')}`
  }

  const clienteData = afiliacionInfo?.cliente
  const esAfiliado = Boolean(clienteData?.es_afiliado)
  const isEnMora = clienteData?.estado_mora === 'en_mora'
  const diasMora = clienteData?.dias_mora || 0

  // Cálculo del precio final según afiliación y mora
  const getPrecioCitaCalculado = (srv) => {
    if (!srv) return 70000
    if (!esAfiliado || isEnMora) {
      return Number(srv.precio_base) || 70000
    }
    if (srv.precio_afiliado !== undefined && srv.precio_afiliado !== null) {
      return Number(srv.precio_afiliado)
    }
    if (srv.incluido_en_plan) return 0
    return Number(srv.precio_base) || 70000
  }

  // Formatear minutos y segundos
  const formatTimer = (sec) => {
    const mins = Math.floor(sec / 60)
    const remSec = sec % 60
    return `${mins.toString().padStart(2, '0')}:${remSec.toString().padStart(2, '0')} min`
  }

  // Filtrado de veterinarios según el servicio médico seleccionado en el paso 2
  const expectedSpecs = selectedService
    ? SERVICE_SPECIALTY_MAP[selectedService.nombre] || [selectedService.nombre]
    : []

  const filteredVets = veterinarios.filter((v) => {
    if (!selectedService || expectedSpecs.length === 0) return true
    return expectedSpecs.some(
      (spec) =>
        v.especialidad.toLowerCase().includes(spec.toLowerCase()) ||
        spec.toLowerCase().includes(v.especialidad.toLowerCase())
    )
  })

  // Nombres de meses en español
  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ]

  // 3. CALENDARIO MENSUAL REAL Y MATEMÁTICAMENTE EXACTO (Lun-Dom) Con ventana de 3 meses
  const getDaysInMonth = (y, m) => new Date(y, m + 1, 0).getDate()
  const getFirstDayOfWeek = (y, m) => {
    const day = new Date(y, m, 1).getDay()
    return day === 0 ? 6 : day - 1 // Lunes = 0, Domingo = 6
  }

  // Ventana estricta de 3 meses (mes actual + 2 siguientes)
  const minDate = new Date(today.getFullYear(), today.getMonth(), 1)
  const maxDate = new Date(today.getFullYear(), today.getMonth() + 2, 1)

  const isMinMonth = currentYear === minDate.getFullYear() && currentMonth === minDate.getMonth()
  const isMaxMonth = currentYear === maxDate.getFullYear() && currentMonth === maxDate.getMonth()

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

      // Marcar domingos, días pasados o días con 0 cupos como deshabilitados
      const dayDate = new Date(currentYear, currentMonth, d)
      const isSunday = dayDate.getDay() === 0
      const isPast = dayDate < todayDate
      const availableSlotsCount = diasDisponiblesMap[fullDate] ?? (isSunday || isPast ? 0 : 8)
      const hasSlots = availableSlotsCount > 0

      const isUnavailable = isSunday || isPast || !hasSlots

      cells.push(
        <button
          key={fullDate}
          type="button"
          disabled={isUnavailable}
          className={`agendar-cal-cell ${
            isSelected
              ? 'agendar-cal-cell--selected'
              : !isUnavailable
              ? 'agendar-cal-cell--available'
              : 'agendar-cal-cell--disabled'
          }`}
          onClick={() => !isUnavailable && setSelectedDate(fullDate)}
          title={
            isUnavailable
              ? 'Día no disponible para consulta con este médico'
              : `Seleccionar ${d} de ${monthNames[currentMonth]} (${availableSlotsCount} cupos disponibles)`
          }
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
              disabled={isMinMonth}
              onClick={() => {
                if (isMinMonth) return
                if (currentMonth === 0) {
                  setCurrentMonth(11)
                  setCurrentYear((prev) => prev - 1)
                } else {
                  setCurrentMonth((prev) => prev - 1)
                }
              }}
              title={isMinMonth ? 'No puedes ir a meses pasados' : 'Mes anterior'}
              style={{ opacity: isMinMonth ? 0.35 : 1, cursor: isMinMonth ? 'not-allowed' : 'pointer' }}
            >
              <i className="fa-solid fa-chevron-left"></i>
            </button>
            <button
              type="button"
              disabled={isMaxMonth}
              onClick={() => {
                if (isMaxMonth) return
                if (currentMonth === 11) {
                  setCurrentMonth(0)
                  setCurrentYear((prev) => prev + 1)
                } else {
                  setCurrentMonth((prev) => prev + 1)
                }
              }}
              title={isMaxMonth ? 'Límite de disponibilidad: 3 meses' : 'Mes siguiente'}
              style={{ opacity: isMaxMonth ? 0.35 : 1, cursor: isMaxMonth ? 'not-allowed' : 'pointer' }}
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

          {/* ── ALERTA DE MORA EN AFILIACIÓN ── */}
          {isEnMora && step < 3 && (
            <div
              className="dh-modal-alert dh-modal-alert--error"
              style={{
                marginBottom: '1.25rem',
                display: 'flex',
                justify: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '0.75rem',
                background: '#fef2f2',
                border: '1.5px solid #fca5a5',
                padding: '1rem 1.25rem',
                borderRadius: '12px',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#991b1b', fontWeight: 700, fontSize: '0.95rem' }}>
                  <i className="fa-solid fa-triangle-exclamation"></i>
                  <span>¡Tu mensualidad de afiliación está VENCIDA ({diasMora} {diasMora === 1 ? 'día' : 'días'} de mora)!</span>
                </div>
                <p style={{ margin: '0.3rem 0 0 0', fontSize: '0.85rem', color: '#7f1d1d' }}>
                  Al tener la cuota vencida, las citas médicas se cobrarán a <strong>Tarifa Regular / Particular ({formatCOP(selectedService?.precio_base)})</strong>. Puedes ponértela al día ahora mismo en el módulo de Afiliación.
                </p>
              </div>

              <button
                type="button"
                style={{
                  background: '#dc2626',
                  color: '#ffffff',
                  border: 'none',
                  padding: '0.55rem 1.1rem',
                  borderRadius: '8px',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  boxShadow: '0 4px 10px rgba(220, 38, 38, 0.25)',
                }}
                onClick={() => navigate('/afiliacion')}
              >
                <i className="fa-solid fa-credit-card"></i>
                <span>Pagar Afiliación Ahora</span>
              </button>
            </div>
          )}

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
                        onClick={handleOpenPetModal}
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

                    {/* 3. Selecciona Un Veterinario */}
                    <h3 className="agendar-section-title">
                      <span className="agendar-section-num">3</span>
                      <span>Selecciona un Veterinario</span>
                    </h3>

                    <div className="agendar-vets-grid">
                      {filteredVets.map((v) => (
                        <div
                          key={v.id}
                          className={`agendar-vet-card ${selectedVet?.id === v.id ? 'agendar-vet-card--selected' : ''}`}
                          onClick={() => handleSelectVet(v)}
                        >
                          <img src={v.foto} alt={v.nombre} className="agendar-vet-card__avatar" />
                          <div className="agendar-vet-card__info">
                            <strong className="agendar-vet-card__name">{v.nombre}</strong>
                            <span className="agendar-vet-card__spec">{v.especialidad}</span>
                            <span className="agendar-vet-card__location">
                              <i className="fa-solid fa-location-dot"></i> {v.sede || 'Sede Laureles'}
                            </span>
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
                          No hay veterinarios disponibles para este servicio.
                        </p>
                      )}
                    </div>

                    {/* 4. Selecciona Fecha y Hora */}
                    <h3 className="agendar-section-title">
                      <span className="agendar-section-num">4</span>
                      <span>Selecciona Fecha y Hora</span>
                    </h3>

                    <div className="agendar-mini-calendar-box">
                      <div className="agendar-datetime-grid">
                        {/* Columna Izquierda: Calendario y Leyenda */}
                        <div className="agendar-datetime-cal-col">
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
                        </div>

                        {/* Columna Derecha: Horarios Disponibles */}
                        <div className="agendar-datetime-slots-col">
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
                    </div>
                  </>
                )}

                {step === 2 && (
                  <>
                    <div className="agendar-timer-banner">
                      <span>
                        <i className="fa-regular fa-clock" style={{ marginRight: '0.45rem' }}></i>
                        Reserva temporal activa
                      </span>
                      <span>
                        <i className="fa-solid fa-stopwatch" style={{ marginRight: '0.35rem' }}></i>
                        {formatTimer(timerSeconds)}
                      </span>
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
                            {submitting ? 'Procesando...' : `Pagar ${formatCOP(getPrecioCitaCalculado(selectedService))}`}
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
                    <span className="agendar-summary-total-sub">
                      {isEnMora
                        ? 'Tarifa Particular por Mora en Afiliación'
                        : !esAfiliado
                        ? 'Tarifa Particular (Sin Afiliación)'
                        : getPrecioCitaCalculado(selectedService) === 0
                        ? 'Incluido 100% en Plan EPS ($0 COP)'
                        : 'Copago con Descuento Afiliado EPS'}
                    </span>
                  </div>
                  <strong className="agendar-summary-total-amount">
                    {formatCOP(getPrecioCitaCalculado(selectedService))}
                  </strong>
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

      {/* ── MODAL REGISTRAR NUEVA MASCOTA ── */}
      {showPetModal && (
        <div className="modal-backdrop">
          <div className="modal-box pet-modal-box">
            <div className="modal-box__header">
              <div className="modal-box__title-group">
                <div className="modal-box__badge">
                  <i className="fa-solid fa-paw" style={{ color: '#059669', fontSize: '1.15rem' }}></i>
                </div>
                <div>
                  <h3>Registrar Nueva Mascota</h3>
                  <p className="modal-box__subtitle">Apertura de Expediente Veterinario — PetFeliz EPS</p>
                </div>
              </div>
              <button
                type="button"
                className="modal-box__close"
                onClick={() => setShowPetModal(false)}
                aria-label="Cerrar modal"
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            {petModalError && <div className="modal-box__error">{petModalError}</div>}

            <form onSubmit={handleCreatePetSubmit} className="pet-form">
              {/* ── SECCIÓN 1: FOTO Y DATOS PRINCIPALES ── */}
              <div className="pet-form__header-card">
                <div className="pet-upload-avatar-wrap">
                  {imagePreview ? (
                    <div className="pet-avatar-preview">
                      <img src={imagePreview} alt="Foto de la mascota" />
                      <button
                        type="button"
                        className="btn-remove-avatar"
                        onClick={handleRemoveImage}
                        title="Quitar foto"
                      >
                        <i className="fa-solid fa-xmark" style={{ fontSize: '0.75rem' }}></i>
                      </button>
                      <label className="btn-change-avatar-badge" title="Cambiar foto">
                        <input
                          type="file"
                          accept="image/png, image/jpeg, image/jpg, image/webp"
                          onChange={handleFileChange}
                          style={{ display: 'none' }}
                        />
                        <i className="fa-solid fa-camera" style={{ fontSize: '0.75rem' }}></i>
                      </label>
                    </div>
                  ) : (
                    <label
                      className={`pet-avatar-dropzone ${isDragging ? 'pet-avatar-dropzone--dragging' : ''}`}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      title="Subir foto de la mascota"
                    >
                      <input
                        type="file"
                        accept="image/png, image/jpeg, image/jpg, image/webp"
                        onChange={handleFileChange}
                        style={{ display: 'none' }}
                      />
                      <div className="pet-avatar-icon-ring">
                        <i className="fa-solid fa-camera" style={{ fontSize: '1.05rem' }}></i>
                      </div>
                      <span className="pet-avatar-upload-lbl">+ Foto</span>
                    </label>
                  )}
                </div>

                <div className="pet-form__main-fields">
                  <div className="pet-form__field">
                    <label>
                      Nombre de la Mascota <span className="req-star">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="ej. Bruno, Nala"
                      value={newPetForm.nombre}
                      onChange={(e) => setNewPetForm({ ...newPetForm, nombre: e.target.value })}
                    />
                  </div>

                  <div className="pet-form__field">
                    <label>
                      Fecha de Nacimiento <span className="opt-tag">(Opcional)</span>
                    </label>
                    <CustomDatePicker
                      value={newPetForm.fecha_nacimiento}
                      onChange={(val) => setNewPetForm({ ...newPetForm, fecha_nacimiento: val })}
                      placeholder="Selecciona fecha de nacimiento"
                    />
                  </div>
                </div>
              </div>

              {/* ── SECCIÓN 2: CLASIFICACIÓN Y RAZA ── */}
              <div className="pet-form__section">
                <div className="pet-form__section-header">
                  <span className="pet-form__section-title">Clasificación Veterinaria</span>
                  <span className="pet-form__section-badge">Requerido</span>
                </div>

                <div className="pet-form__row">
                  <div className="pet-form__field">
                    <label>
                      Especie <span className="req-star">*</span>
                    </label>
                    <select
                      value={newPetForm.especie}
                      onChange={(e) => handleEspecieChange(e.target.value)}
                    >
                      <option value="Canino">Canino (Perro)</option>
                      <option value="Felino">Felino (Gato)</option>
                      <option value="Ave">Ave</option>
                      <option value="Roedor">Roedor</option>
                      <option value="Otro">Otro</option>
                    </select>
                  </div>

                  <div className="pet-form__field">
                    <label>
                      Raza <span className="req-star">*</span>
                    </label>
                    <select
                      value={
                        (RAZAS_POR_ESPECIE[newPetForm.especie] || []).filter((r) => r !== 'Otra (Especificar)').includes(newPetForm.raza)
                          ? newPetForm.raza
                          : 'Otra (Especificar)'
                      }
                      onChange={(e) => {
                        const val = e.target.value
                        if (val === 'Otra (Especificar)') {
                          setNewPetForm({ ...newPetForm, raza: '' })
                        } else {
                          setNewPetForm({ ...newPetForm, raza: val })
                        }
                      }}
                    >
                      {(RAZAS_POR_ESPECIE[newPetForm.especie] || []).map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Campo libre si especie es Otro o raza es Otra */}
                {(newPetForm.especie === 'Otro' ||
                  newPetForm.raza === 'Otra (Especificar)' ||
                  !(RAZAS_POR_ESPECIE[newPetForm.especie] || []).filter((r) => r !== 'Otra (Especificar)').includes(newPetForm.raza)) && (
                  <div className="pet-form__field" style={{ marginTop: '0.5rem' }}>
                    <label>
                      Escribe la raza de tu mascota <span className="req-star">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Escribe la raza de tu mascota"
                      value={newPetForm.raza === 'Otra (Especificar)' ? '' : newPetForm.raza}
                      onChange={(e) => setNewPetForm({ ...newPetForm, raza: e.target.value })}
                    />
                  </div>
                )}
              </div>

              {/* ── SECCIÓN 3: DETALLES FÍSICOS ── */}
              <div className="pet-form__section">
                <div className="pet-form__section-header">
                  <span className="pet-form__section-title">Datos Físicos</span>
                  <span className="pet-form__section-badge pet-form__section-badge--opt">Complementario</span>
                </div>

                <div className="pet-form__row">
                  <div className="pet-form__field">
                    <label>
                      Sexo <span className="opt-tag">(Opcional)</span>
                    </label>
                    <select
                      value={newPetForm.sexo}
                      onChange={(e) => setNewPetForm({ ...newPetForm, sexo: e.target.value })}
                    >
                      <option value="Macho">Macho</option>
                      <option value="Hembra">Hembra</option>
                    </select>
                  </div>

                  <div className="pet-form__field">
                    <label>
                      Peso (kg) <span className="opt-tag">(Opcional)</span>
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      placeholder="ej. 12.5"
                      value={newPetForm.peso}
                      onChange={(e) => setNewPetForm({ ...newPetForm, peso: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="modal-box__footer">
                <button
                  type="button"
                  className="btn-modal-secondary"
                  onClick={() => setShowPetModal(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn-primary-pet" disabled={savingPet}>
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