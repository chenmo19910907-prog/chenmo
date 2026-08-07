#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
LOG="/tmp/chenmo-natapp.log"

if [[ -f .env ]]; then
  set -a
  # shellcheck disable=SC1091
  source .env
  set +a
fi

: "${CHENMO_API_PORT:=3456}"
: "${NATAPP_AUTHTOKEN:=}"

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
  echo "未找到 node"
  exit 1
fi
NPM_BIN="$(dirname "$NODE_BIN")/npm"

if [[ -z "$NATAPP_AUTHTOKEN" || "$NATAPP_AUTHTOKEN" == "你的authtoken" ]]; then
  echo "=========================================="
  echo " 国内免费穿透 · natapp 配置"
  echo "=========================================="
  echo ""
  echo "请先免费注册并获取 authtoken："
  echo "  1. 打开 https://natapp.cn 注册"
  echo "  2. 我的隧道 → 购买隧道 → 免费隧道"
  echo "  3. 复制 authtoken"
  echo ""
  read -rp "请粘贴你的 natapp authtoken: " NATAPP_AUTHTOKEN
  if [[ -z "$NATAPP_AUTHTOKEN" ]]; then
    echo "authtoken 不能为空"
    exit 1
  fi
  if [[ -f .env ]]; then
    if grep -q '^NATAPP_AUTHTOKEN=' .env; then
      sed -i '' "s/^NATAPP_AUTHTOKEN=.*/NATAPP_AUTHTOKEN=${NATAPP_AUTHTOKEN}/" .env
    else
      echo "NATAPP_AUTHTOKEN=${NATAPP_AUTHTOKEN}" >> .env
    fi
  else
    cat > .env <<EOF
NATAPP_AUTHTOKEN=${NATAPP_AUTHTOKEN}
CHENMO_API_PORT=${CHENMO_API_PORT}
EOF
  fi
  export NATAPP_AUTHTOKEN
fi

export NATAPP_AUTHTOKEN
bash "$ROOT/scripts/install-natapp.sh"

NATAPP_DIR="${NATAPP_DIR:-$ROOT/.tools/natapp}"
[[ -x /opt/natapp/run_natapp.sh ]] && NATAPP_DIR=/opt/natapp

echo ""
echo "构建前端..."
"$NPM_BIN" run build

export NODE_ENV=production
export CHENMO_API_PORT

# 停掉旧进程
pkill -f "node server/index.mjs" 2>/dev/null || true
pkill -f "natapp" 2>/dev/null || true
sleep 1

echo "启动本机服务 (port ${CHENMO_API_PORT})..."
"$NODE_BIN" server/index.mjs &
SERVER_PID=$!

cleanup() {
  kill "$SERVER_PID" 2>/dev/null || true
  pkill -f "natapp" 2>/dev/null || true
}
trap cleanup EXIT INT TERM

sleep 1

echo "启动 natapp 隧道..."
rm -f "$LOG"
if [[ -x "$NATAPP_DIR/run_natapp.sh" ]]; then
  (cd "$NATAPP_DIR" && nohup ./run_natapp.sh >> "$LOG" 2>&1 &)
elif [[ -x "$NATAPP_DIR/natapp" ]]; then
  (cd "$NATAPP_DIR" && nohup ./natapp -authtoken="$NATAPP_AUTHTOKEN" >> "$LOG" 2>&1 &)
else
  echo "未找到 natapp 可执行文件"
  exit 1
fi

PUBLIC_URL=""
for _ in $(seq 1 30); do
  PUBLIC_URL="$(grep -oE 'https?://[a-zA-Z0-9.-]+\.natapp[a-zA-Z0-9.-]*' "$LOG" 2>/dev/null | head -1 || true)"
  if [[ -n "$PUBLIC_URL" ]]; then
    break
  fi
  sleep 1
done

if [[ -n "$PUBLIC_URL" ]]; then
  PUBLIC_URL="${PUBLIC_URL%/}"
  if [[ -f .env ]] && grep -q '^CHENMO_PUBLIC_URL=' .env; then
    sed -i '' "s|^CHENMO_PUBLIC_URL=.*|CHENMO_PUBLIC_URL=${PUBLIC_URL}|" .env
  else
    echo "CHENMO_PUBLIC_URL=${PUBLIC_URL}" >> .env
  fi
  export CHENMO_PUBLIC_URL="$PUBLIC_URL"
  echo ""
  echo "=========================================="
  echo " 外网地址: ${PUBLIC_URL}"
  echo " 本机地址: http://localhost:${CHENMO_API_PORT}"
  echo "=========================================="
  open "$PUBLIC_URL" 2>/dev/null || true
else
  echo ""
  echo "隧道已启动，请查看日志获取外网地址："
  echo "  tail -f $LOG"
  echo "  或登录 https://natapp.cn 查看隧道状态"
fi

echo ""
echo "按 Ctrl+C 停止（本机服务和隧道）"
wait "$SERVER_PID"
