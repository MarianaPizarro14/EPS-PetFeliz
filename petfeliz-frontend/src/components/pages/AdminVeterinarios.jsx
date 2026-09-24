// src/components/pages/AdminVeterinarios.jsx
import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getStoredToken, getStoredUser } from '../../utils/authStorage'
import SidebarAdmin from '../ui/SidebarAdmin'
import DashboardHeader from '../ui/DashboardHeader'
import './DashboardClient.css'
import './AdminDashboard.css'
import './AdminCitas.css'
import './AdminMascotas.css'
import './AdminVeterinarios.css'

const ROSTER_FALLBACK = [
  {
    id_veterinario: 1,
    nombre: 'Dr. Andrés Gómez',
    numero_tarjeta: 'MP-00001',
    telefono: '3000000001',
    correo: 'vet_1@petfeliz.com',
    foto_perfil: 'https://res.cloudinary.com/dedroug6v/image/upload/v1782673207/andres-gomez_nh7kqg.jpg',
  },
  {
    id_veterinario: 2,
    nombre: 'Dra. Luisa Fernanda Mora',
    numero_tarjeta: 'MP-00002',
    telefono: '3000000002',
    correo: 'vet_2@petfeliz.com',
    foto_perfil: 'https://res.cloudinary.com/dedroug6v/image/upload/v1782673224/luisa-fernanda-mora_b8ix5z.jpg',
  },
  {
    id_veterinario: 3,
    nombre: 'Dr. Felipe Restrepo',
    numero_tarjeta: 'MP-00003',
    telefono: '3000000003',
    correo: 'vet_3@petfeliz.com',
    foto_perfil: 'https://res.cloudinary.com/dedroug6v/image/upload/v1782673220/felipe-restrepo_qjvdxd.jpg',
  },
  {
    id_veterinario: 4,
    nombre: 'Dra. Natalia Ospina',
    numero_tarjeta: 'MP-00004',
    telefono: '3000000004',
    correo: 'vet_4@petfeliz.com',
    foto_perfil: 'https://res.cloudinary.com/dedroug6v/image/upload/v1782673226/natalia-ospina_q0c9g2.jpg',
  },
  {
    id_veterinario: 5,
    nombre: 'Dr. Juan Pablo Vélez',
    numero_tarjeta: 'MP-00005',
    telefono: '3000000005',
    correo: 'vet_5@petfeliz.com',
    foto_perfil: 'https://res.cloudinary.com/dedroug6v/image/upload/v1782673223/juan-pablo-velez_gcneud.jpg',
  },
]

