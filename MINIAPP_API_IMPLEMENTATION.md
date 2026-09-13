# 小程序接口实现完成清单

## 已实现接口

### 1. 祭祀用品商品接口

#### ✅ GET /api/supplies/products
- 文件：`apps/backend-mock/api/supplies/products.get.ts`
- 功能：商品列表查询
- 支持：分类筛选、分页
- 返回：商品信息 + 规格（options）

#### ✅ GET /api/supplies/products/{id}
- 文件：`apps/backend-mock/api/supplies/products/[id].get.ts`
- 功能：商品详情查询
- 支持：通过 code 查询（如 "gold"）
- 返回：商品详情 + 规格 + 库存

#### ✅ POST /api/supplies/orders
- 文件：`apps/backend-mock/api/supplies/orders.post.ts`
- 功能：创建用品订单
- 校验：库存检查、地址完整性、手机号格式
- 返回：订单号（SP开头）+ 订单信息
- 自动：扣减规格库存、拼接完整地址

### 2. 祭祀订单接口

#### ✅ POST /api/memorial/orders
- 文件：`apps/backend-mock/api/memorial/orders.post.ts`
- 功能：创建祭祀订单
- 校验：套餐ID、姓名长度、日期格式、备注长度
- 返回：订单号（JS开头）+ 订单信息
- 安全：后端根据 packageId 查表获取价格

### 3. 统一订单查询

#### ✅ GET /api/orders/{orderNo}
- 文件：`apps/backend-mock/api/orders/[orderNo].get.ts`
- 功能：统一订单详情查询
- 支持：JS/SP 订单号自动识别
- 返回：根据订单类型返回不同字段
- 状态映射：后台详细状态 → 小程序简化状态

### 4. 客服配置

#### ✅ GET /api/service-config
- 文件：`apps/backend-mock/api/service-config.get.ts`
- 功能：客服配置查询
- 返回：微信号、二维码、电话、工作时间、提示

### 5. 祭祀记录查询

#### ✅ GET /api/memorial-records
- 文件：`apps/backend-mock/api/memorial-records.get.ts`
- 功能：查询已完成的祭祀记录
- 支持：订单号查询 / 姓名组合查询
- 安全：不允许单个姓名查询
- 返回：订单信息 + 视频（按类型分组）

## 数据库调整

### 已创建脚本

#### ✅ miniapp-schema.sql
- 商品分类增加 `code` 字段
- 商品表增加 `code` 字段
- 新建 `product_specs` 规格表
- 商品订单增加省市区字段
- 订单明细增加规格字段
- 视频表增加 `description` 字段
- 创建相关索引

#### ✅ miniapp-seed.sql
- 更新分类 code（paper/incense/candle/flower/fruit）
- 插入测试商品（金元宝、银元宝、纸钱、香、蜡烛）
- 插入商品规格（每个商品 2-3 个规格）
- 插入客服配置
- 插入测试祭祀订单（已完成，含视频）
- 插入测试用品订单

## 核心设计实现

### 1. 响应格式统一

```json
{
  "code": 200,
  "message": "success",
  "data": {}
}
```

错误码：
- 200：成功
- 400：参数错误
- 404：资源不存在
- 409：库存不足
- 500：服务器错误

### 2. 订单号生成

```typescript
// 祭祀订单：JS20260913XXXX
generateMemorialOrderNo(): string

// 用品订单：SP20260913XXXX
generateSuppliesOrderNo(): string
```

### 3. 状态映射

后台详细状态 → 小程序简化状态：
- `PENDING_SERVICE` → `pending_service`（新增）
- `PENDING_PAYMENT` → `pending_payment`
- `PAID` → `paid`
- `PREPARING/PACKAGING/BURNING/PENDING_VIDEO_UPLOAD` → `processing`
- `COMPLETED` → `completed`
- `CANCELLED` → `cancelled`
- `SHIPPED` → `shipped`（仅用品订单）

### 4. 字段命名统一

所有接口使用驼峰命名（camelCase）：
- `customerName` - 下单人姓名
- `deceasedName` - 亡故亲人姓名
- `memorialDate` - 祭祀日期
- `packageName` - 套餐名称
- `orderNo` - 订单号

### 5. 商品规格支持

独立规格表设计：
```sql
product_specs (
  id, product_id, name, price, stock, sort, status
)
```

每个商品可以有多个规格，规格独立库存和定价。

### 6. 地址完整性

用品订单地址拆分：
- `province` - 省
- `city` - 市
- `district` - 区/县
- `detailAddress` - 详细地址
- `fullAddress` - 后端自动拼接

### 7. 视频结构化返回

```json
{
  "videos": {
    "prepare": { "title": "祭祀准备", "videoUrl": "...", ... },
    "package": { "title": "封包", "videoUrl": "...", ... },
    "burn": { "title": "焚化", "videoUrl": "...", ... },
    "full": { "title": "完整祭祀", "videoUrl": "...", ... }
  }
}
```

## 安全措施

### 1. 价格安全
- 订单创建只接收 ID，后端查表获取价格
- 前端展示价格仅供参考

