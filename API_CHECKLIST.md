# 祭祖后台 API 接口清单

## ✅ 已完成接口

### 仪表盘
- [x] GET /api/ancestor/dashboard - 数据概览

### 商品管理
- [x] GET /api/ancestor/products - 商品列表
- [x] POST /api/ancestor/products - 创建商品
- [x] GET /api/ancestor/products/[id] - 商品详情
- [x] PUT /api/ancestor/products/[id] - 更新商品
- [x] DELETE /api/ancestor/products/[id] - 删除商品

### 商品分类
- [x] GET /api/ancestor/categories - 分类列表
- [x] POST /api/ancestor/categories - 创建分类
- [x] PUT /api/ancestor/categories/[id] - 更新分类
- [x] DELETE /api/ancestor/categories/[id] - 删除分类

### 商品订单
- [x] GET /api/ancestor/product-orders - 订单列表
- [x] GET /api/ancestor/product-orders/[id] - 订单详情
- [x] PUT /api/ancestor/product-orders/[id] - 更新订单
- [x] POST /api/ancestor/product-orders/[id]/confirm-payment - 确认支付
- [x] POST /api/ancestor/product-orders/[id]/ship - 发货
- [x] POST /api/ancestor/product-orders/[id]/cancel - 取消订单

### 代祭祀订单
- [x] GET /api/ancestor/ritual-orders - 代祭祀订单列表
- [x] GET /api/ancestor/ritual-orders/[id] - 订单详情
- [x] PUT /api/ancestor/ritual-orders/[id] - 更新订单
- [x] POST /api/ancestor/ritual-orders/[id]/confirm-payment - 确认支付
- [x] POST /api/ancestor/ritual-orders/[id]/advance - 推进状态
- [x] POST /api/ancestor/ritual-orders/[id]/complete - 完成祭祀
- [x] GET /api/ancestor/ritual-orders/[id]/logs - 操作日志

### 祭祀套餐
- [x] GET /api/ancestor/ritual-packages - 套餐列表
- [x] POST /api/ancestor/ritual-packages - 创建套餐
- [x] PUT /api/ancestor/ritual-packages/[id] - 更新套餐
- [x] DELETE /api/ancestor/ritual-packages/[id] - 删除套餐

### 祭祀视频
- [x] GET /api/ancestor/ritual-videos - 视频列表
- [x] POST /api/ancestor/ritual-orders/[id]/videos - 上传视频
- [x] DELETE /api/ancestor/ritual-videos/[id] - 删除视频
- [x] GET /api/ancestor/qiniu/upload-token - 获取七牛上传token
- [x] GET /api/ancestor/qiniu-token - 获取七牛token（兼容）
- [x] POST /api/ancestor/qiniu-download-url - 获取七牛下载签名URL

### 祭祀记录
- [x] POST /api/ancestor/ritual-records/query - 用户端姓名查询

### 系统管理
- [x] GET /api/ancestor/admins - 管理员列表
- [x] POST /api/ancestor/admins - 创建管理员
- [x] PUT /api/ancestor/admins/[id] - 更新管理员
- [x] DELETE /api/ancestor/admins/[id] - 删除管理员
- [x] POST /api/ancestor/admins/[id]/reset-password - 重置密码

### 角色权限
- [x] GET /api/ancestor/roles - 角色列表

### 系统设置
- [x] GET /api/ancestor/settings - 获取设置
- [x] PUT /api/ancestor/settings - 更新设置

## 📊 统计

- 总计：41 个接口
- 已完成：41 个
- 完成度：100%

## 🔐 需要注意的安全问题

1. **密码加密**：当前 mock 实现未加密密码，生产环境需使用 bcrypt 等加密
2. **视频URL签名**：生产环境需使用七牛云真实签名URL，避免永久公开链接
3. **接口频率限制**：姓名查询等敏感接口需要增加频率限制
4. **权限验证**：所有接口需要验证管理员身份和权限
5. **SQL注入防护**：当前使用参数化查询，需保持
6. **文件上传验证**：需验证文件类型、大小等

## 📝 数据库表依赖

需要创建以下数据库表：
- products - 商品表
- product_categories - 商品分类表
- product_orders - 商品订单表
- product_order_items - 商品订单明细表
- ritual_orders - 代祭祀订单表
- ritual_packages - 祭祀套餐表
- ritual_videos - 祭祀视频表
- ritual_logs - 祭祀操作日志表
- admins - 管理员表
- system_settings - 系统设置表
