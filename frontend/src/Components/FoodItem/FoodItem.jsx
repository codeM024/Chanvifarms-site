import { useContext, useState, useEffect, memo } from 'react'
import PropTypes from 'prop-types'
import { motion, AnimatePresence } from 'framer-motion'
import "./FoodItem.css"
import { StoreContext } from '../../Context/StoreContext'

const FoodItemComponent = ({
  id, 
  name, 
  prices,
  marketPrices, 
  description, 
  image, 
  quantityOptions, 
  status,
  isExpanded,
  onExpand
  , hideAddToCart
}) => {
  const {cartItems, addToCart, removeFromCart, url} = useContext(StoreContext)
  const [imgLoaded, setImgLoaded] = useState(false)
  const [selectedQuantity, setSelectedQuantity] = useState(() => {
    // Try to find the smallest available quantity
    const availableSizes = ['g100', 'g150', 'g200', 'g250', 'g300', 'g400', 'g500', 'kg1'];
    const firstEnabled = availableSizes.find(size => quantityOptions?.[size]);
    return firstEnabled || 'g250';
  })
  
  // Update selected quantity if current selection becomes unavailable
  useEffect(() => {
    if (!quantityOptions?.[selectedQuantity]) {
      const firstAvailable = Object.entries(quantityOptions || {})
        .find(([, isEnabled]) => isEnabled)
      if (firstAvailable) {
        setSelectedQuantity(firstAvailable[0])
      }
    }
  }, [quantityOptions, selectedQuantity])
  
  const cartKey = `${id}_${selectedQuantity}`
  const cartItem = cartItems[cartKey]
  
  const availableQuantities = Object.entries(quantityOptions || {})
    .filter(([, isEnabled]) => isEnabled)
    .map(([key]) => ({
      value: key,
      label: key === 'g100' ? '100 gm' :
             key === 'g150' ? '150 gm' :
             key === 'g200' ? '200 gm' :
             key === 'g250' ? '250 gm' :
             key === 'g300' ? '300 gm' :
             key === 'g400' ? '400 gm' :
             key === 'g500' ? '500 gm' : '1 kg'
    }));

  const currentPrice = prices?.[selectedQuantity] || 0;
  const currentMarketPrice = marketPrices?.[selectedQuantity] || currentPrice;

  const handleAddToCart = () => {
    if (status !== 'in-stock') return;
    addToCart(id, selectedQuantity);
  };

  const handleQuantityChange = (action) => {
    if (action === 'increase') {
      addToCart(id, selectedQuantity);
    } else {
      removeFromCart(id, selectedQuantity);
    }
  };

  const getStatusDisplay = () => {
    switch(status) {
      case 'out-of-stock':
        return 'Out of Stock';
      case 'coming-soon':
        return 'Coming Soon...';
      default:
        return null;
    }
  };

  return (
    <div className={`food-item ${status !== 'in-stock' ? 'disabled' : ''} ${isExpanded ? 'expanded' : ''}`}>
      <div className={`food-item-img-container ${imgLoaded ? '' : 'skeleton'}`}>
        <img
          className={`food-item-image img-fade ${imgLoaded ? 'is-loaded' : ''} ${status !== 'in-stock' ? 'grayscale' : ''}`}
          src={`${url}/images/${image}`}
          alt={name}
          loading="lazy"
          decoding="async"
          onLoad={() => setImgLoaded(true)}
          onError={() => setImgLoaded(true)}
        />
        {status !== 'in-stock' && (
          <div className="status-badge">{getStatusDisplay()}</div>
        )}
      </div>

      <div className="product-details">
        <div className="product-header">
          <h3>{name}</h3>
          {description && (
            <button 
              className="expand-button"
              onClick={(e) => {
                e.stopPropagation();
                onExpand();
              }}
              aria-label={isExpanded ? 'Collapse details' : 'Expand details'}
            >
              <i className={`fas fa-chevron-${isExpanded ? 'up' : 'down'}`}></i>
            </button>
          )}
        </div>

        <AnimatePresence initial={false}>
          {isExpanded && description && (
            <motion.p
              className="product-description"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            >
              {description}
            </motion.p>
          )}
        </AnimatePresence>

        <div className="price-section">
          <div className="price-header">
            <span className="label">Price</span>
            <span className="label quantity-label">Quantity</span>
          </div>
          <div className="price-content">
            <div className="price-info">
              {currentMarketPrice > currentPrice && (
                <span className="market-price">₹{currentMarketPrice}</span>
              )}
              <p className="our-price">₹{currentPrice}</p>
              {currentMarketPrice > currentPrice && (
                <span className="discount">
                  {Math.round(((currentMarketPrice - currentPrice) / currentMarketPrice) * 100)}% OFF
                </span>
              )}
            </div>
            
            <select 
              value={selectedQuantity}
              onChange={(e) => {
                setSelectedQuantity(e.target.value);
                // Reset cart item when changing quantity
                if (cartItem) {
                  for (let i = 0; i < cartItem.quantity; i++) {
                    removeFromCart(id, selectedQuantity);
                  }
                }
              }}
              className="quantity-select"
              disabled={status !== 'in-stock'}
            >
              {availableQuantities.map(({value, label}) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
        </div>

        {!hideAddToCart && (
          <div className="cart-actions">
            {!cartItem ? (
              <motion.button
                className="add-to-cart-btn"
                onClick={handleAddToCart}
                disabled={status !== 'in-stock'}
                whileTap={status === 'in-stock' ? { scale: 0.94 } : undefined}
                transition={{ type: 'spring', stiffness: 600, damping: 20 }}
              >
                <i className="fas fa-shopping-cart"></i>
                {status === 'in-stock' ? 'Add to Cart' : getStatusDisplay()}
              </motion.button>
            ) : (
              <motion.div
                className="quantity-controls"
                initial={{ scale: 0.92, opacity: 0.6 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 500, damping: 18 }}
              >
                <motion.button
                  className="quantity-btn decrease"
                  onClick={() => handleQuantityChange('decrease')}
                  whileTap={{ scale: 0.85 }}
                  aria-label="Decrease quantity"
                >
                  <i className="fas fa-minus"></i>
                </motion.button>
                <motion.span
                  key={cartItem.quantity}
                  className="quantity-display"
                  initial={{ scale: 1.35 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 600, damping: 15 }}
                >
                  {cartItem.quantity}
                </motion.span>
                <motion.button
                  className="quantity-btn increase"
                  onClick={() => handleQuantityChange('increase')}
                  whileTap={{ scale: 0.85 }}
                  aria-label="Increase quantity"
                >
                  <i className="fas fa-plus"></i>
                </motion.button>
              </motion.div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

FoodItemComponent.propTypes = {
  id: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  prices: PropTypes.shape({
    g100: PropTypes.number,
    g150: PropTypes.number,
    g200: PropTypes.number,
    g250: PropTypes.number,
    g300: PropTypes.number,
    g400: PropTypes.number,
    g500: PropTypes.number,
    kg1: PropTypes.number
  }).isRequired,
  marketPrices: PropTypes.shape({
    g100: PropTypes.number,
    g150: PropTypes.number,
    g200: PropTypes.number,
    g250: PropTypes.number,
    g300: PropTypes.number,
    g400: PropTypes.number,
    g500: PropTypes.number,
    kg1: PropTypes.number
  }),
  description: PropTypes.string,
  image: PropTypes.string.isRequired,
  quantityOptions: PropTypes.shape({
    g100: PropTypes.bool,
    g150: PropTypes.bool,
    g200: PropTypes.bool,
    g250: PropTypes.bool,
    g300: PropTypes.bool,
    g400: PropTypes.bool,
    g500: PropTypes.bool,
    kg1: PropTypes.bool
  }),
  status: PropTypes.string,
  isExpanded: PropTypes.bool,
  onExpand: PropTypes.func,
  hideAddToCart: PropTypes.bool
}

FoodItemComponent.defaultProps = {
  status: 'in-stock',
  quantityOptions: { g250: true },
  prices: { g250: 0 },
  marketPrices: { g250: 0 },
  isExpanded: false,
  onExpand: () => {}
}

const FoodItem = memo(FoodItemComponent);
export default FoodItem