#!/usr/bin/env bash
cd "$(dirname "$0")"

# 确保本机服务在跑
if ! curl -s -m 2 http://127.0.0.1:3456/api/health >/dev/null 2>&1; then
  echo "启动本机服务..."
  bash scripts/install-local-service.sh
fi

pkill -f ".tools/natapp/natapp" 2>/dev/null || true
sleep 1

echo "=========================================="
echo " 启动 natapp 隧道（请保持此窗口不要关）"
echo " 看到 Forwarding 地址后，用浏览器打开"
echo "=========================================="
echo ""

exec .tools/natapp/run_natapp.sh
