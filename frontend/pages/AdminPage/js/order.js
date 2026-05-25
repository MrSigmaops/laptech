// File: frontend/pages/AdminPage/js/order.js

let ordersList = [];

document.addEventListener("DOMContentLoaded", () => {
    // Tải danh sách đơn hàng
    fetchAdminOrders();

    // Lắng nghe sự kiện tìm kiếm & lọc trạng thái
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            renderOrderTable();
        });
    }

    const filterStatus = document.getElementById('filter-status');
    if (filterStatus) {
        filterStatus.addEventListener('change', () => {
            renderOrderTable();
        });
    }
});

async function fetchAdminOrders() {
    const token = localStorage.getItem('token');
    const tbody = document.getElementById('order-table-body');
    if (tbody) {
        tbody.innerHTML = `<tr><td colspan="8" style="text-align: center;">Đang tải dữ liệu đơn hàng...</td></tr>`;
    }

    try {
        const response = await fetch('/api/orders', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.status === 401 || response.status === 403) {
            alert('Bạn không có quyền truy cập trang quản lý đơn hàng!');
            window.location.href = '../../index.html';
            return;
        }

        if (!response.ok) {
            alert('Không thể tải danh sách đơn hàng!');
            return;
        }

        ordersList = await response.json();
        renderOrderTable();

    } catch (error) {
        console.error('Lỗi khi tải đơn hàng:', error);
        if (tbody) {
            tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; color: red;">Lỗi kết nối máy chủ!</td></tr>`;
        }
    }
}

function renderOrderTable() {
    const tbody = document.getElementById('order-table-body');
    if (!tbody) return;

    const searchQuery = document.getElementById('search-input')?.value.toLowerCase().trim() || '';
    const statusFilter = document.getElementById('filter-status')?.value || '';

    // Lọc cục bộ
    const filtered = ordersList.filter(order => {
        // Lọc trạng thái
        if (statusFilter && order.status !== statusFilter) {
            return false;
        }

        // Lọc tìm kiếm
        if (searchQuery) {
            const nameMatch = order.receiverName && order.receiverName.toLowerCase().includes(searchQuery);
            const phoneMatch = order.receiverPhone && order.receiverPhone.includes(searchQuery);
            const idMatch = order._id.toLowerCase().includes(searchQuery);
            return nameMatch || phoneMatch || idMatch;
        }

        return true;
    });

    if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" style="text-align: center;">Không tìm thấy đơn hàng nào phù hợp.</td></tr>`;
        return;
    }

    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const isManagerOrIt = user.role === 'MANAGER' || user.role === 'IT';

    tbody.innerHTML = filtered.map(order => {
        const orderShortId = order._id.substring(order._id.length - 8).toUpperCase();
        const customerName = order.customerId ? `${order.customerId.fullName} (${order.customerId.email})` : 'Ẩn danh';
        const receiverDetail = `${order.receiverName} - ${order.receiverPhone}<br><small style="color: #666;">${order.shippingAddress}, ${order.city}</small>`;
        const formattedTotal = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(order.totalPrice);
        const formattedDate = new Date(order.createdAt).toLocaleString('vi-VN');
        
        let statusText = 'Chờ duyệt';
        let badgeClass = 'status-pending';
        if (order.status === 'CONFIRMED') {
            statusText = 'Đã duyệt';
            badgeClass = 'status-confirmed';
        } else if (order.status === 'CANCELED') {
            statusText = 'Đã hủy';
            badgeClass = 'status-canceled';
        }

        const employeeName = order.employeeId ? order.employeeId.fullName : '-';

        // Xây dựng các nút thao tác
        let actionsHtml = `
            <button onclick="viewOrderDetails('${order._id}')" style="background: none; border: none; cursor: pointer; color: #0076ff; font-size: 16px; margin-right: 8px;" title="Xem chi tiết đơn hàng"><i class="fa-regular fa-eye"></i></button>
        `;

        if (order.status === 'PENDING' && isManagerOrIt) {
            actionsHtml += `
                <button onclick="confirmOrder('${order._id}')" style="background: none; border: none; cursor: pointer; color: #15803d; font-size: 16px; margin-right: 8px;" title="Duyệt đơn hàng"><i class="fa-solid fa-circle-check"></i></button>
                <button onclick="cancelOrder('${order._id}')" style="background: none; border: none; cursor: pointer; color: #dc2626; font-size: 16px;" title="Hủy đơn hàng"><i class="fa-solid fa-circle-xmark"></i></button>
            `;
        }

        return `
            <tr style="border-bottom: 1px solid #eee;">
                <td style="padding: 12px 15px; font-weight: bold; color: #1e3a8a;">#${orderShortId}</td>
                <td style="padding: 12px 15px; font-size: 13px;">${customerName}</td>
                <td style="padding: 12px 15px; font-size: 13px;">${receiverDetail}</td>
                <td style="padding: 12px 15px; font-weight: 600; color: #a52424;">${formattedTotal}</td>
                <td style="padding: 12px 15px; font-size: 13px;">${formattedDate}</td>
                <td style="padding: 12px 15px;"><span class="status-badge ${badgeClass}">${statusText}</span></td>
                <td style="padding: 12px 15px; font-size: 13px; font-weight: 500;">${employeeName}</td>
                <td style="padding: 12px 15px; text-align: center;">${actionsHtml}</td>
            </tr>
        `;
    }).join('');
}

