# ☕ Coffee Order System - POS Frontend

Website Order Quán Cà Phê chuyên nghiệp với ReactJS, Vite và Tailwind CSS.

## 🚀 Tính Năng

### Dashboard

- ✅ Hiển thị danh sách 12 bàn với trạng thái realtime
- 🟢 **Trống** - Bàn sẵn sàng
- 🟡 **Đang Order** - Đang có khách order
- 🔴 **Chờ Thanh Toán** - Chờ thanh toán
- 📊 Thống kê số lượng bàn theo từng trạng thái

### Trang Order Theo Bàn

**Menu (Phần A)**

- 🎨 Hiển thị món dạng card với hình ảnh đẹp
- 🔍 Tìm kiếm món theo tên
- 🏷️ Lọc theo danh mục: Cà phê / Trà / Trà sữa / Đá xay
- ⚙️ Modal tùy chỉnh món:
  - Chọn số lượng
  - Mức đường (0%, 50%, 100%)
  - Mức đá (Không đá / Ít đá / Bình thường)
  - Topping (nhiều lựa chọn)
  - Ghi chú tùy chỉnh
- ⌨️ Shortcut: Ctrl+Enter để thêm nhanh

**Order List (Phần B)**

- 📝 Hiển thị danh sách món đã order
- ✏️ Sửa số lượng món
- 🗑️ Xóa món
- ⏳ Đánh dấu trạng thái: Đang làm / Đã ra món
- 💰 Tính tổng tiền realtime

**Payment (Phần C)**

- 💵 Tự động tính tổng tiền
- 🎁 Giảm giá theo % hoặc số tiền cố định
- 🎯 Xác nhận thanh toán
- 🖨️ In hóa đơn (mock)
- 📊 Thống kê món: Tổng món / Đã hoàn thành / Đang làm

### Tính Năng Nâng Cao

- 🌓 **Dark Mode** - Chế độ tối bảo vệ mắt
- 💾 **LocalStorage** - Lưu trữ order tự động
- 🔔 **Toast Notifications** - Thông báo thân thiện
- ✨ **Animations** - Hiệu ứng mượt mà
- 📱 **Responsive** - Tương thích mọi thiết bị
- 🎨 **POS Design** - Giao diện chuyên nghiệp

## 🛠️ Công Nghệ

- **React 18** - UI Library
- **Vite** - Build tool siêu nhanh
- **Tailwind CSS** - Utility-first CSS
- **React Router** - Routing
- **Context API** - State management
- **LocalStorage** - Data persistence

## 📦 Cài Đặt

### Yêu cầu

- Node.js 16+
- npm hoặc yarn

### Các bước cài đặt

```bash
# 1. Di chuyển vào thư mục project
cd "c:\Users\ADMIN\OneDrive\Máy tính\New folder"

# 2. Cài đặt dependencies
npm install

# 3. Chạy development server
npm run dev

# 4. Mở trình duyệt tại http://localhost:5173
```

### Build Production

```bash
npm run build
npm run preview
```

## 📁 Cấu Trúc Project

```
coffee-order-system/
├── src/
│   ├── components/          # Các component UI
│   │   ├── DarkModeToggle.jsx
│   │   ├── MenuCard.jsx
│   │   ├── MenuItemModal.jsx
│   │   ├── OrderList.jsx
│   │   ├── PaymentSection.jsx
│   │   ├── TableCard.jsx
│   │   └── Toast.jsx
│   ├── context/             # State management
│   │   └── OrderContext.jsx
│   ├── data/                # Mock data
│   │   └── menuData.js
│   ├── pages/               # Các trang chính
│   │   ├── Dashboard.jsx
│   │   └── OrderPage.jsx
│   ├── App.jsx              # Root component
│   ├── main.jsx             # Entry point
│   └── index.css            # Global styles
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
└── postcss.config.js
```

## 🎯 Hướng Dẫn Sử Dụng

### 1. Chọn Bàn

- Từ Dashboard, click vào bàn bất kỳ để bắt đầu order

### 2. Order Món

- Tìm kiếm hoặc lọc món theo danh mục
- Click vào món để mở modal tùy chỉnh
- Chọn số lượng, đường, đá, topping
- Bấm "Thêm Vào Order" hoặc nhấn Ctrl+Enter

### 3. Quản Lý Order

- Sửa số lượng món bằng nút ✏️
- Xóa món bằng nút 🗑️
- Đánh dấu món đã hoàn thành bằng icon ⏳/✅

### 4. Thanh Toán

- Nhập giảm giá nếu có (% hoặc VNĐ)
- Bấm "In Hóa Đơn" để xem hóa đơn
- Bấm "Xác Nhận Thanh Toán" để hoàn tất
- Bàn tự động reset về trạng thái Trống

### 5. Dark Mode

- Click icon 🌙/☀️ ở góc trên bên phải để chuyển đổi

## 🎨 Tùy Chỉnh

### Thay đổi màu sắc

Chỉnh sửa file `tailwind.config.js`:

```js
colors: {
  coffee: {...},  // Màu cà phê
  mint: {...}     // Màu mint
}
```

### Thêm món mới

Chỉnh sửa file `src/data/menuData.js`:

```js
{
  id: 19,
  name: 'Món Mới',
  category: 'coffee',
  price: 35000,
  image: 'url-hình-ảnh',
  description: 'Mô tả món'
}
```

### Thay đổi số lượng bàn

Chỉnh sửa trong `src/context/OrderContext.jsx`:

```js
Array.from({ length: 12 }, ...) // Đổi 12 thành số bàn mong muốn
```

## 🚀 Tính Năng Sắp Tới (Có thể mở rộng)

- 📱 PWA support
- 🖨️ Kết nối máy in hóa đơn thật
- 👥 Quản lý nhân viên
- 📈 Báo cáo doanh thu
- 🔐 Xác thực người dùng
- 🌐 Backend API integration
- 📱 Mobile app version

## 📝 License

MIT License - Sử dụng tự do cho mục đích cá nhân và thương mại.

## 💡 Credits

Developed with ❤️ using React, Vite & Tailwind CSS

---

**Happy Coding! ☕**
