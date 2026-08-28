import React, { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import DashboardHeader from '../ui/DashboardHeader'
import CustomDatePicker from '../ui/CustomDatePicker'
import SidebarClient from '../ui/SidebarClient'
import './MisCitas.css'
import './DashboardClient.css'


function MisCitas() {
  const location = useLocation()
  const navigate = useNavigate()

  const [activeTab, setActiveTab] = useState('proximas') // 'proximas' | 'pasadas' | 'canceladas'
  const [usuario, setUsuario] = useState({ nombre: '', foto: '' })
  const [mascotas, setMascotas] = useState([])
  const [servicios, setServicios] = useState([])
  const [citas, setCitas] = useState({ proximas: [], pasadas: [], canceladas: [] })

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Modales
  const [showAgendarModal, setShowAgendarModal] = useState(false)
  const [showReprogramarModal, setShowReprogramarModal] = useState(false)
  const [showCancelarModal, setShowCancelarModal] = useState(false)
  const [showDetalleModal, setShowDetalleModal] = useState(false)

  const [selectedCita, setSelectedCita] = useState(null)

  // Formulario Agendar Cita
  const [agendarForm, setAgendarForm] = useState({
    id_mascota: '',
    id_servicio: '',
    fecha: '',
    hora: '10:00 AM',
    observacion: '',
  })

  // Formulario Reprogramar Cita
  const [reprogramarForm, setReprogramarForm] = useState({
    fecha: '',
    hora: '10:00 AM',
  })

  const [submitting, setSubmitting] = useState(false)
  const [modalError, setModalError] = useState('')

  const horasDisponibles = [
    '08:00 AM',
    '09:00 AM',
    '10:00 AM',
    '11:00 AM',
    '02:00 PM',
    '03:00 PM',
    '04:00 PM',
    '05:00 PM',
  ]

  // Cargar datos iniciales (Perfil, Citas, Mascotas y Servicios)
  const loadData = async () => {
    const token = localStorage.getItem('token')
    if (!token) {
      navigate('/login')
      return
    }

    try {
      setLoading(true)
      // 1. Perfil
      const resUser = await fetch(`${import.meta.env.VITE_API_URL}/me`, {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      })
      if (resUser.ok) {
        const uData = await resUser.json()
        setUsuario(uData)
      }

      // 2. Mascotas (para agendar cita)
      const resPets = await fetch(`${import.meta.env.VITE_API_URL}/mascotas`, {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      })
      if (resPets.ok) {
        const pData = await resPets.json()
        setMascotas(pData)
        if (pData.length > 0 && !agendarForm.id_mascota) {
          setAgendarForm((prev) => ({ ...prev, id_mascota: pData[0].id }))
        }
      }

      // 3. Servicios (para agendar cita)
      const resSrv = await fetch(`${import.meta.env.VITE_API_URL}/servicios`, {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      })
      if (resSrv.ok) {
        const sData = await resSrv.json()
        setServicios(sData)
        if (sData.length > 0 && !agendarForm.id_servicio) {
          setAgendarForm((prev) => ({ ...prev, id_servicio: sData[0].id_servicio }))
        }
      }

      // 4. Citas
      const resCitas = await fetch(`${import.meta.env.VITE_API_URL}/citas`, {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      })
      if (resCitas.ok) {
        const cData = await resCitas.json()
        setCitas({
          proximas: cData.proximas || [],
          pasadas: cData.pasadas || [],
          canceladas: cData.canceladas || [],
        })
      }
    } catch (err) {
      console.error('Error al cargar citas:', err)
      setError('Ocurrió un error al cargar la información de citas.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // Agendar nueva cita
  const handleAgendarSubmit = async (e) => {
    e.preventDefault()
    setModalError('')

    if (!agendarForm.id_mascota) {
      setModalError('Debes seleccionar una mascota.')
      return
    }
    if (!agendarForm.fecha) {
      setModalError('Debes seleccionar la fecha de la cita.')
      return
    }

    const token = localStorage.getItem('token')
    try {
      setSubmitting(true)
      const res = await fetch(`${import.meta.env.VITE_API_URL}/citas`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
        body: JSON.stringify(agendarForm),
      })

      const data = await res.json()
      if (!res.ok) {
        setModalError(data.message || 'No se pudo agendar la cita.')
        return
      }

      setShowAgendarModal(false)
      loadData()
    } catch (err) {
      console.error('Error al agendar cita:', err)
      setModalError('Ocurrió un fallo en la conexión al agendar la cita.')
    } finally {
      setSubmitting(false)
    }
  }

  // Abrir modal de reprogramación
  const openReprogramarModal = (cita) => {
    setSelectedCita(cita)
    setReprogramarForm({
      fecha: cita.fecha || '',
      hora: cita.hora || '10:00 AM',
    })
    setModalError('')
    setShowReprogramarModal(true)
  }

  // Reprogramar cita
  const handleReprogramarSubmit = async (e) => {
    e.preventDefault()
    setModalError('')

    if (!reprogramarForm.fecha) {
      setModalError('Selecciona la nueva fecha para la cita.')
      return
    }

    const token = localStorage.getItem('token')
    try {
      setSubmitting(true)
      const res = await fetch(`${import.meta.env.VITE_API_URL}/citas/${selectedCita.id}/reprogramar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
        body: JSON.stringify(reprogramarForm),
      })

      const data = await res.json()
      if (!res.ok) {
        setModalError(data.message || 'No se pudo reprogramar la cita.')
        return
      }

      setShowReprogramarModal(false)
      loadData()
    } catch (err) {
      console.error('Error al reprogramar:', err)
      setModalError('Ocurrió un fallo de red al reprogramar.')
    } finally {
      setSubmitting(false)
    }
  }

  // Abrir modal de cancelación
  const openCancelarModal = (cita) => {
    setSelectedCita(cita)
    setShowCancelarModal(true)
  }

  // Cancelar cita
  const handleCancelarSubmit = async () => {
    const token = localStorage.getItem('token')
    try {
      setSubmitting(true)
      const res = await fetch(`${import.meta.env.VITE_API_URL}/citas/${selectedCita.id}/cancelar`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      })

      if (res.ok) {
        setShowCancelarModal(false)
        loadData()
      }
    } catch (err) {
      console.error('Error al cancelar cita:', err)
    } finally {
      setSubmitting(false)
    }
  }

  // Citas del tab actual
  const currentList = citas[activeTab] || []

  return (
    <div className="dash">
      <SidebarClient />


      {/* ── MAIN CONTENT ── */}
      <main className="citas-main">
        <DashboardHeader
          title="Citas"
          subtitle="Consulta y gestiona las citas de tus mascotas"
          usuario={usuario}
          onUserUpdated={setUsuario}
          extraActions={
            citas.proximas.length > 0 ? (
              <button type="button" className="btn-agendar-cita" onClick={() => navigate('/agendar-cita')}>
                <i className="fa-solid fa-plus"></i>
                <span>Agendar Nueva Cita</span>
              </button>
            ) : null
          }
        />

        <div className="citas-card-box">
          {/* Tabs de Filtro */}
          <div className="citas-tabs-bar">
            <button
              type="button"
              className={`citas-tab-btn ${activeTab === 'proximas' ? 'citas-tab-btn--active' : ''}`}
              onClick={() => setActiveTab('proximas')}
            >
              <span>Próximas</span>
              <span className="citas-tab-badge">{citas.proximas.length}</span>
            </button>

            <button
              type="button"
              className={`citas-tab-btn ${activeTab === 'pasadas' ? 'citas-tab-btn--active' : ''}`}
              onClick={() => setActiveTab('pasadas')}
            >
              <span>Pasadas</span>
              <span className="citas-tab-badge">{citas.pasadas.length}</span>
            </button>

            <button
              type="button"
              className={`citas-tab-btn ${activeTab === 'canceladas' ? 'citas-tab-btn--active' : ''}`}
              onClick={() => setActiveTab('canceladas')}
            >
              <span>Canceladas</span>
              <span className="citas-tab-badge">{citas.canceladas.length}</span>
            </button>
          </div>

          {/* Listado o Estado Vacío */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem 0', color: '#94a3b8' }}>
              <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: '1.8rem', color: '#059669', marginBottom: '0.5rem' }}></i>
              <p>Cargando citas...</p>
            </div>
          ) : currentList.length === 0 ? (
            <div className="citas-empty-state">
              <div className="citas-empty-icon-wrap">
                <i className="fa-regular fa-calendar-check"></i>
              </div>
              <h3 className="citas-empty-title">
                {activeTab === 'proximas' && 'No tienes citas agendadas'}
                {activeTab === 'pasadas' && 'No tienes citas pasadas'}
                {activeTab === 'canceladas' && 'No tienes citas canceladas'}
              </h3>
              <p className="citas-empty-subtitle">
                Agenda una cita para tu mascota y lleva su control médico al día con el mejor equipo veterinario.
              </p>
              <button type="button" className="btn-agendar-cita" onClick={() => navigate('/agendar-cita')}>
                <i className="fa-solid fa-plus"></i>
                <span>Agendar Cita</span>
              </button>

            </div>
          ) : (
            <div className="citas-list">
              {currentList.map((cita) => (
                <div key={cita.id} className="cita-card">
                  <div className="cita-card__left">
                    <img
                      src={cita.mascota?.foto || 'https://res.cloudinary.com/dedroug6v/image/upload/v1/mascotas/default_pet.jpg'}
                      alt={cita.mascota?.nombre || 'Mascota'}
                      className="cita-card__pet-avatar"
                    />
                    <div className="cita-card__info">
                      <div className="cita-card__header-row">
                        <span className="cita-card__pet-name">{cita.mascota?.nombre || 'Mascota'}</span>
                        <span style={{ color: '#cbd5e1' }}>•</span>
                        <span className="cita-card__service-name">{cita.servicioNombre}</span>
                        <span
                          className={`cita-badge ${
                            cita.estado === 'Confirmada'
                              ? 'cita-badge--confirmada'
                              : cita.estado === 'Cancelada'
                              ? 'cita-badge--cancelada'
                              : 'cita-badge--pendiente'
                          }`}
                        >
                          {cita.estado}
                        </span>
                      </div>

                      <div className="cita-card__details">
                        <span className="cita-card__detail-item">
                          <i className="fa-regular fa-calendar"></i>
                          {cita.fecha}
                        </span>
                        <span className="cita-card__detail-item">
                          <i className="fa-regular fa-clock"></i>
                          {cita.hora}
                        </span>
                        {cita.veterinario && (
                          <span className="cita-card__detail-item">
                            <i className="fa-solid fa-user-doctor"></i>
                            {cita.veterinario.nombre}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="cita-card__actions">
                    <button
                      type="button"
                      className="btn-action-sm btn-action-sm--secondary"
                      onClick={() => { setSelectedCita(cita); setShowDetalleModal(true) }}
                    >
                      <i className="fa-regular fa-eye"></i> Ver detalle
                    </button>

                    {activeTab === 'proximas' && (
                      <>
                        <button
                          type="button"
                          className="btn-action-sm btn-action-sm--outline"
                          onClick={() => openReprogramarModal(cita)}
                        >
                          <i className="fa-regular fa-calendar-pen"></i> Reprogramar
                        </button>
                        <button
                          type="button"
                          className="btn-action-sm btn-action-sm--danger"
                          onClick={() => openCancelarModal(cita)}
                        >
                          <i className="fa-regular fa-circle-xmark"></i> Cancelar
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* ── MODAL 1: AGENDAR NUEVA CITA ── */}
      {showAgendarModal && (
        <div className="dh-modal-backdrop">
          <div className="dh-modal-box dh-modal-box--wide">
            <div className="dh-modal-header">
              <h3>Agendar Nueva Cita</h3>
              <button type="button" className="dh-modal-close" onClick={() => setShowAgendarModal(false)}>
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            {modalError && <div className="dh-modal-alert dh-modal-alert--error">{modalError}</div>}

            <form onSubmit={handleAgendarSubmit} className="dh-profile-form">
              <div className="dh-info-grid">
                <div className="dh-form-field">
                  <label>Mascota *</label>
                  <select
                    required
                    value={agendarForm.id_mascota}
                    onChange={(e) => setAgendarForm({ ...agendarForm, id_mascota: e.target.value })}
                  >
                    {mascotas.length === 0 ? (
                      <option value="">No tienes mascotas registradas</option>
                    ) : (
                      mascotas.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.nombre} ({m.especie})
                        </option>
                      ))
                    )}
                  </select>
                </div>

                <div className="dh-form-field">
                  <label>Tipo de Servicio *</label>
                  <select
                    required
                    value={agendarForm.id_servicio}
                    onChange={(e) => setAgendarForm({ ...agendarForm, id_servicio: e.target.value })}
                  >
                    {servicios.map((s) => (
                      <option key={s.id_servicio} value={s.id_servicio}>
                        {s.nombre} {s.precio_base ? `- $${parseInt(s.precio_base).toLocaleString()}` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="dh-form-field">
                  <label>Fecha de la Cita *</label>
                  <CustomDatePicker
                    value={agendarForm.fecha}
                    onChange={(val) => setAgendarForm({ ...agendarForm, fecha: val })}
                    placeholder="Selecciona fecha..."
                  />
                </div>

                <div className="dh-form-field">
                  <label>Hora Preferida *</label>
                  <select
                    value={agendarForm.hora}
                    onChange={(e) => setAgendarForm({ ...agendarForm, hora: e.target.value })}
                  >
                    {horasDisponibles.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="dh-form-field dh-form-field--full">
                  <label>Notas / Motivo Adicional</label>
                  <input
                    type="text"
                    placeholder="ej. Presenta estornudos desde ayer / vacunación anual"
                    value={agendarForm.observacion}
                    onChange={(e) => setAgendarForm({ ...agendarForm, observacion: e.target.value })}
                  />
                </div>
              </div>

              <div className="dh-modal-footer">
                <button type="button" className="dh-btn-secondary" onClick={() => setShowAgendarModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="dh-btn-primary" disabled={submitting}>
                  {submitting ? 'Confirmando...' : 'Confirmar Cita'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL 2: REPROGRAMAR CITA ── */}
      {showReprogramarModal && selectedCita && (
        <div className="dh-modal-backdrop">
          <div className="dh-modal-box">
            <div className="dh-modal-header">
              <h3>Reprogramar Cita</h3>
              <button type="button" className="dh-modal-close" onClick={() => setShowReprogramarModal(false)}>
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            {modalError && <div className="dh-modal-alert dh-modal-alert--error">{modalError}</div>}

            <form onSubmit={handleReprogramarSubmit} className="dh-profile-form">
              <div style={{ marginBottom: '1rem', fontSize: '0.88rem', color: '#475569' }}>
                Reprogramando cita de <strong>{selectedCita.mascota?.nombre}</strong> para{' '}
                <strong>{selectedCita.servicioNombre}</strong>.
              </div>

              <div className="dh-form-field" style={{ marginBottom: '1rem' }}>
                <label>Nueva Fecha *</label>
                <CustomDatePicker
                  value={reprogramarForm.fecha}
                  onChange={(val) => setReprogramarForm({ ...reprogramarForm, fecha: val })}
                  placeholder="Selecciona nueva fecha..."
                />
              </div>

              <div className="dh-form-field" style={{ marginBottom: '1.5rem' }}>
                <label>Nueva Hora *</label>
                <select
                  value={reprogramarForm.hora}
                  onChange={(e) => setReprogramarForm({ ...reprogramarForm, hora: e.target.value })}
                >
                  {horasDisponibles.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </div>

              <div className="dh-modal-footer">
                <button type="button" className="dh-btn-secondary" onClick={() => setShowReprogramarModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="dh-btn-primary" disabled={submitting}>
                  {submitting ? 'Guardando...' : 'Guardar Nueva Fecha'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL 3: CANCELAR CITA ── */}
      {showCancelarModal && selectedCita && (
        <div className="dh-modal-backdrop">
          <div className="dh-modal-box">
            <div className="dh-modal-header">
              <h3>Confirmar Cancelación</h3>
              <button type="button" className="dh-modal-close" onClick={() => setShowCancelarModal(false)}>
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <p style={{ fontSize: '0.9rem', color: '#334155', lineHeight: '1.5', margin: '1rem 0' }}>
              ¿Estás seguro de que deseas cancelar la cita de <strong>{selectedCita.mascota?.nombre}</strong> para el día{' '}
              <strong>{selectedCita.fecha}</strong> a las <strong>{selectedCita.hora}</strong>?
            </p>

            <div className="dh-modal-footer">
              <button type="button" className="dh-btn-secondary" onClick={() => setShowCancelarModal(false)}>
                Volver
              </button>
              <button type="button" className="dh-btn-danger" onClick={handleCancelarSubmit} disabled={submitting}>
                {submitting ? 'Cancelando...' : 'Sí, Cancelar Cita'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL 4: VER DETALLE DE CITA ── */}
      {showDetalleModal && selectedCita && (
        <div className="dh-modal-backdrop">
          <div className="dh-modal-box">
            <div className="dh-modal-header">
              <h3>Detalle de la Cita</h3>
              <button type="button" className="dh-modal-close" onClick={() => setShowDetalleModal(false)}>
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <div className="modal-detail-grid">
              <div className="modal-detail-item">
                <span className="modal-detail-label">Mascota</span>
                <span className="modal-detail-value">{selectedCita.mascota?.nombre || 'No asignado'}</span>
              </div>
              <div className="modal-detail-item">
                <span className="modal-detail-label">Servicio</span>
                <span className="modal-detail-value">{selectedCita.servicioNombre}</span>
              </div>
              <div className="modal-detail-item">
                <span className="modal-detail-label">Fecha</span>
                <span className="modal-detail-value">{selectedCita.fecha}</span>
              </div>
              <div className="modal-detail-item">
                <span className="modal-detail-label">Hora</span>
                <span className="modal-detail-value">{selectedCita.hora}</span>
              </div>
              <div className="modal-detail-item">
                <span className="modal-detail-label">Veterinario</span>
                <span className="modal-detail-value">{selectedCita.veterinario?.nombre || 'Dra. Laura Martínez'}</span>
              </div>
              <div className="modal-detail-item">
                <span className="modal-detail-label">Estado</span>
                <span className="modal-detail-value">{selectedCita.estado}</span>
              </div>
            </div>

            {selectedCita.observacion && (
              <div style={{ marginBottom: '1.25rem', fontSize: '0.85rem', color: '#475569' }}>
                <strong>Observaciones:</strong>
                <p style={{ marginTop: '0.25rem', color: '#64748b' }}>{selectedCita.observacion}</p>
              </div>
            )}

            <div className="dh-modal-footer">
              <button type="button" className="dh-btn-primary" onClick={() => setShowDetalleModal(false)}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default MisCitas
