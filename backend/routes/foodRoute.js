import express from "express";
import { addFood, listFood, deleteFood, updateFood } from "../controllers/foodController.js";
import multer from "multer"
import adminAuth from "../middleware/adminAuth.js"
import { imageUpload, isCloudinaryConfigured, handleUploadErrors } from "../utils/cloudinary.js"

const foodRouter = express.Router();

const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, "uploads/")
    },
    filename: function(req, file, cb) {
        cb(null, Date.now() + file.originalname)
    }
})

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: function(req, file, cb) {
        if (!file.mimetype.startsWith('image/')) {
            return cb(new Error('Only image files are allowed!'), false);
        }
        cb(null, true);
    }
})

// Cloudinary (memory upload) when configured, otherwise the old disk storage
const productImage = (req, res, next) => {
    const mw = isCloudinaryConfigured() ? imageUpload.single("image") : upload.single("image");
    mw(req, res, (err) => handleUploadErrors(err, req, res, next));
};

foodRouter.post("/add", adminAuth, productImage, addFood);
foodRouter.get("/list", listFood);
foodRouter.post("/delete", adminAuth, deleteFood);
foodRouter.post("/update", adminAuth, updateFood);

export default foodRouter;
