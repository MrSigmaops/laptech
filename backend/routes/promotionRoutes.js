const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const { createPromotion, getPromotions } = require('../controllers/promotionController');

router.get('/', getPromotions);

router.use(protect);
router.post('/', authorize('MANAGER', 'IT'), createPromotion);

module.exports = router;
