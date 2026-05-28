const Promotion = require('../models/promotion');

function parseDate(value) {
    if (!value) return null;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
}

async function createPromotion(req, res) {
    try {
        const {
            name,
            description,
            imageUrl,
            basePrice,
            discountPercent,
            quantity,
            status,
            startDate,
            endDate
        } = req.body;

        const promo = new Promotion({
            name: (name || '').trim(),
            description: description || '',
            imageUrl: imageUrl || '',
            basePrice: Number(basePrice) || 0,
            discountPercent: Number(discountPercent) || 0,
            quantity: Number(quantity) || 0,
            status: status || 'ACTIVE',
            startDate: parseDate(startDate) || new Date(),
            endDate: parseDate(endDate)
        });

        await promo.save();
        res.status(201).json({ message: 'Tạo promotion thành công', promotion: promo });
    } catch (error) {
        console.error(error);
        res.status(400).json({ message: error.message || 'Tạo promotion thất bại' });
    }
}

async function getPromotions(req, res) {
    try {
        // Public listing: only active and in-date-range
        const now = new Date();
        const promos = await Promotion.find({
            status: 'ACTIVE',
            $and: [
                { $or: [{ startDate: { $exists: false } }, { startDate: { $lte: now } }] },
                { $or: [{ endDate: { $exists: false } }, { endDate: { $gte: now } }] }
            ]
        }).sort({ createdAt: -1 });

        res.json({ promotions: promos });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Không thể tải danh sách promotion' });
    }
}

module.exports = {
    createPromotion,
    getPromotions
};
