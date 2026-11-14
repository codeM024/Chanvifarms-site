import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { motion, AnimatePresence } from "framer-motion";
import "./FloatingMessage.css";

const FloatingMessage = ({ position = "top-right" }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Show message after a small delay for better UX
    const showTimer = setTimeout(() => setIsVisible(true), 500);
    // Hide message after 10 seconds (exit animation handled by AnimatePresence)
    const hideTimer = setTimeout(() => setIsVisible(false), 10000);

    return () => {
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
    };
  }, []);

  const fromRight = position.endsWith("right");

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className={`floating-message ${position}`}
          role="status"
          initial={{ opacity: 0, x: fromRight ? 24 : -24, scale: 0.98 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, y: -12, scale: 0.98 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="message-content">
            <div className="message-icon" aria-hidden="true">
              <i className="fas fa-clock"></i>
            </div>
            <div className="message-text">
              <span className="details">
                Place the order today by 6 pm and get fresh Organic Vegetables delivered day after tomorrow from 7 am - 9 am
              </span>
            </div>
            <button
              type="button"
              className="message-close"
              onClick={() => setIsVisible(false)}
              aria-label="Dismiss message"
            >
              <i className="fas fa-times"></i>
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
FloatingMessage.propTypes = {
  position: PropTypes.string,
};

export default FloatingMessage;
