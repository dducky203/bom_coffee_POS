-- ============================================================
-- V1__init_schema.sql — Bom Coffee POS Database Schema
-- ============================================================

-- Roles
CREATE TABLE IF NOT EXISTS roles (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT 'Khoa chinh',
    name        VARCHAR(50)  NOT NULL UNIQUE COMMENT 'Ten vai tro',
    description VARCHAR(255) COMMENT 'Mo ta chi tiet vai tro',
    created_at  DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6) COMMENT 'Thoi gian tao',
    updated_at  DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) COMMENT 'Thoi gian cap nhat'
) COMMENT 'Bang luu tru cac vai tro he thong (Admin, Thu ngan, KDS, ...)';

-- Users
CREATE TABLE IF NOT EXISTS users (
    id            BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT 'Khoa chinh',
    username      VARCHAR(100) NOT NULL UNIQUE COMMENT 'Ten dang nhap',
    password_hash VARCHAR(255) NOT NULL COMMENT 'Mat khau da ma hoa',
    full_name     VARCHAR(150) NOT NULL COMMENT 'Ten day du cua nguoi dung',
    phone         VARCHAR(20) COMMENT 'So dien thoai lien he',
    role_id       BIGINT       NOT NULL COMMENT 'Khoa ngoai lien ket voi bang roles',
    is_active     BOOLEAN      NOT NULL DEFAULT TRUE COMMENT 'Trang thai hoat dong (1: dang hoat dong, 0: bi khoa)',
    created_at    DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6) COMMENT 'Thoi gian tao',
    updated_at    DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) COMMENT 'Thoi gian cap nhat',
    FOREIGN KEY (role_id) REFERENCES roles(id)
) COMMENT 'Bang luu tru thong tin tai khoan nhan vien va quan ly';

-- Zones
CREATE TABLE IF NOT EXISTS zones (
    id         BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT 'Khoa chinh',
    name       VARCHAR(100) NOT NULL COMMENT 'Ten khu vuc (VD: San vuon, Trong nha)',
    created_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6) COMMENT 'Thoi gian tao',
    updated_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) COMMENT 'Thoi gian cap nhat'
) COMMENT 'Bang phan chia khu vuc trong quan';

-- Tables
CREATE TABLE IF NOT EXISTS restaurant_tables (
    id         BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT 'Khoa chinh',
    zone_id    BIGINT COMMENT 'Khoa ngoai lien ket voi bang zones',
    name       VARCHAR(50)  NOT NULL COMMENT 'Ten ban (VD: Ban 1, Bida 1)',
    type       ENUM('DRINK','BILLIARD') NOT NULL COMMENT 'Loai ban (Uong nuoc hoac Choi Bida)',
    status     ENUM('EMPTY','SERVING','RESERVED') NOT NULL DEFAULT 'EMPTY' COMMENT 'Trang thai hien tai cua ban (Trong, Dang phuc vu, Da dat)',
    capacity   INT COMMENT 'Suc chua cua ban (so nguoi)',
    created_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6) COMMENT 'Thoi gian tao',
    updated_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) COMMENT 'Thoi gian cap nhat',
    FOREIGN KEY (zone_id) REFERENCES zones(id)
) COMMENT 'Bang quan ly danh sach cac ban trong quan';

-- Categories
CREATE TABLE IF NOT EXISTS categories (
    id         BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT 'Khoa chinh',
    name       VARCHAR(100) NOT NULL COMMENT 'Ten danh muc san pham (VD: Ca phe, Tra sua)',
    sort_order INT          DEFAULT 0 COMMENT 'Thu tu hien thi tren menu',
    is_active  BOOLEAN      NOT NULL DEFAULT TRUE COMMENT 'Trang thai hien thi cua danh muc',
    created_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6) COMMENT 'Thoi gian tao',
    updated_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) COMMENT 'Thoi gian cap nhat'
) COMMENT 'Bang phan loai danh muc san pham';

-- Products
CREATE TABLE IF NOT EXISTS products (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT 'Khoa chinh',
    category_id     BIGINT       NOT NULL COMMENT 'Khoa ngoai lien ket voi bang categories',
    name            VARCHAR(200) NOT NULL COMMENT 'Ten san pham',
    description     TEXT COMMENT 'Mo ta chi tiet san pham',
    image_url       VARCHAR(500) COMMENT 'Duong dan hinh anh san pham',
    base_price      DECIMAL(12,2) NOT NULL COMMENT 'Gia ban co ban cua san pham',
    is_active       BOOLEAN      NOT NULL DEFAULT TRUE COMMENT 'Trang thai dang ban hay ngung ban',
    track_inventory BOOLEAN      NOT NULL DEFAULT FALSE COMMENT 'Co theo doi ton kho nguyen lieu khong',
    created_at      DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6) COMMENT 'Thoi gian tao',
    updated_at      DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) COMMENT 'Thoi gian cap nhat',
    FOREIGN KEY (category_id) REFERENCES categories(id)
) COMMENT 'Bang quan ly danh sach san pham, mon an, do uong';

