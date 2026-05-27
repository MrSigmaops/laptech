// File: backend/models/order.js
const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    name: {
        type: String,
        required: true
    },
    imageUrl: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        min: 1
    }
});

const orderSchema = new mongoose.Schema({
    customerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    employeeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    subTotal: {
        type: Number,
        required: true
    },
    couponCode: {
        type: String,
        default: ''
    },
    discountAmount: {
        type: Number,
        default: 0
    },
    totalPrice: {
        type: Number,
        required: true
    },
    products: [orderItemSchema],
    orderDate: {
        type: Date,
        default: Date.now
    },
    status: {
        type: String,
        enum: ['PENDING', 'CONFIRMED', 'CANCELED'],
        default: 'PENDING'
    },
    paymentMethod: {
        type: String,
        enum: ['CREDIT_CARD', 'INTERNET_BANKING', 'COD'],
        default: 'COD'
    },
    city: {
        type: String,
        required: true
    },
    shippingAddress: {
        type: String,
        required: true
    },
    receiverName: {
        type: String,
        required: true
    },
    receiverPhone: {
        type: String,
        required: true
    },
    note: {
        type: String,
        default: ''
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Order', orderSchema);
