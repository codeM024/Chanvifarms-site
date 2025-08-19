import orderModel from "../models/orderModel.js";
import userModel from "../models/userModel.js";
import Razorpay from "razorpay";
import crypto from 'crypto';

// Initialize Razorpay only if credentials are available
let razorpay;
try {
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
        console.error("Razorpay credentials are missing in environment variables");
    } else {
        razorpay = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID,
            key_secret: process.env.RAZORPAY_KEY_SECRET
        });
    }
} catch (error) {
    console.error("Failed to initialize Razorpay:", error);
}

const placeOrder = async (req, res) => {
    try {
        const { items, amount, address, payment } = req.body;
        
        // Validate payment method
        const validPaymentMethods = ['COD', 'Online', 'WHATSAPP_PAY'];
        if (!validPaymentMethods.includes(payment.method)) {
            return res.status(400).json({
                success: false,
                message: "Invalid payment method"
            });
        }

        // Create new order - all orders start in pending state
        const newOrder = new orderModel({
            userId: req.userId,
            items,
            amount,
            address,
            payment: {
                method: payment.method,
                status: 'pending'  // All payments start as pending
            },
            status: 'pending'  // All orders start as pending
        });
        
        await newOrder.save();

        const sendWhatsAppNotification = async (order) => {
            const user = await userModel.findById(order.userId);
            const whatsappNumber = "917899940804";
            const orderDetails = order.items.map(item => 
                `${item.name} (${item.size}) × ${item.quantity}`
            ).join(", ");
            
            const message = `New Order Received!
Order ID: ${order._id}
Customer: ${user.name}
Phone: ${user.phone}
Amount: ₹${order.amount}
Items: ${orderDetails}
Shipping Address: ${order.address.street}, ${order.address.city}, ${order.address.state} - ${order.address.pincode}
Payment Method: ${order.payment.method}`;

            const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
            return whatsappUrl;
        };

        // Clear cart after order creation
        await clearUserCart(req.userId);

        // Handle WhatsApp Pay specific logic
        if (payment.method === 'WHATSAPP_PAY') {
                const user = await userModel.findById(req.userId);
                
                // Format items for better readability
                const itemsList = items.map((item, index) => 
                    `${index + 1}. ${item.name} (${item.size}) × ${item.quantity} = ₹${item.price * item.quantity}`
                ).join('\n');
                
                // Calculate total savings if available
                const totalSavings = items.reduce((sum, item) => 
                    sum + ((item.marketPrice - item.price) * item.quantity), 0);
                
                // Create a professional payment message
                const paymentMessage = `*Payment Request for Order #${newOrder._id.toString().slice(-6)}*\n\n` +
                    `💰 *Total Amount: ₹${amount}*\n` +
                    (totalSavings > 0 ? `🎯 Your Savings: ₹${totalSavings}\n` : '') +
                    `\n📋 *Order Details:*\n${itemsList}\n\n` +
                    `👤 *Customer Details:*\n` +
                    `Name: ${address.firstName} ${address.lastName}\n` +
                    `Phone: ${address.phone}\n\n` +
                    `📍 *Delivery Address:*\n` +
                    `${address.street}\n${address.city}, ${address.state}\n${address.zipcode}\n\n` +
                    `Please complete the payment using WhatsApp Pay or UPI.\n` +
                    `Reference: Order #${newOrder._id.toString().slice(-6)}`;

                // Create WhatsApp URL with the formatted message
                const whatsappUrl = `https://wa.me/917899940804?text=${encodeURIComponent(paymentMessage)}`;
                
                // Update order status
                await orderModel.findByIdAndUpdate(newOrder._id, {
                    'payment.status': 'pending',
                    'payment.whatsappPaymentInitiated': true
                });

                return res.json({
                    success: true,
                    message: "Order placed successfully! Redirecting to WhatsApp for payment.",
                    orderId: newOrder._id,
                    whatsappUrl,
                    paymentStatus: 'pending'
                });
            }
            
            return res.json({
                success: true,
                message: "Order placed successfully",
                orderId: newOrder._id
            });

        // For online payments
        if (payment.method === 'Online') {
            // Create Razorpay order
            const razorpayOrder = await razorpay.orders.create({
                amount: Math.round(amount * 100), // Convert to paise
                currency: "INR",
                receipt: newOrder._id.toString()
            });

            // Update order with Razorpay order ID
            await orderModel.findByIdAndUpdate(newOrder._id, {
                'payment.razorpayOrderId': razorpayOrder.id
            });

            return res.json({
                success: true,
                orderId: newOrder._id,
                paymentDetails: {
                    orderId: razorpayOrder.id,
                    amount: razorpayOrder.amount,
                    currency: razorpayOrder.currency
                }
            });
        }

        // Default response for other payment methods
        return res.json({
            success: true,
            message: "Order placed successfully",
            orderId: newOrder._id
        });

    } catch (error) {
        console.error("Error placing order:", error);
        res.status(500).json({
            success: false,
            message: "Failed to place order. Please try again."
        });
    }
};

