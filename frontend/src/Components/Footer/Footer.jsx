import './Footer.css'
import {assets} from '../../assets/assets'
import { Link } from 'react-router-dom'

const Footer = () => {
  return (
    <div className="footer" id='footer'>
        <div className="cta-section">
            <div className="cta-box">
                <div className="cta-container">
                    <div className="cta-content-left">
                        <Link to="/">
                            <img src={assets.Chanvifarmlogo} alt="Chanvi Farms Logo" className="logo"/>
                        </Link>
                        <p>Your trusted source for farm-fresh produce, delivered right to your doorstep with care and quality.</p>
                    </div>
                    <div className="cta-image">
                        <img src="/src/assets/delivery.jpg" alt="Fresh delivery" />
                        <div className="cta-content">
                            <h2>Farm Fresh Delivery At your doorstep!</h2>
                            <a href="tel:+918919825034" className="cta-button">
                                <i className="fas fa-phone"></i>
                                Call Now
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div className="footer-content">
            <div className="footer-content-left">
                <div className="footer-intro">
                    <h2>Connect With Us</h2>
                    <p>Follow us on social media for updates, tips, and fresh produce inspiration!</p>
                </div>
                <div className="footer-social-icons">
                    <a href="https://facebook.com/chanvifarms" target="_blank" rel="noopener noreferrer" className="social-icon">
                        <i className="fab fa-facebook-f"></i>
                    </a>
                    <a href="https://twitter.com/chanvifarms" target="_blank" rel="noopener noreferrer" className="social-icon">
                        <i className="fab fa-twitter"></i>
                    </a>
                    <a href="https://instagram.com/chanvifarms" target="_blank" rel="noopener noreferrer" className="social-icon">
                        <i className="fab fa-instagram"></i>
                    </a>
                </div>
            </div>

            <div className="footer-content-center">
                <div className="footer-section">
                    <h2>Categories</h2>
                    <ul>
                        <li><Link to="/shop?category=vegetables"><i className="fas fa-chevron-right"></i> Vegetables</Link></li>
                        <li><Link to="/shop?category=fruits"><i className="fas fa-chevron-right"></i> Fruits</Link></li>
                        <li><Link to="/shop?category=exotic vegetables"><i className="fas fa-chevron-right"></i> Exotic Vegetables</Link></li>
                        <li><Link to="/shop?category=exotic fruits"><i className="fas fa-chevron-right"></i> Exotic Fruits</Link></li>
                        <li><Link to="/shop?category=meat"><i className="fas fa-chevron-right"></i> Meat</Link></li>
                    </ul>
                </div>
                <div className="footer-section">
                    <h2>Quick Links</h2>
                    <ul>
                        <li><Link to="/about"><i className="fas fa-chevron-right"></i> About Us</Link></li>
                        <li><Link to="/contact"><i className="fas fa-chevron-right"></i> Contact Us</Link></li>
                        <li><Link to="/terms"><i className="fas fa-chevron-right"></i> Terms & Conditions</Link></li>
                        <li><Link to="/privacy"><i className="fas fa-chevron-right"></i> Privacy Policy</Link></li>
                        <li><Link to="/faq"><i className="fas fa-chevron-right"></i> FAQ</Link></li>
                    </ul>
                </div>
            </div>

            <div className="footer-content-right">
                <h2>Contact Us</h2>
                <ul>
                    <li>
                        <i className="fas fa-map-marker-alt"></i>
                        <span>Shop No - 2nd Cross Rd, Neeladri Nagar, Electronics City Phase 1, Electronic City, Bengaluru, Karnataka 560100</span>
                    </li>
                    <li>
                        <i className="fas fa-phone"></i>
                        <a href="tel:+918919825034">+91 8919825034</a>
                    </li>
                    <li>
                        <i className="fas fa-envelope"></i>
                        <a href="mailto:support@chanvifarms.com">support@chanvifarms.com</a>
                    </li>
                    <li>
                        <i className="fas fa-clock"></i>
                        <span>Monday - Sunday: 8:00 AM - 8:00 PM</span>
                    </li>
                </ul>
            </div>
        </div>
        
        <div className="footer-bottom">
            <hr />
            <p className="footer-copyright">
                Copyright © {new Date().getFullYear()} Chanvi Farms - All Rights Reserved
            </p>
            <div className="footer-terms">
                <Link to="/terms">Terms of Service</Link>
                <span className="separator">|</span>
                <Link to="/privacy">Privacy Policy</Link>
            </div>
            <div className="footer-attribution">
                <p className="credit-text">Designed with <i className="fas fa-heart"></i> by</p>
                <a
                    href="https://vali024.github.io/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="designer-link"
                >
                    <span className="designer-name">Vali</span>
                    <i className="fas fa-external-link-alt link-icon"></i>
                </a>
            </div>
        </div>
    </div>
  )
}

export default Footer