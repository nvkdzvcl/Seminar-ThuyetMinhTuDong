USE vinhkhanhfoodtour;

SET FOREIGN_KEY_CHECKS = 0;
SET SQL_SAFE_UPDATES = 0;

DELETE FROM tour_stop_item;
DELETE FROM tour_stop;
DELETE FROM tour_plan;
DELETE FROM order_item;
DELETE FROM orders;
DELETE FROM audio;
DELETE FROM dish;
DELETE FROM shop;
DELETE FROM shop_type;
DELETE FROM language;
DELETE FROM users;
DELETE FROM poi_moderation_log;
DELETE FROM poi_menu_item;
DELETE FROM poi;
DELETE FROM poi_approval_history;
DELETE FROM admin_audit_logs;
DELETE FROM admin_jobs;
DELETE FROM admin_settings;
DELETE FROM analytics_event;

SET FOREIGN_KEY_CHECKS = 1;

-- =========================
-- 1) USERS (5 rows)
-- role: CUSTOMER, OWNER_SHOP, ADMIN
-- status: ACTIVE, DELETED
-- =========================
INSERT INTO users
(id, full_name, phone_number, email, password, language, role, created_at, status)
VALUES
(1, 'ADMIN',      '0901000001', 'admin',  '$2a$10$InlLC0hKujhnwNGK45nqL.hUHZPNh4Azuhq05mB9xL7fTKFqWtnCK', 'vi', 'ADMIN',   '2026-03-01', 'ACTIVE'),
(2, 'user123',     '0901000002', 'user123@gmail.com',      '$2a$10$InlLC0hKujhnwNGK45nqL.hUHZPNh4Azuhq05mB9xL7fTKFqWtnCK', 'vi', 'CUSTOMER', '2026-03-01', 'ACTIVE'),
(3, 'owner',     '0901000003', 'owner@gmail.com',    '$2a$10$MiWdfWi2Af4vK6hwSzboQuu6Ydtj0LxGUdYCbBjgU5/5o8uNEL1za', 'vi', 'OWNER_SHOP', '2026-03-01', 'ACTIVE'),
(4, 'owner2',     '0901000004', 'owner2@gmail.com',   '$2a$10$MiWdfWi2Af4vK6hwSzboQuu6Ydtj0LxGUdYCbBjgU5/5o8uNEL1za', 'en', 'OWNER_SHOP', '2026-03-01', 'ACTIVE'),
(5, 'user124',      '0901000005', 'user124@gmail.com',          '$2a$10$InlLC0hKujhnwNGK45nqL.hUHZPNh4Azuhq05mB9xL7fTKFqWtnCK', 'vi', 'CUSTOMER',      '2026-03-01', 'ACTIVE');

-- =========================
-- 1.1) POI (5 rows)
-- status: DRAFT, PUBLISHED, FLAGGED, HIDDEN
-- =========================
INSERT INTO poi
(id, shop_id, name, description, address, lat, lng, region, category, owner_id, owner_name, cover_image, qr_code, risk_flag, risk_score, rejection_reason, status, created_at, updated_at)
VALUES
(1, 1, 'Oc Dao Vinh Khanh', NULL, '15 Vinh Khanh, Quan 4, TP.HCM', 10.7607194, 106.7007169, NULL, 'SEAFOOD', 2, 'user123', 'shop1.jpg', 'QR-POI-0001', b'0', NULL, NULL, 'PUBLISHED', '2026-03-01 08:00:00', '2026-03-20 10:00:00'),
(2, 2, 'Banh Canh Cua Co Dung', NULL, '25 Vinh Khanh, Quan 4, TP.HCM', 10.7612809, 106.7033943, NULL, 'NOODLE', 3, 'owner', 'shop2.jpg', 'QR-POI-0002', b'0', NULL, NULL, 'PUBLISHED', '2026-03-01 09:00:00', '2026-03-19 14:30:00'),
(3, 3, 'An Vat Cua Pho', NULL, '39 Vinh Khanh, Quan 4, TP.HCM', 10.7611719, 106.7033665, NULL, 'SNACK', 4, 'owner2', 'shop3.jpg', 'QR-POI-0003', b'1', 75, 'Ảnh biển hiệu chưa rõ, vui lòng cập nhật lại.', 'FLAGGED', '2026-03-02 10:00:00', '2026-03-20 09:00:00'),
(4, 4, 'Tra Sua Dem Sai Gon', NULL, '52 Vinh Khanh, Quan 4, TP.HCM', 10.7617836, 106.7036373, NULL, 'DRINK', 5, 'user124', 'shop4.jpg', NULL, b'0', NULL, NULL, 'DRAFT', '2026-03-10 08:00:00', '2026-03-19 11:00:00'),
(5, 5, 'Hai San Nuong 1995', NULL, '66 Vinh Khanh, Quan 4, TP.HCM', 10.7615518,106.7023348, NULL, 'SEAFOOD', 1, 'ADMIN', 'shop5.jpg', 'QR-POI-0005', b'1', 85, 'Thiếu thông tin giờ mở cửa.', 'HIDDEN', '2026-03-03 10:00:00', '2026-03-12 16:00:00');

