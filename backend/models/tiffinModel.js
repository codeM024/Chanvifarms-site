import mongoose from "mongoose";

const tiffinSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true },
        // Second line on the menu card, e.g. "Rajmaid Rice Dosa"
        subtitle: { type: String, trim: true, default: "" },
        description: { type: String, trim: true, default: "" },
        price: { type: Number, required: true, min: 0 },
        image: { type: String, default: "" }, // Cloudinary URL
        imagePublicId: { type: String, default: "" },
        // Attribution for openly licensed stock photos; cleared when admin uploads their own image
        imageCredit: {
            author: { type: String, default: "" },
            license: { type: String, default: "" },
            sourceUrl: { type: String, default: "" },
        },
        isAvailable: { type: Boolean, default: true },
        sortOrder: { type: Number, default: 0 },
    },
    { timestamps: true }
);

tiffinSchema.index({ sortOrder: 1, createdAt: 1 });

export default mongoose.models.Tiffin || mongoose.model("Tiffin", tiffinSchema);
