import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getStoredToken, getStoredUser, isValidAvatarUrl } from '../../utils/authStorage'
import SidebarRecepcion from '../ui/SidebarRecepcion'
import DashboardHeader from '../ui/DashboardHeader'
import './DashboardClient.css'
import './DashboardVeterinario.css'
import './DashboardRecepcion.css'

export default function RecepcionFormulas() {
  const navigate = useNavigate()
  const storedUser = getStoredUser()

  const [usuario, setUsuario] = useState({
    nombre: storedUser?.nombre || 'Laura Ramírez',
    nombreCompleto: storedUser?.nombre || 'Laura Ramírez - Recepción Sede',
    foto: isValidAvatarUrl(storedUser?.foto || storedUser?.foto_perfil) ? (storedUser?.foto || storedUser?.foto_perfil) : null,
    rol: 'recepcionista',
    email: storedUser?.email || 'recepcion@petfeliz.com',
  })

  const [citasCompletadas, setCitasCompletadas] = useState([])
  const [loading, setLoading] = useState(true)
  const [errorGlobal, setErrorGlobal] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [printingId, setPrintingId] = useState(null)
  const [toast, setToast] = useState(null)

  const triggerToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 4000)
  }

  const fetchFormulas = async () => {
    const token = getStoredToken()
    if (!token) {
      navigate('/login')
      return
    }

    try {
      setLoading(true)
      setErrorGlobal('')

      const res = await fetch(`${import.meta.env.VITE_API_URL}/recepcion/citas?id_estado=4`, {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      })

      if (res.status === 401 || res.status === 403) {
        navigate('/login')
        return
      }

      if (res.ok) {
        const data = await res.json()
        const completadasConMeds = (data.citas || []).filter((c) => {
          return c.medicamentos && Array.isArray(c.medicamentos) && c.medicamentos.length > 0
        })
        setCitasCompletadas(completadasConMeds)
      } else {
        setErrorGlobal('No se pudo obtener el listado de fórmulas médicas.')
      }
    } catch (err) {
      console.error('Error al cargar fórmulas:', err)
      setErrorGlobal('Error de conexión con el servidor.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchFormulas()
  }, [navigate])

  const handleImprimirFormula = async (idCita) => {
    const token = getStoredToken()
    try {
      setPrintingId(idCita)

      const res = await fetch(`${import.meta.env.VITE_API_URL}/recepcion/citas/${idCita}/formula`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        triggerToast(data.message || 'No se pudo generar el documento PDF de la fórmula.', 'error')
        return
      }

      const blob = await res.blob()
      const pdfUrl = URL.createObjectURL(blob)

      // Abrir en nueva ventana e invocar impresión del navegador
      const win = window.open(pdfUrl, '_blank')
      if (win) {
        win.focus()
      } else {
        triggerToast('Ventana emergente bloqueada por el navegador. Se inició descarga directa.', 'info')
        const link = document.createElement('a')
        link.href = pdfUrl
        link.download = `formula_medica_cita_${idCita}.pdf`
        link.click()
      }
    } catch (e) {
      console.error('Error al imprimir fórmula:', e)
      triggerToast('Error de conexión al generar PDF.', 'error')
    } finally {
      setPrintingId(null)
    }
  }

  const searchLower = searchTerm.toLowerCase().trim()
  const citasFiltradas = citasCompletadas.filter((c) => {
    if (!searchLower) return true
    return (
      (c.paciente?.nombre || '').toLowerCase().includes(searchLower) ||
      (c.dueno?.nombre || '').toLowerCase().includes(searchLower) ||
      (c.dueno?.cedula || '').toLowerCase().includes(searchLower) ||
      (c.veterinario?.nombre || '').toLowerCase().includes(searchLower)
    )
  })

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
          title="Impresión de Fórmulas Médicas"
          subtitle="Generación y descarga oficial de recetas prescritas por los médicos veterinarios"
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

        {loading ? (
          <div className="vet-loading-box">
            <i className="fa-solid fa-spinner fa-spin"></i>
            <p>Cargando fórmulas médicas disponibles...</p>
          </div>
        ) : citasFiltradas.length === 0 ? (
          <div className="vet-empty-box">
            <i className="fa-solid fa-prescription-bottle-medical"></i>
            <h3>No hay fórmulas médicas para imprimir</h3>
            <p>No existen atenciones recientes con recetas o medicamentos ordenados.</p>
          </div>
        ) : (
          <div className="vet-day-card">
            <div className="vet-day-header">
              <div className="vet-day-title">
                <i className="fa-solid fa-file-prescription" style={{ color: '#059669' }}></i>
                <h3>Fórmulas Médicas Disponibles ({citasFiltradas.length})</h3>
              </div>
            </div>

            <div className="vet-citas-list">
              {citasFiltradas.map((c) => (
                <div key={c.id_cita} className="vet-cita-row">
                  <div className="vet-cita-time-block">
                    <span className="vet-cita-time">
                      <i className="fa-regular fa-calendar"></i> {c.fecha_formateada || c.fecha}
                    </span>
                    <span className="vet-cita-service-badge" style={{ background: '#ecfdf5', color: '#047857' }}>
                      Cita #{c.id_cita}
                    </span>
                  </div>

                  <div className="vet-cita-pet-info">
                    <img
                      src={
                        c.paciente?.foto ||
                        'https://res.cloudinary.com/dedroug6v/image/upload/v1783709702/golden_retriever_sonriendo_e1mrkw.jpg'
                      }
                      alt={c.paciente?.nombre}
                      className="vet-pet-avatar"
                    />
                    <div>
                      <strong className="vet-pet-name">{c.paciente?.nombre}</strong>
                      <span className="vet-pet-detail">
                        {c.paciente?.especie} {c.paciente?.raza ? `• ${c.paciente.raza}` : ''}
                      </span>
                    </div>
                  </div>

                  <div className="vet-cita-owner-info">
                    <span className="vet-owner-label">Tutor & Médico:</span>
                    <strong className="vet-owner-name">{c.dueno?.nombre}</strong>
                    <span className="vet-owner-phone">
                      <i className="fa-solid fa-user-doctor"></i> {c.veterinario?.nombre || 'Dr. Veterinario'}
                    </span>
                  </div>

                  <div style={{ flex: 1, padding: '0 0.5rem' }}>
                    <span className="vet-owner-label">Medicamentos Recetados ({c.medicamentos.length}):</span>
                    <div style={{ fontSize: '0.84rem', color: '#334155', fontWeight: 600 }}>
                      {c.medicamentos.map((m) => m.nombre).join(', ')}
                    </div>
                  </div>

                  <div className="vet-cita-actions">
                    <button
                      type="button"
                      className="vet-btn-atender"
                      style={{ background: '#059669' }}
                      disabled={printingId === c.id_cita}
                      onClick={() => handleImprimirFormula(c.id_cita)}
                    >
                      <i className={printingId === c.id_cita ? 'fa-solid fa-spinner fa-spin' : 'fa-solid fa-print'}></i>
                      <span>{printingId === c.id_cita ? 'Generando PDF...' : 'Imprimir Fórmula'}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
