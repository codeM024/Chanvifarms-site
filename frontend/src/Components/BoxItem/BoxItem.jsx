import { useContext, useState } from 'react'
import PropTypes from 'prop-types'
import { motion } from 'framer-motion'
import './BoxItem.css'
import { StoreContext } from '../../Context/StoreContext'
import { imageUrl } from '../../utils/imageUrl'

const BoxThumb = ({ product }) => {
  const [loaded, setLoaded] = useState(false)
  if (!product.image) {
    return <div className="box-thumb box-thumb-fallback">{product.name ? product.name.charAt(0) : '?'}</div>
  }
  return (
    <div className={`box-thumb ${loaded ? '' : 'skeleton'}`}>
      <img
        src={imageUrl(product.image)}
        alt={product.name || 'product'}
        loading="lazy"
        decoding="async"
        className={`img-fade ${loaded ? 'is-loaded' : ''}`}
        onLoad={() => setLoaded(true)}
        onError={() => setLoaded(true)}
      />
    </div>
  )
}

BoxThumb.propTypes = {
  product: PropTypes.object.isRequired
}

const BoxItem = ({ box }) => {
  const { name, items, price, marketPrice } = box;
  const { addToCart } = useContext(StoreContext);
  const [adding, setAdding] = useState(false);

  const formatSizeLabel = (s) => s === 'g100' ? '100 gm' : s === 'g150' ? '150 gm' : s === 'g200' ? '200 gm' : s === 'g250' ? '250 gm' : s === 'g300' ? '300 gm' : s === 'g400' ? '400 gm' : s === 'g500' ? '500 gm' : '1 kg';

  const handleAddBox = async () => {
    try {
      setAdding(true);
      await addToCart(box._id, 'box', box);
    } catch (error) {
      console.error('Error adding box:', error);
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="box-item">
      <div className="box-header">
        <span className="box-badge"><i className="fas fa-box-open"></i> Box</span>
        <h3>{name}</h3>
      </div>

      <div className="box-contents">
        {items.map((it, idx) => {
          const product = it.itemId || {}
          const ourPrice = product.prices?.[it.size] ?? product.price ?? 0
          const market = product.marketPrices?.[it.size] ?? product.marketPrice ?? ourPrice
          return (
            <div key={idx} className="box-content-row">
              <BoxThumb product={product} />
              <div className="box-content-info">
                <div className="name">{product.name}</div>
                <div className="size">{formatSizeLabel(it.size)}</div>
              </div>
              <div className="item-prices">
                {market > ourPrice && <span className="item-market">₹{market}</span>}
                <span className="item-price">₹{ourPrice}</span>
              </div>
            </div>
          )
        })}
      </div>

      <div className="box-prices">
        <div className="box-total">
          <span className="total-label">Total</span>
          <div>
            {marketPrice > price && <span className="market">₹{marketPrice}</span>}
            <span className="price">₹{price}</span>
          </div>
        </div>
        <motion.button
          className="box-add-btn"
          onClick={handleAddBox}
          disabled={adding}
          whileTap={adding ? undefined : { scale: 0.93 }}
          transition={{ type: 'spring', stiffness: 600, damping: 20 }}
        >
          <i className={`fas ${adding ? 'fa-spinner fa-spin' : 'fa-cart-plus'}`}></i>
          {adding ? 'Adding...' : 'Add Box'}
        </motion.button>
      </div>
    </div>
  )
}

BoxItem.propTypes = {
  box: PropTypes.object.isRequired
}

export default BoxItem
