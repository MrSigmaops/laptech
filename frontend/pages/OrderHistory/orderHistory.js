// File: frontend/pages/OrderHistory/orderHistory.js

document.addEventListener("DOMContentLoaded", () => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');

    if (!token || !userStr) {
        alert('Vui lòng đăng nhập để xem lịch sử mua hàng!');
        window.location.href = '/pages/LoginPage';
        return;
    }

    const user = JSON.parse(userStr);
    if (user.role !== 'CUSTOMER') {
        alert('Chỉ tài khoản Khách hàng mới có thể xem lịch sử mua hàng!');
        window.location.href = '/';
        return;
    }

    // Tải danh sách đơn hàng
    fetchMyOrders();
});

async function fetchMyOrders() {
    const token = localStorage.getItem('token');
    const container = document.getElementById('orders-list-container');
    if (!container) return;

    try {
        const response = await fetch('/api/orders/my-orders', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            container.innerHTML = `<div class="no-orders"><p style="color: red;">Không thể tải lịch sử đơn hàng của bạn!</p></div>`;
            return;
        }

        const orders = await response.json();

        if (orders.length === 0) {
            container.innerHTML = `
                <div class="no-orders">
                    <p>Bạn chưa đặt đơn hàng nào tại Laptech.</p>
                    <a href="/" class="btn-shop-now">Mua sắm ngay</a>
                </div>
            `;
            return;
        }

        renderOrders(orders);

    } catch (error) {
        console.error('Lỗi lấy lịch sử đơn hàng:', error);
        container.innerHTML = `<div class="no-orders"><p style="color: red;">Lỗi kết nối máy chủ!</p></div>`;
    }
}

function renderOrders(orders) {
    const container = document.getElementById('orders-list-container');
    if (!container) return;

    container.innerHTML = orders.map(order => {
        const formattedDate = new Date(order.createdAt).toLocaleString('vi-VN');
        const formattedTotal = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(order.totalPrice);

        // Trạng thái hiển thị tiếng Việt và class CSS tương ứng
        let statusText = 'Chờ duyệt';
        let badgeClass = 'status-pending';
        if (order.status === 'CONFIRMED') {
            statusText = 'Đã duyệt';
            badgeClass = 'status-confirmed';
        } else if (order.status === 'CANCELED') {
            statusText = 'Đã hủy';
            badgeClass = 'status-canceled';
        }

        // Tạo danh sách sản phẩm hiển thị trong card
        const itemsHtml = order.products.map(item => {
            const formattedPrice = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.price);
            const showReviewLink = order.status === 'CONFIRMED';
            const reviewLinkHtml = showReviewLink
                ? `<a href="/detailProduct.html?id=${item.productId}#write-review-container" style="display: inline-block; margin-top: 8px; font-size: 13px; color: #ff8000; font-weight: bold; text-decoration: none;"><i class="fa-solid fa-star" style="margin-right: 4px;"></i> Viết đánh giá</a>`
                : '';

            return `
                <div class="order-item-row" style="display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid #f1f5f9;">
                    <div class="item-info" style="display: flex; gap: 12px; align-items: center;">
                        <a href="/detailProduct.html?id=${item.productId}">
                            <img src="${item.imageUrl}" alt="${item.name}" style="width: 60px; height: 50px; object-fit: cover; border-radius: 6px;">
                        </a>
                        <div class="item-detail">
                            <h4 style="margin: 0; font-size: 15px; font-weight: 600;">
                                <a href="/detailProduct.html?id=${item.productId}" style="color: #1e293b; text-decoration: none;">${item.name}</a>
                            </h4>
                            <p style="margin: 4px 0 0; font-size: 13px; color: #64748b;">Số lượng: ${item.quantity} x ${formattedPrice}</p>
                            ${reviewLinkHtml}
                        </div>
                    </div>
                    <div class="item-price" style="font-weight: 600; color: #475569;">
                        ${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.price * item.quantity)}
                    </div>
                </div>
            `;
        }).join('');

        // Nút hủy đơn (chỉ hiển thị khi trạng thái là PENDING)
        const showCancelBtn = order.status === 'PENDING';
        const cancelBtnHtml = showCancelBtn
            ? `<button class="cancel-btn" onclick="cancelCustomerOrder('${order._id}')"><i class="fa-solid fa-rectangle-xmark"></i> Hủy đơn</button>`
            : '';

        // Dịch hình thức thanh toán
        let payMethodText = 'Thanh toán COD';
        if (order.paymentMethod === 'CREDIT_CARD') {
            payMethodText = 'Thẻ tín dụng';
        } else if (order.paymentMethod === 'INTERNET_BANKING') {
            payMethodText = 'Chuyển khoản Banking';
        }

        return `
            <div class="order-card">
                <div class="order-card-header">
                    <div>
                        <span class="order-id">Mã đơn: #${order._id.substring(order._id.length - 8).toUpperCase()}</span>
                        <span class="order-date" style="margin-left: 15px;"><i class="fa-regular fa-clock"></i> ${formattedDate}</span>
                    </div>
                    <span class="status-badge ${badgeClass}">${statusText}</span>
                </div>

                <div class="order-items">
                    ${itemsHtml}
                </div>

                <div class="order-card-footer">
                    <div class="order-shipping-details">
                        <p><strong>Người nhận:</strong> ${order.receiverName}</p>
                        <p><strong>Số điện thoại:</strong> ${order.receiverPhone}</p>
                        <p><strong>Tỉnh/Thành phố:</strong> ${order.city}</p>
                        <p><strong>Địa chỉ:</strong> ${order.shippingAddress}</p>
                        <p><strong>Thanh toán:</strong> ${payMethodText}</p>
                        ${order.note ? `<p><strong>Ghi chú:</strong> ${order.note}</p>` : ''}
                    </div>

                    <div class="order-summary-row">
                        <div>
                            ${cancelBtnHtml}
                        </div>
                        <div style="text-align: right;">
                            <span style="font-size: 14px; color: #64748b; font-weight: 500;">Tổng thanh toán:</span>
                            <div class="order-total-price">${formattedTotal}</div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

async function cancelCustomerOrder(orderId) {
    if (!confirm('Bạn có chắc chắn muốn hủy đơn hàng này không? Mặt hàng trong đơn sẽ được hoàn lại kho hàng.')) {
        return;
    }

    const token = localStorage.getItem('token');
    try {
        const response = await fetch(`/api/orders/${orderId}/cancel`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (!response.ok) {
            alert(data.message || 'Lỗi khi hủy đơn hàng!');
            return;
        }

        alert('Đã hủy đơn hàng thành công!');
        fetchMyOrders();

    } catch (error) {
        console.error('Lỗi khi hủy đơn:', error);
        alert('Lỗi kết nối tới máy chủ khi hủy đơn hàng');
    }
}

// Gắn hàm hủy đơn vào cửa sổ toàn cục
window.cancelCustomerOrder = cancelCustomerOrder;
