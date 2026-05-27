document.addEventListener("DOMContentLoaded", () => {
    loadPromotionProducts();
});

async function loadPromotionProducts() {
    const grid = document.getElementById('discount-product-grid');
    if (!grid) return;

    try {
        // Gọi API lấy toàn bộ sản phẩm từ Backend
        const response = await fetch('/api/products');
        const data = await response.json();

        if (!response.ok) {
            grid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; color: red;">Lỗi khi tải dữ liệu!</div>`;
            return;
        }

        const products = data.products || [];

        if (products.length === 0) {
            grid.innerHTML = `<div style="grid-column: 1/-1; text-align: center;">Hiện chưa có sản phẩm nào.</div>`;
            return;
        }

        // Vẽ danh sách sản phẩm
        grid.innerHTML = products.map(product => {
            // Định dạng giá tiền từ MongoDB
            const formattedPrice = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(product.basePrice);

            // Giả lập giá cũ (do trong DB chưa có trường giá cũ, ta lấy giá hiện tại * 1.15)
            const oldPrice = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(product.basePrice * 1.15);

            return `
                <div class="home-product-card" onclick="goToProductDetail('${product._id}')">
                    <span class="discount-badge">-15%</span>
                    <img src="${getOptimizedImageUrl(product.imageUrl)}" alt="${product.name}" onerror="this.src='https://via.placeholder.com/200x200?text=Laptop'">
                    <h3 class="home-product-name">${product.name}</h3>
                    <div class="home-product-price">
                        ${formattedPrice} <span class="home-product-old-price">${oldPrice}</span>
                    </div>
                </div>
            `;
        }).join('');

    } catch (error) {
        console.error('Lỗi khi fetch sản phẩm:', error);
        grid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; color: red;">Lỗi kết nối tới máy chủ!</div>`;
    }
}

// Hàm này giúp ảnh từ Cloudinary hiển thị vuông vắn và sắc nét hơn
function getOptimizedImageUrl(url) {
    if (!url) return '';
    // Nếu là ảnh Cloudinary, tự động resize về 400x400 để load nhanh và đẹp
    if (url.includes('res.cloudinary.com')) {
        return url.replace('image/upload/', 'image/upload/c_fill,w_400,h_400/');
    }
    return url;
}

// Hàm chuyển trang Detail (đã có trong main.js, gọi lại ở đây)
function goToProductDetail(id) {
    window.location.href = `detailProduct.html?id=${id}`;
}