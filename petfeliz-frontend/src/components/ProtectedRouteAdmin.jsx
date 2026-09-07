import React, { useEffect } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { getStoredToken, getStoredUser, clearStoredAuth } from '../utils/authStorage'

const INACTIVITY_TIMEOUT_MS = 5 * 60 * 1000 // 5 minutos de inactividad

export default function ProtectedRouteAdmin({ children }) {
  const token = getStoredToken()
  const user = getStoredUser()
  const navigate = useNavigate()

  useEffect(() => {
    if (!token) return

    let timer

    const performLogout = () => {
      clearStoredAuth()
      navigate('/admin-login', { replace: true })
    }

    const resetTimer = () => {
      if (timer) clearTimeout(timer)
      timer = setTimeout(performLogout, INACTIVITY_TIMEOUT_MS)
    }

    resetTimer()

    const events = ['mousemove', 'keydown', 'click', 'scroll']
    events.forEach((evt) => window.addEventListener(evt, resetTimer, { passive: true }))

    return () => {
      if (timer) clearTimeout(timer)
      events.forEach((evt) => window.removeEventListener(evt, resetTimer))
    }
  }, [token, navigate])

  if (!token || !user || user.rol !== 'admin') {
    return <Navigate to="/admin-login" replace />
  }

  return children
}
