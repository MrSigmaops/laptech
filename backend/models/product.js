// File: models/Product.js
const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: { type: String, required: true }, // Tên bắt buộc phải có
    categories: [{ type: String }], // Mảng các danh mục (VD: Máy tính, Laptop HP)
    
    images: [{ type: String }], // Mảng chứa link ảnh (Ảnh 1 là ảnh chính)
    
    stats: {
        rating: { type: Number, default: 0 },
        reviews_count: { type: Number, default: 0 },
        sold: { type: Number, default: 0 } // Số lượng đã bán
    },

    base_price: {
        current: { type: Number, required: true }, // Giá bán hiện tại
        original: { type: Number }, // Giá gốc (để gạch ngang)
        discount_percentage: { type: Number } // % giảm giá
    },

    shipping_info: {
        fee: { type: Number, default: 0 },
        estimated_time: { type: String },
        promotion_note: { type: String }
    },

    accessories: [{ type: String }], // Phụ kiện tặng kèm

    // Các phiên bản cấu hình (i5/256GB, i7/512GB...)
    variants: [
        {
            sku: { type: String }, // Mã phiên bản
            configuration: { type: String }, // VD: "i5-8GB/256GB"
            price: { type: Number }, // Giá riêng của bản này
            stock_quantity: { type: Number, default: 0 } // Tồn kho
        }
    ]
}, {
    timestamps: true // Tự động sinh ra cột createdAt và updatedAt
});

module.exports = mongoose.model('Product', productSchema);