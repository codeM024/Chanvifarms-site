import userModel from "../models/userModel.js";
import mongoose from "mongoose";
import jwt from "jsonwebtoken"
import bcrypt from "bcrypt"
import validator from "validator";
import { OAuth2Client } from "google-auth-library";

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const createToken = (id) => {
    if (!process.env.JWT_SECRET) {
        throw new Error('JWT_SECRET is not defined in environment variables');
    }
    return jwt.sign({ userId: id }, process.env.JWT_SECRET, { expiresIn: '7d' });
}

// login user 
const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Please provide both email and password"
            });
        }

        const user = await userModel.findOne({ email });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found. Please check your email or register."
            });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: "Invalid password"
            });
        }

        // Generate token with the user's ID
        const token = createToken(user._id);

        res.status(200).json({ 
            success: true, 
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                isAdmin: user.isAdmin || false
            }
        });
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error during login"
        });
    }
}

// register user
const registerUser = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Input validation
        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: "Please provide all required fields"
            });
        }

        if (!validator.isEmail(email)) {
            return res.status(400).json({
                success: false,
                message: "Please enter a valid email address"
            });
        }

        if (password.length < 8) {
            return res.status(400).json({
                success: false,
                message: "Password must be at least 8 characters long"
            });
        }

        // Check if user already exists
        const existingUser = await userModel.findOne({ email });
        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: "Email already registered. Please login instead."
            });
        }

        // Hash password and create user
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        
        const newUser = new userModel({
            name,
            email,
            password: hashedPassword
        });

        const user = await newUser.save();
        const token = createToken(user._id);

        res.status(201).json({
            success: true,
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email
            }
        });
    } catch (error) {
        console.error("Registration error:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error during registration"
        });
    }
}

// Validate address helper function
const validateAddress = (address) => {
    const requiredFields = ['firstName', 'lastName', 'email', 'phone', 'street', 'city', 'state', 'country', 'zipcode'];
    for (const field of requiredFields) {
        if (!address[field]?.trim()) {
            throw new Error(`${field.charAt(0).toUpperCase() + field.slice(1)} is required`);
        }
    }

    // Validate phone number
    if (!/^\d{10}$/.test(address.phone)) {
        throw new Error("Phone number must be 10 digits");
    }

    // Validate email
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address.email)) {
        throw new Error("Invalid email format");
    }
};

// Get user addresses
const getUserAddresses = async (req, res) => {
    try {
        const userId = req.userId;
        console.log("Fetching addresses for user:", userId); // Debug log

        const user = await userModel.findById(userId);
        if (!user) {
            console.log("User not found with ID:", userId); // Debug log
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        res.status(200).json({
            success: true,
            addresses: user.savedAddresses || []
        });
    } catch (error) {
        console.error("Error fetching addresses:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error while fetching addresses"
        });
    }
};

