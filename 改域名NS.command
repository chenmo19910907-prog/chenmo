#!/usr/bin/env bash
# 傻瓜式引导：把 chenmo.com 的 NS 改到 Cloudflare

osascript <<'APPLESCRIPT'
display dialog "【第1步】即将打开 Cloudflare

1. 点击 chenmo.com
2. 在 Overview 页面找到 Cloudflare Nameservers
3. 复制那两个地址（如 xxx.ns.cloudflare.com）

点「好」继续" buttons {"好"} default button 1 with title "改域名教程 1/2"
APPLESCRIPT

open "https://dash.cloudflare.com"

osascript <<'APPLESCRIPT'
display dialog "【第2步】即将打开 zzy.cn

1. 登录你的账号
2. 域名管理 → 找到 chenmo.com
3. 修改 DNS 服务器
4. 删掉 NS1.CNOLNIC.COM 和 NS2.CNOLNIC.COM
5. 粘贴 Cloudflare 给你的两个地址
6. 保存

改完后等几小时，访问 https://chenmo.chenmo.com

点「好」打开 zzy.cn" buttons {"好"} default button 1 with title "改域名教程 2/2"
APPLESCRIPT

open "https://www.zzy.cn/user/login"

echo ""
echo "=========================================="
echo " 如果还是不会，把 Cloudflare 里两个 NS 地址"
echo " 截图发给我，我帮你核对 zzy.cn 怎么填"
echo "=========================================="
