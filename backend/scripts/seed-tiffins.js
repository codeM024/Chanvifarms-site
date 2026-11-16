// Loads the tiffin menu from the Chanvi Farms poster into MongoDB and uploads dish photos to Cloudinary.
// Safe to re-run: existing tiffins (matched by name) are left untouched unless they have no image.
// Usage: npm run seed-tiffins
import "dotenv/config.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { connectDB } from "../config/db.js";
import mongoose from "mongoose";
import tiffinModel from "../models/tiffinModel.js";
import { getSettingsDoc } from "../controllers/tiffinController.js";
import { uploadImage, isCloudinaryConfigured } from "../utils/cloudinary.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const IMAGES = path.join(__dirname, "..", "seed", "tiffin-images");
// credits.json: { "<file>": { author, license, sourceUrl } } for openly licensed photos
const CREDITS_FILE = path.join(IMAGES, "credits.json");
const CREDITS = fs.existsSync(CREDITS_FILE) ? JSON.parse(fs.readFileSync(CREDITS_FILE, "utf8")) : {};

const MENU = [
    { name: "White Rice Dosa", subtitle: "Rajmaid Rice Dosa", price: 80, file: "white-rice-dosa" },
    { name: "Red Rice Dosa", subtitle: "Navara Rice Dosa", price: 80, file: "red-rice-dosa" },
    { name: "Black Rice Dosa", subtitle: "Kaala Bhatt Rice Dosa", price: 100, file: "black-rice-dosa" },
    { name: "Millet Pongal", subtitle: "", price: 110, file: "millet-pongal" },
    { name: "Idli", subtitle: "2 pcs", price: 50, file: "idli" },
    { name: "Ragi Idli", subtitle: "2 pcs", price: 60, file: "ragi-idli" },
    { name: "Pesarattu", subtitle: "", price: 110, file: "pesarattu" },
    { name: "Vada", subtitle: "2 pcs", price: 50, file: "vada" },
    { name: "Red Rice Masala Dosa", subtitle: "", price: 100, file: "red-rice-masala-dosa" },
    { name: "Masala Dosa", subtitle: "", price: 100, file: "masala-dosa" },
    { name: "White Rice Karam Dosa", subtitle: "", price: 90, file: "white-rice-karam-dosa" },
    { name: "Idli Vada", subtitle: "", price: 75, file: "idli-vada" },
    { name: "Whole Wheat Poori", subtitle: "3 pcs", price: 90, file: "whole-wheat-poori" },
];

const run = async () => {
    if (!isCloudinaryConfigured()) {
        console.error("Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET in backend/.env first.");
        process.exit(1);
    }
    await connectDB();
    await getSettingsDoc(); // creates default ordering windows if missing

    let created = 0, imaged = 0, skipped = 0;
    for (const [i, item] of MENU.entries()) {
        // Case-insensitive match so "masala Dosa" added in the admin panel counts as "Masala Dosa"
        const existing = await tiffinModel.findOne({ name: item.name }).collation({ locale: "en", strength: 2 });
        if (existing && existing.image) { skipped++; continue; }

        const buffer = fs.readFileSync(path.join(IMAGES, `${item.file}.webp`));
        const { url, publicId } = await uploadImage(buffer, "tiffins");

        const imageCredit = CREDITS[item.file] || { author: "", license: "", sourceUrl: "" };
        if (existing) {
            existing.image = url;
            existing.imagePublicId = publicId;
            existing.imageCredit = imageCredit;
            await existing.save();
            imaged++;
        } else {
            await tiffinModel.create({
                name: item.name, subtitle: item.subtitle, price: item.price,
                image: url, imagePublicId: publicId, imageCredit, isAvailable: true, sortOrder: i + 1,
            });
            created++;
        }
        console.log(`  ✓ ${item.name}`);
    }
    console.log(`Done: ${created} created, ${imaged} images added, ${skipped} already present.`);
    await mongoose.disconnect();
};

run().catch(async (err) => {
    console.error("Seeding failed:", err.message);
    await mongoose.disconnect().catch(() => {});
    process.exit(1);
});