INSERT INTO poi_menu_item
(id, poi_id, name, description_text, price, rating, moderation_status, is_signature, image_url, audio_script_text, risk_score, risk_flags, status, created_at, updated_at)
VALUES
(1, 1, 'Ốc hương rang muối', 'Ốc hương tươi rang muối ớt, vị cay nhẹ.', 90000, 4.8, 'AN_TOAN', b'1', 'dish1.jpg', 'Món ốc hương rang muối là đặc sản nổi bật của quán.', 5, NULL, 'ACTIVE', '2026-03-01 08:00:00', '2026-03-20 10:00:00'),
(2, 1, 'Nghêu hấp sả', 'Nghêu hấp nóng với sả và lá chanh.', 70000, 4.5, 'AN_TOAN', b'0', 'dish2.jpg', 'Nghêu hấp sả mang hương thơm dịu và vị ngọt tự nhiên.', 3, NULL, 'ACTIVE', '2026-03-01 08:10:00', '2026-03-20 10:05:00'),
(3, 3, 'Xiên que tổng hợp', 'Các loại xiên nướng ăn kèm sốt.', 45000, 3.9, 'CAN_XEM_LAI', b'1', 'dish3.jpg', 'Xiên que tổng hợp phù hợp nhóm bạn ăn tối.', 62, 'toxic_term', 'FLAGGED', '2026-03-02 10:10:00', '2026-03-20 09:10:00');

INSERT INTO poi_moderation_log
(id, poi_id, menu_item_id, field_name, text_snapshot, risk_score, labels, matched_terms, suggested_rewrite, model_version, status, reviewed_by, reviewed_at, created_at)
VALUES
(1, 3, NULL, 'poi.description_text', 'Mô tả quán có vài cụm từ không phù hợp...', 75, 'abusive', 'xấu|tục', 'Gợi ý thay bằng mô tả trung tính hơn.', 'moderation-v1', 'REVIEW_REQUIRED', NULL, NULL, '2026-03-20 09:00:00'),
(2, 3, 3, 'menu_item.description_text', 'Nội dung mô tả món có từ nhạy cảm.', 62, 'abusive', 'tục', 'Viết lại mô tả món rõ ràng, không từ nhạy cảm.', 'moderation-v1', 'REVIEW_REQUIRED', NULL, NULL, '2026-03-20 09:05:00');

INSERT INTO poi_approval_history
(id, shop_id, poi_id, status, submitted_at, reviewer, reviewed_at, reason)
VALUES
(1, 3, 3, 'pending', '2026-03-17 09:10:00', NULL, NULL, NULL),
(2, 3, 3, 'rejected', '2026-03-18 14:20:00', 'Admin', '2026-03-18 14:20:00', 'Ảnh biển hiệu chưa rõ, vui lòng cập nhật lại.'),
(3, 4, 4, 'pending', '2026-03-20 08:30:00', NULL, NULL, NULL);

-- =========================
-- 2) LANGUAGE (3 rows)
-- =========================
INSERT INTO language
(id, language_name, code)
VALUES
(1, 'Tiếng Việt', 'vi'),
(2, 'English',    'en'),
(3, '한국어',      'ko');

