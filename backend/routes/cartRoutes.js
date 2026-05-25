// File: backend/routes/cartRoutes.js
const express = require('express');
const router = express.Router();
const {
    getCart,
    addToCart,
    updateCartItem,
    removeFromCart
} = require('../controllers/cartController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Tất cả các tuyến đường giỏ hàng đều yêu cầu đăng nhập với vai trò CUSTOMER
router.use(protect);
router.use(authorize('CUSTOMER'));

router.get('/', getCart);
router.post('/', addToCart);
router.put('/', updateCartItem);
router.delete('/:productId', removeFromCart);

module.exports = router;
