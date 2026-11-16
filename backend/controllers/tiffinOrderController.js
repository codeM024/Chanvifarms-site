import mongoose from "mongoose";
import crypto from "crypto";
import Razorpay from "razorpay";
import tiffinModel from "../models/tiffinModel.js";
import tiffinOrderModel, { TIFFIN_ORDER_STATUSES } from "../models/tiffinOrderModel.js";
import userModel from "../models/userModel.js";
import { getSettingsDoc } from "./tiffinController.js";
import { getOrderingStatus } from "../utils/tiffinHours.js";

let razorpay = null;
const getRazorpay = () => {
    if (!razorpay && process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
        razorpay = new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_KEY_SECRET });
    }
    return razorpay;
};

const WHATSAPP_NUMBER = process.env.STORE_WHATSAPP_NUMBER || "917899940804";
const round2 = (n) => Math.round(n * 100) / 100;
const shortId = (id) => `T-${id.toString().slice(-6).toUpperCase()}`;

// Statuses an admin may move an order to, per fulfilment type
const NEXT_STATUSES = {
    pending: ["confirmed", "cancelled"],
    confirmed: ["preparing", "cancelled"],
    preparing: ["ready", "cancelled"],
    ready: { delivery: ["out-for-delivery", "cancelled"], pickup: ["picked-up", "cancelled"] },
    "out-for-delivery": ["delivered"],
    payment_failed: ["cancelled"],
};
export const allowedNextStatuses = (order) => {
    const next = NEXT_STATUSES[order.status];
    if (!next) return [];
    return Array.isArray(next) ? next : next[order.fulfilment] || [];
};

/**
 * POST /api/tiffin-order/place (customer)
 * body: { items: [{ tiffinId, quantity }], fulfilment: "delivery"|"pickup",
 *         address?: {...}, contact?: { name, phone }, notes?, paymentMethod: "COD"|"Online"|"WHATSAPP_PAY" }
 * Prices are always taken from the database, never from the client.
 */
