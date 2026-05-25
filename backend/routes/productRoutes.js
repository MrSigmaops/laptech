// File: backend/routes/productRoutes.js
const express = require('express');
const multer = require('multer');
const router = express.Router();
const { 
    getProducts, 
    getProductById, 
    createProduct, 
    updateProduct, 
    deleteProduct,
    uploadProductImage 
} = require('../controllers/productController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Cấu hình multer lưu file tạm vào bộ nhớ đệm
const upload = multer({ storage: multer.memoryStorage() });

// Đường dẫn công khai xem sản phẩm
router.get('/', getProducts);
router.get('/:id', getProductById);

// Các đường dẫn quản lý sản phẩm cần đăng nhập ban quản trị (IT hoặc MANAGER)
router.post('/', protect, authorize('IT', 'MANAGER'), createProduct);
router.put('/:id', protect, authorize('IT', 'MANAGER'), updateProduct);
router.patch('/:id', protect, authorize('IT', 'MANAGER'), updateProduct);
router.delete('/:id', protect, authorize('IT', 'MANAGER'), deleteProduct);

// Đường dẫn tải hình ảnh lên Cloudinary
router.post('/upload', protect, authorize('IT', 'MANAGER'), upload.single('image'), uploadProductImage);

module.exports = router;