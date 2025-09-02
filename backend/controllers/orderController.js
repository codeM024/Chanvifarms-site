import orderModel from "../models/orderModel.js";
import userModel from "../models/userModel.js";
import Razorpay from "razorpay";
import crypto from "crypto";

// Initialize Razorpay only if credentials are available
let razorpay;
try {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    console.error("Razorpay credentials are missing in environment variables");
  } else {
    razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
  }
} catch (error) {
  console.error("Failed to initialize Razorpay:", error);
}

const placeOrder = async (req, res) => {
  try {
    const { items, amount, address, payment, subtotal, sgst, cgst, savings } =
      req.body;

    // Enhanced validation
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Order must contain at least one item",
      });
    }

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid order amount",
      });
    }

    if (!address || !address.firstName || !address.phone || !address.street) {
      return res.status(400).json({
        success: false,
        message: "Complete address is required",
      });
    }

    // Validate payment method
    const validPaymentMethods = ["COD", "Online", "WHATSAPP_PAY"];
    if (!validPaymentMethods.includes(payment.method)) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment method",
      });
    }

    // Validate user
    const user = await userModel.findById(req.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Create new order with enhanced data
    const newOrder = new orderModel({
      userId: req.userId,
      items,
      amount: Math.round(amount * 100) / 100, // Ensure 2 decimal places
      subtotal: Math.round((subtotal || 0) * 100) / 100,
      sgst: Math.round((sgst || 0) * 100) / 100,
      cgst: Math.round((cgst || 0) * 100) / 100,
      savings: Math.round((savings || 0) * 100) / 100,
      address: {
        ...address,
        phone: address.phone.replace(/\D/g, ""), // Clean phone number
      },
      payment: {
        method: payment.method,
        status: payment.method === "COD" ? "completed" : "pending",
      },
      status: payment.method === "COD" ? "confirmed" : "pending",
    });

    const savedOrder = await newOrder.save();

    // Handle different payment methods
    if (payment.method === "COD") {
      // Clear user cart
      await clearUserCart(req.userId);

      return res.json({
        success: true,
        message: "COD Order placed successfully",
        orderId: savedOrder._id,
        orderStatus: "confirmed",
      });
    } else if (payment.method === "WHATSAPP_PAY") {
      // Clear user cart for WhatsApp Pay as well
      await clearUserCart(req.userId);

      // Create WhatsApp payment message
      const itemsList = items
        .map(
          (item, index) =>
            `${index + 1}. ${item.name} (${item.size}) × ${item.quantity} = ₹${(
              item.price * item.quantity
            ).toFixed(2)}`
        )
        .join("\n");

      const paymentMessage =
        `*Payment Request for Order #${savedOrder._id
          .toString()
          .slice(-6)}*\n\n` +
        `💰 *Total Amount: ₹${amount.toFixed(2)}*\n` +
        (savings > 0 ? `🎯 Your Savings: ₹${savings.toFixed(2)}\n` : "") +
        `\n📋 *Order Details:*\n${itemsList}\n\n` +
        `👤 *Customer Details:*\n` +
        `Name: ${address.firstName} ${address.lastName}\n` +
        `Phone: ${address.phone}\n\n` +
        `📍 *Delivery Address:*\n` +
        `${address.street}\n${address.city}, ${address.state}\n${address.zipcode}\n\n` +
        `Please complete the payment using WhatsApp Pay or UPI.\n` +
        `Reference: Order #${savedOrder._id.toString().slice(-6)}`;

      const whatsappUrl = `https://wa.me/917899940804?text=${encodeURIComponent(
        paymentMessage
      )}`;

      // Update order with WhatsApp payment initiation
      await orderModel.findByIdAndUpdate(savedOrder._id, {
        "payment.whatsappPaymentInitiated": true,
        "payment.whatsappInitiatedAt": new Date(),
      });

      return res.json({
        success: true,
        message:
          "Order placed successfully! Redirecting to WhatsApp for payment.",
        orderId: savedOrder._id,
        whatsappUrl,
        paymentStatus: "pending",
      });
    } else if (payment.method === "Online") {
      // Handle Razorpay payment
      if (!razorpay) {
        return res.status(503).json({
          success: false,
          message: "Payment service is currently unavailable",
        });
      }

      try {
        // Create Razorpay order
        const razorpayOrder = await razorpay.orders.create({
          amount: Math.round(amount * 100), // Convert to paise
          currency: "INR",
          receipt: `order_${savedOrder._id}`,
          notes: {
            orderId: savedOrder._id.toString(),
            customerName: `${address.firstName} ${address.lastName}`,
            phone: address.phone,
          },
        });

        // Update order with Razorpay order ID
        await orderModel.findByIdAndUpdate(savedOrder._id, {
          "payment.razorpayOrderId": razorpayOrder.id,
          "payment.razorpayOrderCreatedAt": new Date(),
        });

        return res.json({
          success: true,
          message: "Order created successfully",
          orderId: savedOrder._id,
          paymentDetails: {
            orderId: razorpayOrder.id,
            amount: razorpayOrder.amount,
            currency: razorpayOrder.currency,
            key_id: process.env.RAZORPAY_KEY_ID,
          },
        });
      } catch (razorpayError) {
        console.error("Razorpay order creation error:", razorpayError);

        // Update order status to failed
        await orderModel.findByIdAndUpdate(savedOrder._id, {
          status: "payment_failed",
          "payment.status": "failed",
          "payment.failureReason": razorpayError.message,
        });

        return res.status(500).json({
          success: false,
          message: "Failed to create payment order. Please try again.",
        });
      }
    }
  } catch (error) {
    console.error("Error placing order:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to place order. Please try again.",
    });
  }
};

