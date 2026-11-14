import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import PropTypes from 'prop-types'
import axios from 'axios'
import { toast } from 'react-toastify'
import {
  TiffinContext,
  TIFFIN_CART_KEY,
  MAX_TIFFIN_QTY,
  FALLBACK_SETTINGS,
  safeStorage,
} from './tiffinStore'

const readCart = () => {
  const raw = safeStorage.get(TIFFIN_CART_KEY, {})
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {}
  const clean = {}
  for (const [id, qty] of Object.entries(raw)) {
    const n = Math.floor(Number(qty))
    if (id && n > 0) clean[id] = Math.min(n, MAX_TIFFIN_QTY)
  }
  return clean
}

/**
 * Tiffin menu + ordering status + a separate tiffin cart.
 * Cart shape: { [tiffinId]: quantity }. Display prices always come from the latest menu.
 */
const TiffinProvider = ({ children }) => {
  const url = import.meta.env.VITE_BACKEND_URL
  const [cart, setCart] = useState(readCart)
  const [menu, setMenu] = useState({ status: 'idle', items: [], error: null })
  const [ordering, setOrdering] = useState(null)
  const [settings, setSettings] = useState(FALLBACK_SETTINGS)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const inflight = useRef(null)
  const statusRef = useRef(menu.status)
  statusRef.current = menu.status
  const cartRef = useRef(cart)
  cartRef.current = cart

  // Persist the cart
  useEffect(() => {
    if (Object.keys(cart).length) safeStorage.set(TIFFIN_CART_KEY, cart)
    else safeStorage.remove(TIFFIN_CART_KEY)
  }, [cart])

  // Keep tabs in sync
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === TIFFIN_CART_KEY) setCart(readCart())
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const loadMenu = useCallback(
    async ({ force = false } = {}) => {
      if (inflight.current) return inflight.current
      if (!force && statusRef.current === 'ready') return null
      setMenu((m) => ({ ...m, status: m.status === 'ready' ? 'ready' : 'loading', error: null }))
      const req = axios
        .get(`${url}/api/tiffin/menu`, { timeout: 20000 })
        .then((res) => {
          if (!res.data?.success) throw new Error(res.data?.message || 'Could not load the tiffin menu')
          setMenu({ status: 'ready', items: Array.isArray(res.data.data) ? res.data.data : [], error: null })
          if (res.data.ordering) setOrdering(res.data.ordering)
          if (res.data.settings) setSettings({ ...FALLBACK_SETTINGS, ...stripEmpty(res.data.settings) })
          return res.data
        })
        .catch((err) => {
          const message = err.response?.data?.message || (err.code === 'ECONNABORTED' ? 'The menu is taking too long to load.' : 'We could not load the tiffin menu.')
          setMenu((m) => (m.status === 'ready' ? m : { status: 'error', items: [], error: message }))
          return null
        })
        .finally(() => {
          inflight.current = null
        })
      inflight.current = req
      return req
    },
    [url]
  )

  const refreshStatus = useCallback(async () => {
    try {
      const res = await axios.get(`${url}/api/tiffin/status`, { timeout: 15000 })
      if (res.data?.ordering) setOrdering(res.data.ordering)
      return res.data?.ordering || null
    } catch {
      return null
    }
  }, [url])

  // Drop items that are no longer on the menu once fresh menu data arrives
  useEffect(() => {
    if (menu.status !== 'ready') return
    const ids = new Set(menu.items.map((t) => String(t._id)))
    const stale = Object.keys(cartRef.current).filter((id) => !ids.has(id))
    if (!stale.length) return
    setCart((prev) => {
      const next = { ...prev }
      stale.forEach((id) => delete next[id])
      return next
    })
    toast.info(
      stale.length === 1
        ? 'One tiffin in your cart is no longer on the menu and was removed.'
        : `${stale.length} tiffins in your cart are no longer on the menu and were removed.`,
      { toastId: 'tiffin-stale' }
    )
  }, [menu])

  const setQty = useCallback((id, qty) => {
    const key = String(id)
    setCart((prev) => {
      const n = Math.max(0, Math.min(MAX_TIFFIN_QTY, Math.floor(qty)))
      if ((prev[key] || 0) === n) return prev
      const next = { ...prev }
      if (n === 0) delete next[key]
      else next[key] = n
      return next
    })
  }, [])

  const add = useCallback((id) => setCart((p) => (p[id] ? p : { ...p, [String(id)]: 1 })), [])
  const increment = useCallback((id) => {
    if ((cartRef.current[id] || 0) >= MAX_TIFFIN_QTY) {
      toast.info(`You can order up to ${MAX_TIFFIN_QTY} of one tiffin`, { toastId: 'tiffin-max' })
      return
    }
    setCart((prev) => {
      const cur = prev[id] || 0
      return cur >= MAX_TIFFIN_QTY ? prev : { ...prev, [String(id)]: cur + 1 }
    })
  }, [])
  const decrement = useCallback((id) => {
    setCart((prev) => {
      const cur = prev[id] || 0
      if (cur <= 0) return prev
      const next = { ...prev }
      if (cur === 1) delete next[id]
      else next[id] = cur - 1
      return next
    })
  }, [])
  const remove = useCallback((id) => setQty(id, 0), [setQty])
  const removeMany = useCallback((ids) => {
    setCart((prev) => {
      const next = { ...prev }
      ;(ids || []).forEach((id) => delete next[String(id)])
      return next
    })
  }, [])
  const clear = useCallback(() => setCart({}), [])

  const lines = useMemo(() => {
    const byId = new Map(menu.items.map((t) => [String(t._id), t]))
    return Object.entries(cart)
      .map(([id, qty]) => {
        const item = byId.get(id)
        return item ? { id, item, qty, lineTotal: (Number(item.price) || 0) * qty } : null
      })
      .filter(Boolean)
  }, [cart, menu.items])

  const itemCount = useMemo(() => Object.values(cart).reduce((s, q) => s + q, 0), [cart])
  const subtotal = useMemo(() => Math.round(lines.reduce((s, l) => s + l.lineTotal, 0) * 100) / 100, [lines])
  const qtyOf = useCallback((id) => cart[String(id)] || 0, [cart])

  const value = useMemo(
    () => ({
      url,
      menu,
      loadMenu,
      ordering,
      setOrdering,
      refreshStatus,
      settings,
      cart,
      lines,
      itemCount,
      subtotal,
      qtyOf,
      add,
      increment,
      decrement,
      remove,
      removeMany,
      setQty,
      clear,
      drawerOpen,
      setDrawerOpen,
    }),
    [url, menu, loadMenu, ordering, refreshStatus, settings, cart, lines, itemCount, subtotal, qtyOf, add, increment, decrement, remove, removeMany, setQty, clear, drawerOpen]
  )

  return <TiffinContext.Provider value={value}>{children}</TiffinContext.Provider>
}

// API strings that are blank should not wipe out the poster fallbacks
function stripEmpty(obj) {
  const out = {}
  for (const [k, v] of Object.entries(obj || {})) {
    if (v === '' || v === null || v === undefined) continue
    out[k] = v
  }
  return out
}

TiffinProvider.propTypes = {
  children: PropTypes.node,
}

export default TiffinProvider
