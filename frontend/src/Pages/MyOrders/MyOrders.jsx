import { useContext, useState, useEffect } from 'react';
import './MyOrders.css';
import { StoreContext } from '../../Context/StoreContext';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { toast } from 'react-toastify';
import Reveal from '../../Components/Motion/Reveal';

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

    const getStatusDetails = (status) => {
        const statusMap = {
            pending: {
                color: '#d97706',
                text: 'Order Pending',
                description: 'Your order has been received and is awaiting confirmation'
            },
            confirmed: {
                color: '#2563eb',
                text: 'Order Confirmed',
                description: 'Your order has been confirmed and will be processed soon'
            },
            packing: {
                color: '#7c3aed',
                text: 'Packing',
                description: 'Your order is being packed'
            },
            'out-for-delivery': {
                color: '#0d9488',
                text: 'Out for Delivery',
                description: 'Your order is on its way'
            },
            delivered: {
                color: '#2e8b45',
                text: 'Delivered',
                description: 'Your order has been delivered'
            },
            cancelled: {
                color: '#e5484d',
                text: 'Cancelled',
                description: 'Your order has been cancelled'
            }
        };
        return statusMap[status] || {
            color: '#5b6b60',
            text: status.charAt(0).toUpperCase() + status.slice(1),
            description: 'Status is being updated'
        };
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
            <div className="my-orders" aria-busy="true" aria-live="polite">
                <div className="my-orders-header">
                    <div className="my-orders-header">
                <h1>My Orders</h1>
                {orders.length > 0 && (
                    <p className="my-orders-sub">{orders.length} {orders.length === 1 ? 'order' : 'orders'} placed</p>
                )}
            </div>

        <p className="my-orders-sub">Loading your orders...</p>
                </div>
                <div className="orders-container">
                    {[0, 1, 2].map((i) => (
                        <div key={i} className="order-card order-card-skeleton" aria-hidden="true">
                            <div className="sk-row">
                                <div className="skeleton sk-line sk-w-40"></div>
                                <div className="skeleton sk-pill"></div>
                            </div>
                            <div className="skeleton sk-line sk-w-25 sk-thin"></div>
                            <div className="sk-item">
                                <div className="skeleton sk-thumb"></div>
                                <div className="sk-item-lines">
                                    <div className="skeleton sk-line sk-w-60"></div>
                                    <div className="skeleton sk-line sk-w-35 sk-thin"></div>
                                </div>
                                <div className="skeleton sk-line sk-w-15"></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="my-orders">
            <div className="my-orders-header">
                <h1>My Orders</h1>
                {orders.length > 0 && (
                    <p className="my-orders-sub">{orders.length} {orders.length === 1 ? 'order' : 'orders'} placed</p>
                )}
            </div>


            {orders.length === 0 ? (
                <div className="no-orders">
                    <i className="fas fa-shopping-bag"></i>
                    <h2>No Orders Yet</h2>
                    <p>You have not placed any orders yet. Start shopping to see your orders here!</p>
                    <Link to="/shop" className="btn-primary"><i className="fas fa-leaf"></i> Start Shopping</Link>
                </div>
            ) : (
                <div className="orders-container">
                    {orders.map((order, index) => (
                        <Reveal key={order._id} className="order-card" delay={Math.min(index, 4) * 0.05} y={16}>
                            <div className="order-header">
                                <div className="order-info">
                                    <h3>Order #{order._id.slice(-8)}</h3>
                                    <p className="order-date">{formatDate(order.createdAt)}</p>
                                </div>
                                <div className="tracking-section">
                                    <div className="order-status-container">
                                        <div 
                                            className={`order-status status-${order.status}`}
                                            style={{ '--status-color': getStatusDetails(order.status).color }}
                                        >
                                            <span className="status-dot" aria-hidden="true"></span>
                                            {getStatusDetails(order.status).text}
                                        </div>
                                        <div className="status-description">
                                            {getStatusDetails(order.status).description}
                                        </div>
                                    </div>
                                    <button 
                                        className={`track-order-btn ${trackingOrder === order._id ? 'tracking' : ''}`}
                                        onClick={() => handleTrackOrder(order._id)}
                                        disabled={trackingOrder === order._id}
                                    >
                                        <i className={`fas ${trackingOrder === order._id ? 'fa-sync-alt fa-spin' : 'fa-map-marker-alt'}`}></i>
                                        {trackingOrder === order._id ? 'Tracking...' : 'Track Order'}
                                    </button>
                                </div>
                            </div>

                            <div className="order-items">
                                {order.items.map((item, index) => (
                                    <div key={index} className="order-item">
                                        <div className="item-image">
                                            <img src={`${url}/images/${item.image}`} alt={item.name} loading="lazy" decoding="async" />
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
                        </Reveal>
                    ))}
                </div>
            )}
        </div>
    );
};

export default MyOrders;