#!/usr/bin/env bash
# 后台启动本机服务（可被 .command 或其它脚本调用）
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

PID_FILE="/tmp/chenmo-server.pid"
LOG="/tmp/chenmo-server.log"
PORT="${CHENMO_API_PORT:-3456}"

for candidate in \
  "$ROOT/.tools/node-v22.12.0-darwin-arm64/bin" \
  "$ROOT/.tools/node-v20.18.0-darwin-arm64/bin"; do
  if [[ -x "$candidate/node" ]]; then
    export PATH="$candidate:$PATH"
    break
  fi
done

if [[ -f "$ROOT/.env" ]]; then
  set -a
  # shellcheck disable=SC1091
  source "$ROOT/.env"
  set +a
fi

health_check() {
  curl -s -m 2 "http://localhost:${PORT}/api/health" >/dev/null 2>&1
}

if health_check; then
  echo "本机服务已在运行: http://localhost:${PORT}"
  exit 0
fi

if [[ -f "$PID_FILE" ]]; then
  old_pid="$(cat "$PID_FILE" 2>/dev/null || true)"
  if [[ -n "$old_pid" ]]; then
    kill "$old_pid" 2>/dev/null || true
  fi
fi
pkill -f "node server/index.mjs" 2>/dev/null || true
sleep 1

export NODE_ENV=production
export CHENMO_API_PORT="$PORT"
nohup node server/index.mjs >>"$LOG" 2>&1 &
server_pid=$!
echo "$server_pid" >"$PID_FILE"
disown "$server_pid" 2>/dev/null || true

sleep 2
if health_check; then
  echo "已后台启动: http://localhost:${PORT}"
  echo "进程 PID: $server_pid"
  echo "日志: $LOG"
else
  echo "启动失败，最近日志："
  tail -20 "$LOG" || true
  exit 1
fi
