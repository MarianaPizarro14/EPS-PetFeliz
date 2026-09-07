// src/utils/authStorage.js

/**
 * Obtiene el token guardado buscando primero en localStorage y luego en sessionStorage.
 */
export function getStoredToken() {
  return localStorage.getItem('token') || sessionStorage.getItem('token') || null
}

/**
 * Obtiene el usuario guardado buscando primero en localStorage y luego en sessionStorage.
 */
export function getStoredUser() {
  try {
    const userStr = localStorage.getItem('user') || sessionStorage.getItem('user')
    return userStr ? JSON.parse(userStr) : null
  } catch (e) {
    console.error('Error parsing stored user:', e)
    return null
  }
}

/**
 * Guarda las credenciales de autenticación según la preferencia del usuario.
 * @param {string} token - Token de autenticación
 * @param {object} user - Objeto de datos del usuario
 * @param {boolean} rememberMe - Si es true guarda en localStorage; si es false guarda en sessionStorage.
 */
export function setStoredAuth(token, user, rememberMe = true) {
  if (rememberMe) {
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(user))
    sessionStorage.removeItem('token')
    sessionStorage.removeItem('user')
  } else {
    sessionStorage.setItem('token', token)
    sessionStorage.setItem('user', JSON.stringify(user))
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }
}

/**
 * Actualiza los datos del usuario en el almacenamiento en el que se encuentre guardado activamente.
 */
export function updateStoredUser(updatedUser) {
  const userStr = JSON.stringify(updatedUser)
  if (localStorage.getItem('token')) {
    localStorage.setItem('user', userStr)
  } else if (sessionStorage.getItem('token')) {
    sessionStorage.setItem('user', userStr)
  } else {
    localStorage.setItem('user', userStr)
  }
}

/**
 * Elimina las credenciales de autenticación de ambos almacenamientos.
 */
export function clearStoredAuth() {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
  sessionStorage.removeItem('token')
  sessionStorage.removeItem('user')
}
