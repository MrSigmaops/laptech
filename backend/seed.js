// File: backend/seed.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { fakerVI: faker } = require('@faker-js/faker');
require('dotenv').config();

const User = require('./models/user');
const { VIETNAM_CITIES } = require('./models/user');

const prefixes = [
  '032', '033', '034', '035', '036', '037', '038', '039',
  '056', '058', '059',
  '070', '076', '077', '078', '079',
  '081', '082', '083', '084', '085', '086', '088', '089',
  '090', '091', '092', '093', '094', '096', '097', '098', '099'
];

function generateValidPhone(index) {
  // Đảm bảo sdt là duy nhất bằng cách chèn số thứ tự vào
  const prefix = prefixes[index % prefixes.length];
  const suffix = String(index).padStart(7, '0');
  return prefix + suffix.substring(suffix.length - 7);
}

const seedUsers = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/laptech';
    console.log(`Kết nối tới MongoDB: ${mongoUri}`);
    await mongoose.connect(mongoUri);
    console.log('Đã kết nối thành công.');

    // Xóa sạch user cũ để chạy lại cho sạch
    const users = await User.find();
    if (users.length < 2) {
      // Tạo mật khẩu mặc định: '123456'
      const salt = await bcrypt.genSalt(10);
      const defaultHashedPassword = await bcrypt.hash('123456', salt);

      const usersToCreate = [];

      // 1. Tạo 1 Tài khoản IT (để vào xem được danh sách Tài khoản trong Sidebar)
      usersToCreate.push({
        phoneNumber: '0901234567',
        email: 'it_admin@laptech.vn',
        password: defaultHashedPassword,
        fullName: 'Nguyễn IT Admin',
        city: 'Hà Nội',
        address: 'Phòng Kỹ Thuật, Tòa nhà Laptech, Hà Nội',
        role: 'IT',
        isLock: false
      });

      // 2. Tạo 1 Tài khoản Staff (nhân viên bình thường, không xem được Tài khoản)
      usersToCreate.push({
        phoneNumber: '0901234568',
        email: 'staff_user@laptech.vn',
        password: defaultHashedPassword,
        fullName: 'Trần Văn Staff',
        city: 'TP. Hồ Chí Minh',
        address: 'Phòng Bán Hàng, TPHCM',
        role: 'STAFF',
        isLock: false
      });

      // 3. Tạo thêm 18 người dùng ngẫu nhiên bằng Faker
      const roles = ['CUSTOMER', 'STORAGE', 'STAFF', 'MANAGER', 'IT', 'ACCOUNTING'];

      for (let i = 0; i < 18; i++) {
        const role = roles[Math.floor(Math.random() * roles.length)];
        const city = VIETNAM_CITIES[Math.floor(Math.random() * VIETNAM_CITIES.length)];
        const fullName = faker.person.fullName();
        const email = faker.internet.email({ firstName: faker.person.firstName(), lastName: faker.person.lastName() }).toLowerCase();
        const address = faker.location.streetAddress();
        const phoneNumber = generateValidPhone(i + 10); // Bắt đầu từ số thứ tự 10 để tránh trùng lặp

        usersToCreate.push({
          phoneNumber,
          email,
          password: defaultHashedPassword,
          fullName,
          city,
          address,
          role,
          isLock: Math.random() > 0.85
        });
      }

      await User.insertMany(usersToCreate);
    }

  } catch (error) {
    console.error('Lỗi khi seed dữ liệu:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Đã ngắt kết nối database.');
  }
};

seedUsers();
