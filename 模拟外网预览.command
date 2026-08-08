#!/usr/bin/env bash
cd "$(dirname "$0")"

if ! curl -s -m 2 http://127.0.0.1:3456/api/health >/dev/null 2>&1; then
  echo "启动本机服务..."
  bash scripts/install-local-service.sh
fi

PREVIEW_URL="http://127.0.0.1:3456/?view=public"
echo "打开外网预览：${PREVIEW_URL}"
open "${PREVIEW_URL}"
