-- 祭祖后台初始数据

-- 插入默认商品分类
INSERT INTO product_categories (id, name, image, sort, status, created_at, updated_at) VALUES
(1, '纸钱', '', 100, 'ACTIVE', datetime('now'), datetime('now')),
(2, '金元宝', '', 90, 'ACTIVE', datetime('now'), datetime('now')),
(3, '银元宝', '', 80, 'ACTIVE', datetime('now'), datetime('now')),
(4, '香烛', '', 70, 'ACTIVE', datetime('now'), datetime('now')),
(5, '祭祀套装', '', 60, 'ACTIVE', datetime('now'), datetime('now')),
(6, '其他', '', 50, 'ACTIVE', datetime('now'), datetime('now'));

-- 插入默认祭祀套餐
INSERT INTO ritual_packages (id, name, description, cover, price, sort, status, created_at, updated_at) VALUES
(1, '基础祭祀', '包含基本祭祀用品和仪式', '', 168.00, 100, 'ACTIVE', datetime('now'), datetime('now')),
(2, '诚心祭祀', '包含丰富祭祀用品和完整祭祀流程', '', 268.00, 90, 'ACTIVE', datetime('now'), datetime('now')),
(3, '敬亲祭祀', '包含高端祭祀用品和隆重祭祀仪式', '', 398.00, 80, 'ACTIVE', datetime('now'), datetime('now'));

-- 插入默认管理员 (密码: admin123)
INSERT INTO admins (id, username, password, nickname, phone, role, status, created_at, updated_at) VALUES
(1, 'admin', 'admin123', '超级管理员', '', 'SUPER_ADMIN', 'ACTIVE', datetime('now'), datetime('now')),
(2, 'ritual', 'ritual123', '祭祀管理员', '', 'RITUAL_ADMIN', 'ACTIVE', datetime('now'), datetime('now')),
(3, 'product', 'product123', '商品管理员', '', 'PRODUCT_ADMIN', 'ACTIVE', datetime('now'), datetime('now'));

-- 插入默认系统设置
INSERT INTO system_settings (key, value, updated_at) VALUES
('mini_program_name', '祭祖小程序', datetime('now')),
('customer_phone', '400-123-4567', datetime('now')),
('customer_wechat', 'kefu-wechat', datetime('now')),
('ritual_service_desc', '我们提供专业的代祭祀服务，全程视频记录，让您随时随地缅怀亲人。', datetime('now')),
('video_retention_days', '365', datetime('now'));
