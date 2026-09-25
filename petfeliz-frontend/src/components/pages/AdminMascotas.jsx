// src/components/pages/AdminMascotas.jsx
import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getStoredToken, getStoredUser, isValidAvatarUrl } from '../../utils/authStorage'
import SidebarAdmin from '../ui/SidebarAdmin'
import DashboardHeader from '../ui/DashboardHeader'
import './DashboardClient.css'
import './AdminDashboard.css'
import './AdminCitas.css'
import './AdminMascotas.css'

// Helper para obtener el icono FontAwesome exacto por especie (Sin Emojis)
function getSpeciesIcon(especie = '') {
  const norm = especie.toLowerCase().trim()
  if (norm.includes('canin') || norm.includes('perro') || norm === 'dog') {
    return 'fa-dog'
  }
  if (norm.includes('felin') || norm.includes('gato') || norm === 'cat') {
    return 'fa-cat'
  }
  if (norm.includes('ave') || norm.includes('pájaro') || norm.includes('pajaro') || norm.includes('bird')) {
    return 'fa-dove'
  }
  if (norm.includes('pez') || norm.includes('fish')) {
    return 'fa-fish'
  }
  if (norm.includes('reptil') || norm.includes('exót') || norm.includes('exot')) {
    return 'fa-otter'
  }
  return 'fa-paw'
}

// Helper para obtener la clase CSS de la insignia por especie
function getSpeciesBadgeClass(especie = '') {
  const norm = especie.toLowerCase().trim()
  if (norm.includes('canin') || norm.includes('perro') || norm === 'dog') {
    return 'species-pill--canino'
  }
  if (norm.includes('felin') || norm.includes('gato') || norm === 'cat') {
    return 'species-pill--felino'
  }
  return 'species-pill--otros'
}

// Componente helper para Avatar de Mascota con fallback por especie usando FontAwesome
function PetAvatar({ mascota, size = '44px', fontSize = '1.2rem', style = {} }) {
  const photoUrl = mascota?.foto || mascota?.foto_mascota
  const [imgError, setImgError] = useState(false)

  useEffect(() => {
    setImgError(false)
  }, [photoUrl])

  const especie = (mascota?.especie || '').toLowerCase()
  let bg = '#ecfdf5'
  let color = '#059669'
  let icon = 'fa-solid ' + getSpeciesIcon(especie)

  if (especie.includes('felin') || especie.includes('gato') || especie === 'cat') {
    bg = '#fef3c7'
    color = '#d97706'
  } else if (especie.includes('ave') || especie.includes('pájaro') || especie.includes('pajaro')) {
    bg = '#e0f2fe'
    color = '#0284c7'
  } else if (especie.includes('exót') || especie.includes('exot') || especie.includes('otr')) {
    bg = '#fce7f3'
    color = '#ec4899'
  } else if (especie.includes('pez')) {
    bg = '#e0f2fe'
    color = '#0284c7'
  }

  if (isValidAvatarUrl(photoUrl) && !imgError) {
    return (
      <img
        src={photoUrl}
        alt={mascota?.nombre || 'Mascota'}
        className="pet-avatar-img"
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          objectFit: 'cover',
          border: '2px solid #e2e8f0',
          flexShrink: 0,
          ...style,
        }}
        onError={() => setImgError(true)}
      />
    )
  }

  return (
    <div
      className="pet-avatar-fallback"
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        backgroundColor: bg,
        color: color,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: fontSize,
        fontWeight: 600,
        border: '2px solid #e2e8f0',
        flexShrink: 0,
        ...style,
      }}
      title={`${mascota?.nombre || 'Mascota'} (${mascota?.especie || 'Mascota'})`}
    >
      <i className={icon}></i>
    </div>
  )
}

