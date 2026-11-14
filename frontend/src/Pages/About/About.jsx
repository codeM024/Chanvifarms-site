import { useEffect, useRef, useState } from "react";
import PropTypes from "prop-types";
import "./About.css";
import Reveal from "../../Components/Motion/Reveal";
import animeboyVision from "../../assets/animeboyVision.webp";
import aboutboy from "../../assets/aboutboy.webp";
import animeGirlVision from "../../assets/animeGirlWithBasket.webp";

const STAT_TARGETS = { products: 100, team: 50, locations: 10 };

const whyChooseUs = [
  { icon: "fa-leaf", title: "Farm-Fresh Quality", text: "Direct from farms to your doorstep, ensuring maximum freshness" },
  { icon: "fa-clock", title: "Pre-order a Day Before", text: "Plan ahead and secure your fresh produce" },
  { icon: "fa-truck", title: "Doorstep Delivery", text: "Convenient home delivery at your preferred time" },
  { icon: "fa-boxes", title: "Wide Variety", text: "Extensive selection of fresh produce to choose from" },
  { icon: "fa-tag", title: "Affordable Pricing", text: "Competitive prices without compromising quality" },
  { icon: "fa-gift", title: "Above 500 order", text: "Get an 5% discount on order total" },
];

const reviews = [
  {
    name: "Mohan",
    stars: 5,
    text: "The freshness of Organic vegetables from Chanvi Farms is unmatched! I've been ordering for 3 months now and have never been disappointed. Their customer service is excellent too!",
  },
  {
    name: "Kiran Kumar",
    stars: 4.5,
    text: "What I love most about Chanvi Farms is their commitment to quality. The fruits are always fresh and perfectly ripe. Their pre-order system makes planning meals so much easier!",
  },
  {
    name: "Manikanta",
    stars: 5,
    text: "Chanvi Farms takes the stress out of grocery shopping. As someone always on the go, I truly appreciate their timely service and fresh fruits and veggies.",
  },
  {
    name: "Sai Navya",
    stars: 4.5,
    text: "Being a working professional, Chanvi Farms has made my life easier. Their produce is always fresh, and the doorstep delivery is super convenient. Highly recommended!",
  },
  {
    name: "Purna Chandra",
    stars: 5,
    text: "Balancing work and life isn’t easy, but Chanvi Farms makes eating healthy effortless with their top-notch produce and seamless delivery.",
  },
];

const Stars = ({ value }) => (
  <div className="rating" aria-label={`${value} out of 5 stars`}>
    {[1, 2, 3, 4, 5].map((n) => (
      <i
        key={n}
        className={
          value >= n ? "fas fa-star" : value >= n - 0.5 ? "fas fa-star-half-alt" : "far fa-star"
        }
        aria-hidden="true"
      ></i>
    ))}
  </div>
);

const LazyImg = ({ src, alt }) => {
  const [loaded, setLoaded] = useState(false);
  const imgRef = useRef(null);
  // Cached images can finish before React attaches onLoad
  useEffect(() => {
    if (imgRef.current?.complete) setLoaded(true);
  }, []);
  return (
    <img
      ref={imgRef}
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      className={`img-fade ${loaded ? "is-loaded" : ""}`}
      onLoad={() => setLoaded(true)}
    />
  );
};

Stars.propTypes = { value: PropTypes.number };
LazyImg.propTypes = { src: PropTypes.string, alt: PropTypes.string };

