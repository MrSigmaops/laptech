document.addEventListener("DOMContentLoaded", () => {
    // 1. Lấy tham số truy vấn từ URL
    const urlParams = new URLSearchParams(window.location.search);
    const action = urlParams.get('action') || 'view'; // view, edit, create
    const userId = urlParams.get('id');

    const token = localStorage.getItem('token');
    if (!token) {
        alert('Hết phiên làm việc, vui lòng đăng nhập.');
        window.location.href = '/pages/LoginPage';
        return;
    }

    // 2. Điền danh sách tỉnh thành vào select user-city
    const userCitySelect = document.getElementById('user-city');
    if (userCitySelect && window.VIETNAM_CITIES) {
        window.VIETNAM_CITIES.forEach(city => {
            const option = document.createElement('option');
            option.value = city;
            option.textContent = city;
            userCitySelect.appendChild(option);
        });
    }

    // 3. Thiết lập giao diện theo vai trò hành động (action)
    setupFormMode(action, userId, token);

    // 4. Sự kiện nút quay lại & hủy bỏ
    const btnBack = document.getElementById('btn-back');
    if (btnBack) {
        btnBack.addEventListener('click', () => {
            window.location.href = 'account.html';
        });
    }

    const btnCancel = document.getElementById('btn-cancel');
    if (btnCancel) {
        btnCancel.addEventListener('click', () => {
            window.location.href = 'account.html';
        });
    }

    // 5. Xử lý lưu form (Thêm mới hoặc Cập nhật)
    const userForm = document.getElementById('user-form');
    if (userForm) {
        userForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (action === 'view') return;

            const fullName = document.getElementById('user-fullname').value.trim();
            const phoneNumber = document.getElementById('user-phone').value.trim();
            const email = document.getElementById('user-email').value.trim();
            const password = document.getElementById('user-password').value;
            const role = document.getElementById('user-role').value;
            const city = document.getElementById('user-city').value;
            const address = document.getElementById('user-address').value.trim();
            const status = document.getElementById('user-status').value;
            const isLock = (status === 'locked');

            // Kiểm tra phía client
            if (!fullName || !phoneNumber || !city || !address || !role) {
                alert('Vui lòng nhập đầy đủ thông tin bắt buộc!');
                return;
            }

            const phoneRegex = /^(0|\+84)(3[2-9]|5[6|8|9]|7[0|6-9]|8[0-6|8|9]|9[0-4|6-9])[0-9]{7}$/;
            if (!phoneRegex.test(phoneNumber)) {
                alert('Số điện thoại không hợp lệ. Vui lòng nhập đúng định dạng 10 số của Việt Nam!');
                return;
            }

            if (action === 'create' && !password) {
                alert('Mật khẩu là bắt buộc khi tạo tài khoản mới!');
                return;
            }

            if (password && password.length < 6) {
                alert('Mật khẩu phải có ít nhất 6 ký tự!');
                return;
            }

            // Chuẩn bị body gửi lên server
            const bodyData = {
                fullName,
                phoneNumber,
                email: email || undefined,
                role,
                city,
                address,
                isLock
            };

            // Nếu nhập mật khẩu mới gửi lên
            if (password) {
                bodyData.password = password;
            }

            try {
                let url = '/api/users';
                let method = 'POST';

                if (action === 'edit' && userId) {
                    url = `/api/users/${userId}`;
                    method = 'PUT';
                }

                const response = await fetch(url, {
                    method: method,
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(bodyData)
                });

                const result = await response.json();

                if (!response.ok) {
                    alert(result.message || 'Lỗi lưu thông tin người dùng!');
                    return;
                }

                alert(action === 'create' ? 'Tạo người dùng mới thành công!' : 'Cập nhật thông tin thành công!');
                window.location.href = 'account.html';

            } catch (error) {
                console.error('Lỗi khi lưu thông tin:', error);
                alert('Lỗi hệ thống khi kết nối tới máy chủ!');
            }
        });
    }
});