// Helper function to clear user's cart
const clearUserCart = async (userId) => {
    try {
        await userModel.findByIdAndUpdate(userId, { cartData: {} });
    } catch (error) {
        console.error("Error clearing user cart:", error);
    }
};

const confirmWhatsAppPayment = async (req, res) => {
    try {
        const { orderId, transactionId } = req.body;

        if (!orderId) {
            return res.status(400).json({
                success: false,
                message: "Order ID is required"
            });
        }

        const order = await orderModel.findById(orderId);
        
        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Order not found"
            });
        }

        if (order.payment.method !== 'WHATSAPP_PAY') {
            return res.status(400).json({
                success: false,
                message: "This order is not using WhatsApp Pay"
            });
        }

        // Update order payment status
        await orderModel.findByIdAndUpdate(orderId, {
            'payment.status': 'completed',
            'payment.whatsappPaymentTimestamp': new Date(),
            'payment.transactionId': transactionId || `WP_${Date.now()}`,
            status: 'confirmed'
        });

        // Send confirmation to WhatsApp
        const user = await userModel.findById(order.userId);
        const confirmationMessage = `Payment Confirmed ✅\n\n` +
            `Order #${order._id.toString().slice(-6)} has been confirmed.\n` +
            `Amount Paid: ₹${order.amount}\n` +
            `Transaction ID: ${transactionId || `WP_${Date.now()}`}\n\n` +
            `Thank you for your payment! Your order will be processed shortly.`;

        // Format phone number to standard WhatsApp format (remove '+' if present)
        const formattedPhone = user.phone.replace(/^\+/, '');
        const whatsappUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(confirmationMessage)}`;

        res.json({
            success: true,
            message: "WhatsApp payment confirmed successfully",
            whatsappConfirmationUrl: whatsappUrl
        });

    } catch (error) {
        console.error("Error confirming WhatsApp payment:", error);
        res.status(500).json({
            success: false,
            message: "Failed to confirm WhatsApp payment"
        });
    }
};

const verifyOrderPayment = async (req, res) => {
    try {
        const { orderId, razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body;

        const order = await orderModel.findById(orderId);
        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Order not found"
            });
        }

        // Verify the payment signature
        const generatedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(razorpay_order_id + "|" + razorpay_payment_id)
            .digest('hex');

        if (generatedSignature === razorpay_signature) {
            // Update order status
            await orderModel.findByIdAndUpdate(orderId, {
                status: 'confirmed',
                'payment.status': 'completed',
                'payment.transactionId': razorpay_payment_id
            });

            // Clear user's cart
            await clearUserCart(order.userId);

            return res.json({
                success: true,
                message: "Payment verified and order confirmed"
            });
        }

        // If signature verification fails
        await orderModel.findByIdAndUpdate(orderId, {
            status: 'payment_failed',
            'payment.status': 'failed'
        });

        return res.status(400).json({
            success: false,
            message: "Payment verification failed - invalid signature"
        });

    } catch (error) {
        console.error("Error verifying payment:", error);
        res.status(500).json({
            success: false,
            message: "Error processing payment verification"
        });
    }
};

const userOrders = async (req, res) => {
    try {
        const userId = req.userId; // Get userId from auth middleware
        const orders = await orderModel.find({ userId })
            .sort({ createdAt: -1 }); // Sort by newest first
        
        res.json({
            success: true,
            data: orders
        });
    } catch (error) {
        console.error("Error fetching user orders:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching your orders"
        });
    }
}

//Listing orders for admin panel
const listOrders = async (req,res)=>{
    try{
        const orders = await orderModel.find({});
        res.json({success:true,data:orders})
    }catch(error){
        console.log(error);
        res.json({success:false,message:"Error"})
    }
}

// api for updating order status
const updateStatus = async (req, res) => {
    try {
        const { orderId, status, cancelReason } = req.body;

        // Input validation
        if (!orderId || !status) {
            return res.status(400).json({
                success: false,
                message: "Order ID and status are required"
            });
        }

        // Get the order details
        const order = await orderModel.findById(orderId);
        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Order not found"
            });
        }

        // Handle WhatsApp Pay specific logic for confirming orders
        if (status === 'confirmed' && order.payment.method === 'WHATSAPP_PAY') {
            order.payment.status = 'completed';
            order.payment.whatsappPaymentTimestamp = new Date();
            order.payment.transactionId = `WP_${Date.now()}`;
        }

        // Update order status
        order.status = status;
        await order.save();

        // Format customer's phone number for WhatsApp
        const formattedPhone = order.address.phone.replace(/^\+/, '').replace(/\s/g, '');
        
        // Prepare notification message based on status
        let notificationMessage = '';
        if (status === 'confirmed') {
            notificationMessage = `🎉 *Order Confirmed!*\n\n` +
                `Dear ${order.address.firstName},\n\n` +
                `Your order #${order._id.toString().slice(-6)} has been confirmed!\n` +
                `*Amount:* ₹${order.amount}\n\n` +
                `*Order Details:*\n` +
                order.items.map((item, index) => 
                    `${index + 1}. ${item.name} (${item.size}) × ${item.quantity}`
                ).join('\n') + '\n\n' +
                `You can track your order in the My Orders section of our website.\n\n` +
                `Thank you for choosing Chanvi Farms! 🌿`;
        } else if (status === 'cancelled') {
            if (!cancelReason) {
                return res.status(400).json({
                    success: false,
                    message: "Cancellation reason is required"
                });
            }
            notificationMessage = `❌ *Order Cancelled*\n\n` +
                `Dear ${order.address.firstName},\n\n` +
                `We regret to inform you that your order #${order._id.toString().slice(-6)} has been cancelled.\n\n` +
                `*Reason:* ${cancelReason}\n\n` +
                `*Order Details:*\n` +
                order.items.map((item, index) => 
                    `${index + 1}. ${item.name} (${item.size}) × ${item.quantity}`
                ).join('\n') + '\n\n' +
                `If you have any questions, please don't hesitate to contact us.\n\n` +
                `We hope to serve you again soon!`;
        } else if (status === 'out-for-delivery') {
            notificationMessage = `🚚 *Order Out for Delivery!*\n\n` +
                `Dear ${order.address.firstName},\n\n` +
                `Your order #${order._id.toString().slice(-6)} is out for delivery!\n` +
                `We'll deliver your order to:\n` +
                `${order.address.street}\n` +
                `${order.address.city}, ${order.address.state}\n` +
                `${order.address.zipcode}\n\n` +
                `Our delivery partner will contact you shortly.\n\n` +
                `Thank you for choosing Chanvi Farms! 🌿`;
        }

        // If we have a notification message, create WhatsApp URL
        let whatsappUrl = null;
        if (notificationMessage) {
            whatsappUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(notificationMessage)}`;
        }

        // Return success response with WhatsApp URL if available
        return res.json({
            success: true,
            message: `Order status updated to ${status}`,
            whatsappUrl,
            updatedStatus: status
        });

    } catch (error) {
        console.error("Error updating order status:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to update order status"
        });
    }
}

const deleteOrder = async (req, res) => {
    try {
        const orderId = req.params.id;

        // Find the order first
        const order = await orderModel.findById(orderId);
        
        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Order not found"
            });
        }

        // Check if order status is either 'delivered' or 'cancelled'
        if (order.status !== 'delivered' && order.status !== 'cancelled') {
            return res.status(400).json({
                success: false,
                message: "Only delivered or cancelled orders can be deleted"
            });
        }

        // Delete the order without requiring authentication
        await orderModel.findByIdAndDelete(orderId);

        return res.status(200).json({
            success: true,
            message: "Order deleted successfully"
        });
    } catch (error) {
        console.error("Error in deleteOrder:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

export { placeOrder, verifyOrderPayment, userOrders, listOrders, updateStatus, confirmWhatsAppPayment, deleteOrder }