const About = () => {
  const [counts, setCounts] = useState({ products: 0, team: 0, locations: 0 });
  const statsRef = useRef(null);
  const hasAnimated = useRef(false);

  // Count-up animation, started once when the stats band scrolls into view
  useEffect(() => {
    const node = statsRef.current;
    if (!node) return undefined;
    let frame;

    const animateCounts = () => {
      const duration = 1600;
      const start = performance.now();
      const tick = (now) => {
        const t = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - t, 3);
        setCounts({
          products: Math.round(STAT_TARGETS.products * eased),
          team: Math.round(STAT_TARGETS.team * eased),
          locations: Math.round(STAT_TARGETS.locations * eased),
        });
        if (t < 1) frame = requestAnimationFrame(tick);
      };
      frame = requestAnimationFrame(tick);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasAnimated.current) {
            hasAnimated.current = true;
            animateCounts();
            observer.disconnect();
          }
        });
      },
      { threshold: 0.3 }
    );
    observer.observe(node);

    return () => {
      observer.disconnect();
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div className="about-container">
      {/* Hero Section */}
      <section className="about-hero">
        <div className="about-hero-content">
          <span className="about-eyebrow">Our story</span>
          <h1>About Us</h1>
          <p>Farm-fresh, organic goodness delivered from local growers to your doorstep.</p>
        </div>
      </section>

      {/* Specialty Section */}
      <Reveal className="card-section specialty-card">
        <div className="card-image">
          <LazyImg src={animeboyVision} alt="Anime girl with vegetable basket" />
        </div>
        <div className="card-content">
          <h2>Our Specialty</h2>
          <h3>Why We&apos;re Different</h3>
          <p>
            At Chanvi Farms, we go beyond the ordinary. Unlike traditional
            grocery stores or large online platforms, we are committed to
            delivering farm-fresh produce that is responsibly sourced and
            carefully handled. Our passionate team is dedicated to promoting
            health, quality, and sustainability in every box we deliver. What
            sets us apart is our personalized approach — ensuring that every
            customer receives produce that&apos;s not only fresh but handpicked
            to meet your highest expectations.
          </p>
        </div>
      </Reveal>

      {/* About Section */}
      <Reveal className="card-section about-card reverse">
        <div className="card-content">
          <h2>About Chanvi Farms</h2>
          <h3>Fresh Organic Vegetables, Organic Fruits And Exotic</h3>
          <p>
            At Chanvifarm, we believe in the power of fresh, healthy food. Our
            mission is simple: to bring the farm-fresh goodness of Organic vegetables,
            Organic fruits and exotic produce directly to your home, ensuring you and
            your family enjoy the highest quality produce every day.
          </p>

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

          <a href="tel:+919900088164" className="call-now-btn btn-primary">
            <i className="fas fa-phone"></i>
            Call Now
          </a>
        </div>
        <div className="card-image">
          <LazyImg src={aboutboy} alt="Fresh produce" />
        </div>
      </Reveal>

      {/* Why Choose Us Section */}
      <section className="why-choose-section">
        <Reveal className="section-head">
          <h2>Why Choose Us</h2>
          <h3>What Sets Us Apart</h3>
        </Reveal>
        <div className="features-grid">
          {whyChooseUs.map((f, i) => (
            <Reveal key={f.title} className="feature-circle" delay={(i % 3) * 0.08}>
              <div className="circle-icon">
                <i className={`fas ${f.icon}`}></i>
              </div>
              <h4>{f.title}</h4>
              <p>{f.text}</p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Vision Section */}
      <Reveal className="card-section vision-card">
        <div className="card-image">
          <LazyImg src={animeGirlVision} alt="Anime girl with vision" />
        </div>
        <div className="card-content">
          <h2>Our Vision</h2>
          <h3>Join Our Mission</h3>
          <p>
            When you choose Chanvi Farms, you&apos;re not just buying fresh
            Organic fruits and Organic vegetables — you&apos;re becoming a part of something
            bigger. You&apos;re supporting local farmers, encouraging
            sustainable agriculture, and promoting a healthier lifestyle for
            yourself and your community.
          </p>
          <p>
            We invite you to join us on this journey toward cleaner, greener,
            and more conscious living. Let&apos;s make healthy eating a natural
            and joyful part of everyday life — together.
          </p>
        </div>
      </Reveal>

      {/* Stats Section */}
      <Reveal className="stats-section">
        <div className="stats-inner" ref={statsRef}>
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
      </Reveal>

      {/* Team Section */}
      <section className="team-section">
        <Reveal className="section-head">
          <h2>Our Team</h2>
          <h3>Meet the People Behind Chanvi Farm</h3>
        </Reveal>
        <div className="team-members">
          <Reveal className="team-member">
            <div className="member-image">
              <i className="fas fa-user-tie"></i>
            </div>
            <h4>Raghunandana G</h4>
            <p>Founder</p>
          </Reveal>

          <Reveal className="team-member" delay={0.08}>
            <div className="member-image">
              <i className="fas fa-user-astronaut"></i>
            </div>
            <h4>Massthan vali G</h4>
            <p>Web Developer</p>
          </Reveal>
        </div>
      </section>

      {/* Instagram Card */}
      <Reveal>
        <a
          className="instagram-card"
          href="https://www.instagram.com/chanvifarms9/"
          target="_blank"
          rel="noopener noreferrer"
        >
          <div className="instagram-content">
            <h3>
              Follow us on <strong>Instagram</strong>
            </h3>
            <p>Get fresh updates and behind-the-scenes content</p>
          </div>
          <div className="instagram-icon">
            <i className="fab fa-instagram"></i>
            <i className="fas fa-arrow-right"></i>
          </div>
        </a>
      </Reveal>

      {/* Reviews Section */}
      <section className="reviews-section">
        <Reveal className="section-head">
          <h2>What Our Customers Say</h2>
          <h3>Customer Reviews</h3>
        </Reveal>
        <div className="reviews-grid">
          {reviews.map((r, i) => (
            <Reveal key={r.name} className="review-card" delay={(i % 3) * 0.08}>
              <div className="reviewer-info">
                <span className="reviewer-avatar" aria-hidden="true">
                  {r.name.charAt(0)}
                </span>
                <div>
                  <h4>{r.name}</h4>
                  <Stars value={r.stars} />
                </div>
              </div>
              <p>&ldquo;{r.text}&rdquo;</p>
            </Reveal>
          ))}
        </div>
      </section>
    </div>
  );
};

export default About;
