import express from "express"
import authMiddleware from "../middleware/auth.js"
import { 
    listOrders, 
    placeOrder, 
    updateStatus, 
    userOrders, 
    verifyOrderPayment, 
    confirmWhatsAppPayment, 
    deleteOrder,
    updatePaymentStatus 
} from "../controllers/orderController.js"

const orderRouter = express.Router();

// Order placement and management
orderRouter.post("/place", authMiddleware, placeOrder);
orderRouter.post("/verify-payment", authMiddleware, verifyOrderPayment);
orderRouter.post("/userorders", authMiddleware, userOrders);

// Admin routes
orderRouter.get('/list', listOrders);
orderRouter.post('/status', updateStatus);
orderRouter.delete('/delete/:id', deleteOrder);

// Payment management
orderRouter.post('/confirm-whatsapp-payment', authMiddleware, confirmWhatsAppPayment);
orderRouter.post('/update-payment-status', updatePaymentStatus); // For admin use

export default orderRouter;