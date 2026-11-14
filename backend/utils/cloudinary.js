import { v2 as cloudinary } from "cloudinary";
import multer from "multer";

// Configured from CLOUDINARY_CLOUD_NAME / CLOUDINARY_API_KEY / CLOUDINARY_API_SECRET
let configured = false;
export const isCloudinaryConfigured = () => {
    const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env;
    if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) return false;
    if (!configured) {
        cloudinary.config({
            cloud_name: CLOUDINARY_CLOUD_NAME,
            api_key: CLOUDINARY_API_KEY,
            api_secret: CLOUDINARY_API_SECRET,
            secure: true,
        });
        configured = true;
    }
    return true;
};

const ROOT_FOLDER = process.env.CLOUDINARY_FOLDER || "chanvifarms";

// Keep uploads in memory; they go straight to Cloudinary
export const imageUpload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (!file.mimetype.startsWith("image/")) return cb(new Error("Only image files are allowed!"), false);
        cb(null, true);
    },
});

/**
 * Upload an image buffer. Cloudinary resizes to max 1200px and serves
 * auto format/quality (WebP/AVIF) from the returned URL.
 * @returns {Promise<{url: string, publicId: string}>}
 */
export const uploadImage = (buffer, subfolder) => {
    if (!isCloudinaryConfigured()) {
        return Promise.reject(new Error("Image storage is not configured (CLOUDINARY_* env vars missing)"));
    }
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            {
                folder: `${ROOT_FOLDER}/${subfolder}`,
                resource_type: "image",
                transformation: [{ width: 1200, height: 1200, crop: "limit" }],
            },
            (error, result) => {
                if (error) return reject(error);
                // f_auto,q_auto: modern format + smart compression on delivery
                const url = result.secure_url.replace("/upload/", "/upload/f_auto,q_auto/");
                resolve({ url, publicId: result.public_id });
            }
        );
        stream.end(buffer);
    });
};

export const deleteImage = async (publicId) => {
    if (!publicId || !isCloudinaryConfigured()) return;
    try {
        await cloudinary.uploader.destroy(publicId);
    } catch (err) {
        console.error("Cloudinary delete failed:", publicId, err.message);
    }
};

// Multer/Cloudinary errors -> clean 400 instead of the generic 500 handler
export const handleUploadErrors = (err, req, res, next) => {
    if (err) {
        return res.status(400).json({ success: false, message: err.message || "Image upload failed" });
    }
    next();
};
