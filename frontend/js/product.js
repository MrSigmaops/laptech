document.addEventListener('DOMContentLoaded', () => {
    const productId = new URLSearchParams(window.location.search).get('id');
    if (!productId) {
        renderError('Không tìm thấy sản phẩm. Vui lòng quay lại trang chủ.');
        return;
    }
    fetchProduct(productId);
});

async function fetchProduct(productId) {
    try {
        const response = await fetch(`/api/products/${productId}`);
        if (!response.ok) {
            throw new Error(`HTTP error ${response.status}`);
        }
        const product = await response.json();
        renderProduct(product);
    } catch (error) {
        console.error('Lỗi khi lấy chi tiết sản phẩm:', error);
        renderError('Không thể tải thông tin sản phẩm. Vui lòng thử lại sau.');
    }
}

function renderProduct(product) {
    const nameEl = document.getElementById('product-name');
    const priceEl = document.getElementById('product-price');
    const oldPriceEl = document.getElementById('product-old-price');
    const discountEl = document.getElementById('product-discount');
    const ratingEl = document.getElementById('product-rating');
    const shippingEl = document.getElementById('product-shipping');
    const descriptionEl = document.getElementById('product-description');
    const categoryEl = document.getElementById('product-category');
    const accessoriesEl = document.getElementById('product-accessories');
    const specsEl = document.getElementById('product-specs-list');
    const galleryEl = document.getElementById('product-thumb-list');
    const mainImageEl = document.getElementById('product-main-image');

    nameEl.textContent = product.name || 'Sản phẩm không tên';
    const price = product.base_price?.current ?? 0;
    priceEl.textContent = price ? `${price.toLocaleString('vi-VN')}đ` : 'Liên hệ';

    if (product.base_price?.original) {
        oldPriceEl.textContent = `${product.base_price.original.toLocaleString('vi-VN')}đ`;
    }
    if (product.base_price?.discount_percentage) {
        discountEl.textContent = `-${product.base_price.discount_percentage}%`;
    }

    const rating = product.stats?.rating ?? 0;
    const reviews = product.stats?.reviews_count ?? 0;
    ratingEl.innerHTML = `
        <span class="rating-stars">${renderStars(rating)}</span>
        <span>${rating.toFixed(1)} / 5 (${reviews} đánh giá)</span>
    `;

    shippingEl.innerHTML = `
        <div class="shipping-row"><i class="fa-solid fa-truck-fast"></i> <strong>Giao hàng:</strong> ${product.shipping_info?.estimated_time || 'Liên hệ'}</div>
        <div class="shipping-row"><i class="fa-solid fa-shipping-fast"></i> <strong>Phí vận chuyển:</strong> ${product.shipping_info?.fee ? product.shipping_info.fee.toLocaleString('vi-VN') + 'đ' : 'Miễn phí'}</div>
    `;

    descriptionEl.textContent = product.description || 'Thông tin chi tiết sản phẩm sẽ được cập nhật.';

    const categories = product.categories?.join(' • ') || 'Không có danh mục';
    const accessories = product.accessories?.join(', ') || 'Không có thông tin';
    if (categoryEl) categoryEl.textContent = categories;
    if (accessoriesEl) accessoriesEl.textContent = accessories;

    specsEl.innerHTML = '';
    addSpecItem(specsEl, 'Tên sản phẩm', product.name);
    addSpecItem(specsEl, 'Danh mục', categories);
    addSpecItem(specsEl, 'Giá', price ? `${price.toLocaleString('vi-VN')}đ` : 'Liên hệ');
    addSpecItem(specsEl, 'Giảm giá', product.base_price?.discount_percentage ? `${product.base_price.discount_percentage}%` : 'Không');
    addSpecItem(specsEl, 'Tình trạng', product.variants?.length ? 'Còn hàng' : 'Liên hệ');

    galleryEl.innerHTML = '';
    const images = product.images?.length ? product.images : ['https://via.placeholder.com/600x400'];
    images.forEach((src, index) => {
        const thumb = document.createElement('img');
        thumb.src = src;
        thumb.alt = `${product.name} ${index + 1}`;
        thumb.className = 'product-thumb';
        thumb.addEventListener('click', () => {
            setMainImage(src);
        });
        galleryEl.appendChild(thumb);
    });
    setMainImage(images[0]);
    initQuantityControls();
}

function initQuantityControls() {
    const decrease = document.getElementById('qty-decrease');
    const increase = document.getElementById('qty-increase');
    const input = document.getElementById('product-quantity');

    if (decrease && input) {
        decrease.addEventListener('click', () => {
            const value = Math.max(1, Number(input.value) - 1);
            input.value = value;
        });
    }

    if (increase && input) {
        increase.addEventListener('click', () => {
            const value = Math.max(1, Number(input.value) + 1);
            input.value = value;
        });
    }
}

function renderError(message) {
    const card = document.getElementById('product-detail-card');
    if (card) {
        card.innerHTML = `<div class="error-message"><p>${message}</p><a class="btn-primary" href="../index.html">Quay lại trang chủ</a></div>`;
    }
}

function addSpecItem(container, label, value) {
    const item = document.createElement('li');
    item.innerHTML = `<strong>${label}:</strong> ${value || 'Không có'}`;
    container.appendChild(item);
}

function renderStars(rating) {
    const fullStars = Math.floor(rating);
    const halfStar = rating - fullStars >= 0.5;
    const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);
    let stars = '';

    for (let i = 0; i < fullStars; i += 1) {
        stars += '<i class="fa-solid fa-star"></i>';
    }
    if (halfStar) {
        stars += '<i class="fa-solid fa-star-half-stroke"></i>';
    }
    for (let i = 0; i < emptyStars; i += 1) {
        stars += '<i class="fa-regular fa-star"></i>';
    }
    return stars;
}

function setMainImage(src) {
    const mainImageEl = document.getElementById('product-main-image');
    if (!mainImageEl) return;
    mainImageEl.innerHTML = `<img src="${src}" alt="Hình ảnh sản phẩm">`;
}
