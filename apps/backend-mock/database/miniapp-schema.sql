-- 小程序接口数据库结构调整

-- 1. 商品分类增加 code 字段
ALTER TABLE product_categories ADD COLUMN code TEXT UNIQUE;

-- 2. 商品表增加 code 字段
ALTER TABLE products ADD COLUMN code TEXT UNIQUE;

-- 3. 创建商品规格表
CREATE TABLE IF NOT EXISTS product_specs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  price REAL NOT NULL,
  stock INTEGER DEFAULT 0,
  sort INTEGER DEFAULT 0,
  status TEXT DEFAULT 'ACTIVE',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (product_id) REFERENCES products(id)
);

-- 4. 商品订单表增加地址字段
ALTER TABLE product_orders ADD COLUMN province TEXT;
ALTER TABLE product_orders ADD COLUMN city TEXT;
ALTER TABLE product_orders ADD COLUMN district TEXT;
ALTER TABLE product_orders ADD COLUMN detail_address TEXT;

-- 5. 商品订单明细增加规格字段
ALTER TABLE product_order_items ADD COLUMN spec_id INTEGER;
ALTER TABLE product_order_items ADD COLUMN spec_name TEXT;

-- 6. 祭祀视频表增加 title 和 description
ALTER TABLE ritual_videos ADD COLUMN description TEXT;

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_product_specs_product ON product_specs(product_id);
CREATE INDEX IF NOT EXISTS idx_product_categories_code ON product_categories(code);
CREATE INDEX IF NOT EXISTS idx_products_code ON products(code);
