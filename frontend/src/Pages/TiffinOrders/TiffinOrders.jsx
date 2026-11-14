import { useCallback, useContext, useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import { Link } from 'react-router-dom'
import axios from 'axios'
import { format } from 'date-fns'
import { motion } from 'framer-motion'
import { toast } from 'react-toastify'
import './TiffinOrders.css'
import '../../Components/Tiffin/Tiffin.css'
import { StoreContext } from '../../Context/StoreContext'
import { formatINR, bracketed } from '../../Context/tiffinStore'
import Reveal from '../../Components/Motion/Reveal'
import { sizedImageUrl } from '../../utils/imageUrl'

const STATUS = {
  pending: { label: 'Awaiting payment', tone: 'amber', icon: 'fa-hourglass-half' },
  confirmed: { label: 'Confirmed', tone: 'blue', icon: 'fa-check' },
  preparing: { label: 'Preparing', tone: 'violet', icon: 'fa-fire' },
  ready: { label: 'Ready', tone: 'teal', icon: 'fa-concierge-bell' },
  'out-for-delivery': { label: 'Out for delivery', tone: 'teal', icon: 'fa-motorcycle' },
  delivered: { label: 'Delivered', tone: 'green', icon: 'fa-check-double' },
  'picked-up': { label: 'Picked up', tone: 'green', icon: 'fa-check-double' },
  cancelled: { label: 'Cancelled', tone: 'red', icon: 'fa-times' },
  payment_failed: { label: 'Payment failed', tone: 'red', icon: 'fa-exclamation' },
}

const PAYMENT_LABEL = { COD: 'Cash on delivery / pickup', Online: 'Online (Razorpay)', WHATSAPP_PAY: 'WhatsApp Pay' }
const PAYMENT_STATUS = {
  pending: 'Pending',
  completed: 'Paid',
  failed: 'Failed',
  awaiting_confirmation: 'Awaiting confirmation',
}

const stepsFor = (fulfilment) =>
  fulfilment === 'pickup'
    ? [
        { key: 'confirmed', label: 'Confirmed' },
        { key: 'preparing', label: 'Preparing' },
        { key: 'ready', label: 'Ready' },
        { key: 'picked-up', label: 'Picked up' },
      ]
    : [
        { key: 'confirmed', label: 'Confirmed' },
        { key: 'preparing', label: 'Preparing' },
        { key: 'ready', label: 'Ready' },
        { key: 'out-for-delivery', label: 'Out for delivery' },
        { key: 'delivered', label: 'Delivered' },
      ]

const Tracker = ({ status, fulfilment }) => {
  const steps = stepsFor(fulfilment)
  const current = steps.findIndex((s) => s.key === status)
  const pct = current <= 0 ? 0 : (current / (steps.length - 1)) * 100
  return (
    <ol className="to-tracker" aria-label="Order progress" style={{ '--to-steps': steps.length }}>
      <span className="to-track-line" aria-hidden="true">
        <motion.span className="to-track-fill" initial={{ scaleX: 0 }} animate={{ scaleX: pct / 100 }} transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }} />
      </span>
      {steps.map((s, i) => {
        const state = i < current ? 'done' : i === current ? 'current' : 'todo'
        return (
          <li key={s.key} className={`to-step is-${state}`} aria-current={state === 'current' ? 'step' : undefined}>
            <span className="to-step-dot" aria-hidden="true">
              {state === 'done' || (state === 'current' && i === steps.length - 1) ? <i className="fas fa-check"></i> : i + 1}
            </span>
            <span className="to-step-label">{s.label}</span>
          </li>
        )
      })}
    </ol>
  )
}

Tracker.propTypes = {
  status: PropTypes.string.isRequired,
  fulfilment: PropTypes.string,
}

const safeDate = (d) => {
  try {
    return format(new Date(d), 'd MMM yyyy, h:mm a')
  } catch {
    return ''
  }
}

