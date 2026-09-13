-- 创建数据库
CREATE DATABASE IF NOT EXISTS ancestor_admin DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE ancestor_admin;

-- 商品分类表
CREATE TABLE IF NOT EXISTS product_categories (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  image VARCHAR(500),
  sort INT DEFAULT 0,
  status TINYINT DEFAULT 1 COMMENT '0-禁用 1-启用',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 商品表
CREATE TABLE IF NOT EXISTS products (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  category_id VARCHAR(36) NOT NULL,
  cover VARCHAR(500),
  images TEXT COMMENT 'JSON数组',
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  original_price DECIMAL(10, 2),
  stock INT DEFAULT 0,
  sales INT DEFAULT 0,
  status TINYINT DEFAULT 1 COMMENT '0-下架 1-上架',
  sort INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES product_categories(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 商品订单表
CREATE TABLE IF NOT EXISTS product_orders (
  id VARCHAR(36) PRIMARY KEY,
  order_no VARCHAR(50) UNIQUE NOT NULL,
  product_id VARCHAR(36) NOT NULL,
  quantity INT NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  receiver_name VARCHAR(100) NOT NULL,
  receiver_phone VARCHAR(20) NOT NULL,
  receiver_address VARCHAR(500) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'PENDING_PAYMENT',
  paid_at TIMESTAMP NULL,
  shipped_at TIMESTAMP NULL,
  completed_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  INDEX idx_order_no (order_no),
  INDEX idx_status (status),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 祭祀套餐表
CREATE TABLE IF NOT EXISTS ritual_packages (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  cover VARCHAR(500),
  price DECIMAL(10, 2) NOT NULL,
  sort INT DEFAULT 0,
  status TINYINT DEFAULT 1 COMMENT '0-禁用 1-启用',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 祭祀订单表
CREATE TABLE IF NOT EXISTS ritual_orders (
  id VARCHAR(36) PRIMARY KEY,
  order_no VARCHAR(50) UNIQUE NOT NULL,
  order_name VARCHAR(100) NOT NULL,
  deceased_name VARCHAR(100) NOT NULL,
  package_id VARCHAR(36) NOT NULL,
  ritual_date VARCHAR(20) NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'PENDING_PAYMENT',
  remark TEXT,
  paid_at TIMESTAMP NULL,
  completed_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (package_id) REFERENCES ritual_packages(id) ON DELETE CASCADE,
  INDEX idx_order_no (order_no),
  INDEX idx_status (status),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 祭祀视频表
CREATE TABLE IF NOT EXISTS ritual_videos (
  id VARCHAR(36) PRIMARY KEY,
  ritual_order_id VARCHAR(36) NOT NULL,
  stage VARCHAR(50) NOT NULL COMMENT 'PREPARING-准备 PACKAGING-封包 BURNING-祭祀',
  title VARCHAR(200) NOT NULL,
  video_url VARCHAR(500) NOT NULL,
  thumbnail_url VARCHAR(500),
  duration INT COMMENT '视频时长(秒)',
  file_size BIGINT COMMENT '文件大小(字节)',
  status TINYINT DEFAULT 1,
  available_at TIMESTAMP NULL COMMENT '可查看时间',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (ritual_order_id) REFERENCES ritual_orders(id) ON DELETE CASCADE,
  INDEX idx_ritual_order (ritual_order_id),
  INDEX idx_stage (stage)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 祭祀操作日志表
CREATE TABLE IF NOT EXISTS ritual_logs (
  id VARCHAR(36) PRIMARY KEY,
  ritual_order_id VARCHAR(36) NOT NULL,
  from_status VARCHAR(50) NOT NULL,
  to_status VARCHAR(50) NOT NULL,
  operator_id VARCHAR(36),
  operator_name VARCHAR(100) NOT NULL,
  remark TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (ritual_order_id) REFERENCES ritual_orders(id) ON DELETE CASCADE,
  INDEX idx_ritual_order (ritual_order_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 管理员表
CREATE TABLE IF NOT EXISTS admins (
  id VARCHAR(36) PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  realname VARCHAR(100),
  phone VARCHAR(20),
  email VARCHAR(100),
  avatar VARCHAR(500),
  status TINYINT DEFAULT 1 COMMENT '0-禁用 1-启用',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 插入初始管理员账号 (密码: admin123)
INSERT INTO admins (id, username, password, realname, status)
VALUES ('1', 'admin', '$2b$10$N5YqjKzXxJE5bXz9nG7DvO5lZJ7kXx6K3YvM7cqZ1wXjKz8L9vZ9O', '超级管理员', 1)
ON DUPLICATE KEY UPDATE username=username;

-- 插入测试商品分类
INSERT INTO product_categories (id, name, sort, status) VALUES
('cat1', '纸钱香烛', 1, 1),
('cat2', '祭祀用品', 2, 1),
('cat3', '元宝金银', 3, 1)
ON DUPLICATE KEY UPDATE name=name;

-- 插入测试商品
INSERT INTO products (id, name, category_id, cover, price, original_price, stock, sales, status, sort) VALUES
('prod1', '纸钱套装', 'cat1', 'https://via.placeholder.com/300', 29.00, 39.00, 100, 15, 1, 1),
('prod2', '金元宝', 'cat3', 'https://via.placeholder.com/300', 39.00, 49.00, 80, 20, 1, 2),
('prod3', '香烛礼盒', 'cat1', 'https://via.placeholder.com/300', 59.00, 79.00, 60, 10, 1, 3)
ON DUPLICATE KEY UPDATE name=name;

-- 插入测试祭祀套餐
INSERT INTO ritual_packages (id, name, description, price, sort, status) VALUES
('pkg1', '基础套餐', '包含基本祭祀用品和简单仪式', 299.00, 1, 1),
('pkg2', '标准套餐', '包含完整祭祀用品和标准仪式流程', 599.00, 2, 1),
('pkg3', '高级套餐', '包含高级祭祀用品和完整仪式服务', 999.00, 3, 1)
ON DUPLICATE KEY UPDATE name=name;

-- 插入测试商品订单
INSERT INTO product_orders (id, order_no, product_id, quantity, price, amount, receiver_name, receiver_phone, receiver_address, status, created_at) VALUES
('po1', 'SP202609130001', 'prod1', 2, 29.00, 58.00, '张三', '13800138000', '北京市朝阳区XXX街道XXX号', 'PENDING_PAYMENT', NOW()),
('po2', 'SP202609130002', 'prod2', 1, 39.00, 39.00, '李四', '13900139000', '上海市浦东新区XXX路XXX号', 'PENDING_PAYMENT', NOW()),
('po3', 'SP202609130003', 'prod3', 3, 59.00, 177.00, '王五', '13700137000', '广州市天河区XXX大道XXX号', 'PAID', NOW())
ON DUPLICATE KEY UPDATE order_no=order_no;

-- 插入测试祭祀订单
INSERT INTO ritual_orders (id, order_no, order_name, deceased_name, package_id, ritual_date, amount, status, created_at) VALUES
('ro1', 'JJ202609130001', '张三', '张父', 'pkg1', '2026-09-20', 299.00, 'PENDING_PAYMENT', NOW()),
('ro2', 'JJ202609130002', '李四', '李母', 'pkg2', '2026-09-25', 599.00, 'PENDING_PAYMENT', NOW()),
('ro3', 'JJ202609130003', '王五', '王祖父', 'pkg3', '2026-10-01', 999.00, 'PAID', NOW())
ON DUPLICATE KEY UPDATE order_no=order_no;
