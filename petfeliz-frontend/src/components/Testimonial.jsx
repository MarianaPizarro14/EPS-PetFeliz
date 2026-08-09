function Testimonial({
  quote = '"Con PetFeliz ahora todo es más fácil. Puedo agendar citas, ver las recetas de Max y pagar en line sin complicaciones. Me siento mucho más tranquila sabiendo que todo está organizado."',
  name  = 'Manuela Giraldo',
  role  = 'Dueña de Max (Border Collie) · Laureles, Medellín',
  avatar = 'https://res.cloudinary.com/dedroug6v/image/upload/v1784696251/border-collie_u2libh.jpg',
}) {
  return (
    <section className="testimonial">
      <div className="container">
        <div className="testimonial__card">
          <div className="testimonial__quote-mark">99</div>
          <p className="testimonial__text">"{quote}"</p>
          <div className="testimonial__author">
            <img
              src={avatar}
              alt={name}
              className="testimonial__avatar-img"
              onError={e => { e.currentTarget.style.display = 'none' }}
            />
            <div>
              <div className="testimonial__name">{name}</div>
              <div className="testimonial__role">{role}</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Testimonial