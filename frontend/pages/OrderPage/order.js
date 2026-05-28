// File: frontend/pages/OrderPage/order.js

const PHONE_REGEX = /^(0|\+84)(3[2-9]|5[6|8|9]|7[0|6-9]|8[0-6|8|9]|9[0-4|6-9])[0-9]{7}$/;
let currentCoupon = null;
let currentDiscount = 0;
let currentSubTotal = 0;
let availableCoupons = [];

document.addEventListener('DOMContentLoaded', () => {
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

    prefillCustomerInfo(user);

    const checkoutItems = JSON.parse(localStorage.getItem('checkoutItems') || '[]');
    if (checkoutItems.length === 0) {
        alert('Không có sản phẩm nào để thanh toán!');
        window.location.href = '../CartPage/index.html';
        return;
    }

    renderCheckoutItems(checkoutItems);
    fetchAvailableCoupons();

    const couponSelect = document.getElementById('order-coupon-select');
    if (couponSelect) {
        couponSelect.addEventListener('change', () => {
            const selectedCode = couponSelect.value;
            const couponInput = document.getElementById('order-coupon-code');
            if (couponInput) couponInput.value = selectedCode;
            applyCoupon(checkoutItems);
        });
    }

    const btnConfirm = document.getElementById('btn-confirm-order');
    if (btnConfirm) {
        btnConfirm.addEventListener('click', () => {
            submitOrder(checkoutItems);
        });
    }

    const btnApplyCoupon = document.getElementById('btn-apply-coupon');
    if (btnApplyCoupon) {
        btnApplyCoupon.addEventListener('click', () => {
            applyCoupon(checkoutItems);
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

async function fetchAvailableCoupons() {
    try {
        const response = await fetch('/api/coupons/active');
        const data = await response.json();
        if (!response.ok) {
            console.warn('Không thể lấy danh sách mã giảm giá:', data.message);
            return;
        }
        availableCoupons = data.coupons || [];
        populateCouponSelect();
    } catch (error) {
        console.error('Lỗi khi tải mã khuyến mãi:', error);
    }
}

function populateCouponSelect() {
    const select = document.getElementById('order-coupon-select');
    if (!select) return;
    select.innerHTML = '<option value="">-- Chọn mã khuyến mãi --</option>';
    // Filter coupons that meet subtotal condition
    const applicable = availableCoupons.filter(c => (c.minOrderValue || 0) <= currentSubTotal);
    if (applicable.length === 0) {
        const opt = document.createElement('option');
        opt.value = '';
        opt.innerText = 'Không có mã phù hợp';
        opt.disabled = true;
        select.appendChild(opt);
        return;
    }

    applicable.forEach(coupon => {
        const option = document.createElement('option');
        option.value = coupon.code;
        const valText = coupon.type === 'PERCENT' ? `${coupon.value}%` : new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(coupon.value);
        const minText = coupon.minOrderValue ? ` (Tối thiểu ${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(coupon.minOrderValue)})` : '';
        option.innerText = `${coupon.code} - ${coupon.name} - ${valText}${minText}`;
        select.appendChild(option);
    });
}

function renderCheckoutItems(items) {
    const listContainer = document.getElementById('checkout-products-list');
    const totalPriceEl = document.getElementById('checkout-total-price');
    const discountRow = document.getElementById('checkout-discount-row');
    const discountPriceEl = document.getElementById('checkout-discount-price');

    if (!listContainer) return;

    currentSubTotal = 0;
    listContainer.innerHTML = items.map(item => {
        const itemTotal = item.price * item.quantity;
        currentSubTotal += itemTotal;
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

    if (discountRow && currentDiscount > 0) {
        discountRow.style.display = 'flex';
        discountPriceEl.innerText = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(currentDiscount);
    } else if (discountRow) {
        discountRow.style.display = 'none';
    }

    if (totalPriceEl) {
        const finalTotal = Math.max(0, currentSubTotal - currentDiscount);
        totalPriceEl.innerText = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(finalTotal);
    }
    // Update coupon select (available coupons may depend on subtotal)
    populateCouponSelect();
}

async function applyCoupon(items) {
    const couponCode = document.getElementById('order-coupon-code')?.value.trim();
    const messageEl = document.getElementById('coupon-message');

    if (!couponCode) {
        if (messageEl) {
            messageEl.innerText = 'Vui lòng nhập mã giảm giá.';
            messageEl.style.color = '#dc2626';
        }
        return;
    }

    try {
        const response = await fetch(`/api/coupons/validate?code=${encodeURIComponent(couponCode)}&total=${currentSubTotal}`);
        const data = await response.json();
        if (!response.ok) {
            if (messageEl) {
                messageEl.innerText = data.message || 'Mã giảm giá không hợp lệ.';
                messageEl.style.color = '#dc2626';
            }
            currentCoupon = null;
            currentDiscount = 0;
            renderCheckoutItems(items);
            return;
        }

        currentCoupon = data.coupon;
        currentDiscount = data.discountAmount || 0;
        if (messageEl) {
            messageEl.innerText = `Áp dụng mã thành công: -${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(currentDiscount)}`;
            messageEl.style.color = '#1e3a8a';
        }

        renderCheckoutItems(items);
    } catch (error) {
        console.error('Lỗi khi áp dụng mã giảm giá:', error);
        if (messageEl) {
            messageEl.innerText = 'Không thể kiểm tra mã giảm giá lúc này, vui lòng thử lại sau.';
            messageEl.style.color = '#dc2626';
        }
    }
}

async function submitOrder(checkoutItems) {
    const token = localStorage.getItem('token');
    const receiverName = document.getElementById('order-receiver-name').value.trim();
    const receiverPhone = document.getElementById('order-receiver-phone').value.trim();
    const city = document.getElementById('order-city').value;
    const shippingAddress = document.getElementById('order-shipping-address').value.trim();
    const note = document.getElementById('order-note').value.trim();
    const couponCode = currentCoupon?.code || '';

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
        isBuyNow,
        couponCode
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
