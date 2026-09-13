# 祭祖后台部署指南

## 技术栈

### 前端
- Vben Admin 5.0
- Vue 3
- TypeScript
- Vite
- Ant Design Vue
- Pinia
- Vue Router

### 后端 Mock
- Nitro
- SQLite (D1)

## 本地开发

### 1. 安装依赖

```bash
pnpm install
```

### 2. 初始化数据库

执行数据库脚本创建表和初始数据：

```bash
# 在 backend-mock 的 SQLite 数据库中执行
# apps/backend-mock/database/schema.sql - 创建表结构
# apps/backend-mock/database/seed.sql - 插入初始数据
```

### 3. 启动开发服务器

```bash
# 启动前端和后端
pnpm dev

# 或分别启动
pnpm dev:app      # 前端 (默认 5173)
pnpm dev:backend  # 后端 (默认 6666)
```

### 4. 默认账号

管理员账号：
- 超级管理员: `admin` / `admin123`
- 祭祀管理员: `ritual` / `ritual123`
- 商品管理员: `product` / `product123`

## 环境变量配置

### 前端环境变量

创建 `apps/web-antd/.env.local`:

```env
# API 地址
VITE_GLOB_API_URL=http://localhost:6666
```

### 后端环境变量

创建 `apps/backend-mock/.env`:

```env
# 七牛云配置
QINIU_ACCESS_KEY=your_access_key
QINIU_SECRET_KEY=your_secret_key
QINIU_BUCKET=your_bucket_name
QINIU_DOMAIN=your_cdn_domain.com
QINIU_REGION=z2  # z0=华东, z1=华北, z2=华南, na0=北美, as0=东南亚
```

## 生产部署

### 前端构建

```bash
pnpm build

# 构建产物在 apps/web-antd/dist
```

部署到：
- Nginx
- Vercel
- Cloudflare Pages
- 阿里云 OSS

### 后端部署

当前使用 Nitro mock server，生产环境需要：

1. **替换为真实后端**
   - Node.js + Express/Koa
   - Java + Spring Boot
   - Go + Gin
   - Python + FastAPI

2. **数据库迁移**
   - 从 SQLite 迁移到 MySQL/PostgreSQL
   - 执行 `apps/backend-mock/database/schema.sql`
   - 执行 `apps/backend-mock/database/seed.sql`

3. **对象存储配置**
   - 配置七牛云/阿里云OSS/腾讯云COS
   - 设置视频上传接口
   - 配置签名URL生成

4. **安全加固**
   - 密码使用 bcrypt 加密
   - JWT token 认证
   - HTTPS 部署
   - CORS 配置
   - 接口频率限制
   - SQL 注入防护

## Nginx 配置示例

```nginx
server {
    listen 80;
    server_name ancestor.example.com;

    # 前端静态文件
    root /var/www/ancestor-admin/dist;
    index index.html;

    # SPA 路由
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API 代理
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # 静态资源缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

## 数据库表说明

### 核心表

1. **product_categories** - 商品分类
2. **products** - 商品
3. **product_orders** - 商品订单
4. **product_order_items** - 商品订单明细
5. **ritual_packages** - 祭祀套餐
6. **ritual_orders** - 代祭祀订单
7. **ritual_videos** - 祭祀视频
8. **ritual_logs** - 祭祀操作日志
9. **admins** - 管理员
10. **system_settings** - 系统设置

详见 `apps/backend-mock/database/schema.sql`

## API 接口文档

共 41 个接口，详见 `API_CHECKLIST.md`

### 接口规范

- 基础路径: `/api/ancestor/`
- 认证方式: Bearer Token (生产环境)
- 响应格式: JSON

成功响应：
```json
{
  "code": 0,
  "data": {},
  "message": "success"
}
```

错误响应：
```json
{
  "code": 1,
  "message": "错误信息"
}
```

## 权限说明

### 角色定义

1. **超级管理员 (SUPER_ADMIN)**
   - 所有权限

2. **祭祀管理员 (RITUAL_ADMIN)**
   - 代祭祀订单管理
   - 祭祀视频上传
   - 祭祀记录查看

3. **商品管理员 (PRODUCT_ADMIN)**
   - 商品管理
   - 商品分类管理
   - 商品订单管理

## 视频上传流程

1. 前端请求七牛上传 token
2. 前端直传视频到七牛云
3. 上传成功后获得视频 URL
4. 调用后端接口保存视频记录
5. 生成签名 URL 供用户访问

## 监控与日志

建议生产环境配置：

1. **应用监控**
   - Sentry (错误追踪)
   - 阿里云 ARMS
   - 腾讯云应用性能监控

2. **日志收集**
   - ELK Stack
   - 阿里云日志服务

3. **性能监控**
   - 接口响应时间
   - 数据库慢查询
   - 视频上传成功率

## 常见问题

### Q: 视频上传失败？
A: 检查七牛云配置、网络连接、文件大小限制

### Q: 姓名查询查不到记录？
A: 确认订单状态为"已完成"、姓名完全匹配

### Q: 权限验证失败？
A: 检查 token 是否过期、角色权限是否正确

### Q: 数据库连接失败？
A: 检查数据库配置、网络连接、数据库服务状态

## 技术支持

如有问题，请查看：
- `API_CHECKLIST.md` - 接口清单
- `apps/backend-mock/database/schema.sql` - 数据库结构
- 源码注释

## License

MIT
