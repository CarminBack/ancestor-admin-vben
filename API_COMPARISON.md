# 后台管理与小程序接口对比分析

## 核心问题

### 1. 响应格式不一致

**小程序接口要求**：
```json
{
  "code": 200,
  "message": "success",
  "data": {}
}
```

**后台管理当前实现**：
```json
{
  "code": 0,
  "message": "success",
  "data": {}
}
```

**建议**：统一使用 `code: 200` 表示成功，`code: 400/401/404/409/500` 表示各类错误。

---

### 2. 字段命名不匹配

| 后台字段 | 小程序字段 | 说明 |
|---------|-----------|------|
| `order_name` | `customerName` | 下单人姓名 |
| `deceased_name` | `deceasedName` | 亡故亲人姓名 |
| `ritual_date` | `memorialDate` | 祭祀日期 |
| `package_name` | `packageName` | 套餐名称 |
| `amount` | `amount` | ✅ 一致 |
| `order_no` | `orderNo` | ✅ 一致（驼峰） |
| `status` | `status` | ✅ 一致 |

**建议**：后端接口层统一使用驼峰命名（camelCase），数据库可以保持下划线。

---

### 3. 状态值定义不同

**后台管理当前状态**：
```
PENDING_PAYMENT
PAID
PENDING_RITUAL
PREPARING
PACKAGING
BURNING
PENDING_VIDEO_UPLOAD
COMPLETED
CANCELLED
```

**小程序接口要求**：
```
pending_service   待联系客服
pending_payment   待付款
paid              已付款
processing        处理中
shipped           已发货（仅用品订单）
completed         已完成
cancelled         已取消
```

**问题**：
- 后台有 9 个状态，小程序只需要 7 个
- 小程序增加了 `pending_service`（待联系客服）作为初始状态
- 后台的 `PREPARING/PACKAGING/BURNING` 在小程序中统一为 `processing`

**建议**：
1. 后台保留详细状态用于内部管理
2. 小程序接口返回时映射为简化状态
3. 新增订单初始状态设为 `pending_service`

---

### 4. 订单号前缀

**后台当前实现**：未强制前缀

**小程序要求**：
- 祭祀订单：`JS` 开头
- 用品订单：`SP` 开头

**建议**：后端生成订单号时统一加前缀。

---

### 5. 缺失接口

**小程序需要但后台未实现**：

#### 5.1 祭祀用品商品列表
```
GET /api/supplies/products
```
- 支持分类筛选：`paper/incense/candle/flower/fruit`
- 支持分页
- 返回商品规格（options）和库存

#### 5.2 祭祀用品商品详情
```
GET /api/supplies/products/{productId}
```
- 返回详细图、规格、库存

#### 5.3 创建祭祀用品订单
```
POST /api/supplies/orders
```
- 包含收货地址
- 支持规格选择
- 库存扣减

#### 5.4 统一订单详情
```
GET /api/orders/{orderNo}
```
- 同时支持祭祀订单（JS开头）和用品订单（SP开头）
- 根据订单类型返回不同字段

#### 5.5 客服配置
```
GET /api/service-config
```
- 返回客服微信号、二维码、电话、工作时间

#### 5.6 祭祀记录查询（小程序端）
```
GET /api/memorial-records
```
- 支持订单号查询
- 支持姓名组合查询（customerName + deceasedName）
- 返回视频列表

---

### 6. 接口路径不一致

**后台管理**：`/api/ancestor/*`

**小程序接口文档**：
- `/api/memorial/orders` - 祭祀订单
- `/api/supplies/products` - 用品商品
- `/api/supplies/orders` - 用品订单
- `/api/orders/{orderNo}` - 统一订单详情
- `/api/service-config` - 客服配置
- `/api/memorial-records` - 祭祀记录

**建议**：
1. 后台管理继续使用 `/api/ancestor/*`
2. 小程序单独实现 `/api/memorial/*` 和 `/api/supplies/*`
3. 或者统一路径，后台管理也改为小程序的路径规范

---

### 7. 商品规格支持

**小程序要求**：
```json
{
  "options": [
    { "name": "50个", "price": 39.90, "stock": 100 },
    { "name": "100个", "price": 69.90, "stock": 80 }
  ]
}
```

**后台当前实现**：
- 商品表只有单价和总库存
- 没有规格（SKU）概念

**建议**：
1. 简单方案：商品表增加 `specs` JSON 字段存储规格
2. 完整方案：新增 `product_specs` 表存储 SKU

---

