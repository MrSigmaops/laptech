const express = require('express');
const router = express.Router();

router.use('/products', require('./productRoutes'));
router.use('/users', require('./userRoutes'));
router.use('/cart', require('./cartRoutes'));
router.use('/orders', require('./orderRoutes'));

module.exports = router;