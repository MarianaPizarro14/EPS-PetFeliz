import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getStoredToken, getStoredUser, isValidAvatarUrl } from '../../utils/authStorage'
import SidebarRecepcion from '../ui/SidebarRecepcion'
import DashboardHeader from '../ui/DashboardHeader'
import './DashboardClient.css'
import './DashboardVeterinario.css'
import './DashboardRecepcion.css'

export default function RecepcionClientes() {
  const navigate = useNavigate()
  const storedUser = getStoredUser()

  const [usuario, setUsuario] = useState({
    nombre: storedUser?.nombre || 'Laura Ramírez',
    nombreCompleto: storedUser?.nombre || 'Laura Ramírez - Recepción Sede',
    foto: isValidAvatarUrl(storedUser?.foto || storedUser?.foto_perfil) ? (storedUser?.foto || storedUser?.foto_perfil) : null,
    rol: 'recepcionista',
    email: storedUser?.email || 'recepcion@petfeliz.com',
  })

  const [clientes, setClientes] = useState([])
  const [loading, setLoading] = useState(true)
  const [errorGlobal, setErrorGlobal] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [toast, setToast] = useState(null)

  const triggerToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 4000)
  }

  // Modales de Edición
  const [selectedClienteEdit, setSelectedClienteEdit] = useState(null)
  const [clienteForm, setClienteForm] = useState({
    nombre: '',
    telefono: '',
    cedula: '',
    direccion: '',
    departamento: '',
    ciudad: '',
    contacto_emergencia_nombre: '',
    contacto_emergencia_telefono: '',
  })
  const [submittingCliente, setSubmittingCliente] = useState(false)

  const [selectedMascotaEdit, setSelectedMascotaEdit] = useState(null)
  const [mascotaForm, setMascotaForm] = useState({
    nombre: '',
    especie: 'Canino',
    raza: '',
    sexo: 'Macho',
    fecha_nacimiento: '',
    peso: '',
    alergias: '',
    vacunas: '',
  })
  const [submittingMascota, setSubmittingMascota] = useState(false)

  const fetchClientes = async () => {
    const token = getStoredToken()
    if (!token) {
      navigate('/login')
      return
    }

    try {
      setLoading(true)
      setErrorGlobal('')

      const res = await fetch(`${import.meta.env.VITE_API_URL}/recepcion/clientes?search=${encodeURIComponent(searchTerm)}`, {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      })

      if (res.status === 401 || res.status === 403) {
        navigate('/login')
        return
      }

      if (res.ok) {
        const data = await res.json()
        setClientes(data.clientes || [])
      } else {
        setErrorGlobal('No se pudo cargar el directorio de clientes.')
      }
    } catch (err) {
      console.error('Error al cargar clientes:', err)
      setErrorGlobal('Error de conexión con el servidor.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchClientes()
    }, 300)
    return () => clearTimeout(timeout)
  }, [searchTerm, navigate])

  const openEditCliente = (c) => {
    setSelectedClienteEdit(c)
    setClienteForm({
      nombre: c.nombre || '',
      telefono: c.telefono || '',
      cedula: c.cedula || '',
      direccion: c.direccion || '',
      departamento: c.departamento || '',
      ciudad: c.ciudad || '',
      contacto_emergencia_nombre: c.contacto_emergencia_nombre || '',
      contacto_emergencia_telefono: c.contacto_emergencia_telefono || '',
    })
  }

  const handleUpdateCliente = async (e) => {
    e.preventDefault()
    if (!selectedClienteEdit) return

    const token = getStoredToken()
    try {
      setSubmittingCliente(true)

      const res = await fetch(`${import.meta.env.VITE_API_URL}/recepcion/clientes/${selectedClienteEdit.id_cliente}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(clienteForm),
      })

      const data = await res.json()

      if (res.ok) {
        triggerToast(data.message || 'Datos del cliente actualizados.', 'success')
        setSelectedClienteEdit(null)
        fetchClientes()
      } else {
        triggerToast(data.message || 'Error al actualizar cliente.', 'error')
      }
    } catch (err) {
      console.error(err)
      triggerToast('Error de conexión.', 'error')
    } finally {
      setSubmittingCliente(false)
    }
  }

  const openEditMascota = (m) => {
    setSelectedMascotaEdit(m)
    setMascotaForm({
      nombre: m.nombre || '',
      especie: m.especie || 'Canino',
      raza: m.raza || '',
      sexo: m.sexo || 'Macho',
      fecha_nacimiento: m.fecha_nacimiento || '',
      peso: m.peso || '',
      alergias: m.alergias || '',
      vacunas: m.vacunas || '',
    })
  }

  const handleUpdateMascota = async (e) => {
    e.preventDefault()
    if (!selectedMascotaEdit) return

    const token = getStoredToken()
    try {
      setSubmittingMascota(true)

      const res = await fetch(`${import.meta.env.VITE_API_URL}/recepcion/mascotas/${selectedMascotaEdit.id_mascota}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(mascotaForm),
      })

      const data = await res.json()

      if (res.ok) {
        triggerToast(data.message || 'Datos de la mascota actualizados.', 'success')
        setSelectedMascotaEdit(null)
        fetchClientes()
      } else {
        triggerToast(data.message || 'Error al actualizar mascota.', 'error')
      }
    } catch (err) {
      console.error(err)
      triggerToast('Error de conexión.', 'error')
    } finally {
      setSubmittingMascota(false)
    }
  }

  return (
    <div className="dash">
      <SidebarRecepcion />

      {toast && (
        <div className={`adm-toast ${toast.type === 'error' ? 'adm-toast--error' : ''}`}>
          <i className={`adm-toast__icon fa-solid ${toast.type === 'error' ? 'fa-triangle-exclamation' : 'fa-circle-check'}`}></i>
          <span>{toast.message}</span>
          <button className="adm-toast__close" onClick={() => setToast(null)}>
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>
      )}

      <main className="dash-main">
        <DashboardHeader
          title="Directorio de Clientes y Mascotas"
          subtitle="Consulta de usuarios tutores, verificación de afiliaciones y actualización de datos"
          usuario={usuario}
          onUserUpdated={setUsuario}
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

        {loading ? (
          <div className="vet-loading-box">
            <i className="fa-solid fa-spinner fa-spin"></i>
            <p>Cargando clientes y pacientes...</p>
          </div>
        ) : clientes.length === 0 ? (
          <div className="vet-empty-box">
            <i className="fa-solid fa-users-slash"></i>
            <h3>No se encontraron clientes</h3>
            <p>No existen registros que coincidan con la búsqueda "{searchTerm}".</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '1.5rem' }}>
            {clientes.map((c) => (
              <div
                key={c.id_cliente}
                style={{
                  background: '#ffffff',
                  borderRadius: '16px',
                  padding: '1.5rem',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 4px 12px rgba(15, 23, 42, 0.04)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.85rem' }}>
                    <div>
                      <h3 style={{ margin: 0, fontFamily: 'Sora, sans-serif', fontSize: '1.15rem', color: '#0f172a' }}>
                        {c.nombre}
                      </h3>
                      <span style={{ fontSize: '0.84rem', color: '#64748b' }}>
                        <i className="fa-solid fa-id-card"></i> Cédula: {c.cedula || 'N/R'}
                      </span>
                    </div>

                    <span
                      className={`vet-badge ${c.es_afiliado ? 'vet-badge--atendida' : 'vet-badge--cancelada'}`}
                      style={{ fontSize: '0.78rem' }}
                    >
                      {c.es_afiliado ? 'Afiliado EPS' : 'Particular'}
                    </span>
                  </div>

                  <div style={{ fontSize: '0.88rem', color: '#334155', display: 'flex', flexDirection: 'column', gap: '0.4rem', marginBottom: '1.1rem' }}>
                    <div><i className="fa-solid fa-phone" style={{ color: '#2563eb', width: '16px' }}></i> {c.telefono || 'Sin teléfono'}</div>
                    <div><i className="fa-solid fa-envelope" style={{ color: '#2563eb', width: '16px' }}></i> {c.email || 'Sin correo'}</div>
                    {c.direccion && <div><i className="fa-solid fa-location-dot" style={{ color: '#2563eb', width: '16px' }}></i> {c.direccion} ({c.ciudad || 'Medellín'})</div>}
                  </div>

                  {/* Mascotas del Cliente */}
                  <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '0.85rem', marginBottom: '1rem' }}>
                    <strong style={{ fontSize: '0.85rem', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Mascotas Registradas ({c.mascotas ? c.mascotas.length : 0}):
                    </strong>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem' }}>
                      {c.mascotas && c.mascotas.map((m) => (
                        <div
                          key={m.id_mascota}
                          style={{
                            background: '#f8fafc',
                            border: '1px solid #e2e8f0',
                            borderRadius: '8px',
                            padding: '0.35rem 0.65rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.4rem',
                            fontSize: '0.82rem',
                          }}
                        >
                          <i className="fa-solid fa-paw" style={{ color: '#059669' }}></i>
                          <strong>{m.nombre}</strong> ({m.especie})
                          <button
                            type="button"
                            onClick={() => openEditMascota(m)}
                            title="Editar datos de la mascota"
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#2563eb', marginLeft: '0.2rem' }}
                          >
                            <i className="fa-solid fa-pen"></i>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={() => openEditCliente(c)}
                    className="vet-btn-obs"
                    style={{ width: '100%', justifyContent: 'center', background: '#eff6ff', color: '#2563eb' }}
                  >
                    <i className="fa-solid fa-user-pen"></i> Editar Tutor
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* ── MODAL EDITAR TUTOR / CLIENTE ── */}
      {selectedClienteEdit && (
        <div className="rec-modal-backdrop" onClick={() => setSelectedClienteEdit(null)}>
          <div className="rec-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="rec-modal__title">Editar Datos del Tutor / Cliente</h3>
            <p className="rec-modal__subtitle">Actualización de datos de contacto presenciales</p>

            <form onSubmit={handleUpdateCliente}>
              <div style={{ marginBottom: '0.85rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.3rem' }}>
                  Nombre Completo:
                </label>
                <input
                  type="text"
                  value={clienteForm.nombre}
                  onChange={(e) => setClienteForm({ ...clienteForm, nombre: e.target.value })}
                  style={{ width: '100%', padding: '0.55rem', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem', marginBottom: '0.85rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.3rem' }}>
                    Teléfono:
                  </label>
                  <input
                    type="text"
                    value={clienteForm.telefono}
                    onChange={(e) => setClienteForm({ ...clienteForm, telefono: e.target.value })}
                    style={{ width: '100%', padding: '0.55rem', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.3rem' }}>
                    Cédula:
                  </label>
                  <input
                    type="text"
                    value={clienteForm.cedula}
                    onChange={(e) => setClienteForm({ ...clienteForm, cedula: e.target.value })}
                    style={{ width: '100%', padding: '0.55rem', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
                    required
                  />
                </div>
              </div>

              <div style={{ marginBottom: '0.85rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.3rem' }}>
                  Dirección de Residencia:
                </label>
                <input
                  type="text"
                  value={clienteForm.direccion}
                  onChange={(e) => setClienteForm({ ...clienteForm, direccion: e.target.value })}
                  style={{ width: '100%', padding: '0.55rem', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.25rem' }}>
                <button
                  type="button"
                  onClick={() => setSelectedClienteEdit(null)}
                  style={{ padding: '0.55rem 1.1rem', borderRadius: '8px', border: 'none', background: '#f1f5f9', cursor: 'pointer' }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submittingCliente}
                  style={{ padding: '0.55rem 1.25rem', borderRadius: '8px', border: 'none', background: '#2563eb', color: '#fff', cursor: 'pointer' }}
                >
                  {submittingCliente ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL EDITAR MASCOTA ── */}
      {selectedMascotaEdit && (
        <div className="rec-modal-backdrop" onClick={() => setSelectedMascotaEdit(null)}>
          <div className="rec-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="rec-modal__title">Editar Mascota: {selectedMascotaEdit.nombre}</h3>
            <p className="rec-modal__subtitle">Actualización de datos clínicos y especie</p>

            <form onSubmit={handleUpdateMascota}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem', marginBottom: '0.85rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.3rem' }}>
                    Nombre:
                  </label>
                  <input
                    type="text"
                    value={mascotaForm.nombre}
                    onChange={(e) => setMascotaForm({ ...mascotaForm, nombre: e.target.value })}
                    style={{ width: '100%', padding: '0.55rem', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.3rem' }}>
                    Especie:
                  </label>
                  <select
                    value={mascotaForm.especie}
                    onChange={(e) => setMascotaForm({ ...mascotaForm, especie: e.target.value })}
                    style={{ width: '100%', padding: '0.55rem', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#fff', boxSizing: 'border-box' }}
                  >
                    <option value="Canino">Canino / Perro</option>
                    <option value="Felino">Felino / Gato</option>
                    <option value="Otro">Otro / Exótico</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem', marginBottom: '0.85rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.3rem' }}>
                    Raza:
                  </label>
                  <input
                    type="text"
                    value={mascotaForm.raza}
                    onChange={(e) => setMascotaForm({ ...mascotaForm, raza: e.target.value })}
                    style={{ width: '100%', padding: '0.55rem', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.3rem' }}>
                    Sexo:
                  </label>
                  <select
                    value={mascotaForm.sexo}
                    onChange={(e) => setMascotaForm({ ...mascotaForm, sexo: e.target.value })}
                    style={{ width: '100%', padding: '0.55rem', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#fff', boxSizing: 'border-box' }}
                  >
                    <option value="Macho">Macho</option>
                    <option value="Hembra">Hembra</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem', marginBottom: '0.85rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.3rem' }}>
                    Peso (kg):
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={mascotaForm.peso}
                    onChange={(e) => setMascotaForm({ ...mascotaForm, peso: e.target.value })}
                    style={{ width: '100%', padding: '0.55rem', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.3rem' }}>
                    Fecha Nacimiento:
                  </label>
                  <input
                    type="date"
                    value={mascotaForm.fecha_nacimiento}
                    onChange={(e) => setMascotaForm({ ...mascotaForm, fecha_nacimiento: e.target.value })}
                    style={{ width: '100%', padding: '0.55rem', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.25rem' }}>
                <button
                  type="button"
                  onClick={() => setSelectedMascotaEdit(null)}
                  style={{ padding: '0.55rem 1.1rem', borderRadius: '8px', border: 'none', background: '#f1f5f9', cursor: 'pointer' }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submittingMascota}
                  style={{ padding: '0.55rem 1.25rem', borderRadius: '8px', border: 'none', background: '#059669', color: '#fff', cursor: 'pointer' }}
                >
                  {submittingMascota ? 'Guardando...' : 'Guardar Mascota'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
