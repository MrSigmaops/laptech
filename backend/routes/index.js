const express = require('express');
const router = express.Router();

router.use('/products', require('./productRoutes'));
router.use('/users', require('./userRoutes'));

module.exports = router;