import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { setStoredAuth } from '../../utils/authStorage'
import './Login.css'

const REMEMBER_KEY = 'petfeliz_admin_remember'

export default function AdminLogin() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: 'admin@petfeliz.com', password: '' })
  const [rememberMe, setRememberMe] = useState(true)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  // Precargar credenciales guardadas si existen
  useEffect(() => {
    try {
      const saved = localStorage.getItem(REMEMBER_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (parsed?.email) {
          setForm((prev) => ({ ...prev, email: parsed.email }))
        }
      }
    } catch (err) {
      console.error('Error al leer datos guardados:', err)
    }
  }, [])

  const handleChange = (e) => {
    setForm({ ...form, [e.target.id]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(form),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.message || 'No se pudo iniciar sesión como administrador.')
        setLoading(false)
        return
      }

      setStoredAuth(data.token, data.user, rememberMe)

      if (rememberMe) {
        localStorage.setItem(REMEMBER_KEY, JSON.stringify({ email: form.email }))
      } else {
        localStorage.removeItem(REMEMBER_KEY)
      }

      navigate('/admin/dashboard')
    } catch {
      setError('Error de conexión al servidor de administración.')
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
          alt="Clínica Veterinaria PetFeliz"
          className="auth-split__bg"
        />
        <div className="auth-split__panel-content">
          <div className="auth-split__bottom">
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                background: 'rgba(255, 255, 255, 0.2)',
                backdropFilter: 'blur(8px)',
                padding: '0.35rem 0.75rem',
                borderRadius: '20px',
                fontSize: '0.8rem',
                fontWeight: 600,
                color: '#ffffff',
                marginBottom: '1rem',
                border: '1px solid rgba(255, 255, 255, 0.3)',
              }}
            >
              <i className="fa-solid fa-shield-halved"></i>
              <span>Portal de Administración — PetFeliz</span>
            </div>

            <h2 className="auth-split__title">
              Control Clínico<br />y Gestión EPS
            </h2>
            <p className="auth-split__desc">
              Acceso exclusivo para el personal directivo, veterinarios y administradores autorizados de EPS PetFeliz.
            </p>
          </div>
        </div>
      </div>

      {/* ── Panel derecho — formulario ── */}
      <div className="auth-split__panel auth-split__panel--form">
        <div className="auth-form">
          <Link to="/" className="auth-form__logo">
            EPS PetFeliz Admin
          </Link>

          <Link to="/" className="auth-back">
            <i className="fa-solid fa-arrow-left" style={{ marginRight: '0.4rem' }}></i>
            Volver al inicio
          </Link>

          <div className="auth-form__header">
            <h1 className="auth-form__title">Panel Administrativo</h1>
            <p className="auth-form__subtitle">Ingresa tus credenciales oficiales de acceso.</p>
          </div>

          {error && <p className="auth-form__error">{error}</p>}

          <form className="auth-form__fields" onSubmit={handleSubmit}>
            <div className="field">
              <label className="field__label" htmlFor="email">
                Correo institucional
              </label>
              <input
                id="email"
                type="email"
                className="field__input"
                placeholder="admin@petfeliz.com"
                autoComplete="email"
                value={form.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="field">
              <div className="field__row">
                <label className="field__label" htmlFor="password">
                  Contraseña de Administrador
                </label>
              </div>
              <div className="field__password-wrap">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  className="field__input"
                  placeholder="••••••••"
                  autoComplete="current-password"
                  value={form.password}
                  onChange={handleChange}
                  required
                />
                <button
                  type="button"
                  className="field__toggle-password"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  tabIndex={-1}
                >
                  <i className={`fa-solid ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
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
                <span>Recordar sesión de administración</span>
              </label>
            </div>

            <button type="submit" className="auth-btn" disabled={loading}>
              {loading ? (
                <>
                  <i className="fa-solid fa-circle-notch fa-spin" style={{ marginRight: '0.5rem' }}></i>
                  <span>Verificando Privilegios...</span>
                </>
              ) : (
                'Ingresar al Panel Admin →'
              )}
            </button>
          </form>

          <p className="auth-form__footer" style={{ marginTop: '2.5rem', textAlign: 'center' }}>
            ¿Eres paciente o cliente?{' '}
            <Link to="/login" className="auth-form__footer-link">
              Ir al Login de Clientes
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
