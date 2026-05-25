// File: frontend/pages/AdminPage/js/sidebar.js
document.addEventListener("DOMContentLoaded", () => {
    // 1. Kiểm tra xác thực và quyền truy cập
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');

    if (!token || !userStr) {
        alert('Vui lòng đăng nhập để truy cập trang quản trị!');
        window.location.href = '/pages/LoginPage';
        return;
    }

    const currentUser = JSON.parse(userStr);

    if (currentUser.role === 'CUSTOMER') {
        alert('Tài khoản khách hàng không có quyền truy cập trang quản trị!');
        window.location.href = '../../index.html';
        return;
    }

    // 2. Chèn Sidebar HTML vào phần tử placeholder
    const sidebarPlaceholder = document.getElementById('sidebar-placeholder');
    if (sidebarPlaceholder) {
        const path = window.location.pathname;
        const isAccountPage = path.includes('account.html') || path.includes('accountModal.html');
        const isProductPage = path.includes('product.html') || path.includes('productModal.html');

        let sidebarHTML = `
            <div class="logo">
                <a href="../../index.html" style="color:white; text-decoration: none;">LAPTECH</a>
            </div>

            <a href="../../index.html" style="color:white; text-decoration: none;"> 
                <div class="menu-item">
                    <i class="fa-solid fa-house"></i> DashBoard
                </div>
            </a>

            <a href="product.html" style="color:white; text-decoration: none;">
                <div class="menu-item ${isProductPage ? 'active' : ''}">
                    <i class="fa-solid fa-box"></i> Sản Phẩm
                </div>
            </a>

            <a href="#" style="color:white; text-decoration: none;">
                <div class="menu-item">
                    <i class="fa-solid fa-cart-shopping"></i> Đơn Hàng
                </div>
            </a>

            <a href="#" style="color:white; text-decoration: none;">
                <div class="menu-item">
                    <i class="fa-solid fa-gift"></i> Mã Giảm Giá
                </div>
            </a>
        `;

        // CHỈ HIỂN THỊ mục Tài Khoản nếu role là IT
        if (currentUser.role === 'IT') {
            sidebarHTML += `
            <a href="account.html" style="color:white; text-decoration: none;"> 
                <div class="menu-item ${isAccountPage ? 'active' : ''}">
                    <i class="fa-solid fa-user"></i> Tài Khoản
                </div>
            </a>
            `;
        }

        sidebarHTML += `
            <a href="#" style="color:white; text-decoration: none;">
                <div class="menu-item">
                    <i class="fa-solid fa-user-plus"></i> Nhân Viên
                </div>
            </a>
        `;

        sidebarPlaceholder.innerHTML = sidebarHTML;
    }

    // 3. Cập nhật thông tin Navbar (User info & nút Đăng xuất)
    const navUserDiv = document.querySelector('.navbar .user');
    if (navUserDiv) {
        navUserDiv.innerHTML = `${currentUser.fullName.toUpperCase()} (${currentUser.role}) <span id="logout-btn" style="cursor:pointer; margin-left: 8px; color: #ff383c;" title="Đăng xuất">Đăng Xuất</span>`;

        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                if (confirm('Bạn có chắc chắn muốn đăng xuất không?')) {
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    window.location.href = '/pages/LoginPage';
                }
            });
        }
    }
});
