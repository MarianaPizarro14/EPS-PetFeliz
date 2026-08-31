import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import SidebarClient from '../ui/SidebarClient'
import DashboardHeader from '../ui/DashboardHeader'
import { useUser } from '../../context/UserContext'
import './DashboardClient.css'
import './AfiliacionCliente.css'

const FALLBACK_PET_IMG = '/img/card_mascota.png'

const getPhotoUrl = (url, fallback = FALLBACK_PET_IMG) => {
  if (!url || typeof url !== 'string') return fallback
  const trimmed = url.trim()
  if (
    !trimmed ||
    trimmed === 'default.jpg' ||
    trimmed === 'default_pet.jpg' ||
    trimmed.endsWith('/default.jpg') ||
    trimmed.endsWith('/default_pet.jpg')
  ) {
    return fallback
  }
  return trimmed
}

export default function AfiliacionCliente() {
  const navigate = useNavigate()
  const { usuario, setUsuario } = useUser()

  const [afiliacionData, setAfiliacionData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [downloadingCert, setDownloadingCert] = useState(false)

  // Estado del Modal de Pago / Renovación
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [selectedMetodo, setSelectedMetodo] = useState('card')
  const [submittingPayment, setSubmittingPayment] = useState(false)
  const [paymentSuccessMsg, setPaymentSuccessMsg] = useState('')

  const fetchAfiliacion = async () => {
    const token = localStorage.getItem('token')
    if (!token) {
      navigate('/login')
      return
    }

    try {
      setLoading(true)
      setError('')

      const headers = { Authorization: `Bearer ${token}`, Accept: 'application/json' }
      const [resUser, resAfil] = await Promise.all([
        fetch(`${import.meta.env.VITE_API_URL}/me`, { headers }),
        fetch(`${import.meta.env.VITE_API_URL}/cliente/afiliacion`, { headers }),
      ])

      if (resUser.ok) {
        const uData = await resUser.json()
        setUsuario(uData.usuario || uData)
      }

      if (resAfil.ok) {
        const aData = await resAfil.json()
        setAfiliacionData(aData)
      } else {
        setError('Ocurrió un error al obtener la información de afiliación.')
      }
    } catch (err) {
      console.error('Error al cargar afiliación:', err)
      setError('Fallo de conexión al cargar el estado de afiliación.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAfiliacion()
  }, [navigate])

  // Descarga del Certificado EPS
  const handleDownloadCertificado = async () => {
    const token = localStorage.getItem('token')
    if (!token) return

    try {
      setDownloadingCert(true)
      const res = await fetch(`${import.meta.env.VITE_API_URL}/cliente/documentos/carne-eps/pdf`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (res.status === 422) {
        alert('Debes completar el 100% de los datos obligatorios en tu perfil antes de generar el certificado.')
        return
      }

      if (!res.ok) {
        alert('Error al generar el Certificado de Afiliación PDF.')
        return
      }

      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Certificado_Afiliacion_EPS_${afiliacionData?.cliente?.codigo_afiliado || 'PetFeliz'}.pdf`
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Error al descargar carnet:', err)
      alert('Error de red al intentar descargar el certificado.')
    } finally {
      setDownloadingCert(false)
    }
  }

  // Confirmación del pago de suscripción
  const handleConfirmarPagoSuscripcion = async (e) => {
    e.preventDefault()
    const token = localStorage.getItem('token')
    if (!token) return

    try {
      setSubmittingPayment(true)
      setPaymentSuccessMsg('')

      const res = await fetch(`${import.meta.env.VITE_API_URL}/cliente/afiliacion/pagar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
        body: JSON.stringify({ metodo_pago: selectedMetodo }),
      })

      const data = await res.json()

      if (!res.ok) {
        alert(data.message || 'Error al procesar el pago de afiliación.')
        return
      }

      setPaymentSuccessMsg('¡Pago procesado con éxito! Tu Cobertura Integral EPS PetFeliz se encuentra activa.')
      setTimeout(() => {
        setShowPaymentModal(false)
        setPaymentSuccessMsg('')
        fetchAfiliacion()
      }, 1800)
    } catch (err) {
      console.error('Error al procesar pago:', err)
      alert('Fallo de red al conectar con la pasarela de pagos.')
    } finally {
      setSubmittingPayment(false)
    }
  }

  const cliente = afiliacionData?.cliente
  const plan = afiliacionData?.plan
  const mascotas = afiliacionData?.mascotas || []
  const historialPagos = afiliacionData?.historial_pagos_afiliacion || []
  const esAfiliado = cliente?.es_afiliado ?? false

  return (
    <div className="dash">
      <SidebarClient />

      <main className="dash-main">
        <DashboardHeader
          title="Gestión de Afiliación EPS"
          subtitle="Consulta el estado de tu cobertura, beneficios del plan y certificados oficiales"
          usuario={usuario}
          onUserUpdated={setUsuario}
        />

        <div className="afil-box">
          {error && (
            <div className="dash-alert dash-alert--danger">
              <i className="fa-solid fa-triangle-exclamation"></i>
              <span>{error}</span>
            </div>
          )}

          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1rem 0' }}>
              <div className="skeleton-box" style={{ width: '100%', height: '140px', borderRadius: '16px' }}></div>
              <div className="skeleton-box" style={{ width: '100%', height: '260px', borderRadius: '16px' }}></div>
            </div>
          ) : (
            <>
              {/* ── BANNER DE ESTADO DE AFILIACIÓN ── */}
              <div className={`afil-status-card ${esAfiliado ? 'afil-status-card--active' : 'afil-status-card--inactive'}`}>
                <div className="afil-status-header">
                  <div className="afil-status-badge">
                    <i className={`fa-solid ${esAfiliado ? 'fa-shield-halved' : 'fa-circle-exclamation'}`}></i>
                    <span>{esAfiliado ? 'COBERTURA INTEGRAL ACTIVA' : 'SIN COBERTURA ACTIVA (PACIENTE PARTICULAR)'}</span>
                  </div>

                  {esAfiliado && (
                    <div className="afil-code-badge">
                      <span className="afil-code-label">CÓDIGO AFILIADO</span>
                      <strong className="afil-code-val">{cliente?.codigo_afiliado}</strong>
                    </div>
                  )}
                </div>

                <div className="afil-status-body">
                  <div className="afil-status-info">
                    <h2>{esAfiliado ? 'Tu plan de cobertura está vigente' : 'Afíliate hoy a EPS PetFeliz'}</h2>
                    <p>
                      {esAfiliado
                        ? `Registrado oficialmente desde el ${cliente?.fecha_afiliacion || 'fecha de alta'}. Todas tus mascotas cuentan con atención preferencial y urgencias 24/7.`
                        : 'Accede a consultas veterinarias con $0 copago, urgencias 24 horas y hasta 40% de descuento en exámenes y procedimientos.'}
                    </p>
                  </div>

                  <div className="afil-status-actions">
                    {esAfiliado ? (
                      <>
                        <button
                          type="button"
                          className="afil-btn afil-btn--primary"
                          onClick={handleDownloadCertificado}
                          disabled={downloadingCert}
                        >
                          <i className="fa-solid fa-file-pdf"></i>
                          <span>{downloadingCert ? 'Generando PDF...' : 'Descargar Certificado PDF'}</span>
                        </button>

                        <button
                          type="button"
                          className="afil-btn afil-btn--secondary"
                          onClick={() => setShowPaymentModal(true)}
                        >
                          <i className="fa-solid fa-arrows-rotate"></i>
                          <span>Renovar Mensualidad ($49.900)</span>
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        className="afil-btn afil-btn--pay-now"
                        onClick={() => setShowPaymentModal(true)}
                      >
                        <i className="fa-solid fa-bolt"></i>
                        <span>Afiliarme Ahora ($49.900 COP / mes)</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* ── DETALLES DEL PLAN Y BENEFICIOS ── */}
              <div className="afil-grid">
                <div className="afil-card">
                  <div className="afil-card-title">
                    <i className="fa-solid fa-stethoscope"></i>
                    <h3>{plan?.nombre || 'Plan Cobertura Integral EPS PetFeliz'}</h3>
                  </div>

                  <div className="afil-price-tag">
                    <span className="afil-price-val">${(plan?.precio_mensual || 49900).toLocaleString('es-CO')}</span>
                    <span className="afil-price-period">/ mes por grupo familiar</span>
                  </div>

                  <ul className="afil-benefits-list">
                    {(plan?.beneficios || []).map((b, idx) => (
                      <li key={idx}>
                        <i className="fa-solid fa-circle-check"></i>
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>

                  {!esAfiliado && (
                    <div style={{ marginTop: '1.5rem' }}>
                      <button
                        type="button"
                        className="afil-btn afil-btn--pay-now"
                        style={{ width: '100%', justifyContent: 'center' }}
                        onClick={() => setShowPaymentModal(true)}
                      >
                        <i className="fa-solid fa-credit-card"></i>
                        <span>Adquirir Plan EPS</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* ── PACIENTES BENEFICIARIOS REGISTRADOS ── */}
                <div className="afil-card">
                  <div className="afil-card-title">
                    <i className="fa-solid fa-paw"></i>
                    <h3>Pacientes Beneficiarios Protegidos</h3>
                  </div>

                  {mascotas.length === 0 ? (
                    <div className="afil-empty-box">
                      <p>Aún no has registrado mascotas en tu cuenta.</p>
                      <button
                        type="button"
                        className="afil-btn afil-btn--secondary"
                        onClick={() => navigate('/mis-mascotas')}
                        style={{ marginTop: '0.5rem' }}
                      >
                        + Agregar Mascota
                      </button>
                    </div>
                  ) : (
                    <div className="afil-pets-list">
                      {mascotas.map((m) => (
                        <div key={m.id} className="afil-pet-item">
                          <img
                            src={getPhotoUrl(m.foto, FALLBACK_PET_IMG)}
                            alt={m.nombre}
                            className="afil-pet-avatar"
                            onError={(e) => {
                              e.target.onerror = null
                              e.target.src = FALLBACK_PET_IMG
                            }}
                          />
                          <div className="afil-pet-meta">
                            <strong>{m.nombre}</strong>
                            <span>{m.especie} — {m.raza || 'Criollo'} ({m.sexo || 'N/A'})</span>
                          </div>
                          <span className="afil-pet-tag">
                            {esAfiliado ? 'Cobertura 100%' : 'Particular'}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* ── HISTORIAL DE PAGOS DE AFILIACIÓN ── */}
              {esAfiliado && (
                <div className="afil-card" style={{ marginTop: '1.5rem' }}>
                  <div className="afil-card-title">
                    <i className="fa-solid fa-receipt"></i>
                    <h3>Historial de Cuotas de Afiliación</h3>
                  </div>

                  {historialPagos.length === 0 ? (
                    <p style={{ color: '#64748b', fontSize: '0.9rem', marginTop: '0.5rem' }}>
                      No se registra historial previo de cuotas de suscripción.
                    </p>
                  ) : (
                    <div className="afil-table-responsive">
                      <table className="afil-table">
                        <thead>
                          <tr>
                            <th>Referencia</th>
                            <th>Concepto</th>
                            <th>Fecha</th>
                            <th>Método Pago</th>
                            <th>Monto</th>
                            <th>Estado</th>
                          </tr>
                        </thead>
                        <tbody>
                          {historialPagos.map((p) => (
                            <tr key={p.id_pago}>
                              <td><strong>{p.referencia}</strong></td>
                              <td>{p.concepto}</td>
                              <td>{p.fecha_pago}</td>
                              <td>{p.metodo_pago}</td>
                              <td><strong>${p.monto.toLocaleString('es-CO')} COP</strong></td>
                              <td>
                                <span className="afil-badge-success">
                                  <i className="fa-solid fa-circle-check"></i>
                                  <span>{p.estado === 'confirmado' ? 'Confirmado' : p.estado}</span>
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* ── MODAL PASARELA DE PAGO REUTILIZABLE ── */}
      {showPaymentModal && (
        <div className="pagos-modal-overlay">
          <div className="pagos-modal-card" style={{ maxWidth: '520px' }}>
            <div className="pagos-modal-header">
              <h3>Checkout - Plan Cobertura Integral EPS</h3>
              <button
                type="button"
                className="pagos-modal-close"
                onClick={() => setShowPaymentModal(false)}
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <form onSubmit={handleConfirmarPagoSuscripcion}>
              <div className="pagos-modal-body">
                {paymentSuccessMsg ? (
                  <div className="dash-alert dash-alert--success">
                    <i className="fa-solid fa-circle-check"></i>
                    <span>{paymentSuccessMsg}</span>
                  </div>
                ) : (
                  <>
                    <div className="afil-checkout-summary">
                      <div className="afil-checkout-row">
                        <span>Concepto:</span>
                        <strong>Suscripción Mensual Plan EPS PetFeliz</strong>
                      </div>
                      <div className="afil-checkout-row">
                        <span>Monto a Cancelar:</span>
                        <strong className="afil-checkout-price">$49.900 COP</strong>
                      </div>
                    </div>

                    <div style={{ marginTop: '1.25rem' }}>
                      <label className="afil-field-label">Selecciona el Método de Pago:</label>
                      <div className="afil-methods-grid">
                        <label className={`afil-method-option ${selectedMetodo === 'card' ? 'afil-method-option--selected' : ''}`}>
                          <input
                            type="radio"
                            name="metodo_pago"
                            value="card"
                            checked={selectedMetodo === 'card'}
                            onChange={(e) => setSelectedMetodo(e.target.value)}
                          />
                          <i className="fa-solid fa-credit-card"></i>
                          <span>Tarjeta Crédito / Débito</span>
                        </label>

                        <label className={`afil-method-option ${selectedMetodo === 'pse' ? 'afil-method-option--selected' : ''}`}>
                          <input
                            type="radio"
                            name="metodo_pago"
                            value="pse"
                            checked={selectedMetodo === 'pse'}
                            onChange={(e) => setSelectedMetodo(e.target.value)}
                          />
                          <i className="fa-solid fa-building-columns"></i>
                          <span>PSE - Cuenta de Ahorros</span>
                        </label>

                        <label className={`afil-method-option ${selectedMetodo === 'nequi' ? 'afil-method-option--selected' : ''}`}>
                          <input
                            type="radio"
                            name="metodo_pago"
                            value="nequi"
                            checked={selectedMetodo === 'nequi'}
                            onChange={(e) => setSelectedMetodo(e.target.value)}
                          />
                          <i className="fa-solid fa-mobile-screen"></i>
                          <span>Nequi / Daviplata</span>
                        </label>
                      </div>
                    </div>
                  </>
                )}
              </div>

              <div className="pagos-modal-footer">
                {!paymentSuccessMsg && (
                  <>
                    <button
                      type="submit"
                      className="afil-btn afil-btn--pay-now"
                      disabled={submittingPayment}
                    >
                      {submittingPayment ? (
                        <span>Procesando Pago...</span>
                      ) : (
                        <>
                          <i className="fa-solid fa-lock"></i>
                          <span>Pagar $49.900 COP</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      className="afil-btn afil-btn--secondary"
                      onClick={() => setShowPaymentModal(false)}
                      disabled={submittingPayment}
                    >
                      Cancelar
                    </button>
                  </>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
