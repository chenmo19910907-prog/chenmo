#!/usr/bin/env bash
cd "$(dirname "$0")"
echo "=========================================="
echo " 阿里云轻量服务器 · 一键部署"
echo " 说明见 deploy/README.md"
echo "=========================================="
echo ""
read -rp "SSH 地址（如 root@123.45.67.89）: " ALIYUN_HOST
read -rp "备案域名（可留空，先用 IP:3456）: " ALIYUN_DOMAIN
if [[ -z "$ALIYUN_HOST" ]]; then
  echo "SSH 地址不能为空"
  read -rp "按回车关闭..."
  exit 1
fi
export ALIYUN_HOST
export ALIYUN_DOMAIN
bash scripts/deploy-aliyun.sh
if [[ -z "$ALIYUN_DOMAIN" ]]; then
  IP="${ALIYUN_HOST#*@}"
  bash scripts/setup-local-domain.sh "http://${IP}:3456"
fi
read -rp "按回车关闭..."
