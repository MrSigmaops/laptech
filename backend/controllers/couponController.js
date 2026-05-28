const Coupon = require('../models/coupon');

function parseDate(value) {
    if (!value) return null;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
}

async function validateCouponCode(code, orderTotal = 0) {
    if (!code || typeof code !== 'string') {
        throw new Error('Mã giảm giá không được bỏ trống');
    }

    const coupon = await Coupon.findOne({ code: code.trim().toUpperCase() });
    if (!coupon) {
        throw new Error('Mã giảm giá không hợp lệ');
    }

    const now = new Date();
    if (coupon.status !== 'ACTIVE') {
        throw new Error('Mã giảm giá hiện không khả dụng');
    }

    if (coupon.startDate && coupon.startDate > now) {
        throw new Error('Mã giảm giá chưa bắt đầu');
    }
    if (coupon.endDate && coupon.endDate < now) {
        throw new Error('Mã giảm giá đã hết hạn');
    }

    if (coupon.quantity > 0 && coupon.usedCount >= coupon.quantity) {
        throw new Error('Mã giảm giá đã được sử dụng hết');
    }

    if (coupon.minOrderValue > 0 && orderTotal < coupon.minOrderValue) {
        throw new Error(`Đơn hàng phải từ ${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(coupon.minOrderValue)} trở lên để sử dụng mã này`);
    }

    let discountAmount = 0;
    if (coupon.type === 'PERCENT') {
        discountAmount = Math.floor(orderTotal * coupon.value / 100);
    } else {
        discountAmount = coupon.value;
    }

    if (discountAmount > orderTotal) {
        discountAmount = orderTotal;
    }

    return { coupon, discountAmount };
}

async function createCoupon(req, res) {
    try {
        const {
            code,
            name,
            description,
            target,
            type,
            value,
            status,
            startDate,
            endDate,
            quantity,
            minOrderValue
        } = req.body;

        const coupon = new Coupon({
            code: (code || '').trim().toUpperCase(),
            name: (name || '').trim(),
            description: description || '',
            target: target || 'ORDER',
            type: type || 'PERCENT',
            value: Number(value) || 0,
            status: status || 'ACTIVE',
            startDate: parseDate(startDate) || new Date(),
            endDate: parseDate(endDate),
            quantity: Number(quantity) || 0,
            minOrderValue: Number(minOrderValue) || 0
        });

        await coupon.save();
        res.status(201).json({ message: 'Tạo mã giảm giá thành công', coupon });
    } catch (error) {
        console.error(error);
        res.status(400).json({ message: error.message || 'Tạo mã giảm giá thất bại' });
    }
}

async function getCoupons(req, res) {
    try {
        const coupons = await Coupon.find().sort({ createdAt: -1 });
        res.json({ coupons });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Không thể tải danh sách mã giảm giá' });
    }
}

async function getActiveCoupons(req, res) {
    try {
        const now = new Date();
        const coupons = await Coupon.find({
            status: 'ACTIVE',
            $and: [
                { $or: [{ startDate: { $exists: false } }, { startDate: { $lte: now } }] },
                { $or: [{ endDate: { $exists: false } }, { endDate: { $gte: now } }] }
            ]
        }).sort({ createdAt: -1 });
        res.json({ coupons });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Không thể tải danh sách mã giảm giá' });
    }
}

async function getCouponById(req, res) {
    try {
        const coupon = await Coupon.findById(req.params.id);
        if (!coupon) {
            return res.status(404).json({ message: 'Không tìm thấy mã giảm giá' });
        }
        res.json({ coupon });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Không thể lấy thông tin mã giảm giá' });
    }
}

async function updateCoupon(req, res) {
    try {
        const coupon = await Coupon.findById(req.params.id);
        if (!coupon) {
            return res.status(404).json({ message: 'Không tìm thấy mã giảm giá' });
        }

        const {
            code,
            name,
            description,
            target,
            type,
            value,
            status,
            startDate,
            endDate,
            quantity,
            minOrderValue
        } = req.body;

        coupon.code = (code || coupon.code).trim().toUpperCase();
        coupon.name = name || coupon.name;
        coupon.description = description || coupon.description;
        coupon.target = target || coupon.target;
        coupon.type = type || coupon.type;
        coupon.value = Number(value) || coupon.value;
        coupon.status = status || coupon.status;
        coupon.startDate = parseDate(startDate) || coupon.startDate;
        coupon.endDate = parseDate(endDate) || coupon.endDate;
        coupon.quantity = Number(quantity) || coupon.quantity;
        coupon.minOrderValue = Number(minOrderValue) || coupon.minOrderValue;

        await coupon.save();

        res.json({ message: 'Cập nhật mã giảm giá thành công', coupon });
    } catch (error) {
        console.error(error);
        res.status(400).json({ message: error.message || 'Cập nhật mã giảm giá thất bại' });
    }
}

async function deleteCoupon(req, res) {
    try {
        const coupon = await Coupon.findById(req.params.id);
        if (!coupon) {
            return res.status(404).json({ message: 'Không tìm thấy mã giảm giá' });
        }

        await coupon.deleteOne();
        res.json({ message: 'Xóa mã giảm giá thành công' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Xóa mã giảm giá thất bại' });
    }
}

async function validateCoupon(req, res) {
    try {
        const code = req.query.code;
        const total = Number(req.query.total) || 0;
        const { coupon, discountAmount } = await validateCouponCode(code, total);

        res.json({
            coupon: {
                id: coupon._id,
                code: coupon.code,
                name: coupon.name,
                description: coupon.description,
                target: coupon.target,
                type: coupon.type,
                value: coupon.value,
                status: coupon.status,
                startDate: coupon.startDate,
                endDate: coupon.endDate,
                quantity: coupon.quantity,
                usedCount: coupon.usedCount,
                minOrderValue: coupon.minOrderValue
            },
            discountAmount
        });
    } catch (error) {
        console.error(error);
        res.status(400).json({ message: error.message || 'Mã giảm giá không hợp lệ' });
    }
}

module.exports = {
    createCoupon,
    getCoupons,
    getActiveCoupons,
    getCouponById,
    updateCoupon,
    deleteCoupon,
    validateCoupon,
    validateCouponCode
};