export const placeTiffinOrder = async (req, res) => {
    try {
        const { items, fulfilment, address, contact, notes, paymentMethod } = req.body || {};
        const settings = await getSettingsDoc();
        const ordering = getOrderingStatus(settings);
        if (!ordering.isOpen) return res.status(403).json({ success: false, closed: true, message: ordering.message, ordering });

        if (!Array.isArray(items) || items.length === 0) return res.status(400).json({ success: false, message: "Your tiffin cart is empty" });
        if (!["delivery", "pickup"].includes(fulfilment)) return res.status(400).json({ success: false, message: "Choose delivery or pickup" });
        if (fulfilment === "delivery" && !settings.deliveryEnabled) return res.status(400).json({ success: false, message: "Delivery is not available right now" });
        if (fulfilment === "pickup" && !settings.pickupEnabled) return res.status(400).json({ success: false, message: "Pickup is not available right now" });
        if (!["COD", "Online", "WHATSAPP_PAY"].includes(paymentMethod)) return res.status(400).json({ success: false, message: "Choose a payment method" });

        // Merge duplicate lines and validate quantities
        const qtyById = new Map();
        for (const it of items) {
            const qty = Math.floor(Number(it?.quantity));
            if (!mongoose.Types.ObjectId.isValid(it?.tiffinId) || !(qty > 0) || qty > 50) {
                return res.status(400).json({ success: false, message: "Invalid item in cart" });
            }
            qtyById.set(String(it.tiffinId), (qtyById.get(String(it.tiffinId)) || 0) + qty);
        }

        const tiffins = await tiffinModel.find({ _id: { $in: [...qtyById.keys()] } }).lean();
        const unavailable = [...qtyById.keys()].filter((id) => !tiffins.find((t) => String(t._id) === id && t.isAvailable));
        if (unavailable.length) {
            return res.status(409).json({ success: false, unavailable, message: "Some items are no longer available. Please review your cart." });
        }

        const orderItems = tiffins.map((t) => ({
            tiffinId: t._id, name: t.name, subtitle: t.subtitle, price: t.price,
            quantity: qtyById.get(String(t._id)), image: t.image,
        }));
        const subtotal = round2(orderItems.reduce((s, i) => s + i.price * i.quantity, 0));
        if (settings.minOrderAmount && subtotal < settings.minOrderAmount) {
            return res.status(400).json({ success: false, message: `Minimum tiffin order is ₹${settings.minOrderAmount}` });
        }
        const deliveryFee = fulfilment === "delivery" ? settings.deliveryFee : 0;
        const amount = round2(subtotal + deliveryFee);

        const user = await userModel.findById(req.userId).lean();
        if (!user) return res.status(404).json({ success: false, message: "User not found" });

        let orderAddress;
        let orderContact;
        if (fulfilment === "delivery") {
            if (!address?.firstName || !address?.phone || !address?.street) {
                return res.status(400).json({ success: false, message: "Please choose a complete delivery address" });
            }
            orderAddress = { ...address, phone: String(address.phone).replace(/\D/g, "") };
            orderContact = { name: `${address.firstName} ${address.lastName || ""}`.trim(), phone: orderAddress.phone, email: address.email || user.email };
        } else {
            const phone = String(contact?.phone || user.phone || "").replace(/\D/g, "");
            const name = String(contact?.name || user.name || "").trim();
            if (!name || phone.length < 10) return res.status(400).json({ success: false, message: "Please enter your name and a 10-digit phone number for pickup" });
            orderContact = { name, phone, email: user.email };
        }

        const order = new tiffinOrderModel({
            userId: req.userId,
            items: orderItems,
            subtotal, deliveryFee, amount, fulfilment,
            slot: ordering.currentWindow,
            contact: orderContact,
            address: orderAddress,
            notes: String(notes || "").slice(0, 500),
            payment: { method: paymentMethod, status: paymentMethod === "COD" ? "pending" : paymentMethod === "WHATSAPP_PAY" ? "awaiting_confirmation" : "pending" },
            status: paymentMethod === "COD" ? "confirmed" : "pending",
        });
        order.orderNumber = shortId(order._id);
        await order.save();

        if (paymentMethod === "COD") {
            return res.json({ success: true, message: "Tiffin order placed!", orderId: order._id, orderNumber: order.orderNumber });
        }

        if (paymentMethod === "WHATSAPP_PAY") {
            const lines = orderItems.map((i, n) => `${n + 1}. ${i.name} × ${i.quantity} = ₹${(i.price * i.quantity).toFixed(2)}`).join("\n");
            const where = fulfilment === "delivery"
                ? `📍 *Delivery:*\n${orderAddress.street}\n${orderAddress.city || ""} ${orderAddress.zipcode || ""}`
                : `🏪 *Pickup:* ${settings.pickupAddress}`;
            const msg = `*Tiffin Order ${order.orderNumber}*\n\n💰 *Total: ₹${amount.toFixed(2)}*\n\n📋 *Items:*\n${lines}\n` +
                (deliveryFee ? `Delivery fee: ₹${deliveryFee}\n` : "") +
                `\n👤 ${orderContact.name} (${orderContact.phone})\n${where}\n\nPlease share the UPI payment for this order.`;
            return res.json({
                success: true, message: "Order placed. Complete payment on WhatsApp.",
                orderId: order._id, orderNumber: order.orderNumber,
                whatsappUrl: `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`,
            });
        }

        // Online (Razorpay)
        const rp = getRazorpay();
        if (!rp) {
            order.status = "payment_failed";
            order.payment.status = "failed";
            await order.save();
            return res.status(503).json({ success: false, message: "Online payment is unavailable right now. Please choose another method." });
        }
        const rpOrder = await rp.orders.create({
            amount: Math.round(amount * 100),
            currency: "INR",
            receipt: `tiffin_${order._id}`,
            notes: { tiffinOrderId: String(order._id), orderNumber: order.orderNumber },
        });
        order.payment.razorpayOrderId = rpOrder.id;
        await order.save();
        return res.json({
            success: true, orderId: order._id, orderNumber: order.orderNumber,
            razorpay: { key: process.env.RAZORPAY_KEY_ID, orderId: rpOrder.id, amount: rpOrder.amount, currency: rpOrder.currency },
        });
    } catch (err) {
        console.error("placeTiffinOrder error", err);
        res.status(500).json({ success: false, message: "Could not place the tiffin order" });
    }
};

