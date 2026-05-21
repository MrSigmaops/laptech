const Product = require('../models/Product');

const getProducts = async (req, res) => {
    try {
        const products = await Product.find();
        res.status(200).json(products);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getProductById = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
        }
        res.status(200).json(product);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Hàm mới: Thêm sản phẩm vào DB
const createProduct = async (req, res) => {
    try {
        const newProduct = new Product(req.body); // Lấy dữ liệu người dùng gửi lên
        const savedProduct = await newProduct.save(); // Lưu vào MongoDB
        res.status(201).json(savedProduct); // Trả về SP vừa lưu thành công
    } catch (error) {
        res.status(400).json({ message: "Lỗi khi thêm sản phẩm", error: error.message });
    }
};

// Nhớ export thêm hàm mới ở đây
module.exports = { getProducts, getProductById, createProduct };