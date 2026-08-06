#!/usr/bin/env bash
# 临时外网预览（随机域名，无需 Cloudflare 账号）
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

CF="$ROOT/.tools/cloudflared"
for d in "$ROOT/.tools/node-v22.12.0-darwin-arm64" "$ROOT/.tools/node-v20.18.0-darwin-arm64"; do
  [[ -x "$d/bin/node" ]] && export PATH="$d/bin:$PATH" && break
done

if [[ ! -x "$CF" ]]; then
  echo "先运行: bash scripts/setup-tunnel-once.sh"
  echo "或: npm run tunnel:install"
  exit 1
fi

PORT="${CHENMO_API_PORT:-3456}"
npm run build
export NODE_ENV=production
export CHENMO_API_PORT="$PORT"

node server/index.mjs &
PID=$!
trap 'kill $PID 2>/dev/null' EXIT INT TERM
sleep 1
echo "本机: http://localhost:${PORT}"
echo "启动临时外网隧道（域名每次重启会变）..."
"$CF" tunnel --url "http://localhost:${PORT}"
