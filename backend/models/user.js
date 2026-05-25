// File: backend/models/user.js
const mongoose = require('mongoose');

const VIETNAM_CITIES = [
  "An Giang", "Bà Rịa - Vũng Tàu", "Bắc Giang", "Bắc Kạn", "Bạc Liêu",
  "Bắc Ninh", "Bến Tre", "Bình Định", "Bình Dương", "Bình Phước",
  "Bình Thuận", "Cà Mau", "Cần Thơ", "Cao Bằng", "Đà Nẵng",
  "Đắk Lắk", "Đắk Nông", "Điện Biên", "Đồng Nai", "Đồng Tháp",
  "Gia Lai", "Hà Giang", "Hà Nam", "Hà Nội", "Hà Tĩnh",
  "Hải Dương", "Hải Phòng", "Hậu Giang", "Hòa Bình", "Hưng Yên",
  "Khánh Hòa", "Kiên Giang", "Kon Tum", "TP. Hồ Chí Minh"
];

const PHONE_REGEX = /^(0|\+84)(3[2-9]|5[6|8|9]|7[0|6-9]|8[0-6|8|9]|9[0-4|6-9])[0-9]{7}$/;

const userSchema = new mongoose.Schema({
  phoneNumber: {
    type: String,
    required: [true, 'Số điện thoại không được để trống'],
    unique: true,
    trim: true,
    validate: {
      validator: function(v) {
        return PHONE_REGEX.test(v);
      },
      message: props => `${props.value} không phải là số điện thoại hợp lệ!`
    }
  },
  email: {
    type: String,
    required: false,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: [true, 'Mật khẩu không được để trống']
  },
  fullName: {
    type: String,
    required: [true, 'Họ và tên không được để trống'],
    trim: true
  },
  city: {
    type: String,
    required: [true, 'Tỉnh/Thành phố không được để trống'],
    enum: {
      values: VIETNAM_CITIES,
      message: 'Tỉnh/Thành phố không hợp lệ'
    }
  },
  address: {
    type: String,
    required: [true, 'Địa chỉ không được để trống'],
    trim: true
  },
  isLock: {
    type: Boolean,
    default: false
  },
  role: {
    type: String,
    enum: {
      values: ['CUSTOMER', 'STORAGE', 'STAFF', 'MANAGER', 'IT', 'ACCOUNTING'],
      message: 'Vai trò không hợp lệ'
    },
    default: 'CUSTOMER'
  },
  otpCode: {
    type: String,
    default: null
  },
  otpExpires: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('User', userSchema);
module.exports.VIETNAM_CITIES = VIETNAM_CITIES;
module.exports.PHONE_REGEX = PHONE_REGEX;
