#!/usr/bin/env bash
# 构建 GitHub Pages 静态站（项目站 /chenmo/）
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

export GITHUB_PAGES=true

node scripts/export-variants-for-pages.mjs
npm run build

cp dist/index.html dist/404.html
touch dist/.nojekyll

echo ""
echo "=========================================="
echo " GitHub Pages 构建完成"
echo " 地址: https://chenmo19910907-prog.github.io/chenmo/"
echo "=========================================="

# 本机执行时恢复 / 路径的 dist，避免本地 3456 白屏
if [[ -z "${CI:-}" && -z "${GITHUB_ACTIONS:-}" ]]; then
  echo ""
  echo "恢复本机构建..."
  unset GITHUB_PAGES
  npm run build
fi
