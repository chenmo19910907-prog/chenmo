#!/usr/bin/env bash
# 在全新 Ubuntu 22.04/24.04 轻量服务器上执行（root 或 sudo）
# 用法：curl -fsSL <raw-url>/deploy/vps-setup.sh | bash
# 或克隆仓库后：sudo bash deploy/vps-setup.sh
set -euo pipefail

APP_DIR="${APP_DIR:-/opt/chenmo}"
APP_USER="${APP_USER:-chenmo}"
NODE_MAJOR="${NODE_MAJOR:-22}"

if [[ "$(id -u)" -ne 0 ]]; then
  echo "请使用 root 或 sudo 运行"
  exit 1
fi

echo "==> 安装基础依赖"
export DEBIAN_FRONTEND=noninteractive
apt-get update -qq
apt-get install -y -qq curl git nginx certbot python3-certbot-nginx

if ! id "$APP_USER" &>/dev/null; then
  useradd -m -s /bin/bash "$APP_USER"
fi

echo "==> 安装 Node.js ${NODE_MAJOR}"
if ! command -v node &>/dev/null; then
  curl -fsSL "https://deb.nodesource.com/setup_${NODE_MAJOR}.x" | bash -
  apt-get install -y -qq nodejs
fi

mkdir -p "$APP_DIR"
chown -R "$APP_USER:$APP_USER" "$APP_DIR"

if [[ ! -f "$APP_DIR/package.json" ]]; then
  echo ""
  echo "请将项目同步到 ${APP_DIR} 后再执行："
  echo "  npm ci && npm run build"
  echo "  cp deploy/vps.env.example ${APP_DIR}/.env  # 并修改 CHENMO_PUBLIC_URL"
  echo "  sudo cp deploy/chenmo.service /etc/systemd/system/chenmo.service"
  echo "  sudo systemctl enable --now chenmo"
  exit 0
fi

echo "==> 构建应用"
sudo -u "$APP_USER" bash -lc "cd '$APP_DIR' && npm ci && npm run build"

if [[ ! -f "$APP_DIR/.env" ]]; then
  cp "$APP_DIR/deploy/vps.env.example" "$APP_DIR/.env"
  chown "$APP_USER:$APP_USER" "$APP_DIR/.env"
  echo "已生成 ${APP_DIR}/.env，请编辑 CHENMO_PUBLIC_URL 后重启服务"
fi

cp "$APP_DIR/deploy/chenmo.service" /etc/systemd/system/chenmo.service
systemctl daemon-reload
systemctl enable chenmo
systemctl restart chenmo

echo ""
echo "部署完成。本机健康检查："
curl -s "http://127.0.0.1:3456/api/health" || true
echo ""
echo "下一步："
echo "  1. 配置 Nginx：cp deploy/nginx.chenmo.conf -> /etc/nginx/sites-available/chenmo"
echo "  2. 域名解析到本机公网 IP"
echo "  3. sudo certbot --nginx -d 你的域名"
echo "  4. 更新 ${APP_DIR}/.env 中 CHENMO_PUBLIC_URL=https://你的域名"
