import mongoose from "mongoose";

const windowSchema = new mongoose.Schema(
    {
        label: { type: String, required: true, trim: true }, // e.g. "Breakfast"
        start: { type: String, required: true, match: /^([01]\d|2[0-3]):[0-5]\d$/ }, // "07:00" (24h, IST)
        end: { type: String, required: true, match: /^([01]\d|2[0-3]):[0-5]\d$|^24:00$/ }, // "11:30" or "24:00"
    },
    { _id: false }
);

// Single document holding tiffin ordering rules (key: "default")
const tiffinSettingsSchema = new mongoose.Schema(
    {
        key: { type: String, default: "default", unique: true },
        acceptingOrders: { type: Boolean, default: true }, // manual on/off switch
        orderingWindows: { type: [windowSchema], default: undefined },
        deliveryEnabled: { type: Boolean, default: true },
        pickupEnabled: { type: Boolean, default: true },
        deliveryFee: { type: Number, default: 40, min: 0 },
        minOrderAmount: { type: Number, default: 0, min: 0 },
        pickupAddress: { type: String, default: "Chanvi Farms, Rooftop, HSR Layout, 22nd Main Road, Bengaluru - 560102" },
        storeTimings: { type: String, default: "7:00 AM - 10:00 PM (All Days)" },
        produceTimings: { type: String, default: "6:00 AM - 10:00 PM (Wednesday, Saturday & Sunday)" },
        mapsUrl: { type: String, default: "" },
        reviewUrl: { type: String, default: "" },
    },
    { timestamps: true }
);

export const DEFAULT_WINDOWS = [
    { label: "Breakfast", start: "07:00", end: "11:30" },
    { label: "Dinner", start: "18:00", end: "24:00" },
];

export default mongoose.models.TiffinSettings || mongoose.model("TiffinSettings", tiffinSettingsSchema);
