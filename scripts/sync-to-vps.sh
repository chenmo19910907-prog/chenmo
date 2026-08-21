#!/usr/bin/env bash
# 从本机同步代码到 VPS 并重启服务
# 用法：VPS_HOST=root@1.2.3.4 bash scripts/sync-to-vps.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

: "${VPS_HOST:?请设置 VPS_HOST，例如 root@123.45.67.89}"
APP_DIR="${VPS_APP_DIR:-/opt/chenmo}"

echo "==> 同步到 ${VPS_HOST}:${APP_DIR}"
rsync -avz --delete \
  --exclude node_modules \
  --exclude .git \
  --exclude dist-ssr \
  --exclude .tools \
  --exclude server/data/screenshots \
  --exclude '*.local' \
  ./ "${VPS_HOST}:${APP_DIR}/"

echo "==> 远程构建并重启"
ssh "$VPS_HOST" bash -s <<EOF
set -euo pipefail
cd "${APP_DIR}"
npm ci
npm run build
sudo systemctl restart chenmo
curl -s http://127.0.0.1:3456/api/health
echo
EOF

echo "完成。外网地址见服务器 ${APP_DIR}/.env 中的 CHENMO_PUBLIC_URL"
