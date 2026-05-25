const User = require('../models/user');
const { VIETNAM_CITIES, PHONE_REGEX } = require('../models/user');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Helper sinh JWT Token
const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET || 'supersecretjwtkey999',
    { expiresIn: '7d' }
  );
};

// 1. Đăng ký tài khoản (Dành cho khách hàng tự tạo tài khoản)
const register = async (req, res) => {
  try {
    const { phoneNumber, email, password, fullName, city, address } = req.body;

    // Kiểm tra không được để trống các trường bắt buộc
    if (!phoneNumber) return res.status(400).json({ message: 'Số điện thoại không được để trống' });
    if (!password) return res.status(400).json({ message: 'Mật khẩu không được để trống' });
    if (!fullName) return res.status(400).json({ message: 'Họ và tên không được để trống' });
    if (!city) return res.status(400).json({ message: 'Tỉnh/Thành phố không được để trống' });
    if (!address) return res.status(400).json({ message: 'Địa chỉ không được để trống' });

    // Kiểm tra độ dài mật khẩu (tối thiểu 6 ký tự)
    if (password.length < 6) {
      return res.status(400).json({ message: 'Mật khẩu phải có ít nhất 6 ký tự' });
    }

    // Kiểm tra định dạng số điện thoại (10 số qua regex)
    if (!PHONE_REGEX.test(phoneNumber)) {
      return res.status(400).json({ message: 'Số điện thoại không hợp lệ (phải đúng định dạng nhà mạng Việt Nam)' });
    }

    // Kiểm tra Tỉnh/Thành phố có thuộc 34 tỉnh thành không
    if (!VIETNAM_CITIES.includes(city)) {
      return res.status(400).json({ message: 'Tỉnh/Thành phố không hợp lệ. Vui lòng chọn trong 34 tỉnh thành' });
    }

    // Kiểm tra số điện thoại đã tồn tại chưa
    const existingUser = await User.findOne({ phoneNumber });
    if (existingUser) {
      return res.status(400).json({ message: 'Số điện thoại này đã được sử dụng' });
    }

    // Mã hóa mật khẩu bằng bcryptjs
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Tạo user mới với vai trò CUSTOMER
    const newUser = new User({
      phoneNumber,
      email,
      password: hashedPassword,
      fullName,
      city,
      address,
      role: 'CUSTOMER',
      isLock: false
    });

    const savedUser = await newUser.save();

    // Tạo token và loại bỏ password trước khi phản hồi
    const token = generateToken(savedUser);
    const userResponse = savedUser.toObject();
    delete userResponse.password;

    res.status(201).json({
      message: 'Đăng ký thành công',
      token,
      user: userResponse
    });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi hệ thống khi đăng ký', error: error.message });
  }
};

// 2. Đăng nhập
const login = async (req, res) => {
  try {
    const { phoneNumber, password } = req.body;

    // Kiểm tra không được để trống
    if (!phoneNumber) return res.status(400).json({ message: 'Số điện thoại không được để trống' });
    if (!password) return res.status(400).json({ message: 'Mật khẩu không được để trống' });

    // Tìm kiếm user qua số điện thoại
    const user = await User.findOne({ phoneNumber });
    if (!user) {
      return res.status(400).json({ message: 'Số điện thoại hoặc mật khẩu không chính xác' });
    }

    // Kiểm tra tài khoản có bị khóa không
    if (user.isLock) {
      return res.status(403).json({ message: 'Tài khoản đã bị khóa' });
    }

    // So sánh mật khẩu bằng bcryptjs
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Số điện thoại hoặc mật khẩu không chính xác' });
    }

    // Tạo token và loại bỏ password trước khi phản hồi
    const token = generateToken(user);
    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(200).json({
      message: 'Đăng nhập thành công',
      token,
      user: userResponse
    });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi hệ thống khi đăng nhập', error: error.message });
  }
};

// 3. Thêm người dùng (Dành cho Quản trị viên/Nhân viên tạo tài khoản)
const createUser = async (req, res) => {
  try {
    const { phoneNumber, email, password, fullName, city, address, role, isLock } = req.body;

    // Kiểm tra không được để trống các trường bắt buộc
    if (!phoneNumber) return res.status(400).json({ message: 'Số điện thoại không được để trống' });
    if (!password) return res.status(400).json({ message: 'Mật khẩu không được để trống' });
    if (!fullName) return res.status(400).json({ message: 'Họ và tên không được để trống' });
    if (!city) return res.status(400).json({ message: 'Tỉnh/Thành phố không được để trống' });
    if (!address) return res.status(400).json({ message: 'Địa chỉ không được để trống' });

    // Kiểm tra độ dài mật khẩu (tối thiểu 6 ký tự)
    if (password.length < 6) {
      return res.status(400).json({ message: 'Mật khẩu phải có ít nhất 6 ký tự' });
    }

    // Kiểm tra định dạng số điện thoại
    if (!PHONE_REGEX.test(phoneNumber)) {
      return res.status(400).json({ message: 'Số điện thoại không hợp lệ' });
    }

    // Kiểm tra Tỉnh/Thành phố
    if (!VIETNAM_CITIES.includes(city)) {
      return res.status(400).json({ message: 'Tỉnh/Thành phố không hợp lệ' });
    }

    // Kiểm tra số điện thoại tồn tại
    const existingUser = await User.findOne({ phoneNumber });
    if (existingUser) {
      return res.status(400).json({ message: 'Số điện thoại này đã được sử dụng' });
    }

    // Mã hóa mật khẩu
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      phoneNumber,
      email,
      password: hashedPassword,
      fullName,
      city,
      address,
      role: role || 'CUSTOMER',
      isLock: isLock !== undefined ? isLock : false
    });

    const savedUser = await newUser.save();

    const userResponse = savedUser.toObject();
    delete userResponse.password;

    res.status(201).json({
      message: 'Thêm người dùng thành công',
      user: userResponse
    });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi hệ thống khi thêm người dùng', error: error.message });
  }
};