-- =========================
-- 3) SHOP TYPE (4 rows)
-- =========================
INSERT INTO shop_type
(id, name, description)
VALUES
(1, 'SEAFOOD', 'Quán hải sản, ốc, nướng'),
(2, 'NOODLE',  'Bún, mì, bánh canh, hủ tiếu'),
(3, 'SNACK',   'Ăn vặt, xiên que, bánh tráng'),
(4, 'DRINK',   'Nước uống, chè, trà sữa');

-- =========================
-- 4) SHOP (5 rows)
-- shop.status: enum Status nhưng trong entity không @Enumerated,
-- thường Hibernate sẽ lưu ordinal -> ACTIVE = 0, DELETED = 1
-- =========================
INSERT INTO shop
(id, owner_id, shop_type_id, name, address, description, image_name, audioURL, lat, lng, avg_cost_per_person, avg_wait_time_min, avg_eat_time_min, created_at, status)
VALUES
(1, 2, 1, 'Oc Dao Vinh Khanh', '15 Vinh Khanh, Quan 4, TP.HCM', 'Chuyen cac mon oc tuoi song va nuong muoi ot', 'shop1.jpg', 'shop1.mp3', 10.7607194, 106.7007169, 120000, 12, 35, '2026-03-01', "ACTIVE"),

(2, 3, 2, 'Banh Canh Cua Co Dung',      '25 Vinh Khanh, Quan 4, TP.HCM', 'Banh canh cua dac biet, nuoc dung dam da', 'shop2.jpg', 'shop2.mp3', 10.7612809, 106.7033943, 85000, 8, 25, '2026-03-01', "ACTIVE"),

(3, 4, 3, 'An Vat Cua Pho',             '39 Vinh Khanh, Quan 4, TP.HCM', 'Banh trang, ca vien chien, tokbokki va mon an vat', 'shop3.jpg', 'shop3.mp3', 10.7611719, 106.7033665, 60000, 6, 20, '2026-03-01', "ACTIVE"),

(4, 5, 4, 'Tra Sua Dem Sai Gon',        '52 Vinh Khanh, Quan 4, TP.HCM', 'Tra sua, tra tac, nuoc ep va cac mon giai nhiet', 'shop4.jpg', 'shop4.mp3', 10.7617836, 106.7036373, 45000, 5, 15, '2026-03-01', "ACTIVE"),

(5, 1, 1, 'Hai San Nuong 1995',         '66 Vinh Khanh, Quan 4, TP.HCM', 'Hai san nuong mo hanh, tom, muc, so diep', 'shop5.jpg', 'shop5.mp3', 10.7615518,106.7023348, 150000, 15, 40, '2026-03-01', "ACTIVE");

-- =========================
-- 5) DISH (20 rows)
-- dish.status có @Enumerated(EnumType.STRING) -> dùng ACTIVE/DELETED
-- =========================
INSERT INTO dish
(id, shop_id, name, description, price, is_signature, image, created_at, status)
VALUES
-- Shop 1
(1, 1, 'Oc Huong Rang Muoi',      'Oc huong xao muoi cay nhe',         90000, 1, 'dish1.jpg',  '2026-03-01', 'ACTIVE'),
(2, 1, 'Oc Len Xao Dua',          'Oc len beo thom voi nuoc cot dua',  85000, 1, 'dish2.jpg',  '2026-03-01', 'ACTIVE'),
(3, 1, 'Ngao Hap Thai',           'Ngao hap sa ot kieu Thai',          75000, 0, 'dish3.jpg',  '2026-03-01', 'ACTIVE'),
(4, 1, 'So Diep Nuong Mo Hanh',   'So diep tuoi nuong mo hanh',        95000, 0, 'dish4.jpg',  '2026-03-01', 'ACTIVE'),

