import { useState } from 'react'
import { useGoogleLogin } from '@react-oauth/google'
import { useNavigate } from 'react-router-dom'
import { setStoredAuth } from '../utils/authStorage'

export function useGoogleAuth(setError) {
  const navigate = useNavigate()
  const [googleLoading, setGoogleLoading] = useState(false)

  const rawClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
  const isConfigured = rawClientId && rawClientId.trim() !== '' && !rawClientId.includes('TU_GOOGLE_CLIENT_ID')

  const triggerLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setGoogleLoading(true)
      if (setError) setError('')

      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/auth/google`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify({
            token: tokenResponse.access_token,
            token_type: 'access_token',
          }),
        })

        const data = await res.json()

        if (!res.ok) {
          if (setError) setError(data.message || 'No se pudo iniciar sesión con Google.')
          setGoogleLoading(false)
          return
        }

        setStoredAuth(data.token, data.user, true)

        if (data.user?.rol === 'admin') {
          navigate('/admin/dashboard')
        } else {
          navigate('/dashboard-client')
        }
      } catch (err) {
        console.error('Error Google Auth:', err)
        if (setError) setError('No se pudo conectar con el servidor. Intenta de nuevo.')
        setGoogleLoading(false)
      }
    },
    onError: (errorResponse) => {
      console.error('Google OAuth Error:', errorResponse)
      setGoogleLoading(false)
      if (setError) setError('La autenticación con Google fue cancelada o falló.')
    },
  })

  const loginWithGoogle = () => {
    if (googleLoading) return

    if (!isConfigured) {
      if (setError) {
        setError('El inicio de sesión con Google no está configurado aún. Por favor agrega tu VITE_GOOGLE_CLIENT_ID en el archivo .env.')
      }
      return
    }

    setGoogleLoading(true)
    try {
      triggerLogin()
    } catch (err) {
      console.error('Error al abrir popup de Google:', err)
      if (setError) setError('No se pudo abrir la ventana de Google OAuth.')
      setGoogleLoading(false)
    }
  }

  return { loginWithGoogle, googleLoading }
}
