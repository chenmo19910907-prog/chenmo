#!/usr/bin/env bash
cd "$(dirname "$0")"
bash scripts/install-local-service.sh
echo ""
read -rp "按回车键关闭此窗口..."