// POST /api/tiffin-order/verify-payment (customer) { orderId, razorpay_order_id, razorpay_payment_id, razorpay_signature }
export const verifyTiffinPayment = async (req, res) => {
    try {
        const { orderId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body || {};
        if (!mongoose.Types.ObjectId.isValid(orderId) || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            return res.status(400).json({ success: false, message: "Missing payment details" });
        }
        const order = await tiffinOrderModel.findById(orderId);
        if (!order || String(order.userId) !== String(req.userId)) return res.status(404).json({ success: false, message: "Order not found" });
        if (order.payment.status === "completed") return res.json({ success: true, message: "Payment already verified" });
        if (order.payment.razorpayOrderId !== razorpay_order_id) return res.status(400).json({ success: false, message: "Payment does not match this order" });

        const expected = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || "")
            .update(`${razorpay_order_id}|${razorpay_payment_id}`).digest("hex");
        const valid = expected.length === razorpay_signature.length &&
            crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(razorpay_signature));

        if (!valid) {
            order.payment.status = "failed";
            order.status = "payment_failed";
            await order.save();
            return res.status(400).json({ success: false, message: "Payment verification failed" });
        }
        order.payment.status = "completed";
        order.payment.transactionId = razorpay_payment_id;
        order.status = "confirmed";
        await order.save();
        res.json({ success: true, message: "Payment successful", orderNumber: order.orderNumber });
    } catch (err) {
        console.error("verifyTiffinPayment error", err);
        res.status(500).json({ success: false, message: "Payment verification failed" });
    }
};

// POST /api/tiffin-order/payment-failed (customer) { orderId } - user closed/failed Razorpay
export const markTiffinPaymentFailed = async (req, res) => {
    try {
        const { orderId } = req.body || {};
        if (!mongoose.Types.ObjectId.isValid(orderId)) return res.status(400).json({ success: false, message: "Invalid order" });
        const order = await tiffinOrderModel.findOne({ _id: orderId, userId: req.userId });
        if (!order) return res.status(404).json({ success: false, message: "Order not found" });
        if (order.payment.method === "Online" && order.payment.status === "pending") {
            order.payment.status = "failed";
            order.status = "payment_failed";
            await order.save();
        }
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, message: "Could not update order" });
    }
};

// GET /api/tiffin-order/my (customer)
export const myTiffinOrders = async (req, res) => {
    try {
        const orders = await tiffinOrderModel.find({ userId: req.userId }).sort({ createdAt: -1 }).limit(50).lean();
        res.json({ success: true, data: orders });
    } catch (err) {
        res.status(500).json({ success: false, message: "Could not load your tiffin orders" });
    }
};

// GET /api/tiffin-order/admin/list?status=&fulfilment=&slot=&date=YYYY-MM-DD&search=
export const adminListTiffinOrders = async (req, res) => {
    try {
        const { status, fulfilment, slot, date, search } = req.query;
        const q = {};
        if (status && status !== "all") q.status = status;
        if (fulfilment && fulfilment !== "all") q.fulfilment = fulfilment;
        if (slot && slot !== "all") q.slot = slot;
        if (date) {
            // date is an IST calendar day
            const start = new Date(`${date}T00:00:00+05:30`);
            if (!isNaN(start)) q.createdAt = { $gte: start, $lt: new Date(start.getTime() + 86400000) };
        }
        if (search) {
            const s = String(search).trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
            q.$or = [{ orderNumber: { $regex: s, $options: "i" } }, { "contact.name": { $regex: s, $options: "i" } }, { "contact.phone": { $regex: s } }];
        }
        const orders = await tiffinOrderModel.find(q).sort({ createdAt: -1 }).limit(500).lean();
        res.json({
            success: true,
            data: orders.map((o) => ({ ...o, allowedNextStatuses: allowedNextStatuses(o) })),
            statuses: TIFFIN_ORDER_STATUSES,
        });
    } catch (err) {
        console.error("adminListTiffinOrders error", err);
        res.status(500).json({ success: false, message: "Could not load tiffin orders" });
    }
};

