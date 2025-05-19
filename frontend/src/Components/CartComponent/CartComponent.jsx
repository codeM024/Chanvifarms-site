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
  const navigate = useNavigate();

  React.useEffect(() => {
    const savedPromo = localStorage.getItem('appliedPromo');
    if (savedPromo === 'ABOVE500' && getTotalCartAmount() >= 500) {
      setAppliedPromo({ type: 'percentage', value: 5, code: savedPromo });
    }
  }, [getTotalCartAmount]);

  const getQuantityLabel = (size) => {
    switch (size) {
      case 'g250': return '250 gm';
      case 'g500': return '500 gm';
      case 'kg1': return '1 kg';
      default: return size;
    }
  };

  const handlePromoCode = () => {
    const code = promoCode.trim().toUpperCase();
    const subtotal = getTotalCartAmount();
    
    if (!code) {
      toast.error('Please enter a promocode');
      return;
    }
    
    if (code === 'ABOVE500' && subtotal >= 500) {
      setAppliedPromo({ type: 'percentage', value: 5, code });
      localStorage.setItem('appliedPromo', code);
      toast.success('5% discount applied successfully!');
    } else if (code === 'ABOVE500') {
      toast.error('This code is valid only for orders above ₹500');
      setAppliedPromo(null);
      localStorage.removeItem('appliedPromo');
    } else {
      toast.error('Invalid promocode');
      setAppliedPromo(null);
      localStorage.removeItem('appliedPromo');
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
    if (appliedPromo.type === 'percentage') {
      return (subtotal * appliedPromo.value) / 100;
    }
    return 0;
  };

  const getDeliveryFee = () => {
    if (appliedPromo?.type === 'free_delivery') return 0;
    return getTotalCartAmount() === 0 ? 0 : 18;
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

  const calculateTaxes = () => {
    const subtotal = getTotalCartAmount();
    const sgst = (subtotal * 0.05); // 5% SGST
    const cgst = (subtotal * 0.05); // 5% CGST
    return { sgst, cgst };
  };

  const calculateFinalAmount = () => {
    const subtotal = getTotalCartAmount();
    const { sgst, cgst } = calculateTaxes();
    const deliveryFee = getDeliveryFee();
    const discount = getDiscountAmount();
    return subtotal + deliveryFee + sgst + cgst - discount;
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
                  <p>₹{getTotalCartAmount()}</p>
                </div>
                <hr />
                <div className="cart-total-details">
                  <p>SGST (5%)</p>
                  <p>₹{calculateTaxes().sgst.toFixed(2)}</p>
                </div>
                <hr />
                <div className="cart-total-details">
                  <p>CGST (5%)</p>
                  <p>₹{calculateTaxes().cgst.toFixed(2)}</p>
                </div>
                <hr />
                <div className="cart-total-details">
                  <p>Delivery Fee</p>
                  <p>₹{getDeliveryFee()}</p>
                </div>
                <hr />
                <div className="cart-total-details savings">
                  <p>Total Savings</p>
                  <p className="savings-amount">₹{getTotalCartSavings()}</p>
                </div>
                {appliedPromo && (
                  <>
                    <hr />
                    <div className="cart-total-details promo-discount">
                      <p>Promo Discount ({appliedPromo.code})</p>
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
              <div>
                <h3>Available Offers</h3>
                <div className="promo-offers">
                  <div className="promo-offer-item">
                    <div className="promo-code-container">
                      <span className="code">ABOVE500</span>
                      <button 
                        className="copy-button"
                        onClick={() => copyPromoCode('ABOVE500')}
                      >
                        {copiedCode === 'ABOVE500' ? (
                          <i className="fas fa-check"></i>
                        ) : (
                          <i className="far fa-copy"></i>
                        )}
                      </button>
                    </div>
                    <p>Get 5% off on orders above ₹500!</p>
                  </div>
                </div>
                <p className="promocode-title">Enter Promocode</p>
                <div className="cart-promocode-input">
                  <input 
                    type="text" 
                    placeholder='Enter promocode' 
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handlePromoCode();
                      }
                    }}
                  />
                  <button onClick={handlePromoCode}>Apply</button>
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