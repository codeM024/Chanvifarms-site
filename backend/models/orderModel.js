import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    items: [{
        _id: String,
        name: String,
        price: Number,
        marketPrice: Number,
        quantity: Number,
        size: String,
        image: String
    }],
    amount: {
        type: Number,
        required: true
    },
    savings: {
        type: Number,
        default: 0
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
        location: {
            latitude: Number,
            longitude: Number,
            address: String
        }
    },
    payment: {
        method: {
            type: String,
            enum: ['COD', 'Online'],
            required: true
        },
        status: {
            type: String,
            enum: ['pending', 'initiated', 'completed', 'failed'],
            default: 'pending'
        },
        transactionId: String,
        razorpayOrderId: String
    },
    status: {
        type: String,
        enum: ['pending', 'awaiting_payment', 'confirmed', 'packing', 'out-for-delivery', 'delivered', 'cancelled', 'payment_failed'],
        default: 'pending'
    }
}, {
    timestamps: true
});

// Add indexes for better query performance
orderSchema.index({ userId: 1, createdAt: -1 });
orderSchema.index({ status: 1 });

// Calculate total savings before saving
orderSchema.pre('save', function(next) {
    if (this.isModified('items')) {
        this.savings = this.items.reduce((total, item) => {
            return total + ((item.marketPrice - item.price) * item.quantity);
        }, 0);
    }
    next();
});

export default mongoose.model("Order", orderSchema);