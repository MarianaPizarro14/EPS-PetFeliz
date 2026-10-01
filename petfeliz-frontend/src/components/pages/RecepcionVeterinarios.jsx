import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getStoredToken, getStoredUser, isValidAvatarUrl } from '../../utils/authStorage'
import SidebarRecepcion from '../ui/SidebarRecepcion'
import DashboardHeader from '../ui/DashboardHeader'
import './DashboardClient.css'
import './DashboardVeterinario.css'
import './DashboardRecepcion.css'

export default function RecepcionVeterinarios() {
  const navigate = useNavigate()
  const storedUser = getStoredUser()

  const [usuario, setUsuario] = useState({
    nombre: storedUser?.nombre || 'Laura Ramírez',
    nombreCompleto: storedUser?.nombre || 'Laura Ramírez - Recepción Sede',
    foto: isValidAvatarUrl(storedUser?.foto || storedUser?.foto_perfil) ? (storedUser?.foto || storedUser?.foto_perfil) : null,
    rol: 'recepcionista',
    email: storedUser?.email || 'recepcion@petfeliz.com',
  })

  const [veterinarios, setVeterinarios] = useState([])
  const [loading, setLoading] = useState(true)
  const [errorGlobal, setErrorGlobal] = useState('')
  const [searchTerm, setSearchTerm] = useState('')

  const fetchVeterinarios = async () => {
    const token = getStoredToken()
    if (!token) {
      navigate('/login')
      return
    }

    try {
      setLoading(true)
      setErrorGlobal('')

      const res = await fetch(`${import.meta.env.VITE_API_URL}/recepcion/veterinarios`, {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      })

      if (res.status === 401 || res.status === 403) {
        navigate('/login')
        return
      }

      if (res.ok) {
        const data = await res.json()
        setVeterinarios(data.veterinarios || [])
      } else {
        setErrorGlobal('No se pudo cargar el directorio médico.')
      }
    } catch (err) {
      console.error('Error al cargar veterinarios:', err)
      setErrorGlobal('Error de conexión con el servidor.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchVeterinarios()
  }, [navigate])

  const searchLower = searchTerm.toLowerCase().trim()
  const vetsFiltrados = veterinarios.filter((v) => {
    if (!searchLower) return true
    return (
      (v.nombre || '').toLowerCase().includes(searchLower) ||
      (v.especialidad || '').toLowerCase().includes(searchLower) ||
      (v.telefono || '').toLowerCase().includes(searchLower) ||
      (v.email || '').toLowerCase().includes(searchLower)
    )
  })

  return (
    <div className="dash">
      <SidebarRecepcion />

      <main className="dash-main">
        <DashboardHeader
          title="Directorio de Médicos Veterinarios"
          subtitle="Consulta de personal médico disponible en la sede y disponibilidad de agenda"
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
            <p>Cargando directorio de médicos veterinarios...</p>
          </div>
        ) : vetsFiltrados.length === 0 ? (
          <div className="vet-empty-box">
            <i className="fa-solid fa-user-doctor-slash"></i>
            <h3>No se encontraron especialistas</h3>
            <p>No existen médicos registrados que coincidan con la búsqueda.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
            {vetsFiltrados.map((v) => (
              <div
                key={v.id_veterinario}
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
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                    <img
                      src={
                        v.foto ||
                        'https://res.cloudinary.com/dedroug6v/image/upload/v1782696391/foto_gato_1_nuieol.jpg'
                      }
                      alt={v.nombre}
                      style={{
                        width: '64px',
                        height: '64px',
                        borderRadius: '16px',
                        objectFit: 'cover',
                        border: '2px solid #ecfdf5',
                      }}
                    />
                    <div>
                      <h3 style={{ margin: 0, fontFamily: 'Sora, sans-serif', fontSize: '1.15rem', color: '#0f172a' }}>
                        {v.nombre}
                      </h3>
                      <span style={{ fontSize: '0.85rem', color: '#059669', fontWeight: 600, display: 'block', marginTop: '2px' }}>
                        <i className="fa-solid fa-stethoscope"></i> {v.especialidad}
                      </span>
                    </div>
                  </div>

                  <div style={{ background: '#f8fafc', padding: '0.85rem 1rem', borderRadius: '12px', border: '1px solid #f1f5f9', fontSize: '0.88rem', display: 'flex', flexDirection: 'column', gap: '0.45rem', marginBottom: '1rem' }}>
                    <div>
                      <strong style={{ color: '#475569' }}>Tarjeta Prof.:</strong> {v.numero_tarjeta}
                    </div>
                    <div>
                      <strong style={{ color: '#475569' }}>Correo:</strong> {v.email}
                    </div>
                    <div>
                      <strong style={{ color: '#475569' }}>Citas Asignadas Hoy:</strong>{' '}
                      <span style={{ color: v.citas_hoy > 0 ? '#2563eb' : '#64748b', fontWeight: 700 }}>
                        {v.citas_hoy} {v.citas_hoy === 1 ? 'cita' : 'citas'}
                      </span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {v.telefono && (
                    <a
                      href={`tel:${v.telefono.replace(/\s+/g, '')}`}
                      style={{
                        flex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.4rem',
                        background: '#ecfdf5',
                        color: '#047857',
                        border: '1px solid #a7f3d0',
                        padding: '0.6rem',
                        borderRadius: '10px',
                        textDecoration: 'none',
                        fontWeight: 600,
                        fontSize: '0.88rem',
                      }}
                    >
                      <i className="fa-solid fa-phone"></i> Llamar
                    </a>
                  )}
                  {v.email && (
                    <a
                      href={`mailto:${v.email}`}
                      style={{
                        flex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.4rem',
                        background: '#eff6ff',
                        color: '#1d4ed8',
                        border: '1px solid #bfdbfe',
                        padding: '0.6rem',
                        borderRadius: '10px',
                        textDecoration: 'none',
                        fontWeight: 600,
                        fontSize: '0.88rem',
                      }}
                    >
                      <i className="fa-solid fa-envelope"></i> Correo
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
