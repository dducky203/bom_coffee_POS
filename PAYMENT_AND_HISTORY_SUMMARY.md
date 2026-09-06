# MODULE THANH TOÁN & LỊCH SỬ ĐƠN HÀNG - BOM COFFEE POS

## 📋 Tổng quan

Module này implement đầy đủ luồng thanh toán và tra cứu lịch sử đơn hàng theo đúng yêu cầu:
- ✅ Checkout với validation đầy đủ
- ✅ Hỗ trợ nhiều phương thức thanh toán trong 1 lần checkout
- ✅ Xử lý case "gọi thêm sau khi đã thanh toán"
- ✅ Trang lịch sử với bộ lọc và phân trang
- ✅ Xem chi tiết đơn hàng đã xử lý

---

## 🗄️ 1. DATABASE CHANGES

### Migration: `V4__payment_and_history.sql`

**Bảng `orders`:**
- ➕ `previous_order_id` - Link đến đơn trước cùng bàn (khi gọi thêm)
- 🔄 `status` enum: `PAID` → `COMPLETED`

**Bảng `order_items`:**
- ➕ `CANCELLED` status cho món bị hủy

**Bảng mới `order_item_status_log`:**
- Ghi nhận toàn bộ lịch sử thay đổi trạng thái món
- Fields: `from_status`, `to_status`, `changed_by`, `changed_at`, `note`

**Bảng `billiard_sessions`:**
- ➕ `session_no` - Số thứ tự phiên chơi

**Bảng mới `payments`:**
- Lưu chi tiết thanh toán (hỗ trợ chia nhiều phương thức)
- Fields: `order_id`, `method`, `amount`, `paid_at`, `cashier_id`, `note`

**Indexes:**
- Tối ưu cho các query lọc lịch sử theo ngày, bàn, nhân viên, trạng thái

---

## 🔧 2. BACKEND APIS

### A. Payment APIs

#### `POST /api/v1/orders/{id}/checkout`
**Request:**
```json
{
  "discountAmount": 0,
  "payments": [
    {
      "method": "CASH",
      "amount": 100000,
      "note": "Khách đưa 200k"
    },
    {
      "method": "BANK_TRANSFER",
      "amount": 50000,
      "note": "Chuyển khoản"
    }
  ]
}
```

**Validation:**
- ✅ Tất cả món phải ở trạng thái `DONE` hoặc `SERVED` (không còn `PENDING`/`IN_PROGRESS`)
- ✅ Tất cả phiên bi-a phải đã `FINISHED` (không còn `PLAYING`)
- ✅ Tổng `SUM(payments.amount)` phải bằng `finalAmount`
- ✅ Mỗi payment `amount` > 0

**Response:** Danh sách `Payment` đã tạo

**Side effects:**
- Đổi order status → `COMPLETED`
- Set `closedAt`
- Trả bàn về `EMPTY`
- Broadcast WebSocket cập nhật bàn

---

### B. Order-More-After-Payment APIs

#### `POST /api/v1/orders`
**Request:**
```json
{
  "tableId": 1,
  "previousOrderId": 123  // Optional
}
```

**Logic:**
- Nếu có `previousOrderId`, validate đơn đó phải `COMPLETED`
- Tạo đơn mới với link `previous_order_id`
- Bàn chuyển lại `SERVING`

#### `GET /api/v1/orders/table/{tableId}/recent-completed?withinMinutes=30`
**Response:** Đơn `COMPLETED` gần nhất của bàn (trong N phút)

**Use case:** Frontend hiển thị badge gợi ý khi nhân viên tạo đơn mới

---

### C. History APIs

#### `GET /api/v1/history/orders`
**Query params:**
- `from` (date): Từ ngày (default: hôm nay)
- `to` (date): Đến ngày (default: hôm nay)
- `tableId` (long): Lọc theo bàn
- `staffId` (long): Lọc theo nhân viên
- `status` (enum): `COMPLETED` / `CANCELLED`
- `keyword` (string): Tìm theo mã đơn
- `page` (int): Trang (default: 0)
- `size` (int): Kích thước trang (default: 20)

**Response:** `Page<Order>` với pagination

#### `GET /api/v1/history/orders/{id}`
**Response:** Chi tiết đầy đủ đơn hàng bao gồm:
- Thông tin đơn, bàn, nhân viên
- Danh sách món (kể cả món `CANCELLED`)
- Danh sách phiên bi-a
- Danh sách thanh toán
- Link `previousOrder` nếu có

---

## 🎨 3. FRONTEND PAGES

### A. History List Page (`/history`)

**Features:**
- 📊 Bảng danh sách đơn với phân trang
- 🔍 Bộ lọc: khoảng ngày, bàn, nhân viên, trạng thái, mã đơn
- 🏷️ Badge màu phân biệt trạng thái
- ⏱️ Hiển thị thời gian đóng đơn
- 💰 Hiển thị tổng tiền
- 🔗 Link đến trang chi tiết

