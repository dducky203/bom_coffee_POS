# PROMPT KỸ THUẬT — HỆ THỐNG POS "BOM COFFEE"

> Dùng file này làm prompt đưa cho AI coding assistant (Claude Code, Cursor...) hoặc brief cho lập trình viên để triển khai toàn bộ hệ thống.

## 0. Bối cảnh & Mục tiêu

Xây dựng hệ thống POS nội bộ cho quán **Bom Coffee** (bán đồ uống + dịch vụ bi-a), phục vụ 3 nhóm người dùng:

- **Nhân viên phục vụ**: order tại bàn, theo dõi trạng thái đơn, thanh toán.
- **Pha chế / bar (KDS - Kitchen/Bar Display System)**: nhận đơn theo hàng đợi, đánh dấu món đã làm/còn thiếu.
- **Quản lý/chủ quán**: xem báo cáo doanh thu ngày/tuần/tháng/năm, quản lý menu, kho, nhân viên, bàn bi-a.

Yêu cầu phi chức năng: hệ thống dùng nội bộ, **cần tối ưu tốc độ cao**, ưu tiên **code rõ ràng, chuẩn SOLID, dễ bảo trì**, UI hiện đại, dễ dùng trên tablet/PC.

---

## 1. Tech Stack

| Layer | Công nghệ |
|---|---|
| Frontend | ReactJS (Vite), TailwindCSS, React Router, TanStack Query (data fetching/cache), Zustand hoặc Context API (state), Axios |
| Realtime | WebSocket (STOMP over SockJS) để đồng bộ Order ↔ KDS ↔ Thu ngân |
| Backend | Java 21, Spring Boot 3.x, Spring Web, Spring Data JPA, Spring Security (JWT), Spring Validation, Spring WebSocket |
| Database | MariaDB 10.11+ |
| Build/Infra | Maven, Docker + docker-compose (app + db), Flyway (migration DB) |
| Testing | JUnit 5 + Mockito (BE), Vitest + React Testing Library (FE) |

---

## 2. Nguyên tắc thiết kế Backend (SOLID + Layered Architecture)

Yêu cầu bắt buộc khi sinh code backend:

- **S – Single Responsibility**: mỗi class chỉ một nhiệm vụ. Tách rõ `Controller` (nhận request/trả response) → `Service` (business logic) → `Repository` (truy vấn DB) → `Mapper` (DTO ↔ Entity).
- **O – Open/Closed**: dùng interface cho Service (`OrderService`, `PaymentService`...) để mở rộng (ví dụ thêm phương thức thanh toán mới) mà không sửa code cũ. Áp dụng Strategy Pattern cho tính giá bi-a theo khung giờ và cho các phương thức thanh toán.
- **L – Liskov Substitution**: các implementation của interface (VD: `CashPaymentStrategy`, `QrPaymentStrategy`) phải thay thế nhau được mà không phá vỡ logic gọi.
- **I – Interface Segregation**: không gộp nhiều nghiệp vụ không liên quan vào 1 interface lớn; chia nhỏ theo domain (`OrderQueryService`, `OrderCommandService` nếu cần).
- **D – Dependency Inversion**: Controller/Service phụ thuộc vào interface, dùng constructor injection (không field injection), cấu hình bean qua Spring.

Cấu trúc package đề xuất:

```
com.bomcoffee.pos
 ├─ config          (SecurityConfig, WebSocketConfig, CorsConfig...)
 ├─ common          (exception handler, base response, enums, utils)
 ├─ auth            (login, jwt, phân quyền)
 ├─ user            (nhân viên, role)
 ├─ table           (quản lý bàn)
 ├─ category        (danh mục món)
 ├─ product         (món/nước, variant, giá)
 ├─ billiard        (bàn bi-a, phiên chơi, bảng giá theo giờ)
 ├─ order           (đơn hàng, order item, trạng thái)
 ├─ kds             (bảng điều khiển pha chế, cập nhật trạng thái món)
 ├─ payment         (thanh toán, hóa đơn)
 ├─ inventory       (nguyên liệu, tồn kho, trừ kho)
 ├─ shift           (ca làm việc, chấm công)
 ├─ promotion       (khuyến mãi, mã giảm giá)
 ├─ customer        (khách hàng thân thiết, điểm tích lũy)
 ├─ report          (doanh thu, thống kê)
 └─ notification    (websocket broadcast)
```

