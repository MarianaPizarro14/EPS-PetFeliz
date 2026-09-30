// src/components/pages/AdminPagos.jsx
import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getStoredToken, getStoredUser, isValidAvatarUrl } from '../../utils/authStorage'
import SidebarAdmin from '../ui/SidebarAdmin'
import DashboardHeader from '../ui/DashboardHeader'
import UserAvatar from '../ui/UserAvatar'
import './DashboardClient.css'
import './AdminDashboard.css'
import './AdminCitas.css'
import './AdminMascotas.css'

export default function AdminPagos() {
  const navigate = useNavigate()
  const storedUser = getStoredUser()

  const [usuario] = useState({
    nombre: storedUser?.nombre || 'Administrador',
    nombreCompleto: storedUser?.nombreCompleto || 'Director Administrativo',
    foto: isValidAvatarUrl(storedUser?.foto || storedUser?.foto_perfil) ? (storedUser?.foto || storedUser?.foto_perfil) : null,
  })

  const [pagos, setPagos] = useState([])
  const [stats, setStats] = useState({
    total_recaudado: 0,
    total_recaudado_formateado: '$0',
    pagos_mes_monto: 0,
    pagos_mes_monto_formateado: '$0',
    pagos_mes_cantidad: 0,
    pagos_exitosos: 0,
    pagos_rechazados: 0,
    total_transacciones: 0,
  })

  const [loading, setLoading] = useState(true)
  const [errorGlobal, setErrorGlobal] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterEstado, setFilterEstado] = useState('todos') // 'todos' | 'confirmado' | 'fallido' | 'reembolsado'
  const [filterRango, setFilterRango] = useState('todos') // 'todos' | 'hoy' | 'este_mes'

  // Toast Flotante
  const [toast, setToast] = useState(null)
  const triggerToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => {
      setToast(null)
    }, 4000)
  }

  // Drawer de Detalle de Pago
  const [selectedPago, setSelectedPago] = useState(null)
  const [loadingDetalle, setLoadingDetalle] = useState(false)

  // Cargar Transacciones
  const fetchPagosData = async () => {
    const token = getStoredToken()
    if (!token) {
      navigate('/login')
      return
    }

    try {
      setLoading(true)
      setErrorGlobal('')

      const res = await fetch(`${import.meta.env.VITE_API_URL}/admin/pagos`, {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      })

      if (res.status === 401 || res.status === 403) {
        navigate('/login')
        return
      }

      if (res.ok) {
        const data = await res.json()
        setPagos(data.pagos || [])
        if (data.stats) {
          setStats(data.stats)
        }
      } else {
        setErrorGlobal('No se pudo obtener el historial de transacciones.')
      }
    } catch (err) {
      console.error('Error al cargar pagos:', err)
      setErrorGlobal('Error de comunicación con el servidor de pagos.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPagosData()
  }, [navigate])

  // Abrir Detalle de Transacción
  const handleOpenDetalle = async (id_pago) => {
    const token = getStoredToken()
    setLoadingDetalle(true)
    setSelectedPago(null)

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/admin/pagos/${id_pago}`, {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      })

      if (res.ok) {
        const data = await res.json()
        setSelectedPago(data.pago)
      } else {
        triggerToast('No se pudo cargar el detalle de la transacción.', 'error')
      }
    } catch (err) {
      console.error('Error al consultar pago:', err)
      triggerToast('Error de red al consultar el detalle de pago.', 'error')
    } finally {
      setLoadingDetalle(false)
    }
  }

  // Abrir / Descargar Factura PDF (Comprobante Electrónico Imprimible)
  const handleDownloadFactura = (pago) => {
    if (!pago) return

    const clienteNombre = pago.cliente?.nombre || pago.cliente_nombre || 'Cliente EPS PetFeliz'
    const clienteCedula = pago.cliente?.cedula || '1020304050'
    const idFactura = pago.referencia_transaccion || `FAC-2026-${pago.id_pago}`
    const fecha = pago.fecha_formateada || pago.fecha || new Date().toLocaleDateString('es-CO')
    const monto = pago.monto_formateado || `$ ${pago.monto ? pago.monto.toLocaleString('es-CO') : '0'} COP`
    const metodo = pago.metodo_pago || 'Pasarela PSE / Wompi'
    const servicio = pago.servicio || 'Servicio Médico Veterinario / Cobertura EPS'
    const estado = (pago.estado || 'CONFIRMADO').toUpperCase()

    const invoiceHtml = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <title>Factura_${idFactura}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Sora:wght@600;700&display=swap');
          body { font-family: 'Inter', sans-serif; background: #ffffff; color: #0f172a; margin: 0; padding: 40px; }
          .invoice-box { max-width: 800px; margin: auto; border: 1px solid #e2e8f0; border-radius: 16px; padding: 36px; box-shadow: 0 4px 20px rgba(0,0,0,0.05); }
          .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #059669; padding-bottom: 20px; margin-bottom: 30px; }
          .logo-title { font-family: 'Sora', sans-serif; font-size: 24px; font-weight: 700; color: #059669; margin: 0; }
          .logo-sub { font-size: 13px; color: #64748b; margin-top: 4px; }
          .badge { background: #dcfce7; color: #15803d; padding: 6px 14px; border-radius: 20px; font-weight: 700; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; }
          .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 30px; }
          .info-card { background: #f8fafc; border: 1px solid #f1f5f9; padding: 16px 20px; border-radius: 12px; }
          .info-card h4 { font-family: 'Sora', sans-serif; margin: 0 0 8px 0; color: #334155; font-size: 13px; text-transform: uppercase; letter-spacing: 0.04em; }
          .info-card p { margin: 3px 0; font-size: 14px; color: #475569; }
          .info-card p strong { color: #0f172a; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; margin-bottom: 30px; }
          th { background: #059669; color: #ffffff; text-align: left; padding: 12px 16px; font-size: 13px; font-weight: 600; border-radius: 6px 6px 0 0; }
          td { padding: 14px 16px; border-bottom: 1px solid #e2e8f0; font-size: 14px; color: #334155; }
          .total-box { display: flex; justify-content: flex-end; align-items: center; gap: 20px; padding: 16px; background: #ecfdf5; border-radius: 12px; border: 1px solid #a7f3d0; }
          .total-box span { font-size: 14px; color: #047857; font-weight: 600; }
          .total-box strong { font-size: 22px; color: #047857; font-weight: 700; }
          .footer { margin-top: 40px; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 20px; font-size: 12px; color: #94a3b8; }
          @media print { body { padding: 0; } .invoice-box { border: none; box-shadow: none; } }
        </style>
      </head>
      <body>
        <div class="invoice-box">
          <div class="header">
            <div>
              <h1 class="logo-title">🐾 EPS PetFeliz</h1>
              <div class="logo-sub">Factura Electrónica de Venta y Comprobante Oficial</div>
            </div>
            <div>
              <span class="badge">${estado}</span>
            </div>
          </div>

          <div class="info-grid">
            <div class="info-card">
              <h4>DATOS DEL CLIENTE / AFILIADO</h4>
              <p><strong>Nombre:</strong> ${clienteNombre}</p>
              <p><strong>Cédula:</strong> ${clienteCedula}</p>
              <p><strong>Método de Pago:</strong> ${metodo}</p>
            </div>
            <div class="info-card">
              <h4>DETALLES DE LA TRANSACCIÓN</h4>
              <p><strong>N° Factura:</strong> ${idFactura}</p>
              <p><strong>Fecha / Hora:</strong> ${fecha}</p>
              <p><strong>Estado:</strong> <span style="color:#059669; font-weight:700;">PROCESADO Y VERIFICADO</span></p>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Descripción del Servicio / Cobertura</th>
                <th style="text-align:center;">Cantidad</th>
                <th style="text-align:right;">Monto Total</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>${servicio}</strong><br><span style="font-size:12px; color:#64748b;">Atención médica veterinaria institucional en EPS PetFeliz</span></td>
                <td style="text-align:center;">1</td>
                <td style="text-align:right; font-weight:700; color:#059669;">${monto}</td>
              </tr>
            </tbody>
          </table>

          <div class="total-box">
            <span>VALOR TOTAL PAGADO:</span>
            <strong>${monto}</strong>
          </div>

          <div class="footer">
            <p>EPS PetFeliz S.A.S. • NIT 901.458.963-4 • Sistema de Salud Veterinaria</p>
            <p>Este documento representa el comprobante oficial de pago generado electrónicamente.</p>
          </div>
        </div>
        <script>
          window.onload = function() {
            setTimeout(function() { window.print(); }, 500);
          }
        </script>
      </body>
      </html>
    `

    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(invoiceHtml)
      printWindow.document.close()
    } else {
      triggerToast('Habilita las ventanas emergentes para imprimir/descargar la factura en PDF.', 'error')
    }
  }

  // Filtrado de Pagos
  const searchLower = searchTerm.toLowerCase().trim()
  const todayStr = new Date().toISOString().split('T')[0]
  const currentYearMonth = new Date().toISOString().slice(0, 7)

  const pagosFiltrados = pagos.filter((p) => {
    // Filtro por Estado
    if (filterEstado !== 'todos' && p.estado !== filterEstado) {
      return false
    }

    // Filtro por Rango de Fecha
    if (filterRango === 'hoy' && p.fecha_raw !== todayStr) {
      return false
    }
    if (filterRango === 'este_mes' && (!p.fecha_raw || !p.fecha_raw.startsWith(currentYearMonth))) {
      return false
    }

    // Búsqueda en texto
    if (!searchLower) return true

    const clienteName = (p.cliente?.nombre || '').toLowerCase()
    const clienteEmail = (p.cliente?.email || '').toLowerCase()
    const ref = (p.referencia_transaccion || '').toLowerCase()
    const wompiId = (p.wompi_transaction_id || '').toLowerCase()
    const servicio = (p.servicio || '').toLowerCase()

    return (
      clienteName.includes(searchLower) ||
      clienteEmail.includes(searchLower) ||
      ref.includes(searchLower) ||
      wompiId.includes(searchLower) ||
      servicio.includes(searchLower) ||
      String(p.id_pago).includes(searchLower)
    )
  })

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
          title="Pagos y Facturación"
          subtitle="Monitorea las transacciones recaudadas a través de la pasarela Wompi y emite comprobantes oficiales"
          usuario={usuario}
        />

        {errorGlobal && (
          <div className="dash-alert dash-alert--danger" style={{ marginBottom: '1.5rem' }}>
            <i className="fa-solid fa-triangle-exclamation"></i>
            <span>{errorGlobal}</span>
          </div>
        )}

        {/* ── 4 TARJETAS MÉTRICAS ── */}
        <div className="admin-dash-grid-4">
          <div className="admin-stat-card" style={{ gap: '1.25rem' }}>
            <div className="admin-stat-card__info" style={{ paddingRight: '0.5rem' }}>
              <span className="admin-stat-card__title" style={{ color: '#059669', fontWeight: 700, fontSize: '0.86rem', marginBottom: '0.35rem', display: 'block' }}>
                Total Recaudado
              </span>
              <h3>{loading ? '...' : stats.total_recaudado_formateado}</h3>
              <div className="admin-trend-badge admin-trend-badge--positive">
                <i className="fa-solid fa-sack-dollar"></i>
                <span>Ingresos Confirmados</span>
              </div>
            </div>
            <div className="admin-stat-card__icon admin-stat-card__icon--green" style={{ flexShrink: 0 }}>
              <i className="fa-solid fa-money-bill-wave"></i>
            </div>
          </div>

          <div className="admin-stat-card" style={{ gap: '1.25rem' }}>
            <div className="admin-stat-card__info" style={{ paddingRight: '0.5rem' }}>
              <span className="admin-stat-card__title" style={{ color: '#0284c7', fontWeight: 700, fontSize: '0.86rem', marginBottom: '0.35rem', display: 'block' }}>
                Recaudo Mes Actual
              </span>
              <h3>{loading ? '...' : stats.pagos_mes_monto_formateado}</h3>
              <div className="admin-trend-badge admin-trend-badge--positive">
                <i className="fa-solid fa-calendar-check"></i>
                <span>{stats.pagos_mes_cantidad} Transacciones</span>
              </div>
            </div>
            <div className="admin-stat-card__icon admin-stat-card__icon--blue" style={{ flexShrink: 0 }}>
              <i className="fa-solid fa-chart-line"></i>
            </div>
          </div>

          <div className="admin-stat-card" style={{ gap: '1.25rem' }}>
            <div className="admin-stat-card__info" style={{ paddingRight: '0.5rem' }}>
              <span className="admin-stat-card__title" style={{ color: '#059669', fontWeight: 700, fontSize: '0.86rem', marginBottom: '0.35rem', display: 'block' }}>
                Transacciones Exitosas
              </span>
              <h3>{loading ? '...' : stats.pagos_exitosos}</h3>
              <div className="admin-trend-badge admin-trend-badge--positive">
                <i className="fa-solid fa-circle-check"></i>
                <span>Pasarela Wompi Sandbox</span>
              </div>
            </div>
            <div className="admin-stat-card__icon admin-stat-card__icon--green" style={{ flexShrink: 0 }}>
              <i className="fa-solid fa-circle-check"></i>
            </div>
          </div>

          <div className="admin-stat-card" style={{ gap: '1.25rem' }}>
            <div className="admin-stat-card__info" style={{ paddingRight: '0.5rem' }}>
              <span className="admin-stat-card__title" style={{ color: '#d97706', fontWeight: 700, fontSize: '0.86rem', marginBottom: '0.35rem', display: 'block' }}>
                Rechazadas / Pendientes
              </span>
              <h3>{loading ? '...' : stats.pagos_rechazados}</h3>
              <div className="admin-trend-badge admin-trend-badge--positive" style={{ color: '#d97706', background: '#fffbe8', borderColor: '#fde68a' }}>
                <i className="fa-solid fa-clock"></i>
                <span>Revisión de Cobro</span>
              </div>
            </div>
            <div className="admin-stat-card__icon admin-stat-card__icon--amber" style={{ flexShrink: 0 }}>
              <i className="fa-solid fa-credit-card"></i>
            </div>
          </div>
        </div>

        {/* ── BARRA DE HERRAMIENTAS: BÚSQUEDA Y FILTROS ── */}
        <div className="adm-toolbar">
          <div className="adm-toolbar__search">
            <i className="fa-solid fa-magnifying-glass search-icon"></i>
            <input
              type="text"
              placeholder="Buscar por cliente, correo, servicio o ID de transacción Wompi..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button type="button" className="clear-btn" onClick={() => setSearchTerm('')}>
                <i className="fa-solid fa-xmark"></i>
              </button>
            )}
          </div>

          <div className="adm-toolbar__filters">
            <div className="adm-filter-group">
              <label>Estado:</label>
              <select value={filterEstado} onChange={(e) => setFilterEstado(e.target.value)}>
                <option value="todos">Todos los estados</option>
                <option value="confirmado">Confirmado / Aprobado</option>
                <option value="fallido">Fallido / Rechazado</option>
                <option value="reembolsado">Reembolsado</option>
              </select>
            </div>

            <div className="adm-filter-group">
              <label>Rango:</label>
              <select value={filterRango} onChange={(e) => setFilterRango(e.target.value)}>
                <option value="todos">Todo el historial</option>
                <option value="hoy">Transacciones de Hoy</option>
                <option value="este_mes">Este Mes</option>
              </select>
            </div>
          </div>
        </div>

        {/* ── TABLA PRINCIPAL DE TRANSACCIONES ── */}
        <div className="admin-card">
          <div className="admin-card__header">
            <div className="admin-card__title">
              <div className="admin-card__title-icon" style={{ background: '#ecfdf5', color: '#047857' }}>
                <i className="fa-regular fa-file-lines"></i>
              </div>
              <h3>Historial de Transacciones</h3>
            </div>
            <span style={{ fontSize: '0.82rem', color: '#64748b', fontWeight: 600 }}>
              {pagosFiltrados.length} Registradas
            </span>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
              <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: '1.8rem', color: '#059669', marginBottom: '0.5rem' }}></i>
              <p>Cargando transacciones de Wompi...</p>
            </div>
          ) : pagosFiltrados.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
              <i className="fa-solid fa-receipt" style={{ fontSize: '2rem', color: '#cbd5e1', marginBottom: '0.5rem' }}></i>
              <p>No se encontraron pagos con los filtros seleccionados.</p>
            </div>
          ) : (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>TRANSACCIÓN</th>
                    <th>CLIENTE</th>
                    <th>CONCEPTO / SERVICIO</th>
                    <th>MONTO</th>
                    <th>MÉTODO DE PAGO</th>
                    <th>ESTADO</th>
                    <th style={{ textAlign: 'center' }}>ACCIONES</th>
                  </tr>
                </thead>
                <tbody>
                  {pagosFiltrados.map((p) => (
                    <tr key={p.id_pago}>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <strong style={{ color: '#0f172a', fontSize: '0.88rem' }}>#{p.id_pago}</strong>
                          <span style={{ fontSize: '0.78rem', color: '#64748b' }}>{p.fecha}</span>
                        </div>
                      </td>
                      <td>
                        <div className="pet-info-cell">
                          <UserAvatar user={p.cliente} size="38px" fontSize="1rem" />
                          <div>
                            <strong className="pet-name">{p.cliente.nombre}</strong>
                            <span className="pet-meta-sub">{p.cliente.email}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontWeight: 600, color: '#334155', fontSize: '0.88rem' }}>{p.servicio}</span>
                          {p.mascota && (
                            <span style={{ fontSize: '0.78rem', color: '#059669', fontWeight: 500 }}>
                              <i className="fa-solid fa-paw" style={{ marginRight: '4px' }}></i>
                              Paciente: {p.mascota}
                            </span>
                          )}
                        </div>
                      </td>
                      <td>
                        <span style={{ fontWeight: 700, color: '#047857', fontSize: '0.92rem' }}>
                          {p.monto_formateado}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontSize: '0.85rem', color: '#475569', fontWeight: 500 }}>
                          <i className="fa-solid fa-credit-card" style={{ color: '#0284c7', marginRight: '5px' }}></i>
                          {p.metodo_pago}
                        </span>
                      </td>
                      <td>
                        {p.estado === 'confirmado' ? (
                          <span className="cita-tag-badge cita-tag-badge--asistio">
                            <i className="fa-solid fa-circle-check"></i> Aprobado
                          </span>
                        ) : p.estado === 'fallido' ? (
                          <span className="cita-tag-badge cita-tag-badge--urgencia" style={{ background: '#fef2f2', color: '#dc2626', borderColor: '#fecaca' }}>
                            <i className="fa-solid fa-circle-xmark"></i> Rechazado
                          </span>
                        ) : (
                          <span className="cita-tag-badge cita-tag-badge--urgencia">
                            <i className="fa-solid fa-clock"></i> Pendiente
                          </span>
                        )}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <div className="action-buttons-group">
                          <button
                            type="button"
                            className="act-btn act-btn--view"
                            title="Ver Detalle de Transacción"
                            onClick={() => handleOpenDetalle(p.id_pago)}
                          >
                            <i className="fa-solid fa-receipt"></i>
                            <span>Detalle</span>
                          </button>
                          <button
                            type="button"
                            className="act-btn act-btn--edit"
                            title="Ver/Descargar Factura PDF"
                            onClick={() => handleDownloadFactura(p)}
                          >
                            <i className="fa-solid fa-file-pdf"></i>
                            <span>Factura</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* ── DRAWER LATERAL: DETALLE DE TRANSACCIÓN ── */}
      {(selectedPago || loadingDetalle) && (
        <div className="adm-drawer-overlay" onClick={() => setSelectedPago(null)}>
          <div className="adm-drawer-panel" onClick={(e) => e.stopPropagation()}>
            {loadingDetalle ? (
              <div style={{ padding: '4rem', textAlign: 'center', color: '#64748b' }}>
                <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: '2rem', color: '#059669', marginBottom: '1rem' }}></i>
                <p>Cargando comprobante de pago...</p>
              </div>
            ) : selectedPago && (
              <>
                <div className="adm-vet-hero" style={{ background: '#064e3b' }}>
                  <div className="adm-vet-hero__avatar-wrap">
                    <UserAvatar
                      user={selectedPago.cliente}
                      size="76px"
                      fontSize="2rem"
                      style={{
                        border: '3px solid rgba(255,255,255,0.95)',
                        boxShadow: '0 6px 18px rgba(0,0,0,0.25)',
                      }}
                    />
                  </div>
                  <div className="adm-vet-hero__info">
                    <div className="adm-vet-hero__tag">
                      <i className="fa-solid fa-receipt"></i>
                      <span>Comprobante de Pago</span>
                    </div>
                    <h2>{selectedPago.monto_formateado} COP</h2>
                    <div className="adm-vet-hero__tp">
                      <span className="adm-vet-hero__badge">ID Transacción #{selectedPago.id_pago}</span>
                      <span className="adm-vet-hero__badge adm-vet-hero__badge--tp">
                        {selectedPago.estado === 'confirmado' ? 'Aprobado Wompi' : selectedPago.estado}
                      </span>
                    </div>
                  </div>
                  <button className="adm-drawer-close adm-drawer-close--white" onClick={() => setSelectedPago(null)} title="Cerrar Comprobante">
                    <i className="fa-solid fa-xmark"></i>
                  </button>
                </div>

                <div className="adm-drawer-body">
                  <div className="info-box" style={{ marginBottom: '1.2rem' }}>
                    <h4 className="info-box__title">
                      <i className="fa-solid fa-user" style={{ color: '#059669' }}></i> Datos del Pagador
                    </h4>
                    <ul className="info-list">
                      <li><span>Cliente / Cuidador:</span> <strong>{selectedPago.cliente?.nombre}</strong></li>
                      <li><span>Correo Registrado:</span> <strong>{selectedPago.cliente?.email}</strong></li>
                      <li><span>Teléfono:</span> <strong>{selectedPago.cliente?.telefono || 'No registrado'}</strong></li>
                    </ul>
                  </div>

                  <div className="info-box">
                    <h4 className="info-box__title">
                      <i className="fa-solid fa-credit-card" style={{ color: '#0284c7' }}></i> Información Financiera & Wompi
                    </h4>
                    <ul className="info-list">
                      <li><span>Concepto:</span> <strong>{selectedPago.servicio}</strong></li>
                      {selectedPago.mascota && <li><span>Mascota Asociada:</span> <strong>{selectedPago.mascota}</strong></li>}
                      {selectedPago.veterinario && <li><span>Médico Atendiente:</span> <strong>{selectedPago.veterinario}</strong></li>}
                      <li><span>Tipo de Cobertura:</span> <strong>{selectedPago.tipo_cobertura}</strong></li>
                      <li><span>Método de Pago:</span> <strong>{selectedPago.metodo_pago}</strong></li>
                      <li><span>Referencia Transacción:</span> <strong>{selectedPago.referencia_transaccion}</strong></li>
                      {selectedPago.wompi_transaction_id && (
                        <li><span>ID Transacción Wompi:</span> <strong style={{ color: '#0284c7' }}>{selectedPago.wompi_transaction_id}</strong></li>
                      )}
                      <li><span>Fecha y Hora:</span> <strong>{selectedPago.fecha}</strong></li>
                    </ul>
                  </div>
                </div>

                <div className="adm-drawer-footer">
                  <button
                    type="button"
                    className="adm-btn-primary"
                    onClick={() => handleDownloadFactura(selectedPago)}
                    style={{ width: '100%', justifyContent: 'center', display: 'flex', alignItems: 'center' }}
                  >
                    <i className="fa-solid fa-file-pdf" style={{ marginRight: '6px' }}></i>
                    Descargar Factura Oficial PDF
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
