function Button({ children, variant = 'primary', href, onClick, className = '' }) {
  const classes = `btn btn-${variant} ${className}`.trim()

  if (href) {
    return (
      <a href={href} className={classes}>
        {children}
      </a>
    )
  }

  return (
    <button className={classes} onClick={onClick}>
      {children}
    </button>
  )
}

export default Button