Mỗi module theo cấu trúc con: `controller/`, `service/`, `service/impl/`, `repository/`, `entity/`, `dto/`, `mapper/`.

Quy ước API:
- REST chuẩn, versioning `/api/v1/...`
- Response bọc chuẩn: `{ success, data, message, errorCode }`
- Validate input bằng `@Valid` + custom exception → `@ControllerAdvice` xử lý lỗi tập trung
- Phân trang chuẩn (`page`, `size`, `sort`) cho các API danh sách

---

## 3. Thiết kế Database (MariaDB)

### 3.1 Nhóm Người dùng & Phân quyền
```sql
roles(id, name, description)                 -- ADMIN, CASHIER, WAITER, BARTENDER
users(id, username, password_hash, full_name, phone, role_id, is_active, created_at)
```

### 3.2 Nhóm Bàn
```sql
zones(id, name)                               -- Khu vực: sân trong, sân ngoài, tầng 2...
tables(id, zone_id, name, type ENUM('DRINK','BILLIARD'), status ENUM('EMPTY','SERVING','RESERVED'), capacity)
```

### 3.3 Nhóm Sản phẩm / Menu
```sql
categories(id, name, sort_order, is_active)
products(id, category_id, name, description, image_url, base_price, is_active, track_inventory)
product_variants(id, product_id, name, extra_price)      -- size M/L, topping...
ingredients(id, name, unit, quantity_in_stock, min_alert_qty)
product_ingredients(product_id, ingredient_id, quantity_used)  -- công thức trừ kho
```

### 3.4 Nhóm Bi-a
```sql
billiard_pricing(id, table_id NULLABLE, day_type ENUM('WEEKDAY','WEEKEND'), start_time, end_time, price_per_hour)
billiard_sessions(id, table_id, order_id, start_time, end_time, status ENUM('PLAYING','FINISHED'), total_amount)
```

### 3.5 Nhóm Đơn hàng
```sql
orders(id, table_id, staff_id, status ENUM('OPEN','PAID','CANCELLED'), created_at, closed_at, total_amount, discount_amount, final_amount)
order_items(id, order_id, product_id, variant_id, quantity, unit_price, note,
            status ENUM('PENDING','IN_PROGRESS','DONE','SERVED'), created_at, updated_at, updated_by)
order_item_status_log(id, order_item_id, from_status, to_status, changed_by, changed_at)  -- audit trạng thái
```

### 3.6 Nhóm Thanh toán
```sql
payments(id, order_id, method ENUM('CASH','BANK_TRANSFER','QR','CARD','EWALLET'), amount, paid_at, cashier_id)
```

### 3.7 Nhóm Ca làm / Chấm công
```sql
shifts(id, staff_id, check_in, check_out, note)
```

### 3.8 Nhóm Khách hàng & Khuyến mãi
```sql
customers(id, full_name, phone, points, created_at)
promotions(id, name, type ENUM('PERCENT','FIXED'), value, start_date, end_date, condition_min_amount, is_active)
```

> Migration quản lý bằng **Flyway** (`V1__init.sql`, `V2__seed_data.sql`...). Toàn bộ bảng có `created_at`, `updated_at` (audit).

---

## 4. Thiết kế API chính (REST)

### Auth
- `POST /api/v1/auth/login` → JWT
- `GET /api/v1/auth/me`

### Table
- `GET /api/v1/tables` (kèm status realtime)
- `PATCH /api/v1/tables/{id}/status`

### Product/Menu
- `GET /api/v1/categories`
- `GET /api/v1/products?categoryId=`
- `POST/PUT/DELETE /api/v1/products` (ADMIN)

