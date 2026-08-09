import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import './StatsStrip.css'

function StatsStrip({ stats, variant = 'default' }) {
  return (
    <section className={`stats-strip stats-strip--${variant}`}>
      <div className="container">
        <div className="stats-strip__grid">
          {stats.map((s, i) => (
            <div className="stats-strip__item" key={i}>
              <div className="stats-strip__icon">
                <FontAwesomeIcon icon={s.icon} />
              </div>
              <span className="stats-strip__num">{s.num}</span>
              <span className="stats-strip__label">{s.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default StatsStrip