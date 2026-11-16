import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import PropTypes from 'prop-types'
import './Tiffins.css'
import '../../Components/Tiffin/Tiffin.css'
import Reveal from '../../Components/Motion/Reveal'
import TiffinCard, { TiffinCardSkeleton } from '../../Components/Tiffin/TiffinCard'
import OrderingBanner from '../../Components/Tiffin/OrderingBanner'
import TiffinCartBar from '../../Components/Tiffin/TiffinCartBar'
import TiffinCartDrawer from '../../Components/Tiffin/TiffinCartDrawer'
import useOrderingPoll from '../../Components/Tiffin/useOrderingPoll'
import { useTiffin, MAPS_FALLBACK } from '../../Context/tiffinStore'

const BADGES = [
  { icon: 'fa-leaf', title: '100% Organic' },
  { icon: 'fa-flask', title: 'No Chemicals', strike: true },
  { icon: 'fa-bowl-rice', title: 'Wholesome Traditional Food' },
  { icon: 'fa-seedling', title: 'Farm Fresh Ingredients' },
]

const ReviewQr = ({ value }) => {
  const [src, setSrc] = useState('')
  useEffect(() => {
    let alive = true
    if (!value) return undefined
    import('qrcode')
      .then((mod) => (mod.default || mod).toDataURL(value, { margin: 1, width: 180, color: { dark: '#13452b', light: '#ffffff' } }))
      .then((data) => alive && setSrc(data))
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [value])
  if (!src) {
    return (
      <span className="tf-qr tf-qr-icon" aria-hidden="true">
        <i className="fas fa-qrcode"></i>
      </span>
    )
  }
  return <img className="tf-qr" src={src} alt="QR code to rate Chanvi Farms on Google Reviews" width="120" height="120" />
}

ReviewQr.propTypes = {
  value: PropTypes.string,
}

const Tiffins = () => {
  const { menu, loadMenu, ordering, settings, qtyOf, add, increment, decrement, itemCount, setDrawerOpen } = useTiffin()
  useOrderingPoll()

  // Close the drawer if the user leaves the page with it open
  useEffect(() => () => setDrawerOpen(false), [setDrawerOpen])

  const isOpen = !!ordering?.isOpen
  const closedHint = ordering && !isOpen ? ordering.message : 'Checking ordering hours…'

  const credits = menu.items.filter((t) => t.imageCredit?.author)
  const mapsUrl = settings.mapsUrl || MAPS_FALLBACK
  const reviewUrl = settings.reviewUrl

  const renderGrid = () => {
    if (menu.status === 'idle' || menu.status === 'loading') {
      return (
        <div className="tf-grid" aria-busy="true" aria-label="Loading tiffin menu">
          {Array.from({ length: 8 }, (_, i) => (
            <TiffinCardSkeleton key={i} />
          ))}
        </div>
      )
    }
    if (menu.status === 'error') {
      return (
        <div className="tf-state">
          <span className="tf-empty-icon tf-empty-icon-warn" aria-hidden="true">
            <i className="fas fa-wifi"></i>
          </span>
          <h3>Couldn&apos;t load the menu</h3>
          <p>{menu.error}</p>
          <button type="button" className="btn-primary" onClick={() => loadMenu({ force: true })}>
            <i className="fas fa-redo" aria-hidden="true"></i> Try again
          </button>
        </div>
      )
    }
    if (!menu.items.length) {
      return (
        <div className="tf-state">
          <span className="tf-empty-icon" aria-hidden="true">
            <i className="fas fa-utensils"></i>
          </span>
          <h3>Today&apos;s menu is being prepared</h3>
          <p>No tiffins are listed right now. Please check back a little later, or browse our organic groceries meanwhile.</p>
          <Link to="/shop" className="btn-primary">
            <i className="fas fa-leaf" aria-hidden="true"></i> Shop organic groceries
          </Link>
        </div>
      )
    }
    return (
      <div className="tf-grid">
        {menu.items.map((t, i) => (
          <Reveal key={t._id} delay={Math.min(i % 4, 3) * 0.05} y={16} className="tf-grid-cell">
            <TiffinCard
              tiffin={t}
              qty={qtyOf(t._id)}
              isOpen={isOpen}
              closedHint={closedHint}
              onAdd={() => add(t._id)}
              onIncrement={() => increment(t._id)}
              onDecrement={() => decrement(t._id)}
            />
          </Reveal>
        ))}
      </div>
    )
  }

  return (
    <div className={`tiffins-page ${itemCount > 0 ? 'has-cartbar' : ''}`}>
      {/* ---------- Poster header ---------- */}
      <header className="tf-hero">
        <span className="tf-hero-leaf tf-hero-leaf-l" aria-hidden="true"></span>
        <span className="tf-hero-leaf tf-hero-leaf-r" aria-hidden="true"></span>
        <p className="tf-hero-kicker">
          <i className="fas fa-leaf" aria-hidden="true"></i> Organic kitchen · HSR Layout
        </p>
        <h1 className="tf-hero-title">Chanvi Farms</h1>
        <p className="tf-hero-tag">Freshness Delivered</p>

        <ul className="tf-badges">
          {BADGES.map((b, i) => (
            <Reveal as="li" key={b.title} delay={i * 0.05} y={12} className="tf-badge">
              <span className={`tf-badge-icon ${b.strike ? 'is-strike' : ''}`} aria-hidden="true">
                <i className={`fas ${b.icon}`}></i>
              </span>
              <span>{b.title}</span>
            </Reveal>
          ))}
        </ul>
      </header>

      {/* ---------- Ribbon ---------- */}
      <div className="tf-ribbon-wrap">
        <h2 className="tf-ribbon">
          <span>Our Organic</span> <em>Tiffins Menu</em>
        </h2>
      </div>

      <OrderingBanner ordering={ordering} />

      {ordering && !isOpen && menu.status === 'ready' && menu.items.length > 0 && (
        <p className="tf-closed-hint">
          <i className="fas fa-info-circle" aria-hidden="true"></i> You can browse the menu now. Adding to cart unlocks when ordering opens.
        </p>
      )}

      <section aria-label="Tiffin menu">{renderGrid()}</section>

      {/* ---------- Groceries / produce ---------- */}
      <section className="tf-promos" aria-label="More from Chanvi Farms">
        <Reveal y={16}>
          <Link to="/shop" className="tf-promo tf-promo-grocery">
            <span className="tf-promo-icon" aria-hidden="true">
              <i className="fas fa-wheat-awn"></i>
            </span>
            <span className="tf-promo-body">
              <strong>Organic Groceries</strong>
              <span>Pulses | Rice | Millets | Oils | Ghee | Honey and more…</span>
            </span>
            <i className="fas fa-arrow-right tf-promo-arrow" aria-hidden="true"></i>
          </Link>
        </Reveal>
        <Reveal y={16} delay={0.06}>
          <Link to="/shop" className="tf-promo tf-promo-veg">
            <span className="tf-promo-icon" aria-hidden="true">
              <i className="fas fa-carrot"></i>
            </span>
            <span className="tf-promo-body">
              <strong>Organic Vegetables &amp; Fruits</strong>
              <span>Farm Fresh | Seasonal | Chemical Free</span>
            </span>
            <i className="fas fa-arrow-right tf-promo-arrow" aria-hidden="true"></i>
          </Link>
        </Reveal>
      </section>

      {/* ---------- Timings + reviews ---------- */}
      <section className="tf-info" aria-label="Store timings and reviews">
        <Reveal y={16} className="tf-info-box">
          <span className="tf-info-icon" aria-hidden="true">
            <i className="fas fa-store"></i>
          </span>
          <div>
            <h3>Organic Store Timings</h3>
            <p>{settings.storeTimings}</p>
          </div>
        </Reveal>
        <Reveal y={16} delay={0.05} className="tf-info-box">
          <span className="tf-info-icon" aria-hidden="true">
            <i className="fas fa-apple-alt"></i>
          </span>
          <div>
            <h3>Fruits &amp; Vegetables Timings</h3>
            <p>{settings.produceTimings}</p>
          </div>
        </Reveal>
        <Reveal y={16} delay={0.1} className="tf-info-box tf-review">
          <ReviewQr value={reviewUrl} />
          <div>
            <h3>Scan &amp; Share Your Experience</h3>
            <p>Rate us on Google Reviews</p>
            {reviewUrl && (
              <a href={reviewUrl} target="_blank" rel="noopener noreferrer" className="tf-review-link">
                <i className="fab fa-google" aria-hidden="true"></i> Write a review
              </a>
            )}
            <p className="tf-thanks">Thank you!</p>
          </div>
        </Reveal>
      </section>

      {/* ---------- Address strip ---------- */}
      <Reveal y={12} className="tf-strip">
        <p>
          <i className="fas fa-map-marker-alt" aria-hidden="true"></i> {settings.pickupAddress}
        </p>
        <a href={mapsUrl} target="_blank" rel="noopener noreferrer">
          <i className="fas fa-map-marked-alt" aria-hidden="true"></i> Find us on Google Maps
        </a>
      </Reveal>

      <div className="tf-page-links">
        <Link to="/tiffins/orders">
          <i className="fas fa-receipt" aria-hidden="true"></i> My tiffin orders
        </Link>
      </div>

      {credits.length > 0 && (
        <details className="tf-credits">
          <summary>Photo credits</summary>
          <ul>
            {credits.map((t) => (
              <li key={t._id}>
                <strong>{t.name}</strong> — photo by {t.imageCredit.author}
                {t.imageCredit.license && <>, {t.imageCredit.license}</>}
                {t.imageCredit.sourceUrl && (
                  <>
                    {' '}
                    (
                    <a href={t.imageCredit.sourceUrl} target="_blank" rel="noopener noreferrer">
                      source
                    </a>
                    )
                  </>
                )}
              </li>
            ))}
          </ul>
        </details>
      )}

      <TiffinCartBar />
      <TiffinCartDrawer />
    </div>
  )
}

export default Tiffins
