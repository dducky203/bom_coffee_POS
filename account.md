# Danh sách Tài khoản & Phân quyền Hệ thống Bom Coffee POS

Hệ thống được thiết kế với các vai trò (Role) khác nhau nhằm đảm bảo tính chuyên biệt và bảo mật trong quá trình vận hành quán. Dưới đây là danh sách các tài khoản (dùng để test/demo) và chi tiết quyền hạn của từng vai trò.

---

## 1. Tài khoản Quản lý / Chủ quán (Admin)
- **Tên đăng nhập:** `admin`
- **Mật khẩu:** `123456`
- **Vai trò (Role):** `ADMIN`

**Nhiệm vụ & Chức năng:**
Đây là tài khoản có quyền cao nhất trong hệ thống, bao quát toàn bộ hoạt động kinh doanh:
- **Quản lý tổng quan:** Xem tất cả các màn hình (Sơ đồ bàn, Màn hình Order, Màn hình Pha chế, Giờ chơi Bi-a).
- **Báo cáo doanh thu (Dashboard):** Xem thống kê tổng doanh thu, số đơn hàng, biểu đồ cơ cấu doanh thu (Bi-a vs Đồ uống), biểu đồ xu hướng theo ngày/tuần/tháng.
- **Quản lý Menu:** (Sẽ phát triển) Thêm, sửa, xóa danh mục và món ăn/đồ uống. Cập nhật giá cả.
- **Quản lý Nhân sự & Khách hàng:** (Sẽ phát triển) Phân quyền nhân viên, cấu hình khuyến mãi.

---

## 2. Tài khoản Pha chế (Bartender)
- **Tên đăng nhập:** `kds`
- **Mật khẩu:** `123456`
- **Vai trò (Role):** `BARTENDER`

**Nhiệm vụ & Chức năng:**
Tài khoản dành riêng cho nhân viên quầy bar/pha chế, giao diện được tối ưu với Dark Mode để làm việc năng suất và giảm mỏi mắt:
- **Màn hình KDS (Kitchen Display System):** 
  - Xem danh sách hàng đợi các món đồ uống do phục vụ gửi tới (bảng Kanban).
  - Thao tác nhận đơn (chuyển từ *Chờ làm* sang *Đang làm*).
  - Báo cáo hoàn thành (chuyển từ *Đang làm* sang *Đã xong*) để phục vụ biết và bưng bê.
- **Giới hạn:** Không thể xem báo cáo doanh thu, không chỉnh sửa được hệ thống hay thêm món vào bàn.

---

## 3. Tài khoản Nhân viên Phục vụ (Waiter)
- **Tên đăng nhập:** `waiter` (bạn có thể thử đăng nhập bằng tên này, hệ thống sẽ tự cấp quyền phục vụ)
- **Mật khẩu:** `123456`
- **Vai trò (Role):** `WAITER`

**Nhiệm vụ & Chức năng:**
Tài khoản di động, thường dùng trên Tablet/Điện thoại để thao tác trực tiếp tại bàn khách:
- **Quản lý sơ đồ bàn:** Xem trực quan bàn nào đang trống, bàn nào đang phục vụ, bàn nào được đặt trước.
- **Tạo Order (Nhận món):** Chọn bàn, gọi món từ Menu, ghi chú yêu cầu đặc biệt (ít đá, nhiều đường...) và nhấn Gửi để chuyển dữ liệu lập tức tới quầy pha chế (KDS).
- **Quản lý Bi-a:** Bật/tắt đồng hồ tính giờ cho các bàn Bi-a. Xem tổng tiền tạm tính realtime của từng bàn Bi-a.
- **Giới hạn:** Không xem được báo cáo doanh thu hay cài đặt hệ thống.

---

## 4. Tài khoản Thu ngân (Cashier)
- **Tên đăng nhập:** `cashier`
- **Mật khẩu:** `123456`
- **Vai trò (Role):** `CASHIER`

**Nhiệm vụ & Chức năng:**
- Chịu trách nhiệm in hóa đơn, áp dụng mã giảm giá và thu tiền (Tiền mặt, Chuyển khoản, QR Code).
- Kiểm tra lại các món và giờ chơi bi-a trước khi đóng đơn hàng (`Checkout`).
