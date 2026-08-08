#!/usr/bin/env bash
# 供 launchd 调用，保持 node 进程常驻
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

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

export NODE_ENV=production
: "${CHENMO_API_PORT:=3456}"
export CHENMO_API_PORT

exec node server/index.mjs
