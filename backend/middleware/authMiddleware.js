// File: backend/middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
const User = require('../models/user');

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'supersecretjwtkey999');
      
      req.user = await User.findById(decoded.id).select('-password');
      if (!req.user) {
        return res.status(401).json({ message: 'Người dùng sở hữu token không còn tồn tại' });
      }

      next();
    } catch (error) {
      return res.status(401).json({ message: 'Token xác thực không hợp lệ hoặc đã hết hạn' });
    }
  } else {
    return res.status(401).json({ message: 'Không có token xác thực, quyền truy cập bị từ chối' });
  }
};

// Cho phép các vai trò cụ thể truy cập
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        message: `Vai trò '${req.user ? req.user.role : 'Không xác định'}' không được phép truy cập tài nguyên này`
      });
    }
    next();
  };
};

module.exports = { protect, authorize };