-- Shop 2
(5, 2, 'Banh Canh Cua Dac Biet',  'Banh canh cua nhieu topping',         65000, 1, 'dish5.jpg',  '2026-03-01', 'ACTIVE'),
(6, 2, 'Banh Canh Tom Cua',       'Banh canh tom cua vua an',            55000, 0, 'dish6.jpg',  '2026-03-01', 'ACTIVE'),
(7, 2, 'Chao Cua',                'Chao cua mem, de an',                 50000, 0, 'dish7.jpg',  '2026-03-01', 'ACTIVE'),
(8, 2, 'Banh Quai Chien',         'Banh quai an kem banh canh',          15000, 0, 'dish8.jpg',  '2026-03-01', 'ACTIVE'),

-- Shop 3
(9,  3, 'Banh Trang Tron',        'Banh trang tron bo kho, trung cut',    30000, 1, 'dish9.jpg',  '2026-03-01', 'ACTIVE'),
(10, 3, 'Ca Vien Chien',          'Ca vien chien gion, sot cay ngot',     25000, 0, 'dish10.jpg', '2026-03-01', 'ACTIVE'),
(11, 3, 'Tokbokki Pho Mai',       'Tokbokki sot Han va pho mai',          45000, 1, 'dish11.jpg', '2026-03-01', 'ACTIVE'),
(12, 3, 'Khoai Tay Lac Pho Mai',  'Khoai tay chien lac bot pho mai',      35000, 0, 'dish12.jpg', '2026-03-01', 'ACTIVE'),

-- Shop 4
(13, 4, 'Tra Sua Tran Chau',      'Tra sua truyen thong tran chau',       35000, 1, 'dish13.jpg', '2026-03-01', 'ACTIVE'),
(14, 4, 'Tra Tac Khong Lo',       'Tra tac giai nhiet',                   20000, 0, 'dish14.jpg', '2026-03-01', 'ACTIVE'),
(15, 4, 'Hong Tra Macchiato',     'Hong tra kem sua beo',                 40000, 0, 'dish15.jpg', '2026-03-01', 'ACTIVE'),
(16, 4, 'Che Khuc Bach',          'Che khuc bach mat lanh',             30000, 1, 'dish16.jpg', '2026-03-01', 'ACTIVE'),

-- Shop 5
(17, 5, 'Tom Nuong Muoi Ot',      'Tom nuong muoi ot cay nhe',        110000, 1, 'dish17.jpg', '2026-03-01', 'ACTIVE'),
(18, 5, 'Muc Nuong Sa Te',        'Muc nuong thom, cay vua',          105000, 1, 'dish18.jpg', '2026-03-01', 'ACTIVE'),
(19, 5, 'Hau Nuong Pho Mai',      'Hau tuoi nuong pho mai beo',        95000, 0, 'dish19.jpg', '2026-03-01', 'ACTIVE'),
(20, 5, 'Lau Hai San Mini',       'Lau mini cho 2 nguoi',             150000, 0, 'dish20.jpg', '2026-03-01', 'ACTIVE');

-- =========================
-- 6) AUDIO (12 rows)
-- =========================
INSERT INTO audio
(id, dish_id, audio_name, language_id)
VALUES
(1,  1,  'oc_huong_vi.mp3',      1),
(2,  1,  'oc_huong_en.mp3',      2),
(3,  2,  'oc_len_vi.mp3',        1),
(4,  5,  'banh_canh_vi.mp3',     1),
(5,  5,  'banh_canh_en.mp3',     2),
(6,  9,  'banh_trang_vi.mp3',    1),
(7, 11,  'tokbokki_vi.mp3',      1),
(8, 13,  'tra_sua_vi.mp3',       1),
(9, 14,  'tra_tac_vi.mp3',       1),
(10,17,  'tom_nuong_vi.mp3',     1),
(11,18,  'muc_nuong_vi.mp3',     1),
(12,20,  'lau_hai_san_en.mp3',   2);

