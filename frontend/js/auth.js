document.addEventListener("DOMContentLoaded", () => {
    console.log("Hệ thống Auth Laptech đã kích hoạt!");

    // Cập nhật Header động cho tất cả các trang nhúng file auth.js (như Giỏ hàng, Đặt hàng, Lịch sử mua hàng)
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    if (token && userStr) {
        const currentUser = JSON.parse(userStr);

        // 1. Hỗ trợ cấu trúc header cũ
        const userDiv = document.querySelector('.header-right .user');
        if (userDiv) {
            const userSpan = userDiv.querySelector('span') || userDiv;
            userSpan.innerHTML = `<a href="/pages/UserPage/index.html" style="color: white; text-decoration: none;">${currentUser.fullName.toUpperCase()} (${currentUser.role})</a> | <span id="auth-logout-link" style="color: #ff383c; font-weight: bold; cursor: pointer; margin-left: 6px;">ĐĂNG XUẤT</span>`;

            const logoutLink = document.getElementById('auth-logout-link');
            if (logoutLink) {
                logoutLink.addEventListener('click', (e) => {
                    e.stopPropagation();
                    if (confirm('Bạn có chắc chắn muốn đăng xuất không?')) {
                        localStorage.removeItem('token');
                        localStorage.removeItem('user');
                        window.location.href = '/';
                    }
                });
            }
        }

        // 2. Hỗ trợ cấu trúc header mới (giống index.html)
        const homeAuthLinks = document.getElementById('home-auth-links');
        const homeCartBtn = document.getElementById('home-cart-btn');
        if (homeAuthLinks) {
            let userDisplay = `<a href="/pages/UserPage/index.html" style="color: white; text-decoration: none;"><strong style="color: white;">${currentUser.fullName.toUpperCase()}</strong></a>`;
            if (currentUser.role !== 'CUSTOMER') {
                userDisplay += ` | <a href="/pages/AdminPage/product.html" style="font-weight: 600; color: white; text-decoration: none;">Quản trị</a>`;
            }
            userDisplay += ` | <a href="#" id="home-logout-btn" style="color: #ff383c; text-decoration: none; margin-left: 6px;">Đăng xuất</a>`;
            homeAuthLinks.innerHTML = userDisplay;

            const logoutBtn = document.getElementById('home-logout-btn');
            if (logoutBtn) {
                logoutBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    if (confirm('Bạn có chắc chắn muốn đăng xuất không?')) {
                        localStorage.removeItem('token');
                        localStorage.removeItem('user');
                        window.location.href = '/';
                    }
                });
            }
        }
        if (homeCartBtn) {
            if (currentUser.role === 'CUSTOMER') {
                homeCartBtn.style.display = 'flex';
            } else {
                homeCartBtn.style.display = 'none';
            }
        }

        // Tự động thêm Lịch sử mua hàng vào navbar
        if (currentUser.role === 'CUSTOMER') {
            const navbar = document.querySelector('.navbar') || document.querySelector('.main-nav ul') || document.querySelector('.main-nav .container');
            if (navbar && !navbar.querySelector('a[href*="OrderHistory"]')) {
                const path = window.location.pathname;
                let orderHistoryPath = '../OrderHistory/index.html';
                if (path.includes('/OrderHistory/')) {
                    orderHistoryPath = './index.html';
                }

                if (navbar.tagName === 'UL') {
                    const li = document.createElement('li');
                    li.innerHTML = `<a href="${orderHistoryPath}" style="color: white; font-weight: 700;">LỊCH SỬ MUA HÀNG</a>`;
                    navbar.appendChild(li);
                } else {
                    const a = document.createElement('a');
                    a.href = orderHistoryPath;
                    a.style.color = 'white';
                    a.style.fontWeight = '700';
                    a.innerText = 'LỊCH SỬ MUA HÀNG';
                    navbar.appendChild(a);
                }
            }
        }
    }

    // 1. Logic ẩn / hiện mật khẩu bằng con mắt
    const togglePasswordIcons = document.querySelectorAll('.toggle-password');

    togglePasswordIcons.forEach(icon => {
        icon.addEventListener('click', function () {
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

    // 6. Xử lý Quên mật khẩu click
    const forgotLink = document.querySelector('.forgot-link');
    if (forgotLink) {
        forgotLink.addEventListener('click', (e) => {
            e.preventDefault();
            showForgotPasswordStep1();
        });
    }
});

// Các hàm cho luồng Quên mật khẩu
function showForgotPasswordStep1() {
    const authContainer = document.querySelector('.auth-container');
    if (!authContainer) return;

    authContainer.innerHTML = `
        <h2 class="auth-title" style="margin-bottom: 10px;">QUÊN MẬT KHẨU</h2>
        <p style="text-align: center; margin-bottom: 24px; color: #64748b; font-size: 13.5px; line-height: 1.5;">
            Vui lòng nhập số điện thoại đăng ký tài khoản. Hệ thống sẽ gửi một mã xác thực OTP qua SMS để bạn đặt lại mật khẩu.
        </p>

        <form id="forgot-form-step1">
            <div class="form-group">
                <label>Số điện thoại</label>
                <input type="text" id="forgot-phone" class="form-control"
                    placeholder="Nhập số điện thoại của bạn" required>
            </div>

            <button type="submit" class="btn-primary btn-block" style="margin-top: 20px;">Gửi mã OTP</button>

            <div class="text-center" style="margin-top: 20px;">
                <a href="#" id="back-to-login" style="color: #8c1e21; text-decoration: none; font-weight: 700; font-size: 14px;">
                    <i class="fa-solid fa-arrow-left"></i> Quay lại đăng nhập
                </a>
            </div>
        </form>
    `;

    document.getElementById('back-to-login').addEventListener('click', (e) => {
        e.preventDefault();
        window.location.reload();
    });

    const form = document.getElementById('forgot-form-step1');
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const phoneNumber = document.getElementById('forgot-phone').value.trim();

        const phoneRegex = /^(0|\+84)(3[2-9]|5[6|8|9]|7[0|6-9]|8[0-6|8|9]|9[0-4|6-9])[0-9]{7}$/;
        if (!phoneRegex.test(phoneNumber)) {
            alert('Số điện thoại không hợp lệ! Vui lòng nhập đúng định dạng 10 số của Việt Nam.');
            return;
        }

        try {
            const response = await fetch('/api/users/forgot-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ phoneNumber })
            });

            const result = await response.json();

            if (!response.ok) {
                alert(result.message || 'Không thể gửi mã OTP!');
                return;
            }

            alert(result.message);
            showForgotPasswordStep2(phoneNumber, result.otp);

        } catch (error) {
            console.error('Lỗi khi gọi API forgot-password:', error);
            alert('Có lỗi hệ thống xảy ra. Vui lòng thử lại sau!');
        }
    });
}

