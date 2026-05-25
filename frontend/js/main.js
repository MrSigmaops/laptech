// File: frontend/js/main.js
let currentPage = 1;
const limit = 6;

document.addEventListener("DOMContentLoaded", () => {
    // 1. Kiểm tra xác thực & cập nhật trạng thái Header
    updateHomeHeader();

    // 2. Tải danh sách sản phẩm trang chủ
    loadHomeProducts(currentPage);

    // 3. Xử lý nút tìm kiếm và nhấn phím Enter tìm kiếm sản phẩm
    const searchBtn = document.getElementById('home-search-btn');
    const searchInput = document.getElementById('home-search-input');

    if (searchBtn && searchInput) {
        searchBtn.addEventListener('click', () => {
            currentPage = 1;
            loadHomeProducts(currentPage);
        });

        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                currentPage = 1;
                loadHomeProducts(currentPage);
            }
        });
    }

    // 4. Xử lý bộ lọc hộp kiểm thương hiệu (chọn cái nào gọi API cái đó ngay lập tức)
    const brandCheckboxes = document.querySelectorAll('.brand-checkbox');
    brandCheckboxes.forEach(cb => {
        cb.addEventListener('change', () => {
            currentPage = 1;
            loadHomeProducts(currentPage);
        });
    });

    // 5. Xử lý nút Xóa tất cả bộ lọc
    const clearBtn = document.getElementById('home-clear-btn');
    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            if (searchInput) searchInput.value = '';
            brandCheckboxes.forEach(cb => {
                cb.checked = false;
            });
            currentPage = 1;
            loadHomeProducts(currentPage);
        });
    }
});

