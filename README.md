# ☕ BOM COFFEE - Hệ Thống POS & Quản Lý Quán Cà Phê & Bàn Bi-a

Hệ thống quản lý bán hàng (POS - Point of Sale), theo dõi giờ chơi Bi-a, màn hình pha chế KDS (Kitchen Display System) thông minh tích hợp giọng nói tiếng Việt và báo cáo doanh thu đa chiều dành cho quán Cà phê & Câu lạc bộ Bi-a.

---

## 🚀 Tính Năng Nổi Bật

### 🖥️ 1. Sơ Đồ Bàn & Đặt Món (POS Order)
- **Hỗ trợ 2 loại bàn**: Bàn nước (DRINK) và Bàn Bi-a (BILLIARD).
- **Trạng thái bàn Realtime**: Trống (`EMPTY`), Đang phục vụ (`SERVING`), Đặt trước (`RESERVED`).
- **Thanh tìm kiếm & lọc danh mục**: Lọc nhanh món ăn / nước uống theo danh mục (Cà phê, Trà, Sữa chua, Đá xay...) kèm số lượng món.
- **Tùy chỉnh món nước (Drink Options)**:
  - Chọn lượng đá: 0%, 30%, 50%, 70%, 100%.
  - Chọn lượng đường: 0%, 30%, 50%, 70%, 100%.
  - Chọn Topping đi kèm (Trân châu, Khúc bạch, Thạch...).
  - Ghi chú riêng cho từng món.

### 🎱 2. Quản Lý Giờ Chơi Bi-a & Giá Giờ (Billiard Management)
- **Bắt đầu / Kết thúc tính giờ**: Theo dõi thời gian chơi chính xác theo từng giây.
- **Tự động tính tiền giờ**: Áp dụng cấu hình bảng giá bi-a theo giờ/khung giờ.
- **Hỗ trợ chơi nhiều phiên**: Lưu lịch sử các phiên chơi bi-a đã kết thúc trong cùng một đơn hàng.

### 👨‍🍳 3. Màn Hình Pha Chế KDS (Kitchen Display System) & Giọng Đọc Tiếng Việt
- **Phân loại trạng thái**: Chờ làm (`PENDING`), Đang làm (`IN_PROGRESS`), Đã xong (`DONE`).
- **Thông báo giọng nói Tiếng Việt (Text-to-Speech)**:
  - Tự động đọc thông báo phát ra loa khi có đơn mới: *"Có đơn mới. Bàn 1. 3 món."*
  - Phát tiếng chuông cảnh báo Ding-Dong (Web Audio API) khi có đơn chờ.
  - Tự động nhắc nhở định kỳ **2 phút/lần** nếu còn đơn chưa xử lý.
- **Công tắc Bật / Tắt âm thanh**: Cho phép pha chế chủ động bật/tắt âm thanh kèm lưu cấu hình (`localStorage`).

### 💳 4. Thanh Toán & Giải Phóng Bàn (Payment & Table Release)
- **Hình thức thanh toán**: Trả trước (`BEFORE`) hoặc Trả sau (`AFTER`).
- **Phương thức thanh toán**:
  - Tiền mặt (`CASH`).
  - Chuyển khoản (`BANK_TRANSFER`): Tích hợp mã **VietQR** tự động tạo theo số tiền + tên bàn & thông tin chuyển khoản ngân hàng.
- **Tính năng Trả bàn (Set bàn trống)**: Cho phép trả bàn giải phóng về trạng thái *Trống* ngay cả khi khách trả trước hay sau khi dùng xong.

### 📊 5. Báo Cáo Doanh Thu Đa Chiều (Revenue Analytics Dashboard)
Tích hợp 5 loại biểu đồ tương tác (**Recharts**):
- **Biểu đồ vùng (Area Chart)**: Xu hướng doanh thu theo ngày / khoảng thời gian.
- **Biểu đồ cột Top 10 Món**: Thống kê sản phẩm bán chạy nhất.
- **Biểu đồ tròn (Donut Chart)**: Tỷ lệ doanh thu theo phương thức thanh toán (Tiền mặt, Chuyển khoản, Thẻ).
- **Biểu đồ cột Doanh thu Nhân viên**: Theo dõi hiệu suất bán hàng của từng nhân viên.
- **Biểu đồ cột Cơ cấu Dịch vụ**: So sánh doanh thu tiền nước vs tiền giờ bi-a.

### 📜 6. Lịch Sử Đơn Hàng & Xem Chi Tiết
- **Bộ lọc đa năng**: Lọc từ ngày - đến ngày, lọc theo bàn, loại bàn (Cà phê/Bi-a), nhân viên, trạng thái, phương thức thanh toán, đơn gọi thêm.
- **Chi tiết đơn hàng**: Xem lại đầy đủ các món đã gọi, tiền giờ bi-a, mã giảm giá, thời gian tạo/đóng và nhân viên phụ trách.

