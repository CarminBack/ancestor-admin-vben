#!/bin/bash
set -e

echo "=== 祭祖后台部署脚本 ==="

# 1. 创建部署目录
mkdir -p /opt/ancestor-admin
cd /opt/ancestor-admin

# 2. 创建 docker-compose.yml
cat > docker-compose.yml << 'COMPOSE_EOF'
version: '3.8'

services:
  ancestor-admin:
    image: ghcr.io/carminback/ancestor-admin-vben:latest
    container_name: ancestor-admin
    restart: unless-stopped
    ports:
      - "8080:80"
    environment:
      - NODE_ENV=production
    volumes:
      - ./data:/app/data
    networks:
      - ancestor-network

networks:
  ancestor-network:
    driver: bridge
COMPOSE_EOF

# 3. 登录 GitHub Container Registry (公开镜像无需登录)
echo "拉取 Docker 镜像..."
docker compose pull || docker-compose pull

# 4. 启动服务
echo "启动容器..."
docker compose up -d || docker-compose up -d

# 5. 等待服务启动
sleep 10

# 6. 检查服务状态
echo "检查服务状态..."
docker ps | grep ancestor-admin

# 7. 配置 Nginx 反向代理（域名访问）
echo "配置 Nginx..."
cat > /etc/nginx/conf.d/js.mewinyou.asia.conf << 'NGINX_EOF'
server {
    listen 80;
    server_name js.mewinyou.asia;

    client_max_body_size 100M;

    location / {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
NGINX_EOF

# 8. 测试并重载 Nginx
nginx -t && systemctl reload nginx

# 9. 安装 SSL 证书
echo "安装 SSL 证书..."
if ! command -v certbot &> /dev/null; then
    echo "安装 certbot..."
    yum install -y certbot python3-certbot-nginx || apt-get install -y certbot python3-certbot-nginx
fi

certbot --nginx -d js.mewinyou.asia --non-interactive --agree-tos --email admin@mewinyou.asia || echo "SSL 证书安装失败，请手动执行"

echo ""
echo "=== 部署完成 ==="
echo "HTTP 访问: http://39.107.32.221:8080"
echo "域名访问: https://js.mewinyou.asia"
echo ""
echo "查看日志: docker logs -f ancestor-admin"
echo "重启服务: cd /opt/ancestor-admin && docker compose restart"