function showForgotPasswordStep2(phoneNumber, testOtp) {
    const authContainer = document.querySelector('.auth-container');
    if (!authContainer) return;

    let helperText = '';
    if (testOtp) {
        helperText = `<p style="text-align: center; color: #10b981; font-weight: bold; margin-bottom: 20px; font-size: 14px;">
            Mã OTP: <span style="font-size: 18px; letter-spacing: 2px; color: #ff8d28;">${testOtp}</span>
        </p>`;
    }

    authContainer.innerHTML = `
        <h2 class="auth-title" style="margin-bottom: 10px;">XÁC THỰC OTP</h2>
        <p style="text-align: center; margin-bottom: 24px; color: #64748b; font-size: 13.5px; line-height: 1.5;">
            Mã OTP đã được gửi tới số điện thoại <strong>${phoneNumber}</strong>. Vui lòng nhập mã OTP để tiếp tục.
        </p>
        ${helperText}

        <form id="forgot-form-step2">
            <div class="form-group">
                <label>Mã xác thực (OTP)</label>
                <input type="text" id="forgot-otp" class="form-control"
                    placeholder="Nhập mã OTP gồm 6 chữ số" required maxlength="6">
            </div>

            <button type="submit" class="btn-primary btn-block" style="margin-top: 20px;">Xác nhận mã OTP</button>

            <div class="text-center" style="margin-top: 20px; display: flex; justify-content: space-between; font-size: 13.5px;">
                <a href="#" id="back-to-step1" style="color: #64748b; text-decoration: none; font-weight: 500;">
                    Nhập lại số điện thoại
                </a>
                <a href="#" id="back-to-login" style="color: #8c1e21; text-decoration: none; font-weight: 700;">
                    Đăng nhập
                </a>
            </div>
        </form>
    `;

    document.getElementById('back-to-login').addEventListener('click', (e) => {
        e.preventDefault();
        window.location.reload();
    });

    document.getElementById('back-to-step1').addEventListener('click', (e) => {
        e.preventDefault();
        showForgotPasswordStep1();
    });

    const form = document.getElementById('forgot-form-step2');
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const otp = document.getElementById('forgot-otp').value.trim();

        if (otp.length !== 6) {
            alert('Mã OTP phải có đúng 6 chữ số!');
            return;
        }

        try {
            const response = await fetch('/api/users/verify-otp', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ phoneNumber, otp })
            });

            const result = await response.json();

            if (!response.ok) {
                alert(result.message || 'Mã OTP xác thực không chính xác!');
                return;
            }

            alert(result.message);
            showForgotPasswordStep3(phoneNumber, otp);

        } catch (error) {
            console.error('Lỗi khi gọi API verify-otp:', error);
            alert('Có lỗi hệ thống xảy ra. Vui lòng thử lại sau!');
        }
    });
}

