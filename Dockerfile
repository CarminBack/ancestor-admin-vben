FROM node:22-alpine AS build
WORKDIR /app
ENV CI=1
RUN apk add --no-cache git openssl && corepack enable && corepack prepare pnpm@11.16.0 --activate
COPY . .
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store pnpm install --frozen-lockfile --store-dir=/pnpm/store
RUN pnpm --filter @vben/playground build
RUN pnpm --filter @vben/backend-mock build

FROM node:22-alpine
WORKDIR /app/backend
RUN apk add --no-cache nginx tini
ENV NODE_ENV=production NITRO_PORT=3000 NITRO_HOST=127.0.0.1 ANCESTOR_DATA_DIR=/app/data
COPY --from=build /app/playground/dist /usr/share/nginx/html
COPY --from=build /app/apps/backend-mock/.output ./.output
COPY deploy/container-nginx.conf /etc/nginx/http.d/default.conf
COPY deploy/start.sh /start.sh
RUN chmod +x /start.sh && mkdir -p /app/data /run/nginx
EXPOSE 80
HEALTHCHECK --interval=15s --timeout=5s --start-period=20s CMD wget -q -O /dev/null http://127.0.0.1/api/service-config || exit 1
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["/start.sh"]
