FROM node:22-alpine AS build
WORKDIR /app
RUN apk add --no-cache git
ENV CI=1
RUN corepack enable
RUN corepack prepare pnpm@11.16.0 --activate
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY playground/package.json ./playground/package.json
COPY apps/backend-mock/package.json ./apps/backend-mock/package.json
COPY packages ./packages
COPY internal ./internal
COPY scripts ./scripts
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm --filter @vben/playground build
RUN pnpm --filter @vben/backend-mock build

FROM node:22-alpine
WORKDIR /app
RUN apk add --no-cache nginx
COPY --from=build /app/playground/dist /usr/share/nginx/html
COPY --from=build /app/apps/backend-mock/.output /app/backend/.output
COPY --from=build /app/apps/backend-mock/package.json /app/backend/package.json
RUN mkdir -p /app/data /run/nginx
COPY <<'NGINX_CONF' /etc/nginx/http.d/default.conf
server {
  listen 80;
  server_name _;
  root /usr/share/nginx/html;
  index index.html;
  client_max_body_size 100M;
  location / {
    try_files $uri $uri/ /index.html;
  }
  location /api/ {
    proxy_pass http://127.0.0.1:3000;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
NGINX_CONF
COPY <<'START' /start.sh
#!/bin/sh
set -eu
cd /app/backend
NODE_ENV=production NITRO_PORT=3000 NITRO_HOST=127.0.0.1 node .output/server/index.mjs &
exec nginx -g 'daemon off;'
START
RUN chmod +x /start.sh
EXPOSE 80
CMD ["/start.sh"]