### 📱 7. Giao Diện Responsive & Dark Mode
- **Điều hướng Mobile thông minh**: Thanh bottom nav ưu tiên các mục vận hành chính (Sơ đồ bàn, Pha chế KDS, Lịch sử đơn) + Nút **"Khác"** mở bảng slide-up drawer cho các mục quản lý.
- **Giao diện Tối (Dark Mode)**: Tối ưu cho mắt nhân viên làm việc ca đêm.

---

## 🛠️ Công Nghệ Sử Dụng

### Frontend
- **Core**: React 18, Vite.
- **Styling**: Tailwind CSS, Vanilla CSS, Custom Animations.
- **State Management & Data Fetching**: TanStack React Query v5, Zustand / Local Storage.
- **Icons & Charts**: Lucide React, Recharts.
- **Audio & Speech**: Web Audio API, Web SpeechSynthesis API.

### Backend
- **Core**: Java 17+, Spring Boot 3.
- **Security**: Spring Security, JWT (JSON Web Token) Authentication.
- **Database & ORM**: Spring Data JPA, H2 Database / MySQL.
- **Build Tool**: Apache Maven.

---

## 📦 Cài Đặt & Khởi Chạy

### Yêu Cầu Hệ Thống
- **Node.js**: `18.x` trở lên.
- **Java JDK**: `17` trở lên.
- **Maven**: `3.8+` (hoặc sử dụng `./mvnw` đính kèm).

---

### 1. Khởi Chạy Backend (Spring Boot)

```bash
# 1. Di chuyển vào thư mục backend
cd backend

# 2. Biên dịch và chạy ứng dụng Spring Boot
./mvnw spring-boot:run
# (Hoặc trên Windows Command Prompt: mvnw.cmd spring-boot:run)
```
Backend sẽ khởi chạy tại port `8080` (API endpoint: `http://localhost:8080/api/v1`).

---

### 2. Khởi Chạy Frontend (React + Vite)

```bash
# 1. Mở terminal tại thư mục gốc của dự án
cd bom_coffee_POS-main

# 2. Cài đặt các gói phụ thuộc (Dependencies)
npm install

# 3. Chạy môi trường phát triển (Development Mode)
npm run dev
```
Frontend sẽ khởi chạy tại: `http://localhost:5173`.

---

## 📁 Cấu Trúc Dự Án

```
bom_coffee_POS-main/
├── backend/                        # Nguồn ứng dụng Spring Boot Backend
│   ├── src/main/java/com/bomcoffee/pos/
│   │   ├── auth/                   # Controller & JWT Security
│   │   ├── billiard/               # Quản lý giờ chơi & giá bi-a
│   │   ├── category/               # Quản lý danh mục
│   │   ├── kds/                    # API màn hình pha chế KDS
│   │   ├── order/                  # Quản lý đơn hàng & thanh toán
│   │   ├── product/                # Quản lý món ăn & nước uống
│   │   ├── report/                 # Báo cáo doanh thu
│   │   ├── table/                  # Quản lý bàn & trạng thái
│   │   └── user/                   # Quản lý tài khoản & nhân viên
│   └── pom.xml
├── src/                            # Nguồn ứng dụng React Frontend
│   ├── app/                        # Layout, Router & Zustand Store
│   ├── features/                   # Tính năng theo module
│   │   ├── billiard/               # Quản lý bàn bi-a & cấu hình giá
│   │   ├── history/                # Lịch sử đơn & chi tiết đơn
│   │   ├── kds/                    # Màn hình pha chế KDS
│   │   ├── menu/                   # Quản lý thực đơn món nước
│   │   ├── order/                  # Sơ đồ bàn, POS Order & Drink Options
│   │   ├── report/                 # Dashboard báo cáo doanh thu & biểu đồ
│   │   └── staff/                  # Quản lý nhân viên
│   ├── shared/                     # Components, API client & Utilities
│   │   ├── components/             # Button, Card, Modal, Toggle, Loading...
│   │   └── lib/                    # api.js, audioService.js, utils.js
│   ├── index.css
│   └── main.jsx
├── HUONG_DAN_SU_DUNG.md            # Tài liệu hướng dẫn sử dụng & quy trình hệ thống
├── index.html
├── package.json
├── tailwind.config.js
└── vite.config.js
```

---

## 📖 Tài Liệu Hướng Dẫn Sử Dụng
Chi tiết quy trình vận hành và hướng dẫn từng bước cho các bộ phận (Phục vụ, Thu ngân, Pha chế, Quản lý) vui lòng tham khảo file:  
👉 **[HUONG_DAN_SU_DUNG.md](file:///d:/bom_coffee_POS-main/HUONG_DAN_SU_DUNG.md)**

---

## 📝 License
Phát triển cho **Bom Coffee POS & Billiards System**.
