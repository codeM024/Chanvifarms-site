import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useTiffin, formatINR } from '../../Context/tiffinStore'

/** Sticky bottom bar on the tiffins page: "3 items · ₹230 — View cart / Checkout". */
const TiffinCartBar = () => {
  const { itemCount, subtotal, setDrawerOpen, drawerOpen, ordering, settings } = useTiffin()
  const navigate = useNavigate()
  const isOpen = !!ordering?.isOpen
  const minOrder = Number(settings.minOrderAmount) || 0
  const belowMin = minOrder > 0 && subtotal < minOrder
  const show = itemCount > 0 && !drawerOpen

  return createPortal(
    <AnimatePresence>
      {show && (
        <motion.div
          className="tf-cartbar"
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        >
          <button type="button" className="tf-cartbar-summary" onClick={() => setDrawerOpen(true)} aria-label="View tiffin cart">
            <span className="tf-cartbar-icon" aria-hidden="true">
              <i className="fas fa-shopping-basket"></i>
            </span>
            <span className="tf-cartbar-text">
              <motion.strong key={itemCount} initial={{ scale: 1.15 }} animate={{ scale: 1 }} transition={{ duration: 0.2 }}>
                {itemCount} {itemCount === 1 ? 'item' : 'items'} · {formatINR(subtotal)}
              </motion.strong>
              <small>{!isOpen && ordering ? ordering.message : belowMin ? `Minimum order ${formatINR(minOrder)}` : 'View cart'}</small>
            </span>
          </button>
          <button
            type="button"
            className="tf-cartbar-cta"
            onClick={() => navigate('/tiffins/checkout')}
            disabled={!isOpen || belowMin}
            title={!isOpen ? ordering?.message : belowMin ? `Minimum tiffin order is ${formatINR(minOrder)}` : undefined}
          >
            Checkout <i className="fas fa-arrow-right" aria-hidden="true"></i>
          </button>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  )
}

export default TiffinCartBar
