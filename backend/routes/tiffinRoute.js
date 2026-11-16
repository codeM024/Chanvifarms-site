import express from "express";
import adminAuth from "../middleware/adminAuth.js";
import { imageUpload, handleUploadErrors } from "../utils/cloudinary.js";
import {
    getMenu, getStatus, adminList, addTiffin, updateTiffin, deleteTiffin,
    reorderTiffins, getSettings, updateSettings,
} from "../controllers/tiffinController.js";

const tiffinRouter = express.Router();
const singleImage = (req, res, next) => imageUpload.single("image")(req, res, (err) => handleUploadErrors(err, req, res, next));

// Public
tiffinRouter.get("/menu", getMenu);
tiffinRouter.get("/status", getStatus);

// Admin
tiffinRouter.get("/admin/list", adminAuth, adminList);
tiffinRouter.get("/admin/settings", adminAuth, getSettings);
tiffinRouter.put("/admin/settings", adminAuth, updateSettings);
tiffinRouter.put("/admin/reorder", adminAuth, reorderTiffins);
tiffinRouter.post("/admin/add", adminAuth, singleImage, addTiffin);
tiffinRouter.put("/admin/:id", adminAuth, singleImage, updateTiffin);
tiffinRouter.delete("/admin/:id", adminAuth, deleteTiffin);

export default tiffinRouter;
