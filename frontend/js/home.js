document.addEventListener("DOMContentLoaded", async () => {
    try {
        // 1. Gọi API lấy sản phẩm từ MongoDB
        const res = await fetch('/api/products');
        const data = await res.json();
        const products = data.products || [];

        // 2. Gọi API lấy top sản phẩm bán chạy theo totalSale
        let bestSellers = [];
        try {
            const bestRes = await fetch('/api/products?limit=4&sortBy=totalSale');
            const bestData = await bestRes.json();
            bestSellers = bestData.products || [];
        } catch (err) {
            console.warn('Không thể lấy sản phẩm bán chạy nhất:', err);
        }

        // 3. Lấy các phần tử container từ HTML
        const trendingGrid = document.getElementById('trending-product-grid');
        const bestsellerGrid = document.getElementById('bestseller-product-grid');
        const discountGrid = document.getElementById('discount-product-grid');

        // Hàm helper để tạo thẻ HTML sản phẩm
        const renderCard = (p) => {
            const formattedPrice = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p.basePrice);
            return `
                <div class="home-product-card" onclick="goToProductDetail('${p._id}')">
                    <img src="${p.imageUrl}" alt="${p.name}" onerror="this.src='https://via.placeholder.com/200'">
                    <h3 class="home-product-name">${p.name}</h3>
                    <div class="home-product-price">${formattedPrice}</div>
                </div>
            `;
        };

        const renderBestSellerCard = (p) => {
            const formattedPrice = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p.basePrice);
            return `
                <div class="home-product-card" onclick="goToProductDetail('${p._id}')">
                    <img src="${p.imageUrl}" alt="${p.name}" onerror="this.src='https://via.placeholder.com/200'">
                    <h3 class="home-product-name">${p.name}</h3>
                    <div style="display: flex; justify-content: space-between; align-items: center; gap: 8px; margin-bottom: 8px;">
                        <div class="home-product-price">${formattedPrice}</div>
                        <div style="font-size: 12px; color: #475569;">Đã bán: ${p.totalSale || 0}</div>
                    </div>
                </div>
            `;
        };

        // 4. Phân bổ sản phẩm vào từng khối
        if (trendingGrid) {
            trendingGrid.innerHTML = products.slice(0, 4).map(renderCard).join('');
        }
        if (bestsellerGrid) {
            const sellerProducts = bestSellers.length ? bestSellers : products.slice(4, 8);
            bestsellerGrid.innerHTML = sellerProducts.map(renderBestSellerCard).join('');
        }
        if (discountGrid) {
            const promoProducts = products.length > 8 ? products.slice(8, 12) : products.slice(0, 4);
            discountGrid.innerHTML = promoProducts.map(p => `
                <div class="home-product-card" onclick="goToProductDetail('${p._id}')">
                    <span class="discount-badge">-15%</span>
                    <img src="${p.imageUrl}" alt="${p.name}" onerror="this.src='https://via.placeholder.com/200'">
                    <h3 class="home-product-name">${p.name}</h3>
                    <div class="home-product-price">${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p.basePrice)}</div>
                </div>
            `).join('');
        }

    } catch (e) {
        console.error("Lỗi khi tải dữ liệu từ MongoDB:", e);
    }
});

// Hàm điều hướng tới trang chi tiết
function goToProductDetail(id) {
    window.location.href = `detailProduct.html?id=${id}`;
}