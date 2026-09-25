// src/components/pages/AdminMascotas.jsx
import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getStoredToken, getStoredUser } from '../../utils/authStorage'
import SidebarAdmin from '../ui/SidebarAdmin'
import DashboardHeader from '../ui/DashboardHeader'
import './DashboardClient.css'
import './AdminDashboard.css'
import './AdminCitas.css'
import './AdminMascotas.css'

export default function AdminMascotas() {
  const navigate = useNavigate()
  const storedUser = getStoredUser()

  const [usuario] = useState({
    nombre: storedUser?.nombre || 'Administrador',
    nombreCompleto: storedUser?.nombreCompleto || 'Director Administrativo',
    foto: storedUser?.foto || storedUser?.foto_perfil || null,
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

  // Modales
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
        alert('No se pudo cargar la ficha clínica de la mascota.')
      }
    } catch (err) {
      console.error('Error al obtener la ficha clínica:', err)
      alert('Error de conexión al obtener la ficha clínica.')
    } finally {
      setLoadingFicha(false)
    }
  }

  // Abrir modal de Creación
  const handleOpenCreateModal = () => {
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

  // Abrir modal de Edición
  const handleOpenEditModal = (mascota) => {
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
      foto_mascota: mascota.foto || '',
    })
    setShowModalForm(true)
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

      const method = isEditing ? 'PUT' : 'POST'

      const payload = {
        id_cliente: Number(formMascota.id_cliente),
        nombre: formMascota.nombre.trim(),
        especie: formMascota.especie,
        raza: formMascota.raza.trim() || 'Criollo',
        sexo: formMascota.sexo,
        fecha_nacimiento: formMascota.fecha_nacimiento || null,
        peso: formMascota.peso ? parseFloat(formMascota.peso) : null,
        alergias: formMascota.alergias.trim() || null,
        foto_mascota: formMascota.foto_mascota.trim() || null,
      }

      const res = await fetch(url, {
        method: method,
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(payload),
      })

      if (res.ok) {
        setShowModalForm(false)
        fetchMascotasData()
      } else {
        const errData = await res.json()
        setFormError(errData.message || 'Error al guardar la información de la mascota.')
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
        fetchMascotasData()
      } else {
        alert('No se pudo eliminar la mascota.')
      }
    } catch (err) {
      console.error('Error al eliminar mascota:', err)
      alert('Error de conexión al eliminar la mascota.')
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
    <div className="dash-layout">
      <SidebarAdmin />

      <main className="dash-main">
        <DashboardHeader
          title="Mascotas"
          subtitle="Consulta y gestiona las mascotas registradas y sus historias clínicas"
          usuario={usuario}
        />

        <div className="dash-content">
          {errorGlobal && (
            <div className="dash-alert dash-alert--error" style={{ marginBottom: '1.25rem' }}>
              <i className="fa-solid fa-triangle-exclamation"></i>
              <span>{errorGlobal}</span>
            </div>
          )}

          {/* Tarjetas de Estadísticas */}
          <div className="dash-stats-grid" style={{ marginBottom: '1.5rem' }}>
            <div className="dash-stat-card">
              <div className="dash-stat-card__icon" style={{ backgroundColor: '#ecfdf5', color: '#059669' }}>
                <i className="fa-solid fa-paw"></i>
              </div>
              <div className="dash-stat-card__info">
                <span className="dash-stat-card__label">Total Mascotas</span>
                <span className="dash-stat-card__value">{stats.total}</span>
              </div>
            </div>

            <div className="dash-stat-card">
              <div className="dash-stat-card__icon" style={{ backgroundColor: '#e0f2fe', color: '#0284c7' }}>
                <i className="fa-solid fa-dog"></i>
              </div>
              <div className="dash-stat-card__info">
                <span className="dash-stat-card__label">Caninos Registrados</span>
                <span className="dash-stat-card__value">{stats.caninos}</span>
              </div>
            </div>

            <div className="dash-stat-card">
              <div className="dash-stat-card__icon" style={{ backgroundColor: '#fef3c7', color: '#d97706' }}>
                <i className="fa-solid fa-cat"></i>
              </div>
              <div className="dash-stat-card__info">
                <span className="dash-stat-card__label">Felinos Registrados</span>
                <span className="dash-stat-card__value">{stats.felinos}</span>
              </div>
            </div>

            <div className="dash-stat-card">
              <div className="dash-stat-card__icon" style={{ backgroundColor: '#fce7f3', color: '#ec4899' }}>
                <i className="fa-solid fa-notes-medical"></i>
              </div>
              <div className="dash-stat-card__info">
                <span className="dash-stat-card__label">Con Alergias / Alertas</span>
                <span className="dash-stat-card__value">{stats.con_alergias}</span>
              </div>
            </div>
          </div>

          {/* Barra de Búsqueda y Botón Nuevo */}
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
                  <option value="Canino">Caninos 🐶</option>
                  <option value="Felino">Felinos 🐱</option>
                  <option value="Otros">Otras especies 🐾</option>
                </select>
              </div>

              <button type="button" className="btn-primary-adm" onClick={handleOpenCreateModal}>
                <i className="fa-solid fa-plus"></i>
                <span>Nueva Mascota</span>
              </button>
            </div>
          </div>

          {/* Tabla Principal de Mascotas */}
          <div className="dash-card" style={{ padding: 0, overflow: 'hidden' }}>
            <div className="dash-card__header" style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #f1f5f9' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <i className="fa-solid fa-paw" style={{ color: '#059669', fontSize: '1.1rem' }}></i>
                <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#0f172a', margin: 0 }}>
                  Mascotas
                </h2>
              </div>
              <span className="pet-badge-count">{mascotasFiltradas.length} {mascotasFiltradas.length === 1 ? 'mascota' : 'mascotas'}</span>
            </div>

            {loading ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
                <i className="fa-solid fa-circle-notch fa-spin" style={{ fontSize: '2rem', color: '#059669', marginBottom: '0.75rem' }}></i>
                <p>Cargando pacientes veterinarios...</p>
              </div>
            ) : mascotasFiltradas.length === 0 ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
                <i className="fa-solid fa-paw" style={{ fontSize: '2.5rem', color: '#cbd5e1', marginBottom: '0.75rem' }}></i>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#334155' }}>No se encontraron mascotas</h3>
                <p style={{ fontSize: '0.9rem' }}>Intenta ajustar los criterios de búsqueda o registra una nueva mascota.</p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="pet-admin-table">
                  <thead>
                    <tr>
                      <th>Paciente</th>
                      <th>Especie & Raza</th>
                      <th>Edad & Peso</th>
                      <th>Cliente</th>
                      <th>Citas</th>
                      <th style={{ textAlign: 'right', paddingRight: '1.25rem' }}>
                        <i className="fa-solid fa-ellipsis" style={{ color: '#94a3b8' }}></i>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {mascotasFiltradas.map((m) => (
                      <tr key={m.id_mascota}>
                        <td>
                          <div className="pet-info-cell">
                            <img
                              src={m.foto}
                              alt={m.nombre}
                              className="pet-avatar"
                              onError={(e) => {
                                e.target.onerror = null
                                e.target.src = 'https://res.cloudinary.com/dedroug6v/image/upload/v1/mascotas/default_pet.jpg'
                              }}
                            />
                            <div>
                              <strong className="pet-name">{m.nombre}</strong>
                              <span className="pet-meta-sub">
                                ID: #{m.id_mascota} • {m.sexo}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span className="species-pill">
                              {m.especie === 'Canino' ? '🐶 Canino' : m.especie === 'Felino' ? '🐱 Felino' : '🐾 ' + m.especie}
                            </span>
                            <span style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.2rem' }}>{m.raza}</span>
                          </div>
                        </td>
                        <td>
                          <div style={{ fontSize: '0.88rem', color: '#1e293b' }}>
                            <div><span>{m.edad}</span></div>
                            <div style={{ color: '#64748b', fontSize: '0.8rem' }}>
                              {m.peso ? `${m.peso} kg` : 'Peso N/A'}
                            </div>
                          </div>
                        </td>
                        <td>
                          {m.dueno ? (
                            <div className="owner-cell">
                              <span style={{ fontWeight: 400, color: '#334155' }}>{m.dueno.nombre}</span>
                              <span className="owner-sub">
                                <i className="fa-solid fa-phone" style={{ fontSize: '0.75rem', marginRight: '4px' }}></i>
                                {m.dueno.telefono}
                              </span>
                            </div>
                          ) : (
                            <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>Sin cliente asignado</span>
                          )}
                        </td>
                        <td>
                          <span className="citas-count-badge">
                            <i className="fa-regular fa-calendar-check"></i> {m.total_citas} citas
                          </span>
                        </td>
                        <td>
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
        </div>
      </main>

      {/* MODAL 1: FICHA CLÍNICA INDIVIDUAL */}
      {(selectedFicha || loadingFicha) && (
        <div className="modal-overlay">
          <div className="modal-container modal-container--lg">
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <i className="fa-solid fa-file-medical" style={{ color: '#059669', fontSize: '1.25rem' }}></i>
                <h3 className="modal-title">Ficha Clínica de la Mascota</h3>
              </div>
              <button type="button" className="modal-close" onClick={() => setSelectedFicha(null)}>
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            {loadingFicha ? (
              <div style={{ padding: '4rem', textAlign: 'center', color: '#64748b' }}>
                <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: '2rem', color: '#059669' }}></i>
                <p style={{ marginTop: '1rem' }}>Cargando expediente médico completo...</p>
              </div>
            ) : selectedFicha && (
              <div className="modal-body" style={{ padding: '1.5rem' }}>
                {/* Header de Ficha */}
                <div className="ficha-header-card">
                  <img src={selectedFicha.foto} alt={selectedFicha.nombre} className="ficha-avatar" />
                  <div className="ficha-header-info">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <h2 className="ficha-pet-name">{selectedFicha.nombre}</h2>
                      <span className="species-pill">{selectedFicha.especie}</span>
                    </div>
                    <p className="ficha-pet-details">
                      {selectedFicha.raza} • {selectedFicha.sexo} • <strong>{selectedFicha.edad}</strong> • {selectedFicha.peso ? `${selectedFicha.peso} kg` : 'Peso N/A'}
                    </p>
                    {selectedFicha.dueno && (
                      <div className="ficha-owner-badge">
                        <i className="fa-solid fa-user-circle"></i>
                        <span>Dueño: <strong>{selectedFicha.dueno.nombre}</strong> (Tel: {selectedFicha.dueno.telefono})</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Nav de Pestañas en la Ficha */}
                <div className="ficha-tabs">
                  <button
                    type="button"
                    className={`ficha-tab-btn ${fichaTab === 'resumen' ? 'ficha-tab-btn--active' : ''}`}
                    onClick={() => setFichaTab('resumen')}
                  >
                    <i className="fa-solid fa-circle-info"></i> Resumen & Dueño
                  </button>
                  <button
                    type="button"
                    className={`ficha-tab-btn ${fichaTab === 'citas' ? 'ficha-tab-btn--active' : ''}`}
                    onClick={() => setFichaTab('citas')}
                  >
                    <i className="fa-regular fa-calendar-check"></i> Historial Clínico ({selectedFicha.citas?.length || 0})
                  </button>
                  <button
                    type="button"
                    className={`ficha-tab-btn ${fichaTab === 'vacunas' ? 'ficha-tab-btn--active' : ''}`}
                    onClick={() => setFichaTab('vacunas')}
                  >
                    <i className="fa-solid fa-syringe"></i> Vacunación
                  </button>
                  <button
                    type="button"
                    className={`ficha-tab-btn ${fichaTab === 'alergias' ? 'ficha-tab-btn--active' : ''}`}
                    onClick={() => setFichaTab('alergias')}
                  >
                    <i className="fa-solid fa-triangle-exclamation"></i> Alergias & Alertas
                  </button>
                </div>

                {/* Contenido Pestaña 1: Resumen */}
                {fichaTab === 'resumen' && (
                  <div className="ficha-tab-content">
                    <div className="grid-2-col">
                      <div className="info-box">
                        <h4 className="info-box__title"><i className="fa-solid fa-paw"></i> Datos de la Mascota</h4>
                        <ul className="info-list">
                          <li><span>Nombre:</span> <strong>{selectedFicha.nombre}</strong></li>
                          <li><span>Especie / Raza:</span> <strong>{selectedFicha.especie} / {selectedFicha.raza}</strong></li>
                          <li><span>Sexo:</span> <strong>{selectedFicha.sexo}</strong></li>
                          <li><span>Fecha Nacimiento:</span> <strong>{selectedFicha.fecha_nacimiento || 'No registrada'}</strong></li>
                          <li><span>Edad Actual:</span> <strong>{selectedFicha.edad}</strong></li>
                          <li><span>Peso Corporal:</span> <strong>{selectedFicha.peso ? `${selectedFicha.peso} kg` : 'N/A'}</strong></li>
                        </ul>
                      </div>

                      <div className="info-box">
                        <h4 className="info-box__title"><i className="fa-solid fa-user-shield"></i> Datos del Dueño / Cliente</h4>
                        {selectedFicha.dueno ? (
                          <ul className="info-list">
                            <li><span>Nombre Dueño:</span> <strong>{selectedFicha.dueno.nombre}</strong></li>
                            <li><span>Teléfono Contacto:</span> <strong>{selectedFicha.dueno.telefono}</strong></li>
                            <li><span>Documento Cédula:</span> <strong>{selectedFicha.dueno.cedula || 'Sin cédula'}</strong></li>
                            <li><span>Dirección:</span> <strong>{selectedFicha.dueno.direccion || 'No registrada'}</strong></li>
                            <li>
                              <span>Estado Afiliación EPS:</span> 
                              <strong style={{ color: selectedFicha.dueno.es_afiliado ? '#059669' : '#dc2626' }}>
                                {selectedFicha.dueno.es_afiliado ? 'Afiliado Activo' : 'Particular / No Afiliado'}
                              </strong>
                            </li>
                          </ul>
                        ) : (
                          <p style={{ color: '#94a3b8', fontStyle: 'italic' }}>Sin información de propietario registrada.</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Contenido Pestaña 2: Historial Clínico & Citas */}
                {fichaTab === 'citas' && (
                  <div className="ficha-tab-content">
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
                        <p>Esta mascota aún no registra citas veterinarias asociadas.</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Contenido Pestaña 3: Vacunas */}
                {fichaTab === 'vacunas' && (
                  <div className="ficha-tab-content">
                    <div className="vacunas-grid">
                      {selectedFicha.vacunas && selectedFicha.vacunas.map((vac, idx) => (
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
                      ))}
                    </div>
                  </div>
                )}

                {/* Contenido Pestaña 4: Alergias */}
                {fichaTab === 'alergias' && (
                  <div className="ficha-tab-content">
                    <div className="alergias-box">
                      <div className="alergias-box__header">
                        <i className="fa-solid fa-triangle-exclamation" style={{ color: '#dc2626', fontSize: '1.25rem' }}></i>
                        <h4 style={{ margin: 0, fontWeight: 600, color: '#991b1b' }}>Alertas Médicas & Alergias</h4>
                      </div>
                      <p style={{ margin: '0.75rem 0 0 0', color: '#334155', lineHeight: '1.5', fontSize: '0.95rem' }}>
                        {selectedFicha.alergias}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL 2: CREAR / EDITAR MASCOTA */}
      {showModalForm && (
        <div className="modal-overlay">
          <div className="modal-container">
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <i className="fa-solid fa-paw" style={{ color: '#059669', fontSize: '1.2rem' }}></i>
                <h3 className="modal-title">{isEditing ? 'Editar Datos de Mascota' : 'Registrar Nueva Mascota'}</h3>
              </div>
              <button type="button" className="modal-close" onClick={() => setShowModalForm(false)}>
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="modal-body" style={{ padding: '1.5rem' }}>
              {formError && (
                <div className="dash-alert dash-alert--error" style={{ marginBottom: '1rem' }}>
                  <i className="fa-solid fa-circle-exclamation"></i>
                  <span>{formError}</span>
                </div>
              )}

              <div className="form-group-adm">
                <label>Dueño / Cliente Asociado *</label>
                <select
                  value={formMascota.id_cliente}
                  onChange={(e) => setFormMascota({ ...formMascota, id_cliente: e.target.value })}
                  required
                >
                  <option value="">Selecciona el dueño de la mascota...</option>
                  {clientes.map((c) => (
                    <option key={c.id_cliente} value={c.id_cliente}>
                      {c.nombre} (Tel: {c.telefono})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-row-2">
                <div className="form-group-adm">
                  <label>Nombre de la Mascota *</label>
                  <input
                    type="text"
                    placeholder="Ej. Bruno, Toby, Pelusa"
                    value={formMascota.nombre}
                    onChange={(e) => setFormMascota({ ...formMascota, nombre: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group-adm">
                  <label>Especie *</label>
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

              <div className="form-row-2">
                <div className="form-group-adm">
                  <label>Raza</label>
                  <input
                    type="text"
                    placeholder="Ej. Golden Retriever, Criollo, Siames"
                    value={formMascota.raza}
                    onChange={(e) => setFormMascota({ ...formMascota, raza: e.target.value })}
                  />
                </div>

                <div className="form-group-adm">
                  <label>Sexo</label>
                  <select
                    value={formMascota.sexo}
                    onChange={(e) => setFormMascota({ ...formMascota, sexo: e.target.value })}
                  >
                    <option value="Macho">Macho ♂</option>
                    <option value="Hembra">Hembra ♀</option>
                  </select>
                </div>
              </div>

              <div className="form-row-2">
                <div className="form-group-adm">
                  <label>Fecha de Nacimiento</label>
                  <input
                    type="date"
                    value={formMascota.fecha_nacimiento}
                    onChange={(e) => setFormMascota({ ...formMascota, fecha_nacimiento: e.target.value })}
                  />
                </div>

                <div className="form-group-adm">
                  <label>Peso Aproximado (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="Ej. 12.5"
                    value={formMascota.peso}
                    onChange={(e) => setFormMascota({ ...formMascota, peso: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group-adm">
                <label>Alergias / Condición Médica Especial</label>
                <textarea
                  rows="2"
                  placeholder="Ej. Alérgico a la Penicilina, Sensibilidad alimentaria..."
                  value={formMascota.alergias}
                  onChange={(e) => setFormMascota({ ...formMascota, alergias: e.target.value })}
                ></textarea>
              </div>

              <div className="form-group-adm">
                <label>URL de Foto de Perfil (Opcional)</label>
                <input
                  type="text"
                  placeholder="https://res.cloudinary.com/..."
                  value={formMascota.foto_mascota}
                  onChange={(e) => setFormMascota({ ...formMascota, foto_mascota: e.target.value })}
                />
              </div>

              <div className="modal-footer" style={{ marginTop: '1.5rem' }}>
                <button type="button" className="btn-cancel" onClick={() => setShowModalForm(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn-submit" disabled={submittingForm}>
                  {submittingForm ? (
                    <>
                      <i className="fa-solid fa-spinner fa-spin"></i>
                      <span>Guardando...</span>
                    </>
                  ) : (
                    <span>{isEditing ? 'Guardar Cambios' : 'Registrar Mascota'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: CONFIRMAR ELIMINACIÓN */}
      {deletingMascota && (
        <div className="modal-overlay">
          <div className="modal-container modal-container--sm">
            <div className="modal-header">
              <h3 className="modal-title" style={{ color: '#dc2626' }}>
                <i className="fa-solid fa-triangle-exclamation" style={{ marginRight: '0.5rem' }}></i>
                Eliminar Mascota
              </h3>
              <button type="button" className="modal-close" onClick={() => setDeletingMascota(null)}>
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <div className="modal-body" style={{ padding: '1.5rem', textAlign: 'center' }}>
              <p style={{ fontSize: '1rem', color: '#1e293b', marginBottom: '0.5rem' }}>
                ¿Estás seguro de que deseas eliminar a <strong>{deletingMascota.nombre}</strong>?
              </p>
              <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
                Esta acción removerá a la mascota del catálogo de administración. Sus registros históricos permanecerán archivados de forma segura.
              </p>

              <div className="modal-footer" style={{ justifyContent: 'center', marginTop: '1.5rem' }}>
                <button type="button" className="btn-cancel" onClick={() => setDeletingMascota(null)}>
                  Cancelar
                </button>
                <button
                  type="button"
                  className="btn-submit"
                  style={{ backgroundColor: '#dc2626' }}
                  onClick={handleConfirmDelete}
                  disabled={submittingDelete}
                >
                  {submittingDelete ? 'Eliminando...' : 'Sí, Eliminar Mascota'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
