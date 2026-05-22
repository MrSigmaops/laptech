// File: frontend/utils/constants.js
const VIETNAM_CITIES = [
  "An Giang", "Bà Rịa - Vũng Tàu", "Bắc Giang", "Bắc Kạn", "Bạc Liêu",
  "Bắc Ninh", "Bến Tre", "Bình Định", "Bình Dương", "Bình Phước",
  "Bình Thuận", "Cà Mau", "Cần Thơ", "Cao Bằng", "Đà Nẵng",
  "Đắk Lắk", "Đắk Nông", "Điện Biên", "Đồng Nai", "Đồng Tháp",
  "Gia Lai", "Hà Giang", "Hà Nam", "Hà Nội", "Hà Tĩnh",
  "Hải Dương", "Hải Phòng", "Hậu Giang", "Hòa Bình", "Hưng Yên",
  "Khánh Hòa", "Kiên Giang", "Kon Tum", "TP. Hồ Chí Minh"
];

const USER_ROLE = {
  CUSTOMER: 'CUSTOMER',
  STORAGE: 'STORAGE',
  STAFF: 'STAFF',
  MANAGER: 'MANAGER',
  IT: 'IT',
  ACCOUNTING: 'ACCOUNTING'
};

// Thiết lập toàn cục để sử dụng trực tiếp trong thẻ script truyền thống
window.VIETNAM_CITIES = VIETNAM_CITIES;
window.USER_ROLE = USER_ROLE;

// Export dạng module để dùng nếu có hệ thống import/export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { VIETNAM_CITIES, USER_ROLE };
}
