import {useState, useContext, useEffect} from 'react'
import "./Navbar.css"
import {assets} from "../../assets/assets"
import { Link, useLocation } from 'react-router-dom';
import {StoreContext} from '../../Context/StoreContext'
import { NavContext } from '../../Context/NavContext'
import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';

const Navbar = ({setShowLogin}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { activeNav, setActiveNav } = useContext(NavContext);
  const {getTotalCartAmount,token, setToken} = useContext(StoreContext)
  const [visible, setVisible] = useState(true);
  const [showAnnouncement, setShowAnnouncement] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // Scroll to top when route changes
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location]);

  // Update active nav based on location
  useEffect(() => {
    const path = location.pathname.substring(1) || 'home';
    setActiveNav(path);
  }, [location, setActiveNav]);
  
  useEffect(() => {
    let lastScrollPosition = window.pageYOffset;
    let ticking = false;

    const handleScroll = () => {
      const currentScrollPos = window.pageYOffset;

      if (!ticking) {
        window.requestAnimationFrame(() => {
          // Show navbar when scrolling up or at the top
          setVisible(currentScrollPos < lastScrollPosition || currentScrollPos < 50);
          // Show announcement bar only at the top
          setShowAnnouncement(currentScrollPos === 0);
          // Update scroll position for threshold checks
          lastScrollPosition = currentScrollPos;
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  const logout = () => {
    localStorage.removeItem("token");
    setToken("");
    navigate("/")
  }

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const handleLocationClick = () => {
    window.open('https://www.google.com/maps/place/253,+2nd+Cross+Rd,+Neeladri+Nagar,+Electronics+City+Phase+1,+Electronic+City,+Bengaluru,+Karnataka+560100/@12.8396134,77.6456114,17z/data=!3m1!4b1!4m6!3m5!1s0x3bae6b7e8e5260b1:0x7ee78510f0bc1a42!8m2!3d12.8396134!4d77.6504823!16s%2Fg%2F11vsd0b16r?entry=ttu&g_ep=EgoyMDI1MDUxMS4wIKXMDSoJLDEwMjExNDUzSAFQAw%3D%3D', '_blank');
  };

  const handleLogoClick = (e) => {
    e.preventDefault();
    window.location.href = '/';
  };

  const toggleProfile = () => {
    setIsProfileOpen(!isProfileOpen);
  };

  // Close profile dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isProfileOpen && !event.target.closest('.navbar-profile')) {
        setIsProfileOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isProfileOpen]);
  
  return (
    <>
      <div className={`announcement-bar ${showAnnouncement ? 'show' : 'hide'}`}>
        <div className="announcement-content">
          <p className="discount-text">Order now and get <strong>20%</strong> Off on all products</p>
          <p className="location-text">
          <span className="location-icon">📍</span>
            <strong>Location: </strong>
            <span className="address" onClick={handleLocationClick} role="button" tabIndex={0}>
            2nd Cross Rd, Neeladri Nagar, Electronics City Phase 1
            </span>
          </p>
        </div>
      </div>
      <div className={`navbar ${visible ? 'navbar-visible' : 'hidden'}`}>
        <a href="/" onClick={handleLogoClick}><img src={assets.Chanvifarmlogo} alt="" className="logo"/></a>
        
        <button 
          className={`mobile-menu-button ${mobileMenuOpen ? 'active' : ''}`}
          onClick={toggleMobileMenu}
          aria-label="Toggle menu"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>

        <ul className={`navbar-menu ${mobileMenuOpen ? 'active' : ''}`}>
          <Link to='/' onClick={()=>{setActiveNav('home'); setMobileMenuOpen(false)}} className={activeNav === "home" ? "active" : ""}>Home</Link>
          <Link to='/about' onClick={()=>{setActiveNav('about'); setMobileMenuOpen(false)}} className={activeNav === "about" ? "active" : ""}>About Us</Link>
          <Link to='/shop' onClick={()=>{setActiveNav('shop'); setMobileMenuOpen(false)}} className={activeNav === "shop" ? "active" : ""}>Shop</Link>
          <Link to='/contact' onClick={()=>{setActiveNav('contact'); setMobileMenuOpen(false)}} className={activeNav === "contact" ? "active" : ""}>Contact Us</Link>
        </ul>

        <div className="navbar-right">
          <div className="navbar-search-icon">
              <Link to="/cart"><img src={assets.basket_icon} alt=""/></Link>
              <div className={getTotalCartAmount()===0?"":"dot"}></div>
          </div>    
          {!token ? 
            <button onClick={()=>setShowLogin(true)}>Sign in</button>
            :
            <div className={`navbar-profile ${isProfileOpen ? 'active' : ''}`} onClick={toggleProfile}>
              <img src={assets.profile_icon} alt="Profile"/>
              <ul className={`nav-profile-dropdown ${isProfileOpen ? 'show' : ''}`}>
                <li onClick={(e) => {
                  e.stopPropagation();
                  navigate('/myorders');
                  setIsProfileOpen(false);
                }}>
                  <img src={assets.bag_icon} alt="Orders" />
                  <p>My Orders</p>
                </li>
                <li onClick={(e) => {
                  e.stopPropagation();
                  logout();
                  setIsProfileOpen(false);
                }}>
                  <img src={assets.logout_icon} alt="Logout" />
                  <p>Logout</p>
                </li>
              </ul>
            </div>
          }
        </div>
      </div>
    </>
  )
}

Navbar.propTypes = {
  setShowLogin: PropTypes.func.isRequired
};

export default Navbar
