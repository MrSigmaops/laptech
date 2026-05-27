const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
    code: {
        type: String,
        required: true,
        unique: true,
        uppercase: true,
        trim: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        default: ''
    },
    target: {
        type: String,
        enum: ['PRODUCT', 'SHIPPING', 'ORDER'],
        default: 'ORDER'
    },
    type: {
        type: String,
        enum: ['PERCENT', 'VND'],
        default: 'PERCENT'
    },
    value: {
        type: Number,
        required: true,
        min: 0
    },
    status: {
        type: String,
        enum: ['ACTIVE', 'PENDING', 'EXPIRED'],
        default: 'ACTIVE'
    },
    startDate: {
        type: Date,
        default: Date.now
    },
    endDate: {
        type: Date
    },
    quantity: {
        type: Number,
        default: 0
    },
    usedCount: {
        type: Number,
        default: 0
    },
    minOrderValue: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Coupon', couponSchema);
