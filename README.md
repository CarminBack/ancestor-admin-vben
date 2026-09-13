# 祭祖微信小程序管理后台

基于 Vben Admin 5.0 开发的祭祖小程序管理后台系统。

## 功能特性

### 核心功能

- **数据概览** - 实时统计今日/累计订单、销售额等关键指标
- **商品管理** - 商品、分类的增删改查，上下架管理
- **商品订单** - 订单列表、详情查看、发货、取消订单
- **代祭祀管理** - 代祭祀订单全流程管理
- **祭祀视频** - 准备、封包、焚化视频上传与管理
- **祭祀记录** - 已完成祭祀记录查询
- **系统管理** - 管理员、角色权限、系统设置

### 业务流程

```
用户下单 → 后台接单 → 祭祀准备 → 封包 → 焚化 
         ↓
    上传视频 → 完成祭祀 → 用户姓名查询观看
```

### 技术栈

- **前端框架**: Vue 3 + TypeScript + Vite
- **UI 组件**: Ant Design Vue
- **状态管理**: Pinia
- **路由管理**: Vue Router
- **后台框架**: Vben Admin 5.0
- **Mock 服务**: Nitro + SQLite

## 快速开始

### 环境要求

- Node.js >= 18
- pnpm >= 8

### 安装依赖

```bash
pnpm install
```

### 启动开发服务器

```bash
pnpm dev
```

访问地址：
- 前端: http://localhost:5173
- 后端: http://localhost:6666

### 默认账号

| 账号 | 密码 | 角色 |
|------|------|------|
| admin | admin123 | 超级管理员 |
| ritual | ritual123 | 祭祀管理员 |
| product | product123 | 商品管理员 |

## 项目结构

```
ancestor-admin-vben/
├── apps/
│   ├── web-antd/              # 前端主应用
│   │   └── src/
│   │       ├── api/           # API 接口层
│   │       │   └── ancestor/  # 祭祖业务接口
│   │       ├── router/        # 路由配置
│   │       │   └── routes/
│   │       │       └── modules/
│   │       │           └── ancestor.ts
│   │       └── views/         # 页面组件
│   │           └── ancestor/  # 祭祖业务页面
│   │               ├── dashboard.vue
│   │               ├── products.vue
│   │               ├── categories.vue
│   │               ├── product-orders.vue
│   │               ├── ritual-orders.vue
│   │               ├── admins.vue
│   │               └── settings.vue
│   └── backend-mock/          # Mock 后端服务
│       ├── api/
│       │   └── ancestor/      # 祭祖业务接口实现
│       └── database/          # 数据库脚本
│           ├── schema.sql     # 表结构
│           └── seed.sql       # 初始数据
├── API_CHECKLIST.md           # API 接口清单
├── DEPLOYMENT.md              # 部署指南
└── README.md                  # 项目说明
```

## 核心模块

### 1. 数据概览

实时展示：
- 今日/累计代祭订单
- 今日/累计商品订单
- 今日/累计销售额
- 待处理订单数
- 最近订单列表

### 2. 商品管理

- 商品列表（搜索、分页、排序）
- 商品新增/编辑
- 商品分类管理
- 上下架管理
- 库存管理

### 3. 商品订单

- 订单列表查询
- 订单详情查看
- 订单发货
- 订单取消
- 订单状态流转

状态流程：
```
待付款 → 待发货 → 已发货 → 已完成
                    ↓
                  已取消
```

### 4. 代祭祀管理

- 订单列表查询
- 订单详情查看
- 状态推进管理
- 操作日志记录
- 祭祀套餐管理

状态流程：
```
待支付 → 已支付 → 待祭祀 → 准备中 → 封包中 
  → 焚化中 → 待上传视频 → 已完成
```

### 5. 祭祀视频

- 准备视频上传
- 封包视频上传
- 焚化视频上传
- 完整祭祀视频（可选）
- 视频预览与删除
- 七牛云直传

