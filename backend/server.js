import 'dotenv/config.js'
import express from "express";
import cors from "cors";
import { connectDB } from "./config/db.js";
import foodRouter from "./routes/foodRoute.js";
import userRouter from "./routes/userRoute.js";
import cartRouter from "./routes/cartRoute.js";
import orderRouter from "./routes/orderRoute.js";
import boxRouter from "./routes/boxRoute.js";
import Razorpay from 'razorpay';
import crypto from 'crypto';
import Order from './models/orderModel.js';

// Initialize Razorpay
let razorpay;
try {
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
        console.error("Razorpay credentials are missing in environment variables");
    } else {
        razorpay = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID,
            key_secret: process.env.RAZORPAY_KEY_SECRET
        });
        console.log("Razorpay initialized successfully");
    }
} catch (error) {
    console.error("Failed to initialize Razorpay:", error);
}

// Validate required environment variables for core runtime
// Razorpay keys are optional for local development; log a warning if missing but don't exit.
const requiredEnvVars = [
    'MONGODB_URI',
    'JWT_SECRET'
];

const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
if (missingEnvVars.length > 0) {
    console.error('Error: Missing required environment variables:', missingEnvVars.join(', '));
    process.exit(1);
}

if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    console.warn('Warning: Razorpay credentials are missing. Payment endpoints will be disabled in this environment.');
}

//app config
const app = express()
const port = process.env.PORT || 4000

// Serve static files from uploads directory
app.use('/images', express.static('uploads'))

// middleware 
app.use(express.json())
const corsOptions = {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'token', 'admin-email'],
    optionsSuccessStatus: 204
}
app.use(cors(corsOptions))

// quick response for OPTIONS preflight requests
app.use((req, res, next) => {
    if (req.method === 'OPTIONS') return res.sendStatus(204)
    next()
})
//DB connection
connectDB().catch(err => {
    console.error('Failed to connect to database:', err);
    process.exit(1);
});

// Request validation middleware
const validateRequest = (req, res, next) => {
    // Validate order placement requests
    if (req.path === '/api/order/place' && req.method === 'POST') {
        const { items, amount, address, payment } = req.body;
        
        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Order must contain at least one item"
            });
        }
        
        if (!amount || amount <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid order amount"
            });
        }
        
        if (!address || !address.firstName || !address.phone || !address.street) {
            return res.status(400).json({
                success: false,
                message: "Missing required address fields"
            });
        }
        
        if (!payment?.method || !['COD', 'Online', 'WHATSAPP_PAY'].includes(payment.method)) {
            return res.status(400).json({
                success: false,
                message: "Invalid payment method. Please select a valid payment option."
            });
        }
    }
    
    next();
};

app.use(validateRequest);

// Razorpay order creation endpoint
app.post('/api/order/create', async (req, res) => {
    try {
        if (!razorpay) {
            return res.status(503).json({
                success: false,
                message: 'Payment service is currently unavailable'
            });
        }

        const { amount } = req.body;
        if (!amount || amount <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid amount'
            });
        }

        const options = {
            amount: amount * 100, // Razorpay expects amount in paise
            currency: 'INR',
            receipt: 'order_' + Date.now(),
        };

        const order = await razorpay.orders.create(options);
        res.json({
            success: true,
            data: {
                order_id: order.id,
                currency: order.currency,
                amount: order.amount,
                key_id: process.env.RAZORPAY_KEY_ID
            }
        });
    } catch (error) {
        console.error('Razorpay order creation error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create payment order',
            error: error.message
        });
    }
});

// Payment verification endpoint
app.post('/api/order/verify-payment', async (req, res) => {
    try {
        const {
            orderId,
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature
        } = req.body;

        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Order not found"
            });
        }

        // Verify signature
        const generated_signature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(razorpay_order_id + "|" + razorpay_payment_id)
            .digest('hex');

        if (generated_signature === razorpay_signature) {
            // Update order status
            await Order.findByIdAndUpdate(orderId, {
                'payment.status': 'completed',
                'payment.transactionId': razorpay_payment_id,
                'payment.razorpayOrderId': razorpay_order_id,
                status: 'confirmed'
            });

            res.json({
                success: true,
                message: 'Payment verified successfully'
            });
        } else {
            // Update order status to failed if verification fails
            await Order.findByIdAndUpdate(orderId, {
                'payment.status': 'failed',
                status: 'payment_failed'
            });
            
            res.status(400).json({
                success: false,
                message: 'Invalid payment signature'
            });
        }
    } catch (error) {
        console.error('Payment verification error:', error);
        res.status(500).json({
            success: false,
            message: 'Payment verification failed'
        });
    }
});

//api endpoints
app.use('/api/food', foodRouter)
app.use('/images', express.static('uploads'))
app.use('/api/user', userRouter)
app.use("/api/cart", cartRouter)
app.use("/api/order", orderRouter)
app.use('/api/box', boxRouter)

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        message: 'Something went wrong! Please try again later.'
    });
});

app.get("/", (req, res) => {
    res.send("API Working")
})

app.listen(port, () => {
    console.log(`server started on https://chanvifarms-site-backend.onrender.com`)
})

