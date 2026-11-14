import { createContext, useContext } from 'react'

// Tiffin ordering lives in its own context, fully separate from the grocery StoreContext cart.
export const TiffinContext = createContext(null)

export const useTiffin = () => {
  const ctx = useContext(TiffinContext)
  if (!ctx) throw new Error('useTiffin must be used inside <TiffinProvider>')
  return ctx
}

export const TIFFIN_CART_KEY = 'tiffinCart'
export const TIFFIN_CONTACT_KEY = 'tiffinPickupContact'
export const MAX_TIFFIN_QTY = 20

// Poster text, used until (or if) the API settings arrive
export const FALLBACK_SETTINGS = {
  deliveryEnabled: true,
  pickupEnabled: true,
  deliveryFee: 40,
  minOrderAmount: 0,
  pickupAddress: 'Chanvi Farms, Rooftop, HSR Layout, 22nd Main Road, Bengaluru – 560102',
  storeTimings: '7:00 AM - 10:00 PM (All Days)',
  produceTimings: "6:00 AM - 10:00 PM (Wednesday, Saturday & Sunday's)",
  mapsUrl: '',
  reviewUrl: '',
}

export const FALLBACK_WINDOWS = [
  { label: 'Breakfast', start: '07:00', end: '11:30', text: '7:00 AM - 11:30 AM' },
  { label: 'Dinner', start: '18:00', end: '24:00', text: '6:00 PM - 12:00 AM (midnight)' },
]

export const MAPS_FALLBACK = 'https://www.google.com/maps/search/?api=1&query=Chanvi+Farms+HSR+Layout+Bengaluru'

export const safeStorage = {
  get(key, fallback = null) {
    try {
      const raw = window.localStorage.getItem(key)
      return raw ? JSON.parse(raw) : fallback
    } catch {
      return fallback
    }
  },
  set(key, value) {
    try {
      window.localStorage.setItem(key, JSON.stringify(value))
    } catch {
      /* storage full or blocked - cart still works in memory */
    }
  },
  remove(key) {
    try {
      window.localStorage.removeItem(key)
    } catch {
      /* ignore */
    }
  },
}

/** ₹80, ₹1,250, ₹42.50 */
export const formatINR = (value) => {
  const n = Number(value) || 0
  const opts = Number.isInteger(n)
    ? { maximumFractionDigits: 0 }
    : { minimumFractionDigits: 2, maximumFractionDigits: 2 }
  return `₹${n.toLocaleString('en-IN', opts)}`
}

/** "2 pcs" -> "(2 pcs)"; keeps an existing bracketed subtitle as is */
export const bracketed = (subtitle) => {
  const s = String(subtitle || '').trim()
  if (!s) return ''
  return s.startsWith('(') ? s : `(${s})`
}
