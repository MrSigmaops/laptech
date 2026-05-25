// File: frontend/pages/CartPage/cart.js

document.addEventListener("DOMContentLoaded", () => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');

    if (!token || !userStr) {
        alert('Vui lòng đăng nhập với vai trò Khách hàng để xem giỏ hàng!');
        window.location.href = '/pages/LoginPage';
        return;
    }

    const user = JSON.parse(userStr);
    if (user.role !== 'CUSTOMER') {
        alert('Chỉ tài khoản Khách hàng mới có thể sử dụng giỏ hàng!');
        window.location.href = '/';
        return;
    }

    // Tải giỏ hàng
    fetchCart();

    // Sự kiện khi bấm ĐẶT HÀNG
    const orderBtn = document.querySelector('.order-btn');
    if (orderBtn) {
        orderBtn.addEventListener('click', () => {
            proceedToCheckout();
        });
    }
});

let cartData = null;
let selectedProductIds = new Set();

async function fetchCart() {
    const token = localStorage.getItem('token');
    const cartList = document.getElementById('cart-list');

    if (cartList) {
        cartList.innerHTML = `<div style="text-align: center; padding: 40px; font-size: 20px;">Đang tải giỏ hàng...</div>`;
    }

    try {
        const response = await fetch('/api/cart', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            alert('Không thể lấy thông tin giỏ hàng!');
            return;
        }

        cartData = await response.json();
        
        // Mặc định chọn tất cả sản phẩm
        if (cartData.items && cartData.items.length > 0) {
            cartData.items.forEach(item => {
                if (item.productId) {
                    selectedProductIds.add(item.productId._id);
                }
            });
        }

        renderCart();
        updateSummary();

    } catch (error) {
        console.error('Lỗi lấy giỏ hàng:', error);
        if (cartList) {
            cartList.innerHTML = `<div style="text-align: center; padding: 40px; color: red;">Lỗi tải giỏ hàng!</div>`;
        }
    }
}

function renderCart() {
    const cartList = document.getElementById('cart-list');
    if (!cartList) return;

    if (!cartData || !cartData.items || cartData.items.length === 0) {
        cartList.innerHTML = `<div style="text-align: center; padding: 60px; font-size: 22px; color: #777;">
            Giỏ hàng của bạn đang trống. <a href="/" style="color: #a52424; text-decoration: underline;">Mua sắm ngay</a>
        </div>`;
        return;
    }

    cartList.innerHTML = cartData.items.map(item => {
        const product = item.productId;
        if (!product) return '';

        const isChecked = selectedProductIds.has(product._id) ? 'checked' : '';
        const itemPriceTotal = product.basePrice * item.quantity;
        const formattedPriceTotal = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(itemPriceTotal);

        return `
            <div class="cart-item" data-id="${product._id}">
                <div class="product-info">
                    <input type="checkbox" class="cart-item-checkbox" ${isChecked} onchange="toggleItemSelection('${product._id}', this.checked)" />
                    <img src="${product.imageUrl}" alt="${product.name}" style="object-fit: cover; height: 90px; border-radius: 4px;" />
                    <div class="product-detail">
                        <h3>${product.name}</h3>
                        <div style="font-size: 16px; color: #666; margin-bottom: 8px;">Đơn giá: ${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(product.basePrice)} (Kho còn: ${product.quantity})</div>
                        <button class="delete-btn" onclick="deleteCartItem('${product._id}')">
                            <i class="fa-solid fa-trash" style="color: #dc2626;"></i>
                        </button>
                    </div>
                </div>

                <div class="quantity">
                    <button onclick="changeQuantity('${product._id}', ${item.quantity - 1})">-</button>
                    <span>${item.quantity}</span>
                    <button onclick="changeQuantity('${product._id}', ${item.quantity + 1}, ${product.quantity})">+</button>
                </div>

                <div class="price" style="font-weight: 600; color: #a52424;">
                    ${formattedPriceTotal}
                </div>
            </div>
        `;
    }).join('');
}

function toggleItemSelection(productId, isChecked) {
    if (isChecked) {
        selectedProductIds.add(productId);
    } else {
        selectedProductIds.delete(productId);
    }
    updateSummary();
}

