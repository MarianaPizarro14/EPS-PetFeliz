// src/components/ui/AdminCriticalAlert.jsx
import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getStoredToken } from '../../utils/authStorage'

export default function AdminCriticalAlert() {
  const navigate = useNavigate()
  const [criticalErrors, setCriticalErrors] = useState([])
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    // Si ya fue desestimada en esta sesión, no volver a molestar
    const dismissed = sessionStorage.getItem('pf_dismissed_critical_alert')
    if (dismissed === 'true') return

    const checkIntegraciones = async () => {
      const token = getStoredToken()
      if (!token) return

      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/admin/configuracion/estado-integraciones`, {
          headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
        })

        if (res.ok) {
          const data = await res.json()
          const items = data.integraciones || {}
          
          // Filtrar ÚNICAMENTE fallas reales (estado === 'error')
          // Sandbox, produccion y ok son estados normales y NO activan alerta
          const failed = Object.entries(items)
            .filter(([key, info]) => info && info.estado === 'error')
            .map(([key, info]) => ({ key, ...info }))

          if (failed.length > 0) {
            setCriticalErrors(failed)
            setShowModal(true)
          }
        }
      } catch (err) {
        console.error('Error al chequear integraciones críticas:', err)
      }
    }

    checkIntegraciones()
  }, [])

  const handleDismiss = () => {
    sessionStorage.setItem('pf_dismissed_critical_alert', 'true')
    setShowModal(false)
  }

  const handleGoToConfig = () => {
    sessionStorage.setItem('pf_dismissed_critical_alert', 'true')
    setShowModal(false)
    navigate('/admin/configuracion')
  }

  if (!showModal || criticalErrors.length === 0) {
    return null
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.78)',
        backdropFilter: 'blur(8px)',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
      }}
    >
      <div
        style={{
          background: '#ffffff',
          borderRadius: '20px',
          maxWidth: '540px',
          width: '100%',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
          overflow: 'hidden',
          border: '1px solid #fecaca',
          animation: 'pfAlertPop 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* Cabecera del Modal de Alerta */}
        <div
          style={{
            background: 'linear-gradient(135deg, #991b1b 0%, #dc2626 100%)',
            padding: '1.5rem 1.8rem',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            gap: '1.1rem',
          }}
        >
          <div
            style={{
              width: '54px',
              height: '54px',
              borderRadius: '14px',
              background: 'rgba(255, 255, 255, 0.2)',
              backdropFilter: 'blur(4px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.6rem',
              flexShrink: 0,
            }}
          >
            <i className="fa-solid fa-triangle-exclamation"></i>
          </div>
          <div>
            <h3 style={{ fontFamily: "'Sora', sans-serif", fontSize: '1.2rem', fontWeight: 700, margin: '0 0 0.25rem 0' }}>
              Alerta Crítica del Sistema
            </h3>
            <p style={{ fontSize: '0.85rem', margin: 0, opacity: 0.95, fontFamily: "'Inter', sans-serif" }}>
              Fallas detectadas en los servicios principales de la EPS
            </p>
          </div>
        </div>

        {/* Cuerpo del Modal */}
        <div style={{ padding: '1.6rem 1.8rem' }}>
          <p style={{ fontSize: '0.9rem', color: '#334155', marginBottom: '1.2rem', lineHeight: 1.5, fontFamily: "'Inter', sans-serif" }}>
            Se han identificado <strong>{criticalErrors.length} {criticalErrors.length === 1 ? 'servicio fuera' : 'servicios fuera'} de servicio</strong> que requieren atención para garantizar la continuidad del sistema:
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', marginBottom: '1.5rem' }}>
            {criticalErrors.map((err) => (
              <div
                key={err.key}
                style={{
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: '12px',
                  padding: '0.9rem 1.1rem',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.85rem',
                }}
              >
                <i
                  className={err.icono || 'fa-solid fa-circle-xmark'}
                  style={{ color: '#dc2626', fontSize: '1.15rem', marginTop: '2px', flexShrink: 0 }}
                ></i>
                <div>
                  <h4 style={{ fontFamily: "'Sora', sans-serif", fontSize: '0.92rem', fontWeight: 700, color: '#991b1b', margin: '0 0 0.2rem 0' }}>
                    {err.titulo}
                  </h4>
                  <p style={{ fontSize: '0.82rem', color: '#7f1d1d', margin: 0, lineHeight: 1.4, fontFamily: "'Inter', sans-serif" }}>
                    {err.mensaje}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <p style={{ fontSize: '0.8rem', color: '#64748b', margin: 0, fontStyle: 'italic' }}>
            Puedes ingresar al módulo de Configuración para diagnosticar y resolver el problema.
          </p>
        </div>

        {/* Botones de Acción */}
        <div
          style={{
            padding: '1.1rem 1.8rem',
            background: '#f8fafc',
            borderTop: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: '0.8rem',
          }}
        >
          <button
            type="button"
            onClick={handleDismiss}
            style={{
              padding: '0.6rem 1.2rem',
              borderRadius: '10px',
              border: '1px solid #cbd5e1',
              background: '#ffffff',
              color: '#475569',
              fontWeight: 600,
              fontSize: '0.86rem',
              cursor: 'pointer',
            }}
          >
            Entendido, Continuar
          </button>
          <button
            type="button"
            onClick={handleGoToConfig}
            style={{
              padding: '0.6rem 1.2rem',
              borderRadius: '10px',
              border: 'none',
              background: '#dc2626',
              color: '#ffffff',
              fontWeight: 600,
              fontSize: '0.86rem',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <i className="fa-solid fa-gear"></i>
            <span>Ir a Configuración</span>
          </button>
        </div>
      </div>
    </div>
  )
}