// PUT /api/tiffin-order/admin/:id/status { status, reason? }
export const adminUpdateTiffinStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, reason } = req.body || {};
        if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ success: false, message: "Invalid order id" });
        const order = await tiffinOrderModel.findById(id);
        if (!order) return res.status(404).json({ success: false, message: "Order not found" });
        if (!allowedNextStatuses(order).includes(status)) {
            return res.status(400).json({ success: false, message: `Cannot change status from ${order.status} to ${status}` });
        }
        if (status === "cancelled") {
            if (!reason?.trim()) return res.status(400).json({ success: false, message: "Please give a cancellation reason" });
            order.cancelReason = reason.trim();
        }
        order.status = status;
        // Cash is collected on handover
        if ((status === "delivered" || status === "picked-up") && order.payment.method === "COD") order.payment.status = "completed";
        await order.save();
        const out = order.toObject();
        res.json({ success: true, message: "Order updated", data: { ...out, allowedNextStatuses: allowedNextStatuses(out) } });
    } catch (err) {
        res.status(500).json({ success: false, message: "Could not update order" });
    }
};

// PUT /api/tiffin-order/admin/:id/payment { status: "completed"|"failed" } - e.g. confirm WhatsApp payment received
export const adminUpdateTiffinPayment = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body || {};
        if (!["completed", "failed"].includes(status)) return res.status(400).json({ success: false, message: "Invalid payment status" });
        const order = await tiffinOrderModel.findById(id);
        if (!order) return res.status(404).json({ success: false, message: "Order not found" });
        order.payment.status = status;
        if (status === "completed" && order.status === "pending") order.status = "confirmed";
        if (status === "failed" && order.status === "pending") order.status = "payment_failed";
        await order.save();
        const out = order.toObject();
        res.json({ success: true, message: "Payment updated", data: { ...out, allowedNextStatuses: allowedNextStatuses(out) } });
    } catch (err) {
        res.status(500).json({ success: false, message: "Could not update payment" });
    }
};

// DELETE /api/tiffin-order/admin/:id - only finished orders
export const adminDeleteTiffinOrder = async (req, res) => {
    try {
        const order = await tiffinOrderModel.findById(req.params.id);
        if (!order) return res.status(404).json({ success: false, message: "Order not found" });
        if (!["delivered", "picked-up", "cancelled", "payment_failed"].includes(order.status)) {
            return res.status(400).json({ success: false, message: "Only completed or cancelled orders can be deleted" });
        }
        await order.deleteOne();
        res.json({ success: true, message: "Order deleted" });
    } catch (err) {
        res.status(500).json({ success: false, message: "Could not delete order" });
    }
};

// GET /api/tiffin-order/admin/summary -> today's counts for the dashboard header
export const adminTiffinSummary = async (req, res) => {
    try {
        const now = new Date();
        const istDate = new Date(now.getTime() + 330 * 60000).toISOString().slice(0, 10);
        const start = new Date(`${istDate}T00:00:00+05:30`);
        const [agg] = await tiffinOrderModel.aggregate([
            { $match: { createdAt: { $gte: start } } },
            {
                $group: {
                    _id: null,
                    total: { $sum: 1 },
                    active: { $sum: { $cond: [{ $in: ["$status", ["confirmed", "preparing", "ready", "out-for-delivery"]] }, 1, 0] } },
                    pending: { $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] } },
                    revenue: { $sum: { $cond: [{ $in: ["$status", ["cancelled", "payment_failed"]] }, 0, "$amount"] } },
                },
            },
        ]);
        res.json({ success: true, data: { date: istDate, total: 0, active: 0, pending: 0, revenue: 0, ...(agg || {}), _id: undefined } });
    } catch (err) {
        res.status(500).json({ success: false, message: "Could not load summary" });
    }
};
