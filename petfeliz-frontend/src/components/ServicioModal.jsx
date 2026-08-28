import { useEffect } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { motion, AnimatePresence } from 'framer-motion'
import './ServicioModal.css'

export default function ServicioModal({ servicio, onClose }) {
  // Manejo de la tecla Escape para cerrar el modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    if (servicio) {
      window.addEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'hidden' // Prevenir scroll del fondo
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'unset'
    }
  }, [servicio, onClose])

  if (!servicio) return null

  return (
    <AnimatePresence>
      <motion.div
        className="svc-modal-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="svc-modal-card"
          initial={{ opacity: 0, scale: 0.94, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 20 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-label={servicio.title}
        >
          {/* BOTÓN CERRAR X */}
          <button className="svc-modal__close-btn" onClick={onClose} aria-label="Cerrar modal">
            <FontAwesomeIcon icon="fa-solid fa-xmark" />
          </button>

          {/* ICONO DEL SERVICIO */}
          <div className={`svc-modal__icon-wrap icon-${servicio.iconVariant || 'green'}`}>
            <FontAwesomeIcon icon={servicio.icon} />
          </div>

          {/* TITULO Y SUBTITULO */}
          <div className="svc-modal__header">
            <span className="svc-modal__badge">Servicios Integrales EPS PetFeliz</span>
            <h2>{servicio.title}</h2>
          </div>

          {/* DESCRIPCIÓN EXTENDIDA */}
          <div className="svc-modal__body">
            <p className="svc-modal__desc-short">{servicio.description}</p>
            <div className="svc-modal__desc-extended">
              <p>{servicio.detalle}</p>
            </div>
          </div>

          {/* FOOTER Y ACCIONES */}
          <div className="svc-modal__footer">
            <button className="btn btn-primary svc-modal__btn-action" onClick={onClose}>
              Entendido
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