async function setupFormMode(action, userId, token) {
    const pageTitle = document.getElementById('page-title');
    const breadcrumbText = document.getElementById('breadcrumb-text');
    const pwdGroup = document.getElementById('pwd-group');
    const pwdLabel = document.getElementById('pwd-label');
    const userPassword = document.getElementById('user-password');
    const btnSubmit = document.getElementById('btn-submit');
    const btnCancel = document.getElementById('btn-cancel');

    // Các thành phần trong Card Header
    const headerFullName = document.getElementById('header-fullname');
    const headerRole = document.getElementById('header-role');
    const headerPhone = document.getElementById('header-phone');

    // Điền động cho Card Header mặc định
    headerFullName.innerText = 'Tài Khoản';
    headerRole.innerText = 'Chi Tiết';
    headerPhone.innerText = 'Laptech System';

    if (action === 'create') {
        pageTitle.innerText = 'Thêm Tài Khoản Mới';
        breadcrumbText.innerText = 'Tài Khoản / Thêm Mới';
        pwdLabel.innerText = 'Mật Khẩu *';
        userPassword.setAttribute('required', 'required');
        btnSubmit.innerText = 'Tạo tài khoản';
        btnSubmit.style.background = '#00b000'; // Xanh lá

        headerFullName.innerText = 'Tài Khoản Mới';
        headerRole.innerText = 'Chọn Vai Trò bên dưới';
        headerPhone.innerText = 'Nhập số điện thoại bên dưới';
        return;
    }

    // Đối với view và edit, cần fetch thông tin người dùng từ backend
    if (!userId) {
        alert('Thiếu ID người dùng!');
        window.location.href = 'account.html';
        return;
    }

    try {
        const response = await fetch(`/api/users/${userId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            const errData = await response.json();
            alert(errData.message || 'Không thể tìm thấy thông tin người dùng này!');
            window.location.href = 'account.html';
            return;
        }

        const user = await response.json();

        // Điền dữ liệu vào form
        document.getElementById('user-fullname').value = user.fullName || '';
        document.getElementById('user-phone').value = user.phoneNumber || '';
        document.getElementById('user-email').value = user.email || '';
        document.getElementById('user-role').value = user.role || 'CUSTOMER';
        document.getElementById('user-city').value = user.city || '';
        document.getElementById('user-address').value = user.address || '';
        document.getElementById('user-status').value = user.isLock ? 'locked' : 'active';

        // Điền thông tin vào Card Header
        headerFullName.innerText = user.fullName;
        headerRole.innerText = user.role;
        headerPhone.innerText = user.phoneNumber;

        if (action === 'view') {
            pageTitle.innerText = 'Chi Tiết Tài Khoản';
            breadcrumbText.innerText = 'Tài Khoản / Chi Tiết Tài Khoản';

            // Ẩn trường mật khẩu
            if (pwdGroup) pwdGroup.style.display = 'none';

            // Vô hiệu hóa tất cả input, select, textarea
            const inputs = document.querySelectorAll('#user-form input, #user-form select, #user-form textarea');
            inputs.forEach(el => el.setAttribute('disabled', 'disabled'));

            // Ẩn nút lưu và đổi tên nút hủy thành "Quay lại"
            if (btnSubmit) btnSubmit.style.display = 'none';
            if (btnCancel) {
                btnCancel.innerText = 'Quay lại';
                btnCancel.style.background = '#2563eb'; // Đổi thành màu xanh dương
            }
        } else if (action === 'edit') {
            pageTitle.innerText = 'Chỉnh Sửa Tài Khoản';
            breadcrumbText.innerText = 'Tài Khoản / Chỉnh Sửa';
            pwdLabel.innerText = 'Đổi Mật Khẩu (Nếu có)';
            userPassword.removeAttribute('required');
            btnSubmit.innerText = 'Cập nhật tài khoản';
            btnSubmit.style.background = '#ff8000'; // Cam
        }

    } catch (error) {
        console.error('Lỗi lấy chi tiết người dùng:', error);
        alert('Lỗi kết nối tới máy chủ khi tải chi tiết tài khoản!');
        window.location.href = 'account.html';
    }
}
