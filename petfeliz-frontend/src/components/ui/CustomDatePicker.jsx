// CustomDatePicker.jsx
import React, { useState, useEffect, useRef } from 'react'
import './CustomDatePicker.css'

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
]

const DIAS_SEMANA = ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá']

export default function CustomDatePicker({
  value,
  onChange,
  placeholder = 'Selecciona una fecha',
  maxDate = new Date().toISOString().split('T')[0]
}) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef(null)

  const now = new Date()
  const [viewYear, setViewYear] = useState(now.getFullYear())
  const [viewMonth, setViewMonth] = useState(now.getMonth())

  // Sincronizar vista con la fecha seleccionada cuando cambia el valor o al abrir
  useEffect(() => {
    if (value) {
      const parts = value.split('-').map(Number)
      if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1])) {
        setViewYear(parts[0])
        setViewMonth(parts[1] - 1)
      }
    }
  }, [value, isOpen])

  // Cerrar emergente al hacer clic fuera del componente
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Rango de años (desde 1990 hasta año actual)
  const currentYear = now.getFullYear()
  const years = []
  for (let y = currentYear; y >= 1990; y--) {
    years.push(y)
  }

  // Navegación de mes
  const handlePrevMonth = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (viewMonth === 0) {
      setViewMonth(11)
      setViewYear((prev) => prev - 1)
    } else {
      setViewMonth((prev) => prev - 1)
    }
  }

  const handleNextMonth = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (viewMonth === 11) {
      setViewMonth(0)
      setViewYear((prev) => prev + 1)
    } else {
      setViewMonth((prev) => prev + 1)
    }
  }

  // Formato visual legible en español: "15 de Abr, 2022"
  const formatDisplay = () => {
    if (!value) return ''
    const parts = value.split('-').map(Number)
    if (parts.length !== 3 || isNaN(parts[0]) || isNaN(parts[1]) || isNaN(parts[2])) return value
    const [y, m, d] = parts
    if (!m || m < 1 || m > 12) return value
    return `${d} ${MESES[m - 1].slice(0, 3)}, ${y}`
  }

  // Selección de día
  const handleSelectDay = (dayNum) => {
    const mStr = String(viewMonth + 1).padStart(2, '0')
    const dStr = String(dayNum).padStart(2, '0')
    const dateStr = `${viewYear}-${mStr}-${dStr}`

    if (maxDate && dateStr > maxDate) {
      return
    }

    onChange(dateStr)
    setIsOpen(false)
  }

  // Acciones rápidas
  const handleClear = (e) => {
    e.preventDefault()
    e.stopPropagation()
    onChange('')
    setIsOpen(false)
  }

  const handleSetToday = (e) => {
    e.preventDefault()
    e.stopPropagation()
    const todayY = now.getFullYear()
    const todayM = String(now.getMonth() + 1).padStart(2, '0')
    const todayD = String(now.getDate()).padStart(2, '0')
    const todayStr = `${todayY}-${todayM}-${todayD}`

    if (!maxDate || todayStr <= maxDate) {
      onChange(todayStr)
    }
    setIsOpen(false)
  }

  // Días del mes actual y desfase
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay()

  return (
    <div className="cdp-container" ref={containerRef}>
      {/* Botón/Input disparador */}
      <button
        type="button"
        className={`cdp-trigger ${isOpen ? 'cdp-trigger--active' : ''} ${value ? 'cdp-trigger--has-val' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
      >
        <span className="cdp-trigger__text">
          {formatDisplay() || placeholder}
        </span>
        <span className="cdp-trigger__icon-wrap">
          <i className="fa-solid fa-calendar-days"></i>
        </span>
      </button>

      {/* Calendario Flotante / Popover */}
      {isOpen && (
        <div className="cdp-popover">
          {/* Cabecera de navegación */}
          <div className="cdp-header">
            <button
              type="button"
              className="cdp-nav-btn"
              onClick={handlePrevMonth}
              title="Mes anterior"
            >
              <i className="fa-solid fa-chevron-left"></i>
            </button>

            <div className="cdp-selects">
              <select
                className="cdp-select cdp-select--month"
                value={viewMonth}
                onChange={(e) => setViewMonth(Number(e.target.value))}
              >
                {MESES.map((m, idx) => (
                  <option key={m} value={idx}>{m}</option>
                ))}
              </select>

              <select
                className="cdp-select cdp-select--year"
                value={viewYear}
                onChange={(e) => setViewYear(Number(e.target.value))}
              >
                {years.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>

            <button
              type="button"
              className="cdp-nav-btn"
              onClick={handleNextMonth}
              title="Mes siguiente"
            >
              <i className="fa-solid fa-chevron-right"></i>
            </button>
          </div>


          {/* Días de la semana */}
          <div className="cdp-weekdays">
            {DIAS_SEMANA.map((d) => (
              <span key={d} className="cdp-weekday">{d}</span>
            ))}
          </div>

          {/* Rejilla de Días */}
          <div className="cdp-days">
            {Array.from({ length: firstDayOfWeek }).map((_, i) => (
              <div key={`empty-${i}`} className="cdp-day cdp-day--empty" />
            ))}

            {Array.from({ length: daysInMonth }).map((_, i) => {
              const dayNum = i + 1
              const mStr = String(viewMonth + 1).padStart(2, '0')
              const dStr = String(dayNum).padStart(2, '0')
              const dateStr = `${viewYear}-${mStr}-${dStr}`

              const isSelected = value === dateStr
              const isToday =
                now.getFullYear() === viewYear &&
                now.getMonth() === viewMonth &&
                now.getDate() === dayNum
              const isDisabled = maxDate ? dateStr > maxDate : false

              return (
                <button
                  key={dayNum}
                  type="button"
                  disabled={isDisabled}
                  className={
                    'cdp-day' +
                    (isSelected ? ' cdp-day--selected' : '') +
                    (isToday ? ' cdp-day--today' : '') +
                    (isDisabled ? ' cdp-day--disabled' : '')
                  }
                  onClick={() => handleSelectDay(dayNum)}
                >
                  {dayNum}
                </button>
              )
            })}
          </div>

          {/* Pie de acciones */}
          <div className="cdp-footer">
            <button type="button" className="cdp-action-btn cdp-action-btn--clear" onClick={handleClear}>
              Limpiar
            </button>
            <button type="button" className="cdp-action-btn cdp-action-btn--today" onClick={handleSetToday}>
              Hoy
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
