#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

CF="$ROOT/.tools/cloudflared"
NODE_DIR=""
for d in "$ROOT/.tools/node-v22.12.0-darwin-arm64" "$ROOT/.tools/node-v20.18.0-darwin-arm64"; do
  if [[ -x "$d/bin/node" ]]; then NODE_DIR="$d"; break; fi
done
if [[ -n "$NODE_DIR" ]]; then
  export PATH="$NODE_DIR/bin:$PATH"
fi

echo "=========================================="
echo " 陈墨站点 · Cloudflare Tunnel 一键配置"
echo "=========================================="
echo ""

# 1. 安装 cloudflared
if [[ ! -x "$CF" ]]; then
  echo "[1/5] 下载 cloudflared..."
  bash "$ROOT/scripts/install-cloudflared.sh"
else
  echo "[1/5] cloudflared 已存在"
fi

# 2. 登录 Cloudflare（会打开浏览器）
echo ""
echo "[2/5] 登录 Cloudflare（浏览器将自动打开，请选择你的域名）..."
"$CF" tunnel login

# 3. 创建隧道
TUNNEL_NAME="chenmo"
echo ""
echo "[3/5] 创建隧道: $TUNNEL_NAME"
if "$CF" tunnel list 2>/dev/null | grep -q "$TUNNEL_NAME"; then
  echo "  隧道已存在，跳过创建"
else
  "$CF" tunnel create "$TUNNEL_NAME"
fi

TUNNEL_ID="$("$CF" tunnel list 2>/dev/null | awk -v n="$TUNNEL_NAME" '$0 ~ n {print $1; exit}')"
if [[ -z "$TUNNEL_ID" ]]; then
  echo "  无法获取 Tunnel ID，请检查 cloudflared tunnel list"
  exit 1
fi
echo "  Tunnel ID: $TUNNEL_ID"

# 4. 询问域名（支持环境变量 CHENMO_HOSTNAME 非交互传入）
echo ""
HOSTNAME="${CHENMO_HOSTNAME:-}"
if [[ -z "$HOSTNAME" ]]; then
  read -rp "[4/5] 请输入外网域名（如 chenmo.example.com）: " HOSTNAME
fi
if [[ -z "$HOSTNAME" ]]; then
  echo "域名不能为空"
  exit 1
fi

PUBLIC_URL="https://${HOSTNAME}"

# 写 cloudflared 配置
mkdir -p "$HOME/.cloudflared"
CRED_FILE="$HOME/.cloudflared/${TUNNEL_ID}.json"
cat > "$HOME/.cloudflared/config.yml" <<EOF
tunnel: ${TUNNEL_ID}
credentials-file: ${CRED_FILE}

ingress:
  - hostname: ${HOSTNAME}
    service: http://localhost:3456
  - service: http_status:404
EOF
echo "  已写入 ~/.cloudflared/config.yml"

# 自动添加 DNS 记录
echo ""
echo "[5/5] 添加 DNS 记录..."
"$CF" tunnel route dns "$TUNNEL_NAME" "$HOSTNAME" || echo "  DNS 可能已存在，可手动在 Cloudflare 检查"

# 写项目 .env
cat > "$ROOT/.env" <<EOF
CHENMO_PUBLIC_URL=${PUBLIC_URL}
CHENMO_API_PORT=3456
CHENMO_TUNNEL_NAME=${TUNNEL_NAME}
EOF
echo "  已写入 $ROOT/.env"

# 构建并启动
echo ""
echo "构建前端..."
npm run build

echo ""
echo "=========================================="
echo " 配置完成！正在启动服务..."
echo " 外网地址: ${PUBLIC_URL}"
echo " 本机地址: http://localhost:3456"
echo " 按 Ctrl+C 停止"
echo "=========================================="
echo ""

export NODE_ENV=production
export CHENMO_PUBLIC_URL="$PUBLIC_URL"
export CHENMO_API_PORT=3456

node server/index.mjs &
SERVER_PID=$!
trap 'kill $SERVER_PID 2>/dev/null' EXIT INT TERM
sleep 1
"$CF" tunnel run "$TUNNEL_NAME"
