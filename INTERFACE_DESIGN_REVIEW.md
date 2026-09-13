# 小程序接口设计评审

## 接口合理性分析

### ✅ 合理的设计

1. **统一订单详情接口** `GET /api/orders/{orderNo}`
   - 通过订单号前缀区分类型很合理
   - 避免前端调用两个不同接口

2. **客服配置接口** `GET /api/service-config`
   - 配置化管理客服信息
   - 支持后台动态修改

3. **祭祀记录查询** `GET /api/memorial-records`
   - 支持多种查询方式（订单号/姓名组合）
   - 安全考虑：不允许单个姓名查询

4. **商品规格设计** `options: [{ name, price, stock }]`
   - 符合电商标准
   - 支持多规格独立定价和库存

### ⚠️ 需要调整的设计

#### 1. 祭祀订单创建接口字段冗余

**问题**：
```json
{
  "packageName": "基础祭祀",
  "packagePrice": 168  // 前端传入但后端不信任
}
```

**建议**：
```json
{
  "packageId": 1,  // 只传套餐ID
  "customerName": "张三",
  "deceasedName": "张XX",
  "memorialDate": "2026-09-20",
  "note": "备注"
}
```

后端根据 `packageId` 查表获取 name 和 price，避免前端传入不一致的数据。

---

#### 2. 用品订单创建字段过多

**问题**：
```json
{
  "productId": "gold",
  "productName": "传统金元宝",  // 冗余
  "spec": "50个",               // 字符串不够精确
  "quantity": 2
}
```

**建议**：
```json
{
  "productId": "gold",
  "specId": 1,      // 规格ID，避免名称匹配错误
  "quantity": 2,
  "receiverName": "...",
  "receiverPhone": "...",
  "province": "广东省",
  "city": "广州市",
  "district": "天河区",
  "detailAddress": "..."
}
```

或者更简单：
```json
{
  "skuId": "gold_50",  // SKU唯一标识
  "quantity": 2,
  "address": { ... }
}
```

---

#### 3. 商品列表接口分类编码不够清晰

**问题**：
```
category: paper/incense/candle/flower/fruit
```

这些分类编码在后台管理中没有对应，后台用的是分类表 `product_categories`。

**建议方案A（推荐）**：
```sql
-- 后台分类表增加 code 字段
ALTER TABLE product_categories ADD COLUMN code TEXT;

-- 预设分类
INSERT INTO product_categories (name, code, sort) VALUES
('纸钱', 'paper', 100),
('香', 'incense', 90),
('蜡烛', 'candle', 80),
('鲜花', 'flower', 70),
('水果', 'fruit', 60),
('其他', 'other', 50);
```

小程序接口：
```
GET /api/supplies/products?category=paper
```

后台管理：
```
GET /api/ancestor/products?categoryId=1
```

两者都能工作，通过 code 映射。

**建议方案B**：
直接用分类ID：
```
GET /api/supplies/products?categoryId=1
```

但这样前端需要先调用分类列表接口获取ID，不够友好。

---

#### 4. 商品ID设计

**问题**：
```json
{
  "id": "gold"  // 字符串ID
}
```

后台管理用的是自增整型ID。

**建议**：
- 后台管理继续用整型ID
- 小程序接口兼容字符串ID（通过 slug/code 字段映射）
- 数据库增加字段：

```sql
ALTER TABLE products ADD COLUMN code TEXT UNIQUE;
-- code: gold, silver, incense_01 等
```

小程序查询：
```
GET /api/supplies/products/gold  -- 通过code查询
```

后台管理：
```
GET /api/ancestor/products/1  -- 通过id查询
```

---

#### 5. 视频查询返回格式

**问题**：小程序要求扁平化视频数组，但后台管理视频有明确类型（准备/封包/焚化）。

**建议**：
小程序接口按类型返回，更符合业务逻辑：

```json
{
  "orderNo": "JS202609130001",
  "customerName": "张三",
  "deceasedName": "张XX",
  "status": "completed",
  "videos": {
    "prepare": {
      "title": "祭祀准备",
      "videoUrl": "...",
      "coverImage": "...",
      "duration": 120
    },
    "package": {
      "title": "封包",
      "videoUrl": "...",
      "coverImage": "...",
      "duration": 180
    },
    "burn": {
      "title": "焚化",
      "videoUrl": "...",
      "coverImage": "...",
      "duration": 150
    },
    "full": {  // 可选
      "title": "完整祭祀",
      "videoUrl": "...",
      "coverImage": "...",
      "duration": 600
    }
  }
}
```

或者兼容原设计，但增加 `type` 字段：

```json
{
  "videos": [
    {
      "type": "prepare",
      "title": "祭祀准备",
      "videoUrl": "...",
      "coverImage": "...",
      "duration": 120
    }
  ]
}
```

