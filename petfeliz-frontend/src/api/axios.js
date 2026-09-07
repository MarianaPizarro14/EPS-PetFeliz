import axios from 'axios'
import { getStoredToken } from '../utils/authStorage'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://botany-monthly-nappy.ngrok-free.dev/api',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'ngrok-skip-browser-warning': 'true',
  },
})

// Interceptor para incluir el token de autenticación dinámicamente si existe
api.interceptors.request.use((config) => {
  const token = getStoredToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export default api
