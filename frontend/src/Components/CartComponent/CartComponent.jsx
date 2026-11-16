import React from 'react'
import { StoreContext } from '../../Context/StoreContext'
import { toast } from 'react-toastify'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import PropTypes from 'prop-types'
import './CartComponent.css'
import { imageUrl } from '../../utils/imageUrl'

const EASE_OUT = [0.22, 1, 0.36, 1];

// Small rolling-number animation for quantity changes
const QtyValue = ({ value }) => (
  <span className="cart-qty-value" aria-live="polite">
    <AnimatePresence mode="popLayout" initial={false}>
      <motion.span
        key={value}
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 8 }}
        transition={{ duration: 0.15 }}
      >
        {value}
      </motion.span>
    </AnimatePresence>
  </span>
);

QtyValue.propTypes = { value: PropTypes.number };

const rowMotion = {
  layout: true,
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, x: -32, transition: { duration: 0.2, ease: [0.4, 0, 1, 1] } },
  transition: { duration: 0.3, ease: EASE_OUT },
};

const CartComponent = () => {
  const { cartItems, food_list, removeFromCart, getTotalCartAmount, getTotalCartSavings, addToCart, url, loading } = React.useContext(StoreContext);
  const [promoCode, setPromoCode] = React.useState('');
  const [appliedPromo, setAppliedPromo] = React.useState(null);
  const [copiedCode, setCopiedCode] = React.useState(null);
  const [availableOffers] = React.useState([
    {
      code: 'ABOVE250',
      title: '2% Discount',
      description: '2% OFF on orders above ₹250',
      type: 'percentage',
      value: 2,
      minAmount: 250,
      validUntil: '2025-12-31',
      terms: 'Valid on orders above ₹250'
    },
    {
      code: 'ABOVE500',
      title: '5% Discount',
      description: '5% OFF on orders above ₹500',
      type: 'percentage',
      value: 5,
      minAmount: 500,
      validUntil: '2025-12-31',
      terms: 'Valid on orders above ₹500'
    },
    {
      code: 'ABOVE1000',
      title: '8% OFF + Free Delivery',
      description: '8% OFF + Free Delivery on orders above ₹1000',
      type: 'combo',
      benefits: [
        { type: 'percentage', value: 8 },
        { type: 'free_delivery' }
      ],
      minAmount: 1000,
      validUntil: '2025-12-31',
      terms: 'Valid on orders above ₹1000'
    },
    {
      code: 'ABOVE1500',
      title: '10% OFF + Free Delivery',
      description: '10% OFF + Free Delivery on orders above ₹1500',
      type: 'combo',
      benefits: [
        { type: 'percentage', value: 10 },
        { type: 'free_delivery' }
      ],
      minAmount: 1500,
      validUntil: '2025-12-31',
      terms: 'Valid on orders above ₹1500'
    },
    {
      code: 'ABOVE3000',
      title: '15% OFF + Free Delivery',
      description: '15% OFF + Free Delivery on orders above ₹3000',
      type: 'combo',
      benefits: [
        { type: 'percentage', value: 15 },
        { type: 'free_delivery' }
      ],
      minAmount: 3000,
      validUntil: '2025-12-31',
      terms: 'Valid on orders above ₹3000'
    }
  ]);
  const navigate = useNavigate();

  React.useEffect(() => {
    const savedPromo = localStorage.getItem('appliedPromo');
    if (savedPromo) {
      try {
        const promoOffer = JSON.parse(savedPromo);
        const currentTotal = getTotalCartAmount();

        // Remove promo if cart total falls below minimum amount
        if (currentTotal < promoOffer.minAmount) {
          setAppliedPromo(null);
          localStorage.removeItem('appliedPromo');
          toast.warning(`Promo code ${promoOffer.code} removed - cart total is below ₹${promoOffer.minAmount}`);
        }
      } catch (error) {
        // Clean up invalid promo data
        localStorage.removeItem('appliedPromo');
        setAppliedPromo(null);
      }
    }
  }, [getTotalCartAmount]);

  const getQuantityLabel = (size) => {
    switch (size) {
  case 'g100': return '100 gm';
  case 'g150': return '150 gm';
  case 'g200': return '200 gm';
  case 'g250': return '250 gm';
  case 'g300': return '300 gm';
  case 'g400': return '400 gm';
  case 'g500': return '500 gm';
  case 'kg1': return '1 kg';
      default: return size;
    }
  };

  const handlePromoCode = () => {
    const code = promoCode.trim().toUpperCase();
    const subtotal = getTotalCartAmount();
    
    if (!code) {
      toast.error('Please enter a promo code');
      return;
    }

    const offer = availableOffers.find(offer => offer.code === code);
    
    if (!offer) {
      toast.error('Invalid promo code');
      return;
    }

    // Check if promo is expired
    if (new Date(offer.validUntil) < new Date()) {
      toast.error('This promo code has expired');
      return;
    }

    // Check minimum amount requirement
    if (subtotal < offer.minAmount) {
      toast.error(`Minimum order amount of ₹${offer.minAmount} required for this promo code`);
      setAppliedPromo(null);
      localStorage.removeItem('appliedPromo');
      return;
    }

    // Apply the promo code
    setAppliedPromo(offer);
    localStorage.setItem('appliedPromo', JSON.stringify(offer));

    // Show appropriate success message
    if (offer.type === 'combo') {
      const discountValue = offer.benefits.find(b => b.type === 'percentage')?.value || 0;
      toast.success(`🎉 ${discountValue}% OFF + Free Delivery applied!`);
    } else if (offer.type === 'percentage') {
      toast.success(`🎉 ${offer.value}% discount applied!`);
    }
    
    setPromoCode('');
  };

  const copyPromoCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => {
      setCopiedCode(null);
    }, 2000);
  };

  const getDiscountAmount = () => {
    if (!appliedPromo) return 0;
    const subtotal = getTotalCartAmount();

    if (appliedPromo.type === 'combo') {
      // Get percentage discount from combo benefits
      const discountBenefit = appliedPromo.benefits.find(b => b.type === 'percentage');
      if (discountBenefit) {
        return Math.round((subtotal * discountBenefit.value) / 100);
      }
    } else if (appliedPromo.type === 'percentage') {
      return Math.round((subtotal * appliedPromo.value) / 100);
    }
    return 0;
  };

  const getDeliveryFee = () => {
    const standardDeliveryFee = 40;

    if (getTotalCartAmount() === 0) return 0;

    // Check for free delivery benefit
    if (appliedPromo) {
      if (appliedPromo.type === 'free_delivery' || 
          (appliedPromo.type === 'combo' && 
           appliedPromo.benefits.some(b => b.type === 'free_delivery'))) {
        return 0;
      }
    }
    return standardDeliveryFee;
  };

  const handleCheckout = () => {
    if (Object.keys(cartItems).length > 0) {
      navigate('/order');
    } else {
      toast.error('Your cart is empty');
    }
  };

  const handleContinueShopping = () => {
    navigate('/shop');
  };


  const calculateFinalAmount = () => {
    const subtotal = getTotalCartAmount();
    const deliveryFee = getDeliveryFee();
    const promoDiscount = getDiscountAmount();
    return subtotal + deliveryFee - promoDiscount;
  };

  if (loading) return null;

  const hasItems = Object.values(cartItems).some(item => item.quantity > 0);

  // Build the list of renderable cart rows (same visibility rules as before)
  const cartRows = Object.entries(cartItems).map(([cartKey, cartItem]) => {
    if (cartKey.startsWith('box_')) {
      return { cartKey, cartItem, isBox: true };
    }
    const [itemId, size] = cartKey.split('_');
    const item = food_list.find(food => food._id === itemId);
    if (item && cartItem.quantity > 0 && !item.outOfStock && item.status === 'in-stock') {
      return { cartKey, cartItem, isBox: false, item, itemId, size };
    }
    return null;
  }).filter(Boolean);

  const itemCount = cartRows.reduce((sum, row) => sum + (row.cartItem.quantity || 0), 0);
  const deliveryFee = getDeliveryFee();
  const subtotal = getTotalCartAmount();

  return (
    <div className="cart">
      {hasItems ? (
        <>
          <header className="cart-header">
            <h1>Your Cart</h1>
            <span className="cart-count-pill">{itemCount} {itemCount === 1 ? 'item' : 'items'}</span>
          </header>

          <div className="cart-layout">
            <section className="cart-items" aria-label="Cart items">
              <motion.ul className="cart-list" layout>
                <AnimatePresence initial={false}>
                  {cartRows.map((row) => {
                    const { cartKey, cartItem } = row;

                    if (row.isBox) {
                      const boxData = cartItem.boxData;
                      return (
                        <motion.li key={cartKey} className="cart-row cart-box-item" {...rowMotion}>
                          <div className="cart-row-media box-image" aria-hidden="true">
                            <i className="fas fa-box-open"></i>
                          </div>
                          <div className="cart-row-info box-details">
                            <h3>{boxData.name}</h3>
                            <span className="cart-chip">Box Package</span>
                            <ul className="box-items-list">
                              {boxData.items.map((item, idx) => (
                                <li key={idx} className="box-item-detail">
                                  {item.itemId.name} · {getQuantityLabel(item.size)}
                                </li>
                              ))}
                            </ul>
                            <div className="cart-row-prices">
                              <span className="our-price">₹{boxData.price}</span>
                              <span className="market-price">₹{boxData.marketPrice || boxData.price}</span>
                            </div>
                          </div>
                          <div className="cart-quantity-controls" role="group" aria-label={`Quantity for ${boxData.name}`}>
                            <button type="button" onClick={() => removeFromCart(boxData._id, 'box')} className="quantity-btn" aria-label="Decrease quantity">
                              <i className="fas fa-minus"></i>
                            </button>
                            <QtyValue value={cartItem.quantity} />
                            <button type="button" onClick={() => addToCart(boxData._id, 'box')} className="quantity-btn" aria-label="Increase quantity">
                              <i className="fas fa-plus"></i>
                            </button>
                          </div>
                          <p className="cart-row-total">₹{boxData.price * cartItem.quantity}</p>
                          <button type="button" onClick={() => removeFromCart(boxData._id, 'box', true)} className="remove-btn" aria-label={`Remove ${boxData.name}`}>
                            <i className="fas fa-trash-alt"></i>
                          </button>
                        </motion.li>
                      );
                    }

                    const { item, itemId, size } = row;
                    const price = item.prices?.[size] || item.price;
                    const marketPrice = item.marketPrices?.[size] || item.marketPrice || price;

                    return (
                      <motion.li key={cartKey} className="cart-row" {...rowMotion}>
                        <div className="cart-row-media">
                          <img src={imageUrl(item.image, url)} alt={item.name} loading="lazy" decoding="async" />
                        </div>
                        <div className="cart-row-info">
                          <h3>{item.name}</h3>
                          <span className="cart-chip">{getQuantityLabel(size)}</span>
                          <div className="cart-row-prices">
                            <span className="our-price">₹{price}</span>
                            <span className="market-price">₹{marketPrice}</span>
                          </div>
                        </div>
                        <div className="cart-quantity-controls" role="group" aria-label={`Quantity for ${item.name}`}>
                          <button type="button" className="quantity-btn" onClick={() => removeFromCart(itemId, size)} aria-label="Decrease quantity">
                            <i className="fas fa-minus"></i>
                          </button>
                          <QtyValue value={cartItem.quantity} />
                          <button type="button" className="quantity-btn" onClick={() => addToCart(itemId, size)} aria-label="Increase quantity">
                            <i className="fas fa-plus"></i>
                          </button>
                        </div>
                        <p className="cart-row-total">₹{price * cartItem.quantity}</p>
                        <button
                          type="button"
                          className="remove-btn"
                          aria-label={`Remove ${item.name}`}
                          onClick={() => {
                            for (let i = 0; i < cartItem.quantity; i++) {
                              removeFromCart(itemId, size);
                            }
                          }}
                        >
                          <i className="fas fa-trash-alt"></i>
                        </button>
                      </motion.li>
                    );
                  })}
                </AnimatePresence>
              </motion.ul>

              <button type="button" className="cart-continue-link" onClick={handleContinueShopping}>
                <i className="fas fa-arrow-left"></i> Continue shopping
              </button>

              <div className='cart-promocode'>
                <div className="promocode-container">
                  <div className="offers-header">
                    <h3>
                      <i className="fas fa-gift"></i>
                      Available Offers
                    </h3>
                    <span className="offers-subtitle">Save more with these exclusive deals!</span>
                  </div>

                  <div className="promo-offers">
                    {availableOffers.map((offer) => (
                      <div
                        key={offer.code}
                        className={`promo-offer-item${subtotal >= offer.minAmount ? ' is-unlocked' : ''}${appliedPromo?.code === offer.code ? ' is-applied' : ''}`}
                      >
                        <div className="offer-tag" aria-hidden="true">
                          {offer.type === 'percentage' ? (
                            <i className="fas fa-percent"></i>
                          ) : offer.type === 'free_delivery' ? (
                            <i className="fas fa-truck"></i>
                          ) : (
                            <i className="fas fa-tag"></i>
                          )}
                        </div>
                        <div className="offer-content">
                          <div className="promo-code-container">
                            <div className="offer-details">
                              <span className="code">{offer.code}</span>
                              <span className="offer-title">{offer.title}</span>
                              <span className="offer-validity">Valid till {new Date(offer.validUntil).toLocaleDateString()}</span>
                            </div>
                            <button
                              type="button"
                              className={`copy-button${copiedCode === offer.code ? ' is-copied' : ''}`}
                              onClick={() => copyPromoCode(offer.code)}
                            >
                              {copiedCode === offer.code ? (
                                <>
                                  <i className="fas fa-check"></i>
                                  <span>Copied!</span>
                                </>
                              ) : (
                                <>
                                  <i className="far fa-copy"></i>
                                  <span>Copy</span>
                                </>
                              )}
                            </button>
                          </div>
                          {offer.terms && (
                            <div className="offer-terms">
                              <i className="fas fa-info-circle"></i>
                              <span>{offer.terms}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            <aside className="cart-summary" aria-label="Order summary">
              <div className="cart-total">
                <h2>Order Summary</h2>
                <div className="cart-total-rows">
                  <div className="cart-total-details">
                    <p>Subtotal</p>
                    <p>₹{subtotal.toFixed(2)}</p>
                  </div>
                  <div className="cart-total-details">
                    <p>Delivery Fee</p>
                    <p>{deliveryFee === 0 ? <span className="free-tag">FREE</span> : `₹${deliveryFee.toFixed(2)}`}</p>
                  </div>
                  <div className="cart-total-details savings">
                    <p>Total Savings</p>
                    <p className="savings-amount">₹{getTotalCartSavings().toFixed(2)}</p>
                  </div>
                  <AnimatePresence initial={false}>
                    {appliedPromo && getDiscountAmount() > 0 && (
                      <motion.div
                        key="promo"
                        className="cart-total-details promo-discount"
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.2 }}
                      >
                        <p>
                          Promo Discount ({appliedPromo.code})<br />
                          <small>
                            {appliedPromo.type === 'combo'
                              ? `${appliedPromo.benefits.find(b => b.type === 'percentage')?.value}% OFF + Free Delivery`
                              : `${appliedPromo.value}% OFF`}
                          </small>
                        </p>
                        <p className="discount-amount">-₹{getDiscountAmount()}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  <div className="cart-total-details cart-grand-total">
                    <b>Total</b>
                    <b>₹{calculateFinalAmount().toFixed(2)}</b>
                  </div>
                </div>

                <div className="promocode-input-section">
                  <label className="promocode-title" htmlFor="cart-promo-input">Have a promo code?</label>
                  <div className="cart-promocode-input">
                    <div className="input-wrapper">
                      <i className="fas fa-tag input-icon" aria-hidden="true"></i>
                      <input
                        id="cart-promo-input"
                        type="text"
                        placeholder='Enter code'
                        value={promoCode}
                        onChange={(e) => setPromoCode(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handlePromoCode();
                          }
                        }}
                      />
                    </div>
                    <button type="button" onClick={handlePromoCode} className="apply-button">
                      Apply
                    </button>
                  </div>
                  <AnimatePresence>
                    {appliedPromo && (
                      <motion.p
                        className="applied-promo"
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <i className="fas fa-check-circle"></i>
                        {appliedPromo.type === 'free_delivery'
                          ? 'Free delivery applied!'
                          : appliedPromo.type === 'combo'
                            ? `${appliedPromo.benefits.find(b => b.type === 'percentage')?.value}% OFF + Free Delivery applied!`
                            : `${appliedPromo.value}% discount applied!`}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>

                <button type="button" className="checkout-btn" onClick={handleCheckout}>
                  Proceed to Checkout <i className="fas fa-arrow-right"></i>
                </button>
                <p className="cart-secure-note"><i className="fas fa-lock"></i> Safe &amp; secure checkout</p>
              </div>
            </aside>
          </div>
        </>
      ) : (
        <motion.div
          className="empty-cart"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: EASE_OUT }}
        >
          <div className="empty-cart-icon" aria-hidden="true">
            <i className="fas fa-shopping-basket"></i>
          </div>
          <h2>Your cart is empty</h2>
          <p>Fresh, organic produce is just a few clicks away. Add items to your cart to get started.</p>
          <button type="button" className="btn-primary" onClick={handleContinueShopping}>
            <i className="fas fa-leaf"></i> Start Shopping
          </button>
        </motion.div>
      )}
    </div>
  );
};

export default CartComponent;