前端可以根据 type 显示不同标签。

---

#### 6. 地址设计

**当前设计已经合理**：
```json
{
  "province": "广东省",
  "city": "广州市",
  "district": "天河区",
  "detailAddress": "天河路123号",
  "fullAddress": "广东省广州市天河区天河路123号"
}
```

`fullAddress` 应该由后端拼接生成，不要信任前端传入。

---

## 核心业务流程验证

### 祭祀订单流程

```
1. 用户选择套餐 → 创建订单
   POST /api/memorial/orders
   {
     "packageId": 1,
     "customerName": "张三",
     "deceasedName": "张XX",
     "memorialDate": "2026-09-20",
     "note": "备注"
   }
   ↓
   返回 orderNo: "JS202609130001"
   初始状态: pending_service

2. 用户查看订单详情
   GET /api/orders/JS202609130001
   ↓
   显示：套餐、金额、状态、客服信息

3. 用户联系客服 → 客服确认支付
   后台管理：状态改为 paid
   
4. 工作人员开始祭祀流程
   后台管理：
   - 状态推进：preparing → packaging → burning
   - 上传视频

5. 祭祀完成，上传所有视频
   后台管理：状态改为 completed

6. 用户查询祭祀记录
   GET /api/memorial-records?orderNo=JS202609130001
   或
   GET /api/memorial-records?customerName=张三&deceasedName=张XX
   ↓
   观看视频
```

**流程完整 ✅**

---

### 用品订单流程

```
1. 用户浏览商品
   GET /api/supplies/products?category=paper

2. 用户查看商品详情
   GET /api/supplies/products/gold
   ↓
   看到规格和价格

3. 用户选择规格下单
   POST /api/supplies/orders
   {
     "productId": "gold",
     "specId": 1,  // 或 specName: "50个"
     "quantity": 2,
     "receiverName": "李四",
     "receiverPhone": "13800138000",
     "province": "广东省",
     "city": "广州市",
     "district": "天河区",
     "detailAddress": "天河路123号"
   }
   ↓
   返回 orderNo: "SP202609130001"
   初始状态: pending_service

4. 用户查看订单详情
   GET /api/orders/SP202609130001
   ↓
   显示：商品、规格、数量、金额、收货地址、状态

5. 用户联系客服 → 客服确认支付并发货
   后台管理：
   - 状态改为 paid
   - 状态改为 shipped

6. 用户收货
   后台管理：状态改为 completed
```

**流程完整 ✅**

---

## 数据库设计调整建议

### 1. 商品表增强

```sql
ALTER TABLE products ADD COLUMN code TEXT UNIQUE;
ALTER TABLE products ADD COLUMN category_code TEXT;
ALTER TABLE products ADD COLUMN specs TEXT; -- JSON: [{ id, name, price, stock }]
```

或者新建规格表（推荐）：

```sql
CREATE TABLE product_specs (
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
```

### 2. 分类表增强

```sql
ALTER TABLE product_categories ADD COLUMN code TEXT UNIQUE;

UPDATE product_categories SET code = 'paper' WHERE name = '纸钱';
UPDATE product_categories SET code = 'incense' WHERE name = '香';
UPDATE product_categories SET code = 'candle' WHERE name = '蜡烛';
-- ...
```

### 3. 商品订单表增强

```sql
ALTER TABLE product_orders ADD COLUMN province TEXT;
ALTER TABLE product_orders ADD COLUMN city TEXT;
ALTER TABLE product_orders ADD COLUMN district TEXT;
ALTER TABLE product_orders ADD COLUMN detail_address TEXT;

-- 保留 receiver_address 作为 full_address
```

### 4. 商品订单明细增强

```sql
ALTER TABLE product_order_items ADD COLUMN spec_id INTEGER;
ALTER TABLE product_order_items ADD COLUMN spec_name TEXT;
```

### 5. 祭祀套餐确保有ID

```sql
-- 已有，确认数据完整
SELECT * FROM ritual_packages;
```

### 6. 系统配置增加客服信息

```sql
INSERT INTO system_settings (key, value, updated_at) VALUES
('service_name', '祭祀客服', datetime('now')),
('service_wechat_id', 'jisi_kefu_001', datetime('now')),
('service_wechat_qrcode', 'https://example.com/qrcode.jpg', datetime('now')),
('service_phone', '400-123-4567', datetime('now')),
('service_work_time', '9:00-18:00', datetime('now')),
('service_notice', '添加客服时请备注订单号', datetime('now'));
```

---

## 状态映射方案

### 后台详细状态 → 小程序简化状态

