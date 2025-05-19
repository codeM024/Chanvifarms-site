import { useEffect } from 'react'
import './AboutSection.css'
import headerImg from '../../assets/aboutlove.png'
import veggiesPromo from '../../assets/mixveggies.jpg'
import grapesPromo from '../../assets/Freshgrapes.jpeg'

const AboutSection = () => {
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-in');
        }
      });
    }, { threshold: 0.1 });

    document.querySelectorAll('.about-info, .about-image, .promo-card').forEach((element) => {
      observer.observe(element);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <div className="about-section">
      <div className="about-content">
        <div className="about-info">
          <h1>About Chanvi Farm</h1>
          <h2>Fresh Vegetables, Fruits And Exotic</h2>
          <p>At Chanvifarm, we believe in the power of fresh, healthy food. Our mission is simple: to bring the farm-fresh goodness of vegetables, fruits and exotic directly to your home, ensuring you and your family enjoy the highest quality produce every day.</p>
          
          <div className="about-features">
            <div className="feature">
              <i className="fas fa-leaf"></i>
              <h3>Freshness First</h3>
            </div>
            <div className="feature">
              <i className="fas fa-users"></i>
              <h3>Customer-Centric</h3>
            </div>
            <div className="feature">
              <i className="fas fa-seedling"></i>
              <h3>Sustainability</h3>
            </div>
            <div className="feature">
              <i className="fas fa-hands-helping"></i>
              <h3>Community Driven</h3>
            </div>
          </div>

          <a href="tel:+918919825034" className="call-now-btn">
          <i className="fas fa-phone"></i>
            Call Now
          </a>
        </div>
        <div className="about-image">
          <img src={headerImg} alt="Fresh produce" />
        </div>
      </div>

      <div className="promo-cards">
        <div className="promo-card vegetables" style={{backgroundImage: `url(${veggiesPromo})`}}>
          <div className="promo-content">
            <h3>Get 10% off</h3>
            <p>On Fresh vegetables</p>
          </div>
        </div>
        <div className="promo-card grapes" style={{backgroundImage: `url(${grapesPromo})`}}>
          <div className="discount-sticker">
            <span>5%</span>
            <span>OFF</span>
          </div>
          <div className="promo-content">
            <h3>Heavy Discount</h3>
            <p>On Fresh Fruits</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AboutSection