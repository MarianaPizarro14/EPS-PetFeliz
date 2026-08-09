import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'

const UserContext = createContext(null)

export function UserProvider({ children }) {
  const [usuario, setUsuarioState] = useState(() => {
    try {
      const savedUser = localStorage.getItem('user')
      return savedUser ? JSON.parse(savedUser) : { nombre: 'Usuario', foto: '' }
    } catch {
      return { nombre: 'Usuario', foto: '' }
    }
  })

  const [loadingUser, setLoadingUser] = useState(true)

  const setUsuario = useCallback((newUserData) => {
    setUsuarioState((prev) => {
      const updated = typeof newUserData === 'function' ? newUserData(prev) : newUserData
      try {
        localStorage.setItem('user', JSON.stringify(updated))
      } catch (e) {
        console.error('Error al guardar usuario en localStorage:', e)
      }
      return updated
    })
  }, [])

  const fetchUsuario = useCallback(async () => {
    const token = localStorage.getItem('token')
    if (!token) {
      setLoadingUser(false)
      return
    }

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/me`, {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      })

      if (res.ok) {
        const uData = await res.json()
        const fetchedUser = uData.usuario || uData
        setUsuario(fetchedUser)
      }
    } catch (err) {
      console.error('Error al cargar perfil en UserContext:', err)
    } finally {
      setLoadingUser(false)
    }
  }, [setUsuario])

  useEffect(() => {
    fetchUsuario()
  }, [fetchUsuario])

  return (
    <UserContext.Provider value={{ usuario, setUsuario, refreshUsuario: fetchUsuario, loadingUser }}>
      {children}
    </UserContext.Provider>
  )
}

export function useUser() {
  const context = useContext(UserContext)
  if (!context) {
    throw new Error('useUser debe ser usado dentro de un UserProvider')
  }
  return context
}
