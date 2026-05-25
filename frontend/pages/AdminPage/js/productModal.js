document.addEventListener("DOMContentLoaded", () => {
    // 1. Lấy tham số truy vấn từ URL
    const urlParams = new URLSearchParams(window.location.search);
    const action = urlParams.get('action') || 'view'; // view, edit, create
    const productId = urlParams.get('id');

    const token = localStorage.getItem('token');
    if (!token) {
        alert('Hết phiên làm việc, vui lòng đăng nhập.');
        window.location.href = '/pages/LoginPage';
        return;
    }

    // 2. Thiết lập giao diện theo chế độ hành động (action)
    setupProductFormMode(action, productId, token);

    // 3. Sự kiện nút quay lại & hủy bỏ
    const btnBack = document.getElementById('btn-back');
    if (btnBack) {
        btnBack.addEventListener('click', () => {
            window.location.href = 'product.html';
        });
    }

    const btnCancel = document.getElementById('btn-cancel');
    if (btnCancel) {
        btnCancel.addEventListener('click', () => {
            window.location.href = 'product.html';
        });
    }

    // 4. Xử lý tải ảnh lên Cloudinary
    const fileInput = document.getElementById('product-image-file');
    const btnUploadTrigger = document.getElementById('btn-upload-trigger');
    const uploadStatus = document.getElementById('upload-status');
    const imgUrlInput = document.getElementById('product-image-url');
    const imgPreview = document.getElementById('product-image-preview');
    const previewPlaceholder = document.getElementById('preview-placeholder');

    if (btnUploadTrigger && fileInput) {
        btnUploadTrigger.addEventListener('click', () => {
            fileInput.click();
        });

        fileInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            // Kiểm tra kích thước hình ảnh tối thiểu 300x300px
            const validation = await validateImageDimensions(file, 300, 300);
            if (!validation.valid) {
                alert(validation.message);
                fileInput.value = ''; // Reset input file
                return;
            }

            if (uploadStatus) uploadStatus.style.display = 'block';

            const formData = new FormData();
            formData.append('image', file);

            try {
                const response = await fetch('/api/products/upload', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    },
                    body: formData
                });

                const result = await response.json();
                if (uploadStatus) uploadStatus.style.display = 'none';

                if (!response.ok) {
                    alert(result.message || 'Lỗi khi tải ảnh lên!');
                    return;
                }

                // Gán link ảnh vào input URL và cập nhật ảnh preview
                if (imgUrlInput) {
                    imgUrlInput.value = result.imageUrl;
                }
                if (imgPreview) {
                    imgPreview.src = result.imageUrl;
                    imgPreview.style.display = 'block';
                }
                if (previewPlaceholder) {
                    previewPlaceholder.style.display = 'none';
                }

                alert('Tải ảnh lên thành công!');
            } catch (error) {
                console.error('Lỗi khi tải ảnh lên Cloudinary:', error);
                if (uploadStatus) uploadStatus.style.display = 'none';
                alert('Lỗi kết nối tới máy chủ khi tải ảnh lên!');
            }
        });
    }

    // 5. Đồng bộ khi sửa link ảnh trực tiếp bằng tay
    if (imgUrlInput) {
        imgUrlInput.addEventListener('input', () => {
            const val = imgUrlInput.value.trim();
            if (val) {
                if (imgPreview) {
                    imgPreview.src = val;
                    imgPreview.style.display = 'block';
                }
                if (previewPlaceholder) {
                    previewPlaceholder.style.display = 'none';
                }
            } else {
                if (imgPreview) {
                    imgPreview.style.display = 'none';
                }
                if (previewPlaceholder) {
                    previewPlaceholder.style.display = 'block';
                }
            }
        });
    }

    // 6. Xử lý lưu form (Thêm mới hoặc Cập nhật)
    const productForm = document.getElementById('product-form');
    if (productForm) {
        productForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (action === 'view') return;

            const name = document.getElementById('product-name').value.trim();
            const brand = document.getElementById('product-brand').value;
            const basePrice = document.getElementById('product-price').value;
            const totalSale = document.getElementById('product-sold').value || 0;
            const imageUrl = document.getElementById('product-image-url').value.trim();
            const description = document.getElementById('product-description').value.trim();

            if (!name || !brand || !basePrice || !imageUrl) {
                alert('Vui lòng nhập đầy đủ thông tin bắt buộc (Tên, Thương hiệu, Giá gốc, Hình ảnh)!');
                return;
            }

            const bodyData = {
                name,
                brand,
                basePrice: Number(basePrice),
                totalSale: Number(totalSale),
                imageUrl,
                description
            };

            try {
                let url = '/api/products';
                let method = 'POST';

                if (action === 'edit' && productId) {
                    url = `/api/products/${productId}`;
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
                    alert(result.message || 'Lỗi khi lưu sản phẩm!');
                    return;
                }

                alert(action === 'create' ? 'Thêm sản phẩm mới thành công!' : 'Cập nhật sản phẩm thành công!');
                window.location.href = 'product.html';

            } catch (error) {
                console.error('Lỗi khi lưu sản phẩm:', error);
                alert('Lỗi hệ thống khi kết nối tới máy chủ!');
            }
        });
    }
});

