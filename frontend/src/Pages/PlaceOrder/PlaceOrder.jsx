import { useContext, useState, useCallback, useEffect } from 'react'
import './PlaceOrder.css'
import { StoreContext } from '../../Context/StoreContext'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import axios from 'axios'

const emptyAddress = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  street: "",
  city: "",
  state: "",
  country: "",
  zipcode: "",
  location: {
    latitude: null,
    longitude: null,
    address: ""
  }
};

const PlaceOrder = () => {
  const { cartItems, food_list, url, token, getTotalCartAmount, getTotalCartSavings, loading, clearCart } = useContext(StoreContext)
  const [selectedPayment, setSelectedPayment] = useState('COD') // Default to COD
  const [processing, setProcessing] = useState(false)
  const [savedAddresses, setSavedAddresses] = useState([])
  const [showAddAddress, setShowAddAddress] = useState(false)
  const [selectedAddressId, setSelectedAddressId] = useState(null)
  const [editingAddress, setEditingAddress] = useState(null)
  const navigate = useNavigate()
  
  const [address, setAddress] = useState(emptyAddress)

  const fetchSavedAddresses = useCallback(async () => {
    try {
      const response = await axios.get(url + "/api/user/addresses", {
        headers: { token }
      });
      if (response.data.success) {
        setSavedAddresses(response.data.addresses);
        const defaultAddress = response.data.addresses.find(addr => addr.isDefault);
        if (defaultAddress) {
          setSelectedAddressId(defaultAddress._id);
          setAddress(defaultAddress);
        }
      }
    } catch (error) {
      console.error("Error fetching addresses:", error);
    }
  }, [token, url]);

  useEffect(() => {
    fetchSavedAddresses();
  }, [fetchSavedAddresses]);

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }
  
    toast.info('Detecting your location...');
    navigator.geolocation.getCurrentPosition(async (position) => {
      try {
        const { latitude, longitude } = position.coords;
        
        // Get detailed address from coordinates using OpenStreetMap Nominatim API
        const response = await axios.get(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`
        );
  
        const locationData = response.data;
        const addressDetails = locationData.address;
  
        setAddress(prev => ({
          ...prev,
          street: `${addressDetails.road || ''} ${addressDetails.house_number || ''}`.trim(),
          city: addressDetails.city || addressDetails.town || addressDetails.village || '',
          state: addressDetails.state || '',
          country: addressDetails.country || '',
          zipcode: addressDetails.postcode || '',
          location: {
            latitude,
            longitude,
            address: locationData.display_name,
            mapsUrl: `https://www.google.com/maps?q=${latitude},${longitude}`
          }
        }));
        
        toast.success('Location detected successfully');
      } catch (error) {
        console.error('Error getting location:', error);
        toast.error('Could not detect location details');
      }
    }, () => {
      toast.error('Unable to retrieve your location');
    });
  };
  
  const openLocationPicker = () => {
    // Open Google Maps in a new window
    const mapWindow = window.open(
      `https://www.google.com/maps/search/?api=1&query=my+location`,
      'locationPicker',
      'width=800,height=600'
    );
  
    // Handle the selected location when the window is closed
    window.handleLocationSelect = async (lat, lng) => {
      try {
        const response = await axios.get(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`
        );
  
        const locationData = response.data;
        const addressDetails = locationData.address;
  
        setAddress(prev => ({
          ...prev,
          street: `${addressDetails.road || ''} ${addressDetails.house_number || ''}`.trim(),
          city: addressDetails.city || addressDetails.town || addressDetails.village || '',
          state: addressDetails.state || '',
          country: addressDetails.country || '',
          zipcode: addressDetails.postcode || '',
          location: {
            latitude: lat,
            longitude: lng,
            address: locationData.display_name,
            mapsUrl: `https://www.google.com/maps?q=${lat},${lng}`
          }
        }));
  
        toast.success('Location selected successfully');
        mapWindow.close();
      } catch (error) {
        console.error('Error getting location details:', error);
        toast.error('Could not get location details');
      }
    };
  };

  const onChangeHandler = (event) => {
    setAddress(prev => ({...prev, [event.target.name]: event.target.value}))
  }

  const validateForm = () => {
    // Skip validation if using a saved address
    if (selectedAddressId) return true;
    
    const requiredFields = {
      firstName: 'first name',
      lastName: 'last name',
      email: 'email',
      phone: 'phone number',
      street: 'street address',
      city: 'city',
      state: 'state',
      country: 'country',
      zipcode: 'ZIP code'
    };

    for (const [field, label] of Object.entries(requiredFields)) {
      if (!address[field]?.trim()) {
        toast.error(`Please fill in ${label}`);
        return false;
      }
    }
    
    if (address.phone.length !== 10 || !/^\d+$/.test(address.phone)) {
      toast.error("Please enter a valid 10-digit phone number");
      return false;
    }
    
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address.email)) {
      toast.error("Please enter a valid email address");
      return false;
    }

    return true;
  };

  const saveAddress = async () => {
    if (!validateForm()) return;
    
    try {
      const endpoint = editingAddress 
        ? `${url}/api/user/address/${editingAddress}` 
        : `${url}/api/user/address`;
      
      const method = editingAddress ? 'put' : 'post';
      
      const response = await axios({
        method,
        url: endpoint,
        data: { address: { ...address, isDefault: savedAddresses.length === 0 } },
        headers: { 
          token,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.data.success) {
        toast.success(editingAddress ? 'Address updated successfully' : 'Address saved successfully');
        setSavedAddresses(response.data.addresses);
        setShowAddAddress(false);
        setEditingAddress(null);
        
        // Select the newly added/edited address
        const newAddressId = editingAddress || response.data.addresses[response.data.addresses.length - 1]._id;
        setSelectedAddressId(newAddressId);
        const newAddress = response.data.addresses.find(addr => addr._id === newAddressId);
        setAddress(newAddress);
      }
    } catch (error) {
      console.error("Error saving address:", error);
      if (error.response?.status === 401) {
        toast.error("Please log in again to save address");
      } else {
        toast.error(error.response?.data?.message || "Failed to save address");
      }
    }
  };

  const deleteAddress = async (addressId) => {
    try {
      const response = await axios.delete(`${url}/api/user/address/${addressId}`, {
        headers: { token }
      });
      if (response.data.success) {
        toast.success('Address deleted successfully');
        await fetchSavedAddresses();
        if (selectedAddressId === addressId) {
          setSelectedAddressId(null);
          setAddress(emptyAddress);
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete address");
    }
  };

  const startEditingAddress = (addr) => {
    setEditingAddress(addr._id);
    setAddress(addr);
    setShowAddAddress(true);
  };

  const handleAddressSelect = (addressId) => {
    const selected = savedAddresses.find(addr => addr._id === addressId);
    if (selected) {
        setSelectedAddressId(addressId);
        setAddress(selected);
        // Clear any existing warnings
        const warnings = document.querySelectorAll('.address-required-warning');
        warnings.forEach(warning => warning.remove());
    }
};

const validateAddressSelection = () => {
    if (!selectedAddressId && !validateForm()) {
        // Remove any existing warnings first
        const existingWarnings = document.querySelectorAll('.address-required-warning');
        existingWarnings.forEach(warning => warning.remove());

        // Add warning message
        const addressSection = document.querySelector('.shipping-address');
        const warning = document.createElement('div');
        warning.className = 'address-required-warning';
        warning.textContent = 'Please select or add a delivery address';
        addressSection.appendChild(warning);
        
        return false;
    }
    return true;
};

  // When toggling add address form, reset the form
  const toggleAddAddress = () => {
    setShowAddAddress(!showAddAddress);
    if (!showAddAddress) {
      setAddress(emptyAddress);
      setEditingAddress(null);
    }
  };

  const calculateTaxes = useCallback(() => {
    const subtotal = getTotalCartAmount();
    const sgst = (subtotal * 0.05); // 5% SGST
    const cgst = (subtotal * 0.05); // 5% CGST
    return { sgst, cgst };
  }, [getTotalCartAmount]);

  // Calculate final amount including all discounts
  const calculateFinalAmount = useCallback(() => {
    const subtotal = getTotalCartAmount();
    const { sgst, cgst } = calculateTaxes();
    let deliveryFee = subtotal === 0 ? 0 : 18;
    let discount = 0;
    
    const appliedPromo = localStorage.getItem('appliedPromo');
    if (appliedPromo === 'FIRSTORDER') {
      // Free delivery
      deliveryFee = 0;
    } else if (appliedPromo === 'ABOVE500' && subtotal >= 500) {
      // 5% discount
      discount = subtotal * 0.05;
    }
    
    return subtotal + deliveryFee + sgst + cgst - discount;
  }, [getTotalCartAmount, calculateTaxes]);

  const placeOrder = useCallback(async (e) => {
    e.preventDefault();
    
    if (!validateAddressSelection()) {
      return;
    }
    
    if (Object.keys(cartItems).length === 0) {
      toast.error('Your cart is empty');
      return;
    }
    
    setProcessing(true);
    try {
      const items = [];
      let totalSavings = 0;
      
      for (const [cartKey, cartItem] of Object.entries(cartItems)) {
        const [itemId, size] = cartKey.split('_');
        const item = food_list.find(food => food._id === itemId);
        
        if (item && !item.outOfStock && item.status === 'in-stock' && item.quantityOptions?.[size]) {
          const price = item.prices[size];
          const marketPrice = item.marketPrices?.[size] || price;
          
          items.push({
            _id: item._id,
            name: item.name,
            price,
            marketPrice,
            quantity: cartItem.quantity,
            size,
            image: item.image
          });
          
          totalSavings += (marketPrice - price) * cartItem.quantity;
        }
      }

      const subtotal = getTotalCartAmount();
      const { sgst, cgst } = calculateTaxes();
      const finalAmount = calculateFinalAmount();

      const orderData = {
        items,
        subtotal,
        sgst,
        cgst,
        amount: finalAmount,
        savings: totalSavings,
        address: selectedAddressId ? savedAddresses.find(addr => addr._id === selectedAddressId) : address,
        payment: {
          method: selectedPayment,
          status: 'initiated'
        }
      };

      const response = await axios.post(url + "/api/order/place", orderData, {
        headers: { token }
      });

      if (response.data.success) {
        if (selectedPayment === 'COD') {
          await clearCart();
          localStorage.removeItem('appliedPromo');
          toast.success('Order placed successfully!');
          navigate('/myorders');
        } else {
          // Handle Razorpay payment
          const options = {
            key: import.meta.env.VITE_RAZORPAY_KEY_ID,
            amount: response.data.paymentDetails.amount,
            currency: response.data.paymentDetails.currency,
            name: "Chanvi Farms",
            description: "Order Payment",
            order_id: response.data.paymentDetails.orderId,
            handler: async function(paymentResponse) {
              try {
                const verifyResponse = await axios.post(
                  url + '/api/order/verify-payment',
                  {
                    orderId: response.data.orderId,
                    razorpay_payment_id: paymentResponse.razorpay_payment_id,
                    razorpay_order_id: paymentResponse.razorpay_order_id,
                    razorpay_signature: paymentResponse.razorpay_signature
                  },
                  { headers: { token } }
                );
          
                if (verifyResponse.data.success) {
                  await clearCart();
                  localStorage.removeItem('appliedPromo');
                  toast.success('Payment successful! Order placed.');
                  setProcessing(false);
                  navigate('/myorders');
                } else {
                  setProcessing(false);
                  toast.error('Payment verification failed. Please contact support.');
                }
              } catch (error) {
                console.error('Payment verification error:', error);
                setProcessing(false);
                toast.error(error.response?.data?.message || 'Payment verification failed. Please contact support.');
              }
            },
            prefill: {
              name: `${address.firstName} ${address.lastName}`,
              email: address.email,
              contact: address.phone
            },
            theme: {
              color: "#3399cc"
            },
            modal: {
              ondismiss: function() {
                setProcessing(false);
                toast.info('Payment cancelled. You can try again.');
              }
            }
          };
          
          const razorpayInstance = new window.Razorpay(options);
          razorpayInstance.open();

          // Handle payment failures
          razorpayInstance.on('payment.failed', function(response) {
            console.error('Payment failed:', response.error);
            setProcessing(false);
            toast.error('Payment failed. Please try again.');
          });
        }
      }
    } catch (error) {
      console.error("Order placement error:", error);
      toast.error(error.response?.data?.message || "Failed to place order. Please try again.");
      setProcessing(false);
    }
}, [selectedAddressId, validateAddressSelection, cartItems, food_list, url, token, address, selectedPayment, clearCart, navigate, savedAddresses, calculateFinalAmount, calculateTaxes, getTotalCartAmount]);

  useEffect(() => {
    if (!loading && Object.keys(cartItems).length === 0) {
      navigate('/cart');
    }
  }, [loading, cartItems, navigate]);

  if (loading) return null;

  const getQuantityLabel = (size) => {
    switch (size) {
      case 'g250': return '250 gm';
      case 'g500': return '500 gm';
      case 'kg1': return '1 kg';
      default: return size;
    }
  };

  return (
    <form className='place-order' onSubmit={placeOrder}>
      <div className="place-order-left">
        <div className="shipping-address">
          <h2>Shipping Details</h2>
          
          {savedAddresses.length > 0 && (
            <div className="saved-addresses">
              <h3>Saved Addresses</h3>
              {savedAddresses.map((addr) => (
                <div 
                key={addr._id} 
                className={`address-option ${selectedAddressId === addr._id ? 'selected' : ''}`}
                onClick={() => handleAddressSelect(addr._id)}
            >
                <input
                    type="radio"
                    name="savedAddress"
                    checked={selectedAddressId === addr._id}
                    onChange={() => handleAddressSelect(addr._id)}
                />
                <div className="address-details">
                    <p className="name">{addr.firstName} {addr.lastName}</p>
                    <p>{addr.street}</p>
                    <p>{addr.city}, {addr.state}, {addr.country}, {addr.zipcode}</p>
                    <p className="phone">{addr.phone}</p>
                    {addr.location?.address && (
                        <p className="location-text">{addr.location.address}</p>
                    )}
                    <div className="address-actions">
                        <button 
                            type="button" 
                            className="edit-btn"
                            onClick={(e) => {
                                e.stopPropagation(); // Prevent address selection when clicking edit
                                startEditingAddress(addr);
                            }}
                        >
                            Edit
                        </button>
                        <button 
                            type="button" 
                            className="delete-btn"
                            onClick={(e) => {
                                e.stopPropagation(); // Prevent address selection when clicking delete
                                deleteAddress(addr._id);
                            }}
                        >
                            Delete
                        </button>
                    </div>
                    {selectedAddressId === addr._id && (
                        <div className="selected-address-indicator">✓</div>
                    )}
                </div>
            </div>
              ))}
            </div>
          )}

          <button 
            type="button" 
            className="add-address-btn"
            onClick={toggleAddAddress}
          >
          Add New Address
          </button>

          {showAddAddress && (
            <div className="address-form">
              <div className="location-buttons">
                <button 
                  type="button"
                  className="location-btn current-location"
                  onClick={getCurrentLocation}
                >
                  📍 Use Current Location
                </button>
                <button 
                  type="button"
                  className="location-btn map-location"
                  onClick={openLocationPicker}
                >
                  🗺️ Choose from Maps
                </button>
              </div>
          
              <div className="form-row">
                <input
                  type="text"
                  placeholder="First Name *"
                  name="firstName"
                  value={address.firstName}
                  onChange={onChangeHandler}
                  required
                />
                <input
                  type="text"
                  placeholder="Last Name *"
                  name="lastName"
                  value={address.lastName}
                  onChange={onChangeHandler}
                  required
                />
              </div>
              <input
                type="email"
                placeholder="Email *"
                name="email"
                value={address.email}
                onChange={onChangeHandler}
                required
              />
              <input
                type="tel"
                placeholder="Phone Number *"
                name="phone"
                value={address.phone}
                onChange={onChangeHandler}
                required
              />
              <input
                type="text"
                placeholder="Street Address *"
                name="street"
                value={address.street}
                onChange={onChangeHandler}
                required
              />
              {address.location?.address && (
                <div className="detected-location">
                  📍 {address.location.address}
                  {address.location.mapsUrl && (
                    <a 
                      href={address.location.mapsUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="view-on-maps"
                    >
                      View on Maps
                    </a>
                  )}
                </div>
              )}
              <div className="form-row">
                <input
                  type="text"
                  placeholder="City *"
                  name="city"
                  value={address.city}
                  onChange={onChangeHandler}
                  required
                />
                <input
                  type="text"
                  placeholder="State *"
                  name="state"
                  value={address.state}
                  onChange={onChangeHandler}
                  required
                />
              </div>
              <div className="form-row">
                <input
                  type="text"
                  placeholder="Country *"
                  name="country"
                  value={address.country}
                  onChange={onChangeHandler}
                  required
                />
                <input
                  type="text"
                  placeholder="ZIP Code *"
                  name="zipcode"
                  value={address.zipcode}
                  onChange={onChangeHandler}
                  required
                />
              </div>
              <button 
                type="button"
                className={`save-address-btn ${!address.location ? 'location-required' : ''}`}
                onClick={saveAddress}
                disabled={!address.location}
              >
                {!address.location ? 'Please select a location first' : 'Save Address'}
              </button>
            </div>
          )}
        </div>

        <div className="payment-method">
          <h2>Payment Method</h2>
          <div className="payment-options">
            <label className="radio-label">
              <input
                type="radio"
                name="payment"
                value="Online"
                checked={selectedPayment === 'Online'}
                onChange={(e) => setSelectedPayment(e.target.value)}
              />
              <span className="radio-custom"></span>
              <span className="label-text">Online Payment</span>
            </label>
            <label className="radio-label">
              <input
                type="radio"
                name="payment"
                value="COD"
                checked={selectedPayment === 'COD'}
                onChange={(e) => setSelectedPayment(e.target.value)}
              />
              <span className="radio-custom"></span>
              <span className="label-text">Cash on Delivery</span>
            </label>
          </div>
        </div>
      </div>

      <div className="place-order-right">
        <div className="cart-summary">
          <p className="title">Order Summary</p>
          {Object.entries(cartItems).map(([cartKey, cartItem]) => {
            const [itemId, size] = cartKey.split('_');
            const item = food_list.find(food => food._id === itemId);
            
            if (item && !item.outOfStock && item.status === 'in-stock') {
              const price = item.prices?.[size] || item.price;
              return (
                <div key={cartKey} className="cart-summary-item">
                  <div className="item-info">
                    <p className="item-name">{item.name || 'Unknown Item'}</p>
                    <div className="item-details">
                      <span className="size">{getQuantityLabel(size)}</span>
                      <span className="quantity">× {cartItem.quantity}</span>
                    </div>
                  </div>
                  <p className="item-price">₹{(price * cartItem.quantity).toFixed(2)}</p>
                </div>
              );
            }
            return null;
          })}
          <div className="cart-summary-item">
            <p>Subtotal</p>
            <p>₹{getTotalCartAmount().toFixed(2)}</p>
          </div>
          <div className="cart-summary-item">
            <p>SGST (5%)</p>
            <p>₹{calculateTaxes().sgst.toFixed(2)}</p>
          </div>
          <div className="cart-summary-item">
            <p>CGST (5%)</p>
            <p>₹{calculateTaxes().cgst.toFixed(2)}</p>
          </div>
          <div className="cart-summary-item">
            <p>Delivery Charge</p>
            <p>₹{(localStorage.getItem('appliedPromo') === 'FIRSTORDER' ? 0 : (getTotalCartAmount() === 0 ? 0 : 18)).toFixed(2)}</p>
          </div>
          <div className="cart-summary-item savings">
            <p>Total Savings</p>
            <p>₹{getTotalCartSavings().toFixed(2)}</p>
          </div>
          {localStorage.getItem('appliedPromo') && (
            <div className="cart-summary-item promo">
              <p>Applied Promocode: {localStorage.getItem('appliedPromo')}</p>
              <p className="promo-discount">
                {localStorage.getItem('appliedPromo') === 'FIRSTORDER' 
                  ? '(Free Delivery)' 
                  : '(5% Off)'}
              </p>
            </div>
          )}
          <div className="cart-summary-total">
            <p>Total Amount</p>
            <p>₹{calculateFinalAmount().toFixed(2)}</p>
          </div>
        </div>
        <button 
          type="submit"
          className="place-order-btn" 
          disabled={processing}
        >
          {processing ? 'Processing...' : 'Place Order'}
        </button>
      </div>
    </form>
  );
};

export default PlaceOrder;