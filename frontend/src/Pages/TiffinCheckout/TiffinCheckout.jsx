import { useCallback, useContext, useEffect, useRef, useState } from 'react'
import PropTypes from 'prop-types'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { toast } from 'react-toastify'
import { motion, AnimatePresence } from 'framer-motion'
import './TiffinCheckout.css'
import '../../Components/Tiffin/Tiffin.css'
import { StoreContext } from '../../Context/StoreContext'
import { useTiffin, formatINR, bracketed, safeStorage, TIFFIN_CONTACT_KEY } from '../../Context/tiffinStore'
import OrderingBanner from '../../Components/Tiffin/OrderingBanner'
import QtyStepper from '../../Components/Tiffin/QtyStepper'
import useOrderingPoll from '../../Components/Tiffin/useOrderingPoll'
import { sizedImageUrl } from '../../utils/imageUrl'

const EASE = [0.22, 1, 0.36, 1]

const emptyAddress = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  street: '',
  city: 'Bengaluru',
  state: 'Karnataka',
  country: 'India',
  zipcode: '',
}

const loadRazorpayScript = () =>
  new Promise((resolve) => {
    if (window.Razorpay) return resolve(true)
    const existing = document.querySelector('script[data-razorpay]')
    const script = existing || document.createElement('script')
    script.addEventListener('load', () => resolve(true))
    script.addEventListener('error', () => resolve(false))
    if (!existing) {
      script.src = 'https://checkout.razorpay.com/v1/checkout.js'
      script.async = true
      script.dataset.razorpay = '1'
      document.body.appendChild(script)
    }
    return undefined
  })

const PAYMENT_OPTIONS = [
  { value: 'COD', icon: 'fa-money-bill-wave', title: (f) => (f === 'pickup' ? 'Pay at pickup' : 'Cash on delivery'), desc: (f) => (f === 'pickup' ? 'Pay in cash or UPI when you collect your tiffin.' : 'Pay in cash or UPI when your tiffin arrives.') },
  { value: 'Online', icon: 'fa-credit-card', title: () => 'Pay online (Razorpay)', desc: () => 'UPI, cards, netbanking and wallets — secured by Razorpay.' },
  { value: 'WHATSAPP_PAY', icon: 'fa-whatsapp', brand: true, title: () => 'WhatsApp Pay', desc: () => 'We open WhatsApp with your order so you can pay by UPI.' },
]

