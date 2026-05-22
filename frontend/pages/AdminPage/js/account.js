// File: frontend/pages/AdminPage/js/account.js
let currentPage = 1;
const limit = 5;

document.addEventListener("DOMContentLoaded", () => {
    // 1. Tải danh sách người dùng đầu tiên
    fetchUsers(currentPage);

    // 2. Gắn sự kiện nút thêm người dùng mới
    const btnAddUser = document.getElementById('btn-add-user');
    if (btnAddUser) {
        btnAddUser.addEventListener('click', () => {
            window.location.href = 'userModal.html?action=create';
        });
    }

    // 3. Bộ lọc và Tìm kiếm
    const filterRole = document.getElementById('filter-role');
    if (filterRole) {
        filterRole.addEventListener('change', () => {
            currentPage = 1;
            fetchUsers(currentPage);
        });
    }

    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        let timeout = null;
        searchInput.addEventListener('input', () => {
            clearTimeout(timeout);
            timeout = setTimeout(() => {
                currentPage = 1;
                fetchUsers(currentPage);
            }, 300);
        });
    }
});

async function fetchUsers(page) {
    const token = localStorage.getItem('token');
    const userTableBody = document.getElementById('user-table-body');
    const userPagination = document.getElementById('user-pagination');

    if (!token) {
        alert('Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại!');
        window.location.href = '/pages/LoginPage';
        return;
    }

    if (userTableBody) {
        userTableBody.innerHTML = `<tr><td colspan="7" style="text-align: center;">Đang tải dữ liệu...</td></tr>`;
    }

    const roleFilter = document.getElementById('filter-role')?.value || '';
    const searchQuery = document.getElementById('search-input')?.value || '';

    try {
        // Gọi API có phân trang kèm tham số tìm kiếm và bộ lọc vai trò
        let url = `/api/users?page=${page}&limit=${limit}&search=${encodeURIComponent(searchQuery)}&role=${encodeURIComponent(roleFilter)}`;

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.status === 401 || response.status === 403) {
            alert('Bạn không có quyền thực hiện hành động này!');
            window.location.href = '../../index.html';
            return;
        }

        const data = await response.json();

        if (!response.ok) {
            alert(data.message || 'Lỗi khi lấy danh sách người dùng');
            return;
        }

        const users = data.users || [];
        const pagination = data.pagination || { totalPages: 1, currentPage: 1 };

        // Hiển thị dữ liệu lên bảng
        renderUserTable(users);

        // Hiển thị phần phân trang
        renderPagination(pagination.totalPages, page);

    } catch (error) {
        console.error('Lỗi fetch người dùng:', error);
        if (userTableBody) {
            userTableBody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: red;">Lỗi kết nối tới máy chủ!</td></tr>`;
        }
    }
}