// 4. Sửa thông tin người dùng
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { phoneNumber, email, password, fullName, city, address, role, isLock } = req.body;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }

    // Nếu sửa số điện thoại, cần kiểm tra tính hợp lệ và duy nhất
    if (phoneNumber !== undefined) {
      if (!phoneNumber) return res.status(400).json({ message: 'Số điện thoại không được để trống' });
      if (!PHONE_REGEX.test(phoneNumber)) {
        return res.status(400).json({ message: 'Số điện thoại không hợp lệ' });
      }
      const existingUser = await User.findOne({ phoneNumber, _id: { $ne: id } });
      if (existingUser) {
        return res.status(400).json({ message: 'Số điện thoại này đã được sử dụng bởi người dùng khác' });
      }
      user.phoneNumber = phoneNumber;
    }

    // Nếu sửa mật khẩu, kiểm tra độ dài và mã hóa lại
    if (password !== undefined && password !== '') {
      if (password.length < 6) {
        return res.status(400).json({ message: 'Mật khẩu phải có ít nhất 6 ký tự' });
      }
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
    }

    if (fullName !== undefined) {
      if (!fullName) return res.status(400).json({ message: 'Họ và tên không được để trống' });
      user.fullName = fullName;
    }

    if (city !== undefined) {
      if (!city) return res.status(400).json({ message: 'Tỉnh/Thành phố không được để trống' });
      if (!VIETNAM_CITIES.includes(city)) {
        return res.status(400).json({ message: 'Tỉnh/Thành phố không hợp lệ' });
      }
      user.city = city;
    }

    if (address !== undefined) {
      if (!address) return res.status(400).json({ message: 'Địa chỉ không được để trống' });
      user.address = address;
    }

    if (email !== undefined) {
      user.email = email;
    }

    if (role !== undefined) {
      const validRoles = ['CUSTOMER', 'STORAGE', 'STAFF', 'MANAGER', 'IT', 'ACCOUNTING'];
      if (!validRoles.includes(role)) {
        return res.status(400).json({ message: 'Vai trò không hợp lệ' });
      }
      user.role = role;
    }

    if (isLock !== undefined) {
      user.isLock = isLock;
    }

    const updatedUser = await user.save();

    const userResponse = updatedUser.toObject();
    delete userResponse.password;

    res.status(200).json({
      message: 'Cập nhật thông tin thành công',
      user: userResponse
    });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi hệ thống khi cập nhật thông tin', error: error.message });
  }
};

// 5. Xóa người dùng
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByIdAndDelete(id);
    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng để xóa' });
    }

    res.status(200).json({ message: 'Xóa người dùng thành công' });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi hệ thống khi xóa người dùng', error: error.message });
  }
};

// 6. Lấy danh sách toàn bộ người dùng (Có phân trang, tìm kiếm và lọc vai trò)
const getUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const skip = (page - 1) * limit;
    const search = req.query.search || '';
    const role = req.query.role || '';

    // Xây dựng câu truy vấn dựa trên bộ lọc tìm kiếm và vai trò
    let query = {};

    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { phoneNumber: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    if (role) {
      query.role = role;
    }

    const totalUsers = await User.countDocuments(query);
    const users = await User.find(query)
      .select('-password')
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      users,
      pagination: {
        totalUsers,
        currentPage: page,
        limit,
        totalPages: Math.ceil(totalUsers / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi hệ thống khi lấy danh sách người dùng', error: error.message });
  }
};

// 7. Lấy thông tin một người dùng theo ID
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi hệ thống khi lấy thông tin người dùng', error: error.message });
  }
};

const updateMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }

    const { fullName, city, address, email } = req.body;

    if (fullName) {
      user.fullName = fullName;
    }

    if (city) {
      user.city = city;
    }

    if (address) {
      user.address = address;
    }

    if (email) {
      user.email = email;
    }

    const updatedUser = await user.save();

    const userResponse = updatedUser.toObject();
    delete userResponse.password;

    res.status(200).json({
      message: 'Cập nhật thông tin thành công',
      user: userResponse
    });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi hệ thống khi cập nhật thông tin', error: error.message });
  }
};

module.exports = {
  register,
  login,
  createUser,
  updateUser,
  updateMe,
  deleteUser,
  getUsers,
  getUserById
};
