import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

function ServiceCard({ icon, iconVariant, title, description, linkText, linkVariant, onOpenModal }) {
  return (
    <div className="service-card">
      <div className={`service-card__icon icon-${iconVariant}`}>
        <FontAwesomeIcon icon={icon} />
      </div>
      <h3>{title}</h3>
      <p>{description}</p>
      <button
        type="button"
        onClick={onOpenModal}
        className={`card-link link-${linkVariant}`}
        style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
      >
        {linkText}
      </button>
    </div>
  )
}

export default ServiceCard