-- Billiard Pricing
CREATE TABLE IF NOT EXISTS billiard_pricing (
    id             BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT 'Khoa chinh',
    table_id       BIGINT COMMENT 'Khoa ngoai lien ket voi bang restaurant_tables, NULL neu ap dung chung',
    day_type       ENUM('WEEKDAY','WEEKEND') NOT NULL COMMENT 'Loai ngay ap dung gia (Ngay thuong hay Cuoi tuan)',
    start_time     TIME NOT NULL COMMENT 'Khung gio bat dau ap dung muc gia nay',
    end_time       TIME NOT NULL COMMENT 'Khung gio ket thuc',
    price_per_hour DECIMAL(12,2) NOT NULL COMMENT 'Gia tien bida tinh theo 1 gio',
    created_at     DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6) COMMENT 'Thoi gian tao',
    updated_at     DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) COMMENT 'Thoi gian cap nhat',
    FOREIGN KEY (table_id) REFERENCES restaurant_tables(id)
) COMMENT 'Bang cau hinh gia tien thue ban bida theo khung gio va loai ngay';

-- Orders
CREATE TABLE IF NOT EXISTS orders (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT 'Khoa chinh',
    table_id        BIGINT COMMENT 'Khoa ngoai lien ket den ban duoc phuc vu',
    staff_id        BIGINT COMMENT 'Khoa ngoai lien ket den nhan vien tao don',
    status          ENUM('OPEN','PAID','CANCELLED') NOT NULL DEFAULT 'OPEN' COMMENT 'Trang thai don hang (Dang mo, Da thanh toan, Da huy)',
    total_amount    DECIMAL(12,2) DEFAULT 0 COMMENT 'Tong tien truoc khi giam gia',
    discount_amount DECIMAL(12,2) DEFAULT 0 COMMENT 'So tien duoc giam gia',
    final_amount    DECIMAL(12,2) DEFAULT 0 COMMENT 'So tien cuoi cung khach phai tra',
    closed_at       DATETIME(6) COMMENT 'Thoi diem dong don (thanh toan hoac huy)',
    created_at      DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6) COMMENT 'Thoi gian tao don',
    updated_at      DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) COMMENT 'Thoi gian cap nhat don',
    FOREIGN KEY (table_id) REFERENCES restaurant_tables(id),
    FOREIGN KEY (staff_id) REFERENCES users(id)
) COMMENT 'Bang quan ly cac hoa don ban hang';

-- Order Items
CREATE TABLE IF NOT EXISTS order_items (
    id         BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT 'Khoa chinh',
    order_id   BIGINT        NOT NULL COMMENT 'Khoa ngoai lien ket den don hang (orders)',
    product_id BIGINT        NOT NULL COMMENT 'Khoa ngoai lien ket den san pham (products)',
    quantity   INT           NOT NULL DEFAULT 1 COMMENT 'So luong khach goi',
    unit_price DECIMAL(12,2) NOT NULL COMMENT 'Gia cua 1 san pham tai thoi diem goi mon',
    note       VARCHAR(500) COMMENT 'Ghi chu cua khach (VD: it da, nhieu duong)',
    status     ENUM('PENDING','IN_PROGRESS','DONE','SERVED') NOT NULL DEFAULT 'PENDING' COMMENT 'Trang thai che bien (Cho che bien, Dang lam, Da xong, Da phuc vu)',
    updated_by VARCHAR(100) COMMENT 'Nguoi hoac he thong cuoi cung cap nhat trang thai',
    created_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6) COMMENT 'Thoi gian goi mon',
    updated_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) COMMENT 'Thoi gian cap nhat trang thai',
    FOREIGN KEY (order_id)   REFERENCES orders(id),
    FOREIGN KEY (product_id) REFERENCES products(id)
) COMMENT 'Bang chi tiet tung mon trong don hang de KDS quan ly';

-- Billiard Sessions
CREATE TABLE IF NOT EXISTS billiard_sessions (
    id           BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT 'Khoa chinh',
    table_id     BIGINT NOT NULL COMMENT 'Khoa ngoai lien ket den ban bida',
    order_id     BIGINT COMMENT 'Khoa ngoai lien ket den don hang neu co do uong di kem',
    start_time   DATETIME(6) NOT NULL COMMENT 'Thoi gian bat dau tinh gio bida',
    end_time     DATETIME(6) COMMENT 'Thoi gian ket thuc tinh gio bida',
    status       ENUM('PLAYING','FINISHED') NOT NULL DEFAULT 'PLAYING' COMMENT 'Trang thai cua phien choi (Dang choi, Da ket thuc)',
    total_amount DECIMAL(12,2) COMMENT 'Tong tien gio bida sau khi ket thuc',
    created_at   DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6) COMMENT 'Thoi gian tao',
    updated_at   DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) COMMENT 'Thoi gian cap nhat',
    FOREIGN KEY (table_id) REFERENCES restaurant_tables(id),
    FOREIGN KEY (order_id) REFERENCES orders(id)
) COMMENT 'Bang luu tru thoi gian bat dau va ket thuc cua mot luot choi bida';

