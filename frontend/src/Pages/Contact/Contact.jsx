import { useState, useEffect } from "react";
import "./Contact.css";

const Contact = () => {
  const [mapUrl, setMapUrl] = useState("");

  useEffect(() => {
    setMapUrl(
      "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3889.0194889504287!2d77.67448847391087!3d12.90646828740296!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bae1373ce0ae447%3A0x55a7e465cd53d825!2s34%2F35%2F1%20Shivam!5e0!3m2!1sen!2sin!4v1748846508286!5m2!1sen!2sin"
    );
  }, []);

  const handleLocationClick = () => {
    window.open(
      `https://www.google.com/maps/place/34%2F35%2F1+Shivam/@12.9064683,77.6744885,17z/data=!3m1!4b1!4m6!3m5!1s0x3bae1373ce0ae447:0x55a7e465cd53d825!8m2!3d12.9064683!4d77.6770634!16s%2Fg%2F11fsw2y9rs?entry=ttu&g_ep=EgoyMDI1MDUyOC4wIKXMDSoASAFQAw%3D%3D`,
      "_blank"
    );
  };

  const handlePhoneClick = () => {
    window.location.href = `tel:+919900088164`;
  };

  const handleEmailClick = () => {
    window.location.href = `mailto:chanvifarms9@gmail.com`;
  };

  return (
    <div className="contact-container">
      <h1>Contact Us</h1>

      <div className="contact-cards">
        <div
          className="contact-card location"
          onClick={handleLocationClick}
          role="button"
          tabIndex={0}
        >
          <div className="icon-container">
            <i className="fas fa-map-marker-alt"></i>
          </div>
          <h3>Our Location</h3>
          <p className="address-text">
            34/35/1,SHIVAM Mudaliyar layout,Kasavanahalli,Sarjapura
            road,Bangalore-560035
          </p>
        </div>

        <div
          className="contact-card phone"
          onClick={handlePhoneClick}
          role="button"
          tabIndex={0}
        >
          <div className="icon-container">
            <i className="fas fa-phone"></i>
          </div>
          <h3>Call Us</h3>
          <div className="contact-details">
            <p>+91 9900088164</p>
          </div>
        </div>

        <div
          className="contact-card email"
          onClick={handleEmailClick}
          role="button"
          tabIndex={0}
        >
          <div className="icon-container">
            <i className="fas fa-envelope"></i>
          </div>
          <h3>Email Us</h3>
          <div className="contact-details">
            <p>chanvifarms9@gmail.com</p>
          </div>
        </div>
      </div>

      <div className="map-container">
        <iframe
          src={mapUrl}
          width="110%"
          height="400"
          style={{ border: 0 }}
          allowFullScreen=""
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          title="Chanvi Farms Location"
        ></iframe>
      </div>
    </div>
  );
};

export default Contact;