export default function AdminMascotas() {
  const navigate = useNavigate()
  const storedUser = getStoredUser()

  const [usuario] = useState({
    nombre: storedUser?.nombre || 'Administrador',
    nombreCompleto: storedUser?.nombreCompleto || 'Director Administrativo',
    foto: isValidAvatarUrl(storedUser?.foto || storedUser?.foto_perfil) ? (storedUser?.foto || storedUser?.foto_perfil) : null,
  })

  const [mascotas, setMascotas] = useState([])
  const [clientes, setClientes] = useState([])
  const [stats, setStats] = useState({
    total: 0,
    caninos: 0,
    felinos: 0,
    otros: 0,
    con_alergias: 0,
  })

  const [loading, setLoading] = useState(true)
  const [errorGlobal, setErrorGlobal] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [especieFilter, setEspecieFilter] = useState('todas')

  // Toast de confirmación flotante
  const [toast, setToast] = useState(null)

  const triggerToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => {
      setToast(null)
    }, 4000)
  }

  // Modales & Drawers
  const [selectedFicha, setSelectedFicha] = useState(null)
  const [fichaTab, setFichaTab] = useState('resumen') // 'resumen' | 'citas' | 'vacunas' | 'alergias'
  const [loadingFicha, setLoadingFicha] = useState(false)

  const [showModalForm, setShowModalForm] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editingId, setEditingId] = useState(null)

  const [formMascota, setFormMascota] = useState({
    id_cliente: '',
    nombre: '',
    especie: 'Canino',
    raza: '',
    sexo: 'Macho',
    fecha_nacimiento: '',
    peso: '',
    alergias: '',
    foto_mascota: '',
  })

  const [selectedFile, setSelectedFile] = useState(null)
  const [photoPreview, setPhotoPreview] = useState('')

  const [submittingForm, setSubmittingForm] = useState(false)
  const [formError, setFormError] = useState('')

  const [deletingMascota, setDeletingMascota] = useState(null)
  const [submittingDelete, setSubmittingDelete] = useState(false)

  // Cargar Mascotas de Administración
  const fetchMascotasData = async () => {
    const token = getStoredToken()
    if (!token) {
      navigate('/login')
      return
    }

    try {
      setLoading(true)
      setErrorGlobal('')

      const res = await fetch(`${import.meta.env.VITE_API_URL}/admin/mascotas`, {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      })

      if (res.status === 401 || res.status === 403) {
        navigate('/login')
        return
      }

      if (res.ok) {
        const data = await res.json()
        setMascotas(data.mascotas || [])
        setClientes(data.clientes || [])
        if (data.stats) {
          setStats(data.stats)
        }
      } else {
        setErrorGlobal('No se pudo obtener el listado de mascotas.')
      }
    } catch (err) {
      console.error('Error al cargar mascotas de administración:', err)
      setErrorGlobal('Error de conexión con el servidor al cargar las mascotas.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMascotasData()
  }, [navigate])

  // Cargar Ficha Clínica Individual
  const handleOpenFicha = async (id_mascota) => {
    const token = getStoredToken()
    setFichaTab('resumen')
    setLoadingFicha(true)
    setSelectedFicha(null)

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/admin/mascotas/${id_mascota}`, {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      })

      if (res.ok) {
        const data = await res.json()
        setSelectedFicha(data)
      } else {
        triggerToast('No se pudo cargar la ficha clínica de la mascota.', 'error')
      }
    } catch (err) {
      console.error('Error al obtener la ficha clínica:', err)
      triggerToast('Error de conexión al obtener la ficha clínica.', 'error')
    } finally {
      setLoadingFicha(false)
    }
  }

  // Abrir Drawer de Creación
  const handleOpenCreateModal = () => {
    setSelectedFile(null)
    setPhotoPreview('')
    setIsEditing(false)
    setEditingId(null)
    setFormError('')
    setFormMascota({
      id_cliente: clientes.length > 0 ? clientes[0].id_cliente : '',
      nombre: '',
      especie: 'Canino',
      raza: '',
      sexo: 'Macho',
      fecha_nacimiento: '',
      peso: '',
      alergias: '',
      foto_mascota: '',
    })
    setShowModalForm(true)
  }

  // Abrir Drawer de Edición
  const handleOpenEditModal = (mascota) => {
    setSelectedFile(null)
    const currentPhoto = isValidAvatarUrl(mascota.foto || mascota.foto_mascota) ? (mascota.foto || mascota.foto_mascota) : ''
    setPhotoPreview(currentPhoto)
    setIsEditing(true)
    setEditingId(mascota.id_mascota)
    setFormError('')
    setFormMascota({
      id_cliente: mascota.id_cliente || (clientes.length > 0 ? clientes[0].id_cliente : ''),
      nombre: mascota.nombre || '',
      especie: mascota.especie || 'Canino',
      raza: mascota.raza || '',
      sexo: mascota.sexo || 'Macho',
      fecha_nacimiento: mascota.fecha_nacimiento || '',
      peso: mascota.peso !== null && mascota.peso !== undefined ? String(mascota.peso) : '',
      alergias: mascota.alergias || '',
      foto_mascota: currentPhoto,
    })
    setShowModalForm(true)
  }

  const handlePhotoUrlChange = (e) => {
    const val = e.target.value
    setFormMascota((prev) => ({ ...prev, foto_mascota: val }))
    if (selectedFile) setSelectedFile(null)
    setPhotoPreview(val.trim())
  }

  const handlePhotoFileChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setSelectedFile(file)
    setPhotoPreview(URL.createObjectURL(file))
  }

  // Enviar Formulario Crear/Editar
  const handleSubmitForm = async (e) => {
    e.preventDefault()
    setFormError('')

    if (!formMascota.nombre.trim()) {
      setFormError('El nombre de la mascota es obligatorio.')
      return
    }

    if (!formMascota.id_cliente) {
      setFormError('Debes seleccionar el cliente/dueño asociado.')
      return
    }

    const token = getStoredToken()
    setSubmittingForm(true)

    try {
      const url = isEditing
        ? `${import.meta.env.VITE_API_URL}/admin/mascotas/${editingId}`
        : `${import.meta.env.VITE_API_URL}/admin/mascotas`

      let res

      if (selectedFile) {
        const formData = new FormData()
        formData.append('id_cliente', formMascota.id_cliente)
        formData.append('nombre', formMascota.nombre.trim())
        formData.append('especie', formMascota.especie)
        formData.append('raza', formMascota.raza.trim() || 'Criollo')
        formData.append('sexo', formMascota.sexo)
        if (formMascota.fecha_nacimiento) formData.append('fecha_nacimiento', formMascota.fecha_nacimiento)
        if (formMascota.peso) formData.append('peso', formMascota.peso)
        if (formMascota.alergias.trim()) formData.append('alergias', formMascota.alergias.trim())
        formData.append('foto', selectedFile)
        if (isEditing) formData.append('_method', 'PUT')

        res = await fetch(url, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
          },
          body: formData,
        })
      } else {
        let cleanUrl = (formMascota.foto_mascota || '').trim()
        if (cleanUrl && !cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
          cleanUrl = 'https://' + cleanUrl
        }

        const payload = {
          id_cliente: Number(formMascota.id_cliente),
          nombre: formMascota.nombre.trim(),
          especie: formMascota.especie,
          raza: formMascota.raza.trim() || 'Criollo',
          sexo: formMascota.sexo,
          fecha_nacimiento: formMascota.fecha_nacimiento || null,
          peso: formMascota.peso ? parseFloat(formMascota.peso) : null,
          alergias: formMascota.alergias.trim() || null,
          foto_mascota: cleanUrl || null,
        }

        res = await fetch(url, {
          method: isEditing ? 'PUT' : 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify(payload),
        })
      }

      if (res.ok || res.status === 201) {
        setShowModalForm(false)
        triggerToast(
          isEditing ? 'Información de la mascota actualizada exitosamente.' : 'Mascota registrada exitosamente.',
          'success'
        )
        fetchMascotasData()
      } else {
        const errData = await res.json().catch(() => ({}))
        const firstErr = errData.errors ? Object.values(errData.errors)[0][0] : errData.message
        setFormError(firstErr || 'Error al guardar la información de la mascota.')
      }
    } catch (err) {
      console.error('Error al guardar mascota:', err)
      setFormError('Error de comunicación con el servidor.')
    } finally {
      setSubmittingForm(false)
    }
  }

  // Eliminar Mascota
  const handleConfirmDelete = async () => {
    if (!deletingMascota) return
    const token = getStoredToken()
    setSubmittingDelete(true)

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/admin/mascotas/${deletingMascota.id_mascota}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      })

      if (res.ok) {
        setDeletingMascota(null)
        triggerToast('Mascota eliminada del catálogo exitosamente.', 'success')
        fetchMascotasData()
      } else {
        triggerToast('No se pudo eliminar la mascota.', 'error')
      }
    } catch (err) {
      console.error('Error al eliminar mascota:', err)
      triggerToast('Error de conexión al eliminar la mascota.', 'error')
    } finally {
      setSubmittingDelete(false)
    }
  }

  // Filtrado de listado
  const searchLower = searchTerm.toLowerCase().trim()
  const mascotasFiltradas = mascotas.filter((m) => {
    if (especieFilter !== 'todas') {
      if (especieFilter === 'Canino' && m.especie !== 'Canino') return false
      if (especieFilter === 'Felino' && m.especie !== 'Felino') return false
      if (especieFilter === 'Otros' && (m.especie === 'Canino' || m.especie === 'Felino')) return false
    }

    if (!searchLower) return true

    const nombreDueño = m.dueno?.nombre?.toLowerCase() || ''
    const telDueño = m.dueno?.telefono?.toLowerCase() || ''
    const cedulaDueño = m.dueno?.cedula?.toLowerCase() || ''

    return (
      m.nombre.toLowerCase().includes(searchLower) ||
      m.especie.toLowerCase().includes(searchLower) ||
      m.raza.toLowerCase().includes(searchLower) ||
      nombreDueño.includes(searchLower) ||
      telDueño.includes(searchLower) ||
      cedulaDueño.includes(searchLower) ||
      String(m.id_mascota).includes(searchLower)
    )
  })

  return (
    <div className="dash">
      <SidebarAdmin />

      {/* Toast Notification Flotante */}
      {toast && (
        <div className={`adm-toast ${toast.type === 'error' ? 'adm-toast--error' : ''}`}>
          <i className={`adm-toast__icon fa-solid ${toast.type === 'error' ? 'fa-triangle-exclamation' : 'fa-circle-check'}`}></i>
          <span>{toast.message}</span>
          <button className="adm-toast__close" onClick={() => setToast(null)} title="Cerrar notificación">
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>
      )}

      <main className="dash-main">
        <DashboardHeader
          title="Mascotas"
          subtitle="Consulta y gestiona las mascotas registradas y sus historias clínicas"
          usuario={usuario}
        />

        {errorGlobal && (
          <div className="dash-alert dash-alert--danger" style={{ marginBottom: '1.5rem' }}>
            <i className="fa-solid fa-triangle-exclamation"></i>
            <span>{errorGlobal}</span>
          </div>
        )}

        {/* ── 4 TARJETAS DE ESTADÍSTICAS REALES (GRID DE 4 COLUMNAS) ── */}
        <div className="admin-dash-grid">
          <div className="admin-stat-card">
            <div className="admin-stat-card__info">
              <span className="admin-stat-card__title" style={{ color: '#059669', fontWeight: 700, fontSize: '0.86rem' }}>Total Mascotas</span>
              <h3>{loading ? '...' : stats.total}</h3>
              <div className="admin-trend-badge admin-trend-badge--positive">
                <i className="fa-solid fa-paw"></i>
                <span>Directorio Global</span>
              </div>
            </div>
            <div className="admin-stat-card__icon admin-stat-card__icon--green">
              <i className="fa-solid fa-paw"></i>
            </div>
          </div>

          <div className="admin-stat-card">
            <div className="admin-stat-card__info">
              <span className="admin-stat-card__title" style={{ color: '#0284c7', fontWeight: 700, fontSize: '0.86rem' }}>Caninos Registrados</span>
              <h3>{loading ? '...' : stats.caninos}</h3>
              <div className="admin-trend-badge admin-trend-badge--positive">
                <i className="fa-solid fa-dog"></i>
                <span>Pacientes Caninos</span>
              </div>
            </div>
            <div className="admin-stat-card__icon admin-stat-card__icon--blue">
              <i className="fa-solid fa-dog"></i>
            </div>
          </div>

          <div className="admin-stat-card">
            <div className="admin-stat-card__info">
              <span className="admin-stat-card__title" style={{ color: '#d97706', fontWeight: 700, fontSize: '0.86rem' }}>Felinos Registrados</span>
              <h3>{loading ? '...' : stats.felinos}</h3>
              <div className="admin-trend-badge admin-trend-badge--positive">
                <i className="fa-solid fa-cat"></i>
                <span>Pacientes Felinos</span>
              </div>
            </div>
            <div className="admin-stat-card__icon admin-stat-card__icon--amber">
              <i className="fa-solid fa-cat"></i>
            </div>
          </div>

          <div className="admin-stat-card">
            <div className="admin-stat-card__info">
              <span className="admin-stat-card__title" style={{ color: '#7e22ce', fontWeight: 700, fontSize: '0.86rem' }}>Otras Especies</span>
              <h3>{loading ? '...' : (stats.otros !== undefined ? stats.otros : Math.max(0, stats.total - (stats.caninos + stats.felinos)))}</h3>
              <div className="admin-trend-badge admin-trend-badge--positive" style={{ color: '#7e22ce', background: '#f3e8ff', borderColor: '#e9d5ff' }}>
                <i className="fa-solid fa-dove"></i>
                <span>Aves, Exóticos y Más</span>
              </div>
            </div>
            <div className="admin-stat-card__icon" style={{ background: '#f3e8ff', color: '#7e22ce', border: '1px solid #e9d5ff' }}>
              <i className="fa-solid fa-otter"></i>
            </div>
          </div>
        </div>

        {/* ── BARRA DE HERRAMIENTAS: BÚSQUEDA Y NUEVA MASCOTA ── */}
        <div className="adm-toolbar">
          <div className="adm-toolbar__search">
            <i className="fa-solid fa-magnifying-glass search-icon"></i>
            <input
              type="text"
              placeholder="Buscar por nombre, especie, raza o cliente/dueño..."
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
              <label>Especie:</label>
              <select value={especieFilter} onChange={(e) => setEspecieFilter(e.target.value)}>
                <option value="todas">Todas las especies</option>
                <option value="Canino">Caninos</option>
                <option value="Felino">Felinos</option>
                <option value="Otros">Otras especies</option>
              </select>
            </div>
          </div>
        </div>

        {/* ── TABLA PRINCIPAL DE MASCOTAS ── */}
        <div className="admin-card">
          <div className="admin-card__header">
            <div className="admin-card__title">
              <div className="admin-card__title-icon" style={{ background: '#ecfdf5', color: '#047857' }}>
                <i className="fa-solid fa-paw"></i>
              </div>
              <h3>Directorio de Mascotas</h3>
            </div>
            <span style={{ fontSize: '0.82rem', color: '#64748b', fontWeight: 600 }}>
              {mascotasFiltradas.length} Registradas
            </span>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
              <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: '1.8rem', color: '#059669', marginBottom: '0.5rem' }}></i>
              <p>Cargando pacientes veterinarios...</p>
            </div>
          ) : mascotasFiltradas.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
              <i className="fa-solid fa-paw" style={{ fontSize: '2rem', color: '#cbd5e1', marginBottom: '0.5rem' }}></i>
              <p>No se encontraron mascotas con los criterios ingresados.</p>
            </div>
          ) : (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>PACIENTE</th>
                    <th>ESPECIE & RAZA</th>
                    <th>EDAD & PESO</th>
                    <th>CLIENTE / DUEÑO</th>
                    <th>CITAS</th>
                    <th style={{ textAlign: 'center' }}>ACCIONES</th>
                  </tr>
                </thead>
                <tbody>
                  {mascotasFiltradas.map((m) => (
                    <tr key={m.id_mascota}>
                      <td>
                        <div className="pet-info-cell">
                          <PetAvatar mascota={m} size="44px" fontSize="1.15rem" />
                          <div>
                            <strong className="pet-name">{m.nombre}</strong>
                            <span className="pet-meta-sub">
                              ID: #{m.id_mascota} • {m.sexo === 'Macho' ? (
                                <span><i className="fa-solid fa-mars" style={{ color: '#0284c7', marginRight: '3px' }}></i> Macho</span>
                              ) : (
                                <span><i className="fa-solid fa-venus" style={{ color: '#ec4899', marginRight: '3px' }}></i> Hembra</span>
                              )}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span className={`species-pill ${getSpeciesBadgeClass(m.especie)}`}>
                            <i className={`fa-solid ${getSpeciesIcon(m.especie)}`} style={{ marginRight: '6px' }}></i>
                            {m.especie}
                          </span>
                          <span style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.2rem' }}>{m.raza}</span>
                        </div>
                      </td>
                      <td>
                        <div style={{ fontSize: '0.88rem', color: '#1e293b' }}>
                          <div><span>{m.edad || 'No registrada'}</span></div>
                          <div style={{ color: '#64748b', fontSize: '0.8rem' }}>
                            {m.peso ? `${m.peso} kg` : 'Peso N/A'}
                          </div>
                        </div>
                      </td>
                      <td>
                        {m.dueno ? (
                          <div className="owner-cell">
                            <span style={{ fontWeight: 600, color: '#334155' }}>{m.dueno.nombre}</span>
                            <span className="owner-sub">
                              <i className="fa-solid fa-phone" style={{ fontSize: '0.75rem', marginRight: '4px', color: '#0284c7' }}></i>
                              {m.dueno.telefono}
                            </span>
                          </div>
                        ) : (
                          <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>Sin cliente asignado</span>
                        )}
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                          <span className="citas-count-badge">
                            <i className="fa-regular fa-calendar-check"></i> {m.total_citas || 0} citas
                          </span>
                          {m.citas_urgencias > 0 || m.ultima_cita?.es_urgencia ? (
                            <span className="cita-tag-badge cita-tag-badge--urgencia">
                              <i className="fa-solid fa-truck-medical"></i> Urgencias
                            </span>
                          ) : m.citas_atendidas > 0 || m.ultima_cita?.asistio || (m.total_citas > 0) ? (
                            <span className="cita-tag-badge cita-tag-badge--asistio">
                              <i className="fa-solid fa-circle-check"></i> Asistió a Cita
                            </span>
                          ) : (
                            <span style={{ fontSize: '0.78rem', color: '#94a3b8', fontStyle: 'italic' }}>
                              Sin atención previa
                            </span>
                          )}
                        </div>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <div className="action-buttons-group">
                          <button
                            type="button"
                            className="act-btn act-btn--view"
                            title="Ver Ficha Clínica"
                            onClick={() => handleOpenFicha(m.id_mascota)}
                          >
                            <i className="fa-solid fa-notes-medical"></i>
                            <span>Ficha</span>
                          </button>
                          <button
                            type="button"
                            className="act-btn act-btn--edit"
                            title="Editar Mascota"
                            onClick={() => handleOpenEditModal(m)}
                          >
                            <i className="fa-solid fa-pen"></i>
                          </button>
                          <button
                            type="button"
                            className="act-btn act-btn--delete"
                            title="Eliminar Mascota"
                            onClick={() => setDeletingMascota(m)}
                          >
                            <i className="fa-solid fa-trash-can"></i>
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

      {/* ── DRAWER LATERAL: FICHA CLÍNICA DE LA MASCOTA ── */}
      {(selectedFicha || loadingFicha) && (
        <div className="adm-drawer-overlay" onClick={() => setSelectedFicha(null)}>
          <div className="adm-drawer-panel" onClick={(e) => e.stopPropagation()}>
            {loadingFicha ? (
              <div style={{ padding: '4rem', textAlign: 'center', color: '#64748b' }}>
                <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: '2rem', color: '#059669', marginBottom: '1rem' }}></i>
                <p>Cargando expediente médico completo...</p>
              </div>
            ) : selectedFicha && (
              <>
                <div className="adm-vet-hero" style={{ background: 'linear-gradient(135deg, #064e3b 0%, #047857 55%, #059669 100%)' }}>
                  <div className="adm-vet-hero__avatar-wrap">
                    <PetAvatar mascota={selectedFicha} size="76px" fontSize="2rem" style={{ border: '3px solid rgba(255,255,255,0.95)', boxShadow: '0 6px 18px rgba(0,0,0,0.25)' }} />
                  </div>
                  <div className="adm-vet-hero__info">
                    <div className="adm-vet-hero__tag">
                      <i className="fa-solid fa-paw"></i>
                      <span>Paciente Veterinario</span>
                    </div>
                    <h2>{selectedFicha.nombre}</h2>
                    <div className="adm-vet-hero__tp">
                      <span className="adm-vet-hero__badge">ID #{selectedFicha.id_mascota}</span>
                      <span className="adm-vet-hero__badge adm-vet-hero__badge--tp">
                        <i className={`fa-solid ${getSpeciesIcon(selectedFicha.especie)}`} style={{ marginRight: '4px' }}></i>
                        {selectedFicha.especie} • {selectedFicha.sexo}
                      </span>
                    </div>
                  </div>
                  <button className="adm-drawer-close adm-drawer-close--white" onClick={() => setSelectedFicha(null)} title="Cerrar Ficha">
                    <i className="fa-solid fa-xmark"></i>
                  </button>
                </div>

                <div className="adm-drawer-body">
                  {/* Pestañas de la Ficha */}
                  <div className="ficha-tabs">
                    <button
                      type="button"
                      className={`ficha-tab-btn ${fichaTab === 'resumen' ? 'ficha-tab-btn--active' : ''}`}
                      onClick={() => setFichaTab('resumen')}
                    >
                      <i className="fa-solid fa-circle-info"></i> Resumen
                    </button>
                    <button
                      type="button"
                      className={`ficha-tab-btn ${fichaTab === 'citas' ? 'ficha-tab-btn--active' : ''}`}
                      onClick={() => setFichaTab('citas')}
                    >
                      <i className="fa-regular fa-calendar-check"></i> Citas ({selectedFicha.citas?.length || 0})
                    </button>
                    <button
                      type="button"
                      className={`ficha-tab-btn ${fichaTab === 'vacunas' ? 'ficha-tab-btn--active' : ''}`}
                      onClick={() => setFichaTab('vacunas')}
                    >
                      <i className="fa-solid fa-syringe"></i> Vacunas
                    </button>
                    <button
                      type="button"
                      className={`ficha-tab-btn ${fichaTab === 'alergias' ? 'ficha-tab-btn--active' : ''}`}
                      onClick={() => setFichaTab('alergias')}
                    >
                      <i className="fa-solid fa-triangle-exclamation"></i> Alergias
                    </button>
                  </div>

                  {/* Pestaña 1: Resumen & Propietario */}
                  {fichaTab === 'resumen' && (
                    <div className="grid-2-col">
                      <div className="info-box">
                        <h4 className="info-box__title"><i className="fa-solid fa-paw" style={{ color: '#059669' }}></i> Datos Clínicos</h4>
                        <ul className="info-list">
                          <li><span>Nombre:</span> <strong>{selectedFicha.nombre}</strong></li>
                          <li><span>Especie / Raza:</span> <strong>{selectedFicha.especie} / {selectedFicha.raza}</strong></li>
                          <li><span>Sexo:</span> <strong>{selectedFicha.sexo}</strong></li>
                          <li><span>Fecha Nacimiento:</span> <strong>{selectedFicha.fecha_nacimiento || 'No registrada'}</strong></li>
                          <li><span>Edad Estimada:</span> <strong>{selectedFicha.edad || 'Desconocida'}</strong></li>
                          <li><span>Peso Corporal:</span> <strong>{selectedFicha.peso ? `${selectedFicha.peso} kg` : 'N/A'}</strong></li>
                        </ul>
                      </div>

                      <div className="info-box">
                        <h4 className="info-box__title"><i className="fa-solid fa-user-shield" style={{ color: '#0284c7' }}></i> Propietario / Cliente</h4>
                        {selectedFicha.dueno ? (
                          <ul className="info-list">
                            <li><span>Nombre Dueño:</span> <strong>{selectedFicha.dueno.nombre}</strong></li>
                            <li><span>Teléfono:</span> <strong>{selectedFicha.dueno.telefono}</strong></li>
                            <li><span>Documento Cédula:</span> <strong>{selectedFicha.dueno.cedula || 'Sin cédula'}</strong></li>
                            <li><span>Dirección:</span> <strong>{selectedFicha.dueno.direccion || 'No registrada'}</strong></li>
                            <li>
                              <span>Estado Afiliación:</span>
                              <strong style={{ color: selectedFicha.dueno.es_afiliado ? '#059669' : '#dc2626' }}>
                                {selectedFicha.dueno.es_afiliado ? 'Afiliado Activo' : 'No Afiliado'}
                              </strong>
                            </li>
                          </ul>
                        ) : (
                          <p style={{ color: '#94a3b8', fontStyle: 'italic' }}>Sin información de cliente asociada.</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Pestaña 2: Historial Clínico & Citas */}
                  {fichaTab === 'citas' && (
                    <div>
                      {selectedFicha.citas && selectedFicha.citas.length > 0 ? (
                        <div className="citas-history-list">
                          {selectedFicha.citas.map((c) => (
                            <div key={c.id_cita} className="cita-history-item">
                              <div className="cita-history-left">
                                <span className="cita-history-date">{c.fecha_formateada}</span>
                                <span className="cita-history-time">{c.hora}</span>
                              </div>
                              <div className="cita-history-body">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <strong>{c.servicio}</strong>
                                  <span className={`status-pill status-pill--${c.id_estado === 2 || c.id_estado === 4 ? 'atendida' : c.id_estado === 3 ? 'cancelada' : 'pendiente'}`}>
                                    {c.estado}
                                  </span>
                                </div>
                                <p className="cita-history-vet">
                                  <i className="fa-solid fa-user-doctor"></i> {c.veterinario}
                                </p>
                                {c.observaciones && (
                                  <p className="cita-history-obs">
                                    <strong>Observaciones:</strong> {c.observaciones}
                                  </p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
                          <i className="fa-regular fa-calendar-xmark" style={{ fontSize: '2rem', color: '#cbd5e1', marginBottom: '0.5rem' }}></i>
                          <p>Esta mascota no registra historial de citas registradas.</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Pestaña 3: Vacunas */}
                  {fichaTab === 'vacunas' && (
                    <div className="vacunas-grid">
                      {selectedFicha.vacunas && selectedFicha.vacunas.length > 0 ? (
                        selectedFicha.vacunas.map((vac, idx) => (
                          <div key={idx} className="vacuna-card">
                            <div className="vacuna-card__icon" style={{ backgroundColor: vac.estado === 'Aplicada' ? '#ecfdf5' : '#fffbe8', color: vac.estado === 'Aplicada' ? '#059669' : '#d97706' }}>
                              <i className="fa-solid fa-syringe"></i>
                            </div>
                            <div className="vacuna-card__info">
                              <strong>{vac.nombre}</strong>
                              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginTop: '0.25rem' }}>
                                <span className={`status-pill status-pill--${vac.estado === 'Aplicada' ? 'atendida' : 'pendiente'}`}>
                                  {vac.estado}
                                </span>
                                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>{vac.fecha}</span>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b', gridColumn: '1 / -1' }}>
                          <i className="fa-solid fa-syringe" style={{ fontSize: '2rem', color: '#cbd5e1', marginBottom: '0.5rem' }}></i>
                          <p>No se registran vacunas para esta mascota.</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Pestaña 4: Alergias & Alertas */}
                  {fichaTab === 'alergias' && (
                    <div className="alergias-box">
                      <div className="alergias-box__header">
                        <i className="fa-solid fa-triangle-exclamation" style={{ color: '#dc2626', fontSize: '1.25rem' }}></i>
                        <h4 style={{ margin: 0, fontWeight: 600, color: '#991b1b' }}>Alertas Médicas & Alergias</h4>
                      </div>
                      <p style={{ margin: '0.75rem 0 0 0', color: '#334155', lineHeight: '1.5', fontSize: '0.95rem' }}>
                        {selectedFicha.alergias || 'Sin alergias ni condiciones especiales registradas.'}
                      </p>
                    </div>
                  )}
                </div>

                <div className="adm-drawer-footer">
                  <button
                    type="button"
                    className="adm-btn-primary"
                    onClick={() => {
                      const target = selectedFicha
                      setSelectedFicha(null)
                      handleOpenEditModal(target)
                    }}
                    style={{ width: '100%', justifyContent: 'center', display: 'flex', alignItems: 'center' }}
                  >
                    <i className="fa-solid fa-pen-to-square" style={{ marginRight: '6px' }}></i>
                    Editar Ficha de Mascota
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── DRAWER LATERAL: CREAR / EDITAR MASCOTA ── */}
      {showModalForm && (
        <div className="adm-drawer-overlay" onClick={() => setShowModalForm(false)}>
          <div className="adm-drawer-panel" onClick={(e) => e.stopPropagation()}>
            <div className="adm-drawer-header">
              <div className="adm-drawer-header__title-group">
                <div className="adm-drawer-header__icon">
                  <i className="fa-solid fa-pen-to-square"></i>
                </div>
                <div>
                  <h3>Editar Datos de Mascota</h3>
                  <span className="adm-drawer-header__sub">
                    Actualiza la ficha médica y la información del paciente
                  </span>
                </div>
              </div>
              <button type="button" className="adm-drawer-close" onClick={() => setShowModalForm(false)} title="Cerrar">
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <form onSubmit={handleSubmitForm} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
              <div className="adm-drawer-body">
                {formError && (
                  <div className="dash-alert dash-alert--danger" style={{ marginBottom: '1.2rem' }}>
                    <i className="fa-solid fa-circle-exclamation"></i>
                    <span>{formError}</span>
                  </div>
                )}

                <div className="adm-form-section">
                  <h5 className="adm-form-section-title">Cliente / Dueño Asociado</h5>
                  <div className="adm-form-group">
                    <label>Propietario de la Mascota *</label>
                    <div className="adm-input-wrap">
                      <i className="fa-solid fa-user input-icon"></i>
                      <select
                        value={formMascota.id_cliente}
                        onChange={(e) => setFormMascota({ ...formMascota, id_cliente: e.target.value })}
                        required
                      >
                        <option value="">Selecciona el cliente/dueño...</option>
                        {clientes.map((c) => (
                          <option key={c.id_cliente} value={c.id_cliente}>
                            {c.nombre} (Tel: {c.telefono})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="adm-form-section">
                  <h5 className="adm-form-section-title">Datos Básicos de la Mascota</h5>

                  <div className="adm-form-group">
                    <label>Nombre de la Mascota *</label>
                    <div className="adm-input-wrap">
                      <i className="fa-solid fa-paw input-icon"></i>
                      <input
                        type="text"
                        required
                        placeholder="Ej. Bruno, Pelusa, Toby"
                        value={formMascota.nombre}
                        onChange={(e) => setFormMascota({ ...formMascota, nombre: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="form-row-2">
                    <div className="adm-form-group">
                      <label>Especie *</label>
                      <div className="adm-input-wrap">
                        <i className="fa-solid fa-dna input-icon"></i>
                        <select
                          value={formMascota.especie}
                          onChange={(e) => setFormMascota({ ...formMascota, especie: e.target.value })}
                        >
                          <option value="Canino">Canino (Perro)</option>
                          <option value="Felino">Felino (Gato)</option>
                          <option value="Ave">Ave</option>
                          <option value="Exótico">Exótico / Otro</option>
                        </select>
                      </div>
                    </div>

                    <div className="adm-form-group">
                      <label>Raza</label>
                      <div className="adm-input-wrap">
                        <i className="fa-solid fa-tag input-icon"></i>
                        <input
                          type="text"
                          placeholder="Ej. Golden Retriever, Criollo"
                          value={formMascota.raza}
                          onChange={(e) => setFormMascota({ ...formMascota, raza: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="form-row-2">
                    <div className="adm-form-group">
                      <label>Sexo *</label>
                      <div className="adm-input-wrap">
                        <i className="fa-solid fa-venus-mars input-icon"></i>
                        <select
                          value={formMascota.sexo}
                          onChange={(e) => setFormMascota({ ...formMascota, sexo: e.target.value })}
                        >
                          <option value="Macho">Macho</option>
                          <option value="Hembra">Hembra</option>
                        </select>
                      </div>
                    </div>

                    <div className="adm-form-group">
                      <label>Fecha de Nacimiento</label>
                      <div className="adm-input-wrap">
                        <i className="fa-solid fa-calendar input-icon"></i>
                        <input
                          type="date"
                          value={formMascota.fecha_nacimiento}
                          onChange={(e) => setFormMascota({ ...formMascota, fecha_nacimiento: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="adm-form-group">
                    <label>Peso Corporal (kg)</label>
                    <div className="adm-input-wrap">
                      <i className="fa-solid fa-weight-scale input-icon"></i>
                      <input
                        type="number"
                        step="0.1"
                        placeholder="Ej. 14.5"
                        value={formMascota.peso}
                        onChange={(e) => setFormMascota({ ...formMascota, peso: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="adm-form-group">
                    <label>Alergias / Condición Médica Especial</label>
                    <textarea
                      rows="3"
                      className="adm-textarea"
                      placeholder="Ej. Alérgico a la penicilina, sensibilidad gástrica..."
                      value={formMascota.alergias}
                      onChange={(e) => setFormMascota({ ...formMascota, alergias: e.target.value })}
                    ></textarea>
                  </div>

                  <div className="adm-form-group">
                    <label>Foto de Perfil de la Mascota</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', margin: '0.4rem 0 0.75rem 0' }}>
                      <PetAvatar
                        mascota={{
                          nombre: formMascota.nombre || 'Vista previa',
                          especie: formMascota.especie,
                          foto: photoPreview || formMascota.foto_mascota,
                        }}
                        size="52px"
                        fontSize="1.3rem"
                      />
                      <div style={{ flex: 1 }}>
                        <label className="act-btn act-btn--view" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', padding: '0.4rem 0.75rem', fontSize: '0.82rem', fontWeight: 600 }}>
                          <i className="fa-solid fa-cloud-arrow-up"></i> Subir desde dispositivo
                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            style={{ display: 'none' }}
                            onChange={handlePhotoFileChange}
                          />
                        </label>
                        {selectedFile && (
                          <span style={{ fontSize: '0.78rem', color: '#059669', display: 'block', marginTop: '0.2rem', fontWeight: 600 }}>
                            ✓ {selectedFile.name}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="adm-input-wrap">
                      <i className="fa-solid fa-link input-icon"></i>
                      <input
                        type="text"
                        placeholder="https://res.cloudinary.com/..."
                        value={formMascota.foto_mascota}
                        onChange={handlePhotoUrlChange}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="adm-drawer-footer">
                <button type="button" className="adm-btn-secondary" onClick={() => setShowModalForm(false)}>
                  Cancelar
                </button>
                <button type="submit" className="adm-btn-primary" disabled={submittingForm}>
                  {submittingForm ? (
                    <>
                      <i className="fa-solid fa-spinner fa-spin" style={{ marginRight: '6px' }}></i>
                      <span>Guardando...</span>
                    </>
                  ) : (
                    <span>Guardar Cambios</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL CENTRADO: CONFIRMAR ELIMINACIÓN ── */}
      {deletingMascota && (
        <div className="adm-modal-overlay adm-modal-overlay--center" onClick={() => setDeletingMascota(null)}>
          <div className="adm-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="adm-modal-header">
              <h3 style={{ color: '#dc2626', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <i className="fa-solid fa-triangle-exclamation"></i>
                Eliminar Mascota
              </h3>
              <button type="button" className="adm-modal-close" onClick={() => setDeletingMascota(null)}>
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <div className="adm-modal-body" style={{ textAlign: 'center' }}>
              <PetAvatar mascota={deletingMascota} size="64px" fontSize="1.6rem" style={{ margin: '0 auto 1rem auto' }} />
              <p style={{ fontSize: '1rem', color: '#1e293b', marginBottom: '0.5rem' }}>
                ¿Estás seguro de que deseas eliminar a <strong>{deletingMascota.nombre}</strong>?
              </p>
              <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
                Esta acción removerá a la mascota del catálogo de administración. Sus registros clínicos permanecerán archivados de forma segura.
              </p>
            </div>

            <div className="adm-modal-footer">
              <button type="button" className="adm-btn-secondary" onClick={() => setDeletingMascota(null)}>
                Cancelar
              </button>
              <button
                type="button"
                className="adm-btn-danger"
                onClick={handleConfirmDelete}
                disabled={submittingDelete}
              >
                {submittingDelete ? (
                  <>
                    <i className="fa-solid fa-spinner fa-spin" style={{ marginRight: '6px' }}></i>
                    <span>Eliminando...</span>
                  </>
                ) : (
                  'Sí, Eliminar Mascota'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
