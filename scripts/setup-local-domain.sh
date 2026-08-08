#!/usr/bin/env bash
# 将自有域名写入 .env 的 CHENMO_PUBLIC_URL，并重启本机服务
# 用法：bash scripts/setup-local-domain.sh https://resume.example.com
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

PUBLIC_URL="${1:-}"
if [[ -z "$PUBLIC_URL" ]]; then
  echo "用法: bash scripts/setup-local-domain.sh <外网地址>"
  echo "示例: bash scripts/setup-local-domain.sh https://resume.chenmo.cn"
  exit 1
fi

PUBLIC_URL="${PUBLIC_URL%/}"

if [[ ! -f .env ]]; then
  cp .env.example .env 2>/dev/null || touch .env
fi

if grep -q '^CHENMO_PUBLIC_URL=' .env; then
  sed -i '' "s|^CHENMO_PUBLIC_URL=.*|CHENMO_PUBLIC_URL=${PUBLIC_URL}|" .env
else
  echo "CHENMO_PUBLIC_URL=${PUBLIC_URL}" >> .env
fi

echo "已设置 CHENMO_PUBLIC_URL=${PUBLIC_URL}"

if launchctl print "gui/$(id -u)/com.chenmo.local" &>/dev/null; then
  launchctl kickstart -k "gui/$(id -u)/com.chenmo.local"
  echo "已重启本机服务 com.chenmo.local"
else
  echo "未检测到守护服务，请手动启动: bash scripts/install-local-service.sh"
fi

sleep 2
if curl -s -m 3 "http://127.0.0.1:${CHENMO_API_PORT:-3456}/api/health" | grep -q '"ok"'; then
  echo "本机服务正常: http://127.0.0.1:${CHENMO_API_PORT:-3456}"
else
  echo "警告: 本机 3456 未响应，请先 bash scripts/install-local-service.sh"
fi

echo ""
echo "请确认外网可访问: ${PUBLIC_URL}/api/health"
echo "详细说明: deploy/README.md"
