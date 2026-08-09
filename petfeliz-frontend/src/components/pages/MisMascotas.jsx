import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import CustomDatePicker from '../ui/CustomDatePicker'
import DashboardHeader from '../ui/DashboardHeader'
import SidebarClient from '../ui/SidebarClient'
import { RAZAS_POR_ESPECIE } from '../../data/razasPorEspecie'
import './DashboardClient.css'
import './MisMascotas.css'





const menuItems = [
  { to: '/dashboard-client', label: 'Panel', icon: 'grid' },
  { to: '/mis-mascotas', label: 'Mis Mascotas', icon: 'paw' },
  { to: '/citas', label: 'Citas', icon: 'calendar' },
  { to: '/dashboard-client/servicios', label: 'Servicios', icon: 'stethoscope' },
  { to: '/dashboard-client/pagos', label: 'Pagos y Facturación', icon: 'invoice' },
  { to: '/dashboard-client/documentos', label: 'Documentos', icon: 'file' },
]

/* ── Íconos Font Awesome Free (Estilo Regular y Ligeros) ── */
const Icon = ({ name, style, className = '', ...props }) => {
  const map = {
    grid: 'fa-solid fa-border-all',
    paw: 'fa-solid fa-paw',
    calendar: 'fa-regular fa-calendar-days',
    stethoscope: 'fa-solid fa-stethoscope',
    invoice: 'fa-regular fa-file-lines',
    file: 'fa-regular fa-file-lines',
    help: 'fa-regular fa-circle-question',
    logout: 'fa-solid fa-right-from-bracket',
    bell: 'fa-regular fa-bell',
    plus: 'fa-solid fa-plus',
    pencil: 'fa-regular fa-pen-to-square',
    trash: 'fa-regular fa-trash-can',
    close: 'fa-solid fa-xmark',
    camera: 'fa-solid fa-camera',
  }
  const faClass = map[name] || 'fa-regular fa-circle-question'
  return (
    <i
      className={`${faClass} ${className}`}
      style={{
        fontSize: '0.95rem',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        ...style,

      }}
      {...props}
    />
  )
}



const emptyForm = {
  nombre: '',
  especie: 'Canino',
  raza: RAZAS_POR_ESPECIE['Canino'] ? RAZAS_POR_ESPECIE['Canino'][0] : '',
  sexo: 'Macho',
  fecha_nacimiento: '',
  peso: '',
}


