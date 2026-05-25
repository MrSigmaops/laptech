// File: backend/routes/userRoutes.js
const express = require('express');
const router = express.Router();
const {
  register,
  login,
  createUser,
  updateUser,
  updateMe,
  deleteUser,
  getUsers,
  getUserById
} = require('../controllers/userController');
const {
  forgotPassword,
  verifyOtp,
  resetPassword
} = require('../controllers/authController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Các route phục vụ đăng nhập, đăng ký công khai
router.post('/register', register);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/verify-otp', verifyOtp);
router.post('/reset-password', resetPassword);

// Route để khách hàng tự cập nhật thông tin cá nhân
router.put('/me', protect, updateMe);

// Các route quản lý người dùng (Đã bảo vệ bằng JWT middleware)
// Tất cả nhân viên (khác CUSTOMER) đều có thể xem danh sách / chi tiết
router.get('/', protect, authorize('IT', 'MANAGER', 'STAFF', 'STORAGE', 'ACCOUNTING'), getUsers);
router.get('/:id', protect, authorize('IT', 'MANAGER', 'STAFF', 'STORAGE', 'ACCOUNTING'), getUserById);

// Chỉ IT và MANAGER mới được thực hiện CRUD thêm, sửa, xóa
router.post('/', protect, authorize('IT', 'MANAGER'), createUser);
router.put('/:id', protect, authorize('IT', 'MANAGER'), updateUser);
router.patch('/:id', protect, authorize('IT', 'MANAGER'), updateUser);
router.delete('/:id', protect, authorize('IT', 'MANAGER'), deleteUser);

module.exports = router;