function showForgotPasswordStep3(phoneNumber, otp) {
    const authContainer = document.querySelector('.auth-container');
    if (!authContainer) return;

    authContainer.innerHTML = `
        <h2 class="auth-title" style="margin-bottom: 10px;">MẬT KHẨU MỚI</h2>
        <p style="text-align: center; margin-bottom: 24px; color: #64748b; font-size: 13.5px; line-height: 1.5;">
            Xác thực OTP thành công. Vui lòng thiết lập mật khẩu mới cho tài khoản của bạn.
        </p>

        <form id="forgot-form-step3">
            <div class="form-group">
                <label>Mật khẩu mới</label>
                <div class="password-input" style="position: relative;">
                    <input type="password" id="forgot-new-pwd" class="form-control"
                        placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)" required>
                    <i class="fa-regular fa-eye toggle-password" data-target="forgot-new-pwd" style="position: absolute; right: 15px; top: 22px; cursor: pointer; color: #64748b;"></i>
                </div>
            </div>

            <div class="form-group" style="margin-top: 15px;">
                <label>Xác nhận mật khẩu mới</label>
                <div class="password-input" style="position: relative;">
                    <input type="password" id="forgot-new-pwd-confirm" class="form-control"
                        placeholder="Nhập lại mật khẩu mới" required>
                    <i class="fa-regular fa-eye toggle-password" data-target="forgot-new-pwd-confirm" style="position: absolute; right: 15px; top: 22px; cursor: pointer; color: #64748b;"></i>
                </div>
            </div>

            <button type="submit" class="btn-primary btn-block" style="margin-top: 24px;">Đổi mật khẩu</button>
        </form>
    `;

    const togglePasswordIcons = authContainer.querySelectorAll('.toggle-password');
    togglePasswordIcons.forEach(icon => {
        icon.addEventListener('click', function () {
            const targetId = this.getAttribute('data-target');
            const passwordInput = document.getElementById(targetId);

            if (passwordInput.type === 'password') {
                passwordInput.type = 'text';
                this.classList.remove('fa-eye');
                this.classList.add('fa-eye-slash');
            } else {
                passwordInput.type = 'password';
                this.classList.remove('fa-eye-slash');
                this.classList.add('fa-eye');
            }
        });
    });

    const form = document.getElementById('forgot-form-step3');
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const newPassword = document.getElementById('forgot-new-pwd').value;
        const confirmPassword = document.getElementById('forgot-new-pwd-confirm').value;

        if (newPassword.length < 6) {
            alert('Mật khẩu mới phải có ít nhất 6 ký tự!');
            return;
        }

        if (newPassword !== confirmPassword) {
            alert('Mật khẩu xác nhận không khớp!');
            return;
        }

        try {
            const response = await fetch('/api/users/reset-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ phoneNumber, otp, newPassword })
            });

            const result = await response.json();

            if (!response.ok) {
                alert(result.message || 'Đặt lại mật khẩu thất bại!');
                return;
            }

            alert(result.message || 'Đổi mật khẩu thành công! Bạn có thể đăng nhập bằng mật khẩu mới.');
            window.location.reload();

        } catch (error) {
            console.error('Lỗi khi gọi API reset-password:', error);
            alert('Có lỗi hệ thống xảy ra. Vui lòng thử lại sau!');
        }
    });
}

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
        let userDisplay = `<a href="/pages/UserPage/index.html" style="color: white; text-decoration: none;"><strong style="color: white;">${currentUser.fullName.toUpperCase()}</strong></a>`;

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