const TiffinCheckout = ({ setShowLogin }) => {
  const { token } = useContext(StoreContext)
  const {
    url, menu, loadMenu, ordering, setOrdering, refreshStatus, settings,
    lines, itemCount, subtotal, increment, decrement, removeMany, clear,
  } = useTiffin()
  const navigate = useNavigate()
  useOrderingPoll()

  const [fulfilment, setFulfilment] = useState(null)
  const [addresses, setAddresses] = useState([])
  const [addrState, setAddrState] = useState('idle') // idle | loading | ready | error
  const [selectedAddressId, setSelectedAddressId] = useState(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newAddress, setNewAddress] = useState(emptyAddress)
  const [savingAddress, setSavingAddress] = useState(false)
  const [contact, setContact] = useState(() => {
    const saved = safeStorage.get(TIFFIN_CONTACT_KEY, null)
    return { name: saved?.name || '', phone: saved?.phone || '' }
  })
  const [notes, setNotes] = useState('')
  const [payment, setPayment] = useState('COD')
  const [placing, setPlacing] = useState(false)
  const [success, setSuccess] = useState(null)
  const [errors, setErrors] = useState({})
  const loginPrompted = useRef(false)

  // Ask for login once if the user arrives signed out
  useEffect(() => {
    if (!token && !loginPrompted.current && setShowLogin) {
      loginPrompted.current = true
      setShowLogin(true)
    }
  }, [token, setShowLogin])

  const fulfilmentOptions = [
    settings.deliveryEnabled !== false && 'delivery',
    settings.pickupEnabled !== false && 'pickup',
  ].filter(Boolean)
  const mode = fulfilmentOptions.includes(fulfilment) ? fulfilment : fulfilmentOptions[0] || 'pickup'

  const deliveryFee = mode === 'delivery' ? Number(settings.deliveryFee) || 0 : 0
  const total = Math.round((subtotal + deliveryFee) * 100) / 100
  const minOrder = Number(settings.minOrderAmount) || 0
  const belowMin = minOrder > 0 && subtotal < minOrder
  const isOpen = !!ordering?.isOpen

  const fetchAddresses = useCallback(async () => {
    if (!token) return
    setAddrState('loading')
    try {
      const res = await axios.get(`${url}/api/user/addresses`, { headers: { token } })
      const list = res.data?.success ? res.data.addresses || [] : []
      setAddresses(list)
      setSelectedAddressId((cur) => {
        if (cur && list.some((a) => a._id === cur)) return cur
        return (list.find((a) => a.isDefault) || list[0])?._id || null
      })
      setShowAddForm(list.length === 0)
      setAddrState('ready')
    } catch {
      setAddrState('error')
    }
  }, [token, url])

  useEffect(() => {
    if (token && mode === 'delivery' && addrState === 'idle') fetchAddresses()
  }, [token, mode, addrState, fetchAddresses])

  // A new login means a new address book
  const lastToken = useRef(token)
  useEffect(() => {
    if (lastToken.current === token) return
    lastToken.current = token
    setAddresses([])
    setSelectedAddressId(null)
    setAddrState('idle')
  }, [token])

  const onAddrChange = (e) => {
    const { name, value } = e.target
    setNewAddress((a) => ({ ...a, [name]: name === 'phone' || name === 'zipcode' ? value.replace(/\D/g, '').slice(0, name === 'phone' ? 10 : 6) : value }))
  }

  const saveAddress = async () => {
    const a = newAddress
    const errs = {}
    if (!a.firstName.trim()) errs.firstName = 'Enter a first name'
    if (!/^\d{10}$/.test(a.phone)) errs.phone = 'Enter a 10-digit mobile number'
    if (a.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(a.email)) errs.email = 'Enter a valid email'
    if (!a.street.trim()) errs.street = 'Enter your flat / street'
    if (!/^\d{6}$/.test(a.zipcode)) errs.zipcode = 'Enter a 6-digit PIN code'
    setErrors(errs)
    if (Object.keys(errs).length) return

    setSavingAddress(true)
    try {
      const res = await axios.post(
        `${url}/api/user/address`,
        { address: { ...a, isDefault: addresses.length === 0 } },
        { headers: { token, 'Content-Type': 'application/json' } }
      )
      if (!res.data?.success) throw new Error(res.data?.message)
      const list = res.data.addresses || []
      setAddresses(list)
      const newId = res.data.address?._id || list[list.length - 1]?._id
      setSelectedAddressId(newId ? String(newId) : null)
      setShowAddForm(false)
      setNewAddress(emptyAddress)
      toast.success('Address saved')
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Could not save the address')
    } finally {
      setSavingAddress(false)
    }
  }

  const markPaymentFailed = useCallback(
    (orderId) => axios.post(`${url}/api/tiffin-order/payment-failed`, { orderId }, { headers: { token } }).catch(() => {}),
    [url, token]
  )

  const finishSuccess = useCallback(
    (data) => {
      clear()
      setSuccess(data)
    },
    [clear]
  )

  // Show the confirmation from the top once it has rendered (the page gets much shorter)
  useEffect(() => {
    if (success) window.scrollTo({ top: 0, behavior: 'instant' })
  }, [success])

  const openRazorpay = async (data, contactInfo) => {
    const ok = await loadRazorpayScript()
    if (!ok) {
      await markPaymentFailed(data.orderId)
      toast.error('Could not load the payment window. Please try again or choose another payment method.')
      setPlacing(false)
      return
    }
    let settled = false
    const rp = new window.Razorpay({
      key: data.razorpay.key || import.meta.env.VITE_RAZORPAY_KEY_ID,
      amount: data.razorpay.amount,
      currency: data.razorpay.currency || 'INR',
      order_id: data.razorpay.orderId,
      name: 'Chanvi Farms',
      description: `Tiffin order ${data.orderNumber}`,
      prefill: { name: contactInfo.name, contact: contactInfo.phone, email: contactInfo.email || undefined },
      notes: { tiffinOrder: data.orderNumber },
      theme: { color: '#1f6f43' },
      retry: { enabled: false },
      modal: {
        escape: false,
        backdropclose: false,
        ondismiss: () => {
          if (settled) return
          settled = true
          markPaymentFailed(data.orderId)
          setPlacing(false)
          toast.info('Payment cancelled. Your cart is saved, so you can try again.')
        },
      },
      handler: async (resp) => {
        settled = true
        try {
          const v = await axios.post(
            `${url}/api/tiffin-order/verify-payment`,
            {
              orderId: data.orderId,
              razorpay_order_id: resp.razorpay_order_id,
              razorpay_payment_id: resp.razorpay_payment_id,
              razorpay_signature: resp.razorpay_signature,
            },
            { headers: { token }, timeout: 30000 }
          )
          if (!v.data?.success) throw new Error(v.data?.message)
          finishSuccess({ orderNumber: data.orderNumber, method: 'Online', fulfilment: mode, amount: total })
        } catch (err) {
          toast.error(err.response?.data?.message || 'We could not confirm the payment yet. Please check your tiffin orders.')
          navigate('/tiffins/orders')
        } finally {
          setPlacing(false)
        }
      },
    })
    rp.on('payment.failed', (resp) => {
      if (settled) return
      settled = true
      markPaymentFailed(data.orderId)
      setPlacing(false)
      toast.error(`Payment failed${resp?.error?.description ? `: ${resp.error.description}` : ''}`)
    })
    rp.open()
  }

  const validate = () => {
    const errs = {}
    if (mode === 'delivery') {
      if (!selectedAddressId) errs.address = 'Choose or add a delivery address'
    } else {
      if (!contact.name.trim()) errs.contactName = 'Enter your name'
      if (!/^\d{10}$/.test(contact.phone)) errs.contactPhone = 'Enter a 10-digit mobile number'
    }
    setErrors(errs)
    if (Object.keys(errs).length) {
      toast.error(Object.values(errs)[0])
      return false
    }
    return true
  }

  const placeOrder = async (e) => {
    e.preventDefault()
    if (placing) return
    if (!token) {
      setShowLogin?.(true)
      return
    }
    if (!isOpen) {
      toast.info(ordering?.message || 'Tiffin ordering is closed right now')
      return
    }
    if (!lines.length) return
    if (belowMin) {
      toast.error(`Minimum tiffin order is ${formatINR(minOrder)}`)
      return
    }
    if (!validate()) return

    const address = mode === 'delivery' ? addresses.find((a) => a._id === selectedAddressId) : undefined
    const contactInfo =
      mode === 'delivery'
        ? { name: `${address.firstName} ${address.lastName || ''}`.trim(), phone: address.phone, email: address.email }
        : { name: contact.name.trim(), phone: contact.phone }
    if (mode === 'pickup') safeStorage.set(TIFFIN_CONTACT_KEY, contactInfo)

    setPlacing(true)
    try {
      const res = await axios.post(
        `${url}/api/tiffin-order/place`,
        {
          items: lines.map((l) => ({ tiffinId: l.id, quantity: l.qty })),
          fulfilment: mode,
          address: mode === 'delivery' ? address : undefined,
          contact: mode === 'pickup' ? contactInfo : undefined,
          notes: notes.trim() || undefined,
          paymentMethod: payment,
        },
        { headers: { token }, timeout: 30000 }
      )
      const data = res.data || {}
      if (!data.success) throw new Error(data.message || 'Could not place the order')

      if (payment === 'Online' && data.razorpay) {
        await openRazorpay(data, contactInfo)
        return
      }
      if (payment === 'WHATSAPP_PAY' && data.whatsappUrl) {
        window.open(data.whatsappUrl, '_blank', 'noopener')
      }
      finishSuccess({ orderNumber: data.orderNumber, method: payment, fulfilment: mode, amount: total, whatsappUrl: data.whatsappUrl })
      setPlacing(false)
    } catch (err) {
      setPlacing(false)
      const status = err.response?.status
      const body = err.response?.data || {}
      if (status === 403 && body.closed) {
        if (body.ordering) setOrdering(body.ordering)
        else refreshStatus()
        toast.warn(body.message || 'Tiffin ordering is closed right now')
      } else if (status === 409 && Array.isArray(body.unavailable)) {
        removeMany(body.unavailable)
        loadMenu({ force: true })
        toast.warn(
          body.unavailable.length === 1
            ? 'One tiffin just went off the menu and was removed from your cart. Please review and place the order again.'
            : `${body.unavailable.length} tiffins just went off the menu and were removed from your cart. Please review and place the order again.`
        )
      } else if (status === 401 || body.tokenExpired) {
        toast.error('Please sign in again to place your order')
        setShowLogin?.(true)
      } else if (err.code === 'ECONNABORTED') {
        toast.error('The request timed out. Please check your connection and try again.')
      } else {
        toast.error(body.message || err.message || 'Could not place the tiffin order')
      }
    }
  }

  /* ---------------- Render states ---------------- */

  if (success) return <SuccessScreen data={success} />

  if (!token) {
    return (
      <div className="tf-checkout tf-checkout-center">
        <div className="tf-state">
          <span className="tf-empty-icon" aria-hidden="true">
            <i className="fas fa-user-lock"></i>
          </span>
          <h2>Sign in to order tiffins</h2>
          <p>Sign in so we can save your order and keep you updated on it. Your tiffin cart is kept as is.</p>
          <button type="button" className="btn-primary" onClick={() => setShowLogin?.(true)}>
            <i className="fas fa-sign-in-alt" aria-hidden="true"></i> Sign in
          </button>
          <Link to="/tiffins" className="tf-link-btn">Back to the tiffin menu</Link>
        </div>
      </div>
    )
  }

  const menuLoading = menu.status === 'idle' || menu.status === 'loading'

  if (!menuLoading && itemCount === 0) {
    return (
      <div className="tf-checkout tf-checkout-center">
        <div className="tf-state">
          <span className="tf-empty-icon" aria-hidden="true">
            <i className="fas fa-utensils"></i>
          </span>
          <h2>Your tiffin cart is empty</h2>
          <p>Pick a few fresh, organic tiffins from today&apos;s menu to get started.</p>
          <Link to="/tiffins" className="btn-primary">
            <i className="fas fa-leaf" aria-hidden="true"></i> See the tiffin menu
          </Link>
        </div>
      </div>
    )
  }

  if (menu.status === 'error' && !lines.length) {
    return (
      <div className="tf-checkout tf-checkout-center">
        <div className="tf-state">
          <span className="tf-empty-icon tf-empty-icon-warn" aria-hidden="true">
            <i className="fas fa-wifi"></i>
          </span>
          <h2>Couldn&apos;t load your cart</h2>
          <p>{menu.error}</p>
          <button type="button" className="btn-primary" onClick={() => loadMenu({ force: true })}>
            <i className="fas fa-redo" aria-hidden="true"></i> Try again
          </button>
        </div>
      </div>
    )
  }

  const placeDisabled = placing || !isOpen || belowMin || menuLoading || !lines.length

  return (
    <form className="tf-checkout" onSubmit={placeOrder} noValidate>
      <div className="tf-co-heading">
        <Link to="/tiffins" className="tf-back">
          <i className="fas fa-arrow-left" aria-hidden="true"></i> Tiffin menu
        </Link>
        <h1>Tiffin checkout</h1>
        <p>Fresh from our organic kitchen — just a few details.</p>
      </div>

      <div className="tf-co-banner">
        <OrderingBanner ordering={ordering} compact />
      </div>

      <div className="tf-co-left">
        {/* ---- Step 1: fulfilment ---- */}
        <section className="tf-co-card">
          <div className="tf-co-card-head">
            <span className="tf-step-badge" aria-hidden="true">1</span>
            <div>
              <h2>How would you like it?</h2>
              <p>Delivery to your door or pickup from our store</p>
            </div>
          </div>

          <div className="tf-choice-grid" role="radiogroup" aria-label="Delivery or pickup">
            {fulfilmentOptions.includes('delivery') && (
              <label className={`tf-choice ${mode === 'delivery' ? 'is-selected' : ''}`}>
                <input type="radio" name="fulfilment" value="delivery" checked={mode === 'delivery'} onChange={() => setFulfilment('delivery')} />
                <span className="tf-choice-icon" aria-hidden="true"><i className="fas fa-motorcycle"></i></span>
                <span className="tf-choice-text">
                  <strong>Delivery</strong>
                  <small>{Number(settings.deliveryFee) > 0 ? `${formatINR(settings.deliveryFee)} delivery fee` : 'Free delivery'}</small>
                </span>
              </label>
            )}
            {fulfilmentOptions.includes('pickup') && (
              <label className={`tf-choice ${mode === 'pickup' ? 'is-selected' : ''}`}>
                <input type="radio" name="fulfilment" value="pickup" checked={mode === 'pickup'} onChange={() => setFulfilment('pickup')} />
                <span className="tf-choice-icon" aria-hidden="true"><i className="fas fa-store"></i></span>
                <span className="tf-choice-text">
                  <strong>Store pickup</strong>
                  <small>No fee · {settings.pickupAddress}</small>
                </span>
              </label>
            )}
          </div>

          <AnimatePresence mode="wait" initial={false}>
            {mode === 'delivery' ? (
              <motion.div key="delivery" className="tf-co-sub" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.2, ease: EASE }}>
                <h3>Deliver to</h3>
                {addrState === 'loading' && (
                  <div className="tf-addr-grid" aria-busy="true">
                    <div className="skeleton tf-addr-sk"></div>
                    <div className="skeleton tf-addr-sk"></div>
                  </div>
                )}
                {addrState === 'error' && (
                  <p className="tf-warn">
                    <i className="fas fa-exclamation-circle" aria-hidden="true"></i>
                    <span>
                      Could not load your saved addresses.{' '}
                      <button type="button" className="tf-link-btn" onClick={fetchAddresses}>Retry</button>
                    </span>
                  </p>
                )}
                {addrState === 'ready' && addresses.length > 0 && (
                  <div className="tf-addr-grid" role="radiogroup" aria-label="Saved addresses">
                    {addresses.map((a) => (
                      <label key={a._id} className={`tf-addr ${selectedAddressId === a._id ? 'is-selected' : ''}`}>
                        <input
                          type="radio"
                          name="address"
                          checked={selectedAddressId === a._id}
                          onChange={() => {
                            setSelectedAddressId(a._id)
                            setErrors((er) => ({ ...er, address: undefined }))
                          }}
                        />
                        <span className="tf-addr-body">
                          <strong>{a.firstName} {a.lastName}</strong>
                          <span>{a.street}</span>
                          <span>{[a.city, a.state, a.zipcode].filter(Boolean).join(', ')}</span>
                          <span className="tf-addr-phone"><i className="fas fa-phone-alt" aria-hidden="true"></i> {a.phone}</span>
                        </span>
                        {selectedAddressId === a._id && <i className="fas fa-check-circle tf-addr-check" aria-hidden="true"></i>}
                      </label>
                    ))}
                  </div>
                )}
                {errors.address && <p className="tf-field-error">{errors.address}</p>}

                {addrState === 'ready' && (
                  <button type="button" className={`tf-add-addr ${showAddForm ? 'is-open' : ''}`} onClick={() => setShowAddForm((s) => !s)} aria-expanded={showAddForm}>
                    <i className={`fas ${showAddForm ? 'fa-times' : 'fa-plus'}`} aria-hidden="true"></i>
                    {showAddForm ? 'Cancel' : 'Add a new address'}
                  </button>
                )}

                <AnimatePresence initial={false}>
                  {showAddForm && addrState === 'ready' && (
                    <motion.div
                      key="addr-form"
                      className="tf-addr-form"
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6, transition: { duration: 0.15 } }}
                      transition={{ duration: 0.22, ease: EASE }}
                    >
                      <div className="tf-row">
                        <Field id="ta-first" label="First name *" error={errors.firstName}>
                          <input id="ta-first" name="firstName" autoComplete="given-name" value={newAddress.firstName} onChange={onAddrChange} />
                        </Field>
                        <Field id="ta-last" label="Last name">
                          <input id="ta-last" name="lastName" autoComplete="family-name" value={newAddress.lastName} onChange={onAddrChange} />
                        </Field>
                      </div>
                      <div className="tf-row">
                        <Field id="ta-phone" label="Mobile number *" error={errors.phone}>
                          <input id="ta-phone" name="phone" type="tel" inputMode="numeric" autoComplete="tel-national" placeholder="10-digit number" value={newAddress.phone} onChange={onAddrChange} />
                        </Field>
                        <Field id="ta-email" label="Email" error={errors.email}>
                          <input id="ta-email" name="email" type="email" autoComplete="email" value={newAddress.email} onChange={onAddrChange} />
                        </Field>
                      </div>
                      <Field id="ta-street" label="Flat / house, building, street *" error={errors.street}>
                        <input id="ta-street" name="street" autoComplete="street-address" value={newAddress.street} onChange={onAddrChange} />
                      </Field>
                      <div className="tf-row">
                        <Field id="ta-zip" label="PIN code *" error={errors.zipcode}>
                          <input id="ta-zip" name="zipcode" inputMode="numeric" autoComplete="postal-code" placeholder="560102" value={newAddress.zipcode} onChange={onAddrChange} />
                        </Field>
                        <Field id="ta-city" label="City">
                          <input id="ta-city" name="city" autoComplete="address-level2" value={newAddress.city} onChange={onAddrChange} />
                        </Field>
                      </div>
                      <button type="button" className="btn-primary" onClick={saveAddress} disabled={savingAddress}>
                        {savingAddress ? <span className="tf-spinner" aria-hidden="true"></span> : <i className="fas fa-check" aria-hidden="true"></i>}
                        {savingAddress ? 'Saving…' : 'Save address'}
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ) : (
              <motion.div key="pickup" className="tf-co-sub" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.2, ease: EASE }}>
                <div className="tf-pickup-at">
                  <i className="fas fa-map-marker-alt" aria-hidden="true"></i>
                  <div>
                    <strong>Pick up from</strong>
                    <p>{settings.pickupAddress}</p>
                  </div>
                </div>
                <div className="tf-row">
                  <Field id="tp-name" label="Your name *" error={errors.contactName}>
                    <input id="tp-name" autoComplete="name" value={contact.name} onChange={(e) => setContact((c) => ({ ...c, name: e.target.value }))} />
                  </Field>
                  <Field id="tp-phone" label="Mobile number *" error={errors.contactPhone}>
                    <input
                      id="tp-phone"
                      type="tel"
                      inputMode="numeric"
                      autoComplete="tel-national"
                      placeholder="10-digit number"
                      value={contact.phone}
                      onChange={(e) => setContact((c) => ({ ...c, phone: e.target.value.replace(/\D/g, '').slice(0, 10) }))}
                    />
                  </Field>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <Field id="t-notes" label="Notes for the kitchen (optional)">
            <textarea id="t-notes" rows={2} maxLength={500} placeholder="e.g. less spicy, extra chutney, ring the bell" value={notes} onChange={(e) => setNotes(e.target.value)} />
          </Field>
        </section>

        {/* ---- Step 2: payment ---- */}
        <section className="tf-co-card">
          <div className="tf-co-card-head">
            <span className="tf-step-badge" aria-hidden="true">2</span>
            <div>
              <h2>Payment</h2>
              <p>Choose how you&apos;d like to pay</p>
            </div>
          </div>
          <div className="tf-pay-options" role="radiogroup" aria-label="Payment method">
            {PAYMENT_OPTIONS.map((p) => (
              <label key={p.value} className={`tf-choice tf-pay ${payment === p.value ? 'is-selected' : ''}`}>
                <input type="radio" name="payment" value={p.value} checked={payment === p.value} onChange={() => setPayment(p.value)} />
                <span className="tf-choice-icon" aria-hidden="true"><i className={`${p.brand ? 'fab' : 'fas'} ${p.icon}`}></i></span>
                <span className="tf-choice-text">
                  <strong>{p.title(mode)}</strong>
                  <small>{p.desc(mode)}</small>
                </span>
              </label>
            ))}
          </div>
        </section>
      </div>

      {/* ---- Summary ---- */}
      <aside className="tf-co-right">
        <div className="tf-summary">
          <p className="tf-summary-title">Order summary</p>
          {menuLoading && !lines.length ? (
            <div aria-busy="true">
              <div className="skeleton tf-sum-sk"></div>
              <div className="skeleton tf-sum-sk"></div>
            </div>
          ) : (
            <ul className="tf-sum-lines">
              <AnimatePresence initial={false}>
                {lines.map(({ id, item, qty, lineTotal }) => (
                  <motion.li key={id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, x: 16 }} transition={{ duration: 0.2 }} className="tf-sum-line">
                    <span className="tf-sum-thumb">
                      {item.image ? <img src={sizedImageUrl(item.image, 96)} alt="" loading="lazy" decoding="async" width="44" height="44" /> : <i className="fas fa-utensils" aria-hidden="true"></i>}
                    </span>
                    <span className="tf-sum-info">
                      <strong>{item.name}</strong>
                      {item.subtitle && <small>{bracketed(item.subtitle)}</small>}
                      <QtyStepper size="sm" qty={qty} name={item.name} onIncrement={() => increment(id)} onDecrement={() => decrement(id)} disabled={!isOpen} disabledHint={ordering?.message} />
                    </span>
                    <span className="tf-sum-price">{formatINR(lineTotal)}</span>
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>
          )}

          <div className="tf-sum-totals">
            <div><span>Subtotal</span><span>{formatINR(subtotal)}</span></div>
            {mode === 'delivery' && <div><span>Delivery fee</span><span>{deliveryFee ? formatINR(deliveryFee) : 'Free'}</span></div>}
            {mode === 'pickup' && <div><span>Store pickup</span><span>Free</span></div>}
          </div>
          <div className="tf-sum-total">
            <span>Total</span>
            <strong>{formatINR(total)}</strong>
          </div>

          {belowMin && (
            <p className="tf-warn">
              <i className="fas fa-info-circle" aria-hidden="true"></i>
              <span>Minimum tiffin order is {formatINR(minOrder)}. Add {formatINR(minOrder - subtotal)} more to place the order.</span>
            </p>
          )}
          {ordering && !isOpen && (
            <p className="tf-warn tf-warn-amber">
              <i className="fas fa-clock" aria-hidden="true"></i>
              <span>{ordering.message}. Your cart is saved until then.</span>
            </p>
          )}

          <button type="submit" className={`btn-primary tf-block-btn tf-place-btn ${placing ? 'is-loading' : ''}`} disabled={placeDisabled} aria-busy={placing}>
            {placing && <span className="tf-spinner" aria-hidden="true"></span>}
            {placing
              ? payment === 'Online' ? 'Opening payment…' : 'Placing order…'
              : !isOpen && ordering ? 'Ordering closed' : `Place order · ${formatINR(total)}`}
          </button>
          <p className="tf-secure">
            <i className="fas fa-lock" aria-hidden="true"></i> Prices are confirmed by our store when you place the order.
          </p>
        </div>
      </aside>
    </form>
  )
}

