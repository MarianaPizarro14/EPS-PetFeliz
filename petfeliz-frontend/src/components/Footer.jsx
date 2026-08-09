import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faWhatsapp, faInstagram, faFacebook } from '@fortawesome/free-brands-svg-icons'
import { Link } from 'react-router-dom'

function Footer() {
  return (
    <footer className="footer" id="contacto">
      <div className="container">
        <div className="footer__grid">
          <div>
            <div className="footer__brand-name">EPS PetFeliz</div>
            <p className="footer__brand-desc">
              La EPS veterinaria diseñada para la vida moderna de las mascotas.
              Donde la compasión se encuentra con la innovación.
            </p>
          </div>
          <div>
            <div className="footer__col-title">Explorar</div>
            <ul className="footer__links">
              <li><Link to="/planes">Planes de precios</Link></li>
              <li><Link to="/red-especialistas">Red de especialistas</Link></li>
              <li><Link to="/emergencias">Emergencias</Link></li>
            </ul>
          </div>
          <div>
            <div className="footer__col-title">Empresa</div>
            <ul className="footer__links">
              <li><Link to="/historias-cuidadores">Historias de cuidadores</Link></li>
              <li><Link to="/kit-de-prensa">Kit de prensa</Link></li>
              <li><Link to="/politica-privacidad">Política de privacidad</Link></li>
              <li><Link to="/terminos-condiciones">Términos y Condiciones</Link></li>
            </ul>
          </div>
          <div>
            <div className="footer__col-title">Contáctenos</div>
            <div className="footer__social">
              <a href="#" target="_blank" rel="noopener noreferrer" aria-label="WhatsApp">
                <FontAwesomeIcon icon={faWhatsapp} />
              </a>
              <a href="https://www.instagram.com/epspetfeliz?igsh=MTRuOWdua3UyYnls" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                <FontAwesomeIcon icon={faInstagram} />
              </a>
              <a href="https://www.facebook.com/share/1H9QL27i55/?mibextid=wwXIfr" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
                <FontAwesomeIcon icon={faFacebook} />
              </a>
              </div>
            <p className="footer__copyright">© 2026 EPS PetFeliz Inc. All rights reserved.</p>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer