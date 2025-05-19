import orderModel from "../models/orderModel.js";
import userModel from "../models/userModel.js";
import Razorpay from "razorpay";
import crypto from 'crypto';

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});

const placeOrder = async (req, res) => {
    try {
        const { items, amount, address, payment } = req.body;
        
        // Create new order
        const newOrder = new orderModel({
            userId: req.userId,
            items,
            amount,
            address,
            payment: {
                method: payment.method,
                status: payment.method === 'COD' ? 'pending' : 'initiated'
            },
            status: payment.method === 'COD' ? 'confirmed' : 'awaiting_payment'
        });
        
        await newOrder.save();

        // For COD orders, return success directly
        if (payment.method === 'COD') {
            await clearUserCart(req.userId);
            return res.json({
                success: true,
                message: "Order placed successfully",
                orderId: newOrder._id
            });
        }

        // For online payments, create Razorpay order
        const razorpayOrder = await razorpay.orders.create({
            amount: Math.round(amount * 100), // Convert to paise
            currency: "INR",
            receipt: newOrder._id.toString()
        });

        // Update order with Razorpay order ID
        await orderModel.findByIdAndUpdate(newOrder._id, {
            'payment.razorpayOrderId': razorpayOrder.id
        });

        res.json({
            success: true,
            orderId: newOrder._id,
            paymentDetails: {
                orderId: razorpayOrder.id,
                amount: razorpayOrder.amount,
                currency: razorpayOrder.currency
            }
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
const updateStatus = async (req,res) =>{
   try{
       await orderModel.findByIdAndUpdate(req.body.orderId,{status:req.body.status})
       res.json({success:true,message:"Status Updated"})
   }catch(error){
       console.log(error);
       res.json({success:false,message:"Error"})
   }
}

export { placeOrder, verifyOrderPayment, userOrders, listOrders, updateStatus }
