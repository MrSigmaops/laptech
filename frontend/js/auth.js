document.addEventListener("DOMContentLoaded", () => {
    console.log("Hệ thống Auth Laptech đã kích hoạt!");

    // 1. Logic ẩn / hiện mật khẩu bằng con mắt
    const togglePasswordIcons = document.querySelectorAll('.toggle-password');

    togglePasswordIcons.forEach(icon => {
        icon.addEventListener('click', function() {
            const targetId = this.getAttribute('data-target');
            const passwordInput = document.getElementById(targetId);

            if (passwordInput.type === 'password') {
                passwordInput.type = 'text';
                this.classList.remove('fa-eye');
                this.classList.add('fa-eye-slash'); // Đổi thành icon mắt gạch chéo
            } else {
                passwordInput.type = 'password';
                this.classList.remove('fa-eye-slash');
                this.classList.add('fa-eye'); // Đổi về icon mắt mở
            }
        });
    });

    // 2. Điền danh sách tỉnh thành vào select reg-city nếu tồn tại
    const regCitySelect = document.getElementById('reg-city');
    if (regCitySelect && window.VIETNAM_CITIES) {
        window.VIETNAM_CITIES.forEach(city => {
            const option = document.createElement('option');
            option.value = city;
            option.textContent = city;
            regCitySelect.appendChild(option);
        });
    }

    // 3. Xử lý Form Đăng Nhập bằng Fetch
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const phoneNumber = document.getElementById('login-phone').value.trim();
            const password = document.getElementById('login-pwd').value;

            if (!phoneNumber || !password) {
                alert('Vui lòng điền đầy đủ số điện thoại và mật khẩu!');
                return;
            }

            try {
                const response = await fetch('/api/users/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ phoneNumber, password })
                });

                const result = await response.json();

                if (!response.ok) {
                    alert(result.message || 'Đăng nhập thất bại, vui lòng kiểm tra lại!');
                    return;
                }

                // Lưu Token và thông tin người dùng vào LocalStorage
                localStorage.setItem('token', result.token);
                localStorage.setItem('user', JSON.stringify(result.user));

                alert(result.message || 'Đăng nhập thành công!');

                // Điều hướng dựa trên quyền người dùng
                if (result.user.role !== 'CUSTOMER') {
                    // Nếu là STORAGE, STAFF, MANAGER, IT, ACCOUNTING -> chuyển đến Admin Page
                    window.location.href = '/pages/AdminPage/account.html';
                } else {
                    // Nếu là CUSTOMER -> chuyển đến trang chủ khách hàng
                    window.location.href = '../../index.html';
                }

            } catch (error) {
                console.error('Lỗi khi gọi API đăng nhập:', error);
                alert('Có lỗi hệ thống xảy ra. Vui lòng thử lại sau!');
            }
        });
    }

    // 4. Xử lý Form Đăng Ký bằng Fetch
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const fullName = document.getElementById('reg-fullname').value.trim();
            const email = document.getElementById('reg-email').value.trim();
            const phoneNumber = document.getElementById('reg-phone').value.trim();
            const city = document.getElementById('reg-city').value;
            const address = document.getElementById('reg-address').value.trim();
            const password = document.getElementById('reg-pwd').value;
            const confirmPassword = document.getElementById('reg-pwd-confirm').value;

            // Kiểm tra phía client
            if (!fullName || !phoneNumber || !city || !address || !password || !confirmPassword) {
                alert('Vui lòng điền đầy đủ các thông tin bắt buộc!');
                return;
            }

            if (password.length < 6) {
                alert('Mật khẩu phải có ít nhất 6 ký tự!');
                return;
            }

            if (password !== confirmPassword) {
                alert('Mật khẩu xác nhận không khớp!');
                return;
            }

            const phoneRegex = /^(0|\+84)(3[2-9]|5[6|8|9]|7[0|6-9]|8[0-6|8|9]|9[0-4|6-9])[0-9]{7}$/;
            if (!phoneRegex.test(phoneNumber)) {
                alert('Số điện thoại không hợp lệ. Vui lòng nhập đúng định dạng 10 số của Việt Nam!');
                return;
            }

            try {
                const response = await fetch('/api/users/register', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        fullName,
                        email: email || undefined,
                        phoneNumber,
                        city,
                        address,
                        password
                    })
                });

                const result = await response.json();

                if (!response.ok) {
                    alert(result.message || 'Đăng ký thất bại!');
                    return;
                }

                alert('Đăng ký thành công! Hãy đăng nhập bằng tài khoản mới.');
                window.location.href = '/pages/LoginPage';

            } catch (error) {
                console.error('Lỗi khi gọi API đăng ký:', error);
                alert('Có lỗi hệ thống xảy ra. Vui lòng thử lại sau!');
            }
        });
    }

    // 5. Cập nhật Header cho các trang Auth nếu người dùng đã đăng nhập trước đó
    updateAuthPagesHeader();
});

function updateAuthPagesHeader() {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');

    const isRegisterPage = window.location.pathname.includes('register.html');
    const authLinksId = isRegisterPage ? 'register-auth-links' : 'login-auth-links';
    const cartBtnId = isRegisterPage ? 'register-cart-btn' : 'login-cart-btn';

    const authLinks = document.getElementById(authLinksId);
    const cartBtn = document.getElementById(cartBtnId);

    if (token && userStr) {
        const currentUser = JSON.parse(userStr);
        let userDisplay = `<strong style="color: white;">${currentUser.fullName.toUpperCase()}</strong>`;

        if (currentUser.role !== 'CUSTOMER') {
            userDisplay += ` | <a href="/pages/AdminPage/product.html" style="font-weight: 600; color: white; text-decoration: none;">Quản trị</a>`;
        }

        userDisplay += ` | <a href="#" id="auth-logout-btn" style="color: #ff383c; text-decoration: none; margin-left: 6px;">Đăng xuất</a>`;

        if (authLinks) {
            authLinks.innerHTML = userDisplay;

            const logoutBtn = document.getElementById('auth-logout-btn');
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

        if (cartBtn) {
            if (currentUser.role === 'CUSTOMER') {
                cartBtn.style.display = 'flex';
            } else {
                cartBtn.style.display = 'none';
            }
        }
    } else {
        if (cartBtn) {
            cartBtn.style.display = 'none';
        }
    }
}