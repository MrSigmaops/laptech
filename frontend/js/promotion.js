document.addEventListener("DOMContentLoaded", () => {
    loadPromotionProducts();
});

async function loadPromotionProducts() {
    const grid = document.getElementById('discount-product-grid');
    if (!grid) return;

    try {
        // Gọi API lấy danh sách promotions từ Backend
        const response = await fetch('/api/promotions');
        const data = await response.json();

        if (!response.ok) {
            grid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; color: red;">Lỗi khi tải dữ liệu!</div>`;
            return;
        }

        const promos = data.promotions || [];

        if (promos.length === 0) {
            grid.innerHTML = `<div style="grid-column: 1/-1; text-align: center;">Hiện chưa có sản phẩm ưu đãi.</div>`;
            return;
        }

        // Client-side pagination: page size 8
        const pageSize = 8;
        const currentPage = Number(new URLSearchParams(window.location.search).get('page')) || 1;
        const totalPages = Math.ceil(promos.length / pageSize);
        const pageItems = promos.slice((currentPage - 1) * pageSize, currentPage * pageSize);

        // Render grid items
        grid.innerHTML = pageItems.map(p => {
            const formattedPrice = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p.basePrice);
            const discounted = Math.max(0, Math.floor(p.basePrice * (1 - (p.discountPercent || 0) / 100)));
            const formattedDiscounted = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(discounted);
            return `
                <div class="home-product-card" onclick="goToProductDetail('${p._id}')">
                    <span class="discount-badge">-${p.discountPercent}%</span>
                    <img src="${getOptimizedImageUrl(p.imageUrl)}" alt="${p.name}" onerror="this.src='https://via.placeholder.com/200x200?text=Laptop'">
                    <h3 class="home-product-name">${p.name}</h3>
                    <div class="home-product-price">
                        ${formattedDiscounted} <span class="home-product-old-price">${formattedPrice}</span>
                    </div>
                </div>
            `;
        }).join('');

        // Pagination controls similar to product list
        let pagHtml = '';
        const pagWrapper = document.createElement('div');
        pagWrapper.style.gridColumn = '1/-1';
        pagWrapper.style.textAlign = 'center';
        pagWrapper.style.marginTop = '20px';

        if (currentPage > 1) pagHtml += `<a href="?page=${currentPage - 1}" style="margin-right:8px;">←</a>`;
        for (let i = 1; i <= totalPages; i++) {
            if (i === currentPage) pagHtml += `<strong style="margin:0 6px;">${i}</strong>`;
            else pagHtml += `<a href="?page=${i}" style="margin:0 6px;">${i}</a>`;
        }
        if (currentPage < totalPages) pagHtml += `<a href="?page=${currentPage + 1}" style="margin-left:8px;">→</a>`;

        grid.innerHTML += `<div style="grid-column:1/-1; text-align:center; margin-top:20px;">${pagHtml}</div>`;

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