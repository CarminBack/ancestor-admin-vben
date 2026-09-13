-- 小程序接口测试数据

-- 更新商品分类 code
UPDATE product_categories SET code = 'paper' WHERE name = '纸钱';
UPDATE product_categories SET code = 'incense' WHERE name = '香';
UPDATE product_categories SET code = 'candle' WHERE name = '香烛';
UPDATE product_categories SET code = 'flower' WHERE name = '鲜花';
UPDATE product_categories SET code = 'fruit' WHERE name = '水果';
UPDATE product_categories SET code = 'other' WHERE name = '其他';

-- 插入测试商品（纸钱类）
INSERT INTO products (id, category_id, name, code, cover, description, price, stock, status, sort, created_at, updated_at) VALUES
(1, 1, '传统金元宝', 'gold', 'https://example.com/gold.jpg', '传统手工制作，祭祀专用金元宝', 39.90, 300, 'ACTIVE', 100, datetime('now'), datetime('now')),
(2, 1, '传统银元宝', 'silver', 'https://example.com/silver.jpg', '传统手工制作，祭祀专用银元宝', 29.90, 250, 'ACTIVE', 90, datetime('now'), datetime('now')),
(3, 1, '祭祀纸钱', 'paper_money', 'https://example.com/paper.jpg', '高品质祭祀纸钱', 19.90, 500, 'ACTIVE', 80, datetime('now'), datetime('now'));

-- 插入商品规格（金元宝）
INSERT INTO product_specs (product_id, name, price, stock, sort, status, created_at, updated_at) VALUES
(1, '50个', 39.90, 100, 100, 'ACTIVE', datetime('now'), datetime('now')),
(1, '100个', 69.90, 80, 90, 'ACTIVE', datetime('now'), datetime('now')),
(1, '500个', 199.90, 20, 80, 'ACTIVE', datetime('now'), datetime('now'));

-- 插入商品规格（银元宝）
INSERT INTO product_specs (product_id, name, price, stock, sort, status, created_at, updated_at) VALUES
(2, '50个', 29.90, 120, 100, 'ACTIVE', datetime('now'), datetime('now')),
(2, '100个', 49.90, 100, 90, 'ACTIVE', datetime('now'), datetime('now')),
(2, '500个', 149.90, 30, 80, 'ACTIVE', datetime('now'), datetime('now'));

-- 插入商品规格（纸钱）
INSERT INTO product_specs (product_id, name, price, stock, sort, status, created_at, updated_at) VALUES
(3, '1刀', 19.90, 200, 100, 'ACTIVE', datetime('now'), datetime('now')),
(3, '3刀', 49.90, 150, 90, 'ACTIVE', datetime('now'), datetime('now')),
(3, '10刀', 139.90, 50, 80, 'ACTIVE', datetime('now'), datetime('now'));

-- 插入更多商品分类的商品
INSERT INTO products (category_id, name, code, cover, description, price, stock, status, sort, created_at, updated_at) VALUES
(2, '天然檀香', 'incense_01', 'https://example.com/incense.jpg', '天然檀香，香气持久', 59.90, 200, 'ACTIVE', 100, datetime('now'), datetime('now')),
(2, '沉香', 'incense_02', 'https://example.com/incense2.jpg', '上等沉香，适合祭祀', 99.90, 150, 'ACTIVE', 90, datetime('now'), datetime('now')),
(4, '白蜡烛', 'candle_01', 'https://example.com/candle.jpg', '传统白蜡烛', 29.90, 300, 'ACTIVE', 100, datetime('now'), datetime('now')),
(4, '红蜡烛', 'candle_02', 'https://example.com/candle2.jpg', '喜庆红蜡烛', 29.90, 300, 'ACTIVE', 90, datetime('now'), datetime('now'));

-- 插入香规格
INSERT INTO product_specs (product_id, name, price, stock, sort, status, created_at, updated_at) VALUES
(4, '1盒', 59.90, 100, 100, 'ACTIVE', datetime('now'), datetime('now')),
(4, '3盒', 149.90, 80, 90, 'ACTIVE', datetime('now'), datetime('now')),
(5, '1盒', 99.90, 80, 100, 'ACTIVE', datetime('now'), datetime('now')),
(5, '2盒', 179.90, 50, 90, 'ACTIVE', datetime('now'), datetime('now')),
(6, '10支', 29.90, 150, 100, 'ACTIVE', datetime('now'), datetime('now')),
(6, '50支', 99.90, 100, 90, 'ACTIVE', datetime('now'), datetime('now')),
(7, '10支', 29.90, 150, 100, 'ACTIVE', datetime('now'), datetime('now')),
(7, '50支', 99.90, 100, 90, 'ACTIVE', datetime('now'), datetime('now'));

-- 插入客服配置
INSERT OR REPLACE INTO system_settings (key, value, updated_at) VALUES
('service_name', '祭祀客服', datetime('now')),
('service_wechat_id', 'jisi_kefu_001', datetime('now')),
('service_wechat_qrcode', 'https://example.com/qrcode.jpg', datetime('now')),
('service_phone', '400-123-4567', datetime('now')),
('service_work_time', '9:00-18:00', datetime('now')),
('service_notice', '添加客服时请备注订单号，客服将在1小时内回复', datetime('now'));

-- 插入测试祭祀订单（已完成，含视频）
INSERT INTO ritual_orders (order_no, order_name, deceased_name, package_id, package_name, amount, ritual_date, status, paid_at, completed_at, created_at, updated_at) VALUES
('JS202609010001', '张三', '张XX', 1, '基础祭祀', 168.00, '2026-09-01', 'COMPLETED', datetime('now', '-7 days'), datetime('now', '-1 days'), datetime('now', '-10 days'), datetime('now', '-1 days'));

-- 插入测试视频
INSERT INTO ritual_videos (ritual_order_id, type, title, video_url, thumbnail_url, duration, status, created_at, updated_at) VALUES
(1, 'PREPARE', '祭祀准备', 'https://example.com/video/prepare.mp4', 'https://example.com/video/prepare.jpg', 120, 'ACTIVE', datetime('now', '-2 days'), datetime('now', '-2 days')),
(1, 'PACKAGE', '封包', 'https://example.com/video/package.mp4', 'https://example.com/video/package.jpg', 180, 'ACTIVE', datetime('now', '-2 days'), datetime('now', '-2 days')),
(1, 'BURN', '焚化', 'https://example.com/video/burn.mp4', 'https://example.com/video/burn.jpg', 150, 'ACTIVE', datetime('now', '-1 days'), datetime('now', '-1 days'));

-- 插入测试用品订单
INSERT INTO product_orders (order_no, total_amount, status, receiver_name, receiver_phone, province, city, district, detail_address, receiver_address, paid_at, created_at, updated_at) VALUES
('SP202609050001', 79.80, 'COMPLETED', '李四', '13800138000', '广东省', '广州市', '天河区', '天河路123号', '广东省广州市天河区天河路123号', datetime('now', '-3 days'), datetime('now', '-5 days'), datetime('now', '-2 days'));

-- 插入测试用品订单明细
INSERT INTO product_order_items (order_id, product_id, spec_id, spec_name, product_name, product_image, price, quantity, amount) VALUES
(1, 1, 1, '50个', '传统金元宝', 'https://example.com/gold.jpg', 39.90, 2, 79.80);
