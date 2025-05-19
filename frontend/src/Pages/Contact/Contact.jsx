import React, { useState, useEffect } from 'react'
import './Contact.css'

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  })

  const [mapUrl, setMapUrl] = useState('')

  useEffect(() => {
    setMapUrl("https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3890.056607297418!2d77.6479073738653!3d12.839618617760657!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bae6b7e8e5260b1%3A0x7ee78510f0bc1a42!2s253%2C%202nd%20Cross%20Rd%2C%20Neeladri%20Nagar%2C%20Electronics%20City%20Phase%201%2C%20Electronic%20City%2C%20Bengaluru%2C%20Karnataka%20560100!5e0!3m2!1sen!2sin!4v1747130545142!5m2!1sen!2sin")
  }, [])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    console.log('Form submitted:', formData)
    setFormData({
      name: '',
      email: '',
      subject: '',
      message: ''
    })
  }

  const handleLocationClick = () => {
    const latitude = 12.8458;
    const longitude = 77.6612;
    window.open(`https://www.google.com/maps?q=${latitude},${longitude}`, '_blank');
  };

  const handlePhoneClick = () => {
    window.location.href = `tel:+918919825034`;
  };

  const handleEmailClick = () => {
    window.location.href = `mailto:lovelyboyarun91@gmail.com`;
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
          <p className="address-text">2nd Cross Rd, Neeladri Nagar, Electronics City Phase 1, Electronic City, Bengaluru, Karnataka 560100</p>
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
            <p>+91 8919825034</p>
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
            <p>lovelyboyarun91@gmail.com</p>
            <p>support@chanvifarms.com</p>
          </div>
        </div>
      </div>

      <div className="map-container">
        <iframe 
          src={mapUrl}
          width="100%" 
          height="400" 
          style={{border:0}} 
          allowFullScreen="" 
          loading="lazy" 
          referrerPolicy="no-referrer-when-downgrade"
          title="Chanvi Farms Location"
        ></iframe>
      </div>
    </div>
  )
}

export default Contact