-- ============================================================
-- V2__seed_data.sql — Dữ liệu mẫu thực tế của Bom Coffee
-- ============================================================

-- Roles
INSERT IGNORE INTO roles (name, description) VALUES
('ADMIN',     'Quản lý / Chủ quán — toàn quyền'),
('CASHIER',   'Thu ngân — thanh toán, xuất hóa đơn'),
('WAITER',    'Nhân viên phục vụ — order, quản lý bàn'),
('BARTENDER', 'Pha chế — nhận đơn từ KDS, cập nhật trạng thái món');

-- Default users (password = 123456)
INSERT IGNORE INTO users (username, password_hash, full_name, phone, role_id, is_active) VALUES
('admin',  '$2b$10$L8QdqZ5/kbdTfH6Tino57.OvUh8uhDq2s8BaZnlXzVtcMhnFkdeM.', 'Quản trị viên',  '0901234567', 1, TRUE),
('kds',    '$2b$10$L8QdqZ5/kbdTfH6Tino57.OvUh8uhDq2s8BaZnlXzVtcMhnFkdeM.', 'Nhân viên pha chế', '0901234568', 4, TRUE),
('waiter', '$2b$10$L8QdqZ5/kbdTfH6Tino57.OvUh8uhDq2s8BaZnlXzVtcMhnFkdeM.', 'Nhân viên phục vụ', '0901234569', 3, TRUE),
('cashier','$2b$10$L8QdqZ5/kbdTfH6Tino57.OvUh8uhDq2s8BaZnlXzVtcMhnFkdeM.', 'Thu ngân',         '0901234570', 2, TRUE);

-- Zones
INSERT IGNORE INTO zones (name) VALUES
('Sân trong'),
('Sân ngoài'),
('Khu Bi-a');

-- Tables
INSERT IGNORE INTO restaurant_tables (zone_id, name, type, status, capacity) VALUES
(1, 'Bàn 1', 'DRINK', 'EMPTY', 4),
(1, 'Bàn 2', 'DRINK', 'EMPTY', 4),
(1, 'Bàn 3', 'DRINK', 'EMPTY', 6),
(1, 'Bàn 4', 'DRINK', 'EMPTY', 6),
(2, 'Bàn 5', 'DRINK', 'EMPTY', 4),
(2, 'Bàn 6', 'DRINK', 'EMPTY', 4),
(2, 'Bàn 7', 'DRINK', 'EMPTY', 4),
(3, 'Bida 1', 'BILLIARD', 'EMPTY', 6),
(3, 'Bida 2', 'BILLIARD', 'EMPTY', 6),
(3, 'Bida 3', 'BILLIARD', 'EMPTY', 6);

-- Categories
INSERT IGNORE INTO categories (name, sort_order, is_active) VALUES
('Cà phê/ Cacao',       1, TRUE),
('Sữa chua/ Sữa tươi',  2, TRUE),
('Trà sữa',             3, TRUE),
('Latte',               4, TRUE),
('Đồ ăn vặt',           5, TRUE),
('Trà hoa quả',         6, TRUE),
('Sinh tố/ Nước ép',    7, TRUE);

-- Products — Cà phê/ Cacao (cat 1)
INSERT IGNORE INTO products (category_id, name, base_price, is_active) VALUES
(1, 'Cà phê Đen / Sữa (Nóng, Đá)',              20000, TRUE),
(1, 'Cà phê (Sữa dừa/Kem muối/Kem trứng)',       25000, TRUE),
(1, 'Bạc xỉu',                                   25000, TRUE),
(1, 'Cacao',                                      20000, TRUE),
(1, 'Cacao (Kem muối/Kem trứng)',                 25000, TRUE),
(1, 'Cà phê hạnh nhân',                           30000, TRUE);

-- Products — Sữa chua/ Sữa tươi (cat 2)
INSERT IGNORE INTO products (category_id, name, base_price, is_active) VALUES
(2, 'Sữa chua đá',                               25000, TRUE),
(2, 'Sữa chua các vị (Dâu/Xoài/Việt quất...)',  30000, TRUE),
(2, 'Sữa chua muối',                             30000, TRUE),
(2, 'Sữa tươi trân châu đường đen',              30000, TRUE),
(2, 'Sữa mây hồng kem chess',                    30000, TRUE);

-- Products — Trà sữa (cat 3)
INSERT IGNORE INTO products (category_id, name, base_price, is_active) VALUES
(3, 'Hồng trà sữa truyền thống',                 25000, TRUE),
(3, 'Hồng trà sữa (Kem muối/trứng/chess)',        30000, TRUE),
(3, 'Trà sữa socola',                            25000, TRUE),
(3, 'Trà sữa khoai môn',                         25000, TRUE),
(3, 'Trà sữa bạc hà',                            30000, TRUE),
(3, 'Trà sữa các vị (Dâu/Xoài/Việt quất...)',   30000, TRUE),
(3, 'Trà sữa gạo rang',                          25000, TRUE),
(3, 'Trà gạo dừa nướng',                         30000, TRUE),
(3, 'Trà sữa hạnh nhân',                         30000, TRUE);

-- Products — Latte (cat 4)
INSERT IGNORE INTO products (category_id, name, base_price, is_active) VALUES
(4, 'Matcha latte',                              30000, TRUE),
(4, 'Khoai môn latte',                           30000, TRUE),
(4, 'Cacao latte',                               30000, TRUE),
(4, 'Latte bạc hà socola giòn',                 35000, TRUE);

-- Products — Đồ ăn vặt (cat 5)
INSERT IGNORE INTO products (category_id, name, base_price, is_active) VALUES
(5, 'Xúc xích',                                  10000, TRUE);

-- Products — Trà hoa quả (cat 6)
INSERT IGNORE INTO products (category_id, name, base_price, is_active) VALUES
(6, 'Trà chanh/tắc xí muội',                    20000, TRUE),
(6, 'Trà gừng',                                  20000, TRUE),
(6, 'Trà lựu đào',                               25000, TRUE),
(6, 'Thanh nhài hạt dẻ cười',                   30000, TRUE),
(6, 'Trà Ôlong sen vàng',                        30000, TRUE),
(6, 'Trà xoài kem chess',                        30000, TRUE),
(6, 'Trà đào cam sả',                            30000, TRUE);

-- Products — Sinh tố/ Nước ép (cat 7)
INSERT IGNORE INTO products (category_id, name, base_price, is_active) VALUES
(7, 'Nước ép Dứa',                               25000, TRUE),
(7, 'Nước ép Cam',                               30000, TRUE),
(7, 'Sen dừa matcha',                            30000, TRUE),
(7, 'Sinh tố Xoài',                              30000, TRUE),
(7, 'Sinh tố Bơ',                                30000, TRUE),
(7, 'Bơ già dừa non',                            35000, TRUE);

-- Billiard Pricing (default pricing — áp dụng tất cả bàn)
INSERT IGNORE INTO billiard_pricing (table_id, day_type, start_time, end_time, price_per_hour) VALUES
(NULL, 'WEEKDAY', '07:00:00', '23:59:59', 60000),
(NULL, 'WEEKEND', '07:00:00', '23:59:59', 80000);
