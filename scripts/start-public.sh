#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [[ -f .env ]]; then
  set -a
  # shellcheck disable=SC1091
  source .env
  set +a
fi

: "${CHENMO_API_PORT:=3456}"
: "${CHENMO_TUNNEL_NAME:=chenmo}"

NODE_BIN=""
for candidate in \
  "$ROOT/.tools/node-v22.12.0-darwin-arm64/bin/node" \
  "$ROOT/.tools/node-v20.18.0-darwin-arm64/bin/node" \
  "$(command -v node 2>/dev/null || true)"; do
  if [[ -n "$candidate" && -x "$candidate" ]]; then
    NODE_BIN="$candidate"
    break
  fi
done
if [[ -z "$NODE_BIN" ]]; then
  echo "未找到 node，请先安装 Node.js"
  exit 1
fi
NPM_BIN="$(dirname "$NODE_BIN")/npm"

CF_BIN="$ROOT/.tools/cloudflared"
if [[ ! -x "$CF_BIN ]]; then
  CF_BIN="$(command -v cloudflared || true)"
fi

if [[ -z "${CHENMO_PUBLIC_URL:-}" ]]; then
  echo "请先在 .env 中设置 CHENMO_PUBLIC_URL=https://你的域名"
  echo "可复制: cp deploy/env.example .env"
  exit 1
fi

if [[ ! -x "$CF_BIN" ]]; then
  echo "未找到 cloudflared，正在安装..."
  bash "$ROOT/scripts/install-cloudflared.sh"
  CF_BIN="$ROOT/.tools/cloudflared"
fi

echo "构建前端..."
"$NPM_BIN" run build

export NODE_ENV=production
export CHENMO_API_PORT

echo "启动本机服务 (port ${CHENMO_API_PORT})..."
"$NODE_BIN" server/index.mjs &
SERVER_PID=$!

cleanup() {
  kill "$SERVER_PID" 2>/dev/null || true
}
trap cleanup EXIT INT TERM

sleep 1
if ! kill -0 "$SERVER_PID" 2>/dev/null; then
  echo "服务启动失败"
  exit 1
fi

echo "外网域名: ${CHENMO_PUBLIC_URL}"
echo "本机访问: http://localhost:${CHENMO_API_PORT}"
echo "启动 Cloudflare Tunnel (${CHENMO_TUNNEL_NAME})..."
echo "按 Ctrl+C 停止"

if [[ -f "$HOME/.cloudflared/config.yml" ]]; then
  "$CF_BIN" tunnel run "$CHENMO_TUNNEL_NAME"
else
  echo ""
  echo "尚未配置 Tunnel，请先完成一次性设置："
  echo "  1. $CF_BIN tunnel login"
  echo "  2. $CF_BIN tunnel create $CHENMO_TUNNEL_NAME"
  echo "  3. 复制 deploy/cloudflared.yml.example 到 ~/.cloudflared/config.yml 并修改"
  echo "  4. 在 Cloudflare DNS 添加 CNAME 记录"
  echo ""
  echo "临时预览（随机域名，每次重启会变）："
  "$CF_BIN" tunnel --url "http://localhost:${CHENMO_API_PORT}"
fi
