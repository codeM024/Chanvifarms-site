import { memo, useState } from 'react'
import PropTypes from 'prop-types'
import QtyStepper from './QtyStepper'
import { sizedImageUrl } from '../../utils/imageUrl'
import { bracketed, formatINR } from '../../Context/tiffinStore'

const TiffinCard = ({ tiffin, qty, isOpen, closedHint, onAdd, onIncrement, onDecrement }) => {
  const [loaded, setLoaded] = useState(false)
  const [failed, setFailed] = useState(false)
  const src = sizedImageUrl(tiffin.image, 480)

  return (
    <article className={`tf-card ${qty > 0 ? 'is-in-cart' : ''}`}>
      <div className="tf-card-visual">
        <h3 className="tf-card-name">{tiffin.name}</h3>
        {tiffin.subtitle ? <p className="tf-card-sub">{bracketed(tiffin.subtitle)}</p> : <p className="tf-card-sub tf-card-sub-empty" aria-hidden="true">&nbsp;</p>}

        <div className="tf-plate">
          <span className="tf-leaf" aria-hidden="true"></span>
          <div className={`tf-dish ${loaded ? '' : 'skeleton'}`}>
            {src && !failed ? (
              <img
                src={src}
                alt={tiffin.name}
                loading="lazy"
                decoding="async"
                width="240"
                height="240"
                className={`img-fade ${loaded ? 'is-loaded' : ''}`}
                onLoad={() => setLoaded(true)}
                onError={() => {
                  setFailed(true)
                  setLoaded(true)
                }}
              />
            ) : (
              <span className="tf-dish-fallback" aria-hidden="true">
                <i className="fas fa-utensils"></i>
              </span>
            )}
          </div>
          {qty > 0 && (
            <span className="tf-in-cart-badge" aria-label={`${qty} in cart`}>
              {qty}
            </span>
          )}
        </div>

        <span className="tf-price-pill">{formatINR(tiffin.price)}/-</span>
      </div>

      <div className="tf-card-foot">
        {tiffin.description && <p className="tf-card-desc">{tiffin.description}</p>}
        <QtyStepper
          qty={qty}
          name={tiffin.name}
          onAdd={onAdd}
          onIncrement={onIncrement}
          onDecrement={onDecrement}
          disabled={!isOpen}
          disabledLabel="Closed"
          disabledHint={closedHint}
        />
      </div>
    </article>
  )
}

TiffinCard.propTypes = {
  tiffin: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    subtitle: PropTypes.string,
    description: PropTypes.string,
    price: PropTypes.number.isRequired,
    image: PropTypes.string,
  }).isRequired,
  qty: PropTypes.number.isRequired,
  isOpen: PropTypes.bool.isRequired,
  closedHint: PropTypes.string,
  onAdd: PropTypes.func.isRequired,
  onIncrement: PropTypes.func.isRequired,
  onDecrement: PropTypes.func.isRequired,
}

export const TiffinCardSkeleton = () => (
  <div className="tf-card tf-card-skeleton" aria-hidden="true">
    <div className="tf-card-visual">
      <div className="skeleton tf-sk-line tf-sk-w60"></div>
      <div className="skeleton tf-sk-line tf-sk-w40 tf-sk-thin"></div>
      <div className="tf-plate">
        <div className="skeleton tf-sk-dish"></div>
      </div>
    </div>
    <div className="tf-card-foot">
      <div className="skeleton tf-sk-btn"></div>
    </div>
  </div>
)

const MemoTiffinCard = memo(TiffinCard)

export default MemoTiffinCard
