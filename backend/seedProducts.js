// File: backend/seedProducts.js
const mongoose = require('mongoose');
require('dotenv').config();
const Product = require('./models/product');

const products = [
    {
        name: 'HP 15 fc0085AU R5 7430U (A6VV8PA)',
        brand: 'HP',
        description: 'Laptop HP 15-fc0085AU sở hữu thiết kế mỏng nhẹ, hiệu năng ổn định từ bộ vi xử lý AMD Ryzen 5, dung lượng RAM 16GB lớn giúp xử lý đa nhiệm mượt mà.',
        basePrice: 14790000,
        quantity: 150,
        imageUrl: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=500&auto=format&fit=crop&q=60'
    },
    {
        name: 'MacBook Air 13 inch M2 8GB/256GB',
        brand: 'MacBook',
        description: 'MacBook Air M2 với thiết kế hoàn toàn mới, siêu mỏng nhẹ, hiệu năng vượt trội từ chip Apple M2 cùng màn hình Liquid Retina sắc nét.',
        basePrice: 24990000,
        quantity: 150,
        imageUrl: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500&auto=format&fit=crop&q=60'
    },
    {
        name: 'Dell Inspiron 15 3520 i5 1235U',
        brand: 'Dell',
        description: 'Laptop học tập văn phòng Dell Inspiron 15 3520 trang bị màn hình 120Hz mượt mà, hiệu năng Core i5 mạnh mẽ và độ bền bỉ cao.',
        basePrice: 15490000,
        quantity: 14300,
        imageUrl: 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=500&auto=format&fit=crop&q=60'
    },
    {
        name: 'Lenovo IdeaPad Slim 3 14IAH8 i5',
        brand: 'Lenovo',
        description: 'Laptop Lenovo IdeaPad Slim 3 mỏng nhẹ tinh tế, trang bị chip Core i5 thế hệ 12 dòng H hiệu năng cao, màn hình Full HD chống chói.',
        basePrice: 13990000,
        quantity: 11200,
        imageUrl: 'https://images.unsplash.com/photo-1618424181497-157f25b6ddd5?w=500&auto=format&fit=crop&q=60'
    },
    {
        name: 'ASUS Vivobook Go 15 E1504FA R5',
        brand: 'ASUS',
        description: 'ASUS Vivobook Go 15 nổi bật với màn hình OLED tuyệt đẹp, hiệu năng xử lý văn phòng ổn định từ Ryzen 5 và giá thành vô cùng hợp lý.',
        basePrice: 12990000,
        quantity: 8900,
        imageUrl: 'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=500&auto=format&fit=crop&q=60'
    },
    {
        name: 'Acer Aspire 3 A315 i3 1215U',
        brand: 'Acer',
        description: 'Laptop học sinh sinh viên Acer Aspire 3 với thiết kế thanh lịch, Core i3 thế hệ 12 đáp ứng tốt các nhu cầu học tập trực tuyến và văn phòng.',
        basePrice: 9490000,
        quantity: 7500,
        imageUrl: 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=500&auto=format&fit=crop&q=60'
    },
    {
        name: 'Dell Vostro 3430 i7 1355U',
        brand: 'Dell',
        description: 'Laptop doanh nghiệp Dell Vostro cấu hình mạnh mẽ với Core i7 thế hệ 13, tính năng bảo mật nâng cao và vỏ ngoài sang trọng.',
        basePrice: 22490000,
        quantity: 4200,
        imageUrl: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=500&auto=format&fit=crop&q=60'
    },
    {
        name: 'HP Pavilion 14-dv2073TU i5',
        brand: 'HP',
        description: 'Laptop HP Pavilion 14 sở hữu mặt lưng nhôm sang trọng, loa B&O cực hay cùng màn hình IPS sắc nét, hiệu năng Core i5 mượt mà.',
        basePrice: 17290000,
        quantity: 6300,
        imageUrl: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=500&auto=format&fit=crop&q=60'
    },
    {
        name: 'Lenovo Yoga Slim 7 Pro i5 11300H',
        brand: 'Lenovo',
        description: 'Laptop cao cấp Lenovo Yoga Slim 7 Pro với màn hình 2.8K 90Hz OLED siêu đẹp, chip Core i5 dòng H hiệu năng cao chuyên nghiệp.',
        basePrice: 21990000,
        quantity: 3100,
        imageUrl: 'https://images.unsplash.com/photo-1618424181497-157f25b6ddd5?w=500&auto=format&fit=crop&q=60'
    },
    {
        name: 'ASUS Zenbook 14 OLED UX3402VA i5',
        brand: 'ASUS',
        description: 'ASUS Zenbook 14 OLED mỏng nhẹ đẳng cấp doanh nhân, màn hình OLED 2.8K 90Hz, pin dung lượng cực lớn và cấu hình Core i5 thế hệ 13.',
        basePrice: 23990000,
        quantity: 5200,
        imageUrl: 'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=500&auto=format&fit=crop&q=60'
    }
];

const seed = async () => {
    try {
        const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/laptech';
        await mongoose.connect(mongoUri);
        const count = await Product.countDocuments();
        if (count <= 0) {
            await Product.insertMany(products);
            console.log(`Đã seed thành công ${products.length} sản phẩm vào cơ sở dữ liệu!`);
        }


    } catch (error) {
        console.error('Lỗi khi seed sản phẩm:', error);
    }
};

module.exports = seed;
