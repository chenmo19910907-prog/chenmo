#!/usr/bin/env bash
# 安装/启动 macOS 后台守护服务（LaunchAgent，崩溃自动重启）
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
LABEL="com.chenmo.local"
PLIST="$HOME/Library/LaunchAgents/${LABEL}.plist"
RUN_SCRIPT="$ROOT/scripts/run-server.sh"
LOG="/tmp/chenmo-server.log"
PORT="${CHENMO_API_PORT:-3456}"
UID_NUM="$(id -u)"
DOMAIN="gui/${UID_NUM}"

chmod +x "$RUN_SCRIPT"

mkdir -p "$HOME/Library/LaunchAgents"

cat >"$PLIST" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>${LABEL}</string>
  <key>ProgramArguments</key>
  <array>
    <string>/bin/bash</string>
    <string>${RUN_SCRIPT}</string>
  </array>
  <key>WorkingDirectory</key>
  <string>${ROOT}</string>
  <key>RunAtLoad</key>
  <true/>
  <key>KeepAlive</key>
  <true/>
  <key>StandardOutPath</key>
  <string>${LOG}</string>
  <key>StandardErrorPath</key>
  <string>${LOG}</string>
</dict>
</plist>
EOF

launchctl bootout "$DOMAIN" "$PLIST" 2>/dev/null || true
launchctl bootstrap "$DOMAIN" "$PLIST"
launchctl enable "$DOMAIN/${LABEL}"
launchctl kickstart -k "$DOMAIN/${LABEL}"

sleep 2
if curl -s -m 3 "http://127.0.0.1:${PORT}/api/health" >/dev/null 2>&1; then
  echo "守护服务已启动: http://localhost:${PORT}"
  echo "日志: ${LOG}"
  echo "停止服务: launchctl bootout ${DOMAIN} ${PLIST}"
else
  echo "启动失败，最近日志："
  tail -30 "$LOG" || true
  exit 1
fi
