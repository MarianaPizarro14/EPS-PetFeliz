import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import SidebarClient from '../ui/SidebarClient'
import DashboardHeader from '../ui/DashboardHeader'
import './DashboardClient.css'
import './SoporteCliente.css'

export default function SoporteCliente() {
  const navigate = useNavigate()
  const [usuario, setUsuario] = useState({ nombre: 'Usuario', foto: '' })

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      navigate('/login')
      return
    }

    fetch(`${import.meta.env.VITE_API_URL}/me`, {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) setUsuario(data.usuario || data)
      })
      .catch((err) => console.error('Error al cargar perfil en soporte:', err))
  }, [navigate])

  const whatsappUrl =
    'https://wa.me/573023783834?text=Hola%2C%20tengo%20un%20problema%20en%20el%20panel%20de%20usuario%20de%20PetFeliz'

  return (
    <div className="dash">
      <SidebarClient />

      <main className="dash-main">
        <DashboardHeader
          title="Soporte y Atención al Cliente"
          subtitle="¿Tienes dudas o necesitas ayuda con tu cuenta? Contáctate directamente con nuestro equipo de atención"
          usuario={usuario}
          onUserUpdated={setUsuario}
        />

        <div className="soporte-cli-card">
          <div className="soporte-cli-icon">
            <i className="fa-brands fa-whatsapp"></i>
          </div>

          <h2 className="soporte-cli-title">¿Necesitas soporte inmediato?</h2>
          <p className="soporte-cli-desc">
            Nuestro equipo de atención al afiliado EPS PetFeliz está disponible en WhatsApp para resolver inconvenientes técnicos, dudas con tus citas, facturación o soporte con tus mascotas.
          </p>

          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="soporte-cli-btn-ws"
          >
            <i className="fa-brands fa-whatsapp" style={{ fontSize: '1.4rem' }}></i>
            <span>Contactar por WhatsApp</span>
          </a>

          <div className="soporte-cli-info-box">
            <div className="soporte-cli-info-item">
              <i className="fa-solid fa-clock"></i>
              <div>
                <strong>Horario de Atención</strong>
                <span>Lunes a Sábado: 8:00 AM - 7:00 PM</span>
              </div>
            </div>

            <div className="soporte-cli-info-item">
              <i className="fa-solid fa-shield-cat"></i>
              <div>
                <strong>Urgencias Médicas</strong>
                <span>Atención prioritaria 24/7 en sedes</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