| 后台状态 | 小程序状态 | 说明 |
|---------|-----------|------|
| - | `pending_service` | 新增，订单创建后的初始状态 |
| `PENDING_PAYMENT` | `pending_payment` | 待付款 |
| `PAID` | `paid` | 已付款 |
| `PENDING_RITUAL` | `processing` | 待祭祀 |
| `PREPARING` | `processing` | 准备中 |
| `PACKAGING` | `processing` | 封包中 |
| `BURNING` | `processing` | 焚化中 |
| `PENDING_VIDEO_UPLOAD` | `processing` | 待上传视频 |
| `COMPLETED` | `completed` | 已完成 |
| `CANCELLED` | `cancelled` | 已取消 |

用品订单还有：
| `SHIPPED` | `shipped` | 已发货 |

---

## 订单号生成规则

```typescript
// 祭祀订单
function generateMemorialOrderNo(): string {
  const date = new Date();
  const prefix = 'JS';
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `${prefix}${dateStr}${random}`;
}
// 示例: JS202609130001

// 用品订单
function generateSuppliesOrderNo(): string {
  const date = new Date();
  const prefix = 'SP';
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `${prefix}${dateStr}${random}`;
}
// 示例: SP202609130001
```

建议增加数据库唯一索引确保不重复。

---

## 最终建议接口设计

### 1. 创建祭祀订单（调整）

```
POST /api/memorial/orders
```

**请求**：
```json
{
  "packageId": 1,
  "customerName": "张三",
  "deceasedName": "张XX",
  "memorialDate": "2026-09-20",
  "note": "请准备鲜花和水果"
}
```

**响应**：
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "orderNo": "JS202609130001",
    "packageName": "基础祭祀",
    "amount": 168.00,
    "status": "pending_service"
  }
}
```

---

### 2. 创建用品订单（调整）

```
POST /api/supplies/orders
```

**请求**：
```json
{
  "productId": "gold",
  "specName": "50个",
  "quantity": 2,
  "receiverName": "李四",
  "receiverPhone": "13800138000",
  "province": "广东省",
  "city": "广州市",
  "district": "天河区",
  "detailAddress": "天河路123号"
}
```

**响应**：
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "orderNo": "SP202609130001",
    "productName": "传统金元宝",
    "spec": "50个",
    "quantity": 2,
    "amount": 79.80,
    "status": "pending_service"
  }
}
```

---

### 3. 祭祀记录查询（调整）

```
GET /api/memorial-records
```

**请求**：
```
?orderNo=JS202609130001
或
?customerName=张三&deceasedName=张XX
```

**响应**：
```json
{
  "code": 200,
  "message": "success",
  "data": [
    {
      "orderNo": "JS202609130001",
      "customerName": "张三",
      "deceasedName": "张XX",
      "memorialDate": "2026-09-13",
      "packageName": "基础祭祀",
      "amount": 168.00,
      "status": "completed",
      "videos": {
        "prepare": {
          "title": "祭祀准备",
          "videoUrl": "https://cdn.example.com/video1.mp4",
          "coverImage": "https://cdn.example.com/cover1.jpg",
          "duration": 120,
          "createdAt": "2026-09-13 10:00:00"
        },
        "package": {
          "title": "封包",
          "videoUrl": "https://cdn.example.com/video2.mp4",
          "coverImage": "https://cdn.example.com/cover2.jpg",
          "duration": 180,
          "createdAt": "2026-09-13 11:00:00"
        },
        "burn": {
          "title": "焚化",
          "videoUrl": "https://cdn.example.com/video3.mp4",
          "coverImage": "https://cdn.example.com/cover3.jpg",
          "duration": 150,
          "createdAt": "2026-09-13 12:00:00"
        }
      }
    }
  ]
}
```

---

## 总结

### 接口设计评分

| 方面 | 评分 | 说明 |
|------|------|------|
| 整体结构 | 8/10 | 清晰合理，符合 RESTful 规范 |
| 字段设计 | 6/10 | 部分字段冗余，需要调整 |
| 安全性 | 7/10 | 考虑了姓名查询安全，但订单创建可加强 |
| 扩展性 | 7/10 | 支持配置化，但商品规格设计需加强 |
| 业务完整性 | 9/10 | 覆盖了核心流程 |

### 必须调整的地方

1. ✅ 订单创建接口改用 ID 而非名称+价格
2. ✅ 商品规格设计需要独立表或 JSON 字段
3. ✅ 分类增加 code 字段支持字符串查询
4. ✅ 商品增加 code 字段支持字符串ID
5. ✅ 地址拆分为省市区
6. ✅ 视频查询返回结构化格式
7. ✅ 订单号强制前缀
8. ✅ 状态映射逻辑

### 可以接受的设计

1. ✅ 统一订单详情接口
2. ✅ 客服配置接口
3. ✅ 分页设计
4. ✅ 响应格式

---

**结论**：接口设计整体合理，但需要在字段设计和数据库结构上做调整，确保前后端数据一致性和安全性。
