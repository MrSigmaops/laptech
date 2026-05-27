const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const {
    getCoupons,
    createCoupon,
    getCouponById,
    updateCoupon,
    deleteCoupon,
    validateCoupon
} = require('../controllers/couponController');

router.get('/validate', validateCoupon);

router.use(protect);
router.get('/', authorize('MANAGER', 'IT', 'STAFF'), getCoupons);
router.post('/', authorize('MANAGER', 'IT'), createCoupon);
router.get('/:id', authorize('MANAGER', 'IT', 'STAFF'), getCouponById);
router.put('/:id', authorize('MANAGER', 'IT'), updateCoupon);
router.delete('/:id', authorize('MANAGER', 'IT'), deleteCoupon);

module.exports = router;