// Improved payment verification
const verifyOrderPayment = async (req, res) => {
  try {
    const {
      orderId,
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature,
    } = req.body;

    // Validate required fields
    if (
      !orderId ||
      !razorpay_payment_id ||
      !razorpay_order_id ||
      !razorpay_signature
    ) {
      return res.status(400).json({
        success: false,
        message: "Missing required payment verification data",
      });
    }

    const order = await orderModel.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Verify that this order belongs to the authenticated user
    if (order.userId.toString() !== req.userId) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized access to order",
      });
    }

    // Check if payment is already verified
    if (order.payment.status === "completed") {
      return res.json({
        success: true,
        message: "Payment already verified",
        alreadyVerified: true,
      });
    }

    // Verify the payment signature
    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(razorpay_order_id + "|" + razorpay_payment_id)
      .digest("hex");

    if (generatedSignature !== razorpay_signature) {
      // Update order status to payment failed
      await orderModel.findByIdAndUpdate(orderId, {
        status: "payment_failed",
        "payment.status": "failed",
        "payment.failureReason": "Invalid payment signature",
        "payment.verificationAttemptedAt": new Date(),
      });

      return res.status(400).json({
        success: false,
        message: "Payment verification failed - invalid signature",
      });
    }

    // Payment verified successfully
    await orderModel.findByIdAndUpdate(orderId, {
      status: "confirmed",
      "payment.status": "completed",
      "payment.transactionId": razorpay_payment_id,
      "payment.razorpayOrderId": razorpay_order_id,
      "payment.verifiedAt": new Date(),
      "payment.signature": razorpay_signature,
    });

    // Clear user's cart after successful payment
    await clearUserCart(order.userId);

    // Send success response
    return res.json({
      success: true,
      message: "Payment verified successfully and order confirmed",
    });
  } catch (error) {
    console.error("Error verifying payment:", error);

    // Try to update order with error info
    if (req.body.orderId) {
      try {
        await orderModel.findByIdAndUpdate(req.body.orderId, {
          "payment.verificationError": error.message,
          "payment.verificationAttemptedAt": new Date(),
        });
      } catch (updateError) {
        console.error(
          "Error updating order with verification error:",
          updateError
        );
      }
    }

    res.status(500).json({
      success: false,
      message: "Error processing payment verification",
    });
  }
};

// Helper function to clear user's cart
const clearUserCart = async (userId) => {
  try {
    await userModel.findByIdAndUpdate(userId, { cartData: {} });
    console.log(`Cart cleared for user: ${userId}`);
  } catch (error) {
    console.error("Error clearing user cart:", error);
    // Don't throw error as this is not critical for order placement
  }
};

