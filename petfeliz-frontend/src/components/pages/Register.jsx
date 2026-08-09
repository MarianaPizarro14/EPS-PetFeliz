import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import './Register.css'

const AVATARS = [
  { foto: 'https://res.cloudinary.com/dedroug6v/image/upload/v1782696387/foto_hombre_5_o1pjey.jpg', alt: 'Jose' },
  { foto: 'https://res.cloudinary.com/dedroug6v/image/upload/v1782696392/foto_mujer_3_okb9do.jpg', alt: 'Eliza' },
  { foto: 'https://res.cloudinary.com/dedroug6v/image/upload/v1782696391/foto_hombre_2_nuieol.jpg', alt: 'David' },
]

function Register() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const handleChange = (e) => {
    setForm({ ...form, [e.target.id]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!acceptedTerms) {
      setError('Debes aceptar los Términos de servicio y la Política de privacidad.')
      return
    }

    if (form.password !== form.confirmPassword) {
      setError('Las contraseñas no coinciden.')
      return
    }

    setLoading(true)

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: `${form.firstName} ${form.lastName}`.trim(),
          email: form.email,
          password: form.password,
          password_confirmation: form.confirmPassword,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        // Si vienen errores de validación (ej. email duplicado), muestra el primero
        const firstError = data.errors
          ? Object.values(data.errors)[0][0]
          : data.message
        setError(firstError || 'No se pudo completar el registro.')
        setLoading(false)
        return
      }

      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))

      navigate('/dashboard-client')
    } catch {
      setError('No se pudo conectar con el servidor. Intenta de nuevo.')
      setLoading(false)
    }
  }

  return (
    <div className="auth-split">

      <div className="auth-split__panel auth-split__panel--image">
        <div className="auth-split__overlay" />
        <img
          src="https://res.cloudinary.com/dedroug6v/image/upload/v1783709700/gato_lindo_yhnvkj.jpg"
          alt="Gato lindo mirando a la cámara"
          className="auth-split__bg"
        />
        <div className="auth-split__panel-content">

          <div className="auth-split__bottom">
            <h2 className="auth-split__title">
              ¡Empieza hoy<br />sin costo!
            </h2>
            <p className="auth-split__desc">
              Regístrate y accede a atención veterinaria,
              historial digital y soporte 24/7.
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


          <div className="auth-form__header">
            <h1 className="auth-form__title">Crea tu cuenta</h1>
            <p className="auth-form__subtitle">Empieza gratis, sin tarjeta de crédito.</p>
          </div>

          <button className="auth-social-btn">
            <GoogleIcon />
            Registrarse con Google
          </button>

          <div className="auth-divider"><span>O CON TU CORREO</span></div>

          {error && <p className="auth-form__error">{error}</p>}

          <form className="auth-form__fields" onSubmit={handleSubmit}>
            <div className="field-row-2">
              <div className="field">
                <label className="field__label" htmlFor="firstName">Nombre</label>
                <input
                  id="firstName" type="text" className="field__input"
                  placeholder="Juan" autoComplete="given-name"
                  value={form.firstName} onChange={handleChange} required
                />
              </div>
              <div className="field">
                <label className="field__label" htmlFor="lastName">Apellido</label>
                <input
                  id="lastName" type="text" className="field__input"
                  placeholder="Pérez" autoComplete="family-name"
                  value={form.lastName} onChange={handleChange} required
                />
              </div>
            </div>

            <div className="field">
              <label className="field__label" htmlFor="email">Correo electrónico</label>
              <input
                id="email" type="email" className="field__input"
                placeholder="correo@ejemplo.com" autoComplete="email"
                value={form.email} onChange={handleChange} required
              />
            </div>

            <div className="field">
              <label className="field__label" htmlFor="password">Contraseña</label>
              <div className="field__password-wrap">
                <input
                  id="password" type={showPassword ? 'text' : 'password'} className="field__input"
                  placeholder="Mínimo 8 caracteres" autoComplete="new-password"
                  value={form.password} onChange={handleChange} minLength={8} required
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

            <div className="field">
              <label className="field__label" htmlFor="confirmPassword">Confirmar contraseña</label>
              <div className="field__password-wrap">
                <input
                  id="confirmPassword" type={showConfirmPassword ? 'text' : 'password'} className="field__input"
                  placeholder="Repite tu contraseña" autoComplete="new-password"
                  value={form.confirmPassword} onChange={handleChange} minLength={8} required
                />
                <button
                  type="button"
                  className="field__toggle-password"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  aria-label={showConfirmPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  tabIndex={-1}
                >
                  {showConfirmPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
              {form.confirmPassword && form.password !== form.confirmPassword && (
                <p className="field__hint field__hint--error">Las contraseñas no coinciden.</p>
              )}
            </div>

            <label className="field-check">
              <input
                type="checkbox" className="field-check__input"
                checked={acceptedTerms}
                onChange={(e) => setAcceptedTerms(e.target.checked)}
              />
              <span className="field-check__text">
                Acepto los{' '}
                <Link to="/terminos-condiciones" className="field__link">Términos de servicio</Link>
                {' '}y la{' '}
                <Link to="/politica-privacidad" className="field__link">Política de privacidad</Link>
              </span>
            </label>

            <button type="submit" className="auth-btn" disabled={loading}>
              {loading ? 'Creando cuenta...' : 'Crear cuenta →'}
            </button>
          </form>

          <p className="auth-form__footer">
            ¿Ya tienes una cuenta?{' '}
            <Link to="/login" className="auth-form__footer-link">Inicia sesión</Link>
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


export default Register