-- =========================
-- 7) ORDERS (10 rows)
-- payment_method / payment_status / status thường đang là ordinal
-- PaymentMethod: CASH=0, BANKING=1
-- PaymentStatus: PENDING=0, COMPLETED=1, FAILED=2, REFUNDED=3
-- Status: ACTIVE=0, DELETED=1
-- =========================
INSERT INTO orders
(id, shop_id, customer_id, total_price, payment_method, created_at, payment_status, status)
VALUES
(1, 1, 1, 175000, 0, '2026-03-16', 1, "ACTIVE"),
(2, 2, 1, 130000, 1, '2026-03-17', 1, "ACTIVE"),
(3, 3, 1,  75000, 0, '2026-03-17', 1, "ACTIVE"),
(4, 4, 1,  60000, 1, '2026-03-18', 1, "ACTIVE"),
(5, 5, 1, 215000, 0, '2026-03-19', 0, "ACTIVE"),
(6, 1, 1,  90000, 1, '2026-03-20', 1, "ACTIVE"),
(7, 2, 1,  65000, 0, '2026-03-21', 1, "ACTIVE"),
(8, 3, 1, 105000, 1, '2026-03-22', 1, "ACTIVE"),
(9, 4, 1,  70000, 0, '2026-03-22', 0, "ACTIVE"),
(10,5, 1, 300000, 1, '2026-03-22', 1, "ACTIVE");

-- =========================
-- 8) ORDER ITEM (18 rows)
-- OrderItemStatus ordinal:
-- WAITING=0, IN_PROGRESS=1, COMPLETED=2, CANCELLED=3
-- =========================
INSERT INTO order_item
(id, dish_id, order_id, quantity, price_per_unit, status)
VALUES
(1,  1,  1, 1,  90000, "WAITING"),
(2,  2,  1, 1,  85000, "WAITING"),

(3,  5,  2, 2,  65000, "WAITING"),

(4,  9,  3, 1,  30000, "WAITING"),
(5, 10,  3, 1,  25000, "WAITING"),
(6, 12,  3, 1,  35000, "WAITING"),

(7, 13,  4, 1,  35000, "WAITING"),
(8, 16,  4, 1,  30000, "WAITING"),

(9, 17,  5, 1, 110000, "WAITING"),
(10,19,  5, 1,  95000, "WAITING"),

(11, 1,  6, 1,  90000, "WAITING"),

(12, 5,  7, 1,  65000, "WAITING"),

(13, 9,  8, 1,  30000, "WAITING"),
(14,11,  8, 1,  45000, "WAITING"),
(15,12,  8, 1,  35000, "WAITING"),

(16,13,  9, 2,  35000, "WAITING"),

(17,17, 10, 1, 110000, "WAITING"),
(18,20, 10, 1, 150000, "WAITING");

-- =========================
-- 9) TOUR PLAN (5 rows)
-- tour_plan.status ordinal: ACTIVE=0, DELETED=1
-- =========================
INSERT INTO tour_plan
(id, customer_id, budget_total, tour_stop_count, time_total_min, people_count, est_cost, created_at, status)
VALUES
(1, 1, 300000, 3, 120, 2, 295000, '2026-03-05', "ACTIVE"),
(2, 1, 180000, 2,  60, 1, 165000, '2026-03-06', "ACTIVE"),
(3, 1, 450000, 3, 150, 3, 430000, '2026-03-07', "ACTIVE"),
(4, 1, 120000, 2,  45, 1, 110000, '2026-03-08', "ACTIVE"),
(5, 1, 600000, 4, 180, 4, 590000, '2026-03-09', "ACTIVE");

-- =========================
-- 10) TOUR STOP (12 rows)
-- planed_cost theo đúng tên cột Hibernate đang tạo
-- =========================
INSERT INTO tour_stop
(id, shop_id, stop_index, planned_cost, time_to_spend_in_minutes, tour_plan_id)
VALUES
(1,  2, 1, 130000, 30, 1),
(2,  1, 2,  85000, 40, 1),
(3,  4, 3,  80000, 20, 1),

(4,  2, 1,  65000, 25, 2),
(5,  4, 2, 100000, 20, 2),
(6,  5, 1, 215000, 45, 3),
(7,  1, 2, 175000, 40, 3),
(8,  4, 3,  40000, 15, 3),

(9,  3, 1,  75000, 20, 4),
(10, 4, 2,  35000, 15, 4),

(11, 5, 1, 300000, 50, 5),
(12, 3, 2, 105000, 25, 5);

