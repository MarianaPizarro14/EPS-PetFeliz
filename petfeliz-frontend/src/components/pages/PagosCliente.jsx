import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getStoredToken } from '../../utils/authStorage'
import SidebarClient from '../ui/SidebarClient'
import DashboardHeader from '../ui/DashboardHeader'
import './DashboardClient.css'
import './PagosCliente.css'

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

import { useUser } from '../../context/UserContext'

export default function PagosCliente() {
  const navigate = useNavigate()
  const { usuario, setUsuario } = useUser()

  const [pagos, setPagos] = useState([])
  const [mascotas, setMascotas] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Filtros
  const [selectedMascota, setSelectedMascota] = useState('todas')
  const [selectedCobertura, setSelectedCobertura] = useState('todas')

  // Modal de Recibo seleccionando un pago
  const [selectedPagoModal, setSelectedPagoModal] = useState(null)

  useEffect(() => {
    const fetchPagosData = async () => {
      const token = getStoredToken()
      if (!token) {
        navigate('/login')
        return
      }

      try {
        setLoading(true)
        setError('')

        const headers = { Authorization: `Bearer ${token}`, Accept: 'application/json' }
        const [resUser, resMasc, resPagos] = await Promise.all([
          fetch(`${import.meta.env.VITE_API_URL}/me`, { headers }),
          fetch(`${import.meta.env.VITE_API_URL}/mascotas`, { headers }),
          fetch(`${import.meta.env.VITE_API_URL}/cliente/pagos`, { headers }),
        ])

        if (resUser.ok) {
          const uData = await resUser.json()
          setUsuario(uData.usuario || uData)
        }
        if (resMasc.ok) {
          const mData = await resMasc.json()
          setMascotas(Array.isArray(mData) ? mData : [])
        }
        if (resPagos.ok) {
          const pData = await resPagos.json()
          setPagos(Array.isArray(pData) ? pData : [])
        }
      } catch (err) {
        console.error('Error al cargar pagos:', err)
        setError('Ocurrió un fallo al cargar la información de pagos y facturación.')
      } finally {
        setLoading(false)
      }
    }

    fetchPagosData()
  }, [navigate])

  // Filtrado dinámico
  const pagosFiltrados = pagos.filter((p) => {
    const matchesMascota =
      selectedMascota === 'todas' ||
      (p.mascota && String(p.mascota.id) === String(selectedMascota))

    const matchesCobertura =
      selectedCobertura === 'todas' ||
      p.tipo_cobertura === selectedCobertura

    return matchesMascota && matchesCobertura
  })

  // Estadísticas calculadas
  const totalMontoPagado = pagos
    .filter((p) => p.estado === 'confirmado')
    .reduce((acc, curr) => acc + (Number(curr.monto) || 0), 0)

  const formatCOP = (val) => {
    if (val === 0 || !val || isNaN(val)) return '$0 (Cubierto EPS)'
    return `$${Number(val).toLocaleString('es-CO')}`
  }

  return (
    <div className="dash">
      <SidebarClient />

      <main className="dash-main">
        <DashboardHeader
          title="Pagos y Facturación"
          subtitle="Consulta el historial de transacciones, recibos y cobertura de atención veterinaria"
          usuario={usuario}
          onUserUpdated={setUsuario}
        />

        <div className="pagos-cli-card-box">
          {/* ── STATS RESUMEN ── */}
          <div className="pagos-cli-stats">
            <div className="pagos-cli-stat-card">
              <div className="pagos-cli-stat-icon">
                <i className="fa-solid fa-receipt"></i>
              </div>
              <div className="pagos-cli-stat-info">
                <span className="pagos-cli-stat-val">{pagos.length}</span>
                <span className="pagos-cli-stat-label">Transacciones Registradas</span>
              </div>
            </div>

            <div className="pagos-cli-stat-card">
              <div className="pagos-cli-stat-icon" style={{ background: '#e0f2fe', color: '#0369a1' }}>
                <i className="fa-solid fa-wallet"></i>
              </div>
              <div className="pagos-cli-stat-info">
                <span className="pagos-cli-stat-val">${totalMontoPagado.toLocaleString('es-CO')}</span>
                <span className="pagos-cli-stat-label">Total Copagos / Pagos</span>
              </div>
            </div>

            <div className="pagos-cli-stat-card">
              <div className="pagos-cli-stat-icon" style={{ background: '#fef3c7', color: '#b45309' }}>
                <i className="fa-solid fa-shield-halved"></i>
              </div>
              <div className="pagos-cli-stat-info">
                <span className="pagos-cli-stat-val">Activo</span>
                <span className="pagos-cli-stat-label">Plan EPS PetFeliz</span>
              </div>
            </div>
          </div>

          {error && (
            <div className="dash-alert dash-alert--danger">
              <i className="fa-solid fa-triangle-exclamation"></i>
              <span>{error}</span>
            </div>
          )}

          {/* ── BARRA DE FILTROS ── */}
          <div className="pagos-cli-filter-bar">
            <div className="pagos-cli-filter-group">
              <label htmlFor="mascota-filter" className="pagos-cli-filter-label">
                Filtrar por Mascota:
              </label>
              <select
                id="mascota-filter"
                className="pagos-cli-select"
                value={selectedMascota}
                onChange={(e) => setSelectedMascota(e.target.value)}
              >
                <option value="todas">Todas las mascotas ({pagos.length})</option>
                {mascotas.map((m) => (
                  <option key={m.id_mascota} value={m.id_mascota}>
                    {m.nombre} ({m.especie})
                  </option>
                ))}
              </select>
            </div>

            <div className="pagos-cli-filter-group">
              <label htmlFor="cobertura-filter" className="pagos-cli-filter-label">
                Tipo de Cobertura:
              </label>
              <select
                id="cobertura-filter"
                className="pagos-cli-select"
                value={selectedCobertura}
                onChange={(e) => setSelectedCobertura(e.target.value)}
              >
                <option value="todas">Todas las coberturas</option>
                <option value="eps">Incluido EPS</option>
                <option value="copago">Copago</option>
                <option value="particular">Particular</option>
              </select>
            </div>
          </div>

          {/* ── TABLA / CONTENIDO ── */}
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: '1rem 0' }}>
              {[1, 2, 3, 4].map((idx) => (
                <div key={idx} className="skeleton-box" style={{ width: '100%', height: '54px', borderRadius: '10px' }}></div>
              ))}
            </div>
          ) : pagosFiltrados.length === 0 ? (
            <div className="pagos-cli-empty">
              <i className="fa-solid fa-file-invoice-dollar pagos-cli-empty__icon"></i>
              <p className="pagos-cli-empty__title">No se encontraron pagos registrados</p>
              <p style={{ fontSize: '0.875rem' }}>
                {selectedMascota !== 'todas' || selectedCobertura !== 'todas'
                  ? 'No hay transacciones que coincidan con los filtros aplicados.'
                  : 'Tus pagos y facturas generadas al agendar citas aparecerán listados en este panel.'}
              </p>
            </div>
          ) : (
            <div className="pagos-cli-table-container">
              <table className="pagos-cli-table">
                <thead>
                  <tr>
                    <th>Ref / Fecha</th>
                    <th>Servicio</th>
                    <th>Mascota</th>
                    <th>Cobertura</th>
                    <th>Método Pago</th>
                    <th>Estado</th>
                    <th>Monto</th>
                    <th>Comprobante</th>
                  </tr>
                </thead>
                <tbody>
                  {pagosFiltrados.map((p) => {
                    const cobBadge = p.tipo_cobertura === 'eps'
                      ? 'pagos-cli-badge--eps'
                      : p.tipo_cobertura === 'copago'
                      ? 'pagos-cli-badge--copago'
                      : 'pagos-cli-badge--particular'

                    const cobTexto = p.tipo_cobertura === 'eps'
                      ? 'Incluido EPS'
                      : p.tipo_cobertura === 'copago'
                      ? 'Copago EPS'
                      : 'Particular'

                    return (
                      <tr key={p.id_pago}>
                        <td>
                          <div style={{ fontWeight: 600, color: '#0f172a' }}>
                            {p.referencia_transaccion || `#PAY-${p.id_pago}`}
                          </div>
                          <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                            {p.fecha_pago || p.fecha_cita}
                          </div>
                        </td>
                        <td>
                          <div style={{ fontWeight: 600, color: '#1e293b' }}>{p.servicio_nombre}</div>
                          {p.fecha_cita && (
                            <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                              Cita: {p.fecha_cita} ({p.hora_cita})
                            </div>
                          )}
                        </td>
                        <td>
                          <div className="pagos-cli-pet-cell">
                            <img
                              src={getPhotoUrl(p.mascota?.foto, FALLBACK_PET_IMG)}
                              alt={p.mascota?.nombre || 'Mascota'}
                              className="pagos-cli-pet-img"
                              onError={(e) => {
                                e.target.onerror = null
                                e.target.src = FALLBACK_PET_IMG
                              }}
                            />
                            <span>{p.mascota?.nombre || 'Mascota'}</span>
                          </div>
                        </td>
                        <td>
                          <span className={`pagos-cli-badge ${cobBadge}`}>
                            {cobTexto}
                          </span>
                        </td>
                        <td>
                          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>
                            {p.metodo_pago}
                          </span>
                        </td>
                        <td>
                          <span className="pagos-cli-badge pagos-cli-badge--confirmado">
                            <i className="fa-solid fa-circle-check"></i>
                            {p.estado === 'confirmado' ? 'Aprobado' : p.estado}
                          </span>
                        </td>
                        <td>
                          <span style={{ fontWeight: 700, color: '#0f172a' }}>
                            {formatCOP(p.monto)}
                          </span>
                        </td>
                        <td>
                          <button
                            type="button"
                            className="pagos-cli-btn-recibo"
                            onClick={() => setSelectedPagoModal(p)}
                          >
                            <i className="fa-solid fa-print"></i>
                            <span>Ver Recibo</span>
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* ── MODAL REUTILIZABLE DE COMPROBANTE DE PAGO ── */}
      {selectedPagoModal && (
        <div className="pagos-modal-overlay">
          <div className="pagos-modal-card">
            <div className="pagos-modal-header">
              <h3>Comprobante de Pago</h3>
              <button
                type="button"
                className="pagos-modal-close"
                onClick={() => setSelectedPagoModal(null)}
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <div className="pagos-modal-body">
              <div className="pagos-receipt-box">
                <div className="pagos-receipt-title">
                  <h4>EPS PetFeliz Veterinarios</h4>
                  <span style={{ color: '#64748b', fontSize: '0.78rem' }}>
                    NIT: 901.234.567-8 • Recibo No. {selectedPagoModal.referencia_transaccion || `#PAY-${selectedPagoModal.id_pago}`}
                  </span>
                </div>

                <div className="pagos-receipt-row">
                  <span>Cliente:</span>
                  <strong>{usuario.nombreCompleto || usuario.nombre}</strong>
                </div>

                <div className="pagos-receipt-row">
                  <span>Paciente:</span>
                  <strong>
                    {selectedPagoModal.mascota?.nombre} ({selectedPagoModal.mascota?.especie || 'Mascota'})
                  </strong>
                </div>

                <div className="pagos-receipt-row">
                  <span>Servicio:</span>
                  <strong>{selectedPagoModal.servicio_nombre}</strong>
                </div>

                <div className="pagos-receipt-row">
                  <span>Médico Asignado:</span>
                  <strong>{selectedPagoModal.veterinario?.nombre || 'Dra. Laura Martínez'}</strong>
                </div>

                <div className="pagos-receipt-row">
                  <span>Fecha de Cita:</span>
                  <strong>
                    {selectedPagoModal.fecha_cita} {selectedPagoModal.hora_cita}
                  </strong>
                </div>

                <div className="pagos-receipt-row">
                  <span>Método de Pago:</span>
                  <strong>{selectedPagoModal.metodo_pago}</strong>
                </div>

                <div className="pagos-receipt-row pagos-receipt-row--total">
                  <span>Total Pagado:</span>
                  <strong style={{ color: '#059669' }}>
                    {formatCOP(selectedPagoModal.monto)}
                  </strong>
                </div>
              </div>
            </div>

            <div className="pagos-modal-footer">
              <button
                type="button"
                className="pagos-cli-btn-recibo"
                style={{ background: '#0d9488', color: '#ffffff', border: 'none' }}
                onClick={() => window.print()}
              >
                <i className="fa-solid fa-print"></i>
                <span>Imprimir Comprobante</span>
              </button>
              <button
                type="button"
                className="pagos-cli-btn-recibo"
                onClick={() => setSelectedPagoModal(null)}
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