### 6. 祭祀记录

- 已完成记录查询
- 视频查看
- 用户端姓名查询接口（下单人 + 亡故亲人）

### 7. 系统管理

- 管理员增删改查
- 密码重置
- 角色权限管理
- 系统设置

## API 接口

共 41 个接口，详见 [API_CHECKLIST.md](./API_CHECKLIST.md)

### 接口分类

- 仪表盘: 1 个
- 商品管理: 5 个
- 商品分类: 4 个
- 商品订单: 6 个
- 代祭祀订单: 7 个
- 祭祀套餐: 4 个
- 祭祀视频: 6 个
- 祭祀记录: 1 个
- 系统管理: 5 个
- 角色权限: 1 个
- 系统设置: 2 个

### 基础路径

```
/api/ancestor/
```

### 响应格式

成功：
```json
{
  "code": 0,
  "data": {},
  "message": "success"
}
```

失败：
```json
{
  "code": 1,
  "message": "错误信息"
}
```

## 数据库

### 核心表

- `products` - 商品表
- `product_categories` - 商品分类表
- `product_orders` - 商品订单表
- `product_order_items` - 商品订单明细表
- `ritual_packages` - 祭祀套餐表
- `ritual_orders` - 代祭祀订单表
- `ritual_videos` - 祭祀视频表
- `ritual_logs` - 祭祀操作日志表
- `admins` - 管理员表
- `system_settings` - 系统设置表

详见 [schema.sql](./apps/backend-mock/database/schema.sql)

## 部署

详见 [DEPLOYMENT.md](./DEPLOYMENT.md)

### 构建

```bash
pnpm build
```

### 生产环境

需要：
1. 替换为真实后端服务
2. 配置数据库（MySQL/PostgreSQL）
3. 配置对象存储（七牛云/阿里云OSS）
4. 配置 HTTPS
5. 配置 Nginx 反向代理

## 开发规范

### 代码规范

- TypeScript 严格模式
- ESLint + Prettier
- 组件化开发
- API 与 UI 分离
- 统一错误处理

### Git 提交规范

```
feat: 新功能
fix: 修复bug
docs: 文档更新
style: 代码格式
refactor: 重构
test: 测试
chore: 构建/工具
```

### 命名规范

- 组件: PascalCase
- 变量/函数: camelCase
- 常量: UPPER_CASE
- 文件: kebab-case

## 安全注意事项

⚠️ 当前为 Mock 实现，生产环境需要：

1. **密码加密** - 使用 bcrypt
2. **JWT 认证** - Token 验证
3. **HTTPS** - 全站加密
4. **SQL 防注入** - 参数化查询
5. **XSS 防护** - 输入过滤
6. **CSRF 防护** - Token 验证
7. **接口限流** - 防止滥用
8. **视频签名 URL** - 限时访问

## 常见问题

### 为什么打开的是旧项目？

检查是否有旧的 dev server 进程，使用 `ps aux | grep vite` 查看并 kill 掉。

### 如何修改 API 地址？

修改 `apps/web-antd/.env.local`:
```env
VITE_GLOB_API_URL=http://your-api-url
```

### 如何添加新的管理员角色？

1. 修改 `apps/backend-mock/api/ancestor/roles.get.ts`
2. 添加角色定义和权限
3. 更新前端权限验证逻辑

### 视频上传失败？

检查：
1. 七牛云配置是否正确
2. 上传 token 是否有效
3. 网络连接是否正常
4. 文件大小是否超限

## 技术支持

- 查看文档: [DEPLOYMENT.md](./DEPLOYMENT.md)
- 查看接口: [API_CHECKLIST.md](./API_CHECKLIST.md)
- 查看数据库: [schema.sql](./apps/backend-mock/database/schema.sql)

## License

MIT

---

**祭祖后台管理系统** - 让祭祀服务更专业、更透明
