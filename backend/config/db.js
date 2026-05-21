const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        // Lấy chuỗi kết nối từ file .env
        const conn = await mongoose.connect(process.env.MONGO_URI);
        
        console.log(`🔥 MongoDB Atlas đã thông suốt: ${conn.connection.host}`);
    } catch (error) {
        console.error(`❌ Lỗi kết nối Database: ${error.message}`);
        process.exit(1); // Dừng ứng dụng ngay nếu tạch kết nối
    }
};

module.exports = connectDB;