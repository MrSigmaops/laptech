// File: backend/models/product.js
const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: { 
        type: String, 
        required: true, 
        unique: true 
    },
    brand: { 
        type: String, 
        required: true 
    },
    description: { 
        type: String 
    },
    basePrice: { 
        type: Number, 
        required: true 
    },
    totalSale: { 
        type: Number, 
        default: 0 
    },
    quantity: {
        type: Number,
        default: 0,
        required: true
    },
    imageUrl: { 
        type: String, 
        required: true 
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Product', productSchema);