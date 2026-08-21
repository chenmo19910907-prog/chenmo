#!/usr/bin/env bash
# 阿里云轻量服务器一键部署（在本机 Mac 执行）
#
# 用法：
#   ALIYUN_HOST=root@123.45.67.89 bash scripts/deploy-aliyun.sh
#   ALIYUN_HOST=root@123.45.67.89 ALIYUN_DOMAIN=resume.example.com bash scripts/deploy-aliyun.sh
#
# 前置：已在阿里云控制台创建 Ubuntu 22.04 轻量实例，防火墙放行 22/80/443
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

: "${ALIYUN_HOST:?请设置 ALIYUN_HOST，例如 root@123.45.67.89}"
APP_DIR="${ALIYUN_APP_DIR:-/opt/chenmo}"
ALIYUN_DOMAIN="${ALIYUN_DOMAIN:-}"

echo "=========================================="
echo " 阿里云部署 · ${ALIYUN_HOST}"
echo "=========================================="

echo "==> [1/4] 测试 SSH 连接"
ssh -o ConnectTimeout=10 "$ALIYUN_HOST" 'echo ok'

echo "==> [2/4] 同步代码到 ${APP_DIR}"
ssh "$ALIYUN_HOST" "mkdir -p '${APP_DIR}'"
rsync -avz --delete \
  --exclude node_modules \
  --exclude .git \
  --exclude dist-ssr \
  --exclude .tools \
  --exclude server/data/screenshots \
  --exclude '*.local' \
  ./ "${ALIYUN_HOST}:${APP_DIR}/"

echo "==> [3/4] 服务器初始化（Node、Nginx、systemd）"
ssh "$ALIYUN_HOST" "sudo bash -s" <<REMOTE
set -euo pipefail
APP_DIR="${APP_DIR}"
bash "\${APP_DIR}/deploy/vps-setup.sh"
REMOTE

if [[ -n "$ALIYUN_DOMAIN" ]]; then
  PUBLIC_URL="https://${ALIYUN_DOMAIN}"
  CERTBOT_EMAIL="${ALIYUN_EMAIL:-admin@${ALIYUN_DOMAIN}}"
  echo "==> [4/4] 配置 Nginx + HTTPS（${ALIYUN_DOMAIN}）"
  ssh "$ALIYUN_HOST" "sudo bash -s" <<REMOTE
set -euo pipefail
DOMAIN="${ALIYUN_DOMAIN}"
CERTBOT_EMAIL="${CERTBOT_EMAIL}"
APP_DIR="${APP_DIR}"
sed "s/resume.example.com/\${DOMAIN}/" "\${APP_DIR}/deploy/nginx.chenmo.conf" > /etc/nginx/sites-available/chenmo
ln -sf /etc/nginx/sites-available/chenmo /etc/nginx/sites-enabled/chenmo
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl reload nginx
if ! certbot --nginx -d "\${DOMAIN}" --non-interactive --agree-tos -m "\${CERTBOT_EMAIL}"; then
  echo "certbot 自动签发失败，请确认域名已解析到本机后手动执行："
  echo "  sudo certbot --nginx -d \${DOMAIN}"
fi
REMOTE
else
  PUBLIC_URL="http://${ALIYUN_HOST#*@}:3456"
  echo "==> [4/4] 未设置域名，使用 IP:3456 访问（建议在安全组放行 3456）"
  ssh "$ALIYUN_HOST" "sudo bash -s" <<'REMOTE'
set -euo pipefail
# 可选：直接暴露 3456（无 Nginx 时）
if command -v ufw &>/dev/null && ufw status | grep -q inactive; then
  ufw allow 3456/tcp || true
fi
REMOTE
fi

ssh "$ALIYUN_HOST" bash -s <<REMOTE
set -euo pipefail
ENV_FILE="${APP_DIR}/.env"
PUBLIC_URL="${PUBLIC_URL}"
if grep -q '^CHENMO_PUBLIC_URL=' "\$ENV_FILE"; then
  sed -i "s|^CHENMO_PUBLIC_URL=.*|CHENMO_PUBLIC_URL=\${PUBLIC_URL}|" "\$ENV_FILE"
else
  echo "CHENMO_PUBLIC_URL=\${PUBLIC_URL}" >> "\$ENV_FILE"
fi
sudo systemctl restart chenmo
curl -s http://127.0.0.1:3456/api/health
echo
REMOTE

echo ""
echo "=========================================="
echo " 部署完成"
echo " 外网地址: ${PUBLIC_URL}"
echo " 健康检查: ${PUBLIC_URL}/api/health"
echo "=========================================="
open "${PUBLIC_URL}" 2>/dev/null || true
