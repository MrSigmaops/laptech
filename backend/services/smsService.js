// File: backend/services/smsService.js
const axios = require('axios');

class SmsService {
    /**
     * Gửi tin nhắn SMS OTP qua SpeedSMS
     * @param {string} phoneNumber Số điện thoại người nhận
     * @param {string} otp Mã xác thực OTP
     * @returns {Promise<object>} Kết quả phản hồi từ SpeedSMS API
     */
    static async sendOtpVn(phoneNumber, otp) {
        try {
            const token = process.env.SPEEDSMS_ACCESS_TOKEN;
            const content = `Ma xac nhan doi mat khau (OTP) cua ban la: ${otp}. Ma co hieu luc trong 5 phut`;

            const base64Credentials = Buffer.from(`${token}:x`).toString('base64');
            const payload = {
                to: [phoneNumber],
                content: content,
                sms_type: 4,
                sender: "Verify"
            };

            const response = await axios.post('http://api.speedsms.vn/index.php/sms/send', payload, {
                headers: {
                    'Authorization': `Basic ${base64Credentials}`,
                    'Content-Type': 'application/json'
                }
            });

            console.log('🚀 Kết quả SpeedSMS:', response.data);

            if (response.data.status === 'error') {
                return { success: false, error: response.data.message, simulated: true, otp };
            }

            return response.data;
        } catch (error) {
            console.error('❌ Lỗi khi gửi SMS qua SpeedSMS:', error.response ? error.response.data : error.message);
            throw new Error('Lỗi gửi tin nhắn xác thực OTP');
        }
    }
}

module.exports = SmsService;
