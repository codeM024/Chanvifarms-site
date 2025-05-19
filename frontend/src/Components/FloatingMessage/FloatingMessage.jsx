import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import './FloatingMessage.css';

const FloatingMessage = ({ position = 'top-right' }) => {
    const [isVisible, setIsVisible] = useState(false);
    const [isExiting, setIsExiting] = useState(false);

    useEffect(() => {
        // Show message after a small delay for better UX
        const showTimer = setTimeout(() => {
            setIsVisible(true);
        }, 500);

        // Hide message after 10 seconds
        const hideTimer = setTimeout(() => {
            setIsExiting(true);
            // Actually remove the component after animation
            setTimeout(() => setIsVisible(false), 500);
        }, 10000);

        return () => {
            clearTimeout(showTimer);
            clearTimeout(hideTimer);
        };
    }, []);

    if (!isVisible) return null;

    return (
        <div className={`floating-message ${position} ${isExiting ? 'exit' : ''}`}>
            <div className="message-content">
                <div className="message-icon">⏰</div>
                <div className="message-text">
                    <span className="timing">Last orders accepts: 11:59 PM</span>
                    <span className="details">next day: 7:00 AM  • Receive at your doorstep</span>
                </div>
            </div>
        </div>
    );
};
FloatingMessage.propTypes = {
    position: PropTypes.string
};

export default FloatingMessage;