### 2. 库存管理
- 创建订单前检查规格库存
- 库存不足返回 409 错误
- 订单创建成功后扣减库存

### 3. 查询安全
- 祭祀记录查询：订单号 OR（下单人+亡故人）
- 不允许单个姓名查询
- 只返回已完成订单

### 4. 参数校验
- 姓名长度：1-50 字符
- 手机号格式：中国大陆手机号
- 日期格式：YYYY-MM-DD
- 备注长度：最多 500 字符
- 地址长度：详细地址最多 200 字符
- 购买数量：1-999

## 测试数据

### 商品分类
- paper（纸钱）
- incense（香）
- candle（蜡烛）
- flower（鲜花）
- fruit（水果）
- other（其他）

### 测试商品
1. 传统金元宝 (gold) - 3个规格
2. 传统银元宝 (silver) - 3个规格
3. 祭祀纸钱 (paper_money) - 3个规格
4. 天然檀香 (incense_01) - 2个规格
5. 沉香 (incense_02) - 2个规格
6. 白蜡烛 (candle_01) - 2个规格
7. 红蜡烛 (candle_02) - 2个规格

### 测试订单
- 祭祀订单：JS202609010001（已完成，含3个视频）
- 用品订单：SP202609050001（已完成）

### 客服配置
- 微信号：jisi_kefu_001
- 电话：400-123-4567
- 工作时间：9:00-18:00

## 接口测试

### 1. 测试商品列表
```bash
curl http://localhost:6666/api/supplies/products
curl http://localhost:6666/api/supplies/products?category=paper&page=1&pageSize=10
```

### 2. 测试商品详情
```bash
curl http://localhost:6666/api/supplies/products/gold
```

### 3. 测试创建用品订单
```bash
curl -X POST http://localhost:6666/api/supplies/orders \
  -H "Content-Type: application/json" \
  -d '{
    "productId": "gold",
    "specName": "50个",
    "quantity": 2,
    "receiverName": "李四",
    "receiverPhone": "13800138000",
    "province": "广东省",
    "city": "广州市",
    "district": "天河区",
    "detailAddress": "天河路123号"
  }'
```

### 4. 测试创建祭祀订单
```bash
curl -X POST http://localhost:6666/api/memorial/orders \
  -H "Content-Type: application/json" \
  -d '{
    "packageId": 1,
    "customerName": "张三",
    "deceasedName": "张XX",
    "memorialDate": "2026-09-20",
    "note": "请准备鲜花和水果"
  }'
```

### 5. 测试订单详情
```bash
curl http://localhost:6666/api/orders/JS202609010001
curl http://localhost:6666/api/orders/SP202609050001
```

### 6. 测试客服配置
```bash
curl http://localhost:6666/api/service-config
```

### 7. 测试祭祀记录
```bash
curl http://localhost:6666/api/memorial-records?orderNo=JS202609010001
curl http://localhost:6666/api/memorial-records?customerName=张三&deceasedName=张XX
```

## 部署步骤

### 1. 执行数据库迁移
```bash
# 在 SQLite 中执行
sqlite3 apps/backend-mock/.data/db.sqlite < apps/backend-mock/database/miniapp-schema.sql
sqlite3 apps/backend-mock/.data/db.sqlite < apps/backend-mock/database/miniapp-seed.sql
```

### 2. 重启后端服务
```bash
pnpm dev:backend
```

### 3. 验证接口
使用上述测试命令验证所有接口

## 前后端对接清单

### 前端需要配置
1. API 基础地址：`https://api.example.com` 或 `http://localhost:6666`
2. 微信小程序合法域名配置（生产环境）
3. 视频播放域名白名单

### 后端需要配置（生产环境）
1. 替换测试图片/视频 URL 为真实 CDN 地址
2. 配置七牛云/阿里云 OSS
3. 配置真实客服信息
4. 配置 HTTPS
5. 配置 CORS
6. 增加接口频率限制
7. 增加日志记录

## 已知限制

### 当前实现
- 使用 SQLite D1 数据库（Mock）
- 图片/视频 URL 为示例地址
- 无认证鉴权（待补充）
- 无支付接口（待补充）
- 商品详情图暂用封面图

### 生产环境需要
1. 迁移到 MySQL/PostgreSQL
2. 实现真实对象存储集成
3. 实现微信登录认证
4. 实现微信支付
5. 增加订单幂等性保证
6. 增加并发控制
7. 增加缓存机制

## 接口兼容性

### 后台管理接口
路径：`/api/ancestor/*`
格式：`{ code: 0, ... }`
保持不变，不受影响

### 小程序接口
路径：`/api/supplies/*`, `/api/memorial/*`, `/api/orders/*`
格式：`{ code: 200, ... }`
符合小程序接口文档规范

### 数据共享
- 两套接口共用同一数据库
- 后台管理修改商品/订单，小程序实时生效
- 后台上传视频，小程序可查询

## 总结

✅ 6 个 P0 接口全部实现完成
✅ 数据库结构调整完成
✅ 测试数据准备完成
✅ 安全校验完成
✅ 状态映射完成
✅ 订单号前缀完成
✅ 字段命名统一完成

**小程序接口已就绪，可以开始前后端联调。**
