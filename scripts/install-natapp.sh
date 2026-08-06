#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
NATAPP_DIR="${NATAPP_DIR:-$ROOT/.tools/natapp}"
AUTHTOKEN="${NATAPP_AUTHTOKEN:-}"

if [[ -f "$ROOT/.env" ]]; then
  set -a
  # shellcheck disable=SC1091
  source "$ROOT/.env"
  set +a
  AUTHTOKEN="${NATAPP_AUTHTOKEN:-$AUTHTOKEN}"
fi

if [[ -z "$AUTHTOKEN" || "$AUTHTOKEN" == "你的authtoken" ]]; then
  echo "请先在 .env 中设置 NATAPP_AUTHTOKEN"
  echo ""
  echo "获取步骤（免费）："
  echo "  1. 打开 https://natapp.cn 注册"
  echo "  2. 我的隧道 → 购买隧道 → 选「免费隧道」"
  echo "  3. 复制 authtoken 到 .env："
  echo "     cp deploy/natapp.env.example .env"
  echo "     编辑 NATAPP_AUTHTOKEN=..."
  exit 1
fi

if [[ -x "$NATAPP_DIR/run_natapp.sh" ]]; then
  echo "natapp 已安装: $NATAPP_DIR"
  exit 0
fi

echo "正在安装 natapp（国内节点）..."
INSTALL_TARGET="${NATAPP_INSTALL_DIR:-$ROOT/.tools/natapp}"
mkdir -p "$INSTALL_TARGET"
export NATAPP_INSTALL_DIR="$INSTALL_TARGET"
curl -fsSL "https://natapp.cn/get.sh?authtoken=${AUTHTOKEN}" | sh

if [[ ! -x "$INSTALL_TARGET/run_natapp.sh" && ! -x "$INSTALL_TARGET/natapp" ]]; then
  echo "安装失败，请手动访问 https://natapp.cn/download 下载"
  exit 1
fi

echo "natapp 安装完成: $INSTALL_TARGET"
