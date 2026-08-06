#!/bin/sh
# natapp 启动脚本
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
if [ -f "$ROOT/.env" ]; then
  set -a
  # shellcheck disable=SC1091
  . "$ROOT/.env"
  set +a
fi
if [ -z "${NATAPP_AUTHTOKEN:-}" ]; then
  echo "请先在 $ROOT/.env 中设置 NATAPP_AUTHTOKEN"
  exit 1
fi
exec "$(dirname "$0")/natapp" -authtoken="$NATAPP_AUTHTOKEN"
