import { Link } from 'react-router-dom'
import Hero from '../Hero'
import Services from '../Services'
import Tools from '../Tools'
import Testimonial from '../Testimonial'
import CtaBanner from '../CtaBanner'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

function Home() {
  return (
    <>
      <Hero
        interval={6000}
        slides={[
          {
            // Slide 1 — se mantienen los textos originales
            badgeIcon: "fa-solid fa-paw",
            badge: "Con la confianza de más de 10,000 dueños de mascotas",
            title: "Cuida a tu mascota",
            titlePrefix: "como",
            accent: "nunca",
            titleSuffix: "antes.",
            desc: "El refugio moderno para la salud de tu mascota. Accede a atención veterinaria de primer nivel, historiales digitales y soporte 24/7 en una plataforma intuitiva.",
            image: 'https://res.cloudinary.com/dedroug6v/image/upload/v1784697193/img-prin-1_rfrcdf.jpg',
            imageAlt: "Mascota feliz",
            ctas: (
              <>
                <Link to="/register" className="btn btn-primary btn-join">Únete ahora</Link>
                <button className="btn-how">
                  <FontAwesomeIcon icon="fa-regular fa-circle-play" />
                  Cómo funciona
                </button>
              </>
            )
          },
          {
            // Slide 2 — TODO: ajusta el texto a tu gusto
            badgeIcon: "fa-solid fa-shield-heart",
            badge: "Cobertura veterinaria sin sorpresas",
            title: "Planes de salud",
            titlePrefix: "hechos para",
            accent: "tu bolsillo",
            titleSuffix: "y tu mascota.",
            desc: "Consultas, vacunas y urgencias cubiertas con un solo plan mensual. Sin letra pequeña.",
            image: 'https://res.cloudinary.com/dedroug6v/image/upload/v1784697194/img-sec-2_qevkia.jpg',
            imageAlt: "Mascota en consulta veterinaria",
            ctas: (
              <>
                <Link to="/planes" className="btn btn-primary btn-join">Ver planes</Link>
              </>
            )
          },
          {
            // Slide 3 — TODO: ajusta el texto a tu gusto
            badgeIcon: "fa-solid fa-stethoscope",
            badge: "Atención cuando la necesitas",
            title: "Emergencias",
            titlePrefix: "atendidas",
            accent: "24/7",
            titleSuffix: "en toda la ciudad.",
            desc: "Nuestra red de urgencias está lista en cualquier momento del día para cuidar a tu mejor amigo.",
            image: 'https://res.cloudinary.com/dedroug6v/image/upload/v1784697198/img-sec-3_ht2hzt.jpg',
            imageAlt: "Veterinario atendiendo una emergencia",
            ctas: (
              <>
                <Link to="/nosotros" className="btn btn-primary btn-join">Conoce el equipo</Link>
              </>
            )
          },
          {
            // Slide 4 — TODO: ajusta el texto a tu gusto
            badgeIcon: "fa-solid fa-user-doctor",
            badge: "Más de 40 especialistas",
            title: "Un equipo",
            titlePrefix: "que",
            accent: "ama",
            titleSuffix: "lo que hace.",
            desc: "Veterinarios, tecnólogos y auxiliares comprometidos con la salud y el bienestar de tu mascota.",
            image: 'https://res.cloudinary.com/dedroug6v/image/upload/v1784697193/img-sec-4_xcbdiv.jpg',
            imageAlt: "Equipo veterinario",
            ctas: (
              <>
                <Link to="/nosotros" className="btn btn-primary btn-join">Conócenos</Link>
              </>
            )
          },
          {
            // Slide 5 — TODO: ajusta el texto a tu gusto
            badgeIcon: "fa-solid fa-heart",
            badge: "Miles de familias confían en nosotros",
            title: "Salud y amor",
            titlePrefix: "en cada",
            accent: "visita",
            titleSuffix: ".",
            desc: "Porque cada mascota merece cuidado experto y cada familia merece tranquilidad.",
            image: 'https://res.cloudinary.com/dedroug6v/image/upload/v1784697228/img-sec-5_eb966q.jpg',
            imageAlt: "Familia con su mascota",
            ctas: (
              <>
                <Link to="/register" className="btn btn-primary btn-join">Únete ahora</Link>
              </>
            )
          }
        ]}
      />
      <Services />
      <Tools />
      <Testimonial />
      <CtaBanner />
    </>
  )
}

export default Home