function MisMascotas() {
  const location = useLocation()
  const navigate = useNavigate()

  const [usuario, setUsuario] = useState({ nombre: '', foto: '' })
  const [mascotas, setMascotas] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Estados para modal Formulario (Crear/Editar)
  const [showFormModal, setShowFormModal] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [formData, setFormData] = useState(emptyForm)
  const [selectedFile, setSelectedFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [isDragging, setIsDragging] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')

  // Estados para modal Confirmación Eliminar
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deletingPet, setDeletingPet] = useState(null)
  const [deleting, setDeleting] = useState(false)

  // Cargar perfil del usuario y lista de mascotas
  const loadData = async () => {
    const token = localStorage.getItem('token')
    if (!token) {
      navigate('/login')
      return
    }

    try {
      // Perfil
      const resUser = await fetch(`${import.meta.env.VITE_API_URL}/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      })
      if (resUser.ok) {
        const uData = await resUser.json()
        setUsuario(uData)

      }

      // Mascotas
      const resPets = await fetch(`${import.meta.env.VITE_API_URL}/mascotas`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      })

      if (resPets.status === 401) {
        localStorage.removeItem('token')
        navigate('/login')
        return
      }

      const pData = await resPets.json()
      if (resPets.ok) {
        setMascotas(pData)
      } else {
        setError(pData.message || 'Error al obtener tus mascotas.')
      }
    } catch (e) {
      console.error(e)
      setError('No se pudo conectar con el servidor.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleLogout = async () => {
    const token = localStorage.getItem('token')
    if (token) {
      try {
        await fetch(`${import.meta.env.VITE_API_URL}/logout`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
        })
      } catch (e) { console.error(e) }
    }
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/login')
  }

  // Validación y asignación de archivo de imagen
  const validateAndSetFile = (file) => {
    if (!file) return

    // Validar tipo de archivo (JPG, JPEG, PNG, WEBP)
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      setFormError('Solo se permiten imágenes en formato JPG, JPEG, PNG o WEBP.')
      return
    }

    // Validar tamaño máximo (5 MB)
    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      setFormError('La imagen seleccionada supera el tamaño máximo de 5 MB.')
      return
    }

    setFormError('')
    setSelectedFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  // Manejo de selección mediante selector de archivos
  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) validateAndSetFile(file)
  }

  // Manejo de arrastrar y soltar (Drag & Drop)
  const handleDragOver = (e) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0])
    }
  }

  // Quitar la imagen seleccionada
  const handleRemoveImage = () => {
    setSelectedFile(null)
    setImagePreview(null)
  }

  // Manejo de cambio de Especie con actualización dinámica de raza
  const handleEspecieChange = (nuevaEspecie) => {
    const razasDisponibles = RAZAS_POR_ESPECIE[nuevaEspecie] || []
    const razaDefecto = razasDisponibles.length > 0 ? razasDisponibles[0] : ''
    setFormData((prev) => ({
      ...prev,
      especie: nuevaEspecie,
      raza: razaDefecto,
    }))
  }

  // Abrir modal de creación
  const handleOpenCreate = () => {
    setEditingId(null)
    setFormData(emptyForm)
    setSelectedFile(null)
    setImagePreview(null)
    setFormError('')
    setShowFormModal(true)
  }

  // Abrir modal de edición
  const handleOpenEdit = (pet) => {
    setEditingId(pet.id)
    setFormData({
      nombre: pet.nombre || '',
      especie: pet.especie || 'Canino',
      raza: pet.raza || '',
      sexo: pet.sexo || 'Macho',
      fecha_nacimiento: pet.fecha_nacimiento || '',
      peso: pet.peso !== null && pet.peso !== undefined ? pet.peso : '',
    })
    setSelectedFile(null)
    setImagePreview(pet.foto || null)
    setFormError('')
    setShowFormModal(true)
  }

  // Enviar formulario (Crear o Editar con FormData)
  const handleSubmitForm = async (e) => {
    e.preventDefault()
    setFormError('')
    setSaving(true)

    const token = localStorage.getItem('token')
    const url = editingId
      ? `${import.meta.env.VITE_API_URL}/mascotas/${editingId}`
      : `${import.meta.env.VITE_API_URL}/mascotas`

    // Construcción de FormData para enviar archivo binario y texto
    const bodyFormData = new FormData()
    bodyFormData.append('nombre', formData.nombre)
    bodyFormData.append('especie', formData.especie)
    bodyFormData.append('raza', formData.raza || '')
    bodyFormData.append('sexo', formData.sexo)
    if (formData.fecha_nacimiento) bodyFormData.append('fecha_nacimiento', formData.fecha_nacimiento)
    if (formData.peso) bodyFormData.append('peso', formData.peso)

    if (selectedFile) {
      bodyFormData.append('foto', selectedFile)
    }

    // Para peticiones PUT en FormData con Laravel
    if (editingId) {
      bodyFormData.append('_method', 'PUT')
    }

    try {
      const res = await fetch(url, {
        method: 'POST', // Usamos POST con _method=PUT para soporte nativo de multipart/form-data en Laravel
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        },
        body: bodyFormData
      })

      const data = await res.json()

      if (!res.ok) {
        setFormError(data.message || 'Error al guardar la mascota.')
        setSaving(false)
        return
      }

      setShowFormModal(false)
      loadData()
    } catch (err) {
      console.error(err)
      setFormError('No se pudo conectar con el servidor.')
    } finally {
      setSaving(false)
    }
  }

  // Abrir modal confirmación eliminar
  const handleOpenDelete = (pet) => {
    setDeletingPet(pet)
    setShowDeleteModal(true)
  }

  // Confirmar eliminación
  const handleConfirmDelete = async () => {
    if (!deletingPet) return
    setDeleting(true)

    const token = localStorage.getItem('token')

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/mascotas/${deletingPet.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      })

      if (res.ok) {
        setShowDeleteModal(false)
        setDeletingPet(null)
        loadData()
      } else {
        const data = await res.json()
        alert(data.message || 'No se pudo eliminar la mascota.')
      }
    } catch (err) {
      console.error(err)
      alert('Error al conectar con el servidor.')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="dash">
      <SidebarClient />


      {/* ── MAIN ── */}
      <main className="dash-main">
        <DashboardHeader
          title="Mis Mascotas"
          subtitle="Gestiona la información y salud de tus mejores amigos"
          usuario={usuario}
          onUserUpdated={(updatedUser) => setUsuario(updatedUser)}
        />


        {loading ? (
          <div style={{ padding: '3rem 1rem', textAlign: 'center', color: '#64748b' }}>
            <p>Cargando tus mascotas...</p>
          </div>
        ) : error ? (
          <div style={{ padding: '2rem 1rem', color: '#ef4444', textAlign: 'center' }}>
            <p>{error}</p>
          </div>
        ) : (
          <section className="pets-section">
            {mascotas.length === 0 ? (
              <div className="pets-empty">
                <div className="pets-empty__icon">
                  <Icon name="paw" style={{ fontSize: '2.1rem' }} />
                </div>

                <h3>No tienes mascotas registradas</h3>
                <p>Agrega a tu primer compañero para comenzar a gestionar su historial y citas médicas.</p>
                <button className="btn-add-pet btn-add-pet--lg" onClick={handleOpenCreate}>
                  <Icon name="plus" /> Registrar Mascota
                </button>
              </div>
            ) : (
              <div className="pets-grid">
                {mascotas.map((pet) => (
                  <div key={pet.id} className="pet-card-full">
                    <div className="pet-card-full__top">
                      <div className="pet-card-full__photo-wrap">
                        <img src={pet.foto} alt={pet.nombre} />
                        <span className="pet-card-full__status">✓</span>
                      </div>

                      <div className="pet-card-full__actions">
                        <button
                          className="btn-icon-pet btn-icon-pet--edit"
                          title="Editar información"
                          onClick={() => handleOpenEdit(pet)}
                        >
                          <Icon name="pencil" width="15" height="15" />
                        </button>
                        <button
                          className="btn-icon-pet btn-icon-pet--delete"
                          title="Eliminar mascota"
                          onClick={() => handleOpenDelete(pet)}
                        >
                          <Icon name="trash" width="15" height="15" />
                        </button>
                      </div>
                    </div>

                    <div className="pet-card-full__body">
                      <h3 className="pet-card-full__name">{pet.nombre}</h3>
                      <p className="pet-card-full__breed">{pet.especie} • {pet.raza}</p>

                      <div className="pet-card-full__details">
                        <div className="pet-detail-tag">
                          <span className="pet-detail-tag__label">Sexo</span>
                          <span className="pet-detail-tag__val">{pet.sexo}</span>
                        </div>
                        <div className="pet-detail-tag">
                          <span className="pet-detail-tag__label">Edad</span>
                          <span className="pet-detail-tag__val">{pet.edad}</span>
                        </div>
                        <div className="pet-detail-tag">
                          <span className="pet-detail-tag__label">Peso</span>
                          <span className="pet-detail-tag__val">{pet.peso ? `${pet.peso} kg` : 'N/A'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Tarjeta interactiva para agregar nueva mascota */}
                <div className="pet-card-add-new" onClick={handleOpenCreate}>
                  <div className="pet-card-add-new__icon-wrap">
                    <i className="fa-solid fa-plus"></i>
                  </div>
                  <strong className="pet-card-add-new__title">Agregar nueva mascota</strong>
                  <p className="pet-card-add-new__sub">
                    Registra otra mascota para llevar el control de su salud.
                  </p>
                </div>
              </div>
            )}
          </section>
        )}


        <footer className="dash-footer">
          © 2026 PetFeliz tus datos médicos están protegidos y encriptados.
        </footer>
      </main>

      {/* ── MODAL DE CREACIÓN / EDICIÓN ── */}
      {showFormModal && (
        <div className="modal-backdrop">
          <div className="modal-box">
            <div className="modal-box__header">
              <h3>{editingId ? 'Editar Mascota' : 'Registrar Nueva Mascota'}</h3>
              <button className="modal-box__close" onClick={() => setShowFormModal(false)}>
                <Icon name="close" />
              </button>
            </div>

            {formError && <div className="modal-box__error">{formError}</div>}

            <form onSubmit={handleSubmitForm} className="pet-form">
              {/* ── Carga y vista previa de foto desde dispositivo ── */}
              <div className="pet-form__field pet-form__field--full">
                <label>Foto de la Mascota</label>
                <div className="pet-upload-box">
                  {imagePreview ? (
                    <div className="pet-upload-preview-container">
                      <div className="pet-upload-preview">
                        <img src={imagePreview} alt="Vista previa de la foto" />
                        <button
                          type="button"
                          className="btn-remove-photo"
                          onClick={handleRemoveImage}
                          title="Quitar foto"
                        >
                          <Icon name="close" width="14" height="14" />
                        </button>
                      </div>
                      <label className="btn-change-photo">
                        <input
                          type="file"
                          accept="image/png, image/jpeg, image/jpg, image/webp"
                          onChange={handleFileChange}
                          style={{ display: 'none' }}
                        />
                        Cambiar foto
                      </label>
                    </div>
                  ) : (
                    <label
                      className={`pet-upload-dropzone ${isDragging ? 'pet-upload-dropzone--dragging' : ''}`}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                    >
                      <input
                        type="file"
                        accept="image/png, image/jpeg, image/jpg, image/webp"
                        onChange={handleFileChange}
                        style={{ display: 'none' }}
                      />
                      <div className="pet-upload-content">
                        <div className="pet-upload-icon">
                          <Icon name="camera" width="24" height="24" />
                        </div>
                        <p className="pet-upload-text">
                          <strong>Selecciona una foto</strong> o arrástrala aquí desde tu dispositivo
                        </p>
                        <span className="pet-upload-hint">Formatos soportados: JPG, JPEG, PNG o WEBP (Máx. 5 MB)</span>
                      </div>
                    </label>
                  )}
                </div>
              </div>

              <div className="pet-form__field">
                <label>Nombre de la Mascota *</label>
                <input
                  type="text"
                  required
                  placeholder="ej. Bruno, Nala"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                />
              </div>

              {/* ── Date Picker Moderno Estilizado (Reubicado en la parte superior del formulario) ── */}
              <div className="pet-form__field">
                <label>Fecha de Nacimiento</label>
                <CustomDatePicker
                  value={formData.fecha_nacimiento}
                  onChange={(val) => setFormData({ ...formData, fecha_nacimiento: val })}
                  placeholder="Selecciona fecha de nacimiento"
                />
              </div>

              <div className="pet-form__row">
                <div className="pet-form__field">
                  <label>Especie *</label>
                  <select
                    value={formData.especie}
                    onChange={(e) => handleEspecieChange(e.target.value)}
                  >
                    <option value="Canino">Canino (Perro)</option>
                    <option value="Felino">Felino (Gato)</option>
                    <option value="Ave">Ave</option>
                    <option value="Roedor">Roedor</option>
                    <option value="Otro">Otro</option>
                  </select>
                </div>

                <div className="pet-form__field">
                  <label>Raza *</label>
                  {!formData.especie ? (
                    <select disabled className="pet-select-disabled">
                      <option value="">Selecciona primero una especie</option>
                    </select>
                  ) : (
                    <select
                      value={
                        (RAZAS_POR_ESPECIE[formData.especie] || []).filter(r => r !== 'Otra (Especificar)').includes(formData.raza)
                          ? formData.raza
                          : 'Otra (Especificar)'
                      }
                      onChange={(e) => {
                        const val = e.target.value
                        if (val === 'Otra (Especificar)') {
                          setFormData({ ...formData, raza: '' })
                        } else {
                          setFormData({ ...formData, raza: val })
                        }
                      }}
                    >
                      {(RAZAS_POR_ESPECIE[formData.especie] || []).map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              {/* Campo de texto libre condicional si selecciona "Otra (Especificar)" o ingresa una raza personalizada */}
              {(formData.especie === 'Otro' ||
                formData.raza === 'Otra (Especificar)' ||
                !(RAZAS_POR_ESPECIE[formData.especie] || []).filter(r => r !== 'Otra (Especificar)').includes(formData.raza)) && (
                <div className="pet-form__field">
                  <label>Escribe la raza de tu mascota *</label>
                  <input
                    type="text"
                    required
                    placeholder="Escribe la raza de tu mascota"
                    value={formData.raza === 'Otra (Especificar)' ? '' : formData.raza}
                    onChange={(e) => setFormData({ ...formData, raza: e.target.value })}
                  />
                </div>
              )}



              <div className="pet-form__row">
                <div className="pet-form__field">
                  <label>Sexo</label>
                  <select
                    value={formData.sexo}
                    onChange={(e) => setFormData({ ...formData, sexo: e.target.value })}
                  >
                    <option value="Macho">Macho</option>
                    <option value="Hembra">Hembra</option>
                  </select>
                </div>

                <div className="pet-form__field">
                  <label>Peso (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    placeholder="ej. 12.5"
                    value={formData.peso}
                    onChange={(e) => setFormData({ ...formData, peso: e.target.value })}
                  />
                </div>
              </div>


              <div className="modal-box__footer">
                <button
                  type="button"
                  className="btn-modal-secondary"
                  onClick={() => setShowFormModal(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn-modal-primary" disabled={saving}>
                  {saving ? 'Guardando...' : editingId ? 'Guardar Cambios' : 'Registrar Mascota'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL CONFIRMACIÓN ELIMINAR ── */}
      {showDeleteModal && deletingPet && (
        <div className="modal-backdrop">
          <div className="modal-box modal-box--sm">
            <div className="modal-box__header">
              <h3>Confirmar Eliminación</h3>
              <button className="modal-box__close" onClick={() => setShowDeleteModal(false)}>
                <Icon name="close" />
              </button>
            </div>

            <div className="modal-box__body">
              <p>¿Estás seguro de que deseas eliminar a <strong>{deletingPet.nombre}</strong>?</p>
              <p className="text-muted" style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.5rem' }}>
                Esta acción la ocultará de tu perfil y cancelará registros asociados activos.
              </p>
            </div>

            <div className="modal-box__footer">
              <button
                type="button"
                className="btn-modal-secondary"
                onClick={() => setShowDeleteModal(false)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn-modal-danger"
                onClick={handleConfirmDelete}
                disabled={deleting}
              >
                {deleting ? 'Eliminando...' : 'Sí, Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default MisMascotas
