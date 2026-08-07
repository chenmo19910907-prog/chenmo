#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TOOLS_DIR="$ROOT/.tools"
ARCH="$(uname -m)"
OS="$(uname -s | tr '[:upper:]' '[:lower:]')"

case "$OS-$ARCH" in
  darwin-arm64) FILE="cloudflared-darwin-arm64.tgz" ;;
  darwin-x86_64) FILE="cloudflared-darwin-amd64.tgz" ;;
  linux-arm64|linux-aarch64) FILE="cloudflared-linux-arm64" ;;
  linux-x86_64) FILE="cloudflared-linux-amd64" ;;
  *)
    echo "不支持的平台: $OS $ARCH"
    exit 1
    ;;
esac

VERSION="${CLOUDFLARED_VERSION:-2025.2.1}"
DEST="$TOOLS_DIR/cloudflared"
TGZ="$TOOLS_DIR/cloudflared.tgz"
GITHUB_URL="https://github.com/cloudflare/cloudflared/releases/download/${VERSION}/${FILE}"

mkdir -p "$TOOLS_DIR"

if [[ -x "$DEST" ]]; then
  echo "cloudflared 已存在: $DEST"
  "$DEST" --version
  exit 0
fi

# 复用 npm 包里的部分下载
PARTIAL="$ROOT/node_modules/cloudflared/bin/cloudflared.tgz"
if [[ -f "$PARTIAL" && ! -f "$TGZ" ]]; then
  echo "复用已有部分下载..."
  cp "$PARTIAL" "$TGZ"
fi

download_tgz() {
  local url="$1"
  echo "尝试: $url"
  curl --http1.1 -fL --connect-timeout 20 --max-time 600 --retry 3 --retry-delay 2 -C - "$url" -o "$TGZ"
}

echo "下载 cloudflared ${VERSION} (${FILE})..."

MIRRORS=(
  "$GITHUB_URL"
  "https://mirror.ghproxy.com/${GITHUB_URL}"
  "https://ghfast.top/${GITHUB_URL}"
)

ok=0
for url in "${MIRRORS[@]}"; do
  if download_tgz "$url"; then
    ok=1
    break
  fi
  echo "  失败，换下一个源..."
done

if [[ "$ok" -ne 1 ]]; then
  echo "所有下载源均失败，请检查网络后重试"
  exit 1
fi

if [[ "$FILE" == *.tgz ]]; then
  tar -xzf "$TGZ" -C "$TOOLS_DIR"
  rm -f "$TGZ"
else
  mv "$TGZ" "$DEST"
fi

chmod +x "$DEST"
echo "已安装: $DEST"
"$DEST" --version