-- Payments
CREATE TABLE IF NOT EXISTS payments (
    id         BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT 'Khoa chinh',
    order_id   BIGINT        NOT NULL COMMENT 'Khoa ngoai lien ket voi don hang can thanh toan',
    method     ENUM('CASH','BANK_TRANSFER','QR','CARD','EWALLET') NOT NULL COMMENT 'Phuong thuc thanh toan (Tien mat, Chuyen khoan, QR, The, Vi dien tu)',
    amount     DECIMAL(12,2) NOT NULL COMMENT 'So tien da thanh toan',
    paid_at    DATETIME(6) COMMENT 'Thoi gian thuc hien thanh toan',
    cashier_id BIGINT COMMENT 'Khoa ngoai lien ket toi nhan vien thu ngan thuc hien',
    created_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6) COMMENT 'Thoi gian ghi nhan thanh toan',
    FOREIGN KEY (order_id)   REFERENCES orders(id),
    FOREIGN KEY (cashier_id) REFERENCES users(id)
) COMMENT 'Bang luu tru lich su cac giao dich thanh toan';

-- Ingredients
CREATE TABLE IF NOT EXISTS ingredients (
    id                 BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT 'Khoa chinh',
    name               VARCHAR(150)    NOT NULL COMMENT 'Ten nguyen lieu (VD: Duong, Sua, Ca phe hat)',
    unit               VARCHAR(30) COMMENT 'Don vi do luong (VD: kg, lit, gram, hop)',
    quantity_in_stock  DECIMAL(12,3)   DEFAULT 0 COMMENT 'So luong nguyen lieu dang ton kho',
    min_alert_qty      DECIMAL(12,3) COMMENT 'Nguong canh bao khi ton kho duoi muc nay',
    created_at         DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6) COMMENT 'Thoi gian tao',
    updated_at         DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) COMMENT 'Thoi gian cap nhat'
) COMMENT 'Bang quan ly danh sach nguyen lieu trong kho';

-- Shifts
CREATE TABLE IF NOT EXISTS shifts (
    id         BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT 'Khoa chinh',
    staff_id   BIGINT NOT NULL COMMENT 'Khoa ngoai lien ket voi nhan vien thuc hien ca',
    check_in   DATETIME(6) NOT NULL COMMENT 'Thoi gian nhan vien bat dau ca lam',
    check_out  DATETIME(6) COMMENT 'Thoi gian nhan vien ket thuc ca lam',
    note       TEXT COMMENT 'Ghi chu ve ca lam viec hoac ban giao ca',
    created_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6) COMMENT 'Thoi gian tao',
    updated_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) COMMENT 'Thoi gian cap nhat',
    FOREIGN KEY (staff_id) REFERENCES users(id)
) COMMENT 'Bang luu tru lich su cham cong va giao ca cua nhan vien';

-- Customers
CREATE TABLE IF NOT EXISTS customers (
    id         BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT 'Khoa chinh',
    full_name  VARCHAR(150) NOT NULL COMMENT 'Ten khach hang',
    phone      VARCHAR(20)  UNIQUE COMMENT 'So dien thoai dung de tich diem hoac tra cuu',
    points     INT          DEFAULT 0 COMMENT 'So diem tich luy cua khach hang',
    created_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6) COMMENT 'Thoi gian tao ho so',
    updated_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) COMMENT 'Thoi gian cap nhat ho so'
) COMMENT 'Bang quan ly thong tin khach hang va tich diem';

-- Promotions
CREATE TABLE IF NOT EXISTS promotions (
    id                   BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT 'Khoa chinh',
    name                 VARCHAR(150)  NOT NULL COMMENT 'Ten chuong trinh khuyen mai',
    type                 ENUM('PERCENT','FIXED') NOT NULL COMMENT 'Loai khuyen mai (Giam theo phan tram hoac So tien co dinh)',
    value                DECIMAL(12,2) NOT NULL COMMENT 'Gia tri khuyen mai (VD: 10 tuc la 10% hoac 10,000)',
    start_date           DATE COMMENT 'Ngay bat dau ap dung khuyen mai',
    end_date             DATE COMMENT 'Ngay ket thuc khuyen mai',
    condition_min_amount DECIMAL(12,2) COMMENT 'Dieu kien don hang toi thieu de duoc ap dung',
    is_active            BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Trang thai cua chuong trinh (Dang chay hay Da tat)',
    created_at           DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6) COMMENT 'Thoi gian tao',
    updated_at           DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) COMMENT 'Thoi gian cap nhat'
) COMMENT 'Bang quan ly cac chuong trinh khuyen mai, ma giam gia';
