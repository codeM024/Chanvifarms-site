import PropTypes from 'prop-types'
import { motion, AnimatePresence } from 'framer-motion'

const EASE = [0.22, 1, 0.36, 1]

/**
 * "Add" button that turns into a − qty + stepper once the item is in the cart.
 */
const QtyStepper = ({ qty, name, onAdd, onIncrement, onDecrement, disabled = false, disabledLabel = 'Closed', disabledHint = '', size = 'md' }) => (
  <div className={`tf-stepper-wrap tf-stepper-${size}`}>
    <AnimatePresence mode="popLayout" initial={false}>
      {qty === 0 ? (
        <motion.button
          key="add"
          type="button"
          className="tf-add-btn"
          onClick={onAdd}
          disabled={disabled}
          title={disabled ? disabledHint : undefined}
          aria-label={disabled ? `${name}: ${disabledHint || disabledLabel}` : `Add ${name} to tiffin cart`}
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.92 }}
          transition={{ duration: 0.18, ease: EASE }}
          whileTap={disabled ? undefined : { scale: 0.94 }}
        >
          {disabled ? (
            <>
              <i className="fas fa-lock" aria-hidden="true"></i> {disabledLabel}
            </>
          ) : (
            <>
              <i className="fas fa-plus" aria-hidden="true"></i> Add
            </>
          )}
        </motion.button>
      ) : (
        <motion.div
          key="stepper"
          className="tf-stepper"
          role="group"
          aria-label={`Quantity of ${name}`}
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.92 }}
          transition={{ duration: 0.18, ease: EASE }}
        >
          <motion.button
            type="button"
            className="tf-step-btn"
            onClick={onDecrement}
            aria-label={qty === 1 ? `Remove ${name}` : `One less ${name}`}
            whileTap={{ scale: 0.85 }}
          >
            <i className={`fas ${qty === 1 ? 'fa-trash-alt' : 'fa-minus'}`} aria-hidden="true"></i>
          </motion.button>
          <span className="tf-step-qty" aria-live="polite">
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.span
                key={qty}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.15 }}
              >
                {qty}
              </motion.span>
            </AnimatePresence>
          </span>
          <motion.button
            type="button"
            className="tf-step-btn"
            onClick={onIncrement}
            disabled={disabled}
            title={disabled ? disabledHint : undefined}
            aria-label={`One more ${name}`}
            whileTap={disabled ? undefined : { scale: 0.85 }}
          >
            <i className="fas fa-plus" aria-hidden="true"></i>
          </motion.button>
        </motion.div>
      )}
    </AnimatePresence>
  </div>
)

QtyStepper.propTypes = {
  qty: PropTypes.number.isRequired,
  name: PropTypes.string.isRequired,
  onAdd: PropTypes.func,
  onIncrement: PropTypes.func.isRequired,
  onDecrement: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
  disabledLabel: PropTypes.string,
  disabledHint: PropTypes.string,
  size: PropTypes.oneOf(['md', 'sm']),
}

export default QtyStepper
