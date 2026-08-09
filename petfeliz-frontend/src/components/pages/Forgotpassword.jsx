import { useState } from 'react'
import { Link } from 'react-router-dom'
import './ForgotPassword.css'

const AVATARS = [
  { foto: 'https://res.cloudinary.com/dedroug6v/image/upload/v1782696387/foto_hombre_5_o1pjey.jpg', alt: 'Jose' },
  { foto: 'https://res.cloudinary.com/dedroug6v/image/upload/v1782696392/foto_mujer_3_okb9do.jpg', alt: 'Eliza' },
  { foto: 'https://res.cloudinary.com/dedroug6v/image/upload/v1782696391/foto_hombre_2_nuieol.jpg', alt: 'David' },
]

function ForgotPassword() {
  const [sent, setSent] = useState(false)
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!email) return

    setError('')
    setLoading(true)

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.message || 'No se pudo enviar el enlace de recuperación.')
        setLoading(false)
        return
      }

      setSent(true)
      setLoading(false)
    } catch {
      setError('No se pudo conectar con el servidor. Intenta de nuevo.')
      setLoading(false)
    }
  }

  async function handleResend() {
    setSent(false)
    setError('')
  }

  return (
    <div className="auth-split">

      <div className="auth-split__panel auth-split__panel--image">
        <div className="auth-split__overlay" />
        <img
          src="https://res.cloudinary.com/dedroug6v/image/upload/v1783712100/conejito_cafe_owxwxd.jpg"
          alt="Conejo cafe"
          className="auth-split__bg"
        />
        <div className="auth-split__panel-content">

          <div className="auth-split__bottom">
            <h2 className="auth-split__title">
              Tu cuenta,<br />siempre<br />segura.
            </h2>
            <p className="auth-split__desc">
              Recupera el acceso en segundos y vuelve
              a cuidar a tus mejores amigos.
            </p>

            <div className="auth-split__community">
              <div className="auth-split__avatars">
                {AVATARS.map((a, i) => (
                  <img
                    key={i}
                    src={a.foto}
                    alt={a.alt}
                    className="auth-split__avatar"
                  />
                ))}
                <div className="auth-split__avatar auth-split__avatar--count">+2k</div>
              </div>
              <span className="auth-split__community-text">
                Únete a nuestra comunidad de cuidadores
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="auth-split__panel auth-split__panel--form">
        <div className="auth-form">

          {/* Logo centrado arriba del formulario */}
          <Link to="/" className="auth-form__logo">EPS PetFeliz</Link>

          <Link to="/" className="auth-back">
            <i className="fa-solid fa-arrow-left" style={{ marginRight: '0.4rem' }}></i>
            Volver al inicio
          </Link>


          {!sent ? (
            <>
              <div className="forgot__icon-wrap">
                <LockIcon />
              </div>

              <div className="auth-form__header">
                <h1 className="auth-form__title">¿Olvidaste tu contraseña?</h1>
                <p className="auth-form__subtitle">
                  Ingresa tu correo y te enviaremos un enlace para restablecerla.
                </p>
              </div>

              {error && <p className="auth-form__error">{error}</p>}

              <form className="auth-form__fields" onSubmit={handleSubmit}>
                <div className="field">
                  <label className="field__label" htmlFor="email">Correo electrónico</label>
                  <input
                    id="email" type="email" className="field__input"
                    placeholder="correo@ejemplo.com" autoComplete="email"
                    value={email} onChange={e => setEmail(e.target.value)} required
                  />
                </div>
                <button type="submit" className="auth-btn" disabled={loading}>
                  {loading ? 'Enviando...' : 'Enviar enlace de recuperación →'}
                </button>
              </form>

              <p className="auth-form__footer">
                <Link to="/login" className="forgot__back-link">← Volver a iniciar sesión</Link>
              </p>
            </>
          ) : (
            <div className="forgot__success">
              <div className="forgot__success-icon"><CheckIcon /></div>
              <h1 className="auth-form__title">Revisa tu correo</h1>
              <p className="forgot__success-text">
                Enviamos un enlace de recuperación a <strong>{email}</strong>.
                Puede tardar unos minutos. Revisa también tu carpeta de spam.
              </p>
              <button className="auth-btn" onClick={handleResend} style={{ marginTop: '1.5rem' }}>
                Reenviar correo
              </button>
              <p className="auth-form__footer" style={{ marginTop: '1.25rem' }}>
                <Link to="/login" className="forgot__back-link">← Volver a iniciar sesión</Link>
              </p>
            </div>
          )}

        </div>
      </div>

    </div>
  )
}

function LockIcon() {
  return <i className="fa-solid fa-lock" style={{ fontSize: '1.6rem', color: '#059669' }} />
}

function CheckIcon() {
  return <i className="fa-solid fa-circle-check" style={{ fontSize: '1.8rem', color: '#059669' }} />
}


export default ForgotPassword