async function setupProductFormMode(action, productId, token) {
    const pageTitle = document.getElementById('page-title');
    const breadcrumbText = document.getElementById('breadcrumb-text');
    const btnSubmit = document.getElementById('btn-submit');
    const btnCancel = document.getElementById('btn-cancel');

    // Các thành phần trong Card Header
    const headerName = document.getElementById('header-product-name');
    const headerBrand = document.getElementById('header-product-brand');
    const headerPrice = document.getElementById('header-product-price');

    // Điền dữ liệu mặc định ban đầu cho Header
    headerName.innerText = 'Sản Phẩm';
    headerBrand.innerText = 'Chi Tiết';
    headerPrice.innerText = 'Laptech Store';

    if (action === 'create') {
        pageTitle.innerText = 'Thêm Sản Phẩm Mới';
        breadcrumbText.innerText = 'Sản Phẩm / Thêm Mới';
        btnSubmit.innerText = 'Lưu sản phẩm';
        btnSubmit.style.background = '#00b000'; // Xanh lá

        headerName.innerText = 'Sản Phẩm Mới';
        headerBrand.innerText = 'Chọn Thương Hiệu bên dưới';
        headerPrice.innerText = 'Nhập giá bán bên dưới';
        return;
    }

    if (!productId) {
        alert('Thiếu mã sản phẩm (ID)!');
        window.location.href = 'product.html';
        return;
    }

    try {
        const response = await fetch(`/api/products/${productId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            const errData = await response.json();
            alert(errData.message || 'Không thể tìm thấy thông tin sản phẩm này!');
            window.location.href = 'product.html';
            return;
        }

        const product = await response.json();

        // Điền dữ liệu vào form
        document.getElementById('product-name').value = product.name || '';
        document.getElementById('product-brand').value = product.brand || '';
        document.getElementById('product-price').value = product.basePrice || 0;
        document.getElementById('product-sold').value = product.totalSale || 0;
        document.getElementById('product-image-url').value = product.imageUrl || '';
        document.getElementById('product-description').value = product.description || '';

        // Hiển thị ảnh xem trước
        const imgPreview = document.getElementById('product-image-preview');
        const previewPlaceholder = document.getElementById('preview-placeholder');
        if (product.imageUrl) {
            if (imgPreview) {
                imgPreview.src = product.imageUrl;
                imgPreview.style.display = 'block';
            }
            if (previewPlaceholder) {
                previewPlaceholder.style.display = 'none';
            }
        }

        // Điền thông tin vào Card Header
        headerName.innerText = product.name;
        headerBrand.innerText = product.brand;
        headerPrice.innerText = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(product.basePrice);

        if (action === 'view') {
            pageTitle.innerText = 'Chi Tiết Sản Phẩm';
            breadcrumbText.innerText = 'Sản Phẩm / Chi Tiết Sản Phẩm';

            // Vô hiệu hóa tất cả input, select, textarea
            const inputs = document.querySelectorAll('#product-form input, #product-form select, #product-form textarea');
            inputs.forEach(el => el.setAttribute('disabled', 'disabled'));

            // Ẩn nút chọn file và upload ảnh
            const btnUploadTrigger = document.getElementById('btn-upload-trigger');
            if (btnUploadTrigger) btnUploadTrigger.style.display = 'none';

            // Ẩn nút lưu và đổi tên nút hủy thành "Quay lại"
            if (btnSubmit) btnSubmit.style.display = 'none';
            if (btnCancel) {
                btnCancel.innerText = 'Quay lại';
                btnCancel.style.background = '#2563eb'; // Đổi thành màu xanh dương
            }
        } else if (action === 'edit') {
            pageTitle.innerText = 'Chỉnh Sửa Sản Phẩm';
            breadcrumbText.innerText = 'Sản Phẩm / Chỉnh Sửa';
            btnSubmit.innerText = 'Cập nhật sản phẩm';
            btnSubmit.style.background = '#ff8000'; // Cam
        }

    } catch (error) {
        console.error('Lỗi khi tải thông tin chi tiết sản phẩm:', error);
        alert('Lỗi kết nối tới máy chủ khi tải chi tiết sản phẩm!');
        window.location.href = 'product.html';
    }
}

// Hàm validate kích thước hình ảnh tối thiểu (phía client)
function validateImageDimensions(file, minWidth = 300, minHeight = 300) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = function (e) {
            const img = new Image();
            img.onload = function () {
                if (img.width < minWidth || img.height < minHeight) {
                    resolve({ 
                        valid: false, 
                        message: `Kích thước hình ảnh không hợp lệ (${img.width}x${img.height}px). Yêu cầu tối thiểu là ${minWidth}x${minHeight}px để đảm bảo chất lượng lấp đầy khung hình!` 
                    });
                } else {
                    resolve({ valid: true, width: img.width, height: img.height });
                }
            };
            img.onerror = function() {
                resolve({ valid: false, message: 'Định dạng tệp tin hình ảnh không hợp lệ!' });
            };
            img.src = e.target.result;
        };
        reader.onerror = function() {
            resolve({ valid: false, message: 'Không thể đọc tệp tin hình ảnh!' });
        };
        reader.readAsDataURL(file);
    });
}