### Order (Nhân viên)
- `POST /api/v1/orders` — tạo đơn mới cho bàn
- `POST /api/v1/orders/{id}/items` — thêm món vào đơn
- `PUT /api/v1/orders/{id}/items/{itemId}` — sửa số lượng/ghi chú
- `DELETE /api/v1/orders/{id}/items/{itemId}` — hủy món
- `GET /api/v1/orders/{id}` — chi tiết đơn (đồ uống + bi-a)
- `POST /api/v1/orders/{id}/checkout` — thanh toán, đóng đơn

### KDS (Pha chế)
- `GET /api/v1/kds/queue` — danh sách order_items đang PENDING/IN_PROGRESS, realtime qua WebSocket
- `PATCH /api/v1/kds/items/{itemId}/status` — chuyển trạng thái (PENDING→IN_PROGRESS→DONE)
- WebSocket topic: `/topic/kds` (đẩy sự kiện món mới, cập nhật trạng thái)
- WebSocket topic: `/topic/orders/{tableId}` (đẩy trạng thái về màn hình nhân viên/thu ngân)

### Billiard
- `POST /api/v1/billiard/{tableId}/start` — bắt đầu tính giờ
- `POST /api/v1/billiard/{tableId}/stop` — dừng, tính tiền theo `billiard_pricing`
- `GET /api/v1/billiard/{tableId}/current` — thời gian đang chơi (để FE hiển thị đồng hồ đếm)

### Inventory
- `GET /api/v1/ingredients`
- `PATCH /api/v1/ingredients/{id}/stock`

### Report (Doanh thu)
- `GET /api/v1/reports/revenue?type=day|week|month|year&from=&to=`
- `GET /api/v1/reports/top-products?from=&to=`
- `GET /api/v1/reports/revenue-by-category` (đồ uống vs bi-a)
- `GET /api/v1/reports/revenue-by-staff`
- `GET /api/v1/reports/export?format=excel|pdf`

### Shift/Customer/Promotion
- CRUD chuẩn tương tự.

---

## 5. Thiết kế Frontend (ReactJS + TailwindCSS)

### 5.1 Cấu trúc thư mục
```
src/
 ├─ app/                 (routes, providers, layout)
 ├─ shared/
 │   ├─ components/      (Button, Modal, Table, Badge, Toast... - design system riêng)
 │   ├─ hooks/
 │   ├─ lib/             (axios instance, websocket client, formatters)
 │   └─ constants/
 ├─ features/
 │   ├─ auth/
 │   ├─ order/           (màn hình order cho nhân viên)
 │   ├─ kds/              (màn hình pha chế)
 │   ├─ billiard/         (quản lý bàn bi-a + đồng hồ)
 │   ├─ menu/             (quản lý menu, admin)
 │   ├─ inventory/
 │   ├─ report/           (dashboard doanh thu, biểu đồ)
 │   ├─ staff/
 │   └─ customer/
 └─ types/
```

### 5.2 Nguyên tắc code FE
- Tách rõ **UI component** (dumb) và **container/feature component** (gọi API, xử lý state).
- Custom hooks cho từng domain: `useOrders()`, `useKdsQueue()`, `useBilliardTimer()`, `useRevenueReport()`.
- Dùng TanStack Query để cache + tự động refetch, kết hợp WebSocket để invalidate cache khi có sự kiện realtime.
- TailwindCSS: định nghĩa design token trong `tailwind.config.js` (màu thương hiệu Bom Coffee, font, spacing), tránh magic class lặp lại — tạo component `Button`, `Card`, `Badge` dùng chung.
- Responsive: tối ưu cho tablet (màn hình order, KDS) và desktop (dashboard, quản lý).

### 5.3 Các màn hình chính cần xây dựng

