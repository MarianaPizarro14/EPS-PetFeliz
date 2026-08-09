import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import './ResetPassword.css'

const AVATARS = [
  { foto: 'https://res.cloudinary.com/dedroug6v/image/upload/v1782696387/foto_hombre_5_o1pjey.jpg', alt: 'Jose' },
  { foto: 'https://res.cloudinary.com/dedroug6v/image/upload/v1782696392/foto_mujer_3_okb9do.jpg', alt: 'Eliza' },
  { foto: 'https://res.cloudinary.com/dedroug6v/image/upload/v1782696391/foto_hombre_2_nuieol.jpg', alt: 'David' },
]

function ResetPassword() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') || ''
  const email = searchParams.get('email') || ''

  const [form, setForm] = useState({ password: '', confirmPassword: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const handleChange = (e) => {
    setForm({ ...form, [e.target.id]: e.target.value })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!token || !email) {
      setError('El enlace no es válido. Solicita uno nuevo desde "¿Olvidaste tu contraseña?".')
      return
    }

    if (form.password !== form.confirmPassword) {
      setError('Las contraseñas no coinciden.')
      return
    }

    setLoading(true)

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          email,
          password: form.password,
          password_confirmation: form.confirmPassword,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.message || 'No se pudo restablecer la contraseña.')
        setLoading(false)
        return
      }

      setSuccess(true)
      setLoading(false)
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
          src="https://res.cloudinary.com/dedroug6v/image/upload/v1783712100/conejito_cafe_owxwxd.jpg"
          alt="Conejo cafe"
          className="auth-split__bg"
        />
        <div className="auth-split__panel-content">

          <div className="auth-split__bottom">
            <h2 className="auth-split__title">
              Casi<br />listo.
            </h2>
            <p className="auth-split__desc">
              Crea una nueva contraseña y vuelve
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

          <Link to="/" className="auth-form__logo">EPS PetFeliz</Link>

          <Link to="/" className="auth-back">
            <i className="fa-solid fa-arrow-left" style={{ marginRight: '0.4rem' }}></i>
            Volver al inicio
          </Link>


          {!success ? (
            <>
              <div className="auth-form__header">
                <h1 className="auth-form__title">Restablece tu contraseña</h1>
                <p className="auth-form__subtitle">
                  Crea una nueva contraseña para <strong>{email || 'tu cuenta'}</strong>.
                </p>
              </div>

              {(!token || !email) && (
                <p className="auth-form__error">
                  Este enlace no es válido o está incompleto. Solicita uno nuevo desde{' '}
                  <Link to="/forgot-password" className="field__link">
                    ¿Olvidaste tu contraseña?
                  </Link>
                </p>
              )}

              {error && <p className="auth-form__error">{error}</p>}

              <form className="auth-form__fields" onSubmit={handleSubmit}>
                <div className="field">
                  <label className="field__label" htmlFor="password">Nueva contraseña</label>
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

                <button type="submit" className="auth-btn" disabled={loading}>
                  {loading ? 'Guardando...' : 'Restablecer contraseña →'}
                </button>
              </form>

              <p className="auth-form__footer">
                <Link to="/login" className="forgot__back-link">← Volver a iniciar sesión</Link>
              </p>
            </>
          ) : (
            <div className="forgot__success">
              <div className="forgot__success-icon"><CheckIcon /></div>
              <h1 className="auth-form__title">Contraseña actualizada</h1>
              <p className="forgot__success-text">
                Ya puedes iniciar sesión con tu nueva contraseña.
              </p>
              <button
                className="auth-btn"
                style={{ marginTop: '1.5rem' }}
                onClick={() => navigate('/login')}
              >
                Ir a iniciar sesión →
              </button>
            </div>
          )}

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

function CheckIcon() {
  return <i className="fa-solid fa-circle-check" style={{ fontSize: '1.8rem', color: '#059669' }} />
}


export default ResetPassword