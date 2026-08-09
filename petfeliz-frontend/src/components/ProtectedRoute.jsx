import React, { useEffect } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'

const INACTIVITY_TIMEOUT_MS = 5 * 60 * 1000 // 5 minutos

function ProtectedRoute({ children }) {
  const token = localStorage.getItem('token')
  const navigate = useNavigate()

  useEffect(() => {
    if (!token) return

    let timer

    const performLogout = () => {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      navigate('/login', { replace: true })
    }

    const resetTimer = () => {
      if (timer) clearTimeout(timer)
      timer = setTimeout(performLogout, INACTIVITY_TIMEOUT_MS)
    }

    // Iniciar temporizador al montar
    resetTimer()

    // Escuchar interacciones en el dashboard privado
    const events = ['mousemove', 'keydown', 'click', 'scroll']
    events.forEach((evt) => window.addEventListener(evt, resetTimer, { passive: true }))

    return () => {
      if (timer) clearTimeout(timer)
      events.forEach((evt) => window.removeEventListener(evt, resetTimer))
    }
  }, [token, navigate])

  if (!token) {
    return <Navigate to="/login" replace />
  }

  return children
}

export default ProtectedRoute