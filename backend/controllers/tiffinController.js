import mongoose from "mongoose";
import tiffinModel from "../models/tiffinModel.js";
import tiffinSettingsModel, { DEFAULT_WINDOWS } from "../models/tiffinSettingsModel.js";
import { uploadImage, deleteImage } from "../utils/cloudinary.js";
import { getOrderingStatus } from "../utils/tiffinHours.js";

export const getSettingsDoc = async () => {
    let settings = await tiffinSettingsModel.findOne({ key: "default" });
    if (!settings) settings = await tiffinSettingsModel.create({ key: "default", orderingWindows: DEFAULT_WINDOWS });
    if (!settings.orderingWindows?.length) {
        settings.orderingWindows = DEFAULT_WINDOWS;
        await settings.save();
    }
    return settings;
};

const publicSettings = (s) => ({
    deliveryEnabled: s.deliveryEnabled,
    pickupEnabled: s.pickupEnabled,
    deliveryFee: s.deliveryFee,
    minOrderAmount: s.minOrderAmount,
    pickupAddress: s.pickupAddress,
    storeTimings: s.storeTimings,
    produceTimings: s.produceTimings,
    mapsUrl: s.mapsUrl,
    reviewUrl: s.reviewUrl,
});

const toBool = (v) => v === true || v === "true" || v === "1" || v === 1;

// ---------- Public ----------

// GET /api/tiffin/menu -> available tiffins + ordering status + store info
export const getMenu = async (req, res) => {
    try {
        const [items, settings] = await Promise.all([
            tiffinModel.find({ isAvailable: true }).sort({ sortOrder: 1, createdAt: 1 }).select("-imagePublicId -__v").lean(),
            getSettingsDoc(),
        ]);
        res.json({
            success: true,
            data: items,
            ordering: getOrderingStatus(settings),
            settings: publicSettings(settings),
        });
    } catch (err) {
        console.error("getMenu error", err);
        res.status(500).json({ success: false, message: "Could not load the tiffin menu" });
    }
};

// GET /api/tiffin/status -> just the open/closed state (cheap, for polling)
export const getStatus = async (req, res) => {
    try {
        const settings = await getSettingsDoc();
        res.json({ success: true, ordering: getOrderingStatus(settings) });
    } catch (err) {
        res.status(500).json({ success: false, message: "Could not load ordering status" });
    }
};

// ---------- Admin ----------

// GET /api/tiffin/admin/list -> all tiffins including unavailable
export const adminList = async (req, res) => {
    try {
        const items = await tiffinModel.find().sort({ sortOrder: 1, createdAt: 1 }).lean();
        res.json({ success: true, data: items });
    } catch (err) {
        res.status(500).json({ success: false, message: "Could not load tiffins" });
    }
};

const parseTiffinFields = (body, { partial = false } = {}) => {
    const out = {};
    const errors = [];
    if (body.name !== undefined) out.name = String(body.name).trim();
    if (body.subtitle !== undefined) out.subtitle = String(body.subtitle).trim();
    if (body.description !== undefined) out.description = String(body.description).trim();
    if (body.price !== undefined) out.price = Number(body.price);
    if (body.isAvailable !== undefined) out.isAvailable = toBool(body.isAvailable);
    if (body.sortOrder !== undefined) out.sortOrder = Number(body.sortOrder) || 0;

    if (!partial && !out.name) errors.push("Name is required");
    if (out.name !== undefined && !out.name) errors.push("Name cannot be empty");
    if ((!partial || out.price !== undefined) && (!Number.isFinite(out.price) || out.price <= 0)) {
        errors.push("Price must be greater than 0");
    }
    return { fields: out, errors };
};

