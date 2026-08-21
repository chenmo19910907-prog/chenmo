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

INDEX_HTML="$ROOT/dist/index.html"
if [[ -f "$INDEX_HTML" ]] && grep -q '/chenmo/assets/' "$INDEX_HTML"; then
  echo "[chenmo] dist 为 GitHub Pages 构建，正在恢复本机构建..." >&2
  (cd "$ROOT" && unset GITHUB_PAGES && npm run build) >&2 || {
    echo "[chenmo] 本机构建失败，本地页面可能无法打开" >&2
  }
fi

exec node server/index.mjs
