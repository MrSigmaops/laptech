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
        let userDisplay = `<a href="/pages/UserPage/index.html" style="color: white; text-decoration: none;"><strong style="color: white;">${currentUser.fullName.toUpperCase()}</strong></a>`;

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
            if (cartBtn) {
                cartBtn.style.display = 'flex';
                cartBtn.href = './pages/CartPage/index.html';
            }
            if (productActions) {
                productActions.style.display = 'flex';
                setupActionButtons(currentUser);
            }
            // Thêm mục Lịch Sử Mua Hàng vào navbar
            const navUl = document.querySelector('.main-nav ul');
            if (navUl && !navUl.querySelector('a[href*="OrderHistory"]')) {
                const li = document.createElement('li');
                li.innerHTML = `<a href="./pages/OrderHistory/index.html" style="color: white; font-weight: 700;">LỊCH SỬ MUA HÀNG</a>`;
                navUl.appendChild(li);
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

    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');

    if (btnAddCart) {
        btnAddCart.removeAttribute('onclick'); // Đảm bảo không bị trùng sự kiện inline
        btnAddCart.addEventListener('click', async () => {
            const quantity = parseInt(qtyValue.innerText) || 1;
            const token = localStorage.getItem('token');
            if (!token) {
                alert('Vui lòng đăng nhập trước khi thêm sản phẩm vào giỏ hàng!');
                window.location.href = './pages/LoginPage';
                return;
            }
            try {
                const response = await fetch('/api/cart', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ productId, quantity })
                });
                const data = await response.json();
                if (!response.ok) {
                    alert(data.message || 'Lỗi khi thêm sản phẩm vào giỏ hàng');
                    return;
                }
                alert('Đã thêm sản phẩm vào giỏ hàng thành công!');
            } catch (error) {
                console.error('Lỗi thêm giỏ hàng:', error);
                alert('Lỗi kết nối máy chủ!');
            }
        });
    }

    if (btnBuyNow) {
        btnBuyNow.addEventListener('click', async () => {
            const quantity = parseInt(qtyValue.innerText) || 1;
            const token = localStorage.getItem('token');
            if (!token) {
                alert('Vui lòng đăng nhập trước khi mua hàng!');
                window.location.href = './pages/LoginPage';
                return;
            }

            try {
                // Kiểm tra tồn kho của sản phẩm
                const response = await fetch(`/api/products/${productId}`);
                if (!response.ok) {
                    alert('Không thể lấy thông tin sản phẩm!');
                    return;
                }
                const product = await response.json();
                if (product.quantity < quantity) {
                    alert(`Sản phẩm này chỉ còn ${product.quantity} sản phẩm trong kho!`);
                    return;
                }

                // Lưu vật phẩm checkout trực tiếp
                const checkoutItems = [{
                    productId: product._id,
                    name: product.name,
                    imageUrl: product.imageUrl,
                    price: product.basePrice,
                    quantity: quantity
                }];

                localStorage.setItem('checkoutItems', JSON.stringify(checkoutItems));
                localStorage.setItem('isBuyNow', 'true');
                window.location.href = './pages/OrderPage/index.html';
            } catch (error) {
                console.error('Lỗi khi mua ngay:', error);
                alert('Lỗi kết nối tới máy chủ!');
            }
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
