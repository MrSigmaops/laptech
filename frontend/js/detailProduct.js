// File: frontend/js/detailProduct.js

document.addEventListener("DOMContentLoaded", () => {
    // 1. Kiểm tra xác thực & cập nhật trạng thái Header & Nút hành động
    updateDetailHeaderAndActions();

    // 2. Lấy ID sản phẩm từ URL và tải chi tiết sản phẩm
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');

    if (!productId) {
        alert("Mã sản phẩm không hợp lệ!");
        window.location.href = './index.html';
        return;
    }

    loadProductDetail(productId);

    // 3. Xử lý tăng giảm số lượng
    setupQuantitySelector();
});

// Cập nhật giao diện Header và các nút hành động mua hàng
function updateDetailHeaderAndActions() {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    const authLinks = document.getElementById('detail-auth-links');
    const cartBtn = document.getElementById('detail-cart-btn');
    const productActions = document.getElementById('product-actions');

    if (token && userStr) {
        const currentUser = JSON.parse(userStr);
        let userDisplay = `<strong style="color: white;">${currentUser.fullName.toUpperCase()}</strong>`;

        // Nếu role khác CUSTOMER thì hiển thị liên kết trang quản trị
        if (currentUser.role !== 'CUSTOMER') {
            userDisplay += ` | <a href="/pages/AdminPage/product.html" style="font-weight: 600; color: white; text-decoration: none;">Quản trị</a>`;
        }

        userDisplay += ` | <a href="#" id="detail-logout-btn" style="color: #ff383c; text-decoration: none; margin-left: 6px;">Đăng xuất</a>`;

        if (authLinks) {
            authLinks.innerHTML = userDisplay;

            const logoutBtn = document.getElementById('detail-logout-btn');
            if (logoutBtn) {
                logoutBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    if (confirm('Bạn có chắc chắn muốn đăng xuất không?')) {
                        localStorage.removeItem('token');
                        localStorage.removeItem('user');
                        window.location.reload();
                    }
                });
            }
        }

        // Chỉ hiển thị giỏ hàng & các nút mua hàng khi người dùng có vai trò là CUSTOMER
        if (currentUser.role === 'CUSTOMER') {
            if (cartBtn) cartBtn.style.display = 'flex';
            if (productActions) {
                productActions.style.display = 'flex';
                setupActionButtons(currentUser);
            }
        } else {
            if (cartBtn) cartBtn.style.display = 'none';
            if (productActions) productActions.style.display = 'none';
        }
    } else {
        // Chưa đăng nhập -> Ẩn giỏ hàng và ẩn các nút hành động mua/thêm giỏ hàng
        if (cartBtn) cartBtn.style.display = 'none';
        if (productActions) productActions.style.display = 'none';
    }
}

// Tải và hiển thị chi tiết sản phẩm từ API
async function loadProductDetail(id) {
    try {
        const response = await fetch(`/api/products/${id}`);
        if (!response.ok) {
            const errorResult = await response.json();
            alert(errorResult.message || 'Không tìm thấy thông tin sản phẩm!');
            window.location.href = './index.html';
            return;
        }

        const product = await response.json();

        // Bind dữ liệu lên giao diện detailProduct.html
        const breadcrumb = document.getElementById('product-breadcrumb');
        const img = document.getElementById('product-image');
        const name = document.getElementById('product-name');
        const brand = document.getElementById('product-brand');
        const sales = document.getElementById('product-sales');
        const price = document.getElementById('product-price');
        const descText = document.getElementById('product-desc-text');

        if (breadcrumb) {
            breadcrumb.innerHTML = `<a href="./index.html" style="color: #155eb1; text-decoration: none;">Danh mục</a> > <a href="./index.html" style="color: #155eb1; text-decoration: none;">Laptop</a> > ${product.brand} > ${product.name}`;
        }

        if (img) {
            img.src = getOptimizedDetailImageUrl(product.imageUrl);
            img.alt = product.name;
        }

        if (name) name.innerText = product.name;
        if (brand) brand.innerText = product.brand;

        if (sales) {
            let soldStr = product.totalSale || 0;
            if (product.totalSale >= 1000) {
                soldStr = (product.totalSale / 1000).toFixed(1).replace('.0', '') + 'k';
            }
            sales.innerText = `Đã bán ${soldStr}`;
        }

        if (price) {
            price.innerText = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(product.basePrice);
        }

        if (descText) {
            descText.innerText = product.description || 'Chưa có mô tả chi tiết cho sản phẩm này.';
        }

    } catch (error) {
        console.error('Lỗi khi tải chi tiết sản phẩm:', error);
        alert('Lỗi kết nối tới máy chủ khi tải chi tiết sản phẩm!');
    }
}

// Xử lý bộ đếm số lượng mua
function setupQuantitySelector() {
    const btnMinus = document.getElementById('btn-qty-minus');
    const btnPlus = document.getElementById('btn-qty-plus');
    const qtyValue = document.getElementById('qty-value');

    if (btnMinus && btnPlus && qtyValue) {
        btnMinus.addEventListener('click', () => {
            let val = parseInt(qtyValue.innerText) || 1;
            if (val > 1) {
                qtyValue.innerText = val - 1;
            }
        });

        btnPlus.addEventListener('click', () => {
            let val = parseInt(qtyValue.innerText) || 1;
            qtyValue.innerText = val + 1;
        });
    }
}

// Thiết lập chức năng click cho Thêm vào giỏ và Mua ngay
function setupActionButtons(user) {
    const btnAddCart = document.getElementById('btn-add-cart');
    const btnBuyNow = document.getElementById('btn-buy-now');
    const qtyValue = document.getElementById('qty-value');

    if (btnAddCart) {
        btnAddCart.addEventListener('click', () => {
            const qty = parseInt(qtyValue.innerText) || 1;
            alert(`Đã thêm thành công ${qty} sản phẩm vào giỏ hàng của bạn!`);
        });
    }

    if (btnBuyNow) {
        btnBuyNow.addEventListener('click', () => {
            const qty = parseInt(qtyValue.innerText) || 1;
            alert(`Tiến hành mua ngay ${qty} sản phẩm! Hệ thống đang xử lý đơn hàng...`);
        });
    }
}

// Hàm tối ưu hình ảnh từ Cloudinary cho trang chi tiết
function getOptimizedDetailImageUrl(url) {
    if (!url) return '';
    // Thêm tham số resize chất lượng cao w_600 cho trang chi tiết để ảnh sắc nét hơn
    if (url.includes('res.cloudinary.com') && url.includes('image/upload')) {
        return url.replace('image/upload/', 'image/upload/c_limit,w_600/');
    }
    return url;
}
