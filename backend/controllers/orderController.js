// File: backend/controllers/orderController.js
const Order = require('../models/order');
const Cart = require('../models/cart');
const Product = require('../models/product');
const Coupon = require('../models/coupon');
const { validateCouponCode } = require('./couponController');

// 1. Tạo đơn hàng mới từ giỏ hàng
const createOrder = async (req, res) => {
    try {
        const customerId = req.user._id;
        const {
            city,
            shippingAddress,
            receiverName,
            receiverPhone,
            paymentMethod,
            note,
            items,
            isBuyNow,
            couponCode
        } = req.body;

        if (!city || !shippingAddress || !receiverName || !receiverPhone) {
            return res.status(400).json({ message: 'Vui lòng cung cấp đầy đủ thông tin giao hàng!' });
        }

        if (!items || items.length === 0) {
            return res.status(400).json({ message: 'Không có sản phẩm nào để đặt hàng!' });
        }

        let subTotal = 0;
        const orderItems = [];

        // Duyệt qua từng sản phẩm được gửi lên để kiểm tra tồn kho và tính tiền
        for (const item of items) {
            const product = await Product.findById(item.productId);
            if (!product) {
                return res.status(400).json({ message: 'Có sản phẩm đã bị xóa khỏi hệ thống!' });
            }

            if (product.quantity < item.quantity) {
                return res.status(400).json({
                    message: `Sản phẩm "${product.name}" hiện chỉ còn ${product.quantity} sản phẩm trong kho. Bạn yêu cầu ${item.quantity} sản phẩm!`
                });
            }

            // Tính toán tổng tiền hàng dựa trên giá thực tế trong DB
            subTotal += product.basePrice * item.quantity;

            // Đưa sản phẩm vào danh sách đơn hàng
            orderItems.push({
                productId: product._id,
                name: product.name,
                imageUrl: product.imageUrl,
                price: product.basePrice,
                quantity: item.quantity
            });
        }

        // Cập nhật số lượng kho và lượt bán của từng sản phẩm
        for (const orderItem of orderItems) {
            const product = await Product.findById(orderItem.productId);
            product.quantity -= orderItem.quantity;
            product.totalSale += orderItem.quantity;
            await product.save();
        }

        let discountAmount = 0;
        let couponAppliedCode = '';

        if (couponCode) {
            try {
                const result = await validateCouponCode(couponCode, subTotal);
                discountAmount = result.discountAmount;
                couponAppliedCode = result.coupon.code;
            } catch (error) {
                return res.status(400).json({ message: error.message });
            }
        }

        // Tạo đơn hàng mới
        const totalPrice = Math.max(0, subTotal - discountAmount);
        const order = new Order({
            customerId,
            subTotal,
            couponCode: couponAppliedCode,
            discountAmount,
            totalPrice,
            products: orderItems,
            paymentMethod: paymentMethod || 'COD',
            city,
            shippingAddress,
            receiverName,
            receiverPhone,
            note: note || ''
        });

        await order.save();

        if (couponAppliedCode) {
            const coupon = await Coupon.findOne({ code: couponAppliedCode });
            if (coupon) {
                coupon.usedCount += 1;
                if (coupon.quantity > 0 && coupon.usedCount >= coupon.quantity) {
                    coupon.status = 'EXPIRED';
                }
                await coupon.save();
            }
        }

        // Cập nhật giỏ hàng nếu ĐÂY LÀ ĐƠN TỪ GIỎ HÀNG (Không phải Mua Ngay)
        if (!isBuyNow) {
            const cart = await Cart.findOne({ userId: customerId });
            if (cart) {
                const purchasedItemIds = items.map(i => i.productId.toString());
                cart.items = cart.items.filter(cartItem => !purchasedItemIds.includes(cartItem.productId.toString()));
                await cart.save();
            }
        }

        res.status(201).json({ message: 'Đặt hàng thành công!', order });

    } catch (error) {
        console.error('Lỗi khi tạo đơn hàng:', error);
        res.status(500).json({ message: 'Lỗi hệ thống khi đặt hàng', error: error.message });
    }
};

// 2. Xem lịch sử đơn hàng của người dùng hiện tại
const getMyOrders = async (req, res) => {
    try {
        const customerId = req.user._id;
        const orders = await Order.find({ customerId }).sort({ createdAt: -1 });
        res.status(200).json(orders);
    } catch (error) {
        console.error('Lỗi lấy lịch sử đơn hàng:', error);
        res.status(500).json({ message: 'Lỗi hệ thống khi lấy lịch sử đơn hàng', error: error.message });
    }
};

// 3. Khách hàng hủy đơn hàng (chỉ khi trạng thái là PENDING)
const cancelOrder = async (req, res) => {
    try {
        const userId = req.user._id;
        const { orderId } = req.params;

        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ message: 'Không tìm thấy đơn hàng!' });
        }

        // Chỉ khách hàng tạo đơn hoặc ban quản trị mới được phép hủy
        if (order.customerId.toString() !== userId.toString() && req.user.role === 'CUSTOMER') {
            return res.status(403).json({ message: 'Bạn không có quyền hủy đơn hàng này!' });
        }

        if (order.status !== 'PENDING') {
            return res.status(400).json({ message: 'Chỉ có thể hủy những đơn hàng đang ở trạng thái Chờ duyệt (PENDING)!' });
        }

        // Hoàn lại số lượng kho và trừ lại số lượng đã bán của sản phẩm
        for (const item of order.products) {
            const product = await Product.findById(item.productId);
            if (product) {
                product.quantity += item.quantity;
                product.totalSale = Math.max(0, product.totalSale - item.quantity);
                await product.save();
            }
        }

        order.status = 'CANCELED';
        await order.save();

        res.status(200).json({ message: 'Hủy đơn hàng thành công!', order });

    } catch (error) {
        console.error('Lỗi khi hủy đơn hàng:', error);
        res.status(500).json({ message: 'Lỗi hệ thống khi hủy đơn hàng', error: error.message });
    }
};

// 4. Admin/Manager: Xem tất cả các đơn hàng
const getAllOrders = async (req, res) => {
    try {
        const orders = await Order.find()
            .populate('customerId', 'fullName phoneNumber email')
            .populate('employeeId', 'fullName')
            .sort({ createdAt: -1 });

        res.status(200).json(orders);
    } catch (error) {
        console.error('Lỗi lấy danh sách đơn hàng cho admin:', error);
        res.status(500).json({ message: 'Lỗi hệ thống khi lấy danh sách đơn hàng', error: error.message });
    }
};

// 5. Manager/Admin: Xác nhận đơn hàng (PENDING -> CONFIRMED)
const confirmOrder = async (req, res) => {
    try {
        const employeeId = req.user._id;
        const { orderId } = req.params;

        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ message: 'Không tìm thấy đơn hàng!' });
        }

        if (order.status !== 'PENDING') {
            return res.status(400).json({ message: 'Đơn hàng này đã được xử lý hoặc đã hủy!' });
        }

        order.status = 'CONFIRMED';
        order.employeeId = employeeId;
        await order.save();

        res.status(200).json({ message: 'Xác nhận đơn hàng thành công!', order });

    } catch (error) {
        console.error('Lỗi khi duyệt đơn hàng:', error);
        res.status(500).json({ message: 'Lỗi hệ thống khi duyệt đơn hàng', error: error.message });
    }
};

module.exports = {
    createOrder,
    getMyOrders,
    cancelOrder,
    getAllOrders,
    confirmOrder
};
