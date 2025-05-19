import './Header.css'
import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'

const Header = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Add animation after component mounts for better entrance effect
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="header">
        <div className={`header-contents ${isVisible ? 'visible' : ''}`}>
            <h2>Farm-Fresh Vegetables & Fruits Delivered to Your Doorstep</h2>
            <p>
              Order online and enjoy the freshest vegetables and fruits, sourced directly from trusted local farmers. Experience quality, taste, and nutrition delivered right to your home.
            </p>
            <Link to="/shop">
              <button>
                <span>Explore Products</span>
                <i className="fas fa-arrow-right"></i>
              </button>
            </Link>
        </div>
    </div>
  )
}

export default Header
