import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

function ServiceCard({ icon, iconVariant, title, description, linkText, linkVariant }) {
  return (
    <div className="service-card">
      <div className={`service-card__icon icon-${iconVariant}`}>
        <FontAwesomeIcon icon={icon} />
      </div>
      <h3>{title}</h3>
      <p>{description}</p>
      <a href="#" className={`card-link link-${linkVariant}`}>{linkText}</a>
    </div>
  )
}

export default ServiceCard