TiffinCheckout.propTypes = {
  setShowLogin: PropTypes.func,
}

/* ---------------- Small pieces ---------------- */

const Field = ({ id, label, error, children }) => (
  <div className={`tf-field ${error ? 'has-error' : ''}`}>
    <label htmlFor={id}>{label}</label>
    {children}
    {error && <span className="tf-field-error" role="alert">{error}</span>}
  </div>
)

Field.propTypes = {
  id: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  error: PropTypes.string,
  children: PropTypes.node,
}

const SuccessScreen = ({ data }) => {
  const methodText = {
    COD: data.fulfilment === 'pickup' ? 'Pay when you pick it up.' : 'Pay when your tiffin arrives.',
    Online: 'Payment received — thank you!',
    WHATSAPP_PAY: 'Complete the UPI payment on WhatsApp to confirm your order.',
  }[data.method]

  return (
    <div className="tf-checkout tf-checkout-center">
      <motion.div className="tf-success" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, ease: EASE }}>
        <motion.span className="tf-success-icon" initial={{ scale: 0.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.35, ease: [0.34, 1.56, 0.64, 1], delay: 0.1 }} aria-hidden="true">
          <i className="fas fa-check"></i>
        </motion.span>
        <h1>Order placed!</h1>
        <p className="tf-success-num">
          Order number <strong>{data.orderNumber}</strong>
        </p>
        <p>
          {data.fulfilment === 'pickup' ? 'We will have it ready for pickup.' : 'We will deliver it fresh to your door.'} {methodText}
        </p>
        {data.method === 'WHATSAPP_PAY' && data.whatsappUrl && (
          <a href={data.whatsappUrl} target="_blank" rel="noopener noreferrer" className="tf-wa-btn">
            <i className="fab fa-whatsapp" aria-hidden="true"></i> Open WhatsApp to pay
          </a>
        )}
        <div className="tf-success-actions">
          <Link to="/tiffins/orders" className="btn-primary">
            <i className="fas fa-receipt" aria-hidden="true"></i> View my tiffin orders
          </Link>
          <Link to="/tiffins" className="tf-link-btn">Back to the menu</Link>
        </div>
      </motion.div>
    </div>
  )
}

SuccessScreen.propTypes = {
  data: PropTypes.shape({
    orderNumber: PropTypes.string,
    method: PropTypes.string,
    fulfilment: PropTypes.string,
    whatsappUrl: PropTypes.string,
  }).isRequired,
}

export default TiffinCheckout