1. **Đăng nhập** — theo role, điều hướng vào đúng màn hình mặc định.
2. **Sơ đồ bàn** (Home nhân viên) — lưới bàn màu theo trạng thái (trống/đang phục vụ/đặt trước), bàn bi-a hiển thị luôn thời gian đã chơi.
3. **Màn hình Order** — chọn danh mục → chọn món → giỏ hàng bên phải → gửi đơn. Hiển thị trạng thái từng món đã gửi (chờ/đang làm/xong).
4. **Màn hình KDS (pha chế)** — dạng cột Kanban: `Chờ làm | Đang làm | Đã xong`, kéo-thả hoặc bấm nút chuyển trạng thái, âm thanh báo khi có đơn mới, đơn để lâu đổi màu cảnh báo.
5. **Màn hình Bi-a** — danh sách bàn bi-a, đồng hồ đếm realtime, nút Bắt đầu/Kết thúc, hiển thị tiền tạm tính.
6. **Thanh toán** — tổng hợp đồ uống + bi-a của bàn, chọn phương thức thanh toán, áp mã giảm giá, in/gửi hóa đơn.
7. **Quản lý Menu** (admin) — CRUD món, danh mục, giá, ảnh, tồn kho nguyên liệu.
8. **Dashboard doanh thu** — bộ lọc ngày/tuần/tháng/năm, biểu đồ cột/đường doanh thu, top món bán chạy, doanh thu theo danh mục (nước vs bi-a), doanh thu theo nhân viên/ca.
9. **Quản lý nhân viên & ca làm**.
10. **Quản lý khách hàng & khuyến mãi**.

### 5.4 UI/UX
- Phong cách hiện đại, tối giản (flat/minimal), bo góc mềm, màu chủ đạo theo nhận diện cà phê (nâu/be/cam nhấn), dark mode cho màn hình KDS (đỡ chói khi làm việc buổi tối).
- Font dễ đọc (Inter/Be Vietnam Pro).
- Ưu tiên thao tác nhanh: nút to, dễ bấm trên tablet, ít bước để tạo 1 đơn.

---

## 6. Bảo mật & Vận hành

- JWT access token + refresh token, phân quyền theo role ở cả FE (ẩn/hiện chức năng) và BE (`@PreAuthorize`).
- Log audit các thao tác nhạy cảm: hủy món, giảm giá, hủy đơn.
- Docker hóa: `docker-compose.yml` gồm service `backend`, `frontend`, `mariadb`, có thể thêm `adminer` để quản trị DB lúc dev.
- Biến môi trường tách riêng theo `dev`/`prod` (`application-dev.yml`, `application-prod.yml`).
- Vì dùng nội bộ, không cần cân bằng tải/cluster; ưu tiên đơn giản, dễ backup DB (cron mysqldump).

---

## 7. Việc cần AI/Dev thực hiện theo thứ tự ưu tiên

1. Khởi tạo project BE (Spring Boot) + FE (React+Vite+Tailwind), cấu hình Docker Compose.
2. Thiết kế & migrate database (Flyway) theo mục 3.
3. Module Auth + phân quyền.
4. Module Table + Product/Menu (CRUD cơ bản).
5. Module Order + WebSocket realtime.
6. Module KDS (màn hình pha chế).
7. Module Billiard (tính giờ, tính tiền).
8. Module Payment/Checkout.
9. Module Report/Dashboard doanh thu.
10. Module Inventory, Shift, Customer, Promotion (mở rộng).
11. Viết unit test cho Service layer quan trọng (Order, Payment, Billiard pricing).
12. Polish UI/UX, responsive, dark mode KDS.

---

## 8. Ghi chú khi prompt cho AI coding assistant

Khi đưa từng phần việc ở mục 7 cho AI code, luôn nhắc lại:
- "Tuân thủ cấu trúc package/layer đã định nghĩa, áp dụng SOLID, dùng constructor injection."
- "Trả response theo format chuẩn `{ success, data, message }`."
- "Viết kèm test cơ bản cho service."
- "FE dùng TailwindCSS theo design token đã cấu hình, tách component tái sử dụng, không hardcode màu/spacing."
