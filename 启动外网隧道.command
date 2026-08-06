#!/usr/bin/env bash
cd "$(dirname "$0")"

# 确保本机服务在跑
if ! curl -s -m 2 http://localhost:3456/api/health >/dev/null 2>&1; then
  echo "启动本机服务..."
  PATH=".tools/node-v20.18.0-darwin-arm64/bin:.tools/node-v22.12.0-darwin-arm64/bin:$PATH"
  set -a; source .env 2>/dev/null; set +a
  NODE_ENV=production CHENMO_API_PORT=3456 nohup node server/index.mjs >> /tmp/chenmo-server.log 2>&1 &
  sleep 2
fi

pkill -f ".tools/natapp/natapp" 2>/dev/null || true
sleep 1

echo "=========================================="
echo " 启动 natapp 隧道（请保持此窗口不要关）"
echo " 看到 Forwarding 地址后，用浏览器打开"
echo "=========================================="
echo ""

exec .tools/natapp/run_natapp.sh