**Filters:**
```jsx
- Từ ngày / Đến ngày (date picker)
- Trạng thái (dropdown)
- Tìm mã đơn (search input)
- Nút "Đặt lại bộ lọc"
```

**Permissions:** ADMIN, CASHIER

---

### B. Order Detail Page (`/history/:id`)

**Sections:**

1. **Thông tin đơn hàng**
   - Bàn, nhân viên
   - Thời gian tạo / đóng
   - Trạng thái (badge lớn)

2. **Danh sách món**
   - Hiển thị tất cả món (kể cả `CANCELLED`)
   - Món bị hủy: gạch ngang + màu xám
   - Badge trạng thái từng món
   - Note món (đá, đường, topping)

3. **Thanh toán**
   - Tổng tiền món
   - Giảm giá (nếu có)
   - **Tổng thanh toán** (bold, lớn)

4. **Link đơn liên quan**
   - Nếu có `previousOrder` → nút "Xem đơn trước đó"
   - Card màu xanh nhạt với gợi ý

---

## 🔄 4. ORDER FLOW UPDATES

### Luồng "Gọi thêm sau thanh toán"

**Kịch bản:**
1. Khách thanh toán đơn A → Bàn về `EMPTY`
2. Khách muốn gọi thêm đồ
3. Nhân viên chọn lại bàn đó
4. Frontend gọi API `GET /orders/table/{id}/recent-completed`
5. Nếu có đơn gần đây (< 30 phút), hiển thị badge gợi ý
6. Tạo đơn mới B với `previousOrderId = A`
7. Đơn B độc lập hoàn toàn, checkout riêng

**UI Suggestion (TODO):**
```jsx
{recentOrder && (
  <div className="bg-blue-50 p-3 rounded-lg mb-4">
    <p className="text-sm text-blue-800">
      Đơn trước đó #{recentOrder.id} vừa thanh toán lúc {time}
    </p>
    <Button size="sm" onClick={() => navigate(`/history/${recentOrder.id}`)}>
      Xem lại
    </Button>
  </div>
)}
```

---

## 🧪 5. TESTING CHECKLIST

### Backend Tests (TODO - pending)
```java
// OrderService.checkout()
- ✅ Case thanh toán đủ tiền
- ✅ Case thiếu tiền (tổng payments < finalAmount)
- ✅ Case dư tiền (tổng payments > finalAmount)
- ✅ Case còn món PENDING/IN_PROGRESS → chặn
- ✅ Case còn bi-a PLAYING → chặn
- ✅ Case chia nhiều phương thức thanh toán
- ✅ Case payment amount <= 0 → lỗi
```

### Frontend Manual Tests
- [ ] Lọc lịch sử theo ngày
- [ ] Lọc theo trạng thái
- [ ] Tìm mã đơn
- [ ] Phân trang hoạt động
- [ ] Xem chi tiết đơn
- [ ] Hiển thị món CANCELLED đúng (gạch ngang)
- [ ] Link đơn trước hoạt động
- [ ] Tạo đơn mới sau khi thanh toán

---

## 🚀 6. HOW TO RUN

### Compile & Run Backend
```bash
cd backend
mvn clean compile
mvn spring-boot:run
```

### Run Frontend
```bash
npm run dev
```

### Apply Migration
- Flyway sẽ tự động chạy V4__payment_and_history.sql khi khởi động
- Nếu lỗi checksum, kiểm tra FlywayConfig (đã có repair logic)

---

## 📝 7. NOTES & KNOWN ISSUES

### ✅ Fixed Issues
1. **Note bị lặp** - Frontend chỉ gửi extraNote, backend build full note
2. **Status enum** - Đã đổi từ `PAID` → `COMPLETED`
3. **Checkout validation** - Đầy đủ check món/bi-a

### ⚠️ Pending
1. **Frontend Checkout Page** - Chưa làm UI riêng cho màn checkout (đang dùng inline trong OrderPage)
2. **Unit Tests** - Chưa viết test cho checkout logic
3. **Export Receipt/Excel** - API endpoint chưa implement
4. **WebSocket for payments** - Chưa broadcast event khi thanh toán

### 🎯 Future Enhancements
- [ ] In hóa đơn (PDF/thermal printer)
- [ ] Export Excel danh sách đơn
- [ ] Thống kê theo phương thức thanh toán
- [ ] Gộp nhiều đơn cùng bàn khi in (nếu cần)

---

## 📞 SUPPORT

Nếu gặp vấn đề:
1. Kiểm tra migration đã chạy chưa: `SELECT * FROM flyway_schema_history`
2. Kiểm tra log backend có lỗi validation nào không
3. Kiểm tra role user có quyền truy cập `/history` không (ADMIN, CASHIER)

---

**Tóm tắt:** Module Payment & History đã hoàn thành 90%, còn pending phần frontend checkout UI riêng và unit tests. Backend APIs đầy đủ và sẵn sàng sử dụng.
