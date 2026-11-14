import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Reveal from '../../Components/Motion/Reveal'
import './FAQ.css'

const FAQ = () => {
  const [activeIndex, setActiveIndex] = useState(null)

  const faqData = [
    {
      question: "Where does Chanvi Farms source its Organic fruits and Organic vegetables?",
      answer: "We partner directly with trusted local farmers and growers who follow sustainable and ethical farming practices. This ensures you receive produce that is fresh, safe, and full of natural goodness."
    },
    {
      question: "How can I place an order with Chanvi Farms?",
      answer: "Placing an order is simple! Just visit our website, browse through our selection, add your favorite items to the cart, and proceed to checkout."
    },
    {
      question: "Is there a minimum order amount?",
      answer: "Yes, we do have a small minimum order value to ensure efficient delivery. The current minimum order amount will be displayed at checkout."
    },
    {
      question: "Is there a delivery fee?",
      answer: "Delivery is free on orders above a certain amount. For smaller orders, a nominal delivery fee may apply — this will be clearly shown during checkout."
    },
    {
      question: "Which areas do you deliver to?",
      answer: "We currently deliver across select areas. You can enter your pin code on our website to check availability in your location."
    },
    {
      question: "How quickly will I receive my order?",
      answer: "We offer next-day delivery for most orders. You'll also be notified of your delivery slot after placing your order."
    },
    {
      question: "What if the produce doesn't meet my expectations?",
      answer: "Your satisfaction is our priority. If you're unhappy with the quality, please reach out to us within 24 hours of delivery — we'll offer a replacement or refund."
    },
    {
      question: "What payment methods are accepted?",
      answer: "We accept a variety of secure payment options including UPI, debit/credit cards, net banking, and cash on delivery (COD) in select areas."
    },
    {
      question: "Can I cancel or modify my order after placing it?",
      answer: "Yes, you can modify or cancel your order within a limited time window. Please contact our support team as soon as possible for assistance."
    },
    {
      question: "How can I track my order status?",
      answer: "Once your order is placed, you'll receive tracking updates via SMS or email. You can also log in to your account on our website to view order details."
    },
    {
      question: "What is your return or refund policy?",
      answer: "We stand by the quality of our products. If there's an issue, we offer easy refunds or replacements. Please contact us with details and a photo within 24 hours of delivery."
    },
    {
      question: "Do you offer subscription plans for regular deliveries?",
      answer: "Yes! You can subscribe for weekly or monthly deliveries of your favorite items. It's convenient, flexible, and helps ensure you never run out of essentials."
    },
    {
      question: "How can I reach Chanvi Farm's customer support?",
      answer: "You can contact us via phone, email, or WhatsApp — our support team is always happy to help. Visit the 'Contact Us' section on our website for details."
    },
    {
      question: "Are there any ongoing discounts or special offers?",
      answer: "Yes, we regularly offer seasonal discounts, bundle deals, and promotional offers. Stay updated by subscribing to our newsletter or following us on social media."
    },
    {
      question: "Can I refer a friend to Chanvi Farms?",
      answer: "Absolutely! Refer a friend and both of you can enjoy special rewards. Check our 'Refer & Earn' section for more details."
    },
    {
      question: "Is contactless delivery available?",
      answer: "Yes, for your safety and convenience, we offer contactless delivery upon request. Just select this option at checkout."
    },
    {
      question: "Is my payment information secure?",
      answer: "Yes. We use industry-standard encryption and secure payment gateways to ensure your information is completely protected."
    }
  ]

  const toggleAccordion = (index) => {
    setActiveIndex(activeIndex === index ? null : index)
  }

  return (
    <div className="faq-container">
      <Reveal className="faq-hero">
        <span className="faq-eyebrow">Help Center</span>
        <h1>Frequently Asked Questions</h1>
        <p>Everything you need to know about ordering fresh, organic produce from Chanvi Farms.</p>
      </Reveal>
      <div className="faq-list">
        {faqData.map((faq, index) => {
          const isOpen = activeIndex === index
          return (
            <Reveal
              key={index}
              className={`faq-item ${isOpen ? 'active' : ''}`}
              delay={Math.min(index, 6) * 0.04}
              y={16}
            >
              <button
                type="button"
                id={`faq-q-${index}`}
                className={`faq-question ${isOpen ? 'active' : ''}`}
                onClick={() => toggleAccordion(index)}
                aria-expanded={isOpen}
                aria-controls={`faq-a-${index}`}
              >
                <span>{faq.question}</span>
                <span className="faq-icon" aria-hidden="true"></span>
              </button>
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    key="answer"
                    id={`faq-a-${index}`}
                    role="region"
                    aria-labelledby={`faq-q-${index}`}
                    className="faq-answer active"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <div className="faq-answer-inner">{faq.answer}</div>
                  </motion.div>
                )}
              </AnimatePresence>
            </Reveal>
          )
        })}
      </div>
    </div>
  )
}

export default FAQ
