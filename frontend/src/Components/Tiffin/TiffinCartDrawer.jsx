import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import QtyStepper from './QtyStepper'
import { useTiffin, formatINR, bracketed } from '../../Context/tiffinStore'
import { sizedImageUrl } from '../../utils/imageUrl'

const EASE = [0.22, 1, 0.36, 1]

/** Slide-in tiffin cart (separate from the grocery cart). */
const TiffinCartDrawer = () => {
  const { drawerOpen, setDrawerOpen, lines, itemCount, subtotal, increment, decrement, remove, clear, ordering, settings } = useTiffin()
  const navigate = useNavigate()
  const closeRef = useRef(null)
  const lastFocus = useRef(null)
  const isOpen = !!ordering?.isOpen
  const minOrder = Number(settings.minOrderAmount) || 0
  const belowMin = minOrder > 0 && subtotal < minOrder

  useEffect(() => {
    if (!drawerOpen) return undefined
    lastFocus.current = document.activeElement
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const t = setTimeout(() => closeRef.current?.focus(), 60)
    const onKey = (e) => {
      if (e.key === 'Escape') setDrawerOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => {
      clearTimeout(t)
      document.body.style.overflow = prevOverflow
      document.removeEventListener('keydown', onKey)
      if (lastFocus.current && typeof lastFocus.current.focus === 'function') lastFocus.current.focus()
    }
  }, [drawerOpen, setDrawerOpen])

  const goCheckout = () => {
    setDrawerOpen(false)
    navigate('/tiffins/checkout')
  }

  return createPortal(
    <AnimatePresence>
      {drawerOpen && (
        <div className="tf-drawer-root">
          <motion.div
            className="tf-drawer-overlay"
            onClick={() => setDrawerOpen(false)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          />
          <motion.aside
            className="tf-drawer"
            role="dialog"
            aria-modal="true"
            aria-labelledby="tf-drawer-title"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.3, ease: EASE }}
          >
            <header className="tf-drawer-head">
              <div>
                <h2 id="tf-drawer-title">Your tiffin cart</h2>
                <p>{itemCount === 0 ? 'Nothing added yet' : `${itemCount} ${itemCount === 1 ? 'item' : 'items'}`}</p>
              </div>
              <button ref={closeRef} type="button" className="tf-icon-btn" onClick={() => setDrawerOpen(false)} aria-label="Close tiffin cart">
                <i className="fas fa-times" aria-hidden="true"></i>
              </button>
            </header>

            {lines.length === 0 ? (
              <div className="tf-drawer-empty">
                <span className="tf-empty-icon" aria-hidden="true">
                  <i className="fas fa-utensils"></i>
                </span>
                <p>Your tiffin cart is empty.</p>
                <button type="button" className="btn-primary" onClick={() => setDrawerOpen(false)}>
                  Browse the menu
                </button>
              </div>
            ) : (
              <>
                <ul className="tf-drawer-lines">
                  <AnimatePresence initial={false}>
                    {lines.map(({ id, item, qty, lineTotal }) => (
                      <motion.li
                        key={id}
                        layout
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: 24 }}
                        transition={{ duration: 0.2, ease: EASE }}
                        className="tf-line"
                      >
                        <div className="tf-line-thumb">
                          {item.image ? (
                            <img src={sizedImageUrl(item.image, 120)} alt="" loading="lazy" decoding="async" width="56" height="56" />
                          ) : (
                            <i className="fas fa-utensils" aria-hidden="true"></i>
                          )}
                        </div>
                        <div className="tf-line-info">
                          <p className="tf-line-name">{item.name}</p>
                          {item.subtitle && <p className="tf-line-sub">{bracketed(item.subtitle)}</p>}
                          <p className="tf-line-price">
                            {formatINR(item.price)} × {qty} = <strong>{formatINR(lineTotal)}</strong>
                          </p>
                        </div>
                        <div className="tf-line-actions">
                          <QtyStepper
                            size="sm"
                            qty={qty}
                            name={item.name}
                            onIncrement={() => increment(id)}
                            onDecrement={() => decrement(id)}
                            disabled={!isOpen}
                            disabledHint={ordering?.message}
                          />
                          <button type="button" className="tf-link-btn" onClick={() => remove(id)} aria-label={`Remove ${item.name} from tiffin cart`}>
                            Remove
                          </button>
                        </div>
                      </motion.li>
                    ))}
                  </AnimatePresence>
                </ul>

                <footer className="tf-drawer-foot">
                  <div className="tf-drawer-total">
                    <span>Subtotal</span>
                    <strong>{formatINR(subtotal)}</strong>
                  </div>
                  <p className="tf-drawer-note">
                    {settings.deliveryEnabled && Number(settings.deliveryFee) > 0
                      ? `Delivery fee ${formatINR(settings.deliveryFee)} (free for store pickup) added at checkout.`
                      : 'Delivery / pickup chosen at checkout.'}
                  </p>
                  {belowMin && (
                    <p className="tf-warn">
                      <i className="fas fa-info-circle" aria-hidden="true"></i> Minimum tiffin order is {formatINR(minOrder)}. Add {formatINR(minOrder - subtotal)} more.
                    </p>
                  )}
                  {ordering && !isOpen && (
                    <p className="tf-warn tf-warn-amber">
                      <i className="fas fa-clock" aria-hidden="true"></i> {ordering.message}
                    </p>
                  )}
                  <button type="button" className="btn-primary tf-block-btn" onClick={goCheckout} disabled={!isOpen || belowMin}>
                    {isOpen ? (
                      <>
                        Checkout · {formatINR(subtotal)} <i className="fas fa-arrow-right" aria-hidden="true"></i>
                      </>
                    ) : (
                      'Checkout opens with ordering hours'
                    )}
                  </button>
                  <div className="tf-drawer-links">
                    <button type="button" className="tf-link-btn" onClick={clear}>
                      Clear cart
                    </button>
                    <Link to="/tiffins/orders" className="tf-link-btn" onClick={() => setDrawerOpen(false)}>
                      My tiffin orders
                    </Link>
                  </div>
                </footer>
              </>
            )}
          </motion.aside>
        </div>
      )}
    </AnimatePresence>,
    document.body
  )
}

export default TiffinCartDrawer
