// File: backend/controllers/reviewController.js
const Review = require('../models/review');
const Order = require('../models/order');
const Product = require('../models/product');

// 1. Gửi hoặc cập nhật đánh giá sản phẩm
const createReview = async (req, res) => {
    try {
        const customerId = req.user._id;
        const { productId, rating, comment } = req.body;

        if (!productId) {
            return res.status(400).json({ message: 'Thiếu thông tin sản phẩm!' });
        }

        if (!rating || rating < 1 || rating > 5) {
            return res.status(400).json({ message: 'Điểm đánh giá phải từ 1 đến 5 sao!' });
        }

        if (!comment || comment.trim() === '') {
            return res.status(400).json({ message: 'Vui lòng nhập nội dung nhận xét!' });
        }

        // Kiểm tra quyền vai trò CUSTOMER
        if (req.user.role !== 'CUSTOMER') {
            return res.status(403).json({ message: 'Chỉ khách hàng mới có quyền đánh giá sản phẩm!' });
        }

        // Kiểm tra xem sản phẩm có tồn tại không
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ message: 'Sản phẩm không tồn tại!' });
        }

        // ĐIỀU KIỆN: Chỉ khách hàng đã mua sản phẩm này thành công (đơn hàng không bị hủy) mới được đánh giá
        const purchasedOrder = await Order.findOne({
            customerId,
            status: { $ne: 'CANCELED' },
            'products.productId': productId
        });

        if (!purchasedOrder) {
            return res.status(403).json({ 
                message: 'Bạn chỉ có thể đánh giá sản phẩm này sau khi đã mua hàng thành công (đơn hàng không bị hủy)!' 
            });
        }

        // Kiểm tra xem khách hàng đã đánh giá sản phẩm này chưa
        let review = await Review.findOne({ productId, customerId });

        if (review) {
            // Nếu đã đánh giá rồi -> Tiến hành cập nhật lại đánh giá cũ
            review.rating = rating;
            review.comment = comment.trim();
            await review.save();
            return res.status(200).json({ message: 'Cập nhật đánh giá thành công!', review });
        }

        // Nếu chưa -> Tạo đánh giá mới
        review = new Review({
            productId,
            customerId,
            rating,
            comment: comment.trim()
        });

        await review.save();
        res.status(201).json({ message: 'Gửi đánh giá thành công!', review });

    } catch (error) {
        console.error('Lỗi khi gửi đánh giá:', error);
        res.status(500).json({ message: 'Lỗi hệ thống khi gửi đánh giá', error: error.message });
    }
};

// 2. Lấy toàn bộ đánh giá của sản phẩm và tính toán các thống kê (số lượng sao, trung bình cộng)
const getProductReviews = async (req, res) => {
    try {
        const { productId } = req.params;

        const reviews = await Review.find({ productId })
            .populate('customerId', 'fullName')
            .sort({ createdAt: -1 });

        const count = reviews.length;
        let avgRating = 0;
        
        // Khởi tạo phân bố số sao từ 1 đến 5
        const starsDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

        if (count > 0) {
            let totalScore = 0;
            reviews.forEach(r => {
                totalScore += r.rating;
                if (starsDistribution[r.rating] !== undefined) {
                    starsDistribution[r.rating]++;
                }
            });
            avgRating = parseFloat((totalScore / count).toFixed(1));
        }

        res.status(200).json({
            reviews,
            avgRating,
            count,
            starsDistribution
        });
    } catch (error) {
        console.error('Lỗi khi lấy đánh giá sản phẩm:', error);
        res.status(500).json({ message: 'Lỗi hệ thống khi lấy đánh giá sản phẩm', error: error.message });
    }
};

module.exports = {
    createReview,
    getProductReviews
};
