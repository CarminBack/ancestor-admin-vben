#!/bin/sh
set -eu
: "${ACCESS_TOKEN_SECRET:?required}"
: "${REFRESH_TOKEN_SECRET:?required}"
: "${ANCESTOR_ADMIN_HASH:?required}"
: "${ANCESTOR_ADMIN_SALT:?required}"
node .output/server/index.mjs &
api_pid=$!
nginx -g 'daemon off;' &
nginx_pid=$!
trap 'kill "$api_pid" "$nginx_pid" 2>/dev/null || true; exit 0' TERM INT
while kill -0 "$api_pid" 2>/dev/null && kill -0 "$nginx_pid" 2>/dev/null; do sleep 2; done
kill "$api_pid" "$nginx_pid" 2>/dev/null || true
exit 1
