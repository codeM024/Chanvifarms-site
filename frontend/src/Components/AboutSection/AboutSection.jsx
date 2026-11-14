import { useState } from 'react'
import './AboutSection.css'
import Reveal from '../Motion/Reveal'
import headerImg from '../../assets/aboutlove.webp'

const features = [
  { icon: 'fa-leaf', title: 'Freshness First' },
  { icon: 'fa-users', title: 'Customer-Centric' },
  { icon: 'fa-seedling', title: 'Sustainability' },
  { icon: 'fa-hands-helping', title: 'Community Driven' },
]

const AboutSection = () => {
  const [imgLoaded, setImgLoaded] = useState(false)

  return (
    <section className="about-section">
      <div className="about-content">
        <Reveal className="about-info" delay={0.05}>
          <h1 className="section-eyebrow">About Chanvi Farms</h1>
          <h2>Fresh Organic Vegetables, Organic Fruits And Organic Exotic</h2>
          <p>At Chanvi Farms, we believe in the power of fresh, healthy food. Our mission is simple: to bring the farm-fresh goodness of organic vegetables, organic fruits and exotic directly to your home, ensuring you and your family enjoy the highest quality produce every day.</p>

          <div className="about-features">
            {features.map((f) => (
              <div className="feature" key={f.title}>
                <span className="feature-icon"><i className={`fas ${f.icon}`}></i></span>
                <h3>{f.title}</h3>
              </div>
            ))}
          </div>

          <a href="tel:+919900088164" className="call-now-btn btn-primary">
            <i className="fas fa-phone"></i>
            Call Now
          </a>
        </Reveal>
        <Reveal className="about-image">
          <div className={`about-image-frame ${imgLoaded ? '' : 'skeleton'}`}>
            <img
              src={headerImg}
              alt="Fresh produce"
              loading="lazy"
              decoding="async"
              className={`img-fade ${imgLoaded ? 'is-loaded' : ''}`}
              onLoad={() => setImgLoaded(true)}
              onError={() => setImgLoaded(true)}
            />
          </div>
        </Reveal>
      </div>
    </section>
  )
}

export default AboutSection
