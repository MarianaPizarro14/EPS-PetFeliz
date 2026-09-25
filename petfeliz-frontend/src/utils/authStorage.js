// src/utils/authStorage.js

/**
 * Obtiene el token guardado buscando primero en localStorage y luego en sessionStorage.
 */
export function getStoredToken() {
  return localStorage.getItem('token') || sessionStorage.getItem('token') || null
}

/**
 * Sanitiza un objeto de usuario eliminando fotos inválidas u obsoletas.
 */
export function sanitizeUserData(user) {
  if (!user || typeof user !== 'object') return user
  const sanitized = { ...user }
  if (sanitized.foto && !isValidAvatarUrl(sanitized.foto)) sanitized.foto = null
  if (sanitized.foto_perfil && !isValidAvatarUrl(sanitized.foto_perfil)) sanitized.foto_perfil = null
  return sanitized
}

/**
 * Verifica si una URL de foto de perfil es válida y no corresponde a fallbacks obsoletos.
 */
export function isValidAvatarUrl(url) {
  if (!url || typeof url !== 'string') return false
  const trimmed = url.trim()
  if (!trimmed) return false
  if (trimmed === 'default.jpg' || trimmed.includes('default.jpg')) return false
  if (trimmed.includes('vector_usuario')) return false
  return true
}

/**
 * Obtiene el usuario guardado buscando primero en localStorage y luego en sessionStorage.
 */
export function getStoredUser() {
  try {
    const userStr = localStorage.getItem('user') || sessionStorage.getItem('user')
    if (!userStr) return null
    const user = JSON.parse(userStr)
    return sanitizeUserData(user)
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
  const cleanUser = sanitizeUserData(user)
  if (rememberMe) {
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(cleanUser))
    sessionStorage.removeItem('token')
    sessionStorage.removeItem('user')
  } else {
    sessionStorage.setItem('token', token)
    sessionStorage.setItem('user', JSON.stringify(cleanUser))
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }
}

/**
 * Actualiza los datos del usuario en el almacenamiento en el que se encuentre guardado activamente.
 */
export function updateStoredUser(updatedUser) {
  const cleanUser = sanitizeUserData(updatedUser)
  const userStr = JSON.stringify(cleanUser)
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
