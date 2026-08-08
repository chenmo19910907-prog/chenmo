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
