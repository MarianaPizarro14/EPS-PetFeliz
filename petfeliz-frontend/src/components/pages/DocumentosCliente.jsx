import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import SidebarClient from '../ui/SidebarClient'
import DashboardHeader from '../ui/DashboardHeader'
import './DashboardClient.css'
import './DocumentosCliente.css'

import { useUser } from '../../context/UserContext'

export default function DocumentosCliente() {
  const navigate = useNavigate()
  const { usuario, setUsuario } = useUser()

  const [mascotas, setMascotas] = useState([])
  const [pagos, setPagos] = useState([])

  // Selecciones para descargas por mascota
  const [selectedMascotaHistorial, setSelectedMascotaHistorial] = useState('')
  const [selectedMascotaVacuna, setSelectedMascotaVacuna] = useState('')

  const [loading, setLoading] = useState(true)
  const [downloadingType, setDownloadingType] = useState('')
  const [cardMessages, setCardMessages] = useState({})
  const [errorGlobal, setErrorGlobal] = useState('')

  useEffect(() => {
    const fetchDatos = async () => {
      const token = localStorage.getItem('token')
      if (!token) {
        navigate('/login')
        return
      }

      try {
        setLoading(true)
        setErrorGlobal('')

        const headers = { Authorization: `Bearer ${token}`, Accept: 'application/json' }
        const [resMasc, resPagos] = await Promise.all([
          fetch(`${import.meta.env.VITE_API_URL}/mascotas`, { headers }),
          fetch(`${import.meta.env.VITE_API_URL}/cliente/pagos`, { headers }),
        ])

        if (resMasc.status === 401 || resPagos.status === 401) {
          localStorage.removeItem('token')
          localStorage.removeItem('user')
          navigate('/login')
          return
        }

        if (resMasc.ok) {
          const mData = await resMasc.json()
          const listMascotas = Array.isArray(mData) ? mData : []
          setMascotas(listMascotas)
          if (listMascotas.length > 0) {
            const firstId = String(listMascotas[0].id || listMascotas[0].id_mascota || '')
            setSelectedMascotaHistorial(firstId)
            setSelectedMascotaVacuna(firstId)
          }
        }

        if (resPagos.ok) {
          const pData = await resPagos.json()
          setPagos(Array.isArray(pData) ? pData : [])
        }
      } catch (err) {
        console.error('Error al cargar datos del centro de documentos:', err)
        setErrorGlobal('Ocurrió un fallo al comunicarse con el servidor.')
      } finally {
        setLoading(false)
      }
    }

    fetchDatos()
  }, [navigate])

  // Helper para descargar PDF vía Blob o manejar respuestas 404 / sin datos
  const handleDescargarPdf = async (url, defaultFilename, typeKey) => {
    const token = localStorage.getItem('token')
    if (!token) return

    try {
      setDownloadingType(typeKey)
      setCardMessages((prev) => ({ ...prev, [typeKey]: '' }))

      const res = await fetch(url, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/pdf, application/json',
        },
      })

      const contentType = res.headers.get('content-type') || ''

      if (contentType.includes('application/json') || !res.ok) {
        const errData = await res.json().catch(() => ({}))
        const msg = errData.message || 'No se encontraron datos para generar este documento.'
        setCardMessages((prev) => ({ ...prev, [typeKey]: msg }))
        return
      }

      const blob = await res.blob()
      const downloadUrl = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = downloadUrl
      a.download = defaultFilename
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(downloadUrl)
    } catch (err) {
      console.error('Error en descarga PDF:', err)
      setCardMessages((prev) => ({
        ...prev,
        [typeKey]: 'Error de conexión al procesar la descarga.',
      }))
    } finally {
      setDownloadingType('')
    }
  }

  const mascotaHistorialObj = mascotas.find(
    (m) => String(m.id || m.id_mascota) === String(selectedMascotaHistorial)
  )
  const mascotaVacunaObj = mascotas.find(
    (m) => String(m.id || m.id_mascota) === String(selectedMascotaVacuna)
  )

  return (
    <div className="dash">
      <SidebarClient />

      <main className="dash-main">
        <DashboardHeader
          title="Centro de Documentos"
          subtitle="Descarga recibos oficiales, constancias de atención, certificados de sanidad y tu carné digital EPS en PDF"
          usuario={usuario}
          onUserUpdated={setUsuario}
        />

        {errorGlobal && (
          <div className="dash-alert dash-alert--danger" style={{ marginBottom: '1.5rem' }}>
            <i className="fa-solid fa-triangle-exclamation"></i>
            <span>{errorGlobal}</span>
          </div>
        )}

        {loading ? (
          <div className="docs-cli-grid">
            {[1, 2, 3, 4].map((idx) => (
              <div key={idx} className="docs-cli-card" style={{ gap: '1rem' }}>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                  <div className="skeleton-box" style={{ width: '50px', height: '50px', borderRadius: '14px', flexShrink: 0 }}></div>
                  <div style={{ width: '100%' }}>
                    <div className="skeleton-box" style={{ width: '70%', height: '22px', marginBottom: '8px' }}></div>
                    <div className="skeleton-box" style={{ width: '90%', height: '36px' }}></div>
                  </div>
                </div>
                <div className="skeleton-box" style={{ width: '100%', height: '42px', borderRadius: '12px', marginTop: 'auto' }}></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="docs-cli-grid">
            {/* ── CARD 1: CARNÉ DIGITAL EPS ── */}
            <div className="docs-cli-card">
              <div>
                <div className="docs-cli-card__header">
                  <div className="docs-cli-card__icon docs-cli-card__icon--green">
                    <i className="fa-solid fa-id-card"></i>
                  </div>
                  <div className="docs-cli-card__info">
                    <h3>Carnet Digital de Afiliación EPS</h3>
                    <p>Documento institucional que acredita tu cobertura activa y las mascotas beneficiarias asociadas.</p>
                  </div>
                </div>

                {cardMessages.carne && (
                  <div className="docs-cli-card-msg docs-cli-card-msg--info">
                    <i className="fa-solid fa-circle-info"></i>
                    <span>{cardMessages.carne}</span>
                  </div>
                )}
              </div>

              <div>
                <button
                  type="button"
                  className="docs-cli-btn-download"
                  disabled={downloadingType === 'carne'}
                  onClick={() =>
                    handleDescargarPdf(
                      `${import.meta.env.VITE_API_URL}/cliente/documentos/carne-eps/pdf`,
                      `Carnet_EPS_PetFeliz_${usuario.nombre || 'Afiliado'}.pdf`,
                      'carne'
                    )
                  }
                >
                  {downloadingType === 'carne' ? (
                    <>
                      <i className="fa-solid fa-circle-notch fa-spin"></i>
                      <span>Generando Carnet PDF...</span>
                    </>
                  ) : (
                    <>
                      <i className="fa-solid fa-file-pdf"></i>
                      <span>Descargar Carnet EPS (PDF)</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* ── CARD 2: RESUMEN DE ATENCIONES MÉDICAS ── */}
            <div className="docs-cli-card">
              <div>
                <div className="docs-cli-card__header">
                  <div className="docs-cli-card__icon docs-cli-card__icon--teal">
                    <i className="fa-solid fa-clipboard-check"></i>
                  </div>
                  <div className="docs-cli-card__info">
                    <h3>Resumen de Atenciones Médicas</h3>
                    <p>Constancia de atenciones con fechas, motivos de consulta, veterinarios tratantes, observaciones y tratamiento indicado (si aplica).</p>
                  </div>
                </div>

                <div className="docs-cli-select-wrap">
                  <label htmlFor="mascota-hist-select" className="docs-cli-select-label">
                    Selecciona Mascota:
                  </label>
                  <select
                    id="mascota-hist-select"
                    className="docs-cli-select"
                    value={selectedMascotaHistorial}
                    onChange={(e) => {
                      setSelectedMascotaHistorial(e.target.value)
                      setCardMessages((prev) => ({ ...prev, historial: '' }))
                    }}
                    disabled={mascotas.length === 0}
                  >
                    {mascotas.length === 0 ? (
                      <option value="">No hay mascotas registradas</option>
                    ) : (
                      mascotas.map((m) => {
                        const mId = String(m.id || m.id_mascota)
                        return (
                          <option key={mId} value={mId}>
                            {m.nombre} ({m.especie})
                          </option>
                        )
                      })
                    )}
                  </select>
                </div>

                {cardMessages.historial && (
                  <div className="docs-cli-card-msg docs-cli-card-msg--info">
                    <i className="fa-solid fa-circle-info"></i>
                    <span>{cardMessages.historial}</span>
                  </div>
                )}
              </div>

              <div>
                <button
                  type="button"
                  className="docs-cli-btn-download"
                  disabled={!selectedMascotaHistorial || downloadingType === 'historial'}
                  onClick={() =>
                    handleDescargarPdf(
                      `${import.meta.env.VITE_API_URL}/cliente/documentos/historial-clinico/${selectedMascotaHistorial}/pdf`,
                      `Resumen_Atenciones_${mascotaHistorialObj?.nombre || 'Mascota'}.pdf`,
                      'historial'
                    )
                  }
                >
                  {downloadingType === 'historial' ? (
                    <>
                      <i className="fa-solid fa-circle-notch fa-spin"></i>
                      <span>Generando Resumen...</span>
                    </>
                  ) : (
                    <>
                      <i className="fa-solid fa-file-pdf"></i>
                      <span>Descargar Constancia de Atención (PDF)</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* ── CARD 3: CERTIFICADO DE VACUNACIÓN ── */}
            <div className="docs-cli-card">
              <div>
                <div className="docs-cli-card__header">
                  <div className="docs-cli-card__icon docs-cli-card__icon--blue">
                    <i className="fa-solid fa-syringe"></i>
                  </div>
                  <div className="docs-cli-card__info">
                    <h3>Certificado de Vacunación</h3>
                    <p>Certificado oficial de sanidad e inmunizaciones respaldado por la dirección médica EPS.</p>
                  </div>
                </div>

                <div className="docs-cli-select-wrap">
                  <label htmlFor="mascota-vac-select" className="docs-cli-select-label">
                    Selecciona Mascota:
                  </label>
                  <select
                    id="mascota-vac-select"
                    className="docs-cli-select"
                    value={selectedMascotaVacuna}
                    onChange={(e) => {
                      setSelectedMascotaVacuna(e.target.value)
                      setCardMessages((prev) => ({ ...prev, vacuna: '' }))
                    }}
                    disabled={mascotas.length === 0}
                  >
                    {mascotas.length === 0 ? (
                      <option value="">No hay mascotas registradas</option>
                    ) : (
                      mascotas.map((m) => {
                        const mId = String(m.id || m.id_mascota)
                        return (
                          <option key={mId} value={mId}>
                            {m.nombre} ({m.especie})
                          </option>
                        )
                      })
                    )}
                  </select>
                </div>

                {cardMessages.vacuna && (
                  <div className="docs-cli-card-msg docs-cli-card-msg--info">
                    <i className="fa-solid fa-circle-info"></i>
                    <span>{cardMessages.vacuna}</span>
                  </div>
                )}
              </div>

              <div>
                <button
                  type="button"
                  className="docs-cli-btn-download"
                  disabled={!selectedMascotaVacuna || downloadingType === 'vacuna'}
                  onClick={() =>
                    handleDescargarPdf(
                      `${import.meta.env.VITE_API_URL}/cliente/documentos/certificado-vacunacion/${selectedMascotaVacuna}/pdf`,
                      `Certificado_Vacunacion_${mascotaVacunaObj?.nombre || 'Mascota'}.pdf`,
                      'vacuna'
                    )
                  }
                >
                  {downloadingType === 'vacuna' ? (
                    <>
                      <i className="fa-solid fa-circle-notch fa-spin"></i>
                      <span>Generando Certificado...</span>
                    </>
                  ) : (
                    <>
                      <i className="fa-solid fa-file-pdf"></i>
                      <span>Descargar Certificado (PDF)</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* ── CARD 4: FACTURAS Y RECIBOS ── */}
            <div className="docs-cli-card">
              <div>
                <div className="docs-cli-card__header">
                  <div className="docs-cli-card__icon docs-cli-card__icon--amber">
                    <i className="fa-solid fa-file-invoice-dollar"></i>
                  </div>
                  <div className="docs-cli-card__info">
                    <h3>Facturas y Comprobantes</h3>
                    <p>Descarga el documento en PDF de tus transacciones y pagos confirmados por atención veterinaria.</p>
                  </div>
                </div>

                <div className="docs-cli-invoices-list">
                  {pagos.length === 0 ? (
                    <div style={{ fontSize: '0.82rem', color: '#64748b', textAlign: 'center', padding: '1rem 0' }}>
                      No tienes facturas emitidas por el momento.
                    </div>
                  ) : (
                    pagos.map((p) => (
                      <div key={p.id_pago} className="docs-cli-invoice-item">
                        <div>
                          <div style={{ fontWeight: 600, color: '#0f172a' }}>
                            {p.referencia_transaccion || `#PAY-${p.id_pago}`}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                            {p.servicio_nombre} • {p.fecha_pago || p.fecha_cita}
                          </div>
                          {cardMessages[`factura-${p.id_pago}`] && (
                            <div style={{ fontSize: '0.75rem', color: '#b45309', marginTop: '2px' }}>
                              {cardMessages[`factura-${p.id_pago}`]}
                            </div>
                          )}
                        </div>

                        <button
                          type="button"
                          className="docs-cli-invoice-btn"
                          disabled={downloadingType === `factura-${p.id_pago}`}
                          onClick={() =>
                            handleDescargarPdf(
                              `${import.meta.env.VITE_API_URL}/cliente/documentos/factura/${p.id_pago}/pdf`,
                              `Factura_${p.referencia_transaccion || p.id_pago}.pdf`,
                              `factura-${p.id_pago}`
                            )
                          }
                        >
                          {downloadingType === `factura-${p.id_pago}` ? (
                            <i className="fa-solid fa-circle-notch fa-spin"></i>
                          ) : (
                            <i className="fa-solid fa-download"></i>
                          )}
                          <span>PDF</span>
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
