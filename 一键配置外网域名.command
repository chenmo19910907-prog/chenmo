#!/usr/bin/env bash
cd "$(dirname "$0")"
bash scripts/setup-tunnel-once.sh
read -rp "按回车键关闭窗口..."
