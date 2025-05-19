import { useEffect, useState } from 'react'
import './About.css'
import animeboyVision from '../../assets/animeboyVision.jpg'
import aboutboy from '../../assets/aboutboy.jpg'
import animeGirlVision from '../../assets/animeGirlWithBasket.jpg'
import founderImg from '../../assets/R.jpg'
import developerImg from '../../assets/M.jpg'
import { assets } from '../../assets/assets'

const About = () => {
  const [counts, setCounts] = useState({
    products: 0,
    team: 0,
    locations: 0
  });

  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    // Animation for counting numbers
    const animateCounts = () => {
      const duration = 4000;
      const steps = 100;
      const interval = duration / steps;
      
      let currentStep = 0;
      
      const timer = setInterval(() => {
        currentStep++;
        
        setCounts({
          products: Math.min(Math.floor((100 * currentStep) / steps), 100),
          team: Math.min(Math.floor((50 * currentStep) / steps), 50),
          locations: Math.min(Math.floor((10 * currentStep) / steps), 10)
        });

        if (currentStep >= steps) {
          clearInterval(timer);
        }
      }, interval);
    };

    // Animation for elements when they come into view
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-in');
          
          // Start counting animation when stats section comes into view
          if (entry.target.classList.contains('stats-section') && !hasAnimated) {
            setHasAnimated(true);
            animateCounts();
          }
        }
      });
    }, { threshold: 0.2 }); // Increased threshold for better timing

    // Observe all animated elements
    document.querySelectorAll('.card-section, .team-member, .instagram-card, .feature-circle, .stats-section').forEach((element) => {
      observer.observe(element);
    });

    return () => {
      observer.disconnect();
    };
  }, [hasAnimated]); // Added hasAnimated to dependencies

  return (
    <div className='about-container'>
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <h1>About Us</h1>
        </div>
      </section>

      {/* Specialty Section */}
      <div className="card-section specialty-card">
        <div className="card-image">
          <img src={animeboyVision} alt="Anime girl with vegetable basket" />
        </div>
        <div className="card-content">
          <h2>Our Specialty</h2>
          <h3>Why We&apos;re Different</h3>
          <p>At Chanvi Farm, we go beyond the ordinary. Unlike traditional grocery stores or large online platforms, we are committed to delivering farm-fresh produce that is responsibly sourced and carefully handled. Our passionate team is dedicated to promoting health, quality, and sustainability in every box we deliver. What sets us apart is our personalized approach — ensuring that every customer receives produce that&apos;s not only fresh but handpicked to meet your highest expectations.</p>
        </div>
      </div>

      {/* About Section */}
      <div className="card-section about-card">
        <div className="card-content">
          <h2>About Chanvi Farm</h2>
          <h3>Fresh Vegetables, Fruits And Exotic</h3>
          <p>At Chanvifarm, we believe in the power of fresh, healthy food. Our mission is simple: to bring the farm-fresh goodness of vegetables, fruits and exotic produce directly to your home, ensuring you and your family enjoy the highest quality produce every day.</p>
          
          <div className="about-features">
            <div className="feature">
              <i className="fas fa-leaf"></i>
              <h4>Freshness First</h4>
            </div>
            <div className="feature">
              <i className="fas fa-users"></i>
              <h4>Customer-Centric</h4>
            </div>
            <div className="feature">
              <i className="fas fa-seedling"></i>
              <h4>Sustainability</h4>
            </div>
            <div className="feature">
              <i className="fas fa-hands-helping"></i>
              <h4>Community Driven</h4>
            </div>
          </div>

          <a href="tel:+918919825034" className="call-now-btn">
            <i className="fas fa-phone"></i>
            Call Now
          </a>
        </div>
        <div className="card-image">
          <img src={aboutboy} alt="Fresh produce" />
        </div>
      </div>

      {/* Why Choose Us Section */}
      <div className="why-choose-section">
        <h2>Why Choose Us</h2>
        <h3>What Sets Us Apart</h3>
        <div className="features-grid">
          <div className="feature-circle">
            <div className="circle-icon">
              <i className="fas fa-leaf"></i>
            </div>
            <h4>Farm-Fresh Quality</h4>
            <p>Direct from farms to your doorstep, ensuring maximum freshness</p>
          </div>
          <div className="feature-circle">
            <div className="circle-icon">
              <i className="fas fa-clock"></i>
            </div>
            <h4>Pre-order a Day Before</h4>
            <p>Plan ahead and secure your fresh produce</p>
          </div>
          <div className="feature-circle">
            <div className="circle-icon">
              <i className="fas fa-truck"></i>
            </div>
            <h4>Doorstep Delivery</h4>
            <p>Convenient home delivery at your preferred time</p>
          </div>
          <div className="feature-circle">
            <div className="circle-icon">
              <i className="fas fa-boxes"></i>
            </div>
            <h4>Wide Variety</h4>
            <p>Extensive selection of fresh produce to choose from</p>
          </div>
          <div className="feature-circle">
            <div className="circle-icon">
              <i className="fas fa-tag"></i>
            </div>
            <h4>Affordable Pricing</h4>
            <p>Competitive prices without compromising quality</p>
          </div>
          <div className="feature-circle">
            <div className="circle-icon">
              <i className="fas fa-gift"></i>
            </div>
            <h4>Free Delivery</h4>
            <p>Free delivery on orders above ₹250</p>
          </div>
        </div>
      </div>

      {/* Vision Section */}
      <div className="card-section vision-card">
      <div className="card-image">
          <img src={animeGirlVision} alt="Anime girl with vision" />
        </div>
        <div className="card-content">
          <h2>Our Vision</h2>
          <h3>Join Our Mission</h3>
          <p>When you choose Chanvi Farm, you&apos;re not just buying fresh fruits and vegetables — you&apos;re becoming a part of something bigger. You&apos;re supporting local farmers, encouraging sustainable agriculture, and promoting a healthier lifestyle for yourself and your community.</p>
          <p>We invite you to join us on this journey toward cleaner, greener, and more conscious living. Let&apos;s make healthy eating a natural and joyful part of everyday life — together.</p>
        </div>
      </div>

      {/* Stats Section */}
      <div className="stats-section">
        <div className="stat-item">
          <div className="stat-icon">
            <i className="fas fa-carrot"></i>
          </div>
          <span className="stat-number">{counts.products}+</span>
          <span className="stat-label">Product Varieties</span>
        </div>
        <div className="stat-item">
          <div className="stat-icon">
            <i className="fas fa-users"></i>
          </div>
          <span className="stat-number">{counts.team}+</span>
          <span className="stat-label">Team Members</span>
        </div>
        <div className="stat-item">
          <div className="stat-icon">
            <i className="fas fa-map-marker-alt"></i>
          </div>
          <span className="stat-number">{counts.locations}+</span>
          <span className="stat-label">Delivery Locations</span>
        </div>
      </div>

      {/* Instagram Card */}
      <div className="instagram-card" onClick={() => window.open('https://www.instagram.com/chanvifarm', '_blank')}>
        <div className="instagram-content">
          <h3>Follow us on <strong>Instagram</strong></h3>
          <p>Get fresh updates and behind-the-scenes content</p>
        </div>
        <div className="instagram-icon">
          <i className="fab fa-instagram"></i>
          <i className="fas fa-arrow-right"></i>
        </div>
      </div>
    </div>
  )
}

export default About
