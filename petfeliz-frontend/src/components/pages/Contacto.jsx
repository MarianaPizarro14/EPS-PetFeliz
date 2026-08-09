import { useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import Hero from '../Hero'
import './Contacto.css'
import CtaBanner from '../CtaBanner'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import {
  faEnvelope, faClock, faLocationDot, faPaw,
  faChevronDown, faPaperPlane, faCheckCircle
} from '@fortawesome/free-solid-svg-icons'
import { faWhatsapp } from '@fortawesome/free-brands-svg-icons'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const sedes = [
  {
    nombre: 'Sede Laureles',
    direccion: 'Cra. 76 #34-20, Laureles, Medellín',
    horario: 'Lun–Vie 8am–6pm · Sáb 8am–2pm',
    lat: 6.2476,
    lng: -75.5958,
  },
  {
    nombre: 'Sede Itagüí',
    direccion: 'Cra. 52 #49-30, La Paz, Itagüí',
    horario: 'Lun–Vie 8am–6pm · Sáb 8am–2pm',
    lat: 6.1772,
    lng: -75.6012,
  },
  {
    nombre: 'Sede Bello',
    direccion: 'Cra. 48 #12-15, Bello, Antioquia',
    horario: 'Lun–Vie 8am–6pm · Sáb 8am–2pm',
    lat: 6.3367,
    lng: -75.5578,
  },
]

const faqs = [
  {
    q: '¿Cómo me afilio a un plan EPS?',
    a: 'Puedes afiliarte directamente desde la sección "Planes" de nuestra plataforma. Elige el plan que más se adapte a ti, realiza el pago en línea y tu afiliación queda activa de inmediato.',
  },
  {
    q: '¿Cómo agendo una cita veterinaria?',
    a: 'Inicia sesión en tu cuenta, ve a "Agendar cita", selecciona el servicio, la fecha disponible en el calendario y el veterinario de tu preferencia. Recibirás confirmación inmediata.',
  },
  {
    q: '¿Cómo cancelo o reprogramo una cita?',
    a: 'Desde tu perfil, en la sección "Mis citas", puedes cancelar o reprogramar con al menos 2 horas de anticipación sin costo adicional.',
  },
  {
    q: '¿Qué métodos de pago aceptan?',
    a: 'Aceptamos PSE, Nequi, Daviplata, tarjeta débito y tarjeta crédito. Todos los pagos son procesados de forma segura y recibirás tu factura en PDF automáticamente.',
  },
  {
    q: '¿Cuántas consultas incluye mi plan mensual?',
    a: 'Depende del plan que elijas. Puedes consultar el número de consultas incluidas en la sección "Planes". El sistema lleva el conteo automáticamente mes a mes.',
  },
  {
    q: '¿PetFeliz ofrece atención presencial?',
    a: 'PetFeliz es una plataforma de gestión web. La atención veterinaria se coordina a través del sistema, pero las consultas se realizan en las clínicas afiliadas a nuestra red.',
  },
]

export default function Contacto() {
  const [openFaq, setOpenFaq] = useState(null)
  const [sent, setSent] = useState(false)
  const [sedeActiva, setSedeActiva] = useState(0)
  const [form, setForm] = useState({
    nombre: '', correo: '', asunto: '', mensaje: ''
  })

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = e => {
    e.preventDefault()
    setSent(true)
  }

  return (
    <>
      <Hero
        centered
        badgeIcon={faPaw}
        badge="Contáctanos"
        title="¿Tienes alguna"
        accent="duda?"
        desc="Estamos aquí para ayudarte. Escríbenos y te responderemos en menos de 24 horas hábiles."
      />

      <section className="ct-main">
        <div className="container ct-main__grid">

          <div className="ct-info">
            <div className="ct-info__card">
              <div className="ct-info__icon ct-icon-green">
                <FontAwesomeIcon icon={faEnvelope} />
              </div>
              <div>
                <p className="ct-info__label">Correo electrónico</p>
                <a href="mailto:petfelizeps@gmail.com" className="ct-info__value">petfelizeps@gmail.com</a>
              </div>
            </div>
            <div className="ct-info__card">
              <div className="ct-info__icon ct-icon-green">
                <FontAwesomeIcon icon={faWhatsapp} />
              </div>
              <div>
                <p className="ct-info__label">WhatsApp</p>
                <a href="https://wa.me/57314570930" target="_blank" rel="noopener noreferrer" className="ct-info__value">+57 314 570 9302</a>
              </div>
            </div>
            <div className="ct-info__card">
              <div className="ct-info__icon ct-icon-green">
                <FontAwesomeIcon icon={faClock} />
              </div>
              <div>
                <p className="ct-info__label">Horario de atención</p>
                <p className="ct-info__value">Lun – Vie: 8:00 am – 6:00 pm</p>
              </div>
            </div>
            <div className="ct-info__card">
              <div className="ct-info__icon ct-icon-green">
                <FontAwesomeIcon icon={faLocationDot} />
              </div>
              <div>
                <p className="ct-info__label">Nuestras sedes</p>
                <p className="ct-info__value">Laureles · Itagüí · Bello</p>
                <p className="ct-info__sub">Medellín, Antioquia</p>
              </div>
            </div>

            <div className="ct-notice">
              <p>
                PetFeliz es una plataforma de gestión web. No reemplaza la atención médica
                veterinaria presencial. En caso de emergencia, acude directamente a una de nuestras clínicas veterinarias.
              </p>
            </div>
          </div>

          <div className="ct-form-wrap">
            {sent ? (
              <div className="ct-success">
                <FontAwesomeIcon icon={faCheckCircle} className="ct-success__icon" />
                <h3>¡Mensaje enviado!</h3>
                <p>Gracias por contactarnos. Te responderemos pronto a tu correo.</p>
                <button className="btn btn-primary" onClick={() => setSent(false)}>
                  Enviar otro mensaje
                </button>
              </div>
            ) : (
              <form className="ct-form" onSubmit={handleSubmit}>
                <h2 className="ct-form__title">Envíanos un mensaje</h2>

                <div className="ct-form__group">
                  <label className="ct-form__label" htmlFor="nombre">Nombre completo</label>
                  <input
                    id="nombre" name="nombre" type="text"
                    className="ct-form__input" placeholder="Tu nombre"
                    value={form.nombre} onChange={handleChange} required
                  />
                </div>

                <div className="ct-form__group">
                  <label className="ct-form__label" htmlFor="correo">Correo electrónico</label>
                  <input
                    id="correo" name="correo" type="email"
                    className="ct-form__input" placeholder="tu@correo.com"
                    value={form.correo} onChange={handleChange} required
                  />
                </div>

                <div className="ct-form__group">
                  <label className="ct-form__label" htmlFor="asunto">Asunto</label>
                  <select
                    id="asunto" name="asunto"
                    className="ct-form__input ct-form__select"
                    value={form.asunto} onChange={handleChange} required
                  >
                    <option value="" disabled>Selecciona un asunto</option>
                    <option value="soporte">Soporte técnico</option>
                    <option value="planes">Consulta sobre planes</option>
                    <option value="facturacion">Facturación y pagos</option>
                    <option value="cita">Ayuda con mi cita</option>
                    <option value="otro">Otro</option>
                  </select>
                </div>

                <div className="ct-form__group">
                  <label className="ct-form__label" htmlFor="mensaje">Mensaje</label>
                  <textarea
                    id="mensaje" name="mensaje"
                    className="ct-form__input ct-form__textarea"
                    placeholder="Cuéntanos en qué podemos ayudarte..."
                    rows={5} value={form.mensaje} onChange={handleChange} required
                  />
                </div>

                <button type="submit" className="btn btn-primary ct-form__btn">
                  Enviar mensaje <FontAwesomeIcon icon={faPaperPlane} />
                </button>
              </form>
            )}
          </div>

        </div>
      </section>

      {/* MAPA DE SEDES */}
      <section className="ct-sedes">
        <div className="container">
          <div className="section-header">
            <h2>Nuestras <span className="text-accent">sedes</span></h2>
            <p>Encuéntranos en tres puntos estratégicos del Área Metropolitana de Medellín.</p>
          </div>

          <div className="ct-sedes__tabs">
            {sedes.map((sede, i) => (
              <button
                key={i}
                className={`ct-sedes__tab${sedeActiva === i ? ' active' : ''}`}
                onClick={() => setSedeActiva(i)}
              >
                <FontAwesomeIcon icon={faLocationDot} />
                {sede.nombre}
              </button>
            ))}
          </div>

          <div className="ct-sedes__grid">
            <div className="ct-sedes__info">
              <h3 className="ct-sedes__nombre">{sedes[sedeActiva].nombre}</h3>
              <div className="ct-sedes__dato">
                <FontAwesomeIcon icon={faLocationDot} />
                <span>{sedes[sedeActiva].direccion}</span>
              </div>
              <div className="ct-sedes__dato">
                <FontAwesomeIcon icon={faClock} />
                <span>{sedes[sedeActiva].horario}</span>
              </div>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${sedes[sedeActiva].lat},${sedes[sedeActiva].lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary ct-sedes__btn"
              >
                <FontAwesomeIcon icon={faLocationDot} />
                Cómo llegar
              </a>
            </div>

            <div className="ct-sedes__map">
              <MapContainer
                key={sedeActiva}
                center={[sedes[sedeActiva].lat, sedes[sedeActiva].lng]}
                zoom={15}
                style={{ width: '100%', height: '100%', borderRadius: '16px' }}
                scrollWheelZoom={false}
              >
                <TileLayer
                  attribution='&copy; <a href="https://carto.com/">CARTO</a>'
                  url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                />
                {sedes.map((sede, i) => (
                  <Marker key={i} position={[sede.lat, sede.lng]}>
                    <Popup>
                      <strong>{sede.nombre}</strong><br />
                      {sede.direccion}<br />
                      <small>{sede.horario}</small>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="ct-faq">
        <div className="container">
          <div className="section-header">
            <h2><strong>Preguntas</strong> <span className="text-accent"><strong>frecuentes</strong></span></h2>
            <p>Respuestas a las dudas más comunes de nuestros usuarios.</p>
          </div>
          <div className="ct-faq__list">
            {faqs.map((faq, i) => (
              <div
                key={i}
                className={`ct-faq__item${openFaq === i ? ' open' : ''}`}
              >
                <button
                  className="ct-faq__question"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  aria-expanded={openFaq === i}
                >
                  {faq.q}
                  <FontAwesomeIcon icon={faChevronDown} className="ct-faq__arrow" />
                </button>
                {openFaq === i && (
                  <div className="ct-faq__answer">
                    <p>{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA BANNER */}
      <CtaBanner
        title="¿Tienes más preguntas?"
        subtitle="Nuestro equipo está listo para ayudarte. Escríbenos y te respondemos en menos de 24 horas."
        buttons={[
          { label: 'Escríbenos', href: 'mailto:petfelizeps@gmail.com', variant: 'btn-primary' },
          { label: 'Ver planes', href: '/planes', variant: 'btn-outline-white' },
        ]}
      />
    </>
  )
}