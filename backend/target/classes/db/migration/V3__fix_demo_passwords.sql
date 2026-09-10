-- Hash BCrypt đã kiểm tra khớp mật khẩu 123456
UPDATE users
SET password_hash = '$2b$10$L8QdqZ5/kbdTfH6Tino57.OvUh8uhDq2s8BaZnlXzVtcMhnFkdeM.'
WHERE username IN ('admin', 'kds', 'waiter', 'cashier');
