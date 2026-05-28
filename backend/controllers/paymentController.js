// File: backend/controllers/paymentController.js
const crypto = require('crypto');
const Order = require('../models/order');

// Hàm sắp xếp object theo key (yêu cầu của VNPAY)
function sortObject(obj) {
    const sorted = {};
    const keys = Object.keys(obj).sort();
    keys.forEach(key => {
        sorted[key] = encodeURIComponent(obj[key]).replace(/%20/g, '+');
    });
    return sorted;
}

// 1. Tạo URL thanh toán VNPAY và redirect
const createVnpayPaymentUrl = async (req, res) => {
    try {
        const { orderId } = req.body;

        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ message: 'Không tìm thấy đơn hàng!' });
        }

        // Chỉ cho phép đơn hàng của chính user đang đăng nhập
        if (order.customerId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Bạn không có quyền thanh toán đơn hàng này!' });
        }

        if (order.paymentStatus === 'PAID') {
            return res.status(400).json({ message: 'Đơn hàng này đã được thanh toán!' });
        }

        const tmnCode = process.env.VNP_TMN_CODE;
        const secretKey = process.env.VNP_HASH_SECRET;
        const vnpUrl = process.env.VNP_URL;
        const returnUrl = process.env.VNP_RETURN_URL;

        const date = new Date();
        const createDate = date.toISOString().replace(/[-T:.Z]/g, '').substring(0, 14);
        const txnRef = `${orderId}-${Date.now()}`;

        // VNPAY yêu cầu số tiền x100 (đơn vị: đồng, không có thập phân)
        const amount = Math.round(order.totalPrice) * 100;

        const vnpParams = {
            vnp_Version: '2.1.0',
            vnp_Command: 'pay',
            vnp_TmnCode: tmnCode,
            vnp_Locale: 'vn',
            vnp_CurrCode: 'VND',
            vnp_TxnRef: txnRef,
            vnp_OrderInfo: `Thanh toan don hang ${orderId}`,
            vnp_OrderType: 'other',
            vnp_Amount: amount,
            vnp_ReturnUrl: returnUrl,
            vnp_IpAddr: req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1',
            vnp_CreateDate: createDate,
        };

        const sortedParams = sortObject(vnpParams);

        const queryString = Object.entries(sortedParams)
            .map(([k, v]) => `${k}=${v}`)
            .join('&');

        const hmac = crypto.createHmac('sha512', secretKey);
        const secureHash = hmac.update(Buffer.from(queryString, 'utf-8')).digest('hex');

        const paymentUrl = `${vnpUrl}?${queryString}&vnp_SecureHash=${secureHash}`;

        res.status(200).json({ paymentUrl });
    } catch (error) {
        console.error('Lỗi tạo URL thanh toán VNPAY:', error);
        res.status(500).json({ message: 'Lỗi hệ thống khi tạo URL thanh toán', error: error.message });
    }
};

// 2. Xử lý IPN callback từ VNPAY (server-to-server)
const handleVnpayIpn = async (req, res) => {
    try {
        const vnpParams = { ...req.query };
        const secureHash = vnpParams['vnp_SecureHash'];

        delete vnpParams['vnp_SecureHash'];
        delete vnpParams['vnp_SecureHashType'];

        const secretKey = process.env.VNP_HASH_SECRET;
        const sortedParams = sortObject(vnpParams);

        const queryString = Object.entries(sortedParams)
            .map(([k, v]) => `${k}=${v}`)
            .join('&');

        const hmac = crypto.createHmac('sha512', secretKey);
        const signed = hmac.update(Buffer.from(queryString, 'utf-8')).digest('hex');

        if (secureHash !== signed) {
            return res.status(200).json({ RspCode: '97', Message: 'Fail checksum' });
        }

        // txnRef format: orderId-timestamp
        const txnRef = vnpParams['vnp_TxnRef'];
        const orderId = txnRef.split('-')[0];
        const responseCode = vnpParams['vnp_ResponseCode'];

        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(200).json({ RspCode: '01', Message: 'Order not found' });
        }

        if (order.paymentStatus === 'PAID') {
            return res.status(200).json({ RspCode: '02', Message: 'Order already confirmed' });
        }

        if (responseCode === '00') {
            order.paymentStatus = 'PAID';
            await order.save();
        }

        return res.status(200).json({ RspCode: '00', Message: 'Confirm Success' });
    } catch (error) {
        console.error('Lỗi xử lý IPN VNPAY:', error);
        return res.status(200).json({ RspCode: '99', Message: 'Unknown error' });
    }
};

// 3. Xử lý Return URL — người dùng được VNPAY redirect về sau khi thanh toán
const handleVnpayReturn = async (req, res) => {
    try {
        const vnpParams = { ...req.query };
        const secureHash = vnpParams['vnp_SecureHash'];

        delete vnpParams['vnp_SecureHash'];
        delete vnpParams['vnp_SecureHashType'];

        const secretKey = process.env.VNP_HASH_SECRET;
        const sortedParams = sortObject(vnpParams);

        const queryString = Object.entries(sortedParams)
            .map(([k, v]) => `${k}=${v}`)
            .join('&');

        const hmac = crypto.createHmac('sha512', secretKey);
        const signed = hmac.update(Buffer.from(queryString, 'utf-8')).digest('hex');

        const txnRef = vnpParams['vnp_TxnRef'];
        const orderId = txnRef ? txnRef.split('-')[0] : '';
        const responseCode = vnpParams['vnp_ResponseCode'];

        if (secureHash !== signed) {
            return res.redirect(`/pages/OrderHistory/index.html?vnpay=fail&orderId=${orderId}&reason=invalid_signature`);
        }

        if (responseCode === '00') {
            // Cập nhật paymentStatus nếu IPN chưa cập nhật
            if (orderId) {
                const order = await Order.findById(orderId);
                if (order && order.paymentStatus !== 'PAID') {
                    order.paymentStatus = 'PAID';
                    await order.save();
                }
            }
            return res.redirect(`/pages/OrderHistory/index.html?vnpay=success&orderId=${orderId}`);
        } else {
            return res.redirect(`/pages/OrderHistory/index.html?vnpay=fail&orderId=${orderId}&code=${responseCode}`);
        }
    } catch (error) {
        console.error('Lỗi xử lý VNPAY Return URL:', error);
        return res.redirect('/pages/OrderHistory/index.html?vnpay=fail');
    }
};

module.exports = {
    createVnpayPaymentUrl,
    handleVnpayIpn,
    handleVnpayReturn,
};
