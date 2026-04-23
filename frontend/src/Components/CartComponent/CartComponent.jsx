import React from 'react'
import { StoreContext } from '../../Context/StoreContext'
import { toast } from 'react-toastify'
import { useNavigate } from 'react-router-dom'
import './CartComponent.css'

const CartComponent = () => {
  const { cartItems, food_list, removeFromCart, getTotalCartAmount, getTotalCartSavings, addToCart, url, loading } = React.useContext(StoreContext);
  const [promoCode, setPromoCode] = React.useState('');
  const [appliedPromo, setAppliedPromo] = React.useState(null);
  const [copiedCode, setCopiedCode] = React.useState(null);
  const [availableOffers, setAvailableOffers] = React.useState([
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
    const cartSavings = getTotalCartSavings();
    return subtotal + deliveryFee - promoDiscount;
  };

  if (loading) return null;

  const hasItems = Object.values(cartItems).some(item => item.quantity > 0);

  return (
    <div className="cart">
      {hasItems ? (
        <>
          <div className="cart-items">
            <div className="cart-items-title">
              <p>Items</p>
              <p>Title</p>
              <p>Size</p>
              <p>Market Price</p>
              <p>Our Price</p>
              <p>Quantity</p>
              <p>Total</p>
              <p>Remove</p>
            </div>
            <br />
            <hr />
            {Object.entries(cartItems).map(([cartKey, cartItem]) => {
              if (cartKey.startsWith('box_')) {
                // Handle box items
                const boxData = cartItem.boxData;
                return (
                  <div key={cartKey} className="cart-box-item">
                    <div className="cart-items-title cart-items-item">
                      <div className="box-image">
                        <i className="fas fa-box"></i>
                      </div>
                      <div className="box-details">
                        <h3>{boxData.name}</h3>
                        <div className="box-items-list">
                          {boxData.items.map((item, idx) => (
                            <div key={idx} className="box-item-detail">
                              <span>{item.itemId.name} - {getQuantityLabel(item.size)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <p>Box Package</p>
                      <p className="market-price">₹{boxData.marketPrice || boxData.price}</p>
                      <p>₹{boxData.price}</p>
                      <div className="cart-quantity-controls">
                        <button onClick={() => removeFromCart(boxData._id, 'box')} className="quantity-btn">
                          <i className="fas fa-minus"></i>
                        </button>
                        <span>{cartItem.quantity}</span>
                        <button onClick={() => addToCart(boxData._id, 'box')} className="quantity-btn">
                          <i className="fas fa-plus"></i>
                        </button>
                      </div>
                      <p>₹{boxData.price * cartItem.quantity}</p>
                      <button onClick={() => removeFromCart(boxData._id, 'box', true)} className="remove-btn">
                        <i className="fas fa-trash"></i>
                      </button>
                    </div>
                  </div>
                );
              }
              
              // Handle regular items
              const [itemId, size] = cartKey.split('_');
              const item = food_list.find(food => food._id === itemId);
              
              if (item && cartItem.quantity > 0 && !item.outOfStock && item.status === 'in-stock') {
                const price = item.prices?.[size] || item.price;
                const marketPrice = item.marketPrices?.[size] || item.marketPrice || price;
                
                return (
                  <div key={cartKey}>
                    <div className="cart-items-title cart-items-item">
                      <img src={`${url}/images/${item.image}`} alt={item.name} />
                      <p>{item.name}</p>
                      <p>{getQuantityLabel(size)}</p>
                      <p className="market-price">₹{marketPrice}</p>
                      <p>₹{price}</p>
                      <div className="cart-quantity-controls">
                        <button onClick={() => removeFromCart(itemId, size)}>
                          <i className="fas fa-minus"></i>
                        </button>
                        <span>{cartItem.quantity}</span>
                        <button onClick={() => addToCart(itemId, size)}>
                          <i className="fas fa-plus"></i>
                        </button>
                      </div>
                      <p>₹{price * cartItem.quantity}</p>
                      <p onClick={() => {
                        for (let i = 0; i < cartItem.quantity; i++) {
                          removeFromCart(itemId, size);
                        }
                      }} className="cross">×</p>
                    </div>
                    <hr />
                  </div>
                );
              }
              return null;
            })}
          </div>
          <div className="cart-bottom">
            <div className="cart-total">
              <h2>Cart Totals</h2>
              <div>
                <div className="cart-total-details">
                  <p>Subtotal</p>
                  <p>₹{getTotalCartAmount().toFixed(2)}</p>
                </div>
                <hr />
                <div className="cart-total-details">
                  <p>Delivery Fee</p>
                  <p>₹{getDeliveryFee().toFixed(2)}</p>
                </div>
                <hr />
                <div className="cart-total-details savings">
                  <p>Total Savings</p>
                  <p className="savings-amount">₹{getTotalCartSavings().toFixed(2)}</p>
                </div>
                {appliedPromo && getDiscountAmount() > 0 && (
                  <>
                    <hr />
                    <div className="cart-total-details promo-discount">
                      <p>
                        {appliedPromo.type === 'combo' ? (
                          <>
                            Promo Discount ({appliedPromo.code})<br />
                            <small>{appliedPromo.benefits.find(b => b.type === 'percentage')?.value}% OFF + Free Delivery</small>
                          </>
                        ) : (
                          <>
                            Promo Discount ({appliedPromo.code})<br />
                            <small>{appliedPromo.value}% OFF</small>
                          </>
                        )}
                      </p>
                      <p className="discount-amount">-₹{getDiscountAmount()}</p>
                    </div>
                  </>
                )}
                <hr />
                <div className="cart-total-details">
                  <b>Total</b>
                  <b>₹{calculateFinalAmount().toFixed(2)}</b>
                </div>
              </div>
              <button onClick={handleCheckout}>Proceed to Checkout</button>
            </div>
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
                    <div key={offer.code} className="promo-offer-item">
                      <div className="offer-tag">
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
                          <span className="code">{offer.code}</span>
                          <div className="offer-details">
                            <span className="offer-title">{offer.title}</span> <br />
                            <span className="offer-validity">Valid till: {new Date(offer.validUntil).toLocaleDateString()}</span>
                          </div>
                          <button 
                            className="copy-button"
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

                <div className="promocode-input-section">
                  <p className="promocode-title">Have a Promocode?</p>
                  <div className="cart-promocode-input">
                    <div className="input-wrapper">
                      <i className="fas fa-tag input-icon"></i>
                      <input 
                        type="text" 
                        placeholder='Enter your promocode' 
                        value={promoCode}
                        onChange={(e) => setPromoCode(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            handlePromoCode();
                          }
                        }}
                      />
                    </div>
                    <button onClick={handlePromoCode} className="apply-button">
                      <span>Apply</span>
                      <i className="fas fa-arrow-right"></i>
                    </button>
                  </div>
                </div>
                {appliedPromo && (
                  <p className="applied-promo">
                    {appliedPromo.type === 'free_delivery' 
                      ? '🎉 Free delivery applied!' 
                      : `🎉 ${appliedPromo.value}% discount applied!`}
                  </p>
                )}
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="empty-cart">
          <i className="fas fa-shopping-cart"></i>
          <h2>Your Cart is Empty</h2>
          <p>Add items to your cart to proceed with checkout</p>
          <button onClick={handleContinueShopping}>Continue Shopping</button>
        </div>
      )}
    </div>
  );
};

export default CartComponent;