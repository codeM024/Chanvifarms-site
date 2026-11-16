import express from "express";
import authMiddleware from "../middleware/auth.js";
import adminAuth from "../middleware/adminAuth.js";
import {
    placeTiffinOrder, verifyTiffinPayment, markTiffinPaymentFailed, myTiffinOrders,
    adminListTiffinOrders, adminUpdateTiffinStatus, adminUpdateTiffinPayment,
    adminDeleteTiffinOrder, adminTiffinSummary,
} from "../controllers/tiffinOrderController.js";

const tiffinOrderRouter = express.Router();

// Customer
tiffinOrderRouter.post("/place", authMiddleware, placeTiffinOrder);
tiffinOrderRouter.post("/verify-payment", authMiddleware, verifyTiffinPayment);
tiffinOrderRouter.post("/payment-failed", authMiddleware, markTiffinPaymentFailed);
tiffinOrderRouter.get("/my", authMiddleware, myTiffinOrders);

// Admin
tiffinOrderRouter.get("/admin/list", adminAuth, adminListTiffinOrders);
tiffinOrderRouter.get("/admin/summary", adminAuth, adminTiffinSummary);
tiffinOrderRouter.put("/admin/:id/status", adminAuth, adminUpdateTiffinStatus);
tiffinOrderRouter.put("/admin/:id/payment", adminAuth, adminUpdateTiffinPayment);
tiffinOrderRouter.delete("/admin/:id", adminAuth, adminDeleteTiffinOrder);

export default tiffinOrderRouter;
