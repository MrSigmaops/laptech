// File: backend/controllers/authController.js
const User = require('../models/user');
const { PHONE_REGEX } = require('../models/user');
const bcrypt = require('bcryptjs');
const SmsService = require('../services/smsService');

// 1. Quên mật khẩu - gửi mã OTP
const forgotPassword = async (req, res) => {
    try {
        const { phoneNumber } = req.body;

        if (!phoneNumber) {
            return res.status(400).json({ message: 'Vui lòng nhập số điện thoại!' });
        }

        // Validate định dạng số điện thoại
        if (!PHONE_REGEX.test(phoneNumber)) {
            return res.status(400).json({ message: 'Số điện thoại không hợp lệ!' });
        }

        // Tìm người dùng theo số điện thoại
        const user = await User.findOne({ phoneNumber });
        if (!user) {
            return res.status(404).json({ message: 'Số điện thoại này chưa được đăng ký trong hệ thống!' });
        }

        // Tạo mã OTP 6 chữ số
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        
        // Thời hạn OTP là 5 phút
        const expires = new Date(Date.now() + 5 * 60 * 1000);

        // Lưu thông tin OTP vào database
        user.otpCode = otp;
        user.otpExpires = expires;
        await user.save();

        // Gửi tin nhắn SMS qua SmsService
        const smsResult = await SmsService.sendOtpVn(phoneNumber, otp);

        res.status(200).json({
            message: 'Mã xác thực OTP đã được gửi tới số điện thoại của bạn!',
            // Trả về OTP trong response khi chạy ở dev để người dùng/tester dễ kiểm thử (nếu không cấu hình SMS thật)
            otp: smsResult.simulated ? otp : undefined
        });

    } catch (error) {
        console.error('Lỗi khi xử lý quên mật khẩu:', error);
        res.status(500).json({ message: 'Lỗi hệ thống khi gửi mã OTP', error: error.message });
    }
};

// 2. Xác thực mã OTP
const verifyOtp = async (req, res) => {
    try {
        const { phoneNumber, otp } = req.body;

        if (!phoneNumber || !otp) {
            return res.status(400).json({ message: 'Vui lòng nhập đầy đủ số điện thoại và mã OTP!' });
        }

        const user = await User.findOne({ phoneNumber });
        if (!user) {
            return res.status(404).json({ message: 'Không tìm thấy thông tin người dùng!' });
        }

        // Kiểm tra mã OTP khớp và còn hạn
        if (!user.otpCode || user.otpCode !== otp || !user.otpExpires || user.otpExpires < new Date()) {
            return res.status(400).json({ message: 'Mã OTP không chính xác hoặc đã hết hạn!' });
        }

        res.status(200).json({ message: 'Xác thực mã OTP thành công! Vui lòng nhập mật khẩu mới.' });

    } catch (error) {
        console.error('Lỗi khi xác thực OTP:', error);
        res.status(500).json({ message: 'Lỗi hệ thống khi xác thực OTP', error: error.message });
    }
};

// 3. Đổi mật khẩu mới
const resetPassword = async (req, res) => {
    try {
        const { phoneNumber, otp, newPassword } = req.body;

        if (!phoneNumber || !otp || !newPassword) {
            return res.status(400).json({ message: 'Vui lòng điền đầy đủ các thông tin yêu cầu!' });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ message: 'Mật khẩu mới phải có ít nhất 6 ký tự!' });
        }

        const user = await User.findOne({ phoneNumber });
        if (!user) {
            return res.status(404).json({ message: 'Không tìm thấy thông tin người dùng!' });
        }

        // Xác thực lại mã OTP trước khi thay đổi mật khẩu
        if (!user.otpCode || user.otpCode !== otp || !user.otpExpires || user.otpExpires < new Date()) {
            return res.status(400).json({ message: 'Mã OTP không hợp lệ hoặc đã hết hạn!' });
        }

        // Mã hóa mật khẩu mới
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        // Lưu mật khẩu và xóa dấu vết OTP cũ
        user.password = hashedPassword;
        user.otpCode = null;
        user.otpExpires = null;
        await user.save();

        res.status(200).json({ message: 'Thay đổi mật khẩu thành công! Vui lòng đăng nhập lại.' });

    } catch (error) {
        console.error('Lỗi khi đặt lại mật khẩu:', error);
        res.status(500).json({ message: 'Lỗi hệ thống khi thay đổi mật khẩu', error: error.message });
    }
};

module.exports = {
    forgotPassword,
    verifyOtp,
    resetPassword
};