// Enhanced WhatsApp payment confirmation
const confirmWhatsAppPayment = async (req, res) => {
  try {
    const { orderId, transactionId, paymentAmount } = req.body;

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: "Order ID is required",
      });
    }

    const order = await orderModel.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    if (order.payment.method !== "WHATSAPP_PAY") {
      return res.status(400).json({
        success: false,
        message: "This order is not using WhatsApp Pay",
      });
    }

    // Verify payment amount if provided
    if (paymentAmount && Math.abs(paymentAmount - order.amount) > 0.01) {
      return res.status(400).json({
        success: false,
        message: "Payment amount mismatch",
      });
    }

    // Update order payment status
    const updateData = {
      "payment.status": "completed",
      "payment.whatsappPaymentTimestamp": new Date(),
      "payment.transactionId": transactionId || `WP_${Date.now()}`,
      status: "confirmed",
    };

    if (paymentAmount) {
      updateData["payment.verifiedAmount"] = paymentAmount;
    }

    await orderModel.findByIdAndUpdate(orderId, updateData);

    // Get user details for confirmation message
    const user = await userModel.findById(order.userId);
    const confirmationMessage =
      `Payment Confirmed ✅\n\n` +
      `Order #${order._id.toString().slice(-6)} has been confirmed.\n` +
      `Amount Paid: ₹${order.amount.toFixed(2)}\n` +
      `Transaction ID: ${transactionId || `WP_${Date.now()}`}\n\n` +
      `Thank you for your payment! Your order will be processed shortly.`;

    const formattedPhone =
      user.phone?.replace(/^\+/, "") || order.address.phone.replace(/^\+/, "");
    const whatsappUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(
      confirmationMessage
    )}`;

    res.json({
      success: true,
      message: "WhatsApp payment confirmed successfully",
      whatsappConfirmationUrl: whatsappUrl,
      orderStatus: "confirmed",
    });
  } catch (error) {
    console.error("Error confirming WhatsApp payment:", error);
    res.status(500).json({
      success: false,
      message: "Failed to confirm WhatsApp payment",
    });
  }
};

// Add endpoint to update payment status (for admin use)
const updatePaymentStatus = async (req, res) => {
  try {
    const { orderId, paymentStatus, notes } = req.body;

    if (!orderId || !paymentStatus) {
      return res.status(400).json({
        success: false,
        message: "Order ID and payment status are required",
      });
    }

    const validStatuses = ["pending", "completed", "failed", "refunded"];
    if (!validStatuses.includes(paymentStatus)) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment status",
      });
    }

    const updateData = {
      "payment.status": paymentStatus,
      "payment.statusUpdatedAt": new Date(),
    };

    if (notes) {
      updateData["payment.adminNotes"] = notes;
    }

    // Update order status based on payment status
    if (paymentStatus === "completed") {
      updateData.status = "confirmed";
    } else if (paymentStatus === "failed") {
      updateData.status = "payment_failed";
    }

    const order = await orderModel.findByIdAndUpdate(orderId, updateData, {
      new: true,
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    res.json({
      success: true,
      message: "Payment status updated successfully",
      order: {
        _id: order._id,
        status: order.status,
        paymentStatus: order.payment.status,
      },
    });
  } catch (error) {
    console.error("Error updating payment status:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update payment status",
    });
  }
};

const userOrders = async (req, res) => {
  try {
    const userId = req.userId;
    const orders = await orderModel
      .find({ userId })
      .sort({ createdAt: -1 })
      .lean(); // Use lean for better performance

    res.json({
      success: true,
      data: orders,
    });
  } catch (error) {
    console.error("Error fetching user orders:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching your orders",
    });
  }
};

// Listing orders for admin panel
const listOrders = async (req, res) => {
  try {
    const { page = 1, limit = 50, status, paymentStatus } = req.query;

    let filter = {};
    if (status && status !== "all") {
      filter.status = status;
    }
    if (paymentStatus && paymentStatus !== "all") {
      filter["payment.status"] = paymentStatus;
    }

    const orders = await orderModel
      .find(filter)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const total = await orderModel.countDocuments(filter);

    res.json({
      success: true,
      data: orders,
      pagination: {
        current: page,
        total: Math.ceil(total / limit),
        count: orders.length,
        totalOrders: total,
      },
    });
  } catch (error) {
    console.error("Error listing orders:", error);
    res.json({
      success: false,
      message: "Error fetching orders",
    });
  }
};

// Enhanced order status update
const updateStatus = async (req, res) => {
  try {
    const { orderId, status, cancelReason } = req.body;

    if (!orderId || !status) {
      return res.status(400).json({
        success: false,
        message: "Order ID and status are required",
      });
    }

    const order = await orderModel.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Handle cancellation with reason
    if (status === "cancelled") {
      if (!cancelReason) {
        return res.status(400).json({
          success: false,
          message: "Cancellation reason is required",
        });
      }

      order.status = status;
      order.cancelReason = cancelReason;
      order.cancelledAt = new Date();

      // If payment was completed, mark for refund
      if (order.payment.status === "completed") {
        order.payment.refundStatus = "pending";
      }
    } else {
      order.status = status;
    }

    // Handle WhatsApp Pay confirmation
    if (
      status === "confirmed" &&
      order.payment.method === "WHATSAPP_PAY" &&
      order.payment.status === "pending"
    ) {
      order.payment.status = "completed";
      order.payment.whatsappPaymentTimestamp = new Date();
      order.payment.transactionId =
        order.payment.transactionId || `WP_${Date.now()}`;
    }

    const updatedOrder = await order.save();

    // Prepare notification messages
    const formattedPhone = order.address.phone
      .replace(/^\+/, "")
      .replace(/\s/g, "");
    let notificationMessage = "";

    if (status === "confirmed") {
      notificationMessage =
        `🎉 *Order Confirmed!*\n\n` +
        `Dear ${order.address.firstName},\n\n` +
        `Your order #${order._id.toString().slice(-6)} has been confirmed!\n` +
        `*Amount:* ₹${order.amount.toFixed(2)}\n\n` +
        `*Order Details:*\n` +
        order.items
          .map(
            (item, index) =>
              `${index + 1}. ${item.name} (${item.size}) × ${item.quantity}`
          )
          .join("\n") +
        "\n\n" +
        `You can track your order in the My Orders section.\n\n` +
        `Thank you for choosing Chanvi Farms! 🌿`;
    } else if (status === "cancelled") {
      notificationMessage =
        `❌ *Order Cancelled*\n\n` +
        `Dear ${order.address.firstName},\n\n` +
        `Your order #${order._id
          .toString()
          .slice(-6)} has been cancelled.\n\n` +
        `*Reason:* ${cancelReason}\n\n` +
        `*Order Details:*\n` +
        order.items
          .map(
            (item, index) =>
              `${index + 1}. ${item.name} (${item.size}) × ${item.quantity}`
          )
          .join("\n") +
        "\n\n" +
        `If you have any questions, please contact us.\n\n` +
        `We hope to serve you again soon!`;
    } else if (status === "out-for-delivery") {
      notificationMessage =
        `🚚 *Order Out for Delivery!*\n\n` +
        `Dear ${order.address.firstName},\n\n` +
        `Your order #${order._id.toString().slice(-6)} is out for delivery!\n` +
        `We'll deliver to:\n` +
        `${order.address.street}\n` +
        `${order.address.city}, ${order.address.state}\n` +
        `${order.address.zipcode}\n\n` +
        `Our delivery partner will contact you shortly.\n\n` +
        `Thank you for choosing Chanvi Farms! 🌿`;
    }

    let whatsappUrl = null;
    if (notificationMessage) {
      whatsappUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(
        notificationMessage
      )}`;
    }

    return res.json({
      success: true,
      message: `Order status updated to ${status}`,
      whatsappUrl,
      updatedStatus: status,
      order: {
        _id: updatedOrder._id,
        status: updatedOrder.status,
        paymentStatus: updatedOrder.payment.status,
      },
    });
  } catch (error) {
    console.error("Error updating order status:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to update order status",
    });
  }
};

const deleteOrder = async (req, res) => {
  try {
    const orderId = req.params.id;

    const order = await orderModel.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Check if order status allows deletion
    if (!["delivered", "cancelled"].includes(order.status)) {
      return res.status(400).json({
        success: false,
        message: "Only delivered or cancelled orders can be deleted",
      });
    }

    await orderModel.findByIdAndDelete(orderId);

    return res.status(200).json({
      success: true,
      message: "Order deleted successfully",
    });
  } catch (error) {
    console.error("Error in deleteOrder:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export {
  placeOrder,
  verifyOrderPayment,
  userOrders,
  listOrders,
  updateStatus,
  confirmWhatsAppPayment,
  deleteOrder,
  updatePaymentStatus,
};