function viewOrderDetails(orderId) {
    const order = ordersList.find(o => o._id === orderId);
    if (!order) return;

    document.getElementById('modal-order-id').innerText = `Chi Tiết Đơn Hàng #${order._id.substring(order._id.length - 8).toUpperCase()}`;
    document.getElementById('detail-receiver-name').innerText = order.receiverName;
    document.getElementById('detail-receiver-phone').innerText = order.receiverPhone;
    document.getElementById('detail-city').innerText = order.city;
    document.getElementById('detail-address').innerText = order.shippingAddress;

    let payMethodText = 'COD';
    if (order.paymentMethod === 'CREDIT_CARD') payMethodText = 'Thẻ tín dụng';
    else if (order.paymentMethod === 'INTERNET_BANKING') payMethodText = 'Internet Banking';
    document.getElementById('detail-payment-method').innerText = payMethodText;
    document.getElementById('detail-note').innerText = order.note || 'Không có';

    const formattedSub = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(order.subTotal);
    const formattedTotal = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(order.totalPrice);

    document.getElementById('detail-subtotal').innerText = formattedSub;
    document.getElementById('detail-total-price').innerText = formattedTotal;

    const list = document.getElementById('detail-products-list');
    list.innerHTML = order.products.map(item => {
        const itemPrice = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.price);
        const itemTotal = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.price * item.quantity);
        return `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid #eee;">
                <div style="display: flex; align-items: center; gap: 10px;">
                    <img src="${item.imageUrl}" alt="${item.name}" style="width: 40px; height: 32px; object-fit: cover; border-radius: 2px;">
                    <div>
                        <div style="font-weight: 500; font-size: 13px;">${item.name}</div>
                        <small style="color: #666;">${item.quantity} x ${itemPrice}</small>
                    </div>
                </div>
                <div style="font-weight: 600; font-size: 13px; color: #475569;">${itemTotal}</div>
            </div>
        `;
    }).join('');

    document.getElementById('order-detail-modal').style.display = 'block';
}

function closeOrderModal() {
    document.getElementById('order-detail-modal').style.display = 'none';
}

async function confirmOrder(orderId) {
    if (!confirm('Bạn có chắc chắn muốn duyệt đơn hàng này không?')) return;

    const token = localStorage.getItem('token');
    try {
        const response = await fetch(`/api/orders/${orderId}/confirm`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();
        if (!response.ok) {
            alert(data.message || 'Lỗi khi duyệt đơn hàng!');
            return;
        }

        alert('Duyệt đơn hàng thành công!');
        fetchAdminOrders();

    } catch (error) {
        console.error('Lỗi khi duyệt đơn:', error);
        alert('Lỗi kết nối tới máy chủ!');
    }
}

async function cancelOrder(orderId) {
    if (!confirm('Bạn có chắc chắn muốn hủy đơn hàng này? Số lượng tồn kho sản phẩm sẽ được hoàn lại.')) return;

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

        alert('Hủy đơn hàng thành công!');
        fetchAdminOrders();

    } catch (error) {
        console.error('Lỗi khi hủy đơn:', error);
        alert('Lỗi kết nối máy chủ!');
    }
}

// Khai báo global cho các event onclick
window.viewOrderDetails = viewOrderDetails;
window.closeOrderModal = closeOrderModal;
window.confirmOrder = confirmOrder;
window.cancelOrder = cancelOrder;
