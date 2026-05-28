// File: backend/routes/paymentRoutes.js
const express = require('express');
const router = express.Router();
const { createVnpayPaymentUrl, handleVnpayIpn, handleVnpayReturn } = require('../controllers/paymentController');
const { protect } = require('../middleware/authMiddleware');

// Tạo URL thanh toán VNPAY (yêu cầu đăng nhập)
router.post('/vnpay-create', protect, createVnpayPaymentUrl);

// IPN callback từ VNPAY server (không yêu cầu auth)
router.get('/vnpay-ipn', handleVnpayIpn);

// Return URL — VNPAY redirect người dùng về sau khi thanh toán
router.get('/vnpay-return', handleVnpayReturn);

module.exports = router;