const OrderCard = ({ order }) => {
  const st = STATUS[order.status] || { label: order.status, tone: 'grey', icon: 'fa-info' }
  const inTracker = !['pending', 'cancelled', 'payment_failed'].includes(order.status)
  const address = order.address || {}
  return (
    <article className="to-card">
      <header className="to-card-head">
        <div className="to-card-id">
          <h2>Order {order.orderNumber || `#${String(order._id).slice(-6).toUpperCase()}`}</h2>
          <p>
            {safeDate(order.createdAt)}
            {order.slot && <span className="tf-pill to-slot">{order.slot}</span>}
            <span className="tf-pill to-fulfil">
              <i className={`fas ${order.fulfilment === 'pickup' ? 'fa-store' : 'fa-motorcycle'}`} aria-hidden="true"></i>
              {order.fulfilment === 'pickup' ? 'Pickup' : 'Delivery'}
            </span>
          </p>
        </div>
        <span className={`tf-pill to-status to-tone-${st.tone}`}>
          <i className={`fas ${st.icon}`} aria-hidden="true"></i> {st.label}
        </span>
      </header>

      {inTracker && <Tracker status={order.status} fulfilment={order.fulfilment} />}
      {order.status === 'pending' && (
        <p className="tf-warn tf-warn-amber">
          <i className="fas fa-hourglass-half" aria-hidden="true"></i>
          <span>
            {order.payment?.method === 'WHATSAPP_PAY'
              ? 'Waiting for your WhatsApp UPI payment to be confirmed by the store.'
              : 'Waiting for payment confirmation.'}
          </span>
        </p>
      )}
      {order.status === 'cancelled' && (
        <p className="tf-warn">
          <i className="fas fa-times-circle" aria-hidden="true"></i>
          <span>This order was cancelled{order.cancelReason ? `: ${order.cancelReason}` : '.'}</span>
        </p>
      )}
      {order.status === 'payment_failed' && (
        <p className="tf-warn">
          <i className="fas fa-exclamation-circle" aria-hidden="true"></i>
          <span>The online payment didn&apos;t go through, so this order was not placed. You can order again from the menu.</span>
        </p>
      )}

      <ul className="to-items">
        {(order.items || []).map((it, i) => (
          <li key={`${it.tiffinId || i}-${i}`} className="to-item">
            <span className="to-item-thumb">
              {it.image ? <img src={sizedImageUrl(it.image, 96)} alt="" loading="lazy" decoding="async" width="44" height="44" /> : <i className="fas fa-utensils" aria-hidden="true"></i>}
            </span>
            <span className="to-item-info">
              <strong>{it.name}</strong>
              {it.subtitle && <small>{bracketed(it.subtitle)}</small>}
              <small className="to-item-qty">
                {formatINR(it.price)} × {it.quantity}
              </small>
            </span>
            <span className="to-item-total">{formatINR((Number(it.price) || 0) * (Number(it.quantity) || 0))}</span>
          </li>
        ))}
      </ul>

      <div className="to-foot">
        <div className="to-meta">
          <h3>Payment</h3>
          <p>{PAYMENT_LABEL[order.payment?.method] || order.payment?.method || '—'}</p>
          <p className="to-muted">{PAYMENT_STATUS[order.payment?.status] || order.payment?.status || ''}</p>
        </div>
        <div className="to-meta">
          <h3>{order.fulfilment === 'pickup' ? 'Pickup contact' : 'Deliver to'}</h3>
          {order.fulfilment === 'pickup' ? (
            <p>
              {order.contact?.name}
              {order.contact?.phone && <span className="to-muted"> · {order.contact.phone}</span>}
            </p>
          ) : (
            <>
              <p>{[address.firstName, address.lastName].filter(Boolean).join(' ')}</p>
              <p className="to-muted">{[address.street, address.city, address.zipcode].filter(Boolean).join(', ')}</p>
            </>
          )}
        </div>
        <div className="to-totals">
          <div><span>Subtotal</span><span>{formatINR(order.subtotal)}</span></div>
          {order.fulfilment === 'delivery' && <div><span>Delivery fee</span><span>{order.deliveryFee ? formatINR(order.deliveryFee) : 'Free'}</span></div>}
          <div className="to-grand"><span>Total</span><strong>{formatINR(order.amount)}</strong></div>
        </div>
      </div>
    </article>
  )
}

OrderCard.propTypes = {
  order: PropTypes.object.isRequired,
}

