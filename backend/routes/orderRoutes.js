// File: backend/routes/orderRoutes.js
const express = require('express');
const router = express.Router();
const {
    createOrder,
    getMyOrders,
    cancelOrder,
    getAllOrders,
    confirmOrder
} = require('../controllers/orderController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Yêu cầu đăng nhập cho tất cả các hoạt động liên quan đến đơn hàng
router.use(protect);

// 1. Phía Khách hàng (CUSTOMER)
router.post('/', authorize('CUSTOMER'), createOrder);
router.get('/my-orders', authorize('CUSTOMER'), getMyOrders);

// Khách hàng tự hủy đơn hoặc Quản trị viên hủy đơn
router.put('/:orderId/cancel', authorize('CUSTOMER', 'MANAGER', 'IT'), cancelOrder);

// 2. Phía Quản trị/Quản lý (MANAGER, IT, STAFF)
router.get('/', authorize('MANAGER', 'IT', 'STAFF'), getAllOrders);
router.put('/:orderId/confirm', authorize('MANAGER', 'IT'), confirmOrder);

module.exports = router;
