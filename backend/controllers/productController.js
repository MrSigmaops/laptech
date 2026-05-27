// File: backend/controllers/productController.js
const Product = require('../models/product');
const cloudinary = require('cloudinary').v2;

// Cloudinary automatically picks up process.env.CLOUDINARY_URL
// But let's make sure it's initialized correctly
if (process.env.CLOUDINARY_URL) {
    cloudinary.config();
}

// 1. Xem danh sách sản phẩm (có phân trang, tìm kiếm, lọc thương hiệu)
const getProducts = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 6; // Mặc định 6 sản phẩm/trang
        const skip = (page - 1) * limit;

        const search = req.query.search || '';
        const brand = req.query.brand || '';

        // Xây dựng điều kiện truy vấn
        let query = {};

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { brand: { $regex: search, $options: 'i' } }
            ];
        }

        if (brand) {
            if (brand.includes(',')) {
                const brands = brand.split(',').map(b => b.trim());
                query.brand = { $in: brands.map(b => new RegExp(`^${b}$`, 'i')) };
            } else {
                query.brand = { $regex: new RegExp(`^${brand}$`, 'i') };
            }
        }

        const totalProducts = await Product.countDocuments(query);
        const sortBy = req.query.sortBy || 'createdAt';
        const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
        const sortOptions = ['createdAt', 'totalSale', 'basePrice'];
        const sortOption = sortOptions.includes(sortBy) ? { [sortBy]: sortOrder } : { createdAt: -1 };

        const products = await Product.find(query)
            .skip(skip)
            .limit(limit)
            .sort(sortOption);

        res.status(200).json({
            products,
            pagination: {
                totalProducts,
                currentPage: page,
                limit,
                totalPages: Math.ceil(totalProducts / limit)
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi hệ thống khi lấy danh sách sản phẩm', error: error.message });
    }
};

// 2. Xem chi tiết sản phẩm theo ID
const getProductById = async (req, res) => {
    try {
        const { id } = req.params;
        const product = await Product.findById(id);
        if (!product) {
            return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
        }
        res.status(200).json(product);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi hệ thống khi lấy chi tiết sản phẩm', error: error.message });
    }
};

// 3. Thêm sản phẩm mới (chỉ Admin/Staff)
const createProduct = async (req, res) => {
    try {
        const { name, brand, description, basePrice, totalSale, quantity, imageUrl } = req.body;

        if (!name || !brand || !basePrice || !imageUrl) {
            return res.status(400).json({ message: 'Vui lòng điền đầy đủ: Tên, Thương hiệu, Giá gốc, Hình ảnh!' });
        }

        // Kiểm tra xem tên sản phẩm có bị trùng không (nếu model quy định unique)
        const existing = await Product.findOne({ name });
        if (existing) {
            return res.status(400).json({ message: 'Tên sản phẩm này đã tồn tại trong hệ thống!' });
        }

        const newProduct = new Product({
            name,
            brand,
            description,
            basePrice: Number(basePrice),
            totalSale: Number(totalSale) || 0,
            quantity: Number(quantity) || 0,
            imageUrl
        });

        const savedProduct = await newProduct.save();
        res.status(201).json({ message: 'Thêm sản phẩm thành công', product: savedProduct });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi khi thêm sản phẩm', error: error.message });
    }
};

// 4. Sửa sản phẩm (chỉ Admin/Staff)
const updateProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, brand, description, basePrice, totalSale, quantity, imageUrl } = req.body;

        const product = await Product.findById(id);
        if (!product) {
            return res.status(404).json({ message: 'Không tìm thấy sản phẩm để cập nhật' });
        }

        // Nếu thay đổi tên sản phẩm, kiểm tra trùng lặp
        if (name && name !== product.name) {
            const existing = await Product.findOne({ name });
            if (existing) {
                return res.status(400).json({ message: 'Tên sản phẩm này đã được sử dụng!' });
            }
            product.name = name;
        }

        if (brand !== undefined) product.brand = brand;
        if (description !== undefined) product.description = description;
        if (basePrice !== undefined) product.basePrice = Number(basePrice);
        if (totalSale !== undefined) product.totalSale = Number(totalSale);
        if (quantity !== undefined) product.quantity = Number(quantity);
        if (imageUrl !== undefined) product.imageUrl = imageUrl;

        const updatedProduct = await product.save();
        res.status(200).json({ message: 'Cập nhật sản phẩm thành công', product: updatedProduct });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi khi cập nhật sản phẩm', error: error.message });
    }
};

// 5. Xóa sản phẩm (chỉ Admin/Staff)
const deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const product = await Product.findByIdAndDelete(id);
        if (!product) {
            return res.status(404).json({ message: 'Không tìm thấy sản phẩm để xóa' });
        }
        res.status(200).json({ message: 'Xóa sản phẩm thành công' });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi hệ thống khi xóa sản phẩm', error: error.message });
    }
};

// 6. Upload ảnh lên Cloudinary
const uploadProductImage = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'Vui lòng chọn hình ảnh để tải lên!' });
        }

        // Upload stream từ memory buffer
        const uploadStream = () => {
            return new Promise((resolve, reject) => {
                const stream = cloudinary.uploader.upload_stream(
                    { folder: 'laptech_products' },
                    (error, result) => {
                        if (error) reject(error);
                        else resolve(result);
                    }
                );
                stream.end(req.file.buffer);
            });
        };

        const result = await uploadStream();
        res.status(200).json({
            message: 'Tải ảnh lên Cloudinary thành công',
            imageUrl: result.secure_url
        });
    } catch (error) {
        console.error('Lỗi upload Cloudinary:', error);
        res.status(500).json({ message: 'Lỗi tải ảnh lên Cloudinary', error: error.message });
    }
};

module.exports = {
    getProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct,
    uploadProductImage
};