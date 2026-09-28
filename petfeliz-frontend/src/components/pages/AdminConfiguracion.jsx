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
  const [integraciones, setIntegraciones] = useState(null)
  const [loading, setLoading] = useState(true)
  const [checkingIntegraciones, setCheckingIntegraciones] = useState(false)
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

  const fetchIntegraciones = async () => {
    const token = getStoredToken()
    if (!token) return

    try {
      setCheckingIntegraciones(true)
      const res = await fetch(`${import.meta.env.VITE_API_URL}/admin/configuracion/estado-integraciones`, {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      })

      if (res.ok) {
        const data = await res.json()
        setIntegraciones(data.integraciones || {})
      }
    } catch (err) {
      console.error('Error al verificar integraciones:', err)
    } finally {
      setCheckingIntegraciones(false)
    }
  }

  useEffect(() => {
    fetchConfig()
    fetchIntegraciones()
  }, [navigate])

  const renderIntegrationBadge = (itemKey) => {
    const item = integraciones ? integraciones[itemKey] : null

    if (!item) {
      return (
        <div style={{ padding: '0.65rem 0.85rem', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0', marginTop: '0.4rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.82rem', color: '#64748b' }}>
              <i className="fa-solid fa-circle-question" style={{ marginRight: '6px' }}></i> Estado no verificable
            </span>
            <span className="cita-tag-badge" style={{ background: '#f1f5f9', color: '#64748b', borderColor: '#cbd5e1' }}>
              Gris
            </span>
          </div>
        </div>
      )
    }

    const badgeStyles = {
      verde: { bg: '#ecfdf5', color: '#059669', border: '#a7f3d0' },
      naranja: { bg: '#fffbe8', color: '#d97706', border: '#fde68a' },
      rojo: { bg: '#fef2f2', color: '#dc2626', border: '#fecaca' },
      gris: { bg: '#f8fafc', color: '#64748b', border: '#cbd5e1' },
    }

    const style = badgeStyles[item.badge_color] || badgeStyles.gris

    return (
      <div style={{ padding: '0.75rem 0.9rem', background: style.bg, borderRadius: '10px', border: `1px solid ${style.border}`, marginTop: '0.4rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.3rem' }}>
          <strong style={{ fontSize: '0.86rem', color: style.color, fontFamily: "'Sora', sans-serif" }}>
            <i className={item.icono || 'fa-solid fa-circle-info'} style={{ marginRight: '6px' }}></i>
            {item.titulo}
          </strong>
          <span className="cita-tag-badge" style={{ background: '#ffffff', color: style.color, borderColor: style.border, fontSize: '0.75rem', padding: '0.25rem 0.65rem', fontWeight: 700 }}>
            {item.estado === 'produccion' ? 'PRODUCCIÓN' : item.estado === 'sandbox' ? 'SANDBOX' : item.estado === 'ok' ? 'OK / ACTIVO' : item.estado === 'error' ? 'ERROR / FALTANTE' : 'NO VERIFICABLE'}
          </span>
        </div>
        <p style={{ fontSize: '0.81rem', color: '#334155', margin: 0, lineHeight: 1.4, fontFamily: "'Inter', sans-serif" }}>
          {item.mensaje}
        </p>
      </div>
    )
  }

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

        {/* ── TARJETA DE ESTADO DE LA PLATAFORMA ── */}
        <div className="admin-card" style={{ marginBottom: '1.5rem', padding: '1.25rem 1.5rem', background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 18px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.1rem' }}>
              <div style={{
                width: '50px',
                height: '50px',
                borderRadius: '14px',
                background: integraciones?.wompi?.estado === 'produccion' ? '#ecfdf5' : integraciones?.wompi?.estado === 'sandbox' ? '#fffbe8' : '#fef2f2',
                color: integraciones?.wompi?.estado === 'produccion' ? '#059669' : integraciones?.wompi?.estado === 'sandbox' ? '#d97706' : '#dc2626',
                border: `1px solid ${integraciones?.wompi?.estado === 'produccion' ? '#a7f3d0' : integraciones?.wompi?.estado === 'sandbox' ? '#fde68a' : '#fecaca'}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.35rem',
                flexShrink: 0
              }}>
                <i className={integraciones?.wompi?.icono || 'fa-solid fa-shield-halved'}></i>
              </div>
              <div>
                <h4 style={{ fontFamily: "'Sora', sans-serif", fontSize: '1.05rem', fontWeight: 700, color: '#0f172a', margin: '0 0 0.25rem 0' }}>
                  Estado General de Integraciones
                </h4>
                <p style={{ fontSize: '0.86rem', color: '#64748b', margin: 0, fontFamily: "'Inter', sans-serif" }}>
                  {integraciones?.wompi?.mensaje || 'Evaluando diagnóstico en tiempo real del servidor backend...'}
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <span className="cita-tag-badge cita-tag-badge--asistio" style={{ padding: '0.45rem 0.9rem', fontSize: '0.82rem' }}>
                <i className="fa-solid fa-circle-check"></i> Servidor API Activo
              </span>
              {integraciones?.wompi?.estado === 'produccion' ? (
                <span className="cita-tag-badge" style={{ background: '#ecfdf5', color: '#059669', borderColor: '#a7f3d0', padding: '0.45rem 0.9rem', fontSize: '0.82rem', fontWeight: 700 }}>
                  <i className="fa-solid fa-circle-check"></i> Producción Activa (Pagos Reales)
                </span>
              ) : integraciones?.wompi?.estado === 'sandbox' ? (
                <span className="cita-tag-badge" style={{ background: '#fffbe8', color: '#d97706', borderColor: '#fde68a', padding: '0.45rem 0.9rem', fontSize: '0.82rem', fontWeight: 700 }}>
                  <i className="fa-solid fa-vial"></i> Modo Sandbox (Cobros Pruebas)
                </span>
              ) : (
                <span className="cita-tag-badge" style={{ background: '#fef2f2', color: '#dc2626', borderColor: '#fecaca', padding: '0.45rem 0.9rem', fontSize: '0.82rem', fontWeight: 700 }}>
                  <i className="fa-solid fa-circle-xmark"></i> Wompi No Disponible
                </span>
              )}
            </div>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
            <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: '1.8rem', color: '#059669', marginBottom: '0.5rem' }}></i>
            <p>Cargando información del sistema...</p>
          </div>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
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
                    <h3>Integraciones & Diagnóstico</h3>
                  </div>
                  <button
                    type="button"
                    className="act-btn act-btn--view"
                    disabled={checkingIntegraciones}
                    onClick={() => {
                      fetchIntegraciones()
                      triggerToast('Sincronizando diagnóstico de integraciones...', 'success')
                    }}
                    style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                  >
                    <i className={`fa-solid fa-arrows-rotate ${checkingIntegraciones ? 'fa-spin' : ''}`}></i>
                    <span>{checkingIntegraciones ? 'Verificando...' : 'Revisar Estado'}</span>
                  </button>
                </div>

                <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {/* Item Wompi */}
                  <div>
                    <span style={{ fontSize: '0.84rem', fontWeight: 600, color: '#0f172a' }}>Pasarela de Pago Wompi:</span>
                    {renderIntegrationBadge('wompi')}
                  </div>

                  {/* Item Dompdf */}
                  <div>
                    <span style={{ fontSize: '0.84rem', fontWeight: 600, color: '#0f172a' }}>Generación de Facturas PDF (Dompdf):</span>
                    {renderIntegrationBadge('dompdf')}
                  </div>

                  {/* Item Correo SMTP */}
                  <div>
                    <span style={{ fontSize: '0.84rem', fontWeight: 600, color: '#0f172a' }}>Notificaciones Correo (SMTP / Queue):</span>
                    {renderIntegrationBadge('mail')}
                  </div>

                  <div style={{ marginTop: '0.5rem', paddingTop: '1rem', borderTop: '1px solid #e2e8f0' }}>
                    <h4 style={{ fontFamily: "'Sora', sans-serif", fontSize: '0.95rem', fontWeight: 600, color: '#0f172a', marginBottom: '0.4rem' }}>
                      Catálogo de Servicios & Coberturas EPS
                    </h4>
                    <p style={{ fontSize: '0.82rem', color: '#64748b', marginBottom: '0.8rem' }}>
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

            {/* ── SECCIÓN: MANUALES DE USUARIO ── */}
            <div className="admin-card">
              <div className="admin-card__header">
                <div className="admin-card__title">
                  <div className="admin-card__title-icon" style={{ background: '#f3e8ff', color: '#7e22ce' }}>
                    <i className="fa-solid fa-book-bookmark"></i>
                  </div>
                  <h3>Manuales de Usuario & Documentación del Sistema</h3>
                </div>
                <span style={{ fontSize: '0.82rem', color: '#64748b', fontWeight: 600 }}>
                  Formatos PDF Oficiales
                </span>
              </div>

              <div style={{ padding: '1.5rem' }}>
                <p style={{ fontSize: '0.88rem', color: '#475569', marginBottom: '1.25rem', fontFamily: "'Inter', sans-serif" }}>
                  Descarga las guías de uso y manuales de procedimientos según el rol correspondiente en la plataforma EPS PetFeliz:
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.2rem' }}>
                  {/* Manual 1: Instalación */}
                  <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.2rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.15rem', marginBottom: '0.8rem' }}>
                        <i className="fa-solid fa-file-code"></i>
                      </div>
                      <h4 style={{ fontFamily: "'Sora', sans-serif", fontSize: '0.98rem', fontWeight: 700, color: '#0f172a', margin: '0 0 0.35rem 0' }}>
                        Manual de Instalación
                      </h4>
                      <p style={{ fontSize: '0.82rem', color: '#64748b', margin: '0 0 1rem 0', lineHeight: 1.45 }}>
                        Guía técnica de arquitectura, dependencias backend/frontend y despliegue en servidor.
                      </p>
                    </div>
                    <a
                      href="/manuales/manual-instalacion.pdf"
                      download
                      target="_blank"
                      rel="noopener noreferrer"
                      className="act-btn act-btn--view"
                      style={{ textDecoration: 'none', justifyContent: 'center', width: '100%', display: 'flex', gap: '6px' }}
                    >
                      <i className="fa-solid fa-download"></i>
                      <span>Descargar PDF</span>
                    </a>
                  </div>

                  {/* Manual 2: Administrador */}
                  <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.2rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: '#e0f2fe', color: '#0284c7', border: '1px solid #bae6fd', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.15rem', marginBottom: '0.8rem' }}>
                        <i className="fa-solid fa-user-shield"></i>
                      </div>
                      <h4 style={{ fontFamily: "'Sora', sans-serif", fontSize: '0.98rem', fontWeight: 700, color: '#0f172a', margin: '0 0 0.35rem 0' }}>
                        Manual del Administrador
                      </h4>
                      <p style={{ fontSize: '0.82rem', color: '#64748b', margin: '0 0 1rem 0', lineHeight: 1.45 }}>
                        Guía operativa para administración de usuarios, facturación Wompi, citas y servicios.
                      </p>
                    </div>
                    <a
                      href="/manuales/manual-administrador.pdf"
                      download
                      target="_blank"
                      rel="noopener noreferrer"
                      className="act-btn act-btn--view"
                      style={{ textDecoration: 'none', justifyContent: 'center', width: '100%', display: 'flex', gap: '6px' }}
                    >
                      <i className="fa-solid fa-download"></i>
                      <span>Descargar PDF</span>
                    </a>
                  </div>

                  {/* Manual 3: Recepcionista y Veterinario */}
                  <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.2rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: '#f3e8ff', color: '#7e22ce', border: '1px solid #e9d5ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.15rem', marginBottom: '0.8rem' }}>
                        <i className="fa-solid fa-notes-medical"></i>
                      </div>
                      <h4 style={{ fontFamily: "'Sora', sans-serif", fontSize: '0.98rem', fontWeight: 700, color: '#0f172a', margin: '0 0 0.35rem 0' }}>
                        Manual del Recepcionista y Veterinario
                      </h4>
                      <p style={{ fontSize: '0.82rem', color: '#64748b', margin: '0 0 1rem 0', lineHeight: 1.45 }}>
                        Guía para agendamiento de citas, recepción de pacientes, validación EPS, portal médico y expedientes clínicos.
                      </p>
                    </div>
                    <a
                      href="/manuales/manual-recepcionista-veterinario.pdf"
                      download
                      target="_blank"
                      rel="noopener noreferrer"
                      className="act-btn act-btn--view"
                      style={{ textDecoration: 'none', justifyContent: 'center', width: '100%', display: 'flex', gap: '6px' }}
                    >
                      <i className="fa-solid fa-download"></i>
                      <span>Descargar PDF</span>
                    </a>
                  </div>

                  {/* Manual 4: Usuario / Cliente */}
                  <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.2rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: '#fef3c7', color: '#d97706', border: '1px solid #fde68a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.15rem', marginBottom: '0.8rem' }}>
                        <i className="fa-solid fa-users"></i>
                      </div>
                      <h4 style={{ fontFamily: "'Sora', sans-serif", fontSize: '0.98rem', fontWeight: 700, color: '#0f172a', margin: '0 0 0.35rem 0' }}>
                        Manual de Usuario
                      </h4>
                      <p style={{ fontSize: '0.82rem', color: '#64748b', margin: '0 0 1rem 0', lineHeight: 1.45 }}>
                        Guía para clientes y afiliados: registro, reserva de citas, pago de membresía, carné digital y facturas.
                      </p>
                    </div>
                    <a
                      href="/manuales/manual-usuario.pdf"
                      download
                      target="_blank"
                      rel="noopener noreferrer"
                      className="act-btn act-btn--view"
                      style={{ textDecoration: 'none', justifyContent: 'center', width: '100%', display: 'flex', gap: '6px' }}
                    >
                      <i className="fa-solid fa-download"></i>
                      <span>Descargar PDF</span>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  )
}
