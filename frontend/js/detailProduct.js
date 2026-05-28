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

    // 4. Tải các đánh giá và thiết lập form đánh giá
    loadProductReviews(productId);
    setupReviewForm(productId);
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

// 4. Tải các nhận xét/đánh giá của sản phẩm và cập nhật giao diện
async function loadProductReviews(productId) {
    try {
        const response = await fetch(`/api/reviews/product/${productId}`);
        if (!response.ok) {
            console.error('Không thể tải đánh giá sản phẩm.');
            return;
        }

        const data = await response.json();
        const { reviews, avgRating, count, starsDistribution } = data;

        // Cập nhật điểm trung bình và số lượng đánh giá
        const scoreEl = document.getElementById('average-score');
        const starsEl = document.getElementById('average-stars');
        const countEl = document.getElementById('reviews-count');

        if (scoreEl) scoreEl.innerText = count > 0 ? avgRating.toFixed(1) : '0';
        if (countEl) countEl.innerText = `${count} nhận xét`;

        if (starsEl) {
            starsEl.innerHTML = '';
            const fullStars = Math.floor(avgRating);
            const hasHalfStar = avgRating - fullStars >= 0.4;
            
            for (let i = 1; i <= 5; i++) {
                if (i <= fullStars) {
                    starsEl.innerHTML += '<i class="fa-solid fa-star" style="margin: 0 2px;"></i>';
                } else if (i === fullStars + 1 && hasHalfStar) {
                    starsEl.innerHTML += '<i class="fa-solid fa-star-half-stroke" style="margin: 0 2px;"></i>';
                } else {
                    starsEl.innerHTML += '<i class="fa-regular fa-star" style="margin: 0 2px;"></i>';
                }
            }
        }

        // Cập nhật các thanh phần trăm phân bố sao
        for (let i = 1; i <= 5; i++) {
            const bar = document.getElementById(`bar-${i}`);
            const text = document.getElementById(`count-${i}`);
            
            if (bar && text) {
                const countOfStar = starsDistribution[i] || 0;
                const percentage = count > 0 ? Math.round((countOfStar / count) * 100) : 0;
                
                bar.style.width = `${percentage}%`;
                text.innerText = `${percentage}%`;
            }
        }

        // Cập nhật danh sách các nhận xét cụ thể
        const listEl = document.getElementById('product-reviews-list');
        if (!listEl) return;

        if (reviews.length === 0) {
            listEl.innerHTML = `
                <div style="text-align: center; padding: 30px; color: #64748b; font-size: 15px; background: #f8fafc; border-radius: 8px; border: 1px dashed #cbd5e1;">
                    <i class="fa-regular fa-comments" style="font-size: 32px; margin-bottom: 10px; display: block; color: #cbd5e1;"></i>
                    Chưa có đánh giá nào cho sản phẩm này. Hãy mua hàng và để lại đánh giá đầu tiên nhé!
                </div>
            `;
            return;
        }

        listEl.innerHTML = reviews.map(r => {
            const dateStr = new Date(r.createdAt).toLocaleDateString('vi-VN');
            const customerName = r.customerId ? r.customerId.fullName : 'Khách hàng ẩn danh';
            const initial = customerName.charAt(0).toUpperCase();

            // Tạo các ngôi sao màu vàng tương ứng rating
            let starHtml = '';
            for (let i = 1; i <= 5; i++) {
                if (i <= r.rating) {
                    starHtml += '<i class="fa-solid fa-star" style="color: #fbbf24; font-size: 13px; margin-right: 2px;"></i>';
                } else {
                    starHtml += '<i class="fa-regular fa-star" style="color: #cbd5e1; font-size: 13px; margin-right: 2px;"></i>';
                }
            }

            return `
                <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; display: flex; gap: 15px; align-items: flex-start; transition: transform 0.2s;">
                    <div style="width: 40px; height: 40px; background: #e2e8f0; color: #475569; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 16px; flex-shrink: 0;">
                        ${initial}
                    </div>
                    <div style="flex: 1;">
                        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 5px;">
                            <h4 style="font-size: 15px; font-weight: 700; color: #1e293b; margin: 0;">${customerName}</h4>
                            <span style="font-size: 12px; color: #94a3b8;"><i class="fa-regular fa-calendar" style="margin-right: 4px;"></i> ${dateStr}</span>
                        </div>
                        <div style="margin-bottom: 8px; display: flex; align-items: center;">
                            ${starHtml}
                        </div>
                        <p style="font-size: 14px; color: #475569; line-height: 1.6; margin: 0; white-space: pre-line;">${r.comment}</p>
                    </div>
                </div>
            `;
        }).join('');

    } catch (error) {
        console.error('Lỗi khi tải các đánh giá:', error);
    }
}

