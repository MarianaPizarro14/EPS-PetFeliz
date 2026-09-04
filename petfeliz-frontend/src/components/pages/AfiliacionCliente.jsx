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

  // Selección de plan para alta / renovación (default 'individual' = 39900, 'familiar' = 69900)
  const [selectedPlanType, setSelectedPlanType] = useState('familiar')

  // Estado del Modal de Pago / Renovación
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [selectedMetodo, setSelectedMetodo] = useState('card')
  const [submittingPayment, setSubmittingPayment] = useState(false)
  const [paymentSuccessMsg, setPaymentSuccessMsg] = useState('')

  // Estado del Modal de Recibo de Pago
  const [selectedReceipt, setSelectedReceipt] = useState(null)

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

  // Abrir Modal de Checkout fijando el plan
  const handleOpenCheckout = (planType = 'familiar') => {
    setSelectedPlanType(planType)
    setShowPaymentModal(true)
  }

  // Confirmación del pago de suscripción
  const handleConfirmarPagoSuscripcion = async (e) => {
    e.preventDefault()
    const token = localStorage.getItem('token')
    if (!token) return

    const montoCalculado = selectedPlanType === 'individual' ? 39900 : 69900

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
        body: JSON.stringify({
          metodo_pago: selectedMetodo,
          monto: montoCalculado,
          tipo_plan: selectedPlanType,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        alert(data.message || 'Error al procesar el pago de afiliación.')
        return
      }

      const pagoCreado = data.pago

      setPaymentSuccessMsg('¡Pago procesado con éxito! Tu Cobertura Integral EPS PetFeliz se encuentra activa.')
      setTimeout(() => {
        setShowPaymentModal(false)
        setPaymentSuccessMsg('')
        fetchAfiliacion()

        // Abrir automáticamente el recibo de pago recién generado
        if (pagoCreado) {
          setSelectedReceipt({
            referencia: pagoCreado.referencia_transaccion,
            concepto: selectedPlanType === 'individual' ? 'Plan Mascota Individual EPS' : 'Plan Grupo Familiar EPS',
            fecha_pago: new Date().toLocaleDateString('es-CO'),
            metodo_pago: selectedMetodo === 'card' ? 'Tarjeta Crédito / Débito' : selectedMetodo === 'pse' ? 'PSE - Cuenta de Ahorros' : 'Nequi / Daviplata',
            monto: montoCalculado,
            estado: 'confirmado',
          })
        }
      }, 1600)
    } catch (err) {
      console.error('Error al procesar pago:', err)
      alert('Fallo de red al conectar con la pasarela de pagos.')
    } finally {
      setSubmittingPayment(false)
    }
  }

  const cliente = afiliacionData?.cliente
  const mascotas = afiliacionData?.mascotas || []
  const historialPagos = afiliacionData?.historial_pagos_afiliacion || []
  
  // Determinación estricta de afiliación mediante el campo booleano `es_afiliado` del modelo Cliente
  const esAfiliado = Boolean(cliente?.es_afiliado)

  const getMontoPlanActual = () => (selectedPlanType === 'individual' ? 39900 : 69900)
  const getNombrePlanActual = () => (selectedPlanType === 'individual' ? 'Mascota Individual' : 'Grupo Familiar (Multi-mascota)')

  return (
    <div className="dash">
      <SidebarClient />

      <main className="dash-main">
        <DashboardHeader
          title="Gestión de Afiliación EPS"
          subtitle="Consulta el estado de tu cobertura, beneficios del plan y recibos electrónicos de suscripción"
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
              {(() => {
                const isEnMora = cliente?.estado_mora === 'en_mora'
                const cardClass = !esAfiliado
                  ? 'afil-status-card--inactive'
                  : isEnMora
                  ? 'afil-status-card--mora'
                  : 'afil-status-card--active'

                return (
                  <div className={`afil-status-card ${cardClass}`}>
                    <div className="afil-status-header">
                      <div className="afil-status-badge">
                        <i className={`fa-solid ${!esAfiliado ? 'fa-circle-exclamation' : isEnMora ? 'fa-triangle-exclamation' : 'fa-shield-halved'}`}></i>
                        <span>
                          {!esAfiliado
                            ? 'SIN COBERTURA ACTIVA (PACIENTE PARTICULAR)'
                            : isEnMora
                            ? `MENSUALIDAD VENCIDA (${cliente?.dias_mora || 1} ${cliente?.dias_mora === 1 ? 'DÍA' : 'DÍAS'} DE MORA)`
                            : 'COBERTURA INTEGRAL ACTIVA'}
                        </span>
                      </div>

                      {esAfiliado && (
                        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                          <div className="afil-code-badge">
                            <span className="afil-code-label">PRÓXIMO VENCIMIENTO</span>
                            <strong className="afil-code-val" style={{ fontSize: '0.95rem' }}>
                              {cliente?.fecha_vencimiento || 'Al día'}
                            </strong>
                          </div>
                          <div className="afil-code-badge">
                            <span className="afil-code-label">CÓDIGO AFILIADO</span>
                            <strong className="afil-code-val">{cliente?.codigo_afiliado}</strong>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="afil-status-body">
                      <div className="afil-status-info">
                        <h2>
                          {!esAfiliado
                            ? '¡Afíliate ahora y protege a tu mascota!'
                            : isEnMora
                            ? 'Tu mensualidad de afiliación está vencida'
                            : 'Tu plan de cobertura está vigente'}
                        </h2>
                        <p>
                          {!esAfiliado
                            ? 'Elige la modalidad que mejor se adapte a tu hogar y obtén consultas veterinarias sin copago, urgencias 24 horas y hasta 40% de descuento en tratamientos desde $39.900/mes.'
                            : isEnMora
                            ? `Tu fecha de pago fue el ${cliente?.fecha_vencimiento || 'reciente'}. Cuentas con un periodo de gracia hasta el ${cliente?.fecha_limite_gracia} para realizar tu pago antes de perder la cobertura.`
                            : `Registrado oficialmente desde el ${cliente?.fecha_afiliacion || 'fecha de alta'}. Tu próximo vencimiento es el ${cliente?.fecha_vencimiento}.`}
                        </p>
                      </div>

                      <div className="afil-status-actions">
                        {esAfiliado ? (
                          <button
                            type="button"
                            className="afil-btn afil-btn--secondary"
                            style={{
                              background: isEnMora ? '#fef2f2' : '#ffffff',
                              color: isEnMora ? '#991b1b' : '#0369a1',
                              fontWeight: 700,
                              borderColor: isEnMora ? '#fca5a5' : 'transparent',
                            }}
                            onClick={() => handleOpenCheckout('familiar')}
                          >
                            <i className={`fa-solid ${isEnMora ? 'fa-credit-card' : 'fa-arrows-rotate'}`}></i>
                            <span>{isEnMora ? 'Pagar / Ponerme al Día ($69.900)' : 'Renovar Mensualidad ($69.900)'}</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="afil-btn afil-btn--pay-now"
                            onClick={() => handleOpenCheckout('individual')}
                          >
                            <i className="fa-solid fa-bolt"></i>
                            <span>Afiliarme desde $39.900/mes</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })()}

              {/* ── SECCIÓN SI EL USUARIO NO ESTÁ AFILIADO: 2 PLANES DISPONIBLES ── */}
              {!esAfiliado && (
                <div style={{ marginBottom: '2.5rem' }}>
                  <div style={{ marginBottom: '1rem' }}>
                    <h3 style={{ fontFamily: 'Sora, sans-serif', fontSize: '1.35rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                      Planes de Cobertura Disponibles
                    </h3>
                    <p style={{ color: '#64748b', fontSize: '0.9rem', margin: '0.25rem 0 0 0' }}>
                      Selecciona el tipo de afiliación adecuado para tu familia y dale a tu mascota la mejor salud veterinaria:
                    </p>
                  </div>

                  <div className="afil-plans-grid">
                    {/* PLAN 1: MASCOTA INDIVIDUAL */}
                    <div className="afil-plan-card">
                      <span className="afil-plan-badge" style={{ background: '#0284c7' }}>
                        Ideal 1 Mascota
                      </span>
                      <div className="afil-plan-header">
                        <h3>Mascota Individual</h3>
                        <p>Cobertura médica integral para 1 mascota registrada.</p>
                      </div>
                      <div className="afil-plan-price-box">
                        <span className="afil-plan-amount">$39.900</span>
                        <span className="afil-plan-period">/ mes</span>
                      </div>
                      <ul className="afil-benefits-list" style={{ marginBottom: '1.5rem', flex: 1 }}>
                        <li>
                          <i className="fa-solid fa-circle-check"></i>
                          <span>Consultas veterinarias generales $0 copago</span>
                        </li>
                        <li>
                          <i className="fa-solid fa-circle-check"></i>
                          <span>Atención de Urgencias 24/7 preferencial</span>
                        </li>
                        <li>
                          <i className="fa-solid fa-circle-check"></i>
                          <span>Hasta 40% descuento en cirugías y laboratorio</span>
                        </li>
                        <li>
                          <i className="fa-solid fa-circle-check"></i>
                          <span>Generación de Carné Digital Oficial</span>
                        </li>
                      </ul>
                      <button
                        type="button"
                        className="afil-btn afil-btn--pay-now"
                        style={{ width: '100%', justifyContent: 'center' }}
                        onClick={() => handleOpenCheckout('individual')}
                      >
                        <i className="fa-solid fa-cart-shopping"></i>
                        <span>Afiliar Mascota Individual ($39.900 COP)</span>
                      </button>
                    </div>

                    {/* PLAN 2: GRUPO FAMILIAR */}
                    <div className="afil-plan-card afil-plan-card--featured">
                      <span className="afil-plan-badge">Recomendado Familiar</span>
                      <div className="afil-plan-header">
                        <h3>Grupo Familiar</h3>
                        <p>Protección completa para TODAS las mascotas de tu hogar.</p>
                      </div>
                      <div className="afil-plan-price-box">
                        <span className="afil-plan-amount">$69.900</span>
                        <span className="afil-plan-period">/ mes por grupo</span>
                      </div>
                      <ul className="afil-benefits-list" style={{ marginBottom: '1.5rem', flex: 1 }}>
                        <li>
                          <i className="fa-solid fa-circle-check"></i>
                          <span>Cobertura 100% para todas tus mascotas registradas</span>
                        </li>
                        <li>
                          <i className="fa-solid fa-circle-check"></i>
                          <span>Atención de urgencias 24/7 ilimitada para el hogar</span>
                        </li>
                        <li>
                          <i className="fa-solid fa-circle-check"></i>
                          <span>Descuentos máximos de afiliado en todos los servicios</span>
                        </li>
                        <li>
                          <i className="fa-solid fa-circle-check"></i>
                          <span>Carnés digitales individuales para cada mascota</span>
                        </li>
                      </ul>
                      <button
                        type="button"
                        className="afil-btn afil-btn--pay-now"
                        style={{ width: '100%', justifyContent: 'center', background: 'linear-gradient(135deg, #0284c7 0%, #006780 100%)' }}
                        onClick={() => handleOpenCheckout('familiar')}
                      >
                        <i className="fa-solid fa-crown"></i>
                        <span>Afiliar Grupo Familiar ($69.900 COP)</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* ── DETALLES DE PACIENTES REGISTRADOS ── */}
              <div className="afil-grid">
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

                <div className="afil-card">
                  <div className="afil-card-title">
                    <i className="fa-solid fa-notes-medical"></i>
                    <h3>Resumen de Cobertura de tu Plan</h3>
                  </div>

                  <ul className="afil-benefits-list" style={{ marginTop: '1rem' }}>
                    <li>
                      <i className="fa-solid fa-circle-check"></i>
                      <span>Consultas veterinarias generales $0 copago</span>
                    </li>
                    <li>
                      <i className="fa-solid fa-circle-check"></i>
                      <span>Atención de urgencias 24 horas disponible</span>
                    </li>
                    <li>
                      <i className="fa-solid fa-circle-check"></i>
                      <span>Descuentos preferenciales de afiliado en tratamientos</span>
                    </li>
                    <li>
                      <i className="fa-solid fa-circle-check"></i>
                      <span>Acceso directo a programación de citas online</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* ── HISTORIAL DE PAGOS DE AFILIACIÓN ── */}
              {esAfiliado && (
                <div className="afil-card" style={{ marginTop: '1.5rem' }}>
                  <div className="afil-card-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <i className="fa-solid fa-receipt"></i>
                      <h3>Historial de Cuotas de Afiliación</h3>
                    </div>
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
                            <th>Comprobante</th>
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
                              <td>
                                <button
                                  type="button"
                                  className="afil-btn afil-btn--secondary"
                                  style={{ padding: '0.3rem 0.65rem', fontSize: '0.78rem' }}
                                  onClick={() => setSelectedReceipt(p)}
                                >
                                  <i className="fa-solid fa-receipt"></i>
                                  <span>Ver Recibo</span>
                                </button>
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

      {/* ── MODAL PASARELA DE PAGO / CHECKOUT ── */}
      {showPaymentModal && (
        <div className="pagos-modal-overlay">
          <div className="pagos-modal-card" style={{ maxWidth: '520px' }}>
            <div className="pagos-modal-header">
              <h3>Checkout - Plan EPS PetFeliz</h3>
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
                        <span>Modalidad Seleccionada:</span>
                        <strong>{getNombrePlanActual()}</strong>
                      </div>
                      <div className="afil-checkout-row">
                        <span>Monto a Cancelar:</span>
                        <strong className="afil-checkout-price">${getMontoPlanActual().toLocaleString('es-CO')} COP</strong>
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
                          <span>Pagar ${getMontoPlanActual().toLocaleString('es-CO')} COP</span>
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

      {/* ── MODAL RECIBO DE PAGO COMPROBANTE DE AFILIACIÓN ── */}
      {selectedReceipt && (
        <div className="pagos-modal-overlay">
          <div className="afil-receipt-card">
            <div className="afil-receipt-header">
              <div className="afil-receipt-logo">
                <i className="fa-solid fa-shield-cat"></i>
                <span>EPS PetFeliz</span>
              </div>
              <span className="afil-receipt-title">Comprobante Oficial de Transacción EPS</span>
            </div>

            <div className="afil-receipt-grid">
              <div className="afil-receipt-field">
                <label>Referencia:</label>
                <span>{selectedReceipt.referencia}</span>
              </div>
              <div className="afil-receipt-field">
                <label>Fecha de Emisión:</label>
                <span>{selectedReceipt.fecha_pago || new Date().toLocaleDateString('es-CO')}</span>
              </div>
              <div className="afil-receipt-field">
                <label>Afiliado / Titular:</label>
                <span>{cliente?.nombre || usuario?.name || 'Cliente EPS'}</span>
              </div>
              <div className="afil-receipt-field">
                <label>Código Afiliado:</label>
                <span>{cliente?.codigo_afiliado || 'EPS-PET-0001'}</span>
              </div>
              <div className="afil-receipt-field">
                <label>Concepto:</label>
                <span>{selectedReceipt.concepto || 'Suscripción Mensual Plan EPS'}</span>
              </div>
              <div className="afil-receipt-field">
                <label>Método de Pago:</label>
                <span>{selectedReceipt.metodo_pago || 'Tarjeta / PSE'}</span>
              </div>
            </div>

            <div className="afil-receipt-total-box">
              <div>
                <span style={{ fontSize: '0.78rem', color: '#0369a1', fontWeight: 600, display: 'block' }}>TOTAL CANCELADO:</span>
                <span style={{ fontSize: '0.78rem', color: '#15803d', fontWeight: 600 }}>Estado: Confirmado</span>
              </div>
              <span className="afil-receipt-total-val">
                ${(Number(selectedReceipt.monto) || 69900).toLocaleString('es-CO')} COP
              </span>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="afil-btn afil-btn--primary"
                onClick={() => window.print()}
              >
                <i className="fa-solid fa-print"></i>
                <span>Imprimir / Guardar Recibo</span>
              </button>
              <button
                type="button"
                className="afil-btn afil-btn--secondary"
                onClick={() => setSelectedReceipt(null)}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
