import PropTypes from 'prop-types'
import { motion } from 'framer-motion'
import { FALLBACK_WINDOWS } from '../../Context/tiffinStore'

/** Green "Now taking orders" / amber "Ordering opens at…" banner plus the ordering windows. */
const OrderingBanner = ({ ordering, compact }) => {
  const windows = ordering?.windows?.length ? ordering.windows : FALLBACK_WINDOWS
  const state = !ordering ? 'loading' : ordering.isOpen ? 'open' : 'closed'

  return (
    <div className={`tf-banner tf-banner-${state} ${compact ? 'is-compact' : ''}`} role="status" aria-live="polite">
      <motion.div
          key={state + (ordering?.message || '')}
          className="tf-banner-main"
          initial={{ opacity: 0.4, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          <span className="tf-banner-dot" aria-hidden="true"></span>
          <span className="tf-banner-text">
            {state === 'loading' ? 'Checking ordering hours…' : ordering.message}
          </span>
        </motion.div>
      {!compact && (
        <ul className="tf-windows" aria-label="Tiffin ordering hours (IST)">
          {windows.map((w) => (
            <li key={w.label} className={ordering?.currentWindow === w.label ? 'is-current' : ''}>
              <i className={`fas ${/break|morn/i.test(w.label) ? 'fa-sun' : 'fa-moon'}`} aria-hidden="true"></i>
              <strong>{w.label}</strong>
              <span>{w.text}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

OrderingBanner.propTypes = {
  ordering: PropTypes.shape({
    isOpen: PropTypes.bool,
    message: PropTypes.string,
    currentWindow: PropTypes.string,
    windows: PropTypes.array,
  }),
  compact: PropTypes.bool,
}

export default OrderingBanner
