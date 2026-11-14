import PropTypes from 'prop-types'
import './FoodItem.css'
import { motion } from 'framer-motion'

// Friendly empty / error state with an optional retry action
const StatusState = ({ icon = 'fa-seedling', title, message, onRetry, retryLabel = 'Try again' }) => (
  <motion.div
    className="status-state"
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
    role="status"
  >
    <span className="status-state-icon"><i className={`fas ${icon}`}></i></span>
    <h3>{title}</h3>
    {message && <p>{message}</p>}
    {onRetry && (
      <button type="button" className="btn-primary status-state-btn" onClick={onRetry}>
        <i className="fas fa-redo"></i>
        {retryLabel}
      </button>
    )}
  </motion.div>
)

StatusState.propTypes = {
  icon: PropTypes.string,
  title: PropTypes.string.isRequired,
  message: PropTypes.string,
  onRetry: PropTypes.func,
  retryLabel: PropTypes.string,
}

export default StatusState