// 5. Cấu hình xác thực và form viết đánh giá của khách hàng
async function setupReviewForm(productId) {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    const formContainer = document.getElementById('write-review-container');
    const warningContainer = document.getElementById('review-auth-warning');
    const warningText = document.getElementById('review-warning-text');

    if (!formContainer || !warningContainer) return;

    if (token && userStr) {
        const user = JSON.parse(userStr);
        if (user.role === 'CUSTOMER') {
            try {
                // Kiểm tra xem khách hàng có đơn hàng nào không bị hủy chứa sản phẩm này không
                const response = await fetch('/api/orders/my-orders', {
                    method: 'GET',
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (response.ok) {
                    const orders = await response.json();
                    const hasPurchased = orders.some(order => 
                        order.status !== 'CANCELED' && 
                        order.products.some(p => p.productId === productId)
                    );

                    if (hasPurchased) {
                        formContainer.style.display = 'block';
                        warningContainer.style.display = 'none';
                        
                        // Khởi tạo bộ tương tác chọn sao
                        initStarInputInteractivity();
                        
                        // Lắng nghe sự kiện gửi form
                        const form = document.getElementById('review-form');
                        if (form) {
                            form.removeEventListener('submit', handleReviewSubmit); // Xóa handler cũ
                            form.addEventListener('submit', (e) => handleReviewSubmit(e, productId));
                        }
                    } else {
                        formContainer.style.display = 'none';
                        warningContainer.style.display = 'flex';
                        warningText.innerText = 'Bạn chỉ có thể đánh giá sản phẩm này sau khi đã đặt mua hàng thành công (đơn hàng không bị hủy)!';
                    }
                }
            } catch (error) {
                console.error('Lỗi khi kiểm tra lịch sử đơn hàng để phân quyền đánh giá:', error);
            }
        } else {
            formContainer.style.display = 'none';
            warningContainer.style.display = 'flex';
            warningText.innerText = 'Chỉ tài khoản Khách hàng mới có quyền gửi đánh giá sản phẩm.';
        }
    } else {
        formContainer.style.display = 'none';
        warningContainer.style.display = 'flex';
        warningText.innerText = 'Vui lòng đăng nhập tài khoản Khách hàng để đánh giá sản phẩm.';
    }
}

// Khởi tạo hoạt động chọn sao tương tác (Hover / Click)
function initStarInputInteractivity() {
    const stars = document.querySelectorAll('.star-input');
    const ratingInput = document.getElementById('selected-rating');

    if (!stars || !ratingInput) return;

    stars.forEach(star => {
        // Sự kiện Click chọn số sao
        star.addEventListener('click', () => {
            const rating = parseInt(star.getAttribute('data-rating'));
            ratingInput.value = rating;
            highlightStarsInput(rating);
        });

        // Sự kiện Hover di chuột qua
        star.addEventListener('mouseover', () => {
            const rating = parseInt(star.getAttribute('data-rating'));
            highlightStarsInput(rating);
        });

        // Sự kiện Rời chuột (khôi phục lại số sao đã Click trước đó)
        star.addEventListener('mouseout', () => {
            const currentRating = parseInt(ratingInput.value) || 0;
            highlightStarsInput(currentRating);
        });
    });
}

// Tô màu các ngôi sao đầu vào
function highlightStarsInput(rating) {
    const stars = document.querySelectorAll('.star-input');
    stars.forEach(s => {
        const starRating = parseInt(s.getAttribute('data-rating'));
        if (starRating <= rating) {
            s.style.color = '#ff8000'; // Tô màu cam/vàng
        } else {
            s.style.color = '#cbd5e1'; // Màu xám mặc định
        }
    });
}

// Xử lý gửi Form đánh giá
async function handleReviewSubmit(e, productId) {
    e.preventDefault();

    const token = localStorage.getItem('token');
    const rating = parseInt(document.getElementById('selected-rating').value) || 0;
    const comment = document.getElementById('review-comment').value.trim();

    if (rating === 0) {
        alert('Vui lòng click chọn số điểm đánh giá từ 1 đến 5 sao!');
        return;
    }

    if (!comment) {
        alert('Vui lòng điền nội dung nhận xét!');
        return;
    }

    try {
        const response = await fetch('/api/reviews', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                productId,
                rating,
                comment
            })
        });

        const data = await response.json();

        if (!response.ok) {
            alert(data.message || 'Gửi đánh giá không thành công!');
            return;
        }

        alert('Gửi đánh giá sản phẩm thành công!');
        
        // Reset form
        document.getElementById('selected-rating').value = 0;
        document.getElementById('review-comment').value = '';
        highlightStarsInput(0);

        // Tải lại danh sách đánh giá mới
        loadProductReviews(productId);

    } catch (error) {
        console.error('Lỗi khi gửi đánh giá:', error);
        alert('Lỗi kết nối máy chủ khi gửi đánh giá!');
    }
}