const Skeleton = () => (
  <div className="to-card to-card-sk" aria-hidden="true">
    <div className="to-sk-row">
      <div className="skeleton to-sk-line" style={{ width: '40%' }}></div>
      <div className="skeleton to-sk-pill"></div>
    </div>
    <div className="skeleton to-sk-line" style={{ width: '25%', height: 12 }}></div>
    <div className="skeleton to-sk-track"></div>
    <div className="to-sk-row">
      <div className="skeleton to-sk-thumb"></div>
      <div className="skeleton to-sk-line" style={{ width: '50%' }}></div>
    </div>
  </div>
)

const TiffinOrders = ({ setShowLogin }) => {
  const { url, token } = useContext(StoreContext)
  const [orders, setOrders] = useState([])
  const [state, setState] = useState('loading') // loading | ready | error
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')

  const load = useCallback(
    async (isRefresh = false) => {
      if (!token) return
      if (isRefresh) setRefreshing(true)
      else setState('loading')
      try {
        const res = await axios.get(`${url}/api/tiffin-order/my`, { headers: { token }, timeout: 20000 })
        if (!res.data?.success) throw new Error(res.data?.message)
        setOrders(Array.isArray(res.data.data) ? res.data.data : [])
        setState('ready')
      } catch (err) {
        const msg = err.response?.status === 401 ? 'Your session has expired. Please sign in again.' : err.response?.data?.message || 'We could not load your tiffin orders.'
        setError(msg)
        if (isRefresh) toast.error(msg)
        setState((cur) => (isRefresh && cur === 'ready' ? 'ready' : 'error'))
      } finally {
        setRefreshing(false)
      }
    },
    [token, url]
  )

  useEffect(() => {
    load()
  }, [load])

  if (!token) {
    return (
      <div className="tiffin-orders">
        <div className="tf-state">
          <span className="tf-empty-icon" aria-hidden="true">
            <i className="fas fa-user-lock"></i>
          </span>
          <h2>Sign in to see your tiffin orders</h2>
          <button type="button" className="btn-primary" onClick={() => setShowLogin?.(true)}>
            <i className="fas fa-sign-in-alt" aria-hidden="true"></i> Sign in
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="tiffin-orders">
      <div className="to-header">
        <div>
          <h1>My tiffin orders</h1>
          <p>
            {state === 'ready' && orders.length > 0
              ? `${orders.length} ${orders.length === 1 ? 'order' : 'orders'}`
              : 'Breakfast and dinner tiffins from our organic kitchen'}
          </p>
        </div>
        <div className="to-header-actions">
          <Link to="/myorders" className="tf-link-btn">Grocery orders</Link>
          <button type="button" className={`to-refresh ${refreshing ? 'is-spinning' : ''}`} onClick={() => load(true)} disabled={refreshing || state === 'loading'} aria-label="Refresh tiffin orders">
            <i className="fas fa-sync-alt" aria-hidden="true"></i>
            <span>{refreshing ? 'Refreshing…' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {state === 'loading' && (
        <div className="to-list" aria-busy="true">
          <Skeleton />
          <Skeleton />
        </div>
      )}

      {state === 'error' && (
        <div className="tf-state">
          <span className="tf-empty-icon tf-empty-icon-warn" aria-hidden="true">
            <i className="fas fa-wifi"></i>
          </span>
          <h2>Couldn&apos;t load your orders</h2>
          <p>{error}</p>
          <button type="button" className="btn-primary" onClick={() => load()}>
            <i className="fas fa-redo" aria-hidden="true"></i> Try again
          </button>
        </div>
      )}

      {state === 'ready' && orders.length === 0 && (
        <div className="tf-state">
          <span className="tf-empty-icon" aria-hidden="true">
            <i className="fas fa-utensils"></i>
          </span>
          <h2>No tiffin orders yet</h2>
          <p>Fresh organic breakfast and dinner tiffins, made every day in our kitchen.</p>
          <Link to="/tiffins" className="btn-primary">
            <i className="fas fa-leaf" aria-hidden="true"></i> See the tiffin menu
          </Link>
        </div>
      )}

      {state === 'ready' && orders.length > 0 && (
        <div className="to-list">
          {orders.map((o, i) => (
            <Reveal key={o._id} delay={Math.min(i, 4) * 0.05} y={14}>
              <OrderCard order={o} />
            </Reveal>
          ))}
        </div>
      )}
    </div>
  )
}

TiffinOrders.propTypes = {
  setShowLogin: PropTypes.func,
}

export default TiffinOrders