// POST /api/tiffin/admin/add (multipart: image + fields)
export const addTiffin = async (req, res) => {
    try {
        const { fields, errors } = parseTiffinFields(req.body);
        if (errors.length) return res.status(400).json({ success: false, message: errors.join(", ") });
        if (!req.file) return res.status(400).json({ success: false, message: "Please upload an image for the tiffin" });

        const exists = await tiffinModel.findOne({ name: { $regex: `^${fields.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, $options: "i" } });
        if (exists) return res.status(400).json({ success: false, message: "A tiffin with this name already exists" });

        const { url, publicId } = await uploadImage(req.file.buffer, "tiffins");
        if (fields.sortOrder === undefined) {
            const last = await tiffinModel.findOne().sort({ sortOrder: -1 }).select("sortOrder").lean();
            fields.sortOrder = (last?.sortOrder ?? 0) + 1;
        }
        const tiffin = await tiffinModel.create({ ...fields, image: url, imagePublicId: publicId });
        res.status(201).json({ success: true, message: "Tiffin added", data: tiffin });
    } catch (err) {
        console.error("addTiffin error", err);
        res.status(500).json({ success: false, message: err.message || "Could not add tiffin" });
    }
};

// PUT /api/tiffin/admin/:id (multipart, image optional)
export const updateTiffin = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ success: false, message: "Invalid tiffin id" });
        const tiffin = await tiffinModel.findById(id);
        if (!tiffin) return res.status(404).json({ success: false, message: "Tiffin not found" });

        const { fields, errors } = parseTiffinFields(req.body, { partial: true });
        if (errors.length) return res.status(400).json({ success: false, message: errors.join(", ") });

        if (req.file) {
            const { url, publicId } = await uploadImage(req.file.buffer, "tiffins");
            const oldPublicId = tiffin.imagePublicId;
            fields.image = url;
            fields.imagePublicId = publicId;
            fields.imageCredit = { author: "", license: "", sourceUrl: "" };
            await deleteImage(oldPublicId);
        }

        Object.assign(tiffin, fields);
        await tiffin.save();
        res.json({ success: true, message: "Tiffin updated", data: tiffin });
    } catch (err) {
        console.error("updateTiffin error", err);
        res.status(500).json({ success: false, message: err.message || "Could not update tiffin" });
    }
};

// DELETE /api/tiffin/admin/:id
export const deleteTiffin = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ success: false, message: "Invalid tiffin id" });
        const tiffin = await tiffinModel.findByIdAndDelete(id);
        if (!tiffin) return res.status(404).json({ success: false, message: "Tiffin not found" });
        await deleteImage(tiffin.imagePublicId);
        res.json({ success: true, message: "Tiffin deleted" });
    } catch (err) {
        res.status(500).json({ success: false, message: "Could not delete tiffin" });
    }
};

// PUT /api/tiffin/admin/reorder  { order: [id1, id2, ...] }
export const reorderTiffins = async (req, res) => {
    try {
        const order = Array.isArray(req.body?.order) ? req.body.order : [];
        if (!order.every((id) => mongoose.Types.ObjectId.isValid(id))) {
            return res.status(400).json({ success: false, message: "Invalid tiffin ids" });
        }
        await tiffinModel.bulkWrite(order.map((id, i) => ({ updateOne: { filter: { _id: id }, update: { sortOrder: i + 1 } } })));
        res.json({ success: true, message: "Menu order saved" });
    } catch (err) {
        res.status(500).json({ success: false, message: "Could not save menu order" });
    }
};

// GET /api/tiffin/admin/settings
export const getSettings = async (req, res) => {
    try {
        const settings = await getSettingsDoc();
        res.json({ success: true, data: settings, ordering: getOrderingStatus(settings) });
    } catch (err) {
        res.status(500).json({ success: false, message: "Could not load tiffin settings" });
    }
};

// PUT /api/tiffin/admin/settings
export const updateSettings = async (req, res) => {
    try {
        const settings = await getSettingsDoc();
        const b = req.body || {};
        const allowed = ["acceptingOrders", "deliveryEnabled", "pickupEnabled", "deliveryFee", "minOrderAmount",
            "pickupAddress", "storeTimings", "produceTimings", "mapsUrl", "reviewUrl", "orderingWindows"];
        for (const key of allowed) if (b[key] !== undefined) settings[key] = b[key];

        if (!settings.deliveryEnabled && !settings.pickupEnabled) {
            return res.status(400).json({ success: false, message: "Enable at least one of delivery or pickup" });
        }
        if (Array.isArray(b.orderingWindows)) {
            const bad = b.orderingWindows.find((w) => !w.label || !w.start || !w.end || w.start >= w.end);
            if (bad) return res.status(400).json({ success: false, message: "Each ordering window needs a label and a start time before its end time (use 24:00 for midnight)" });
        }
        await settings.save();
        res.json({ success: true, message: "Settings saved", data: settings, ordering: getOrderingStatus(settings) });
    } catch (err) {
        const msg = err.name === "ValidationError" ? "Times must be in HH:MM 24-hour format (e.g. 07:00, 18:30, 24:00)" : "Could not save settings";
        res.status(err.name === "ValidationError" ? 400 : 500).json({ success: false, message: msg });
    }
};
