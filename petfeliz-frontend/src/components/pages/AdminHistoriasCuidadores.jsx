import { useState, useEffect } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { motion, AnimatePresence } from 'framer-motion'
import api from '../../api/axios'
import './AdminHistoriasCuidadores.css'

export default function AdminHistoriasCuidadores() {
  const [historias, setHistorias] = useState([])
  const [filtroEstado, setFiltroEstado] = useState('todas')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [updatingId, setUpdatingId] = useState(null)
  const [historiaModal, setHistoriaModal] = useState(null)
  const [toast, setToast] = useState(null)

  const fetchHistorias = async () => {
    setLoading(true)
    setError('')
    try {
      const response = await api.get('/admin/historias-cuidadores')
      if (response.data?.status === 'success') {
        setHistorias(response.data.data)
      }
    } catch (err) {
      console.error('Error cargando historias:', err)
      setError('No se pudieron cargar las historias. Verifica la conexión con el servidor.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchHistorias()
  }, [])

  const triggerToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 4000)
  }

  const handleCambiarEstado = async (id, nuevoEstado) => {
    setUpdatingId(id)
    try {
      const response = await api.patch(`/admin/historias-cuidadores/${id}`, {
        estado: nuevoEstado
      })

      if (response.data?.status === 'success') {
        // Actualización optimista instantánea en el estado de React
        setHistorias(prev =>
          prev.map(h => (h.id === id ? { ...h, estado: nuevoEstado } : h))
        )

        if (historiaModal && historiaModal.id === id) {
          setHistoriaModal(prev => ({ ...prev, estado: nuevoEstado }))
        }

        const actionText = nuevoEstado === 'aprobado' ? 'aprobada' : 'rechazada'
        triggerToast(`La historia #${id} fue ${actionText} exitosamente.`, 'success')
      }
    } catch (err) {
      console.error('Error al actualizar estado:', err)
      triggerToast('Ocurrió un error al actualizar el estado de la historia.', 'error')
    } finally {
      setUpdatingId(null)
    }
  }

  // Filtrado de historias según la pestaña seleccionada
  const historiasFiltradas = historias.filter(h => {
    if (filtroEstado === 'todas') return true
    return h.estado === filtroEstado
  })

  // Conteo de estadísticas
  const countTotal = historias.length
  const countPendientes = historias.filter(h => h.estado === 'pendiente').length
  const countAprobadas = historias.filter(h => h.estado === 'aprobado').length
  const countRechazadas = historias.filter(h => h.estado === 'rechazado').length

  const formatDate = (dateString) => {
    if (!dateString) return 'Sin fecha'
    try {
      return new Date(dateString).toLocaleDateString('es-CO', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch {
      return dateString
    }
  }

  return (
    <div className="zadmin-container">
      {/* TOAST FEEDBACK NOTIFICATION */}
      <AnimatePresence>
        {toast && (
          <motion.div
            className={`zadmin-toast zadmin-toast--${toast.type}`}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <FontAwesomeIcon
              icon={toast.type === 'success' ? 'fa-solid fa-circle-check' : 'fa-solid fa-triangle-exclamation'}
            />
            <span>{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* HEADER */}
      <header className="zadmin-header">
        <div className="zadmin-header__badge">
          <FontAwesomeIcon icon="fa-solid fa-shield-cat" /> Panel Editorial EPS PetFeliz
        </div>
        <h1>Gestión de Historias de Cuidadores</h1>
        <p>Revisa, aprueba o rechaza los testimonios enviados por la comunidad antes de su publicación oficial.</p>
      </header>

      {/* TARJETAS DE ESTADÍSTICAS */}
      <div className="zadmin-stats-grid">
        <button
          className={`zadmin-stat-card ${filtroEstado === 'todas' ? 'active' : ''}`}
          onClick={() => setFiltroEstado('todas')}
        >
          <div className="zadmin-stat-card__icon zadmin-stat-card__icon--blue">
            <FontAwesomeIcon icon="fa-solid fa-folder-open" />
          </div>
          <div className="zadmin-stat-card__info">
            <span className="zadmin-stat-card__num">{countTotal}</span>
            <span className="zadmin-stat-card__label">Todas</span>
          </div>
        </button>

        <button
          className={`zadmin-stat-card ${filtroEstado === 'pendiente' ? 'active' : ''}`}
          onClick={() => setFiltroEstado('pendiente')}
        >
          <div className="zadmin-stat-card__icon zadmin-stat-card__icon--yellow">
            <FontAwesomeIcon icon="fa-solid fa-clock" />
          </div>
          <div className="zadmin-stat-card__info">
            <span className="zadmin-stat-card__num">{countPendientes}</span>
            <span className="zadmin-stat-card__label">Pendientes</span>
          </div>
        </button>

        <button
          className={`zadmin-stat-card ${filtroEstado === 'aprobado' ? 'active' : ''}`}
          onClick={() => setFiltroEstado('aprobado')}
        >
          <div className="zadmin-stat-card__icon zadmin-stat-card__icon--green">
            <FontAwesomeIcon icon="fa-solid fa-circle-check" />
          </div>
          <div className="zadmin-stat-card__info">
            <span className="zadmin-stat-card__num">{countAprobadas}</span>
            <span className="zadmin-stat-card__label">Aprobadas</span>
          </div>
        </button>

        <button
          className={`zadmin-stat-card ${filtroEstado === 'rechazado' ? 'active' : ''}`}
          onClick={() => setFiltroEstado('rechazado')}
        >
          <div className="zadmin-stat-card__icon zadmin-stat-card__icon--red">
            <FontAwesomeIcon icon="fa-solid fa-circle-xmark" />
          </div>
          <div className="zadmin-stat-card__info">
            <span className="zadmin-stat-card__num">{countRechazadas}</span>
            <span className="zadmin-stat-card__label">Rechazadas</span>
          </div>
        </button>
      </div>

      {/* CONTENIDO PRINCIPAL / TABLA */}
      <div className="zadmin-table-box">
        <div className="zadmin-table-toolbar">
          <h2>
            Listado de Historias
            <span className="zadmin-count-pill">{historiasFiltradas.length}</span>
          </h2>

          <div className="zadmin-filter-bar">
            <button
              onClick={fetchHistorias}
              className="btn btn-outline-secondary zadmin-btn-refresh"
              title="Recargar lista"
            >
              <FontAwesomeIcon icon="fa-solid fa-rotate" spin={loading} />
              <span>Actualizar</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="zadmin-error-box">
            <FontAwesomeIcon icon="fa-solid fa-triangle-exclamation" />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div className="zadmin-loading-state">
            <FontAwesomeIcon icon="fa-solid fa-spinner" spin size="2x" />
            <p>Cargando historias de la base de datos...</p>
          </div>
        ) : historiasFiltradas.length === 0 ? (
          <div className="zadmin-empty-state">
            <FontAwesomeIcon icon="fa-solid fa-box-open" size="3x" />
            <h3>No hay historias para mostrar</h3>
            <p>No se encontraron historias en la categoría o filtro seleccionado ("{filtroEstado}").</p>
          </div>
        ) : (
          <div className="zadmin-table-responsive">
            <table className="zadmin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Cuidador</th>
                  <th>Mascota</th>
                  <th>Categoría</th>
                  <th>Extracto</th>
                  <th>Fecha envío</th>
                  <th>Estado</th>
                  <th className="text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {historiasFiltradas.map(h => {
                  const isUpdating = updatingId === h.id
                  const extracto = h.historia ? h.historia.substring(0, 90) + (h.historia.length > 90 ? '...' : '') : ''

                  return (
                    <tr key={h.id} className={`zadmin-row--${h.estado}`}>
                      <td className="zadmin-td-id">#{h.id}</td>
                      <td>
                        <strong>{h.nombre_cuidador}</strong>
                      </td>
                      <td>
                        <span className="zadmin-chip-pet">
                          <FontAwesomeIcon icon="fa-solid fa-paw" />
                          {h.nombre_mascota}
                        </span>
                      </td>
                      <td>
                        <span className="zadmin-tag-category">{h.categoria}</span>
                      </td>
                      <td className="zadmin-td-extracto" title={h.historia}>
                        "{extracto}"
                      </td>
                      <td className="zadmin-td-date">{formatDate(h.created_at)}</td>
                      <td>
                        <span className={`zadmin-badge zadmin-badge--${h.estado}`}>
                          {h.estado === 'pendiente' && <FontAwesomeIcon icon="fa-solid fa-clock" />}
                          {h.estado === 'aprobado' && <FontAwesomeIcon icon="fa-solid fa-check" />}
                          {h.estado === 'rechazado' && <FontAwesomeIcon icon="fa-solid fa-xmark" />}
                          <span className="capitalize">{h.estado}</span>
                        </span>
                      </td>
                      <td className="text-right zadmin-td-actions">
                        <button
                          type="button"
                          className="btn-action btn-action--view"
                          onClick={() => setHistoriaModal(h)}
                          title="Ver detalle completo"
                        >
                          <FontAwesomeIcon icon="fa-solid fa-eye" />
                          <span>Ver</span>
                        </button>

                        {h.estado !== 'aprobado' && (
                          <button
                            type="button"
                            className="btn-action btn-action--approve"
                            disabled={isUpdating}
                            onClick={() => handleCambiarEstado(h.id, 'aprobado')}
                            title="Aprobar e historia se publica en el portal"
                          >
                            {isUpdating ? (
                              <FontAwesomeIcon icon="fa-solid fa-spinner" spin />
                            ) : (
                              <>
                                <FontAwesomeIcon icon="fa-solid fa-check" />
                                <span>Aprobar</span>
                              </>
                            )}
                          </button>
                        )}

                        {h.estado !== 'rechazado' && (
                          <button
                            type="button"
                            className="btn-action btn-action--reject"
                            disabled={isUpdating}
                            onClick={() => handleCambiarEstado(h.id, 'rechazado')}
                            title="Rechazar historia"
                          >
                            {isUpdating ? (
                              <FontAwesomeIcon icon="fa-solid fa-spinner" spin />
                            ) : (
                              <>
                                <FontAwesomeIcon icon="fa-solid fa-xmark" />
                                <span>Rechazar</span>
                              </>
                            )}
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL DETALLE COMPLETO */}
      <AnimatePresence>
        {historiaModal && (
          <motion.div
            className="zadmin-modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setHistoriaModal(null)}
          >
            <motion.div
              className="zadmin-modal-box"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={e => e.stopPropagation()}
            >
              <button
                className="zadmin-modal-close"
                onClick={() => setHistoriaModal(null)}
                aria-label="Cerrar modal"
              >
                <FontAwesomeIcon icon="fa-solid fa-xmark" />
              </button>

              <div className="zadmin-modal-header">
                <div className="zadmin-modal-id-badge">
                  Historia #{historiaModal.id}
                </div>
                <h3>Detalle de la Historia</h3>
                <span className={`zadmin-badge zadmin-badge--${historiaModal.estado}`}>
                  {historiaModal.estado}
                </span>
              </div>

              <div className="zadmin-modal-meta-grid">
                <div className="zadmin-meta-item">
                  <label>Cuidador:</label>
                  <span>{historiaModal.nombre_cuidador}</span>
                </div>
                <div className="zadmin-meta-item">
                  <label>Mascota:</label>
                  <span>{historiaModal.nombre_mascota}</span>
                </div>
                <div className="zadmin-meta-item">
                  <label>Categoría:</label>
                  <span>{historiaModal.categoria}</span>
                </div>
                <div className="zadmin-meta-item">
                  <label>Fecha de envío:</label>
                  <span>{formatDate(historiaModal.created_at)}</span>
                </div>
              </div>

              <div className="zadmin-modal-story-body">
                <label>Testimonio completo enviado:</label>
                <div className="zadmin-story-text">
                  {historiaModal.historia.split('\n\n').map((p, idx) => (
                    <p key={idx}>{p}</p>
                  ))}
                </div>
              </div>

              <div className="zadmin-modal-actions">
                {historiaModal.estado !== 'aprobado' && (
                  <button
                    type="button"
                    className="btn btn-success zadmin-btn-modal-action"
                    disabled={updatingId === historiaModal.id}
                    onClick={() => handleCambiarEstado(historiaModal.id, 'aprobado')}
                  >
                    <FontAwesomeIcon icon="fa-solid fa-check" />
                    <span>Aprobar e Historia Publicar</span>
                  </button>
                )}

                {historiaModal.estado !== 'rechazado' && (
                  <button
                    type="button"
                    className="btn btn-danger zadmin-btn-modal-action"
                    disabled={updatingId === historiaModal.id}
                    onClick={() => handleCambiarEstado(historiaModal.id, 'rechazado')}
                  >
                    <FontAwesomeIcon icon="fa-solid fa-xmark" />
                    <span>Rechazar Historia</span>
                  </button>
                )}

                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setHistoriaModal(null)}
                >
                  Cerrar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
