import axios from 'axios'
import { getStoredToken, clearStoredAuth } from '../utils/authStorage'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'ngrok-skip-browser-warning': 'true',
  },
})

// Interceptor de petición para adjuntar Bearer Token
api.interceptors.request.use((config) => {
  const token = getStoredToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Interceptor de respuesta para detectar 401 Unauthorized en peticiones protegidas (invalidación de token / sesión cerrada)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      const requestUrl = error.config?.url || ''
      // NO activar la redirección de sesión cerrada si la petición es un intento de login o registro
      const isAuthEndpoint = requestUrl.includes('/login') || requestUrl.includes('/register') || requestUrl.includes('/auth/google')

      if (!isAuthEndpoint && !window.location.pathname.includes('/login')) {
        clearStoredAuth()
        sessionStorage.setItem('logout_reason', 'Tu sesión se cerró o ha caducado.')
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export default api
