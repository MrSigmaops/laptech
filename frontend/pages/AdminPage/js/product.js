// File: frontend/pages/AdminPage/js/product.js
let currentPage = 1;
const limit = 5;

document.addEventListener("DOMContentLoaded", () => {
    // 1. Khởi chạy danh sách sản phẩm
    fetchProducts(currentPage);

    // 2. Nút Thêm sản phẩm mới
    const btnAddProduct = document.getElementById('btn-add-product');
    if (btnAddProduct) {
        btnAddProduct.addEventListener('click', () => {
            window.location.href = 'productModal.html?action=create';
        });
    }

    const btnAddPromotion = document.getElementById('btn-add-promotion');
    if (btnAddPromotion) {
        btnAddPromotion.addEventListener('click', () => {
            window.location.href = 'productModal.html?action=createPromotion';
        });
    }

    // 3. Bộ lọc thương hiệu
    const filterBrand = document.getElementById('filter-brand');
    if (filterBrand) {
        filterBrand.addEventListener('change', () => {
            currentPage = 1;
            fetchProducts(currentPage);
        });
    }

    // 4. Tìm kiếm sản phẩm (debounce 300ms)
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        let timeout = null;
        searchInput.addEventListener('input', () => {
            clearTimeout(timeout);
            timeout = setTimeout(() => {
                currentPage = 1;
                fetchProducts(currentPage);
            }, 300);
        });
    }
});

async function fetchProducts(page) {
    const token = localStorage.getItem('token');
    const productTableBody = document.getElementById('product-table-body');
    const productPagination = document.getElementById('product-pagination');

    if (!token) {
        alert('Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại!');
        window.location.href = '/pages/LoginPage';
        return;
    }

    if (productTableBody) {
        productTableBody.innerHTML = `<tr><td colspan="7" style="text-align: center;">Đang tải dữ liệu...</td></tr>`;
    }

    const brandFilter = document.getElementById('filter-brand')?.value || '';
    const searchQuery = document.getElementById('search-input')?.value || '';

    try {
        let url = `/api/products?page=${page}&limit=${limit}&search=${encodeURIComponent(searchQuery)}&brand=${encodeURIComponent(brandFilter)}`;

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
            alert(data.message || 'Lỗi khi lấy danh sách sản phẩm');
            return;
        }

        const products = data.products || [];
        const pagination = data.pagination || { totalPages: 1, currentPage: 1 };

        renderProductTable(products);
        renderPagination(pagination.totalPages, page);

    } catch (error) {
        console.error('Lỗi fetch sản phẩm:', error);
        if (productTableBody) {
            productTableBody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: red;">Lỗi kết nối tới máy chủ!</td></tr>`;
        }
    }
}

function renderProductTable(products) {
    const productTableBody = document.getElementById('product-table-body');
    if (!productTableBody) return;

    if (products.length === 0) {
        productTableBody.innerHTML = `<tr><td colspan="7" style="text-align: center;">Không tìm thấy sản phẩm nào phù hợp.</td></tr>`;
        return;
    }

    productTableBody.innerHTML = products.map(product => {
        // Định dạng giá bán: 14.790.000 đ
        const formattedPrice = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(product.basePrice);
        const shortDesc = product.description && product.description.length > 60
            ? product.description.substring(0, 57) + '...'
            : (product.description || '-');

        return `
            <tr style="border-bottom: 1px solid #eee;">
                <td style="padding: 12px 15px;">
                    <img src="${product.imageUrl}" alt="${product.name}" style="width: 50px; height: 42px; object-fit: cover; border-radius: 4px;" loading="lazy">
                </td>
                <td style="font-weight: 600; padding: 12px 15px;">${product.name}</td>
                <td style="padding: 12px 15px;"><span style="background-color: #e5f5ff; color: #0076ff; padding: 4px 8px; border-radius: 4px; font-weight: 600; font-size: 12px;">${product.brand}</span></td>
                <td style="padding: 12px 15px; font-weight: 600; color: #1e3a8a;">${formattedPrice}</td>
                <td style="padding: 12px 15px;">${product.quantity}</td>
                <td style="padding: 12px 15px; max-width: 250px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${product.description || ''}">${shortDesc}</td>
                <td style="padding: 12px 15px;">
                    <div style="display: flex; justify-content: center; align-items: center; gap: 12px;">
                        <button onclick="viewProduct('${product._id}')" style="background: none; border: none; cursor: pointer; color: #0076ff; font-size: 16px; padding: 2px;" title="Xem chi tiết"><i class="fa-regular fa-eye"></i></button>
                        <button onclick="editProduct('${product._id}')" style="background: none; border: none; cursor: pointer; color: #b08000; font-size: 16px; padding: 2px;" title="Chỉnh sửa"><i class="fa-solid fa-pen"></i></button>
                        <button onclick="deleteProductConfirm('${product._id}', '${product.name}')" style="background: none; border: none; cursor: pointer; color: #ff383c; font-size: 16px; padding: 2px;" title="Xóa"><i class="fa-solid fa-trash-can"></i></button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

function renderPagination(totalPages, currentPage) {
    const productPagination = document.getElementById('product-pagination');
    if (!productPagination) return;

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
            html += `<span class="active-page" style="background-color: #1e3a8a; color: white; padding: 6px 12px; border-radius: 4px; font-weight: bold; border: 1px solid #1e3a8a; user-select: none;">${i}</span>`;
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

    productPagination.innerHTML = html;
}

function changePage(page) {
    currentPage = page;
    fetchProducts(currentPage);
}

function viewProduct(id) {
    window.location.href = `productModal.html?action=view&id=${id}`;
}

function editProduct(id) {
    window.location.href = `productModal.html?action=edit&id=${id}`;
}

async function deleteProductConfirm(id, name) {
    if (!confirm(`Bạn có chắc chắn muốn xóa sản phẩm "${name}" không? Hành động này không thể hoàn tác!`)) {
        return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
        alert('Hết phiên làm việc, vui lòng đăng nhập lại.');
        window.location.href = '/pages/LoginPage';
        return;
    }

    try {
        const response = await fetch(`/api/products/${id}`, {
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

        alert('Xóa sản phẩm thành công!');
        fetchProducts(currentPage);
    } catch (error) {
        console.error('Lỗi khi xóa sản phẩm:', error);
        alert('Lỗi hệ thống khi xóa sản phẩm');
    }
}

window.changePage = changePage;
window.viewProduct = viewProduct;
window.editProduct = editProduct;
window.deleteProductConfirm = deleteProductConfirm;
