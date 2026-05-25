// File: backend/controllers/cartController.js
const Cart = require('../models/cart');
const Product = require('../models/product');

// 1. Lấy giỏ hàng của người dùng hiện tại
const getCart = async (req, res) => {
    try {
        const userId = req.user._id;
        
        let cart = await Cart.findOne({ userId }).populate('items.productId');
        if (!cart) {
            cart = new Cart({ userId, items: [] });
            await cart.save();
        }

        res.status(200).json(cart);
    } catch (error) {
        console.error('Lỗi khi lấy giỏ hàng:', error);
        res.status(500).json({ message: 'Lỗi hệ thống khi lấy thông tin giỏ hàng', error: error.message });
    }
};

// 2. Thêm sản phẩm vào giỏ hàng
const addToCart = async (req, res) => {
    try {
        const userId = req.user._id;
        const { productId, quantity } = req.body;

        const qtyToAdd = parseInt(quantity) || 1;
        if (qtyToAdd <= 0) {
            return res.status(400).json({ message: 'Số lượng thêm vào giỏ hàng phải lớn hơn 0!' });
        }

        // Tìm sản phẩm và kiểm tra tồn kho
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ message: 'Không tìm thấy sản phẩm này!' });
        }

        let cart = await Cart.findOne({ userId });
        if (!cart) {
            cart = new Cart({ userId, items: [] });
        }

        // Tìm xem sản phẩm đã có trong giỏ chưa
        const itemIndex = cart.items.findIndex(item => item.productId.toString() === productId);

        if (itemIndex > -1) {
            // Sản phẩm đã có trong giỏ, cộng thêm số lượng
            const currentQty = cart.items[itemIndex].quantity;
            const newQty = currentQty + qtyToAdd;

            if (newQty > product.quantity) {
                return res.status(400).json({
                    message: `Không thể thêm! Trong giỏ đã có ${currentQty} sản phẩm. Số lượng tồn kho tối đa là ${product.quantity}.`
                });
            }

            cart.items[itemIndex].quantity = newQty;
        } else {
            // Chưa có trong giỏ, kiểm tra tồn kho trước khi chèn mới
            if (qtyToAdd > product.quantity) {
                return res.status(400).json({
                    message: `Số lượng yêu cầu (${qtyToAdd}) vượt quá số lượng tồn kho (${product.quantity})!`
                });
            }

            cart.items.push({ productId, quantity: qtyToAdd });
        }

        await cart.save();
        
        // Populate để trả về giỏ hàng mới cập nhật đầy đủ chi tiết sản phẩm
        const updatedCart = await Cart.findOne({ userId }).populate('items.productId');
        res.status(200).json({ message: 'Đã thêm sản phẩm vào giỏ hàng thành công', cart: updatedCart });

    } catch (error) {
        console.error('Lỗi khi thêm vào giỏ hàng:', error);
        res.status(500).json({ message: 'Lỗi hệ thống khi thêm sản phẩm vào giỏ hàng', error: error.message });
    }
};

// 3. Sửa số lượng sản phẩm trong giỏ hàng
const updateCartItem = async (req, res) => {
    try {
        const userId = req.user._id;
        const { productId, quantity } = req.body;

        const newQty = parseInt(quantity);
        if (isNaN(newQty) || newQty <= 0) {
            return res.status(400).json({ message: 'Số lượng sản phẩm không hợp lệ!' });
        }

        // Kiểm tra tồn kho của sản phẩm
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ message: 'Không tìm thấy sản phẩm!' });
        }

        if (newQty > product.quantity) {
            return res.status(400).json({
                message: `Số lượng yêu cầu (${newQty}) vượt quá số lượng tồn kho của sản phẩm (${product.quantity})!`
            });
        }

        let cart = await Cart.findOne({ userId });
        if (!cart) {
            return res.status(404).json({ message: 'Không tìm thấy giỏ hàng của bạn!' });
        }

        const itemIndex = cart.items.findIndex(item => item.productId.toString() === productId);
        if (itemIndex === -1) {
            return res.status(404).json({ message: 'Sản phẩm này không tồn tại trong giỏ hàng của bạn!' });
        }

        cart.items[itemIndex].quantity = newQty;
        await cart.save();

        const updatedCart = await Cart.findOne({ userId }).populate('items.productId');
        res.status(200).json({ message: 'Cập nhật số lượng thành công', cart: updatedCart });

    } catch (error) {
        console.error('Lỗi khi sửa số lượng giỏ hàng:', error);
        res.status(500).json({ message: 'Lỗi hệ thống khi cập nhật giỏ hàng', error: error.message });
    }
};

// 4. Xóa sản phẩm khỏi giỏ hàng
const removeFromCart = async (req, res) => {
    try {
        const userId = req.user._id;
        const { productId } = req.params;

        let cart = await Cart.findOne({ userId });
        if (!cart) {
            return res.status(404).json({ message: 'Không tìm thấy giỏ hàng!' });
        }

        // Loại bỏ sản phẩm khỏi giỏ
        cart.items = cart.items.filter(item => item.productId.toString() !== productId);
        await cart.save();

        const updatedCart = await Cart.findOne({ userId }).populate('items.productId');
        res.status(200).json({ message: 'Đã xóa sản phẩm khỏi giỏ hàng', cart: updatedCart });

    } catch (error) {
        console.error('Lỗi khi xóa sản phẩm khỏi giỏ hàng:', error);
        res.status(500).json({ message: 'Lỗi hệ thống khi xóa sản phẩm khỏi giỏ hàng', error: error.message });
    }
};

module.exports = {
    getCart,
    addToCart,
    updateCartItem,
    removeFromCart
};
