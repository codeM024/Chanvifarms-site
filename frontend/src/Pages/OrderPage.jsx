import { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { StoreContext } from '../Context/StoreContext';
import axios from 'axios';
import { toast } from 'react-toastify';

const OrderPage = () => {
    const { token, user, cartItems, getTotalCartAmount, clearCart, food_list } = useContext(StoreContext);
    const [loading, setLoading] = useState(false);
    const [addresses, setAddresses] = useState([]);
    const [selectedAddress, setSelectedAddress] = useState(null);
    const [paymentMethod, setPaymentMethod] = useState('COD');
    const navigate = useNavigate();

    useEffect(() => {
        if (!token) {
            navigate('/login');
            return;
        }

        loadAddresses();
    }, [token, navigate]);

    const loadAddresses = async () => {
        try {
            const response = await axios.get('/api/user/addresses');
            if (response.data.success) {
                setAddresses(response.data.addresses);
                if (response.data.addresses.length > 0) {
                    const defaultAddress = response.data.addresses.find(addr => addr.isDefault) || response.data.addresses[0];
                    setSelectedAddress(defaultAddress);
                }
            }
        } catch (error) {
            console.error('Error loading addresses:', error);
            toast.error('Failed to load delivery addresses');
        }
    };

    const handlePlaceOrder = async () => {
        if (!selectedAddress) {
            toast.error('Please select a delivery address');
            return;
        }

        try {
            setLoading(true);

            const orderItems = Object.entries(cartItems).map(([key, value]) => {
                const [foodId, size] = key.split('_');
                const food = food_list.find(f => f._id === foodId);
                return {
                    _id: foodId,
                    name: food.name,
                    price: food.prices[size],
                    marketPrice: food.marketPrices[size],
                    quantity: value.quantity,
                    size,
                    image: food.image
                };
            });

            const orderData = {
                items: orderItems,
                amount: getTotalCartAmount(),
                address: selectedAddress,
                payment: {
                    method: paymentMethod
                }
            };

            const response = await axios.post('/api/order/place', orderData);

            if (response.data.success) {
                if (paymentMethod === 'COD') {
                    await clearCart();
                    toast.success('Order placed successfully!');
                    navigate('/orders');
                } else {
                    // Handle online payment
                    const options = {
                        key: response.data.data.key_id,
                        amount: response.data.data.amount,
                        currency: response.data.data.currency,
                        name: "Chanvi Farms",
                        description: "Purchase Payment",
                        order_id: response.data.data.order_id,
                        handler: async (response) => {
                            try {
                                const verifyResponse = await axios.post('/api/order/verify-payment', {
                                    razorpay_payment_id: response.razorpay_payment_id,
                                    razorpay_order_id: response.razorpay_order_id,
                                    razorpay_signature: response.razorpay_signature
                                });

                                if (verifyResponse.data.success) {
                                    await clearCart();
                                    toast.success('Payment successful and order placed!');
                                    navigate('/orders');
                                }
                            } catch (error) {
                                console.error('Payment verification error:', error);
                                toast.error('Payment verification failed');
                            }
                        },
                        prefill: {
                            name: user.name,
                            email: user.email,
                            contact: selectedAddress.phone
                        },
                        theme: {
                            color: "#3399cc"
                        }
                    };

                    const rzp = new window.Razorpay(options);
                    rzp.open();
                }
            }
        } catch (error) {
            console.error('Order placement error:', error);
            toast.error(error.response?.data?.message || 'Failed to place order');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-2xl font-bold mb-6">Place Order</h1>
            
            {/* Delivery Address Selection */}
            <div className="mb-6">
                <h2 className="text-xl font-semibold mb-4">Delivery Address</h2>
                {addresses.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {addresses.map((address) => (
                            <div 
                                key={address._id}
                                className={`p-4 border rounded-lg cursor-pointer ${
                                    selectedAddress?._id === address._id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                                }`}
                                onClick={() => setSelectedAddress(address)}
                            >
                                <p className="font-medium">{address.firstName} {address.lastName}</p>
                                <p>{address.street}</p>
                                <p>{address.city}, {address.state} {address.zipcode}</p>
                                <p>{address.phone}</p>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-4">
                        <p className="text-gray-600 mb-4">No addresses found</p>
                        <button
                            onClick={() => navigate('/profile')}
                            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                        >
                            Add New Address
                        </button>
                    </div>
                )}
            </div>

            {/* Payment Method Selection */}
            <div className="mb-6">
                <h2 className="text-xl font-semibold mb-4">Payment Method</h2>
                <div className="space-y-2">
                    <label className="flex items-center space-x-2">
                        <input
                            type="radio"
                            value="COD"
                            checked={paymentMethod === 'COD'}
                            onChange={(e) => setPaymentMethod(e.target.value)}
                            className="form-radio"
                        />
                        <span>Cash on Delivery</span>
                    </label>
                    <label className="flex items-center space-x-2">
                        <input
                            type="radio"
                            value="Online"
                            checked={paymentMethod === 'Online'}
                            onChange={(e) => setPaymentMethod(e.target.value)}
                            className="form-radio"
                        />
                        <span>Online Payment</span>
                    </label>
                </div>
            </div>

            {/* Order Summary */}
            <div className="mb-6">
                <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
                <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="space-y-2">
                        {Object.entries(cartItems).map(([key, value]) => {
                            const [foodId, size] = key.split('_');
                            const food = food_list.find(f => f._id === foodId);
                            return (
                                <div key={key} className="flex justify-between">
                                    <span>{food?.name} ({size}) x {value.quantity}</span>
                                    <span>₹{(food?.prices[size] * value.quantity).toFixed(2)}</span>
                                </div>
                            );
                        })}
                        <div className="border-t pt-2 mt-2">
                            <div className="flex justify-between font-semibold">
                                <span>Total Amount:</span>
                                <span>₹{getTotalCartAmount().toFixed(2)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Place Order Button */}
            <button
                onClick={handlePlaceOrder}
                disabled={loading || !selectedAddress}
                className={`w-full bg-blue-500 text-white py-3 rounded-lg font-semibold ${
                    loading || !selectedAddress ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-600'
                }`}
            >
                {loading ? 'Processing...' : 'Place Order'}
            </button>
        </div>
    );
};

export default OrderPage;