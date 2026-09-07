import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { setStoredAuth } from '../../utils/authStorage'
import './Login.css'

const AVATARS = [
  { foto: 'https://res.cloudinary.com/dedroug6v/image/upload/v1782696387/foto_hombre_5_o1pjey.jpg', alt: 'Jose' },
  { foto: 'https://res.cloudinary.com/dedroug6v/image/upload/v1782696392/foto_mujer_3_okb9do.jpg', alt: 'Eliza' },
  { foto: 'https://res.cloudinary.com/dedroug6v/image/upload/v1782696391/foto_hombre_2_nuieol.jpg', alt: 'David' },
]

function Login() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [rememberMe, setRememberMe] = useState(true)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const handleChange = (e) => {
    setForm({ ...form, [e.target.id]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.message || 'No se pudo iniciar sesión.')
        setLoading(false)
        return
      }

      setStoredAuth(data.token, data.user, rememberMe)

      navigate('/dashboard-client')
    } catch {
      setError('No se pudo conectar con el servidor. Intenta de nuevo.')
      setLoading(false)
    }
  }


  return (
    <div className="auth-split">

      {/* ── Panel izquierdo — imagen ── */}
      <div className="auth-split__panel auth-split__panel--image">
        <div className="auth-split__overlay" />
        <img
          src="https://res.cloudinary.com/dedroug6v/image/upload/v1783709702/golden_retriever_sonriendo_e1mrkw.jpg"
          alt="Golden Retriever feliz"
          className="auth-split__bg"
        />
        <div className="auth-split__panel-content">

          <div className="auth-split__bottom">
            <h2 className="auth-split__title">
              ¡Bienvenido<br />de nuevo!
            </h2>
            <p className="auth-split__desc">
              Inicia sesión para cuidar a tus mejores amigos
              y gestionar su bienestar diario.
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

      {/* ── Panel derecho — formulario ── */}
      <div className="auth-split__panel auth-split__panel--form">
        <div className="auth-form">

          {/* Logo centrado arriba del formulario */}
          <Link to="/" className="auth-form__logo">EPS PetFeliz</Link>

          {/* Flecha volver */}
          <Link to="/" className="auth-back">
            <i className="fa-solid fa-arrow-left" style={{ marginRight: '0.4rem' }}></i>
            Volver al inicio
          </Link>


          <div className="auth-form__header">
            <h1 className="auth-form__title">Ingresa a tu cuenta</h1>
            <p className="auth-form__subtitle">Tu mascota te ha estado esperando.</p>
          </div>

          {error && <p className="auth-form__error">{error}</p>}

          <form className="auth-form__fields" onSubmit={handleSubmit}>
            <div className="field">
              <label className="field__label" htmlFor="email">Correo electrónico</label>
              <input
                id="email" type="email" className="field__input"
                placeholder="correo@ejemplo.com" autoComplete="email"
                value={form.email} onChange={handleChange} required
              />
            </div>

            <div className="field">
              <div className="field__row">
                <label className="field__label" htmlFor="password">Contraseña</label>
                <Link to="/forgot-password" className="field__link">
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
              <div className="field__password-wrap">
                <input
                  id="password" type={showPassword ? 'text' : 'password'} className="field__input"
                  placeholder="••••••••" autoComplete="current-password"
                  value={form.password} onChange={handleChange} required
                />
                <button
                  type="button"
                  className="field__toggle-password"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
            </div>

            <div className="field__remember">
              <label className="field__checkbox-label">
                <input
                  type="checkbox"
                  id="rememberMe"
                  className="field__checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <span>Recuérdame</span>
              </label>
            </div>

            <button type="submit" className="auth-btn" disabled={loading}>
              {loading ? 'Ingresando...' : 'Iniciar Sesión →'}
            </button>
          </form>

          <div className="auth-divider"><span>O INICIA SESIÓN CON</span></div>

          <button className="auth-social-btn">
            <GoogleIcon />
            Google
          </button>

          <p className="auth-form__footer">
            ¿Aún no tienes una cuenta?{' '}
            <Link to="/register" className="auth-form__footer-link">Regístrate</Link>
          </p>

        </div>
      </div>

    </div>
  )
}

function EyeIcon() {
  return <i className="fa-solid fa-eye" />
}

function EyeOffIcon() {
  return <i className="fa-solid fa-eye-slash" />
}

function GoogleIcon() {
  return <i className="fa-brands fa-google" style={{ color: '#4285F4' }} />
}


export default Login