// Cập nhật giao diện Header theo token đăng nhập
function updateHomeHeader() {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    const authLinks = document.getElementById('home-auth-links');
    const cartBtn = document.getElementById('home-cart-btn');

    if (token && userStr) {
        const currentUser = JSON.parse(userStr);
        let userDisplay = `<a href="/pages/UserPage/index.html" style="color: white; text-decoration: none; margin-left: 6px;"><strong style="color: white;">${currentUser.fullName.toUpperCase()}</strong></a>`;

        // Nếu role khác CUSTOMER thì cho phép truy cập trang quản trị
        if (currentUser.role !== 'CUSTOMER') {
            userDisplay += ` | <a href="/pages/AdminPage/product.html" style="font-weight: 600; color: white; text-decoration: none;">Quản trị</a>`;
        }

        userDisplay += ` | <a href="#" id="home-logout-btn" style="color: #ff383c; text-decoration: none; margin-left: 6px;">Đăng xuất</a>`;

        if (authLinks) {
            authLinks.innerHTML = userDisplay;

            const logoutBtn = document.getElementById('home-logout-btn');
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

        // Chỉ hiển thị giỏ hàng khi người dùng đã đăng nhập và có vai trò là CUSTOMER
        if (cartBtn) {
            if (currentUser.role === 'CUSTOMER') {
                cartBtn.style.display = 'flex';
                // Thêm mục Lịch Sử Mua Hàng vào navbar
                const navUl = document.querySelector('.main-nav ul');
                if (navUl && !navUl.querySelector('a[href*="OrderHistory"]')) {
                    const li = document.createElement('li');
                    li.innerHTML = `<a href="/pages/OrderHistory/index.html" style="color: white; font-weight: 700;">LỊCH SỬ MUA HÀNG</a>`;
                    navUl.appendChild(li);
                }
            } else {
                cartBtn.style.display = 'none';
            }
        }
    } else {
        // Ẩn nút giỏ hàng khi chưa đăng nhập
        if (cartBtn) {
            cartBtn.style.display = 'none';
        }
    }
}

// Fetch danh sách sản phẩm theo trang, tìm kiếm, lọc thương hiệu
async function loadHomeProducts(page) {
    const productGrid = document.getElementById('homepage-product-grid');
    if (!productGrid) return;

    productGrid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 60px 0; font-size: 16px; color: #666; font-weight: 500;"><i class="fa-solid fa-spinner fa-spin" style="margin-right: 8px;"></i> Đang tải danh sách sản phẩm...</div>`;

    // Lấy thông tin lọc thương hiệu
    const checkedBrands = Array.from(document.querySelectorAll('.brand-checkbox:checked')).map(cb => cb.value);
    const brandParam = checkedBrands.join(',');

    // Lấy thông tin tìm kiếm từ thanh search
    const searchInput = document.getElementById('home-search-input');
    const searchParam = searchInput ? searchInput.value.trim() : '';

    try {
        let url = `/api/products?page=${page}&limit=${limit}`;
        if (brandParam) {
            url += `&brand=${encodeURIComponent(brandParam)}`;
        }
        if (searchParam) {
            url += `&search=${encodeURIComponent(searchParam)}`;
        }

        const response = await fetch(url);
        const data = await response.json();

        if (!response.ok) {
            productGrid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; color: red; padding: 20px;">Lỗi khi tải dữ liệu sản phẩm từ máy chủ.</div>`;
            return;
        }

        const products = data.products || [];
        const pagination = data.pagination || { totalPages: 1, currentPage: 1 };

        renderHomeProducts(products);
        renderHomePagination(pagination.totalPages, page);

    } catch (error) {
        console.error('Lỗi khi fetch sản phẩm trang chủ:', error);
        productGrid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; color: #ff383c; padding: 30px; font-weight: 500;"><i class="fa-solid fa-triangle-exclamation"></i> Lỗi kết nối tới máy chủ! Vui lòng kiểm tra lại.</div>`;
    }
}

// Render dữ liệu sản phẩm lên màn hình
function renderHomeProducts(products) {
    const productGrid = document.getElementById('homepage-product-grid');
    if (!productGrid) return;

    if (products.length === 0) {
        productGrid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 50px 0; font-size: 16px; color: #999; font-weight: 500;"><i class="fa-regular fa-face-frown" style="font-size: 24px; display: block; margin-bottom: 10px;"></i> Không tìm thấy sản phẩm nào phù hợp với bộ lọc tìm kiếm.</div>`;
        return;
    }

    productGrid.innerHTML = products.map(product => {
        // Định dạng tiền tệ VND
        const formattedPrice = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(product.basePrice);

        // Rút gọn mô tả sản phẩm
        const shortDesc = product.description && product.description.length > 55
            ? product.description.substring(0, 52) + '...'
            : (product.description || 'Chưa có mô tả chi tiết sản phẩm.');

        // Định dạng số lượng đã bán (18.2k)
        let soldStr = product.totalSale;
        if (product.totalSale >= 1000) {
            soldStr = (product.totalSale / 1000).toFixed(1).replace('.0', '') + 'k';
        }

        return `
            <div class="product-card" onclick="goToProductDetail('${product._id}')" style="cursor: pointer; display: flex; flex-direction: column; justify-content: space-between; height: 100%;">
                <div>
                    <div class="product-image" style="background: #fafafa; display: flex; justify-content: center; align-items: center; height: 180px; overflow: hidden; border-top-left-radius: 8px; border-top-right-radius: 8px;">
                        <img src="${getOptimizedImageUrl(product.imageUrl)}" alt="${product.name}" loading="lazy" style="width: 100%; height: 100%; object-fit: cover;">
                    </div>
                    <div class="product-info" style="padding: 15px;">
                        <h3 style="font-size: 14px; font-weight: 600; color: #333; line-height: 1.4; margin-bottom: 8px; height: 40px; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;">${product.name}</h3>
                        <div class="specs" style="margin-bottom: 8px;">
                            <span style="background: #f1f5f9; color: #475569; padding: 2px 6px; border-radius: 4px; font-size: 11px; font-weight: 600;">${product.brand}</span>
                        </div>
                        <p style="font-size: 12px; color: #64748b; line-height: 1.5; margin: 8px 0 12px 0; height: 36px; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;">
                            ${shortDesc}
                        </p>
                    </div>
                </div>
                <div style="padding: 0 15px 15px 15px;">
                    <div class="price-row" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                        <p class="price" style="font-size: 16px; font-weight: 700; color: #1e3a8a; margin: 0;">${formattedPrice}</p>
                    </div>
                    <div class="bottom-row" style="display: flex; justify-content: space-between; align-items: center; font-size: 11px; color: #64748b;">
                        <div class="sold">Đã bán ${soldStr}</div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// Render hệ thống nút phân trang phía dưới danh sách
function renderHomePagination(totalPages, currentPage) {
    const paginationContainer = document.getElementById('homepage-pagination');
    if (!paginationContainer) return;

    if (totalPages <= 1) {
        paginationContainer.innerHTML = '';
        return;
    }

    let html = '';

    // Nút Trước
    if (currentPage > 1) {
        html += `<span onclick="changeHomePage(${currentPage - 1})" style="cursor: pointer; padding: 8px 14px; border: 1px solid #cbd5e1; border-radius: 6px; user-select: none; background: #fff; font-weight: 600; font-size: 13px; transition: all 0.2s;">← Trước</span>`;
    } else {
        html += `<span style="color: #cbd5e1; padding: 8px 14px; border: 1px solid #f1f5f9; border-radius: 6px; user-select: none; cursor: not-allowed; background: #f8fafc; font-size: 13px;">← Trước</span>`;
    }

    // Các số trang
    for (let i = 1; i <= totalPages; i++) {
        if (i === currentPage) {
            html += `<span style="background-color: #1e3a8a; color: white; padding: 8px 14px; border-radius: 6px; font-weight: bold; border: 1px solid #1e3a8a; user-select: none; font-size: 13px;">${i}</span>`;
        } else {
            html += `<span onclick="changeHomePage(${i})" style="cursor: pointer; padding: 8px 14px; border: 1px solid #cbd5e1; border-radius: 6px; user-select: none; background: #fff; font-size: 13px; transition: all 0.2s;">${i}</span>`;
        }
    }

    // Nút Sau
    if (currentPage < totalPages) {
        html += `<span onclick="changeHomePage(${currentPage + 1})" style="cursor: pointer; padding: 8px 14px; border: 1px solid #cbd5e1; border-radius: 6px; user-select: none; background: #fff; font-weight: 600; font-size: 13px; transition: all 0.2s;">Sau →</span>`;
    } else {
        html += `<span style="color: #cbd5e1; padding: 8px 14px; border: 1px solid #f1f5f9; border-radius: 6px; user-select: none; cursor: not-allowed; background: #f8fafc; font-size: 13px;">Sau →</span>`;
    }

    paginationContainer.innerHTML = html;
}

// Thay đổi trang sản phẩm
function changeHomePage(page) {
    currentPage = page;
    loadHomeProducts(currentPage);

    // Cuộn mượt lên vị trí lưới sản phẩm để người dùng dễ nhìn
    const gridEl = document.getElementById('homepage-product-grid');
    if (gridEl) {
        gridEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

// Sự kiện click xem chi tiết
function goToProductDetail(id) {
    window.location.href = `./detailProduct.html?id=${id}`;
}

window.changeHomePage = changeHomePage;
window.goToProductDetail = goToProductDetail;

// Hàm tối ưu hóa URL ảnh từ Cloudinary bằng cách thêm tham số resize/crop để lấp đầy khung hình
function getOptimizedImageUrl(url) {
    if (!url) return '';
    // Nếu là ảnh từ Cloudinary, gán các tham số để tự động crop/fill lấy vùng trung tâm đẹp nhất (g_auto) kích thước 400x320px
    if (url.includes('res.cloudinary.com') && url.includes('image/upload')) {
        return url.replace('image/upload/', 'image/upload/c_fill,g_auto,w_400,h_320/');
    }
    return url;
}