-- =========================
-- 11) TOUR STOP ITEM (16 rows)
-- Bảng hiện tại có cả order_id và tour_stop_id.
-- Seed theo schema hiện tại: để order_id NULL, gắn tour_stop_id.
-- =========================
INSERT INTO tour_stop_item
(id, dish_id, quantity, price_per_unit, tour_stop_id)
VALUES
(1,  5,  2,  65000, 1),
(2,  2,  1,  85000, 2),
(3, 13,  1,  35000, 3),
(4, 16,  1,  30000, 3),

(5,  5,  1,  65000, 4),
(6, 13,  2,  35000, 5),
(7, 14,  1,  20000, 5),

(8, 17,  1, 110000, 6),
(9, 19,  1,  95000, 6),
(10, 1,  1,  90000, 7),
(11, 2,  1,  85000, 7),
(12, 14,  2,  20000, 8),

(13, 9,  1,  30000, 9),
(14, 12,  1,  35000, 9),
(15, 13,  1,  35000, 10),
(16, 20,  2, 150000, 11);

-- reset auto increment cho tiện nếu cần
ALTER TABLE users AUTO_INCREMENT = 6;
ALTER TABLE language AUTO_INCREMENT = 4;
ALTER TABLE shop_type AUTO_INCREMENT = 5;
ALTER TABLE shop AUTO_INCREMENT = 6;
ALTER TABLE dish AUTO_INCREMENT = 21;
ALTER TABLE audio AUTO_INCREMENT = 13;
ALTER TABLE orders AUTO_INCREMENT = 11;
ALTER TABLE order_item AUTO_INCREMENT = 19;
ALTER TABLE tour_plan AUTO_INCREMENT = 6;
ALTER TABLE tour_stop AUTO_INCREMENT = 13;
ALTER TABLE tour_stop_item AUTO_INCREMENT = 17;
ALTER TABLE poi AUTO_INCREMENT = 6;
ALTER TABLE poi_menu_item AUTO_INCREMENT = 4;
ALTER TABLE poi_moderation_log AUTO_INCREMENT = 3;
ALTER TABLE poi_approval_history AUTO_INCREMENT = 4;
ALTER TABLE admin_jobs AUTO_INCREMENT = 1;
ALTER TABLE admin_settings AUTO_INCREMENT = 1;
ALTER TABLE analytics_event AUTO_INCREMENT = 1;

INSERT INTO admin_jobs
(job_code, type, status, related_poi_id, related_user_id, retry_count, error_message, created_at, started_at, ended_at)
VALUES
('JOB-20260323-0001', 'AUDIO_GENERATION', 'DONE', 1, 1, 0, NULL, '2026-03-22 08:00:00', '2026-03-22 08:01:00', '2026-03-22 08:03:00'),
('JOB-20260323-0002', 'CONTENT_MODERATION', 'FAILED', 3, 1, 1, 'AI moderation timeout', '2026-03-22 09:00:00', '2026-03-22 09:01:00', '2026-03-22 09:04:00'),
('JOB-20260323-0003', 'DATA_SYNC', 'PROCESSING', NULL, 1, 0, NULL, '2026-03-22 10:00:00', '2026-03-22 10:00:30', NULL),
('JOB-20260323-0004', 'IMAGE_PROCESSING', 'QUEUED', 5, 1, 0, NULL, '2026-03-22 11:00:00', NULL, NULL),
('JOB-20260323-0005', 'CONTENT_MODERATION', 'CANCELED', 4, 1, 0, 'Canceled by admin', '2026-03-22 12:00:00', '2026-03-22 12:01:00', '2026-03-22 12:02:00');

INSERT INTO admin_settings
(setting_key, setting_value, updated_at)
VALUES
('request_timeout_seconds', '30', NOW()),
('default_language', 'vi', NOW()),
('max_upload_size_mb', '10', NOW()),
('maintenance_mode', 'false', NOW()),
('debug_mode', 'false', NOW()),
('risk_threshold_low', '30', NOW()),
('risk_threshold_high', '70', NOW()),
('auto_flag_enabled', 'true', NOW()),
('require_approval_above_threshold', 'true', NOW());
`
