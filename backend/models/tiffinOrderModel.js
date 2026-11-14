import mongoose from "mongoose";

export const TIFFIN_ORDER_STATUSES = [
    "pending",          // created, waiting for online/WhatsApp payment
    "confirmed",
    "preparing",
    "ready",            // ready for pickup / dispatch
    "out-for-delivery",
    "delivered",
    "picked-up",
    "cancelled",
    "payment_failed",
];

const tiffinOrderSchema = new mongoose.Schema(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        orderNumber: { type: String, index: true }, // short human id, e.g. "T-4F2A9C"
        items: [
            {
                tiffinId: { type: mongoose.Schema.Types.ObjectId, ref: "Tiffin" },
                name: String,
                subtitle: String,
                price: Number, // unit price at time of order (from DB, never from client)
                quantity: Number,
                image: String,
            },
        ],
        subtotal: { type: Number, required: true },
        deliveryFee: { type: Number, default: 0 },
        amount: { type: Number, required: true },
        fulfilment: { type: String, enum: ["delivery", "pickup"], required: true },
        slot: { type: String, default: "" }, // ordering window label, e.g. "Breakfast"
        contact: {
            name: String,
            phone: String,
            email: String,
        },
        address: {
            firstName: String,
            lastName: String,
            street: String,
            city: String,
            state: String,
            country: String,
            zipcode: String,
            phone: String,
            email: String,
            location: { latitude: Number, longitude: Number, address: String },
        },
        notes: { type: String, default: "", maxlength: 500 },
        payment: {
            method: { type: String, enum: ["COD", "Online", "WHATSAPP_PAY"], required: true },
            status: {
                type: String,
                enum: ["pending", "completed", "failed", "awaiting_confirmation"],
                default: "pending",
            },
            razorpayOrderId: String,
            transactionId: String,
        },
        status: { type: String, enum: TIFFIN_ORDER_STATUSES, default: "pending" },
        cancelReason: { type: String, default: "" },
    },
    { timestamps: true }
);

tiffinOrderSchema.index({ userId: 1, createdAt: -1 });
tiffinOrderSchema.index({ status: 1, createdAt: -1 });

export default mongoose.models.TiffinOrder || mongoose.model("TiffinOrder", tiffinOrderSchema);