async function changeQuantity(productId, newQty, maxQty = 9999) {
    if (newQty < 1) {
        // Hỏi xóa
        if (confirm('Bạn muốn xóa sản phẩm này khỏi giỏ hàng?')) {
            deleteCartItem(productId);
        }
        return;
    }

    if (newQty > maxQty) {
        alert(`Rất tiếc, sản phẩm này chỉ còn tối đa ${maxQty} sản phẩm trong kho!`);
        return;
    }

    const token = localStorage.getItem('token');
    try {
        const response = await fetch('/api/cart', {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ productId, quantity: newQty })
        });

        const data = await response.json();
        if (!response.ok) {
            alert(data.message || 'Lỗi khi cập nhật số lượng');
            return;
        }

        cartData = data.cart;
        renderCart();
        updateSummary();

    } catch (error) {
        console.error('Lỗi khi sửa số lượng:', error);
        alert('Lỗi hệ thống khi sửa số lượng');
    }
}

async function deleteCartItem(productId) {
    const token = localStorage.getItem('token');
    try {
        const response = await fetch(`/api/cart/${productId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();
        if (!response.ok) {
            alert(data.message || 'Lỗi khi xóa sản phẩm');
            return;
        }

        selectedProductIds.delete(productId);
        cartData = data.cart;
        renderCart();
        updateSummary();

    } catch (error) {
        console.error('Lỗi khi xóa sản phẩm giỏ hàng:', error);
        alert('Lỗi hệ thống khi xóa sản phẩm');
    }
}

function updateSummary() {
    const summaryContainer = document.querySelector('.summary');
    if (!summaryContainer || !cartData || !cartData.items) return;

    let subTotal = 0;
    let selectedCount = 0;

    cartData.items.forEach(item => {
        const product = item.productId;
        if (product && selectedProductIds.has(product._id)) {
            subTotal += product.basePrice * item.quantity;
            selectedCount += item.quantity;
        }
    });

    const formattedSubtotal = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(subTotal);

    summaryContainer.innerHTML = `
        <div class="summary-row" style="font-size: 20px; font-weight: 500;">
            <span>Tạm tính</span>
            <span>${formattedSubtotal}</span>
        </div>

        <hr style="margin: 15px 0; border: 0; border-top: 1px solid #ddd;" />

        <div class="summary-row" style="font-size: 22px; font-weight: bold; color: #a52424;">
            <span>Tổng (${selectedCount} sản phẩm)</span>
            <span>${formattedSubtotal}</span>
        </div>

        <div class="payment-method" style="margin-top: 20px; font-size: 16px; color: #475569;">
            <i class="fa-solid fa-circle-info"></i> Bạn có thể thay đổi phương thức thanh toán và nhập địa chỉ giao hàng tại bước sau.
        </div>
    `;
}

function proceedToCheckout() {
    if (!cartData || !cartData.items || cartData.items.length === 0) {
        alert('Giỏ hàng trống!');
        return;
    }

    if (selectedProductIds.size === 0) {
        alert('Vui lòng chọn ít nhất 1 sản phẩm để đặt hàng!');
        return;
    }

    // Thu thập các sản phẩm được chọn để chuyển qua checkout
    const checkoutItems = [];
    cartData.items.forEach(item => {
        if (item.productId && selectedProductIds.has(item.productId._id)) {
            checkoutItems.push({
                productId: item.productId._id,
                name: item.productId.name,
                imageUrl: item.productId.imageUrl,
                price: item.productId.basePrice,
                quantity: item.quantity
            });
        }
    });

    // Lưu checkoutItems vào localStorage
    localStorage.setItem('checkoutItems', JSON.stringify(checkoutItems));
    localStorage.removeItem('isBuyNow');
    
    // Điều hướng sang trang xác nhận đơn hàng
    window.location.href = '../OrderPage/index.html';
}

// Khai báo global để gọi trực tiếp từ inline HTML onclick
window.toggleItemSelection = toggleItemSelection;
window.changeQuantity = changeQuantity;
window.deleteCartItem = deleteCartItem;