function renderUserTable(users) {
    const userTableBody = document.getElementById('user-table-body');
    if (!userTableBody) return;

    if (users.length === 0) {
        userTableBody.innerHTML = `<tr><td colspan="7" style="text-align: center;">Không tìm thấy người dùng nào phù hợp.</td></tr>`;
        return;
    }

    userTableBody.innerHTML = users.map(user => {
        const statusBadge = user.isLock
            ? `<span style="background-color: #ffe5e5; color: #ff383c; padding: 6px 10px; border-radius: 4px; font-weight: 600; font-size: 12px; display: inline-block;">Đã khóa</span>`
            : `<span style="background-color: #e5ffe5; color: #00b000; padding: 6px 10px; border-radius: 4px; font-weight: 600; font-size: 12px; display: inline-block;">Hoạt động</span>`;

        let roleStyle = 'background-color: #f1f1f1; color: #333;';
        if (user.role === 'IT') roleStyle = 'background-color: #e5f5ff; color: #0076ff;';
        else if (user.role === 'MANAGER') roleStyle = 'background-color: #f5e5ff; color: #7f00ff;';
        else if (user.role === 'STAFF') roleStyle = 'background-color: #fff9e5; color: #b08000;';
        else if (user.role === 'STORAGE') roleStyle = 'background-color: #e5fcf5; color: #00a86b;';
        else if (user.role === 'ACCOUNTING') roleStyle = 'background-color: #fff5e5; color: #ff8000;';

        const roleBadge = `<span style="padding: 4px 8px; border-radius: 4px; font-weight: 600; font-size: 12px; ${roleStyle}">${user.role}</span>`;

        return `
            <tr style="border-bottom: 1px solid #eee;">
                <td style="font-weight: 600; padding: 12px 15px;">${user.fullName}</td>
                <td style="padding: 12px 15px;">${user.phoneNumber}</td>
                <td style="padding: 12px 15px;">${user.email || '-'}</td>
                <td style="padding: 12px 15px;">${roleBadge}</td>
                <td style="padding: 12px 15px;">${user.city}</td>
                <td style="padding: 12px 15px;">${statusBadge}</td>
                <td style="padding: 12px 15px;">
                    <div style="display: flex; justify-content: center; align-items: center; gap: 12px;">
                        <button onclick="viewUser('${user._id}')" style="background: none; border: none; cursor: pointer; color: #0076ff; font-size: 16px; padding: 2px;" title="Xem chi tiết"><i class="fa-regular fa-eye"></i></button>
                        <button onclick="editUser('${user._id}')" style="background: none; border: none; cursor: pointer; color: #b08000; font-size: 16px; padding: 2px;" title="Chỉnh sửa"><i class="fa-solid fa-pen"></i></button>
                        <button onclick="deleteUserConfirm('${user._id}', '${user.fullName}')" style="background: none; border: none; cursor: pointer; color: #ff383c; font-size: 16px; padding: 2px;" title="Xóa"><i class="fa-solid fa-trash-can"></i></button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

function renderPagination(totalPages, currentPage) {
    const userPagination = document.getElementById('user-pagination');
    if (!userPagination) return;

    let html = '';

    // Nút Trước
    if (currentPage > 1) {
        html += `<span onclick="changePage(${currentPage - 1})" style="cursor: pointer; padding: 6px 12px; border: 1px solid #ddd; border-radius: 4px; user-select: none; background: #fff;">←</span>`;
    } else {
        html += `<span style="color: #ccc; padding: 6px 12px; border: 1px solid #eee; border-radius: 4px; user-select: none; cursor: not-allowed; background: #fafafa;">←</span>`;
    }

    // Các số trang
    for (let i = 1; i <= totalPages; i++) {
        if (i === currentPage) {
            html += `<span class="active-page" style="background-color: var(--primary-red, #ff383c); color: white; padding: 6px 12px; border-radius: 4px; font-weight: bold; border: 1px solid var(--primary-red, #ff383c); user-select: none;">${i}</span>`;
        } else {
            html += `<span onclick="changePage(${i})" style="cursor: pointer; padding: 6px 12px; border: 1px solid #ddd; border-radius: 4px; user-select: none; background: #fff;">${i}</span>`;
        }
    }

    // Nút Sau
    if (currentPage < totalPages) {
        html += `<span onclick="changePage(${currentPage + 1})" style="cursor: pointer; padding: 6px 12px; border: 1px solid #ddd; border-radius: 4px; user-select: none; background: #fff;">→</span>`;
    } else {
        html += `<span style="color: #ccc; padding: 6px 12px; border: 1px solid #eee; border-radius: 4px; user-select: none; cursor: not-allowed; background: #fafafa;">→</span>`;
    }

    userPagination.innerHTML = html;
}

function changePage(page) {
    currentPage = page;
    fetchUsers(currentPage);
}

// Các hàm toàn cục
function viewUser(id) {
    window.location.href = `userModal.html?action=view&id=${id}`;
}

function editUser(id) {
    window.location.href = `userModal.html?action=edit&id=${id}`;
}

async function deleteUserConfirm(id, name) {
    if (!confirm(`Bạn có chắc chắn muốn xóa người dùng "${name}" không? Hành động này không thể hoàn tác!`)) {
        return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
        alert('Hết phiên làm việc, vui lòng đăng nhập lại.');
        window.location.href = '/pages/LoginPage';
        return;
    }

    try {
        const response = await fetch(`/api/users/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (!response.ok) {
            alert(data.message || 'Lỗi khi xóa người dùng');
            return;
        }

        alert('Xóa người dùng thành công!');
        fetchUsers(currentPage);
    } catch (error) {
        console.error('Lỗi khi xóa người dùng:', error);
        alert('Lỗi hệ thống khi xóa người dùng');
    }
}

// Đưa ra phạm vi toàn cục để onclick hoạt động
window.changePage = changePage;
window.viewUser = viewUser;
window.editUser = editUser;
window.deleteUserConfirm = deleteUserConfirm;
