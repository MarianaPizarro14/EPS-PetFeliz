// src/components/pages/AdminConfiguracion.jsx
import React, { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { getStoredToken, getStoredUser, isValidAvatarUrl } from '../../utils/authStorage'
import SidebarAdmin from '../ui/SidebarAdmin'
import DashboardHeader from '../ui/DashboardHeader'
import './DashboardClient.css'
import './AdminDashboard.css'
import './AdminCitas.css'

export default function AdminConfiguracion() {
  const navigate = useNavigate()
  const storedUser = getStoredUser()

  const [usuario] = useState({
    nombre: storedUser?.nombre || 'Administrador',
    nombreCompleto: storedUser?.nombreCompleto || 'Director Administrativo',
    foto: isValidAvatarUrl(storedUser?.foto || storedUser?.foto_perfil) ? (storedUser?.foto || storedUser?.foto_perfil) : null,
  })

  const [config, setConfig] = useState(null)
  const [loading, setLoading] = useState(true)
  const [errorGlobal, setErrorGlobal] = useState('')

  // Toast Flotante
  const [toast, setToast] = useState(null)
  const triggerToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => {
      setToast(null)
    }, 4000)
  }

  const fetchConfig = async () => {
    const token = getStoredToken()
    if (!token) {
      navigate('/login')
      return
    }

    try {
      setLoading(true)
      setErrorGlobal('')

      const res = await fetch(`${import.meta.env.VITE_API_URL}/admin/configuracion`, {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      })

      if (res.status === 401 || res.status === 403) {
        navigate('/login')
        return
      }

      if (res.ok) {
        const data = await res.json()
        setConfig(data.plataforma || {})
      } else {
        setErrorGlobal('No se pudo cargar la configuración del sistema.')
      }
    } catch (err) {
      console.error('Error al cargar configuración:', err)
      setErrorGlobal('Error de comunicación con el servidor.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchConfig()
  }, [navigate])

  return (
    <div className="dash">
      <SidebarAdmin />

      {/* Toast Notification */}
      {toast && (
        <div className={`adm-toast ${toast.type === 'error' ? 'adm-toast--error' : ''}`}>
          <i className={`adm-toast__icon fa-solid ${toast.type === 'error' ? 'fa-triangle-exclamation' : 'fa-circle-check'}`}></i>
          <span>{toast.message}</span>
          <button className="adm-toast__close" onClick={() => setToast(null)} title="Cerrar">
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>
      )}

      <main className="dash-main">
        <DashboardHeader
          title="Configuración de la Plataforma"
          subtitle="Consulta los parámetros institucionales de EPS PetFeliz y la gestión del catálogo de servicios"
          usuario={usuario}
        />

        {errorGlobal && (
          <div className="dash-alert dash-alert--danger" style={{ marginBottom: '1.5rem' }}>
            <i className="fa-solid fa-triangle-exclamation"></i>
            <span>{errorGlobal}</span>
          </div>
        )}

        {/* ── BANNER DE ESTADO DEL SISTEMA ── */}
        <div className="dash-alert dash-alert--info" style={{ marginBottom: '1.5rem', background: '#ecfdf5', borderColor: '#a7f3d0', color: '#065f46' }}>
          <i className="fa-solid fa-shield-halved" style={{ fontSize: '1.2rem', color: '#059669' }}></i>
          <div>
            <strong style={{ display: 'block', fontSize: '0.95rem' }}>Plataforma EPS PetFeliz - Entorno de Producción Activo</strong>
            <span style={{ fontSize: '0.85rem' }}>
              Los servicios y parámetros generales se sincronizan en tiempo real con la base de datos central.
            </span>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
            <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: '1.8rem', color: '#059669', marginBottom: '0.5rem' }}></i>
            <p>Cargando información del sistema...</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            {/* Tarjeta 1: Datos Institucionales EPS */}
            <div className="admin-card">
              <div className="admin-card__header">
                <div className="admin-card__title">
                  <div className="admin-card__title-icon" style={{ background: '#ecfdf5', color: '#047857' }}>
                    <i className="fa-solid fa-hospital"></i>
                  </div>
                  <h3>Datos Generales de la EPS</h3>
                </div>
              </div>

              <div style={{ padding: '1.5rem' }}>
                <ul className="info-list">
                  <li><span>Razón Social:</span> <strong>{config?.nombre}</strong></li>
                  <li><span>NIT Corporativo:</span> <strong>{config?.nit}</strong></li>
                  <li><span>Correo Institucional:</span> <strong>{config?.email_contacto}</strong></li>
                  <li><span>Línea Telefónica Soporte:</span> <strong>{config?.telefono_soporte}</strong></li>
                  <li><span>Dirección Sede Principal:</span> <strong>{config?.direccion}</strong></li>
                  <li><span>Horario de Atención:</span> <strong>{config?.horario_atencion}</strong></li>
                </ul>

                <div style={{ marginTop: '1.5rem', padding: '1rem', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                  <span style={{ fontSize: '0.82rem', color: '#64748b', display: 'block', marginBottom: '4px' }}>
                    <i className="fa-solid fa-info-circle" style={{ marginRight: '5px' }}></i> Nota Institucional
                  </span>
                  <p style={{ fontSize: '0.84rem', color: '#334155', margin: 0, lineHeight: 1.4 }}>
                    Los datos de contacto y sedes de la EPS son administrados centralizadamente desde la configuración del servidor backend.
                  </p>
                </div>
              </div>
            </div>

            {/* Tarjeta 2: Integraciones & Catálogo de Servicios */}
            <div className="admin-card">
              <div className="admin-card__header">
                <div className="admin-card__title">
                  <div className="admin-card__title-icon" style={{ background: '#e0f2fe', color: '#0284c7' }}>
                    <i className="fa-solid fa-sliders"></i>
                  </div>
                  <h3>Integraciones & Catálogo</h3>
                </div>
              </div>

              <div style={{ padding: '1.5rem' }}>
                <ul className="info-list">
                  <li>
                    <span>Pasarela de Pago Wompi:</span>
                    <strong style={{ color: '#059669' }}>
                      <i className="fa-solid fa-circle-check" style={{ marginRight: '4px' }}></i>
                      Modo Sandbox Activo
                    </strong>
                  </li>
                  <li><span>Moneda Oficial:</span> <strong>{config?.moneda}</strong></li>
                  <li><span>Generación de Facturas PDF:</span> <strong>Habilitada (Dompdf)</strong></li>
                  <li><span>Notificaciones Correo (SMTP):</span> <strong>Cola de Trabajos (Queue)</strong></li>
                </ul>

                <div style={{ marginTop: '1.5rem', paddingTop: '1.2rem', borderTop: '1px solid #e2e8f0' }}>
                  <h4 style={{ fontFamily: "'Sora', sans-serif", fontSize: '0.95rem', fontWeight: 600, color: '#0f172a', marginBottom: '0.5rem' }}>
                    Catálogo de Servicios & Coberturas EPS
                  </h4>
                  <p style={{ fontSize: '0.84rem', color: '#64748b', marginBottom: '1rem' }}>
                    Para modificar el catálogo médico, precios de particular, copagos y activación de servicios, accede al módulo de Servicios.
                  </p>
                  <Link to="/admin/servicios" className="adm-btn-primary" style={{ display: 'inline-flex', textDecoration: 'none' }}>
                    <i className="fa-solid fa-stethoscope" style={{ marginRight: '6px' }}></i>
                    Gestionar Catálogo de Servicios
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
