// File: frontend/pages/OrderPage/order.js

const PHONE_REGEX = /^(0|\+84)(3[2-9]|5[6|8|9]|7[0|6-9]|8[0-6|8|9]|9[0-4|6-9])[0-9]{7}$/;

document.addEventListener("DOMContentLoaded", () => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');

    if (!token || !userStr) {
        alert('Vui lòng đăng nhập để tiến hành đặt hàng!');
        window.location.href = '/pages/LoginPage';
        return;
    }

    const user = JSON.parse(userStr);
    if (user.role !== 'CUSTOMER') {
        alert('Chỉ tài khoản Khách hàng mới có thể thực hiện đặt hàng!');
        window.location.href = '/';
        return;
    }

    // Prefill thông tin khách hàng
    prefillCustomerInfo(user);

    // Load các sản phẩm cần thanh toán
    const checkoutItems = JSON.parse(localStorage.getItem('checkoutItems') || '[]');
    if (checkoutItems.length === 0) {
        alert('Không có sản phẩm nào để thanh toán!');
        window.location.href = '../CartPage/index.html';
        return;
    }

    renderCheckoutItems(checkoutItems);

    // Sự kiện nút Xác nhận đặt hàng
    const btnConfirm = document.getElementById('btn-confirm-order');
    if (btnConfirm) {
        btnConfirm.addEventListener('click', () => {
            submitOrder(checkoutItems);
        });
    }
});

function prefillCustomerInfo(user) {
    const nameInput = document.getElementById('order-receiver-name');
    const phoneInput = document.getElementById('order-receiver-phone');
    const emailInput = document.getElementById('order-email');

    if (nameInput) nameInput.value = user.fullName || '';
    if (phoneInput) phoneInput.value = user.phoneNumber || '';
    if (emailInput) emailInput.value = user.email || '';
}

function renderCheckoutItems(items) {
    const listContainer = document.getElementById('checkout-products-list');
    const totalPriceEl = document.getElementById('checkout-total-price');
    if (!listContainer) return;

    let subTotal = 0;

    listContainer.innerHTML = items.map(item => {
        const itemTotal = item.price * item.quantity;
        subTotal += itemTotal;
        const formattedPrice = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.price);
        const formattedItemTotal = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(itemTotal);

        return `
            <div class="order-row" style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; display: flex; align-items: center; justify-content: space-between;">
                <div style="display: flex; align-items: center; gap: 15px;">
                    <img src="${item.imageUrl}" alt="${item.name}" style="width: 50px; height: 40px; object-fit: cover; border-radius: 4px;">
                    <div>
                        <div style="font-weight: 500; font-size: 15px;">${item.name}</div>
                        <small style="color: #666;">Số lượng: ${item.quantity} x ${formattedPrice}</small>
                    </div>
                </div>
                <div style="font-weight: 600; color: #475569;">${formattedItemTotal}</div>
            </div>
        `;
    }).join('');

    if (totalPriceEl) {
        totalPriceEl.innerText = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(subTotal);
    }
}

async function submitOrder(checkoutItems) {
    const token = localStorage.getItem('token');
    const receiverName = document.getElementById('order-receiver-name').value.trim();
    const receiverPhone = document.getElementById('order-receiver-phone').value.trim();
    const city = document.getElementById('order-city').value;
    const shippingAddress = document.getElementById('order-shipping-address').value.trim();
    const note = document.getElementById('order-note').value.trim();

    // Lấy phương thức thanh toán được chọn
    const paymentRadio = document.querySelector('input[name="payment-method"]:checked');
    const paymentMethod = paymentRadio ? paymentRadio.value : 'COD';

    if (!receiverName) {
        alert('Vui lòng nhập họ tên người nhận hàng!');
        return;
    }

    if (!receiverPhone) {
        alert('Vui lòng nhập số điện thoại người nhận!');
        return;
    }

    if (!PHONE_REGEX.test(receiverPhone)) {
        alert('Số điện thoại nhận hàng không hợp lệ! Vui lòng kiểm tra lại.');
        return;
    }

    if (!city) {
        alert('Vui lòng chọn Tỉnh/Thành phố giao hàng!');
        return;
    }

    if (!shippingAddress) {
        alert('Vui lòng nhập địa chỉ giao hàng cụ thể!');
        return;
    }

    const isBuyNow = localStorage.getItem('isBuyNow') === 'true';

    const payload = {
        city,
        shippingAddress,
        receiverName,
        receiverPhone,
        paymentMethod,
        note,
        items: checkoutItems.map(item => ({ productId: item.productId, quantity: item.quantity })),
        isBuyNow
    };

    try {
        const btnConfirm = document.getElementById('btn-confirm-order');
        if (btnConfirm) {
            btnConfirm.disabled = true;
            btnConfirm.innerText = 'ĐANG XỬ LÝ...';
        }

        const response = await fetch('/api/orders', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const result = await response.json();

        if (!response.ok) {
            alert(result.message || 'Đặt hàng không thành công!');
            if (btnConfirm) {
                btnConfirm.disabled = false;
                btnConfirm.innerText = 'XÁC NHẬN';
            }
            return;
        }

        alert('Đặt hàng thành công!');
        localStorage.removeItem('checkoutItems');
        localStorage.removeItem('isBuyNow');
        
        // Điều hướng tới trang lịch sử đơn hàng
        window.location.href = '../OrderHistory/index.html';

    } catch (error) {
        console.error('Lỗi khi đặt hàng:', error);
        alert('Lỗi kết nối tới máy chủ khi đặt hàng!');
        const btnConfirm = document.getElementById('btn-confirm-order');
        if (btnConfirm) {
            btnConfirm.disabled = false;
            btnConfirm.innerText = 'XÁC NHẬN';
        }
    }
}
