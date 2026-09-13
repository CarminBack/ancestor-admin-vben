# 多阶段构建 Dockerfile

# 阶段1: 构建前端
FROM node:18-alpine AS frontend-builder

WORKDIR /app

# 安装 pnpm
RUN npm install -g pnpm

# 复制依赖文件
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/web-antd/package.json ./apps/web-antd/
COPY packages/ ./packages/

# 安装依赖
RUN pnpm install --frozen-lockfile

# 复制源码
COPY . .

# 构建前端
RUN pnpm --filter @vben/web-antd build

# 阶段2: 构建后端
FROM node:18-alpine AS backend-builder

WORKDIR /app

RUN npm install -g pnpm

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/backend-mock/package.json ./apps/backend-mock/

RUN pnpm install --frozen-lockfile

COPY apps/backend-mock ./apps/backend-mock

# 阶段3: 生产环境
FROM node:18-alpine

WORKDIR /app

# 安装 nginx 和 pnpm
RUN apk add --no-cache nginx && npm install -g pnpm

# 复制前端构建产物
COPY --from=frontend-builder /app/apps/web-antd/dist /usr/share/nginx/html

# 复制后端
COPY --from=backend-builder /app/node_modules ./node_modules
COPY --from=backend-builder /app/apps/backend-mock ./apps/backend-mock

# 配置 nginx
COPY <<'NGINX_CONF' /etc/nginx/http.d/default.conf
server {
    listen 80;
    server_name _;

    root /usr/share/nginx/html;
    index index.html;

    # 前端静态文件
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API 代理到后端
    location /api/ {
        proxy_pass http://localhost:6666;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # 静态资源缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
NGINX_CONF

# 创建启动脚本
COPY <<'START_SCRIPT' /start.sh
#!/bin/sh
set -e

# 启动后端
cd /app/apps/backend-mock
pnpm start &

# 等待后端启动
sleep 5

# 启动 nginx
nginx -g 'daemon off;'
START_SCRIPT

RUN chmod +x /start.sh

EXPOSE 80

CMD ["/start.sh"]
