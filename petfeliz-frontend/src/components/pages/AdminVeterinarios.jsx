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

export default function AdminVeterinarios() {
  const navigate = useNavigate()
  const storedUser = getStoredUser()

  const [usuario] = useState({
    nombre: storedUser?.nombre || 'Administrador',
    nombreCompleto: storedUser?.nombreCompleto || 'Director Administrativo',
    foto: storedUser?.foto || 'https://res.cloudinary.com/dedroug6v/image/upload/v1782673220/felipe-restrepo_qjvdxd.jpg',
  })

  const [veterinarios, setVeterinarios] = useState([])
  const [stats, setStats] = useState({
    total: 0,
    urgencias: 0,
    cirujanos: 0,
    generales: 0,
    sedes_activas: 3,
  })

  const [loading, setLoading] = useState(true)
  const [errorGlobal, setErrorGlobal] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [especialidadFilter, setEspecialidadFilter] = useState('todas')
  const [sedeFilter, setSedeFilter] = useState('todas')

  // Modales
  const [selectedFicha, setSelectedFicha] = useState(null)
  const [fichaTab, setFichaTab] = useState('info') // 'info' | 'citas' | 'horario'

  const [showModalForm, setShowModalForm] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editingId, setEditingId] = useState(null)

  const [formVet, setFormVet] = useState({
    nombre: '',
    cedula: '',
    numero_tarjeta: '',
    telefono: '',
    correo: '',
    especialidad: 'Medicina General',
    ciudad: 'Medellín',
    sede: 'Sede Laureles',
    direccion: '',
    horario: 'Lun–Vie 8:00 AM – 4:00 PM',
    foto_perfil: '',
  })

  const [submittingForm, setSubmittingForm] = useState(false)
  const [formError, setFormError] = useState('')

  const [deletingVet, setDeletingVet] = useState(null)
  const [submittingDelete, setSubmittingDelete] = useState(false)

  // Cargar Veterinarios de Administración
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
        setVeterinarios(data.veterinarios || [])
        if (data.stats) {
          setStats(data.stats)
        }
      } else {
        setErrorGlobal('No se pudo obtener el listado de veterinarios.')
      }
    } catch (err) {
      console.error('Error al cargar veterinarios de administración:', err)
      setErrorGlobal('Error de conexión con el servidor al cargar la lista de veterinarios.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchVeterinariosData()
  }, [navigate])

  // Filtrado de Veterinarios
  const searchLower = searchTerm.toLowerCase().trim()

  const veterinariosFiltrados = veterinarios.filter((v) => {
    // 1. Filtro por especialidad
    if (especialidadFilter !== 'todas') {
      const espLower = (v.especialidad || '').toLowerCase()
      if (!espLower.includes(especialidadFilter.toLowerCase())) return false
    }

    // 2. Filtro por sede
    if (sedeFilter !== 'todas') {
      const sedeLower = (v.sede || '').toLowerCase()
      if (!sedeLower.includes(sedeFilter.toLowerCase())) return false
    }

    // 3. Filtro por término de búsqueda
    if (!searchLower) return true
    return (
      (v.nombre || '').toLowerCase().includes(searchLower) ||
      (v.cedula || '').toLowerCase().includes(searchLower) ||
      (v.numero_tarjeta || '').toLowerCase().includes(searchLower) ||
      (v.correo || '').toLowerCase().includes(searchLower) ||
      (v.telefono || '').toLowerCase().includes(searchLower) ||
      (v.ciudad || '').toLowerCase().includes(searchLower) ||
      (v.direccion || '').toLowerCase().includes(searchLower) ||
      (v.especialidad || '').toLowerCase().includes(searchLower)
    )
  })

  // Obtener especialidad badge CSS class
  const getBadgeClass = (especialidad = '') => {
    const esp = especialidad.toLowerCase()
    if (esp.includes('urgencia')) return 'adm-spec-badge--urgencias'
    if (esp.includes('cirug')) return 'adm-spec-badge--cirugia'
    if (esp.includes('dermatolog')) return 'adm-spec-badge--dermatologia'
    if (esp.includes('vacunac')) return 'adm-spec-badge--vacunacion'
    if (esp.includes('desparasit')) return 'adm-spec-badge--desparasitacion'
    if (esp.includes('odontolog')) return 'adm-spec-badge--odontologia'
    if (esp.includes('laboratorio')) return 'adm-spec-badge--laboratorio'
    if (esp.includes('director')) return 'adm-spec-badge--director'
    return 'adm-spec-badge--general'
  }

  // Abrir Modal Crear
  const handleOpenCreateModal = () => {
    setFormVet({
      nombre: '',
      cedula: '',
      numero_tarjeta: '',
      telefono: '',
      correo: '',
      especialidad: 'Medicina General',
      ciudad: 'Medellín',
      sede: 'Sede Laureles',
      direccion: '',
      horario: 'Lun–Vie 8:00 AM – 4:00 PM',
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
      cedula: vet.cedula || '',
      numero_tarjeta: vet.numero_tarjeta || '',
      telefono: vet.telefono || '',
      correo: vet.correo || '',
      especialidad: vet.especialidad || 'Medicina General',
      ciudad: vet.ciudad || 'Medellín',
      sede: vet.sede || 'Sede Laureles',
      direccion: vet.direccion || '',
      horario: vet.horario || 'Lun–Vie 8:00 AM – 4:00 PM',
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

      if (res.ok) {
        if (isEditing) {
          setVeterinarios((prev) =>
            prev.map((v) => (v.id_veterinario === editingId ? { ...v, ...formVet } : v))
          )
        } else {
          const newVetObj = {
            id_veterinario: Date.now(),
            ...formVet,
            estado: 'Activo',
            citas_atendidas: 0,
            foto_perfil: formVet.foto_perfil || 'https://res.cloudinary.com/dedroug6v/image/upload/v1782673220/felipe-restrepo_qjvdxd.jpg',
          }
          setVeterinarios((prev) => [newVetObj, ...prev])
        }
        setShowModalForm(false)
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

      if (res.ok || res.status === 200 || res.status === 204) {
        setVeterinarios((prev) => prev.filter((v) => v.id_veterinario !== deletingVet.id_veterinario))
        setDeletingVet(null)
      }
    } catch (err) {
      console.error('Error al eliminar veterinario:', err)
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
          subtitle="Consulta y administra el personal médico de EPS PetFeliz"
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

        {/* ── 4 TARJETAS DE ESTADÍSTICAS DEL PERSONAL MÉDICO ── */}
        <div className="admin-dash-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
          <div className="admin-stat-card">
            <div className="admin-stat-card__info">
              <span>Total Veterinarios</span>
              <h3>{loading ? '...' : stats.total}</h3>
              <div className="admin-trend-badge admin-trend-badge--positive">
                <i className="fa-solid fa-user-doctor"></i>
                <span>Roster Oficial</span>
              </div>
            </div>
            <div className="admin-stat-card__icon admin-stat-card__icon--green">
              <i className="fa-solid fa-user-nurse"></i>
            </div>
          </div>

          <div className="admin-stat-card">
            <div className="admin-stat-card__info">
              <span>Medicina General</span>
              <h3>{loading ? '...' : stats.generales}</h3>
              <div className="admin-trend-badge admin-trend-badge--positive">
                <i className="fa-solid fa-stethoscope"></i>
                <span>Consulta primaria</span>
              </div>
            </div>
            <div className="admin-stat-card__icon admin-stat-card__icon--blue">
              <i className="fa-solid fa-stethoscope"></i>
            </div>
          </div>

          <div className="admin-stat-card">
            <div className="admin-stat-card__info">
              <span>Urgencias 24/7</span>
              <h3>{loading ? '...' : stats.urgencias}</h3>
              <div className="admin-trend-badge admin-trend-badge--positive">
                <i className="fa-solid fa-kit-medical"></i>
                <span>Turnos activos</span>
              </div>
            </div>
            <div className="admin-stat-card__icon admin-stat-card__icon--amber">
              <i className="fa-solid fa-truck-medical"></i>
            </div>
          </div>

          <div className="admin-stat-card">
            <div className="admin-stat-card__info">
              <span>Cirujanos Especialistas</span>
              <h3>{loading ? '...' : stats.cirujanos}</h3>
              <div className="admin-trend-badge admin-trend-badge--positive">
                <i className="fa-solid fa-building-user"></i>
                <span>Quirófanos activos</span>
              </div>
            </div>
            <div className="admin-stat-card__icon admin-stat-card__icon--green" style={{ background: '#f3e8ff', color: '#6b21a8' }}>
              <i className="fa-solid fa-scalpel"></i>
            </div>
          </div>
        </div>

        {/* ── BARRA DE HERRAMIENTAS: BÚSQUEDA, FILTROS & NUEVO VETERINARIO ── */}
        <div className="adm-toolbar">
          <div className="adm-toolbar__search">
            <i className="fa-solid fa-magnifying-glass search-icon"></i>
            <input
              type="text"
              placeholder="Buscar por nombre, cédula, correo, teléfono, especialidad o sede..."
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
            <div className="adm-filter-group">
              <label>Especialidad:</label>
              <select
                value={especialidadFilter}
                onChange={(e) => setEspecialidadFilter(e.target.value)}
              >
                <option value="todas">Todas las especialidades</option>
                <option value="Medicina General">Medicina General</option>
                <option value="Dermatología">Dermatología</option>
                <option value="Urgencias">Urgencias</option>
                <option value="Cirugía">Cirugía</option>
                <option value="Desparasitación">Desparasitación</option>
                <option value="Vacunación">Vacunación</option>
                <option value="Odontología">Odontología</option>
                <option value="Laboratorio Clínico">Laboratorio Clínico</option>
                <option value="Médico Director">Médico Director</option>
              </select>
            </div>

            <div className="adm-filter-group">
              <label>Sede:</label>
              <select
                value={sedeFilter}
                onChange={(e) => setSedeFilter(e.target.value)}
              >
                <option value="todas">Todas las sedes</option>
                <option value="Laureles">Sede Laureles</option>
                <option value="Envigado">Sede Envigado</option>
                <option value="Bello">Sede Bello</option>
              </select>
            </div>

            <button type="button" className="admin-btn-csv" onClick={handleOpenCreateModal} style={{ height: '42px', padding: '0 1.2rem' }}>
              <i className="fa-solid fa-plus"></i>
              <span>Nuevo Veterinario</span>
            </button>
          </div>
        </div>

        {/* ── TABLA GENERAL DE VETERINARIOS ── */}
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
              <p>No se encontraron veterinarios con los criterios seleccionados.</p>
            </div>
          ) : (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>VETERINARIO</th>
                    <th>ESPECIALIDAD</th>
                    <th>SEDE & CIUDAD</th>
                    <th>CONTACTO</th>
                    <th>DIRECCIÓN</th>
                    <th>ESTADO</th>
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
                            <span className="adm-vet-id">C.C. {vet.cedula} &bull; {vet.numero_tarjeta}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`adm-spec-badge ${getBadgeClass(vet.especialidad)}`}>
                          <i className="fa-solid fa-stethoscope" style={{ fontSize: '0.7rem' }}></i>
                          {vet.especialidad}
                        </span>
                      </td>
                      <td>
                        <div className="adm-location-box">
                          <span className="adm-sede-text">
                            <i className="fa-solid fa-building" style={{ color: '#059669', fontSize: '0.78rem' }}></i>
                            {vet.sede}
                          </span>
                          <span className="adm-ciudad-text">
                            <i className="fa-solid fa-location-dot" style={{ color: '#94a3b8', fontSize: '0.75rem', marginRight: '3px' }}></i>
                            {vet.ciudad}
                          </span>
                        </div>
                      </td>
                      <td>
                        <div className="adm-contact-box">
                          <span className="adm-contact-phone">
                            <i className="fa-solid fa-phone" style={{ color: '#0284c7', fontSize: '0.75rem', marginRight: '4px' }}></i>
                            {vet.telefono}
                          </span>
                          <span className="adm-contact-email">{vet.correo}</span>
                        </div>
                      </td>
                      <td>
                        <span className="adm-address-text">
                          <i className="fa-solid fa-map-pin" style={{ color: '#64748b', fontSize: '0.75rem', marginRight: '4px' }}></i>
                          {vet.direccion}
                        </span>
                      </td>
                      <td>
                        <span className="admin-tx-badge admin-tx-badge--confirmado">
                          <i className="fa-solid fa-circle-check" style={{ fontSize: '0.65rem', marginRight: '4px' }}></i>
                          {vet.estado || 'Activo'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', gap: '0.4rem' }}>
                          <button
                            type="button"
                            className="adm-action-btn adm-action-btn--view"
                            onClick={() => { setSelectedFicha(vet); setFichaTab('info'); }}
                            title="Ver ficha completa del veterinario"
                          >
                            <i className="fa-solid fa-eye"></i>
                          </button>
                          <button
                            type="button"
                            className="adm-action-btn adm-action-btn--edit"
                            onClick={() => handleOpenEditModal(vet)}
                            title="Editar datos del veterinario"
                          >
                            <i className="fa-solid fa-pen-to-square"></i>
                          </button>
                          <button
                            type="button"
                            className="adm-action-btn adm-action-btn--delete"
                            onClick={() => setDeletingVet(vet)}
                            title="Desactivar o eliminar veterinario"
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

      {/* ── MODAL: FICHA COMPLETA DEL VETERINARIO ── */}
      {selectedFicha && (
        <div className="adm-modal-overlay" onClick={() => setSelectedFicha(null)}>
          <div className="adm-modal-card" style={{ maxWidth: '680px', padding: 0 }} onClick={(e) => e.stopPropagation()}>
            <div className="adm-vet-hero">
              <img
                src={selectedFicha.foto_perfil || 'https://res.cloudinary.com/dedroug6v/image/upload/v1782673220/felipe-restrepo_qjvdxd.jpg'}
                alt={selectedFicha.nombre}
                className="adm-vet-hero__img"
              />
              <div className="adm-vet-hero__info">
                <h2>{selectedFicha.nombre}</h2>
                <div className="adm-vet-hero__tp">
                  <span>C.C. {selectedFicha.cedula}</span>
                  <span>&bull;</span>
                  <span>{selectedFicha.numero_tarjeta}</span>
                </div>
                <div className="adm-vet-hero__badges">
                  <span className={`adm-spec-badge ${getBadgeClass(selectedFicha.especialidad)}`} style={{ background: '#ffffff', color: '#047857' }}>
                    {selectedFicha.especialidad}
                  </span>
                </div>
              </div>
              <button className="adm-modal-close" style={{ color: '#ffffff' }} onClick={() => setSelectedFicha(null)}>
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <div className="adm-vet-body">
              {/* Pestañas de la Ficha */}
              <div className="adm-modal-tabs" style={{ marginBottom: '1.2rem' }}>
                <button
                  className={`adm-tab-btn ${fichaTab === 'info' ? 'adm-tab-btn--active' : ''}`}
                  onClick={() => setFichaTab('info')}
                >
                  <i className="fa-solid fa-id-card"></i> Datos Personales & Laborales
                </button>
                <button
                  className={`adm-tab-btn ${fichaTab === 'horario' ? 'adm-tab-btn--active' : ''}`}
                  onClick={() => setFichaTab('horario')}
                >
                  <i className="fa-regular fa-clock"></i> Sede & Horario
                </button>
              </div>

              {fichaTab === 'info' && (
                <div>
                  <div className="adm-detail-grid">
                    <div className="adm-detail-item">
                      <span className="adm-detail-item__label"><i className="fa-solid fa-id-card"></i> Cédula de Ciudadanía</span>
                      <span className="adm-detail-item__val">{selectedFicha.cedula}</span>
                    </div>
                    <div className="adm-detail-item">
                      <span className="adm-detail-item__label"><i className="fa-solid fa-file-medical"></i> Tarjeta Profesional</span>
                      <span className="adm-detail-item__val">{selectedFicha.numero_tarjeta}</span>
                    </div>
                    <div className="adm-detail-item">
                      <span className="adm-detail-item__label"><i className="fa-solid fa-phone"></i> Teléfono Móvil</span>
                      <span className="adm-detail-item__val">{selectedFicha.telefono}</span>
                    </div>
                    <div className="adm-detail-item">
                      <span className="adm-detail-item__label"><i className="fa-solid fa-envelope"></i> Correo Electrónico</span>
                      <span className="adm-detail-item__val">{selectedFicha.correo}</span>
                    </div>
                    <div className="adm-detail-item">
                      <span className="adm-detail-item__label"><i className="fa-solid fa-city"></i> Ciudad</span>
                      <span className="adm-detail-item__val">{selectedFicha.ciudad}</span>
                    </div>
                    <div className="adm-detail-item">
                      <span className="adm-detail-item__label"><i className="fa-solid fa-location-dot"></i> Dirección Residencia</span>
                      <span className="adm-detail-item__val">{selectedFicha.direccion}</span>
                    </div>
                  </div>

                  <div style={{ background: '#f0fdf4', padding: '1rem', borderRadius: '12px', border: '1px solid #bbf7d0' }}>
                    <h4 style={{ margin: '0 0 0.4rem 0', fontFamily: 'Sora, sans-serif', color: '#166534', fontSize: '0.92rem' }}>
                      <i className="fa-solid fa-user-doctor" style={{ marginRight: '6px' }}></i> Resumen de Perfil Médico
                    </h4>
                    <p style={{ margin: 0, fontSize: '0.88rem', color: '#15803d', lineHeight: '1.4' }}>
                      {selectedFicha.descripcion || 'Profesional registrado en la red médica veterinaria de EPS PetFeliz con atención integral para mascotas.'}
                    </p>
                  </div>
                </div>
              )}

              {fichaTab === 'horario' && (
                <div>
                  <div className="adm-detail-grid">
                    <div className="adm-detail-item">
                      <span className="adm-detail-item__label"><i className="fa-solid fa-building"></i> Sede Principal Asignada</span>
                      <span className="adm-detail-item__val">{selectedFicha.sede}</span>
                    </div>
                    <div className="adm-detail-item">
                      <span className="adm-detail-item__label"><i className="fa-regular fa-clock"></i> Horario de Atención</span>
                      <span className="adm-detail-item__val">{selectedFicha.horario}</span>
                    </div>
                    <div className="adm-detail-item">
                      <span className="adm-detail-item__label"><i className="fa-solid fa-stethoscope"></i> Especialidad Clínica</span>
                      <span className="adm-detail-item__val">{selectedFicha.especialidad}</span>
                    </div>
                    <div className="adm-detail-item">
                      <span className="adm-detail-item__label"><i className="fa-solid fa-calendar-check"></i> Citas Atendidas</span>
                      <span className="adm-detail-item__val">{selectedFicha.citas_atendidas || 0} Pacientes</span>
                    </div>
                  </div>
                </div>
              )}
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
          <div className="adm-modal-card" style={{ maxWidth: '640px' }} onClick={(e) => e.stopPropagation()}>
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

                <div className="adm-form-group">
                  <label>Cédula de Ciudadanía *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. 1.020.456.789"
                    value={formVet.cedula}
                    onChange={(e) => setFormVet({ ...formVet, cedula: e.target.value })}
                  />
                </div>

                <div className="adm-form-group">
                  <label>Tarjeta Profesional (TP) *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. TP-18452-COMVEZCOL"
                    value={formVet.numero_tarjeta}
                    onChange={(e) => setFormVet({ ...formVet, numero_tarjeta: e.target.value })}
                  />
                </div>

                <div className="adm-form-group">
                  <label>Teléfono de Contacto *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. 300 456 7890"
                    value={formVet.telefono}
                    onChange={(e) => setFormVet({ ...formVet, telefono: e.target.value })}
                  />
                </div>

                <div className="adm-form-group">
                  <label>Correo Electrónico *</label>
                  <input
                    type="email"
                    required
                    placeholder="Ej. andres.gomez@petfeliz.com"
                    value={formVet.correo}
                    onChange={(e) => setFormVet({ ...formVet, correo: e.target.value })}
                  />
                </div>

                <div className="adm-form-group">
                  <label>Especialidad Clínica *</label>
                  <select
                    value={formVet.especialidad}
                    onChange={(e) => setFormVet({ ...formVet, especialidad: e.target.value })}
                  >
                    <option value="Medicina General">Medicina General</option>
                    <option value="Dermatología">Dermatología</option>
                    <option value="Urgencias">Urgencias</option>
                    <option value="Cirugía">Cirugía</option>
                    <option value="Desparasitación">Desparasitación</option>
                    <option value="Vacunación">Vacunación</option>
                    <option value="Odontología">Odontología</option>
                    <option value="Laboratorio Clínico">Laboratorio Clínico</option>
                    <option value="Médico Director">Médico Director</option>
                  </select>
                </div>

                <div className="adm-form-group">
                  <label>Ciudad *</label>
                  <select
                    value={formVet.ciudad}
                    onChange={(e) => setFormVet({ ...formVet, ciudad: e.target.value })}
                  >
                    <option value="Medellín">Medellín</option>
                    <option value="Envigado">Envigado</option>
                    <option value="Bello">Bello</option>
                    <option value="Sabaneta">Sabaneta</option>
                    <option value="Itagüí">Itagüí</option>
                    <option value="Rionegro">Rionegro</option>
                  </select>
                </div>

                <div className="adm-form-group">
                  <label>Sede donde trabaja *</label>
                  <select
                    value={formVet.sede}
                    onChange={(e) => setFormVet({ ...formVet, sede: e.target.value })}
                  >
                    <option value="Sede Laureles">Sede Laureles</option>
                    <option value="Sede Envigado">Sede Envigado</option>
                    <option value="Sede Bello">Sede Bello</option>
                    <option value="Todas las sedes">Todas las sedes (Rotativo)</option>
                  </select>
                </div>

                <div className="adm-form-group">
                  <label>Horario de Atención</label>
                  <input
                    type="text"
                    placeholder="Ej. Lun–Vie 8:00 AM – 4:00 PM"
                    value={formVet.horario}
                    onChange={(e) => setFormVet({ ...formVet, horario: e.target.value })}
                  />
                </div>

                <div className="adm-form-group" style={{ gridColumn: 'span 2' }}>
                  <label>Dirección de Residencia / Contacto</label>
                  <input
                    type="text"
                    placeholder="Ej. Calle 33 #76-45, Laureles"
                    value={formVet.direccion}
                    onChange={(e) => setFormVet({ ...formVet, direccion: e.target.value })}
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
                <h3>Desactivar Veterinario</h3>
              </div>
              <button className="adm-modal-close" onClick={() => setDeletingVet(null)}>
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <div className="adm-modal-body">
              <p style={{ fontSize: '0.92rem', color: '#334155', lineHeight: '1.5', margin: 0 }}>
                ¿Estás seguro de que deseas desactivar a <strong>{deletingVet.nombre}</strong> (C.C. {deletingVet.cedula})?
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
                {submittingDelete ? 'Desactivando...' : 'Sí, Desactivar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
