const express = require('express');
const router = express.Router();

router.use('/products', require('./productRoutes'));
router.use('/users', require('./userRoutes'));
router.use('/cart', require('./cartRoutes'));
router.use('/orders', require('./orderRoutes'));
router.use('/coupons', require('./couponRoutes'));
router.use('/promotions', require('./promotionRoutes'));
router.use('/payments', require('./paymentRoutes'));

module.exports = router;