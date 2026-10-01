import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getStoredToken, getStoredUser, isValidAvatarUrl } from '../../utils/authStorage'
import SidebarRecepcion from '../ui/SidebarRecepcion'
import DashboardHeader from '../ui/DashboardHeader'
import './DashboardClient.css'
import './DashboardVeterinario.css'
import './DashboardRecepcion.css'

export default function RecepcionCitas() {
  const navigate = useNavigate()
  const storedUser = getStoredUser()

  const [usuario, setUsuario] = useState({
    nombre: storedUser?.nombre || 'Laura Ramírez',
    nombreCompleto: storedUser?.nombre || 'Laura Ramírez - Recepción Sede',
    foto: isValidAvatarUrl(storedUser?.foto || storedUser?.foto_perfil) ? (storedUser?.foto || storedUser?.foto_perfil) : null,
    rol: 'recepcionista',
    email: storedUser?.email || 'recepcion@petfeliz.com',
  })

  const [citas, setCitas] = useState([])
  const [veterinarios, setVeterinarios] = useState([])
  const [loading, setLoading] = useState(true)
  const [errorGlobal, setErrorGlobal] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('todos')
  const [filterFecha, setFilterFecha] = useState('')
  const [filterVet, setFilterVet] = useState('')

  // Toast
  const [toast, setToast] = useState(null)
  const triggerToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 4000)
  }

  // Modales
  const [selectedCitaPay, setSelectedCitaPay] = useState(null)
  const [payForm, setPayForm] = useState({
    metodo: 'efectivo_sede',
    monto_recibido: '',
    observacion_pago: '',
  })
  const [submittingPay, setSubmittingPay] = useState(false)

  const [selectedCitaReprog, setSelectedCitaReprog] = useState(null)
  const [reprogForm, setReprogForm] = useState({
    nueva_fecha: '',
    nueva_hora: '09:00',
    id_veterinario: '',
  })
  const [submittingReprog, setSubmittingReprog] = useState(false)

  const [selectedCitaCancel, setSelectedCitaCancel] = useState(null)
  const [motivoCancel, setMotivoCancel] = useState('')
  const [submittingCancel, setSubmittingCancel] = useState(false)

  const [selectedCitaDetail, setSelectedCitaDetail] = useState(null)

  const fetchCitasData = async () => {
    const token = getStoredToken()
    if (!token) {
      navigate('/login')
      return
    }

    try {
      setLoading(true)
      setErrorGlobal('')

      let queryParams = []
      if (filterFecha) queryParams.push(`fecha=${filterFecha}`)
      if (filterStatus !== 'todos') queryParams.push(`id_estado=${filterStatus}`)
      if (filterVet) queryParams.push(`id_veterinario=${filterVet}`)

      const url = `${import.meta.env.VITE_API_URL}/recepcion/citas?${queryParams.join('&')}`

      const [resCitas, resVets] = await Promise.all([
        fetch(url, { headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' } }),
        fetch(`${import.meta.env.VITE_API_URL}/recepcion/veterinarios`, { headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' } }),
      ])

      if (resCitas.status === 401 || resCitas.status === 403) {
        navigate('/login')
        return
      }

      if (resCitas.ok) {
        const dataCitas = await resCitas.json()
        setCitas(dataCitas.citas || [])
      } else {
        setErrorGlobal('No se pudo cargar la lista de citas.')
      }

      if (resVets.ok) {
        const dataVets = await resVets.json()
        setVeterinarios(dataVets.veterinarios || [])
      }
    } catch (err) {
      console.error('Error al cargar citas de recepción:', err)
      setErrorGlobal('Error de conexión con el servidor.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCitasData()
  }, [filterFecha, filterStatus, filterVet, navigate])

  const handleConfirmar = async (idCita) => {
    const token = getStoredToken()
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/recepcion/citas/${idCita}/confirmar`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      })
      const data = await res.json()
      if (res.ok) {
        triggerToast(data.message || 'Cita confirmada exitosamente.', 'success')
        fetchCitasData()
      } else {
        triggerToast(data.message || 'No se pudo confirmar la cita.', 'error')
      }
    } catch (e) {
      console.error('Error al confirmar cita:', e)
      triggerToast('Error de conexión.', 'error')
    }
  }

  const openPagoModal = async (cita) => {
    const token = getStoredToken()
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/recepcion/citas/${cita.id_cita}`, {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      })
      if (res.ok) {
        const data = await res.json()
        const fullCita = data.cita
        setSelectedCitaPay(fullCita)
        setPayForm({
          metodo: fullCita.metodo_pago && fullCita.metodo_pago !== 'eps' ? fullCita.metodo_pago : 'efectivo_sede',
          monto_recibido: fullCita.monto_pago || '',
          observacion_pago: fullCita.pago?.observacion_pago || '',
        })
      } else {
        setSelectedCitaPay(cita)
        setPayForm({ metodo: 'efectivo_sede', monto_recibido: cita.monto_pago || '', observacion_pago: '' })
      }
    } catch (e) {
      setSelectedCitaPay(cita)
      setPayForm({ metodo: 'efectivo_sede', monto_recibido: cita.monto_pago || '', observacion_pago: '' })
    }
  }

  const handleProcesarPago = async (e) => {
    e.preventDefault()
    if (!selectedCitaPay) return

    const token = getStoredToken()
    try {
      setSubmittingPay(true)

      const res = await fetch(`${import.meta.env.VITE_API_URL}/recepcion/citas/${selectedCitaPay.id_cita}/pago`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(payForm),
      })

      const data = await res.json()

      if (res.ok) {
        triggerToast(data.message || 'Cobro registrado exitosamente.', 'success')
        setSelectedCitaPay(null)
        fetchCitasData()
      } else {
        triggerToast(data.message || 'No se pudo procesar el cobro.', 'error')
      }
    } catch (err) {
      console.error('Error al registrar pago:', err)
      triggerToast('Error de conexión con el servidor.', 'error')
    } finally {
      setSubmittingPay(false)
    }
  }

  const handleReprogramar = async (e) => {
    e.preventDefault()
    if (!selectedCitaReprog) return

    const token = getStoredToken()
    try {
      setSubmittingReprog(true)

      const res = await fetch(`${import.meta.env.VITE_API_URL}/recepcion/citas/${selectedCitaReprog.id_cita}/reprogramar`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(reprogForm),
      })

      const data = await res.json()

      if (res.ok) {
        triggerToast(data.message || 'Cita reprogramada exitosamente.', 'success')
        setSelectedCitaReprog(null)
        fetchCitasData()
      } else {
        triggerToast(data.message || 'No se pudo reprogramar la cita.', 'error')
      }
    } catch (err) {
      console.error('Error al reprogramar:', err)
      triggerToast('Error de conexión.', 'error')
    } finally {
      setSubmittingReprog(false)
    }
  }

  const handleCancelar = async (e) => {
    e.preventDefault()
    if (!selectedCitaCancel) return

    const token = getStoredToken()
    try {
      setSubmittingCancel(true)

      const res = await fetch(`${import.meta.env.VITE_API_URL}/recepcion/citas/${selectedCitaCancel.id_cita}/cancelar`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({ motivo_cancelacion: motivoCancel }),
      })

      const data = await res.json()

      if (res.ok) {
        triggerToast(data.message || 'Cita cancelada correctamente.', 'success')
        setSelectedCitaCancel(null)
        setMotivoCancel('')
        fetchCitasData()
      } else {
        triggerToast(data.message || 'No se pudo cancelar la cita.', 'error')
      }
    } catch (err) {
      console.error('Error al cancelar cita:', err)
      triggerToast('Error de conexión.', 'error')
    } finally {
      setSubmittingCancel(false)
    }
  }

  const searchLower = searchTerm.toLowerCase().trim()
  const citasFiltradas = citas.filter((c) => {
    if (!searchLower) return true
    return (
      (c.paciente?.nombre || '').toLowerCase().includes(searchLower) ||
      (c.dueno?.nombre || '').toLowerCase().includes(searchLower) ||
      (c.dueno?.cedula || '').toLowerCase().includes(searchLower) ||
      (c.servicio?.nombre || '').toLowerCase().includes(searchLower) ||
      (c.veterinario?.nombre || '').toLowerCase().includes(searchLower)
    )
  })

  // Cálculo de cambio en vivo para el modal de cobro
  const montoAPagar = selectedCitaPay ? (floatValue(selectedCitaPay.monto_pago) || 35000) : 0
  const montoRecibido = parseFloat(payForm.monto_recibido) || 0
  const cambioDevuelto = Math.max(0, montoRecibido - montoAPagar)
  const esRecibidoInsuficiente = payForm.metodo === 'efectivo_sede' && montoRecibido < montoAPagar

  function floatValue(val) {
    if (val === null || val === undefined) return 0
    return parseFloat(val)
  }

  return (
    <div className="dash">
      <SidebarRecepcion />

      {toast && (
        <div className={`adm-toast ${toast.type === 'error' ? 'adm-toast--error' : ''}`}>
          <i className={`adm-toast__icon fa-solid ${toast.type === 'error' ? 'fa-triangle-exclamation' : 'fa-circle-check'}`}></i>
          <span>{toast.message}</span>
          <button className="adm-toast__close" onClick={() => setToast(null)}>
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>
      )}

      <main className="dash-main">
        <DashboardHeader
          title="Gestión de Citas y Cobros"
          subtitle="Admisión presencial, confirmaciones y recepción de dinero en sede"
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

        {/* ── BARRA DE FILTROS AVANZADOS ── */}
        <div className="vet-tabs-header" style={{ marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div className="vet-status-filters" style={{ width: '100%', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span className="vet-filter-label">Estado:</span>
              <button
                type="button"
                className={`vet-filter-chip ${filterStatus === 'todos' ? 'vet-filter-chip--active' : ''}`}
                onClick={() => setFilterStatus('todos')}
              >
                Todos
              </button>
              <button
                type="button"
                className={`vet-filter-chip ${filterStatus === '1' ? 'vet-filter-chip--active' : ''}`}
                onClick={() => setFilterStatus('1')}
              >
                Pendientes
              </button>
              <button
                type="button"
                className={`vet-filter-chip ${filterStatus === '2' ? 'vet-filter-chip--active' : ''}`}
                onClick={() => setFilterStatus('2')}
              >
                Confirmadas
              </button>
              <button
                type="button"
                className={`vet-filter-chip ${filterStatus === '4' ? 'vet-filter-chip--active' : ''}`}
                onClick={() => setFilterStatus('4')}
              >
                Completadas
              </button>
              <button
                type="button"
                className={`vet-filter-chip ${filterStatus === '3' ? 'vet-filter-chip--active' : ''}`}
                onClick={() => setFilterStatus('3')}
              >
                Canceladas
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div>
                <input
                  type="date"
                  value={filterFecha}
                  onChange={(e) => setFilterFecha(e.target.value)}
                  style={{
                    padding: '0.4rem 0.75rem',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.88rem',
                    color: '#0f172a',
                  }}
                />
              </div>

              <div>
                <select
                  value={filterVet}
                  onChange={(e) => setFilterVet(e.target.value)}
                  style={{
                    padding: '0.4rem 0.75rem',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.88rem',
                    color: '#0f172a',
                    background: '#ffffff',
                  }}
                >
                  <option value="">Todos los médicos</option>
                  {veterinarios.map((v) => (
                    <option key={v.id_veterinario} value={v.id_veterinario}>
                      {v.nombre} ({v.especialidad})
                    </option>
                  ))}
                </select>
              </div>

              {(filterFecha || filterVet || filterStatus !== 'todos') && (
                <button
                  type="button"
                  onClick={() => {
                    setFilterFecha('')
                    setFilterVet('')
                    setFilterStatus('todos')
                  }}
                  style={{
                    background: '#f1f5f9',
                    border: 'none',
                    padding: '0.45rem 0.75rem',
                    borderRadius: '8px',
                    color: '#64748b',
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                  }}
                >
                  <i className="fa-solid fa-xmark"></i> Limpiar
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ── LISTADO DE CITAS ── */}
        <div className="vet-agenda-container">
          {loading ? (
            <div className="vet-loading-box">
              <i className="fa-solid fa-spinner fa-spin"></i>
              <p>Cargando citas médicas...</p>
            </div>
          ) : citasFiltradas.length === 0 ? (
            <div className="vet-empty-box">
              <i className="fa-regular fa-calendar-xmark"></i>
              <h3>No se encontraron citas</h3>
              <p>No existen registros que coincidan con los criterios de búsqueda aplicados.</p>
            </div>
          ) : (
            <div className="vet-day-card">
              <div className="vet-day-header">
                <div className="vet-day-title">
                  <i className="fa-solid fa-list-check" style={{ color: '#2563eb' }}></i>
                  <h3>Listado General de Citas ({citasFiltradas.length})</h3>
                </div>
              </div>

              <div className="vet-citas-list">
                {citasFiltradas.map((cita) => {
                  const isPendiente = cita.id_estado === 1
                  const isConfirmada = cita.id_estado === 2
                  const isAtendida = cita.id_estado === 4
                  const isCancelada = cita.id_estado === 3
                  const isPagoPendiente = cita.estado_pago === 'pendiente'

                  const esWeb = ['web', 'wompi', 'tarjeta', 'pse'].includes(toLowerCaseSafe(cita.metodo_pago))

                  function toLowerCaseSafe(str) {
                    return (str || '').toLowerCase()
                  }

                  return (
                    <div key={cita.id_cita} className="vet-cita-row">
                      {/* Fecha, Hora y Servicio */}
                      <div className="vet-cita-time-block">
                        <span className="vet-cita-time" style={{ fontSize: '0.92rem', color: '#2563eb' }}>
                          <i className="fa-regular fa-calendar"></i> {cita.fecha_formateada || cita.fecha}
                        </span>
                        <span className="vet-cita-time">
                          <i className="fa-regular fa-clock"></i> {cita.hora}
                        </span>
                        <span className="vet-cita-service-badge">
                          {cita.servicio?.nombre || cita.motivo}
                        </span>
                      </div>

                      {/* Paciente */}
                      <div className="vet-cita-pet-info">
                        <img
                          src={
                            cita.paciente?.foto ||
                            'https://res.cloudinary.com/dedroug6v/image/upload/v1783709702/golden_retriever_sonriendo_e1mrkw.jpg'
                          }
                          alt={cita.paciente?.nombre}
                          className="vet-pet-avatar"
                        />
                        <div>
                          <strong className="vet-pet-name">{cita.paciente?.nombre}</strong>
                          <span className="vet-pet-detail">
                            {cita.paciente?.especie} {cita.paciente?.raza ? `• ${cita.paciente.raza}` : ''}
                          </span>
                        </div>
                      </div>

                      {/* Dueño */}
                      <div className="vet-cita-owner-info">
                        <span className="vet-owner-label">Dueño / Solicitante:</span>
                        <strong className="vet-owner-name">{cita.dueno?.nombre}</strong>
                        <span className="vet-owner-phone">
                          <i className="fa-solid fa-id-card"></i> {cita.dueno?.cedula || 'Sin cédula'} | <i className="fa-solid fa-phone"></i> {cita.dueno?.telefono}
                        </span>
                      </div>

                      {/* Estado y Método de Pago */}
                      <div className="vet-cita-status-block">
                        <span
                          className={`vet-badge ${
                            isAtendida
                              ? 'vet-badge--atendida'
                              : isConfirmada
                              ? 'vet-badge--atendida'
                              : isPendiente
                              ? 'vet-badge--pendiente'
                              : 'vet-badge--cancelada'
                          }`}
                        >
                          {cita.estado_nombre || cita.estado}
                        </span>

                        {esWeb ? (
                          <span className="rec-badge-online">
                            <i className="fa-solid fa-globe"></i> Pagado en Web (Wompi)
                          </span>
                        ) : cita.metodo_pago === 'eps' ? (
                          <span className="rec-badge-eps">
                            <i className="fa-solid fa-shield-cat"></i> Cobertura EPS ($0)
                          </span>
                        ) : isPagoPendiente ? (
                          <span className="rec-badge-online" style={{ background: '#fffbeb', color: '#b45309', borderColor: '#fde68a' }}>
                            <i className="fa-solid fa-clock"></i> Cobro Pendiente en Sede
                          </span>
                        ) : (
                          <span className="rec-badge-sede">
                            <i className="fa-solid fa-money-bill-check"></i> Pagado en Sede
                          </span>
                        )}
                      </div>

                      {/* Botones de Acción */}
                      <div className="vet-cita-actions" style={{ flexWrap: 'wrap', gap: '0.4rem' }}>
                        {isPendiente && (
                          <button
                            type="button"
                            className="vet-btn-atender"
                            style={{ background: '#2563eb' }}
                            onClick={() => handleConfirmar(cita.id_cita)}
                            title="Confirmar asistencia presencial"
                          >
                            <i className="fa-solid fa-check"></i>
                            <span>Confirmar</span>
                          </button>
                        )}

                        <button
                          type="button"
                          className="vet-btn-obs"
                          onClick={() => openPagoModal(cita)}
                          style={{ background: isPagoPendiente ? '#ecfdf5' : '#f8fafc', color: isPagoPendiente ? '#047857' : '#334155' }}
                        >
                          <i className="fa-solid fa-cash-register"></i>
                          <span>{isPagoPendiente ? 'Registrar Pago' : 'Ver Cobro'}</span>
                        </button>

                        {!isCancelada && !isAtendida && (
                          <button
                            type="button"
                            className="vet-btn-obs"
                            onClick={() => {
                              setSelectedCitaReprog(cita)
                              setReprogForm({
                                nueva_fecha: cita.fecha,
                                nueva_hora: cita.hora_raw || cita.hora,
                                id_veterinario: cita.veterinario?.id_veterinario || '',
                              })
                            }}
                          >
                            <i className="fa-solid fa-clock-rotate-left"></i>
                            <span>Reagendar</span>
                          </button>
                        )}

                        {!isCancelada && !isAtendida && (
                          <button
                            type="button"
                            className="vet-btn-obs"
                            style={{ color: '#dc2626' }}
                            onClick={() => setSelectedCitaCancel(cita)}
                          >
                            <i className="fa-solid fa-ban"></i>
                            <span>Cancelar</span>
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* ── MODAL REGISTRAR PAGO EN SEDE ── */}
      {selectedCitaPay && (
        <div className="rec-modal-backdrop" onClick={() => setSelectedCitaPay(null)}>
          <div className="rec-modal" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => setSelectedCitaPay(null)}
              style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                background: '#f1f5f9',
                border: 'none',
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                cursor: 'pointer',
                color: '#64748b',
              }}
            >
              <i className="fa-solid fa-xmark"></i>
            </button>

            <h3 className="rec-modal__title">Cobro de Servicio en Sede</h3>
            <p className="rec-modal__subtitle">
              Cita #{selectedCitaPay.id_cita} • {selectedCitaPay.paciente?.nombre} ({selectedCitaPay.dueno?.nombre})
            </p>

            {selectedCitaPay.es_pagado_online ? (
              <div style={{ background: '#eff6ff', padding: '1.25rem', borderRadius: '14px', border: '1px solid #bfdbfe' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#1d4ed8', fontWeight: 700, marginBottom: '0.5rem' }}>
                  <i className="fa-solid fa-globe" style={{ fontSize: '1.2rem' }}></i>
                  <span>Pago Realizado por la Web (Wompi)</span>
                </div>
                <p style={{ margin: 0, fontSize: '0.9rem', color: '#3b82f6', lineHeight: '1.5' }}>
                  Esta cita ya fue pagada en línea por el cliente. No se permite sobreescribir ni volver a cobrar en caja presencial.
                </p>
                <div style={{ marginTop: '0.75rem', fontSize: '0.85rem', color: '#1e40af' }}>
                  <strong>Referencia / Wompi ID:</strong> {selectedCitaPay.pago?.wompi_transaction_id || selectedCitaPay.pago?.referencia_transaccion || 'N/R'}
                </div>
              </div>
            ) : (
              <form onSubmit={handleProcesarPago}>
                <div className="rec-pay-box">
                  <div className="rec-pay-row">
                    <span>Servicio:</span>
                    <strong>{selectedCitaPay.servicio?.nombre || 'Consulta General'}</strong>
                  </div>
                  <div className="rec-pay-row">
                    <span>Médico Asignado:</span>
                    <span>{selectedCitaPay.veterinario?.nombre || 'Por asignar'}</span>
                  </div>
                  <div className="rec-pay-row rec-pay-row--total">
                    <span>Total a Pagar:</span>
                    <strong style={{ color: '#2563eb' }}>
                      $ {numberFormat(montoAPagar)}
                    </strong>
                  </div>
                </div>

                <div style={{ marginBottom: '1.25rem' }}>
                  <label style={{ display: 'block', fontWeight: 600, fontSize: '0.9rem', color: '#0f172a', marginBottom: '0.4rem' }}>
                    Método de Pago Presencial:
                  </label>
                  <select
                    value={payForm.metodo}
                    onChange={(e) => setPayForm({ ...payForm, metodo: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.85rem',
                      borderRadius: '10px',
                      border: '1.5px solid #cbd5e1',
                      fontSize: '0.95rem',
                      color: '#0f172a',
                      background: '#ffffff',
                    }}
                  >
                    <option value="efectivo_sede">Efectivo (Sede Presencial)</option>
                    <option value="datafono">Datáfono / Tarjeta Débito/Crédito Sede</option>
                    <option value="eps">Cobertura Plan EPS (Copago $0)</option>
                  </select>
                </div>

                {payForm.metodo === 'efectivo_sede' && (
                  <div style={{ marginBottom: '1.25rem' }}>
                    <label style={{ display: 'block', fontWeight: 600, fontSize: '0.9rem', color: '#0f172a', marginBottom: '0.4rem' }}>
                      Monto Recibido en Efectivo ($):
                    </label>
                    <input
                      type="number"
                      step="500"
                      min="0"
                      value={payForm.monto_recibido}
                      onChange={(e) => setPayForm({ ...payForm, monto_recibido: e.target.value })}
                      placeholder="Ej. 50000"
                      style={{
                        width: '100%',
                        padding: '0.65rem 0.85rem',
                        borderRadius: '10px',
                        border: '1.5px solid #cbd5e1',
                        fontSize: '1rem',
                        fontWeight: 600,
                        color: '#0f172a',
                        boxSizing: 'border-box',
                      }}
                      required
                    />

                    {/* Caja de Cálculo en Vivo de Cambio Devuelto */}
                    <div className={`rec-cambio-box ${esRecibidoInsuficiente ? 'rec-cambio-box--insufficient' : ''}`}>
                      <span className="rec-cambio-lbl" style={{ color: esRecibidoInsuficiente ? '#9f1239' : '#065f46' }}>
                        {esRecibidoInsuficiente ? '¡Monto insuficiente!' : 'Cambio / Devolución a entregar:'}
                      </span>
                      <span className="rec-cambio-val" style={{ color: esRecibidoInsuficiente ? '#be123c' : '#047857' }}>
                        $ {numberFormat(cambioDevuelto)}
                      </span>
                    </div>
                  </div>
                )}

                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', fontWeight: 600, fontSize: '0.88rem', color: '#475569', marginBottom: '0.4rem' }}>
                    Observación / Nota de Caja (Opcional):
                  </label>
                  <input
                    type="text"
                    value={payForm.observacion_pago}
                    onChange={(e) => setPayForm({ ...payForm, observacion_pago: e.target.value })}
                    placeholder="Ej. Entregó billete de $50.000, cliente satisfecho"
                    style={{
                      width: '100%',
                      padding: '0.55rem 0.85rem',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.88rem',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    onClick={() => setSelectedCitaPay(null)}
                    style={{
                      padding: '0.65rem 1.25rem',
                      borderRadius: '10px',
                      border: 'none',
                      background: '#f1f5f9',
                      color: '#475569',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={submittingPay || esRecibidoInsuficiente}
                    style={{
                      padding: '0.65rem 1.4rem',
                      borderRadius: '10px',
                      border: 'none',
                      background: esRecibidoInsuficiente ? '#94a3b8' : '#059669',
                      color: '#ffffff',
                      fontWeight: 600,
                      cursor: submittingPay || esRecibidoInsuficiente ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {submittingPay ? 'Procesando...' : 'Confirmar Cobro y Facturar'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ── MODAL REPROGRAMAR CITA ── */}
      {selectedCitaReprog && (
        <div className="rec-modal-backdrop" onClick={() => setSelectedCitaReprog(null)}>
          <div className="rec-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="rec-modal__title">Reagendar Cita Médica</h3>
            <p className="rec-modal__subtitle">
              Cambiar fecha, hora o especialista para la cita #{selectedCitaReprog.id_cita}
            </p>

            <form onSubmit={handleReprogramar}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.9rem', color: '#0f172a', marginBottom: '0.4rem' }}>
                  Nueva Fecha:
                </label>
                <input
                  type="date"
                  value={reprogForm.nueva_fecha}
                  onChange={(e) => setReprogForm({ ...reprogForm, nueva_fecha: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.6rem 0.85rem',
                    borderRadius: '8px',
                    border: '1.5px solid #cbd5e1',
                    fontSize: '0.95rem',
                    boxSizing: 'border-box',
                  }}
                  required
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.9rem', color: '#0f172a', marginBottom: '0.4rem' }}>
                  Nueva Hora:
                </label>
                <input
                  type="time"
                  value={reprogForm.nueva_hora}
                  onChange={(e) => setReprogForm({ ...reprogForm, nueva_hora: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.6rem 0.85rem',
                    borderRadius: '8px',
                    border: '1.5px solid #cbd5e1',
                    fontSize: '0.95rem',
                    boxSizing: 'border-box',
                  }}
                  required
                />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.9rem', color: '#0f172a', marginBottom: '0.4rem' }}>
                  Médico Veterinario:
                </label>
                <select
                  value={reprogForm.id_veterinario}
                  onChange={(e) => setReprogForm({ ...reprogForm, id_veterinario: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.6rem 0.85rem',
                    borderRadius: '8px',
                    border: '1.5px solid #cbd5e1',
                    fontSize: '0.95rem',
                    background: '#ffffff',
                    boxSizing: 'border-box',
                  }}
                >
                  <option value="">Mantener especialista actual</option>
                  {veterinarios.map((v) => (
                    <option key={v.id_veterinario} value={v.id_veterinario}>
                      {v.nombre} ({v.especialidad})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setSelectedCitaReprog(null)}
                  style={{
                    padding: '0.6rem 1.2rem',
                    borderRadius: '8px',
                    border: 'none',
                    background: '#f1f5f9',
                    color: '#475569',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submittingReprog}
                  style={{
                    padding: '0.6rem 1.3rem',
                    borderRadius: '8px',
                    border: 'none',
                    background: '#2563eb',
                    color: '#ffffff',
                    fontWeight: 600,
                    cursor: submittingReprog ? 'wait' : 'pointer',
                  }}
                >
                  {submittingReprog ? 'Guardando...' : 'Guardar Reagendamiento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL CANCELAR CITA ── */}
      {selectedCitaCancel && (
        <div className="rec-modal-backdrop" onClick={() => setSelectedCitaCancel(null)}>
          <div className="rec-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="rec-modal__title" style={{ color: '#dc2626' }}>Cancelar Cita Médica</h3>
            <p className="rec-modal__subtitle">
              ¿Estás seguro de cancelar la cita #{selectedCitaCancel.id_cita} de {selectedCitaCancel.paciente?.nombre}?
            </p>

            <form onSubmit={handleCancelar}>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.88rem', color: '#475569', marginBottom: '0.4rem' }}>
                  Motivo de la Cancelación (Opcional):
                </label>
                <textarea
                  rows={3}
                  value={motivoCancel}
                  onChange={(e) => setMotivoCancel(e.target.value)}
                  placeholder="Ej. El tutor se comunicó para informar que no asistirá..."
                  style={{
                    width: '100%',
                    padding: '0.6rem 0.85rem',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.9rem',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setSelectedCitaCancel(null)}
                  style={{
                    padding: '0.6rem 1.2rem',
                    borderRadius: '8px',
                    border: 'none',
                    background: '#f1f5f9',
                    color: '#475569',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Volver
                </button>
                <button
                  type="submit"
                  disabled={submittingCancel}
                  style={{
                    padding: '0.6rem 1.3rem',
                    borderRadius: '8px',
                    border: 'none',
                    background: '#dc2626',
                    color: '#ffffff',
                    fontWeight: 600,
                    cursor: submittingCancel ? 'wait' : 'pointer',
                  }}
                >
                  {submittingCancel ? 'Cancelando...' : 'Confirmar Cancelación'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

function numberFormat(val) {
  return new Intl.NumberFormat('es-CO').format(val || 0)
}
