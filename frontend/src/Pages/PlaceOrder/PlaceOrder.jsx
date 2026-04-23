import { useContext, useState, useCallback, useEffect } from "react";
import "./PlaceOrder.css";
import { StoreContext } from "../../Context/StoreContext";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import axios from "axios";

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
    address: "",
  },
};

const PlaceOrder = () => {
  const {
    cartItems,
    food_list,
    url,
    token,
    getTotalCartAmount,
    getTotalCartSavings,
    loading,
    clearCart,
  } = useContext(StoreContext);
  const [selectedPayment, setSelectedPayment] = useState("COD");
  const [processing, setProcessing] = useState(false);
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [editingAddress, setEditingAddress] = useState(null);
  const navigate = useNavigate();

  const [address, setAddress] = useState(emptyAddress);
  const pinCodeData = {
    560035: { city: "Sarjapura road,Bengaluru", state: "Karnataka", country: "India" },
    560087: { city: "Varthur,Bengaluru", state: "Karnataka", country: "India" },
    560100: { city: "Electronic City,Bengaluru", state: "Karnataka", country: "India" },
  };

  // Load Razorpay script
  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }

      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const fetchSavedAddresses = useCallback(async () => {
    try {
      const response = await axios.get(url + "/api/user/addresses", {
        headers: { token },
      });
      if (response.data.success) {
        setSavedAddresses(response.data.addresses);
        const defaultAddress = response.data.addresses.find(
          (addr) => addr.isDefault
        );
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

  const openLocationPicker = () => {
    const mapWindow = window.open(
      `https://www.google.com/maps/search/?api=1&query=my+location`,
      "locationPicker",
      "width=800,height=600"
    );

    window.handleLocationSelect = async (lat, lng) => {
      try {
        const response = await axios.get(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`
        );

        const locationData = response.data;
        const addressDetails = locationData.address;

        setAddress((prev) => ({
          ...prev,
          street: `${addressDetails.road || ""} ${
            addressDetails.house_number || ""
          }`.trim(),
          city:
            addressDetails.city ||
            addressDetails.town ||
            addressDetails.village ||
            "",
          state: addressDetails.state || "",
          country: addressDetails.country || "",
          zipcode: addressDetails.postcode || "",
          location: {
            latitude: lat,
            longitude: lng,
            address: locationData.display_name,
            mapsUrl: `https://www.google.com/maps?q=${lat},${lng}`,
          },
        }));

        toast.success("Location selected successfully");
        mapWindow.close();
      } catch (error) {
        console.error("Error getting location details:", error);
        toast.error("Could not get location details");
      }
    };
  };

  const onChangeHandler = (event) => {
    setAddress((prev) => ({
      ...prev,
      [event.target.name]: event.target.value,
    }));
  };

  const validateForm = () => {
    if (selectedAddressId) return true;

    const requiredFields = {
      firstName: "first name",
      lastName: "last name",
      email: "email",
      phone: "phone number",
      street: "street address",
      city: "city",
      state: "state",
      country: "country",
      zipcode: "ZIP code",
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
      const method = editingAddress ? "put" : "post";

      const response = await axios({
        method,
        url: endpoint,
        data: {
          address: { ...address, isDefault: savedAddresses.length === 0 },
        },
        headers: {
          token,
          "Content-Type": "application/json",
        },
      });

      if (response.data.success) {
        toast.success(
          editingAddress
            ? "Address updated successfully"
            : "Address saved successfully"
        );
        setSavedAddresses(response.data.addresses);
        setShowAddAddress(false);
        setEditingAddress(null);

        const newAddressId =
          editingAddress ||
          response.data.addresses[response.data.addresses.length - 1]._id;
        setSelectedAddressId(newAddressId);
        const newAddress = response.data.addresses.find(
          (addr) => addr._id === newAddressId
        );
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
      const response = await axios.delete(
        `${url}/api/user/address/${addressId}`,
        {
          headers: { token },
        }
      );
      if (response.data.success) {
        toast.success("Address deleted successfully");
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
    const selected = savedAddresses.find((addr) => addr._id === addressId);
    if (selected) {
      setSelectedAddressId(addressId);
      setAddress(selected);
      const warnings = document.querySelectorAll(".address-required-warning");
      warnings.forEach((warning) => warning.remove());
    }
  };

  const validateAddressSelection = () => {
    if (!selectedAddressId && !validateForm()) {
      const existingWarnings = document.querySelectorAll(
        ".address-required-warning"
      );
      existingWarnings.forEach((warning) => warning.remove());
      const addressSection = document.querySelector(".shipping-address");
      const warning = document.createElement("div");
      warning.className = "address-required-warning";
      warning.textContent = "Please select or add a delivery address";
      addressSection.appendChild(warning);
      return false;
    }
    return true;
  };

  const toggleAddAddress = () => {
    setShowAddAddress(!showAddAddress);
    if (!showAddAddress) {
      setAddress(emptyAddress);
      setEditingAddress(null);
    }
  };


  const calculateFinalAmount = useCallback(() => {
    const subtotal = getTotalCartAmount();
    let deliveryFee = subtotal === 0 ? 0 : 40; // Updated to match CartComponent
    let discount = 0;

    const savedPromo = localStorage.getItem("appliedPromo");
    if (savedPromo) {
      try {
        const appliedPromo = JSON.parse(savedPromo);
        if (subtotal >= appliedPromo.minAmount) {
          // Calculate discount based on promo type
          if (appliedPromo.type === 'combo') {
            const discountBenefit = appliedPromo.benefits.find(b => b.type === 'percentage');
            if (discountBenefit) {
              discount = Math.round((subtotal * discountBenefit.value) / 100);
            }
            if (appliedPromo.benefits.some(b => b.type === 'free_delivery')) {
              deliveryFee = 0;
            }
          } else if (appliedPromo.type === 'percentage') {
            discount = Math.round((subtotal * appliedPromo.value) / 100);
          }
        }
      } catch (error) {
        console.error('Error parsing promo code:', error);
      }
    }

    return subtotal + deliveryFee - discount;
  }, [getTotalCartAmount]);

  // Initialize Razorpay payment
  const initializeRazorpayPayment = async (orderData, orderResponse) => {
    try {
      // Load Razorpay script
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error("Failed to load Razorpay script");
      }

      // Get the current address (either selected or new)
      const currentAddress = selectedAddressId
        ? savedAddresses.find((addr) => addr._id === selectedAddressId)
        : address;

      if (!currentAddress) {
        throw new Error("Address not found");
      }

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: orderResponse.data.paymentDetails.amount,
        currency: orderResponse.data.paymentDetails.currency,
        name: "Chanvi Farms",
        description: `Order #${orderResponse.data.orderId
          .toString()
          .slice(-6)}`,
        order_id: orderResponse.data.paymentDetails.orderId,
        handler: async function (paymentResponse) {
          await handlePaymentSuccess(
            paymentResponse,
            orderResponse.data.orderId
          );
        },
        prefill: {
          name: `${currentAddress.firstName} ${currentAddress.lastName}`,
          email: currentAddress.email,
          contact: currentAddress.phone,
        },
        notes: {
          orderId: orderResponse.data.orderId,
          customerName: `${currentAddress.firstName} ${currentAddress.lastName}`,
        },
        theme: {
          color: "#3399cc",
        },
        modal: {
          ondismiss: function () {
            setProcessing(false);
            toast.info("Payment cancelled. You can try again.");
          },
          escape: false,
          backdropclose: false,
        },
        retry: {
          enabled: false,
        },
      };

      const razorpayInstance = new window.Razorpay(options);

      // Handle payment failures
      razorpayInstance.on("payment.failed", function (response) {
        console.error("Payment failed:", response.error);
        setProcessing(false);
        toast.error(`Payment failed: ${response.error.description}`);

        // Update order status to payment failed
        updateOrderPaymentStatus(orderResponse.data.orderId, "payment_failed");
      });

      razorpayInstance.open();
    } catch (error) {
      console.error("Error initializing Razorpay:", error);
      setProcessing(false);
      toast.error("Failed to initialize payment. Please try again.");
    }
  };

  // Handle successful payment
  const handlePaymentSuccess = async (paymentResponse, orderId) => {
    try {
      const verifyResponse = await axios.post(
        url + "/api/order/verify-payment",
        {
          orderId: orderId,
          razorpay_payment_id: paymentResponse.razorpay_payment_id,
          razorpay_order_id: paymentResponse.razorpay_order_id,
          razorpay_signature: paymentResponse.razorpay_signature,
        },
        {
          headers: { token },
          timeout: 30000, // 30 second timeout
        }
      );

      if (verifyResponse.data.success) {
        // Clear cart and navigate
        await clearCart();
        localStorage.removeItem("appliedPromo");

        setProcessing(false);
        toast.success("Payment successful! Order confirmed.");
        navigate("/myorders");
      } else {
        throw new Error(
          verifyResponse.data.message || "Payment verification failed"
        );
      }
    } catch (error) {
      console.error("Payment verification error:", error);
      setProcessing(false);

      if (error.code === "ECONNABORTED") {
        toast.error(
          'Payment verification is taking longer than expected. Please check your order status in "My Orders".'
        );
      } else {
        toast.error(
          error.response?.data?.message ||
            "Payment verification failed. Please contact support if amount was deducted."
        );
      }

      // Still navigate to orders page so user can check status
      navigate("/myorders");
    }
  };

  // Update order payment status
  const updateOrderPaymentStatus = async (orderId, status) => {
    try {
      await axios.post(
        url + "/api/order/update-payment-status",
        {
          orderId: orderId,
          paymentStatus: status,
        },
        { headers: { token } }
      );
    } catch (error) {
      console.error("Error updating payment status:", error);
    }
  };

  const placeOrder = useCallback(
    async (e) => {
      e.preventDefault();

      if (!validateAddressSelection()) {
        return;
      }

      if (Object.keys(cartItems).length === 0) {
        toast.error("Your cart is empty");
        return;
      }

      setProcessing(true);

      try {
        const items = [];
        let totalSavings = 0;

        // Prepare order items
        for (const [cartKey, cartItem] of Object.entries(cartItems)) {
          if (cartKey.startsWith('box_')) {
            // Handle box items
            const boxData = cartItem.boxData;
            items.push({
              _id: boxData._id,
              name: boxData.name,
              price: boxData.price,
              marketPrice: boxData.marketPrice || boxData.price,
              quantity: cartItem.quantity,
              size: 'box',
              image: 'box.png',
              type: 'box',
              boxItems: boxData.items.map(item => ({
                name: item.itemId.name,
                size: item.size,
                quantity: 1
              }))
            });
            totalSavings += ((boxData.marketPrice || boxData.price) - boxData.price) * cartItem.quantity;
            continue;
          }

          const [itemId, size] = cartKey.split("_");
          const item = food_list.find((food) => food._id === itemId);

          if (
            item &&
            !item.outOfStock &&
            item.status === "in-stock" &&
            item.quantityOptions?.[size]
          ) {
            const price = item.prices[size];
            const marketPrice = item.marketPrices?.[size] || price;

            items.push({
              _id: item._id,
              name: item.name,
              price,
              marketPrice,
              quantity: cartItem.quantity,
              size,
              image: item.image,
            });

            totalSavings += (marketPrice - price) * cartItem.quantity;
          }
        }

        if (items.length === 0) {
          setProcessing(false);
          toast.error("No valid items found in cart");
          return;
        }

        const subtotal = getTotalCartAmount();
        const finalAmount = calculateFinalAmount();

        // Prepare order data
        const orderData = {
          items,
          subtotal,
          amount: finalAmount,
          savings: totalSavings,
          address: selectedAddressId
            ? savedAddresses.find((addr) => addr._id === selectedAddressId)
            : address,
          payment: {
            method: selectedPayment,
            status: "initiated",
          },
        };

        // Validate order data
        if (!orderData.address || !orderData.address.firstName) {
          setProcessing(false);
          toast.error("Please select a delivery address");
          return;
        }

        // Place the order
        const response = await axios.post(url + "/api/order/place", orderData, {
          headers: { token },
          timeout: 30000, // 30 second timeout
        });

        if (response.data.success) {
          if (selectedPayment === "COD") {
            await clearCart();
            localStorage.removeItem("appliedPromo");
            setProcessing(false);
            toast.success("Order placed successfully!");
            navigate("/myorders");
          } else if (selectedPayment === "WHATSAPP_PAY") {
            const orderId = response.data.orderId;
            const whatsappMessage =
              `Hi, I'd like to pay for my order *#${orderId
                .toString()
                .slice(-6)}*\n\n` +
              `Amount: ₹${finalAmount}\n` +
              `Order Details:\n${items
                .map(
                  (item) => `- ${item.name} (${item.size}) × ${item.quantity}`
                )
                .join("\n")}\n\n` +
              `Delivery Address:\n${orderData.address.street}, ${orderData.address.city}, ${orderData.address.state} - ${orderData.address.zipcode}`;

            const whatsappUrl = `https://wa.me/917899940804?text=${encodeURIComponent(
              whatsappMessage
            )}`;

            await clearCart();
            localStorage.removeItem("appliedPromo");
            setProcessing(false);

            window.open(whatsappUrl, "_blank");
            toast.success(
              "Order placed successfully! Redirecting to WhatsApp for payment."
            );
            navigate("/myorders");
          } else if (selectedPayment === "Online") {
            // Handle Razorpay payment
            await initializeRazorpayPayment(orderData, response);
          }
        } else {
          setProcessing(false);
          toast.error(response.data.message || "Failed to place order");
        }
      } catch (error) {
        console.error("Order placement error:", error);
        setProcessing(false);

        if (error.code === "ECONNABORTED") {
          toast.error(
            "Request timeout. Please check your internet connection and try again."
          );
        } else if (error.response?.status === 401) {
          toast.error("Please log in again to place order");
          navigate("/login");
        } else {
          toast.error(
            error.response?.data?.message ||
              "Failed to place order. Please try again."
          );
        }
      }
    },
    [
      selectedAddressId,
      validateAddressSelection,
      cartItems,
      food_list,
      url,
      token,
      address,
      selectedPayment,
      clearCart,
      navigate,
      savedAddresses,
      calculateFinalAmount,
      getTotalCartAmount,
    ]
  );

  useEffect(() => {
    if (!loading && Object.keys(cartItems).length === 0) {
      navigate("/cart");
    }
  }, [loading, cartItems, navigate]);

  if (loading) return null;

  const getQuantityLabel = (size) => {
    switch (size) {
      case "g250":
        return "250 gm";
      case "g500":
        return "500 gm";
      case "kg1":
        return "1 kg";
      default:
        return size;
    }
  };

  return (
    <form className="place-order" onSubmit={placeOrder}>
      <div className="place-order-left">
        <div className="shipping-address">
          <h2>Shipping Details</h2>

          {savedAddresses.length > 0 && (
            <div className="saved-addresses">
              <h3>Saved Addresses</h3>
              {savedAddresses.map((addr) => (
                <div
                  key={addr._id}
                  className={`address-option ${
                    selectedAddressId === addr._id ? "selected" : ""
                  }`}
                  onClick={() => handleAddressSelect(addr._id)}
                >
                  <input
                    type="radio"
                    name="savedAddress"
                    checked={selectedAddressId === addr._id}
                    onChange={() => handleAddressSelect(addr._id)}
                  />
                  <div className="address-details">
                    <p className="name">
                      {addr.firstName} {addr.lastName}
                    </p>
                    <p>{addr.street}</p>
                    <p>
                      {addr.city}, {addr.state}, {addr.country}, {addr.zipcode}
                    </p>
                    <p className="phone">{addr.phone}</p>
                    {addr.location?.address && (
                      <p className="location-text">{addr.location.address}</p>
                    )}
                    <div className="address-actions">
                      <button
                        type="button"
                        className="edit-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          startEditingAddress(addr);
                        }}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="delete-btn"
                        onClick={(e) => {
                          e.stopPropagation();
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
                placeholder="Flat/House No, Building/Residency Name, Street Address *"
                name="street"
                value={address.street}
                onChange={onChangeHandler}
                required
              />

              <div className="form-row pin-dropdown">
                <label htmlFor="zipcode" className="pin-label">
                  Available Areas – Please Select *
                </label>
                <select
                  id="zipcode"
                  name="zipcode"
                  value={address.zipcode}
                  onChange={(e) => {
                    const selectedPin = e.target.value;
                    setAddress((prev) => ({
                      ...prev,
                      zipcode: selectedPin,
                      city: pinCodeData[selectedPin]?.city || "",
                      state: pinCodeData[selectedPin]?.state || "",
                      country: pinCodeData[selectedPin]?.country || "",
                    }));
                  }}
                  required
                >
                  <option value="">Select PIN Code</option>
                  {Object.keys(pinCodeData).map((pin) => (
                    <option key={pin} value={pin}>
                      {pin}
                    </option>
                  ))}
                </select>
              </div>

              {/* City, State, Country fields (auto-filled) */}
              <div className="form-row">
                <input
                  type="text"
                  placeholder="City *"
                  name="city"
                  value={address.city}
                  readOnly
                  required
                />
                <input
                  type="text"
                  placeholder="State *"
                  name="state"
                  value={address.state}
                  readOnly
                  required
                />
              </div>
              <div className="form-row">
                <input
                  type="text"
                  placeholder="Country *"
                  name="country"
                  value={address.country}
                  readOnly
                  required
                />
              </div>

              <button
                type="button"
                className="save-address-btn"
                onClick={saveAddress}
              >
                Save Address
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
                checked={selectedPayment === "Online"}
                onChange={(e) => setSelectedPayment(e.target.value)}
              />
              <span className="radio-custom"></span>
              <span className="label-text">Online Payment (Razorpay)</span>
              <p className="payment-description">
                Pay securely with UPI, cards, netbanking, and more.
              </p>
            </label>

            <label className="radio-label">
              <input
                type="radio"
                name="payment"
                value="COD"
                checked={selectedPayment === "COD"}
                onChange={(e) => setSelectedPayment(e.target.value)}
              />
              <span className="radio-custom"></span>
              <span className="label-text">Cash on Delivery</span>
              <p className="payment-description">
                Pay when you receive your order.
              </p>
            </label>
          </div>
        </div>
      </div>

      <div className="place-order-right">
        <div className="cart-summary">
          <p className="title">Order Summary</p>
          {Object.entries(cartItems).map(([cartKey, cartItem]) => {
            if (cartKey.startsWith('box_')) {
              // Handle box items
              const boxData = cartItem.boxData;
              return (
                <div key={cartKey} className="cart-summary-item">
                  <div className="item-info">
                    <p className="item-name">{boxData.name}</p>
                    <div className="item-details">
                      <span className="size">Box Package</span>
                      <span className="box-contents">
                        ({boxData.items.map(item => 
                          `${item.itemId.name} - ${getQuantityLabel(item.size)}`
                        ).join(', ')})
                      </span>
                      <span className="quantity">× {cartItem.quantity}</span>
                    </div>
                  </div>
                  <div className="item-price">
                    <span className="market-price">₹{(boxData.marketPrice || boxData.price).toFixed(2)}</span>
                    <span>₹{(boxData.price * cartItem.quantity).toFixed(2)}</span>
                  </div>
                </div>
              );
            }

            const [itemId, size] = cartKey.split("_");
            const item = food_list.find((food) => food._id === itemId);

            if (item && !item.outOfStock && item.status === "in-stock") {
              const price = item.prices?.[size] || item.price;
              return (
                <div key={cartKey} className="cart-summary-item">
                  <div className="item-info">
                    <p className="item-name">{item.name || "Unknown Item"}</p>
                    <div className="item-details">
                      <span className="size">{getQuantityLabel(size)}</span>
                      <span className="quantity">× {cartItem.quantity}</span>
                    </div>
                  </div>
                  <p className="item-price">
                    ₹{(price * cartItem.quantity).toFixed(2)}
                  </p>
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
            <p>Delivery Charge</p>
            <p>
              ₹
              {((() => {
                const savedPromo = localStorage.getItem("appliedPromo");
                if (savedPromo) {
                  try {
                    const appliedPromo = JSON.parse(savedPromo);
                    if (appliedPromo.type === 'combo' && 
                        appliedPromo.benefits.some(b => b.type === 'free_delivery')) {
                      return 0;
                    }
                  } catch (error) {}
                }
                return getTotalCartAmount() === 0 ? 0 : 40;
              })()).toFixed(2)}
            </p>
          </div>
          {(() => {
            const savedPromo = localStorage.getItem("appliedPromo");
            if (savedPromo) {
              try {
                const appliedPromo = JSON.parse(savedPromo);
                const subtotal = getTotalCartAmount();
                let promoDiscount = 0;

                if (subtotal >= appliedPromo.minAmount) {
                  if (appliedPromo.type === 'combo') {
                    const discountBenefit = appliedPromo.benefits.find(b => b.type === 'percentage');
                    if (discountBenefit) {
                      promoDiscount = Math.round((subtotal * discountBenefit.value) / 100);
                    }
                  } else if (appliedPromo.type === 'percentage') {
                    promoDiscount = Math.round((subtotal * appliedPromo.value) / 100);
                  }
                }

                if (promoDiscount > 0) {
                  return (
                    <div className="cart-summary-item promo-discount">
                      <p>Promo Discount ({appliedPromo.code})</p>
                      <p className="discount-amount">-₹{promoDiscount.toFixed(2)}</p>
                    </div>
                  );
                }
              } catch (error) {}
            }
            return null;
          })()}
          <div className="cart-summary-item savings">
            <p>Total Savings</p>
            <p>₹{getTotalCartSavings().toFixed(2)}</p>
          </div>
          <div className="cart-summary-total">
            <p>Total Amount</p>
            <p>₹{calculateFinalAmount().toFixed(2)}</p>
          </div>
        </div>
        <button type="submit" className="place-order-btn" disabled={processing}>
          {processing
            ? selectedPayment === "Online"
              ? "Opening Payment Gateway..."
              : "Processing..."
            : "Place Order"}
        </button>
      </div>
    </form>
  );
};

export default PlaceOrder;
