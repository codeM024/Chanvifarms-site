import foodModel from "../models/foodModel.js";
import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import Order from '../models/orderModel.js';

// Parse JSON fields from form data
const addFood = async (req, res) => {
    try {
        const { 
            name, 
            description,
            category, 
            status = 'in-stock'
        } = req.body;

        // Parse JSON strings into objects
        const prices = JSON.parse(req.body.prices || '{}');
        const marketPrices = JSON.parse(req.body.marketPrices || '{}');
        const quantityOptions = JSON.parse(req.body.quantityOptions || '{}');

        // Enhanced input validation
        if (!name?.trim() || !description?.trim() || !category?.trim()) {
            return res.status(400).json({
                success: false,
                message: "Please provide name, description, and category"
            });
        }

        if (!prices.g250 && !prices.g500 && !prices.kg1) {
            return res.status(400).json({
                success: false,
                message: "Please provide at least one price option"
            });
        }

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "Please upload an image for the food item"
            });
        }

        // Validate status
        const validStatuses = ['in-stock', 'out-of-stock', 'coming-soon'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Invalid status value"
            });
        }

        // Check for duplicate food items
        const existingFood = await foodModel.findOne({ 
            name: { $regex: new RegExp(`^${name}$`, 'i') } 
        });
        
        if (existingFood) {
            return res.status(400).json({
                success: false,
                message: "A food item with this name already exists"
            });
        }

        const food = new foodModel({
            name,
            description,
            prices,
            marketPrices,
            category,
            status,
            quantityOptions,
            image: req.file.filename
        });

        await food.save();

        return res.status(201).json({
            success: true,
            message: "Food item added successfully",
            data: food
        });

    } catch (error) {
        console.error('Error adding food item:', error);
        return res.status(500).json({
            success: false,
            message: "Internal server error while adding food item"
        });
    }
};

const listFood = async (req, res) => {
    try {
        const foods = await foodModel.find({})
            .select('-__v')
            .sort({ createdAt: -1 });

        // Ensure each food item has the required fields
        const processedFoods = foods.map(food => ({
            ...food.toObject(),
            prices: food.prices || { g250: 0 },
            marketPrices: food.marketPrices || { g250: 0 },
            quantityOptions: food.quantityOptions || { g250: true },
            status: food.status || 'in-stock'
        }));

        return res.json({
            success: true,
            data: processedFoods
        });

    } catch (error) {
        console.error('Error listing food:', error);
        return res.status(500).json({
            success: false,
            message: "Internal server error while fetching food list"
        });
    }
};

const deleteFood = async (req, res) => {
    try {
        const { id } = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid food item ID"
            });
        }

        const food = await foodModel.findById(id);
        if (!food) {
            return res.status(404).json({
                success: false,
                message: "Food item not found"
            });
        }

        // Check if the food item is referenced in any active orders
        const activeOrders = await Order.find({
            'items._id': id,
            status: { $in: ['pending', 'confirmed', 'packing', 'out-for-delivery'] }
        });

        if (activeOrders.length > 0) {
            return res.status(400).json({
                success: false,
                message: "Cannot delete food item as it exists in active orders"
            });
        }

        // Delete image file
        try {
            const imagePath = path.join(__dirname, '../uploads', food.image);
            if (fs.existsSync(imagePath)) {
                fs.unlinkSync(imagePath);
            }
        } catch (error) {
            console.error('Error deleting image file:', error);
        }

        await foodModel.findByIdAndDelete(id);

        return res.json({
            success: true,
            message: "Food item deleted successfully"
        });

    } catch (error) {
        console.error('Error deleting food item:', error);
        return res.status(500).json({
            success: false,
            message: "Internal server error while deleting food item"
        });
    }
};

const updateFood = async (req, res) => {
    try {
        const { id } = req.body;
        const updates = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid food item ID"
            });
        }

        const food = await foodModel.findById(id);
        if (!food) {
            return res.status(404).json({
                success: false,
                message: "Food item not found"
            });
        }

        // Handle image update
        if (req.file) {
            try {
                const oldImagePath = path.join(__dirname, '../uploads', food.image);
                if (fs.existsSync(oldImagePath)) {
                    fs.unlinkSync(oldImagePath);
                }
                updates.image = req.file.filename;
            } catch (error) {
                console.error('Error handling image update:', error);
            }
        }

        const updatedFood = await foodModel.findByIdAndUpdate(
            id,
            { $set: updates },
            { new: true, runValidators: true }
        );

        return res.json({
            success: true,
            message: "Food item updated successfully",
            data: updatedFood
        });

    } catch (error) {
        console.error('Error updating food item:', error);
        return res.status(500).json({
            success: false,
            message: "Internal server error while updating food item"
        });
    }
};

export { addFood, listFood, deleteFood, updateFood };