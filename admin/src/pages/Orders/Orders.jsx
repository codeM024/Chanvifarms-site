import "./Orders.css";
import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import {
  FaWhatsapp,
  FaCopy,
  FaMapMarkerAlt,
  FaSearch,
  FaChevronDown,
  FaSortAmountDown,
  FaSortAmountUp,
  FaTrash,
} from "react-icons/fa";

const Orders = () => {
  const url = "http://localhost:4000";
  const [orders, setOrders] = useState([]);
  const [copiedOrderId, setCopiedOrderId] = useState(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("all");
  const [sortOrder, setSortOrder] = useState("newest");

  const fetchAllOrders = async () => {
    const response = await axios.get(url + "/api/order/list");
    if (response.data.success) {
      setOrders(response.data.data);
    } else {
      toast.error("Error");
    }
  };

  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [selectedOrderForCancel, setSelectedOrderForCancel] = useState(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedOrderForDelete, setSelectedOrderForDelete] = useState(null);
  
  const handleCancelSubmit = async () => {
    if (!cancelReason.trim()) {
      toast.error("Please provide a cancellation reason");
      return;
    }

    try {
      const loadingToast = toast.loading("Cancelling order...");
      
      // Update order status
      const response = await axios.post(url + "/api/order/status", {
        orderId: selectedOrderForCancel.orderId,
        status: 'cancelled',
        cancelReason: cancelReason.trim()
      });

      if (response.data.success) {
        toast.update(loadingToast, {
          render: "Order cancelled successfully",
          type: "success",
          isLoading: false,
          autoClose: 3000
        });

        // If we got a WhatsApp URL, open it after a short delay
        if (response.data.whatsappUrl) {
          setTimeout(() => {
            window.open(response.data.whatsappUrl, '_blank');
          }, 500);
        }

        await fetchAllOrders();
        setShowCancelDialog(false);
        setCancelReason('');
        setSelectedOrderForCancel(null);
      } else {
        toast.update(loadingToast, {
          render: response.data.message || "Failed to cancel order",
          type: "error",
          isLoading: false,
          autoClose: 3000
        });
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to cancel order");
    }
  };

  const handleDeleteOrder = async () => {
    if (!selectedOrderForDelete || !selectedOrderForDelete._id) {
      toast.error("Invalid order selected for deletion");
      return;
    }

    try {
      const loadingToast = toast.loading("Deleting order...");
      
      const response = await axios.delete(`${url}/api/order/delete/${selectedOrderForDelete._id}`, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.data.success) {
        toast.update(loadingToast, {
          render: "Order deleted successfully",
          type: "success",
          isLoading: false,
          autoClose: 3000
        });
        await fetchAllOrders();
        setShowDeleteDialog(false);
        setSelectedOrderForDelete(null);
      } else {
        toast.update(loadingToast, {
          render: response.data.message || "Failed to delete order",
          type: "error",
          isLoading: false,
          autoClose: 3000
        });
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete order");
      setShowDeleteDialog(false);
      setSelectedOrderForDelete(null);
    }
  };

  const statusHandler = async (event, orderId, currentOrder) => {
    const newStatus = event.target.value;
    const currentStatus = currentOrder.status;
    
    try {
      // Validate status transition from pending
      if (currentStatus === 'pending' && !['confirmed', 'cancelled'].includes(newStatus)) {
        toast.error("Pending orders can only be confirmed or cancelled");
        event.target.value = currentStatus;
        return;
      }

      // If status is cancelled, show the cancel dialog
      if (newStatus === 'cancelled') {
        setSelectedOrderForCancel({
          orderId,
          order: currentOrder
        });
        setShowCancelDialog(true);
        event.target.value = currentStatus;
        return;
      }

      // Show loading toast for better UX
      const loadingToast = toast.loading(`Updating order status to ${newStatus}...`);

      try {
        // Update order status - handle all payment methods the same way
        const response = await axios.post(url + "/api/order/status", {
          orderId,
          status: newStatus,
          paymentMethod: currentOrder.payment?.method || 'COD' // Default to COD if no payment method
        });

        if (response.data.success) {
          toast.update(loadingToast, {
            render: `Order ${newStatus === 'confirmed' ? 'confirmed! 🎉' : `status updated to ${newStatus}`}`,
            type: "success",
            isLoading: false,
            autoClose: 3000
          });

          // If we got a WhatsApp URL, open it after a short delay
          if (response.data.whatsappUrl) {
            setTimeout(() => {
              window.open(response.data.whatsappUrl, '_blank');
            }, 500);
          }

          await fetchAllOrders();
        } else {
          toast.update(loadingToast, {
            render: response.data.message || "Failed to update status",
            type: "error",
            isLoading: false,
            autoClose: 3000
          });
          event.target.value = currentStatus;
        }
      } catch (error) {
        toast.update(loadingToast, {
          render: error.response?.data?.message || "Failed to update status",
          type: "error",
          isLoading: false,
          autoClose: 3000
        });
        event.target.value = currentStatus;
      }
    } catch (error) {
      console.error("Error in status handler:", error);
      toast.error("An unexpected error occurred");
      event.target.value = currentStatus;
    }
  };

  const handleWhatsAppClick = (order) => {
    const orderDetails = order.items.map(item => 
      `${item.name} (${item.size}) × ${item.quantity}`
    ).join(", ");
    
    const message = `Order Details:
Order ID: ${order._id}
Customer: ${order.userId.name}
Phone: ${order.userId.phone}
Amount: ₹${order.amount}
Items: ${orderDetails}
Shipping Address: ${order.address.street}, ${order.address.city}, ${order.address.state} - ${order.address.pincode}
Payment Method: ${order.payment.method}`;

    const whatsappUrl = `https://wa.me/917899940804?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const formatItems = (items) => {
    return items
      .map((item, index) => {
        const itemText = `${item.name} (${item.size}) × ${item.quantity}`;
        return index === items.length - 1 ? itemText : itemText + ", ";
      })
      .join("");
  };

  const copyAddress = (address, orderId) => {
    const mapLink = address.location?.latitude
      ? `📍 Google Maps: https://www.google.com/maps?q=${address.location.latitude},${address.location.longitude}`
      : "";

    const fullAddress = `${address.firstName} ${address.lastName}
${address.street},
${address.city}, ${address.state}, ${address.country}, ${address.zipcode}
📞 ${address.phone}
${address.location?.address ? `📍 Location: ${address.location.address}` : ""}
${mapLink}`;

    navigator.clipboard.writeText(fullAddress);
    setCopiedOrderId(orderId);
    setTimeout(() => setCopiedOrderId(null), 2000);
    toast.success("Address copied to clipboard");
  };

  const openLocation = (location) => {
    if (location?.latitude && location?.longitude) {
      const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${location.latitude},${location.longitude}`;
      window.open(mapsUrl, "_blank");
    } else {
      toast.error("No location coordinates available");
    }
  };

  const openWhatsApp = (phone, address) => {
    const text = `Hello ${address.firstName} ${address.lastName}, Thank you for your order from Chanvi Farms!`;
    const whatsappUrl = `https://wa.me/${phone.replace(
      /[^0-9]/g,
      ""
    )}?text=${encodeURIComponent(text)}`;
    window.open(whatsappUrl, "_blank");
  };

  const filteredOrders = () => {
    let filtered = [...orders];

    // Apply search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(
        (order) =>
          order.address.firstName
            .toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          order.address.lastName
            .toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          order._id.toLowerCase().includes(searchQuery.toLowerCase()) ||
          order.items.some((item) =>
            item.name.toLowerCase().includes(searchQuery.toLowerCase())
          )
      );
    }

    // Apply date filter
    if (startDate && endDate) {
      filtered = filtered.filter((order) => {
        const orderDate = new Date(order.createdAt);
        return (
          orderDate >= new Date(startDate) && orderDate <= new Date(endDate)
        );
      });
    }

    // Apply status filter
    if (selectedStatus !== "all") {
      filtered = filtered.filter(
        (order) => order.status.toLowerCase() === selectedStatus
      );
    }

    // Apply payment method filter
    if (selectedPaymentMethod !== "all") {
      filtered = filtered.filter(
        (order) =>
          order.payment?.method?.toLowerCase() ===
          selectedPaymentMethod.toLowerCase()
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      const dateA = new Date(a.createdAt);
      const dateB = new Date(b.createdAt);
      return sortOrder === "newest" ? dateB - dateA : dateA - dateB;
    });

    return filtered;
  };

  const toggleSortOrder = () => {
    setSortOrder(sortOrder === "newest" ? "oldest" : "newest");
  };

  const statusOptions = [
    { value: "all", label: "All Orders" },
    { value: "pending", label: "Pending" },
    { value: "confirmed", label: "Confirmed" },
    { value: "packing", label: "Packing" },
    { value: "out-for-delivery", label: "Out for Delivery" },
    { value: "delivered", label: "Delivered" },
    { value: "cancelled", label: "Cancelled" },
  ];

  useEffect(() => {
    fetchAllOrders();
  }, []);

  return (
    <div className="orders-container">
      <div className="orders-header">
        <div className="header-main">
          <div className="header-left">
            <h2>Order List</h2>
            <div className="search-bar">
              <FaSearch className="search-icon" />
              <input
                type="text"
                placeholder="Search orders by name, ID or items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <div className="header-right">
            <div className="total-orders">
              <span className="order-count-label">Total Orders</span>
              <span className="order-count-number">
                {filteredOrders().length}
              </span>
              <span className="order-count-total">/ {orders.length}</span>
            </div>
          </div>
        </div>

        <div className="filters-section">
          <div className="filters-row">
            <div className="filters-left">
              <div className="status-filter-chips">
                {statusOptions.map((status) => (
                  <button
                    key={status.value}
                    className={`status-chip ${
                      selectedStatus === status.value ? "active" : ""
                    } ${status.value}`}
                    onClick={() => setSelectedStatus(status.value)}
                  >
                    {status.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="filters-right">
              <div className="date-filter">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  placeholder="Start Date"
                />
                <span>to</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  placeholder="End Date"
                />
              </div>
              <div className="payment-filter">
                <select
                  value={selectedPaymentMethod}
                  onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                  className="payment-select"
                >
                  <option value="all">All Payments</option>
                  <option value="cod">COD</option>
                  <option value="online">Online</option>
                  <option value="whatsapp_pay">WhatsApp Pay</option>
                </select>
              </div>
              <div className="status-filter">
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="status-select"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="processing">Processing</option>
                  <option value="packing">Packing</option>
                  <option value="out-for-delivery">Out for Delivery</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <div className="sort-filter">
                <button
                  className="sort-button"
                  onClick={toggleSortOrder}
                  title={sortOrder === "newest" ? "Newest first" : "Oldest first"}
                >
                  {sortOrder === "newest" ? (
                    <>
                      <FaSortAmountDown /> Newest
                    </>
                  ) : (
                    <>
                      <FaSortAmountUp /> Oldest
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="orders-list-container">
        <div className="orders-list">
          {filteredOrders().map((order, index) => (
            <div key={index} className="order-card" data-status={order.status}>
              <div className="order-status-section">
                <div className="order-id-section">
                  <div className="order-id">Order #{order._id.slice(-6)}</div>
                  <div className="order-actions">
                    <button 
                      className="whatsapp-button"
                      onClick={() => handleWhatsAppClick(order)}
                      title="Send to WhatsApp"
                    >
                      <FaWhatsapp />
                    </button>
                    {(order.status === 'delivered' || order.status === 'cancelled') && (
                      <button 
                        className="delete-button"
                        onClick={() => {
                          setSelectedOrderForDelete(order);
                          setShowDeleteDialog(true);
                        }}
                        title="Delete Order"
                      >
                        <FaTrash />
                      </button>
                    )}
                  </div>
                </div>
                <div className="status-select-wrapper">
                  <select
                    onChange={(event) => statusHandler(event, order._id, order)}
                    value={order.status}
                    className={`status-select status-${order.status.toLowerCase()}`}
                    disabled={order.status === 'delivered' || order.status === 'cancelled'}
                  >
                    {order.status === 'pending' ? (
                      <>
                        <option value="pending">Pending</option>
                        <option value="confirmed">Confirm Order</option>
                        <option value="cancelled">Cancel Order</option>
                      </>
                    ) : (
                      <>
                        <option value="pending">Pending</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="packing">Packing</option>
                        <option value="out-for-delivery">Out for Delivery</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                      </>
                    )}
                  </select>
                  <FaChevronDown className="select-arrow" />
                </div>
              </div>

              <div className="order-content">
                <div className="order-images-section">
                  <div className="order-items-grid">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="item-card">
                        <div className="item-image-container">
                          <img
                            src={`${url}/images/${item.image}`}
                            alt={item.name}
                            className="product-image"
                          />
                          <div className="item-quantity">×{item.quantity}</div>
                        </div>
                        <div className="item-name">{item.name}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="order-details-section">
                  <div className="customer-info">
                    <h3 className="customer-name">
                      {order.address.firstName} {order.address.lastName}
                    </h3>
                    <div className="address-details">
                      <p>{order.address.street}</p>
                      <p>
                        {order.address.city}, {order.address.state}
                      </p>
                      <p>
                        {order.address.country} - {order.address.zipcode}
                      </p>
                    </div>

                    {order.address.location?.address && (
                      <div className="location-info">
                        <FaMapMarkerAlt />
                        <span>{order.address.location.address}</span>
                        <button
                          className="map-button"
                          onClick={() => openLocation(order.address.location)}
                        >
                          View on Maps
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="contact-info">
                    <div className="phone-number">
                    <i className="fas fa-phone"></i> {order.address.phone}
                    </div>
                    <div className="contact-buttons">
                      <button
                        className="contact-btn copy"
                        onClick={() => copyAddress(order.address, order._id)}
                      >
                        <FaCopy />{" "}
                        {copiedOrderId === order._id
                          ? "Copied!"
                          : "Copy Address"}
                      </button>
                      <a
                        href={`tel:${order.address.phone}`}
                        className="contact-btn call"
                      >
                        <i className="fas fa-phone"></i> Call
                      </a>
                      <button
                        className="contact-btn whatsapp"
                        onClick={() =>
                          openWhatsApp(order.address.phone, order.address)
                        }
                      >
                        <FaWhatsapp /> WhatsApp
                      </button>
                    </div>
                  </div>

                  <div className="order-summary">
                    <div className="items-summary">
                      {formatItems(order.items)}
                    </div>
                    {order.payment?.method && (
                      <div className="payment-details">
                        <div className="payment-method">
                          <span
                            className={`payment-badge ${order.payment.method.toLowerCase()}`}
                          >
                            {order.payment.method}
                          </span>
                          <span className="order-date">
                            {new Date(order.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="total-amount">
                          <span>Total:</span>
                          <span className="amount">
                            ₹{order.amount.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Cancel Order Dialog */}
      {showCancelDialog && selectedOrderForCancel && (
        <div className="cancel-dialog-overlay">
          <div className="cancel-dialog">
            <div className="cancel-dialog-header">
              <h3>Cancel Order #{selectedOrderForCancel.order._id.slice(-6)}</h3>
              <button 
                className="close-button"
                onClick={() => {
                  setShowCancelDialog(false);
                  setCancelReason('');
                  setSelectedOrderForCancel(null);
                }}
              >
                ×
              </button>
            </div>

            <div className="order-summary-section">
              <div className="customer-details">
                <p className="customer-name">
                  {selectedOrderForCancel.order.address.firstName} {selectedOrderForCancel.order.address.lastName}
                </p>
                <p className="customer-phone">{selectedOrderForCancel.order.address.phone}</p>
              </div>
              
              <div className="order-items">
                <h4>Order Items:</h4>
                <div className="items-list">
                  {selectedOrderForCancel.order.items.map((item, idx) => (
                    <div key={idx} className="item-row">
                      <span className="item-name">{item.name}</span>
                      <span className="item-size">({item.size})</span>
                      <span className="item-quantity">×{item.quantity}</span>
                    </div>
                  ))}
                </div>
                <div className="total-amount">
                  Total Amount: ₹{selectedOrderForCancel.order.amount.toFixed(2)}
                </div>
              </div>
            </div>
            
            <div className="cancel-form">
              <label>
                <span className="required">*</span> 
                Reason for Cancellation:
              </label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Please provide a detailed reason for cancellation..."
                rows="4"
                className={!cancelReason.trim() ? 'error' : ''}
              />
              {!cancelReason.trim() && (
                <span className="error-message">Cancellation reason is required</span>
              )}
              
              <div className="cancel-note">
                <p>
                  <FaWhatsapp className="whatsapp-icon" />
                  A cancellation message will be sent to the customer via WhatsApp
                </p>
              </div>
              
              <div className="cancel-actions">
                <button 
                  className="btn-cancel"
                  onClick={() => {
                    setShowCancelDialog(false);
                    setCancelReason('');
                    setSelectedOrderForCancel(null);
                  }}
                >
                  Back
                </button>
                <button 
                  className="btn-confirm"
                  onClick={handleCancelSubmit}
                  disabled={!cancelReason.trim()}
                >
                  Confirm & Send WhatsApp
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Order Confirmation Dialog */}
      {showDeleteDialog && selectedOrderForDelete && (
        <div className="delete-dialog-overlay">
          <div className="delete-dialog">
            <div className="delete-dialog-header">
              <h3>Delete Order</h3>
              <button 
                className="close-button"
                onClick={() => {
                  setShowDeleteDialog(false);
                  setSelectedOrderForDelete(null);
                }}
              >
                ×
              </button>
            </div>
            
            <div className="delete-dialog-content">
              <div className="warning-icon">⚠️</div>
              <p>Are you sure you want to delete this order?</p>
              <div className="order-info">
                <p><strong>Order ID:</strong> #{selectedOrderForDelete._id.slice(-6)}</p>
                <p><strong>Status:</strong> {selectedOrderForDelete.status}</p>
                <p><strong>Customer:</strong> {selectedOrderForDelete.address.firstName} {selectedOrderForDelete.address.lastName}</p>
              </div>
              <p className="warning-text">This action cannot be undone.</p>
            </div>

            <div className="delete-dialog-actions">
              <button 
                className="btn-cancel"
                onClick={() => {
                  setShowDeleteDialog(false);
                  setSelectedOrderForDelete(null);
                }}
              >
                Cancel
              </button>
              <button 
                className="btn-delete"
                onClick={handleDeleteOrder}
              >
                Delete Order
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Orders;
