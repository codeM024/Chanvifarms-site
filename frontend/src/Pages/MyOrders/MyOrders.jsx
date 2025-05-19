import React, { useContext, useState, useEffect } from 'react';
import './MyOrders.css';
import { StoreContext } from '../../Context/StoreContext';
import axios from 'axios';
import { format } from 'date-fns';
import { toast } from 'react-toastify';

const MyOrders = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [trackingOrder, setTrackingOrder] = useState(null);
    const { url, token, user } = useContext(StoreContext);

    const fetchOrders = async () => {
        try {
            setLoading(true);
            const response = await axios.post(url + "/api/order/userorders", 
                { userId: user?._id },
                { headers: { token } }
            );
            
            if (response.data.success) {
                setOrders(response.data.data.sort((a, b) => 
                    new Date(b.createdAt) - new Date(a.createdAt)
                ));
            }
        } catch (error) {
            console.error("Error fetching orders:", error);
            toast.error("Failed to load orders");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (token) {
            fetchOrders();
        }
    }, [token]);

    const getStatusColor = (status) => {
        const colors = {
            pending: '#ff9800',
            confirmed: '#2196f3',
            packing: '#673ab7',
            'out-for-delivery': '#009688',
            delivered: '#4caf50',
            cancelled: '#f44336'
        };
        return colors[status] || '#757575';
    };

    const formatDate = (date) => {
        return format(new Date(date), 'PPpp');
    };

    const handleTrackOrder = async (orderId) => {
        setTrackingOrder(orderId);
        await fetchOrders(); // Refresh order status
        toast.info("Refreshing order status...");
        setTimeout(() => setTrackingOrder(null), 2000); // Reset tracking state after animation
    };

    if (loading) {
        return (
            <div className="my-orders-loading">
                <div className="loading-spinner"></div>
                <p>Loading your orders...</p>
            </div>
        );
    }

    return (
        <div className="my-orders">
            <h1>My Orders</h1>
            
            {orders.length === 0 ? (
                <div className="no-orders">
                    <i className="fas fa-shopping-bag"></i>
                    <h2>No Orders Yet</h2>
                    <p>You have not placed any orders yet. Start shopping to see your orders here!</p>
                </div>
            ) : (
                <div className="orders-container">
                    {orders.map((order) => (
                        <div key={order._id} className="order-card">
                            <div className="order-header">
                                <div className="order-info">
                                    <h3>Order #{order._id.slice(-8)}</h3>
                                    <p className="order-date">{formatDate(order.createdAt)}</p>
                                </div>
                                <div className="tracking-section">
                                    <div 
                                        className="order-status"
                                        style={{ backgroundColor: getStatusColor(order.status) + '20',
                                                color: getStatusColor(order.status) }}
                                    >
                                        {order.status.replace(/-/g, ' ').toUpperCase()}
                                    </div>
                                    <button 
                                        className={`track-order-btn ${trackingOrder === order._id ? 'tracking' : ''}`}
                                        onClick={() => handleTrackOrder(order._id)}
                                        disabled={trackingOrder === order._id}
                                    >
                                        <i className="fas fa-map-marker-alt"></i>
                                        {trackingOrder === order._id ? 'Tracking...' : 'Track Order'}
                                    </button>
                                </div>
                            </div>

                            <div className="order-items">
                                {order.items.map((item, index) => (
                                    <div key={index} className="order-item">
                                        <div className="item-image">
                                            <img src={`${url}/images/${item.image}`} alt={item.name} />
                                        </div>
                                        <div className="item-details">
                                            <h4>{item.name}</h4>
                                            <p className="item-size">Size: {item.size === 'g250' ? '250g' : 
                                                                         item.size === 'g500' ? '500g' : '1kg'}</p>
                                            <p className="item-quantity">Quantity: {item.quantity}</p>
                                            <p className="item-price">₹{item.price.toFixed(2)} × {item.quantity}</p>
                                        </div>
                                        <div className="item-total">
                                            ₹{(item.price * item.quantity).toFixed(2)}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="order-details">
                                <div className="details-section payment-details">
                                    <h4>Payment Details</h4>
                                    <p>Method: {order.payment?.method || 'N/A'}</p>
                                    <p className="total-amount">Total: ₹{order.amount.toFixed(2)}</p>
                                </div>

                                <div className="details-section shipping-address">
                                    <h4>Delivery Address</h4>
                                    <p>{order.address.firstName} {order.address.lastName}</p>
                                    <p>{order.address.street}</p>
                                    <p>{order.address.city}, {order.address.state} {order.address.zipcode}</p>
                                    <p>Phone: {order.address.phone}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default MyOrders;