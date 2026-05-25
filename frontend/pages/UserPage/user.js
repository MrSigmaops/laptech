document.addEventListener('DOMContentLoaded', () => {
    // 1. Kiểm tra đăng nhập
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');

    if (!token || !userStr) {
        alert('Vui lòng đăng nhập để xem thông tin!');
        window.location.href = '../LoginPage/index.html';
        return;
    }

    const currentUser = JSON.parse(userStr);
    
    // 2. Load Tỉnh/Thành Phố
    const cities = [
        "An Giang", "Bà Rịa - Vũng Tàu", "Bắc Giang", "Bắc Kạn", "Bạc Liêu",
        "Bắc Ninh", "Bến Tre", "Bình Định", "Bình Dương", "Bình Phước",
        "Bình Thuận", "Cà Mau", "Cần Thơ", "Cao Bằng", "Đà Nẵng",
        "Đắk Lắk", "Đắk Nông", "Điện Biên", "Đồng Nai", "Đồng Tháp",
        "Gia Lai", "Hà Giang", "Hà Nam", "Hà Nội", "Hà Tĩnh",
        "Hải Dương", "Hải Phòng", "Hậu Giang", "Hòa Bình", "Hưng Yên",
        "Khánh Hòa", "Kiên Giang", "Kon Tum", "TP. Hồ Chí Minh"
    ];

    const citySelect = document.getElementById('user-city');
    cities.forEach(city => {
        const option = document.createElement('option');
        option.value = city;
        option.textContent = city;
        if (currentUser.city === city) {
            option.selected = true;
        }
        citySelect.appendChild(option);
    });

    // 3. Fill User Info
    document.getElementById('user-fullname').value = currentUser.fullName || '';
    document.getElementById('user-phone').value = currentUser.phoneNumber || '';
    document.getElementById('user-email').value = currentUser.email || '';
    document.getElementById('user-address').value = currentUser.address || '';

    // 4. Handle form submit
    const form = document.getElementById('user-profile-form');
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const btn = document.getElementById('user-update-btn');
        btn.textContent = 'ĐANG CẬP NHẬT...';
        btn.disabled = true;

        const payload = {
            fullName: document.getElementById('user-fullname').value,
            email: document.getElementById('user-email').value,
            city: document.getElementById('user-city').value,
            address: document.getElementById('user-address').value
        };

        const password = document.getElementById('user-password').value;
        if (password) {
            if (password.length < 6) {
                alert('Mật khẩu phải có ít nhất 6 ký tự');
                btn.textContent = 'CẬP NHẬT THÔNG TIN';
                btn.disabled = false;
                return;
            }
            payload.password = password;
        }

        try {
            const response = await fetch('/api/users/me', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            const result = await response.json();

            if (response.ok) {
                alert('Cập nhật thông tin thành công!');
                // Update local storage
                localStorage.setItem('user', JSON.stringify(result.user));
                if (result.token) {
                    localStorage.setItem('token', result.token);
                }
                // Reload to reflect changes (like in Header)
                window.location.reload();
            } else {
                alert(result.message || 'Có lỗi xảy ra!');
            }
        } catch (error) {
            console.error('Lỗi khi cập nhật:', error);
            alert('Lỗi kết nối tới máy chủ!');
        } finally {
            btn.textContent = 'CẬP NHẬT THÔNG TIN';
            btn.disabled = false;
        }
    });
});
