document.addEventListener("DOMContentLoaded", () => {
    console.log("Giao diện Laptech đã sẵn sàng!");
    fetchProducts();
});

async function fetchProducts() {
    try {
        const response = await fetch('/api/products');
        if (!response.ok) {
            throw new Error(`HTTP error ${response.status}`);
        }
        const products = await response.json();
        renderProducts(products);
    } catch (error) {
        console.error('Lỗi khi lấy sản phẩm từ backend:', error);
    }
}

function renderProducts(products) {
    const container = document.getElementById('trending-container');
    if (!container) return;

    container.innerHTML = '';
    if (!products || products.length === 0) {
        container.innerHTML = '<p>Chưa có sản phẩm để hiển thị.</p>';
        return;
    }

    products.forEach(product => {
        const price = product.base_price?.current ?? 'Liên hệ';
        const image = product.images?.[0] || 'https://via.placeholder.com/300x200';
        const card = document.createElement('div');
        card.className = 'product-card';
        card.innerHTML = `
            <a class="product-link" href="./pages/product.html?id=${product._id}">
                <img src="${image}" alt="${product.name}">
                <h3 class="product-name">${product.name || 'Sản phẩm không tên'}</h3>
                <div class="product-price">${price === 'Liên hệ' ? price : price.toLocaleString('vi-VN')}đ</div>
            </a>
        `;
        container.appendChild(card);
    });
}