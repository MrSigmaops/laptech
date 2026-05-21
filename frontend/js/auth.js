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

    // 2. Mock Test Form Đăng Nhập (Bổ sung sau khi làm Backend)
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            alert("Chức năng kết nối API đăng nhập sẽ được xử lý ở bước làm Node.js tiếp theo!");
        });
    }

    // 3. Mock Test Form Đăng Ký
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', (e) => {
            e.preventDefault();
            alert("Chức năng tạo tài khoản mới vào MongoDB đang đợi bạn viết Backend!");
        });
    }
});