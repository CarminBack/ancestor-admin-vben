-- 祭祖后台数据库表结构

-- 商品分类表
CREATE TABLE IF NOT EXISTS product_categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  image TEXT,
  sort INTEGER DEFAULT 0,
  status TEXT DEFAULT 'ACTIVE',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- 商品表
CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  category_id INTEGER,
  name TEXT NOT NULL,
  cover TEXT,
  images TEXT, -- JSON array
  description TEXT,
  price REAL NOT NULL,
  original_price REAL,
  stock INTEGER DEFAULT 0,
  sales INTEGER DEFAULT 0,
  status TEXT DEFAULT 'ACTIVE',
  sort INTEGER DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT,
  FOREIGN KEY (category_id) REFERENCES product_categories(id)
);

-- 商品订单表
CREATE TABLE IF NOT EXISTS product_orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_no TEXT NOT NULL UNIQUE,
  total_amount REAL NOT NULL,
  status TEXT DEFAULT 'PENDING_PAYMENT',
  receiver_name TEXT NOT NULL,
  receiver_phone TEXT NOT NULL,
  receiver_address TEXT NOT NULL,
  remark TEXT,
  paid_at TEXT,
  shipped_at TEXT,
  completed_at TEXT,
  cancelled_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- 商品订单明细表
CREATE TABLE IF NOT EXISTS product_order_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL,
  product_id INTEGER NOT NULL,
  product_name TEXT NOT NULL,
  product_image TEXT,
  price REAL NOT NULL,
  quantity INTEGER NOT NULL,
  amount REAL NOT NULL,
  FOREIGN KEY (order_id) REFERENCES product_orders(id),
  FOREIGN KEY (product_id) REFERENCES products(id)
);

-- 祭祀套餐表
CREATE TABLE IF NOT EXISTS ritual_packages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  cover TEXT,
  price REAL NOT NULL,
  sort INTEGER DEFAULT 0,
  status TEXT DEFAULT 'ACTIVE',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- 代祭祀订单表
CREATE TABLE IF NOT EXISTS ritual_orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_no TEXT NOT NULL UNIQUE,
  order_name TEXT NOT NULL,
  deceased_name TEXT NOT NULL,
  package_id INTEGER,
  package_name TEXT NOT NULL,
  amount REAL NOT NULL,
  ritual_date TEXT NOT NULL,
  status TEXT DEFAULT 'PENDING_PAYMENT',
  remark TEXT,
  paid_at TEXT,
  completed_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT,
  FOREIGN KEY (package_id) REFERENCES ritual_packages(id)
);

-- 祭祀视频表
CREATE TABLE IF NOT EXISTS ritual_videos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ritual_order_id INTEGER NOT NULL,
  type TEXT NOT NULL, -- PREPARE, PACKAGE, BURN, FULL
  title TEXT,
  video_url TEXT NOT NULL,
  thumbnail_url TEXT,
  duration INTEGER, -- 秒
  file_size INTEGER, -- 字节
  status TEXT DEFAULT 'ACTIVE',
  created_by INTEGER,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (ritual_order_id) REFERENCES ritual_orders(id)
);

-- 祭祀操作日志表
CREATE TABLE IF NOT EXISTS ritual_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ritual_order_id INTEGER NOT NULL,
  from_status TEXT,
  to_status TEXT NOT NULL,
  operator_id INTEGER,
  operator_name TEXT,
  remark TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (ritual_order_id) REFERENCES ritual_orders(id)
);

-- 管理员表
CREATE TABLE IF NOT EXISTS admins (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  nickname TEXT,
  phone TEXT,
  role TEXT DEFAULT 'RITUAL_ADMIN', -- SUPER_ADMIN, RITUAL_ADMIN, PRODUCT_ADMIN
  status TEXT DEFAULT 'ACTIVE',
  last_login_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- 系统设置表
CREATE TABLE IF NOT EXISTS system_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_product_orders_status ON product_orders(status);
CREATE INDEX IF NOT EXISTS idx_product_orders_created ON product_orders(created_at);
CREATE INDEX IF NOT EXISTS idx_ritual_orders_status ON ritual_orders(status);
CREATE INDEX IF NOT EXISTS idx_ritual_orders_names ON ritual_orders(order_name, deceased_name);
CREATE INDEX IF NOT EXISTS idx_ritual_orders_date ON ritual_orders(ritual_date);
CREATE INDEX IF NOT EXISTS idx_ritual_videos_order ON ritual_videos(ritual_order_id);
CREATE INDEX IF NOT EXISTS idx_ritual_logs_order ON ritual_logs(ritual_order_id);