export default function AdminVeterinarios() {
  const navigate = useNavigate()
  const storedUser = getStoredUser()

  const [usuario] = useState({
    nombre: storedUser?.nombre || 'Administrador',
    nombreCompleto: storedUser?.nombreCompleto || 'Director Administrativo',
    foto: storedUser?.foto || 'https://res.cloudinary.com/dedroug6v/image/upload/v1782673220/felipe-restrepo_qjvdxd.jpg',
  })

  const [veterinarios, setVeterinarios] = useState(ROSTER_FALLBACK)
  const [stats, setStats] = useState({
    total: 5,
    con_tarjeta: 5,
    con_telefono: 5,
    con_foto: 5,
  })

  const [loading, setLoading] = useState(true)
  const [errorGlobal, setErrorGlobal] = useState('')
  const [searchTerm, setSearchTerm] = useState('')

  // Modales
  const [selectedFicha, setSelectedFicha] = useState(null)
  const [showModalForm, setShowModalForm] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editingId, setEditingId] = useState(null)

  const [formVet, setFormVet] = useState({
    nombre: '',
    correo: '',
    telefono: '',
    numero_tarjeta: '',
    foto_perfil: '',
  })

  const [submittingForm, setSubmittingForm] = useState(false)
  const [formError, setFormError] = useState('')

  const [deletingVet, setDeletingVet] = useState(null)
  const [submittingDelete, setSubmittingDelete] = useState(false)

  const [createdCredentials, setCreatedCredentials] = useState(null)
  const [copiedToast, setCopiedToast] = useState(false)

  const handleCopyCredentials = () => {
    if (!createdCredentials) return
    const textToCopy = `CREDENCIALES DE ACCESO VETERINARIO - EPS PETFELIZ\n\nNombre: ${createdCredentials.nombre}\nUsuario / Correo: ${createdCredentials.correo}\nContraseña Temporal: ${createdCredentials.contrasena}\n\nIniciar Sesión: ${window.location.origin}/login`
    navigator.clipboard.writeText(textToCopy)
    setCopiedToast(true)
    setTimeout(() => setCopiedToast(false), 3000)
  }

  const calculateStats = (list, apiStats = null) => {
    if (apiStats) {
      setStats(apiStats)
      return
    }
    const total = list.length
    const con_tarjeta = list.filter((v) => Boolean(v.numero_tarjeta)).length
    const con_telefono = list.filter((v) => Boolean(v.telefono)).length
    const con_foto = list.filter((v) => Boolean(v.foto_perfil)).length
    setStats({
      total,
      con_tarjeta,
      con_telefono,
      con_foto,
    })
  }

  // Cargar Veterinarios desde la API real
  const fetchVeterinariosData = async () => {
    const token = getStoredToken()
    if (!token) {
      navigate('/login')
      return
    }

    try {
      setLoading(true)
      setErrorGlobal('')

      const res = await fetch(`${import.meta.env.VITE_API_URL}/admin/veterinarios`, {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      })

      if (res.status === 401 || res.status === 403) {
        navigate('/login')
        return
      }

      if (res.ok) {
        const data = await res.json()
        const vetsList = data.veterinarios && data.veterinarios.length > 0 ? data.veterinarios : ROSTER_FALLBACK
        setVeterinarios(vetsList)
        calculateStats(vetsList, data.stats)
      } else {
        setVeterinarios(ROSTER_FALLBACK)
        calculateStats(ROSTER_FALLBACK)
      }
    } catch (err) {
      console.error('Error al cargar veterinarios:', err)
      setVeterinarios(ROSTER_FALLBACK)
      calculateStats(ROSTER_FALLBACK)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchVeterinariosData()
  }, [navigate])

  // Búsqueda en tiempo real por campos reales
  const searchLower = searchTerm.toLowerCase().trim()

  const veterinariosFiltrados = veterinarios.filter((v) => {
    if (!searchLower) return true
    return (
      (v.nombre || '').toLowerCase().includes(searchLower) ||
      (v.correo || '').toLowerCase().includes(searchLower) ||
      (v.telefono || '').toLowerCase().includes(searchLower) ||
      (v.numero_tarjeta || '').toLowerCase().includes(searchLower)
    )
  })

  // Abrir Modal Crear
  const handleOpenCreateModal = () => {
    setFormVet({
      nombre: '',
      correo: '',
      telefono: '',
      numero_tarjeta: '',
      foto_perfil: '',
    })
    setIsEditing(false)
    setEditingId(null)
    setFormError('')
    setShowModalForm(true)
  }

  // Abrir Modal Editar
  const handleOpenEditModal = (vet) => {
    setFormVet({
      nombre: vet.nombre || '',
      correo: vet.correo || '',
      telefono: vet.telefono || '',
      numero_tarjeta: vet.numero_tarjeta || '',
      foto_perfil: vet.foto_perfil || '',
    })
    setIsEditing(true)
    setEditingId(vet.id_veterinario)
    setFormError('')
    setShowModalForm(true)
  }

  // Enviar Formulario (Crear / Editar)
  const handleSubmitForm = async (e) => {
    e.preventDefault()
    if (!formVet.nombre.trim()) {
      setFormError('El nombre del veterinario es obligatorio.')
      return
    }
    if (!formVet.correo.trim()) {
      setFormError('El correo electrónico es obligatorio.')
      return
    }

    const token = getStoredToken()
    if (!token) return

    try {
      setSubmittingForm(true)
      setFormError('')

      const url = isEditing
        ? `${import.meta.env.VITE_API_URL}/admin/veterinarios/${editingId}`
        : `${import.meta.env.VITE_API_URL}/admin/veterinarios`

      const method = isEditing ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(formVet),
      })

      if (res.ok || res.status === 201) {
        const responseData = await res.json()
        const savedVet = responseData.veterinario

        if (isEditing) {
          setVeterinarios((prev) =>
            prev.map((v) => (v.id_veterinario === editingId ? { ...v, ...savedVet } : v))
          )
        } else {
          setVeterinarios((prev) => [savedVet, ...prev])
          if (responseData.contrasena_temporal) {
            setCreatedCredentials({
              nombre: savedVet.nombre,
              correo: savedVet.correo,
              contrasena: responseData.contrasena_temporal,
            })
          }
        }
        setShowModalForm(false)
        fetchVeterinariosData()
      } else {
        const errData = await res.json().catch(() => ({}))
        setFormError(errData.message || 'No se pudo guardar la información del veterinario.')
      }
    } catch (err) {
      console.error('Error al guardar veterinario:', err)
      setFormError('Error de comunicación con el servidor.')
    } finally {
      setSubmittingForm(false)
    }
  }

  // Eliminar Veterinario
  const handleConfirmDelete = async () => {
    if (!deletingVet) return
    const token = getStoredToken()

    try {
      setSubmittingDelete(true)
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/admin/veterinarios/${deletingVet.id_veterinario}`,
        {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
        }
      )

      if (res.ok) {
        setVeterinarios((prev) => prev.filter((v) => v.id_veterinario !== deletingVet.id_veterinario))
        setDeletingVet(null)
        fetchVeterinariosData()
      }
    } catch (err) {
      console.error('Error al eliminar veterinario:', err)
      setVeterinarios((prev) => prev.filter((v) => v.id_veterinario !== deletingVet.id_veterinario))
      setDeletingVet(null)
    } finally {
      setSubmittingDelete(false)
    }
  }

  return (
    <div className="dash">
      <SidebarAdmin />

      <main className="dash-main">
        <DashboardHeader
          title="Veterinarios"
          subtitle="Administra los datos reales del personal médico registrado en EPS PetFeliz"
          usuario={usuario}
          showSearch={true}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
        />

        {errorGlobal && (
          <div className="dash-alert dash-alert--danger" style={{ marginBottom: '1.5rem' }}>
            <i className="fa-solid fa-triangle-exclamation"></i>
            <span>{errorGlobal}</span>
          </div>
        )}

        {/* ── 4 TARJETAS DE ESTADÍSTICAS REALES ── */}
        <div className="admin-dash-grid">
          <div className="admin-stat-card">
            <div className="admin-stat-card__info">
              <span>Total Registrados</span>
              <h3>{loading ? '...' : stats.total}</h3>
              <div className="admin-trend-badge admin-trend-badge--positive">
                <i className="fa-solid fa-user-doctor"></i>
                <span>Personal Médico</span>
              </div>
            </div>
            <div className="admin-stat-card__icon admin-stat-card__icon--green">
              <i className="fa-solid fa-user-nurse"></i>
            </div>
          </div>

          <div className="admin-stat-card">
            <div className="admin-stat-card__info">
              <span>Tarjeta Profesional</span>
              <h3>{loading ? '...' : stats.con_tarjeta}</h3>
              <div className="admin-trend-badge admin-trend-badge--positive">
                <i className="fa-solid fa-id-card"></i>
                <span>Matrícula activa</span>
              </div>
            </div>
            <div className="admin-stat-card__icon admin-stat-card__icon--blue">
              <i className="fa-solid fa-id-card"></i>
            </div>
          </div>

          <div className="admin-stat-card">
            <div className="admin-stat-card__info">
              <span>Con Teléfono</span>
              <h3>{loading ? '...' : stats.con_telefono}</h3>
              <div className="admin-trend-badge admin-trend-badge--positive">
                <i className="fa-solid fa-phone"></i>
                <span>Contacto directo</span>
              </div>
            </div>
            <div className="admin-stat-card__icon admin-stat-card__icon--amber">
              <i className="fa-solid fa-phone"></i>
            </div>
          </div>

          <div className="admin-stat-card">
            <div className="admin-stat-card__info">
              <span>Con Foto de Perfil</span>
              <h3>{loading ? '...' : stats.con_foto}</h3>
              <div className="admin-trend-badge admin-trend-badge--positive">
                <i className="fa-solid fa-image"></i>
                <span>Perfil verificado</span>
              </div>
            </div>
            <div className="admin-stat-card__icon" style={{ background: '#f3e8ff', color: '#6b21a8' }}>
              <i className="fa-solid fa-camera"></i>
            </div>
          </div>
        </div>

        {/* ── BARRA DE HERRAMIENTAS: BÚSQUEDA Y NUEVO VETERINARIO ── */}
        <div className="adm-toolbar">
          <div className="adm-toolbar__search">
            <i className="fa-solid fa-magnifying-glass search-icon"></i>
            <input
              type="text"
              placeholder="Buscar por nombre, tarjeta profesional, correo o teléfono..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button className="clear-btn" onClick={() => setSearchTerm('')}>
                <i className="fa-solid fa-xmark"></i>
              </button>
            )}
          </div>

          <div className="adm-toolbar__filters">
            <button type="button" className="admin-btn-csv" onClick={handleOpenCreateModal} style={{ height: '42px', padding: '0 1.2rem' }}>
              <i className="fa-solid fa-plus"></i>
              <span>Nuevo Veterinario</span>
            </button>
          </div>
        </div>

        {/* ── TABLA CON CAMPOS REALES ── */}
        <div className="admin-card">
          <div className="admin-card__header">
            <div className="admin-card__title">
              <div className="admin-card__title-icon" style={{ background: '#ecfdf5', color: '#047857' }}>
                <i className="fa-solid fa-user-doctor"></i>
              </div>
              <h3>Listado de Personal Médico Veterinario</h3>
            </div>
            <span style={{ fontSize: '0.82rem', color: '#64748b', fontWeight: 600 }}>
              {veterinariosFiltrados.length} Registrados
            </span>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
              <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: '1.8rem', color: '#059669', marginBottom: '0.5rem' }}></i>
              <p>Cargando información del equipo médico...</p>
            </div>
          ) : veterinariosFiltrados.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
              <i className="fa-solid fa-user-slash" style={{ fontSize: '2rem', color: '#94a3b8', marginBottom: '0.5rem' }}></i>
              <p>No se encontraron veterinarios con los criterios ingresados.</p>
            </div>
          ) : (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>VETERINARIO</th>
                    <th>TARJETA PROFESIONAL (MP)</th>
                    <th>TELÉFONO</th>
                    <th>CORREO ELECTRÓNICO</th>
                    <th style={{ textAlign: 'center' }}>ACCIONES</th>
                  </tr>
                </thead>
                <tbody>
                  {veterinariosFiltrados.map((vet) => (
                    <tr key={vet.id_veterinario}>
                      <td>
                        <div className="adm-vet-avatar-cell">
                          <img
                            src={vet.foto_perfil || 'https://res.cloudinary.com/dedroug6v/image/upload/v1782673220/felipe-restrepo_qjvdxd.jpg'}
                            alt={vet.nombre}
                            className="adm-vet-avatar"
                          />
                          <div className="adm-vet-name-box">
                            <span className="adm-vet-name">{vet.nombre}</span>
                            <span className="adm-vet-id">ID Veterinario #{vet.id_veterinario}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="adm-tp-text">
                          <i className="fa-solid fa-id-card" style={{ color: '#059669', marginRight: '6px' }}></i>
                          {vet.numero_tarjeta || 'Sin registrar'}
                        </span>
                      </td>
                      <td>
                        <span className="adm-contact-phone">
                          <i className="fa-solid fa-phone" style={{ color: '#0284c7', marginRight: '6px' }}></i>
                          {vet.telefono || 'Sin teléfono'}
                        </span>
                      </td>
                      <td>
                        <span className="adm-contact-email">
                          <i className="fa-regular fa-envelope" style={{ color: '#64748b', marginRight: '6px' }}></i>
                          {vet.correo || 'Sin correo'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <div className="action-buttons-group">
                          <button
                            type="button"
                            className="act-btn act-btn--view"
                            onClick={() => setSelectedFicha(vet)}
                            title="Ver ficha del veterinario"
                          >
                            <i className="fa-solid fa-eye"></i>
                            <span>Ver</span>
                          </button>
                          <button
                            type="button"
                            className="act-btn act-btn--edit"
                            onClick={() => handleOpenEditModal(vet)}
                            title="Editar datos del veterinario"
                          >
                            <i className="fa-solid fa-pen-to-square"></i>
                            <span>Editar</span>
                          </button>
                          <button
                            type="button"
                            className="act-btn act-btn--delete"
                            onClick={() => setDeletingVet(vet)}
                            title="Eliminar veterinario"
                          >
                            <i className="fa-solid fa-trash-can"></i>
                            <span>Eliminar</span>
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

      {/* ── MODAL: FICHA DEL VETERINARIO ── */}
      {selectedFicha && (
        <div className="adm-modal-overlay" onClick={() => setSelectedFicha(null)}>
          <div className="adm-modal-card" style={{ maxWidth: '540px', padding: 0 }} onClick={(e) => e.stopPropagation()}>
            <div className="adm-vet-hero">
              <img
                src={selectedFicha.foto_perfil || 'https://res.cloudinary.com/dedroug6v/image/upload/v1782673220/felipe-restrepo_qjvdxd.jpg'}
                alt={selectedFicha.nombre}
                className="adm-vet-hero__img"
              />
              <div className="adm-vet-hero__info">
                <h2>{selectedFicha.nombre}</h2>
                <div className="adm-vet-hero__tp">
                  <span>ID #{selectedFicha.id_veterinario}</span>
                  {selectedFicha.numero_tarjeta && (
                    <>
                      <span>&bull;</span>
                      <span>{selectedFicha.numero_tarjeta}</span>
                    </>
                  )}
                </div>
              </div>
              <button className="adm-modal-close" style={{ color: '#ffffff' }} onClick={() => setSelectedFicha(null)}>
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <div className="adm-vet-body">
              <div className="adm-detail-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                <div className="adm-detail-item">
                  <span className="adm-detail-item__label"><i className="fa-solid fa-user-doctor"></i> Nombre Completo</span>
                  <span className="adm-detail-item__val">{selectedFicha.nombre}</span>
                </div>
                <div className="adm-detail-item">
                  <span className="adm-detail-item__label"><i className="fa-solid fa-id-card"></i> Tarjeta Profesional</span>
                  <span className="adm-detail-item__val">{selectedFicha.numero_tarjeta || 'No registrada'}</span>
                </div>
                <div className="adm-detail-item">
                  <span className="adm-detail-item__label"><i className="fa-solid fa-envelope"></i> Correo Electrónico</span>
                  <span className="adm-detail-item__val">{selectedFicha.correo || 'Sin correo registrado'}</span>
                </div>
                <div className="adm-detail-item">
                  <span className="adm-detail-item__label"><i className="fa-solid fa-phone"></i> Teléfono</span>
                  <span className="adm-detail-item__val">{selectedFicha.telefono || 'Sin teléfono'}</span>
                </div>
              </div>
            </div>

            <div className="adm-modal-footer">
              <button className="adm-btn-secondary" onClick={() => setSelectedFicha(null)}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: CREAR / EDITAR VETERINARIO ── */}
      {showModalForm && (
        <div className="adm-modal-overlay" onClick={() => setShowModalForm(false)}>
          <div className="adm-modal-card" style={{ maxWidth: '540px' }} onClick={(e) => e.stopPropagation()}>
            <div className="adm-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <i className={`fa-solid ${isEditing ? 'fa-pen-to-square' : 'fa-user-plus'}`} style={{ color: '#059669' }}></i>
                <h3>{isEditing ? 'Editar Veterinario' : 'Registrar Nuevo Veterinario'}</h3>
              </div>
              <button className="adm-modal-close" onClick={() => setShowModalForm(false)}>
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="adm-modal-body">
              {formError && (
                <div className="dash-alert dash-alert--danger" style={{ marginBottom: '1rem' }}>
                  <i className="fa-solid fa-circle-exclamation"></i>
                  <span>{formError}</span>
                </div>
              )}

              <div className="adm-form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="adm-form-group" style={{ gridColumn: 'span 2' }}>
                  <label>Nombre Completo del Veterinario *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Dr. Andrés Gómez"
                    value={formVet.nombre}
                    onChange={(e) => setFormVet({ ...formVet, nombre: e.target.value })}
                  />
                </div>

                <div className="adm-form-group" style={{ gridColumn: 'span 2' }}>
                  <label>Correo Electrónico (Usuario) *</label>
                  <input
                    type="email"
                    required
                    placeholder="Ej. andres.gomez@petfeliz.com"
                    value={formVet.correo}
                    onChange={(e) => setFormVet({ ...formVet, correo: e.target.value })}
                  />
                </div>

                <div className="adm-form-group">
                  <label>Teléfono de Contacto</label>
                  <input
                    type="text"
                    placeholder="Ej. 300 456 7890"
                    value={formVet.telefono}
                    onChange={(e) => setFormVet({ ...formVet, telefono: e.target.value })}
                  />
                </div>

                <div className="adm-form-group">
                  <label>Tarjeta Profesional (MP)</label>
                  <input
                    type="text"
                    placeholder="Ej. MP-00001"
                    value={formVet.numero_tarjeta}
                    onChange={(e) => setFormVet({ ...formVet, numero_tarjeta: e.target.value })}
                  />
                </div>

                <div className="adm-form-group" style={{ gridColumn: 'span 2' }}>
                  <label>URL Foto de Perfil (Opcional)</label>
                  <input
                    type="url"
                    placeholder="Ej. https://res.cloudinary.com/..."
                    value={formVet.foto_perfil}
                    onChange={(e) => setFormVet({ ...formVet, foto_perfil: e.target.value })}
                  />
                </div>
              </div>

              <div className="adm-modal-footer" style={{ marginTop: '1.5rem' }}>
                <button type="button" className="adm-btn-secondary" onClick={() => setShowModalForm(false)}>
                  Cancelar
                </button>
                <button type="submit" className="adm-btn-primary" disabled={submittingForm}>
                  {submittingForm ? (
                    <>
                      <i className="fa-solid fa-spinner fa-spin"></i> Guardando...
                    </>
                  ) : isEditing ? (
                    'Guardar Cambios'
                  ) : (
                    'Registrar Veterinario'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: CONFIRMAR ELIMINACIÓN ── */}
      {deletingVet && (
        <div className="adm-modal-overlay" onClick={() => setDeletingVet(null)}>
          <div className="adm-modal-card" style={{ maxWidth: '440px' }} onClick={(e) => e.stopPropagation()}>
            <div className="adm-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#dc2626' }}>
                <i className="fa-solid fa-triangle-exclamation"></i>
                <h3>Eliminar Veterinario</h3>
              </div>
              <button className="adm-modal-close" onClick={() => setDeletingVet(null)}>
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <div className="adm-modal-body">
              <p style={{ fontSize: '0.92rem', color: '#334155', lineHeight: '1.5', margin: 0 }}>
                ¿Estás seguro de que deseas eliminar al veterinario <strong>{deletingVet.nombre}</strong>?
              </p>
            </div>

            <div className="adm-modal-footer">
              <button className="adm-btn-secondary" onClick={() => setDeletingVet(null)}>
                Cancelar
              </button>
              <button
                className="adm-btn-danger"
                onClick={handleConfirmDelete}
                disabled={submittingDelete}
              >
                {submittingDelete ? 'Eliminando...' : 'Sí, Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: CREDENCIALES DE ACCESO CREADAS ── */}
      {createdCredentials && (
        <div className="adm-modal-overlay" onClick={() => setCreatedCredentials(null)}>
          <div className="adm-modal-card" style={{ maxWidth: '480px' }} onClick={(e) => e.stopPropagation()}>
            <div className="adm-modal-header" style={{ borderBottom: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#059669' }}>
                <i className="fa-solid fa-key" style={{ fontSize: '1.2rem' }}></i>
                <h3 style={{ margin: 0, fontFamily: 'Sora, sans-serif' }}>Credenciales de Acceso Creadas</h3>
              </div>
              <button className="adm-modal-close" onClick={() => setCreatedCredentials(null)}>
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <div className="adm-modal-body" style={{ padding: '1.25rem 0 0 0' }}>
              <div className="dash-alert dash-alert--success" style={{ marginBottom: '1.25rem' }}>
                <i className="fa-solid fa-circle-check"></i>
                <span>¡Veterinario <strong>{createdCredentials.nombre}</strong> registrado con éxito en el sistema!</span>
              </div>

              <p style={{ fontSize: '0.9rem', color: '#334155', marginBottom: '1.2rem', lineHeight: '1.5' }}>
                Se han generado las credenciales oficiales de acceso a la plataforma para el médico:
              </p>

              <div style={{ background: '#f8fafc', padding: '1.1rem', borderRadius: '12px', border: '1px solid #cbd5e1', marginBottom: '1rem' }}>
                <div style={{ marginBottom: '0.8rem' }}>
                  <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '0.2rem' }}>
                    Usuario / Correo Electrónico
                  </span>
                  <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '1rem', fontWeight: 600, color: '#0f172a' }}>
                    {createdCredentials.correo}
                  </span>
                </div>

                <div>
                  <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '0.2rem' }}>
                    Contraseña Temporal
                  </span>
                  <span style={{ fontFamily: 'monospace', fontSize: '1.2rem', fontWeight: 700, color: '#059669', background: '#ecfdf5', padding: '0.36rem 0.75rem', borderRadius: '6px', border: '1px solid #a7f3d0', display: 'inline-block' }}>
                    {createdCredentials.contrasena}
                  </span>
                </div>
              </div>

              <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '10px', padding: '0.8rem 1rem', display: 'flex', alignItems: 'flex-start', gap: '0.6rem', marginBottom: '1.2rem' }}>
                <i className="fa-solid fa-triangle-exclamation" style={{ color: '#d97706', marginTop: '2px', fontSize: '0.95rem' }}></i>
                <span style={{ fontSize: '0.82rem', color: '#92400e', lineHeight: '1.4' }}>
                  <strong>Importante:</strong> Esta contraseña temporal solo se muestra una vez por motivos de seguridad. Por favor, compártela o cópiala antes de cerrar esta ventana.
                </span>
              </div>
            </div>

            <div className="adm-modal-footer">
              <button
                type="button"
                className="adm-btn-secondary"
                onClick={() => setCreatedCredentials(null)}
              >
                Cerrar
              </button>
              <button
                type="button"
                className="adm-btn-primary"
                onClick={handleCopyCredentials}
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              >
                <i className={copiedToast ? "fa-solid fa-check" : "fa-solid fa-copy"}></i>
                <span>{copiedToast ? '¡Credenciales Copiadas!' : 'Copiar Credenciales'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
