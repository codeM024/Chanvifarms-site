import { Link } from 'react-router-dom'
import Reveal from '../Motion/Reveal'
import './TiffinPromo.css'

/** Slim home-page banner pointing to the tiffin menu. Static, no API calls. */
const TiffinPromo = () => (
  <Reveal y={16} className="tiffin-promo-wrap">
    <Link to="/tiffins" className="tiffin-promo">
      <span className="tiffin-promo-icon" aria-hidden="true">
        <i className="fas fa-bowl-rice"></i>
      </span>
      <span className="tiffin-promo-text">
        <strong>
          Organic <em>Tiffins</em> are here
        </strong>
        <span>Fresh breakfast &amp; dinner from our kitchen — order for pickup or delivery.</span>
      </span>
      <span className="tiffin-promo-cta">
        See menu <i className="fas fa-arrow-right" aria-hidden="true"></i>
      </span>
    </Link>
  </Reveal>
)

export default TiffinPromo
