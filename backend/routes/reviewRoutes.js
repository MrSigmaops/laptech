// File: backend/routes/reviewRoutes.js
const express = require('express');
const router = express.Router();
const { createReview, getProductReviews } = require('../controllers/reviewController');
const { protect } = require('../middleware/authMiddleware');

// 1. Gửi/Cập nhật đánh giá của khách hàng (yêu cầu đăng nhập)
router.post('/', protect, createReview);

// 2. Lấy toàn bộ đánh giá kèm phân tích sao của sản phẩm (công khai)
router.get('/product/:productId', getProductReviews);

module.exports = router;