### 8. 地址字段

**小程序用品订单需要**：
```json
{
  "receiverName": "李四",
  "receiverPhone": "13800138000",
  "province": "广东省",
  "city": "广州市",
  "district": "天河区",
  "detailAddress": "天河路123号",
  "fullAddress": "广东省广州市天河区天河路123号"
}
```

**后台当前实现**：
```
receiver_name
receiver_phone
receiver_address (单个字段)
```

**建议**：商品订单表增加省市区字段。

---

### 9. 视频返回格式

**小程序要求**：
```json
{
  "videos": [
    {
      "title": "祭祀准备",
      "description": "准备祭祀用品全过程",
      "videoUrl": "https://cdn.example.com/video1.mp4",
      "coverImage": "https://cdn.example.com/cover1.jpg",
      "duration": 120,
      "createdAt": "2026-09-13 10:00:00"
    }
  ]
}
```

**后台当前实现**：
- 视频分为 PREPARE/PACKAGE/BURN/FULL 四种类型
- 返回格式与小程序不完全匹配

**建议**：
- 后台管理保留类型区分
- 小程序接口查询时返回扁平化视频数组
- 增加 `title` 和 `description` 字段

---

## 必须修改的接口

### 优先级 P0（小程序无法运行）

1. **新增祭祀用品商品接口**
   - `GET /api/supplies/products`
   - `GET /api/supplies/products/{productId}`
   - `POST /api/supplies/orders`

2. **新增统一订单详情**
   - `GET /api/orders/{orderNo}`

3. **新增客服配置**
   - `GET /api/service-config`

4. **修改祭祀记录查询**
   - `GET /api/memorial-records`
   - 支持姓名组合查询
   - 返回格式匹配小程序

5. **修改祭祀订单创建**
   - `POST /api/memorial/orders`
   - 字段名改为驼峰
   - 返回格式统一

### 优先级 P1（体验受损）

1. **统一响应格式**
   - 成功 `code: 200` → `code: 200`
   - 失败 `code: 1` → `code: 400/404/409/500`

2. **订单号加前缀**
   - 祭祀订单：`JS` 开头
   - 用品订单：`SP` 开头

3. **状态映射**
   - 后台详细状态 → 小程序简化状态

4. **字段命名统一**
   - 所有接口使用驼峰命名

### 优先级 P2（后续优化）

1. **商品规格完整支持**
   - 支持 SKU 管理
   - 规格库存独立

2. **地址字段拆分**
   - 省市区独立字段
   - 自动生成 fullAddress

3. **视频字段增强**
   - 增加 title/description
   - 支持封面图

---

## 建议实施方案

### 方案一：最小改动（推荐）

**保持后台管理接口不变**，新增小程序专用接口：

```
apps/backend-mock/api/
├── ancestor/           # 后台管理接口（保持不变）
│   ├── dashboard.get.ts
│   ├── products.get.ts
│   └── ...
├── memorial/           # 小程序祭祀接口（新增）
│   └── orders.post.ts
├── supplies/           # 小程序用品接口（新增）
│   ├── products.get.ts
│   ├── products/[id].get.ts
│   └── orders.post.ts
├── orders/             # 统一订单查询（新增）
│   └── [orderNo].get.ts
└── service-config.get.ts
```

**优点**：
- 后台管理代码不受影响
- 小程序接口独立演进
- 两套接口互不干扰

**缺点**：
- 部分逻辑重复
- 维护两套接口

### 方案二：完全重构（不推荐）

修改所有后台管理接口，统一为小程序规范。

**优点**：
- 接口统一
- 维护简单

**缺点**：
- 改动巨大
- 影响已有功能
- 风险高

---

## 下一步行动

1. **立即新增小程序接口**（P0）
2. **测试数据准备**
3. **协调字段命名规范**（P1）
4. **商品规格数据库设计**（P2）
5. **前后端联调**

---

## 测试数据需求

### 商品分类
- paper（纸钱）
- incense（香）
- candle（蜡烛）
- flower（鲜花）
- fruit（水果）

### 商品数据
每个分类至少 2-3 个商品，每个商品至少 2-3 个规格。

### 祭祀套餐
- 基础祭祀 ¥168
- 诚心祭祀 ¥268
- 敬亲祭祀 ¥398

### 测试订单
- 至少 1 个已完成祭祀订单（含视频）
- 至少 1 个用品订单
- 至少 1 个待处理订单

### 客服配置
- 微信号
- 二维码图片 URL
- 客服电话
- 工作时间
