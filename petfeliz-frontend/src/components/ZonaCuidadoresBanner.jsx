import { useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { motion, AnimatePresence } from 'framer-motion'
import api from '../api/axios'
import './ZonaCuidadoresBanner.css'

export default function ZonaCuidadoresBanner() {
  const [showShareModal, setShowShareModal] = useState(false)
  const [showHowItWorksModal, setShowHowItWorksModal] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [generalError, setGeneralError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})

  const [formData, setFormData] = useState({
    nombre_cuidador: '',
    nombre_mascota: '',
    categoria: 'Medicina General',
    historia: ''
  })

  const handleFormChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    
    // Limpiar error del campo modificado
    if (fieldErrors[name]) {
      setFieldErrors(prev => ({ ...prev, [name]: '' }))
    }
    if (generalError) {
      setGeneralError('')
    }
  }

  const handleFormSubmit = async (e) => {
    e.preventDefault()
    setGeneralError('')
    setFieldErrors({})

    // Validación frontend: mínimo 50 caracteres para la historia
    const trimmedHistoria = formData.historia.trim()
    if (trimmedHistoria.length < 50) {
      setFieldErrors(prev => ({
        ...prev,
        historia: `La historia debe contener al menos 50 caracteres (tienes ${trimmedHistoria.length}).`
      }))
      return
    }

    setLoading(true)

    try {
      const response = await api.post('/historias-cuidadores', {
        nombre_cuidador: formData.nombre_cuidador.trim(),
        nombre_mascota: formData.nombre_mascota.trim(),
        categoria: formData.categoria,
        historia: trimmedHistoria,
      })

      if (response.status === 201 || response.data?.status === 'success') {
        setSubmitted(true)
        // Limpiar el formulario ÚNICAMENTE después de un envío exitoso confirmado por el backend
        setFormData({
          nombre_cuidador: '',
          nombre_mascota: '',
          categoria: 'Medicina General',
          historia: ''
        })
      }
    } catch (err) {
      if (err.response?.status === 422 && err.response?.data?.errors) {
        // Error de validación proveniente del backend (422)
        const backendErrors = err.response.data.errors
        const formattedErrors = {}
        Object.keys(backendErrors).forEach(key => {
          formattedErrors[key] = Array.isArray(backendErrors[key]) ? backendErrors[key][0] : backendErrors[key]
        })
        setFieldErrors(formattedErrors)
      } else {
        // Error de servidor / red (500, timeout, etc.)
        setGeneralError(
          err.response?.data?.message || 'Hubo un problema al enviar tu historia, por favor intenta de nuevo.'
        )
      }
    } finally {
      setLoading(false)
    }
  }

  const handleCloseShareModal = () => {
    // Evitar cerrar el modal accidentalmente mientras la petición está en curso
    if (loading) return

    setShowShareModal(false)
    setSubmitted(false)
    setGeneralError('')
    setFieldErrors({})
  }

  const historiaCharCount = formData.historia.length

  return (
    <section className="cta-banner zona-cuidadores-cta">
      <div className="container">
        <div className="cta-banner__box zcc-celeste-box">
          <h2>¿Tienes una historia que contar?</h2>
          <p>
            Si eres afiliado de PetFeliz y tu mascota vivió algo que vale la pena compartir, queremos escucharte. Las mejores historias se publican aquí y en nuestras redes.
          </p>
          <div className="cta-banner__actions zcc-actions-centered">
            <button 
              type="button" 
              className="btn btn-primary zcc-btn-main"
              onClick={() => setShowShareModal(true)}
              aria-label="Compartir mi historia"
            >
              <FontAwesomeIcon icon="fa-solid fa-pen-to-square" />
              <span>Compartir mi historia</span>
            </button>
            <button 
              type="button" 
              className="btn btn-outline-white zcc-btn-sec"
              onClick={() => setShowHowItWorksModal(true)}
              aria-label="¿Cómo funciona?"
            >
              <FontAwesomeIcon icon="fa-solid fa-circle-question" />
              <span>¿Cómo funciona?</span>
            </button>
          </div>
        </div>
      </div>

      {/* MODAL 1: COMPARTIR MI HISTORIA */}
      <AnimatePresence>
        {showShareModal && (
          <motion.div 
            className="zcc-modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={loading ? undefined : handleCloseShareModal}
          >
            <motion.div 
              className="zcc-modal-box"
              initial={{ opacity: 0, y: 24, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.97 }}
              transition={{ duration: 0.25 }}
              onClick={e => e.stopPropagation()}
              role="dialog"
              aria-labelledby="share-modal-title"
              aria-modal="true"
            >
              <button 
                className="zcc-modal-close" 
                onClick={handleCloseShareModal}
                disabled={loading}
                aria-label="Cerrar modal"
              >
                <FontAwesomeIcon icon="fa-solid fa-xmark" />
              </button>

              {!submitted ? (
                <>
                  <div className="zcc-modal-header">
                    <div className="zcc-modal-badge">
                      <FontAwesomeIcon icon="fa-solid fa-paw" /> EPS PetFeliz
                    </div>
                    <h3 id="share-modal-title">Comparte tu historia</h3>
                    <p>Cuéntanos la experiencia vivida con tu mascota. Las mejores vivencias serán publicadas en nuestro portal y redes.</p>
                  </div>

                  {generalError && (
                    <div className="zcc-error-banner" role="alert">
                      <FontAwesomeIcon icon="fa-solid fa-triangle-exclamation" />
                      <span>{generalError}</span>
                    </div>
                  )}

                  <form className="zcc-form" onSubmit={handleFormSubmit} noValidate>
                    <div className="zcc-form-group">
                      <label htmlFor="nombre_cuidador">Tu nombre completo</label>
                      <input 
                        type="text" 
                        id="nombre_cuidador" 
                        name="nombre_cuidador" 
                        disabled={loading}
                        required 
                        placeholder="Ej. María Restrepo"
                        value={formData.nombre_cuidador}
                        onChange={handleFormChange}
                        className={fieldErrors.nombre_cuidador ? 'zcc-input-error' : ''}
                      />
                      {fieldErrors.nombre_cuidador && (
                        <span className="zcc-field-error">
                          <FontAwesomeIcon icon="fa-solid fa-circle-exclamation" /> {fieldErrors.nombre_cuidador}
                        </span>
                      )}
                    </div>

                    <div className="zcc-form-group">
                      <label htmlFor="nombre_mascota">Nombre y especie de tu mascota</label>
                      <input 
                        type="text" 
                        id="nombre_mascota" 
                        name="nombre_mascota" 
                        disabled={loading}
                        required 
                        placeholder="Ej. Tobby (Perro Labrador)"
                        value={formData.nombre_mascota}
                        onChange={handleFormChange}
                        className={fieldErrors.nombre_mascota ? 'zcc-input-error' : ''}
                      />
                      {fieldErrors.nombre_mascota && (
                        <span className="zcc-field-error">
                          <FontAwesomeIcon icon="fa-solid fa-circle-exclamation" /> {fieldErrors.nombre_mascota}
                        </span>
                      )}
                    </div>

                    <div className="zcc-form-group">
                      <label htmlFor="categoria">Categoría del servicio recibido</label>
                      <select 
                        id="categoria" 
                        name="categoria"
                        disabled={loading}
                        value={formData.categoria}
                        onChange={handleFormChange}
                        className={fieldErrors.categoria ? 'zcc-input-error' : ''}
                      >
                        <option value="Medicina General">Medicina General</option>
                        <option value="Urgencias 24/7">Urgencias 24/7</option>
                        <option value="Dermatología">Dermatología</option>
                        <option value="Cirugía">Cirugía</option>
                        <option value="Vacunación">Vacunación</option>
                      </select>
                      {fieldErrors.categoria && (
                        <span className="zcc-field-error">
                          <FontAwesomeIcon icon="fa-solid fa-circle-exclamation" /> {fieldErrors.categoria}
                        </span>
                      )}
                    </div>

                    <div className="zcc-form-group">
                      <div className="zcc-label-wrapper">
                        <label htmlFor="historia">Tu historia o testimonio</label>
                        <span className={`zcc-char-badge ${historiaCharCount >= 50 ? 'zcc-char-badge--valid' : ''}`}>
                          {historiaCharCount} / 50 min
                        </span>
                      </div>
                      <textarea 
                        id="historia" 
                        name="historia" 
                        rows="4" 
                        disabled={loading}
                        required 
                        placeholder="Cuéntanos qué sucedió y cómo te ayudó el equipo de EPS PetFeliz (mínimo 50 caracteres)..."
                        value={formData.historia}
                        onChange={handleFormChange}
                        className={fieldErrors.historia ? 'zcc-input-error' : ''}
                      ></textarea>
                      {fieldErrors.historia ? (
                        <span className="zcc-field-error">
                          <FontAwesomeIcon icon="fa-solid fa-circle-exclamation" /> {fieldErrors.historia}
                        </span>
                      ) : (
                        <small className="zcc-field-hint">
                          Mínimo 50 caracteres para ser descriptivo.
                        </small>
                      )}
                    </div>

                    <div className="zcc-form-actions">
                      <button 
                        type="submit" 
                        className="btn btn-primary full-width"
                        disabled={loading}
                      >
                        {loading ? (
                          <>
                            <FontAwesomeIcon icon="fa-solid fa-spinner" spin />
                            <span>Enviando...</span>
                          </>
                        ) : (
                          <>
                            <FontAwesomeIcon icon="fa-solid fa-paper-plane" />
                            <span>Enviar mi historia</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </>
              ) : (
                <div className="zcc-success-box">
                  <div className="zcc-success-icon">
                    <FontAwesomeIcon icon="fa-solid fa-circle-check" />
                  </div>
                  <h3>¡Gracias por compartir tu historia!</h3>
                  <p>
                    Hemos recibido tu testimonio exitosamente. Tu historia ha sido enviada y se encuentra <strong>pendiente de revisión</strong> por nuestro equipo editorial antes de ser publicada en EPS PetFeliz.
                  </p>
                  <button 
                    type="button" 
                    className="btn btn-primary" 
                    onClick={handleCloseShareModal}
                  >
                    Entendido
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL 2: ¿CÓMO FUNCIONA? */}
      <AnimatePresence>
        {showHowItWorksModal && (
          <motion.div 
            className="zcc-modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowHowItWorksModal(false)}
          >
            <motion.div 
              className="zcc-modal-box zcc-modal-box--wide"
              initial={{ opacity: 0, y: 24, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.97 }}
              transition={{ duration: 0.25 }}
              onClick={e => e.stopPropagation()}
              role="dialog"
              aria-labelledby="how-modal-title"
              aria-modal="true"
            >
              <button 
                className="zcc-modal-close" 
                onClick={() => setShowHowItWorksModal(false)}
                aria-label="Cerrar modal"
              >
                <FontAwesomeIcon icon="fa-solid fa-xmark" />
              </button>

              <div className="zcc-modal-header text-center">
                <h3 id="how-modal-title">¿Cómo funciona la Zona de Cuidadores?</h3>
                <p>Tu experiencia es valiosa. Así es como la compartimos con el mundo:</p>
              </div>

              <div className="zcc-timeline-container">
                <div className="zcc-timeline-line" aria-hidden="true"></div>
                
                <div className="zcc-timeline-grid">
                  {/* PASO 1 */}
                  <div className="zcc-timeline-step">
                    <div className="zcc-node zcc-node--1">
                      <FontAwesomeIcon icon="fa-solid fa-pen-to-square" />
                      <span className="zcc-node-tag">01</span>
                    </div>
                    <div className="zcc-step-card">
                      <h4>1. Escribe tu experiencia</h4>
                      <p>Registra tu historia, comparte anécdotas y los detalles de la atención brindada a tu mascota.</p>
                    </div>
                  </div>

                  {/* PASO 2 */}
                  <div className="zcc-timeline-step zcc-timeline-step--featured">
                    <div className="zcc-node zcc-node--2 zcc-node--hero">
                      <FontAwesomeIcon icon="fa-solid fa-clipboard-check" />
                      <span className="zcc-node-tag">02</span>
                    </div>
                    <div className="zcc-step-card zcc-step-card--featured">
                      <h4>2. Revisión editorial</h4>
                      <p>Nuestro equipo valida los datos de tu afiliación y edita tu contenido para darle el mayor impacto.</p>
                    </div>
                  </div>

                  {/* PASO 3 */}
                  <div className="zcc-timeline-step">
                    <div className="zcc-node zcc-node--3">
                      <FontAwesomeIcon icon="fa-solid fa-bullhorn" />
                      <span className="zcc-node-tag">03</span>
                    </div>
                    <div className="zcc-step-card">
                      <h4>3. Publicación e impacto</h4>
                      <p>Tu relato se destaca en nuestro portal web y en las redes sociales oficiales para orientar e inspirar.</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="zcc-how-actions zcc-how-actions--full">
                <button 
                  type="button" 
                  className="btn btn-primary full-width zcc-btn-cta-full"
                  onClick={() => {
                    setShowHowItWorksModal(false)
                    setShowShareModal(true)
                  }}
                >
                  <FontAwesomeIcon icon="fa-solid fa-paper-plane" />
                  <span>¡Quiero enviar mi historia!</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}
