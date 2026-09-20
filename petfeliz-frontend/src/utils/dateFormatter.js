/**
 * Formateador universal de fechas y horas en español de Colombia (es-CO)
 */

export const formatDateCO = (dateStr) => {
  if (!dateStr) return ''
  try {
    if (typeof dateStr === 'string' && dateStr.includes('-')) {
      const parts = dateStr.split('-')
      if (parts.length === 3) {
        const year = parseInt(parts[0], 10)
        const month = parseInt(parts[1], 10) - 1
        const day = parseInt(parts[2], 10)
        const dateObj = new Date(year, month, day)
        return new Intl.DateTimeFormat('es-CO', {
          weekday: 'short',
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        }).format(dateObj)
      }
    }
    const d = new Date(dateStr)
    if (!isNaN(d.getTime())) {
      return new Intl.DateTimeFormat('es-CO', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }).format(d)
    }
    return dateStr
  } catch (e) {
    return dateStr
  }
}

export const formatTimeCO = (timeStr) => {
  if (!timeStr) return ''
  try {
    let hours = 0
    let minutes = 0

    if (typeof timeStr === 'string') {
      const isPM = timeStr.toLowerCase().includes('pm') || timeStr.toLowerCase().includes('p. m.')
      const isAM = timeStr.toLowerCase().includes('am') || timeStr.toLowerCase().includes('a. m.')
      const cleanStr = timeStr.replace(/(am|pm|a\. m\.|p\. m\.)/gi, '').trim()
      const parts = cleanStr.split(':')

      if (parts.length >= 2) {
        hours = parseInt(parts[0], 10)
        minutes = parseInt(parts[1], 10)
        if (isPM && hours < 12) hours += 12
        if (isAM && hours === 12) hours = 0
      } else {
        return timeStr
      }
    } else {
      return timeStr
    }

    const dateObj = new Date(2026, 0, 1, hours, minutes)
    return new Intl.DateTimeFormat('es-CO', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(dateObj)
  } catch (e) {
    return timeStr
  }
}