// Add/Update address
const saveAddress = async (req, res) => {
    try {
        const userId = req.userId;
        console.log("Saving address for user:", userId); // Debug log
        const { address } = req.body;

        if (!address) {
            return res.status(400).json({
                success: false,
                message: "Address data is required"
            });
        }

        const user = await userModel.findById(userId);
        if (!user) {
            console.log("User not found with ID:", userId); // Debug log
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        // Initialize savedAddresses array if it doesn't exist
        if (!user.savedAddresses) {
            user.savedAddresses = [];
        }

        // Handle default address
        if (address.isDefault || user.savedAddresses.length === 0) {
            // If this is set as default or it's the first address
            user.savedAddresses = user.savedAddresses.map(addr => ({
                ...addr.toObject(),
                isDefault: false
            }));
            address.isDefault = true;
        }

        // Add new address with a new ObjectId
        const newAddress = {
            ...address,
            _id: new mongoose.Types.ObjectId()
        };
        
        user.savedAddresses.push(newAddress);
        await user.save();

        console.log("Address saved successfully"); // Debug log

        res.status(200).json({
            success: true,
            message: "Address saved successfully",
            address: newAddress,
            addresses: user.savedAddresses
        });
    } catch (error) {
        console.error("Error saving address:", error);
        res.status(400).json({
            success: false,
            message: error.message || "Error saving address"
        });
    }
};

// Update address
const updateAddress = async (req, res) => {
    try {
        const userId = req.userId;
        const addressId = req.params.addressId;
        const { address } = req.body;

        if (!address) {
            return res.status(400).json({
                success: false,
                message: "Address data is required"
            });
        }

        validateAddress(address);

        const user = await userModel.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        const addressIndex = user.savedAddresses.findIndex(
            addr => addr._id.toString() === addressId
        );

        if (addressIndex === -1) {
            return res.status(404).json({
                success: false,
                message: "Address not found"
            });
        }

        if (address.isDefault) {
            // If setting this address as default, remove default from other addresses
            user.savedAddresses = user.savedAddresses.map(addr => ({
                ...addr.toObject(),
                isDefault: addr._id.toString() === addressId
            }));
        } else if (user.savedAddresses[addressIndex].isDefault && user.savedAddresses.length > 1) {
            // If removing default from the only default address, make another address default
            const newDefaultIndex = addressIndex === 0 ? 1 : 0;
            user.savedAddresses[newDefaultIndex].isDefault = true;
        }

        // Update the address
        user.savedAddresses[addressIndex] = {
            ...user.savedAddresses[addressIndex].toObject(),
            ...address,
            _id: user.savedAddresses[addressIndex]._id,
            isDefault: address.isDefault || user.savedAddresses[addressIndex].isDefault
        };

        await user.save();

        res.status(200).json({
            success: true,
            message: "Address updated successfully",
            addresses: user.savedAddresses
        });
    } catch (error) {
        console.error("Error updating address:", error);
        res.status(400).json({
            success: false,
            message: error.message || "Error updating address"
        });
    }
};

// Delete address
const deleteAddress = async (req, res) => {
    try {
        const userId = req.userId;
        const addressId = req.params.addressId;

        const user = await userModel.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        const addressIndex = user.savedAddresses.findIndex(
            addr => addr._id.toString() === addressId
        );

        if (addressIndex === -1) {
            return res.status(404).json({
                success: false,
                message: "Address not found"
            });
        }

        // If deleting default address, make the first remaining address default
        const wasDefault = user.savedAddresses[addressIndex].isDefault;
        user.savedAddresses.splice(addressIndex, 1);
        
        if (wasDefault && user.savedAddresses.length > 0) {
            user.savedAddresses[0].isDefault = true;
        }

        await user.save();

        res.status(200).json({
            success: true,
            message: "Address deleted successfully",
            addresses: user.savedAddresses
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || "Error deleting address"
        });
    }
};

// Google authentication
const googleAuth = async (req, res) => {
    try {
        const { credential } = req.body;

        // Verify the Google token
        const ticket = await googleClient.verifyIdToken({
            idToken: credential,
            audience: process.env.GOOGLE_CLIENT_ID
        });

        const payload = ticket.getPayload();
        
        // Check if user exists
        let user = await userModel.findOne({ email: payload.email });

        if (!user) {
            // Create new user if doesn't exist
            user = new userModel({
                name: payload.name,
                email: payload.email,
                // Set a secure random password since we don't need it for Google auth
                password: Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8)
            });
            await user.save();
        }

        // Generate JWT token
        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            success: true,
            token,
            user: {
                _id: user._id,
                name: user.name,
                email: user.email
            }
        });

    } catch (error) {
        console.error('Google auth error:', error);
        res.status(401).json({
            success: false,
            message: 'Google authentication failed'
        });
    }
};

export { registerUser, loginUser, getUserAddresses, saveAddress, deleteAddress, updateAddress, googleAuth }