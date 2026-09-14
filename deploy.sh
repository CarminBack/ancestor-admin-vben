#!/usr/bin/env bash
set -euo pipefail
image=${1:?Usage: deploy.sh ghcr.io/carminback/ancestor-admin-vben:COMMIT}
base=/opt/ancestor-admin
mkdir -p "$base/backups" "$base/data"
test -s "$base/runtime.env"
docker image inspect "$image" >/dev/null
stamp=$(date +%Y%m%d%H%M%S)
previous="ancestor-admin-rollback-$stamp"
had_previous=false
if docker container inspect ancestor-admin >/dev/null 2>&1; then
  docker stop ancestor-admin >/dev/null
  docker rename ancestor-admin "$previous"
  had_previous=true
fi
# Snapshot after stopping the writer; never delete the live data directory.
tar -czf "$base/backups/data-$stamp.tar.gz" -C "$base" data
rollback() {
  docker rm -f ancestor-admin >/dev/null 2>&1 || true
  if $had_previous; then docker rename "$previous" ancestor-admin; docker start ancestor-admin; fi
}
trap rollback ERR
docker run -d --name ancestor-admin --restart unless-stopped \
  -p 127.0.0.1:8080:80 --env-file "$base/runtime.env" \
  -v "$base/data:/app/data" "$image"
healthy=false
for i in {1..30}; do
  if curl -fsS http://127.0.0.1:8080/api/service-config >/dev/null; then healthy=true; break; fi
  sleep 2
done
$healthy
printf '%s\n' "$image" > "$base/current-image"
trap - ERR
printf 'Deployment healthy: %s\n' "$image"
