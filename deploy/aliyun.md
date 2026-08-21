# 阿里云轻量应用服务器部署指南

> 总览见 [README.md](./README.md)。这是唯一推荐的外网方案。

## 一、购买服务器（约 5 分钟）

1. 登录 [阿里云控制台](https://swas.console.aliyun.com/) → **轻量应用服务器**
2. **创建服务器**：
   - 地域：选离目标用户近的（如华东、华北）
   - 镜像：**Ubuntu 22.04**
   - 套餐：2核2G 即可（约 60–100 元/年）
3. 记下 **公网 IP**，设置 root 密码或绑定 SSH 密钥

## 二、放行端口（必做）

轻量服务器 → 你的实例 → **防火墙** → 添加规则：

| 端口 | 协议 | 说明 |
|------|------|------|
| 22   | TCP  | SSH |
| 80   | TCP  | HTTP |
| 443  | TCP  | HTTPS |
| 3456 | TCP  | 无域名时临时直连（可选） |

## 三、域名（推荐）

- 有**已备案**域名：在阿里云 DNS 添加 **A 记录** → 指向服务器公网 IP
- 暂无域名：可先用 `http://公网IP:3456` 访问（需放行 3456）

> 大陆服务器绑定域名对外服务，通常需要 ICP 备案。

## 四、一键部署（在本机 Mac 执行）

### 方式 1：双击运行

双击 **`一键部署阿里云.command`**，按提示输入 SSH 地址和域名。

### 方式 2：终端命令

```bash
cd /Users/chenmo/PycharmProjects/chenmo-main

# 仅 IP 访问
ALIYUN_HOST=root@你的公网IP bash scripts/deploy-aliyun.sh

# 带域名 + HTTPS（域名已解析到该 IP）
ALIYUN_HOST=root@你的公网IP ALIYUN_DOMAIN=resume.你的域名.com bash scripts/deploy-aliyun.sh
```

部署完成后访问：

- `https://resume.你的域名.com`（配置了域名时）
- 或 `http://公网IP:3456`

健康检查：`/api/health` 应返回 `{"ok":true,...}`

## 五、日常更新

改完代码后，从本机同步：

```bash
VPS_HOST=root@你的公网IP bash scripts/sync-to-vps.sh
```

## 六、常用运维命令（SSH 登录服务器后）

```bash
# 查看服务状态
sudo systemctl status chenmo

# 查看日志
sudo journalctl -u chenmo -f

# 重启服务
sudo systemctl restart chenmo

# 编辑外网地址
sudo nano /opt/chenmo/.env   # CHENMO_PUBLIC_URL=...
sudo systemctl restart chenmo
```

## 七、文件说明

| 文件 | 作用 |
|------|------|
| `scripts/deploy-aliyun.sh` | 本机一键部署 |
| `scripts/sync-to-vps.sh` | 本机增量同步 |
| `deploy/vps-setup.sh` | 服务器环境初始化 |
| `deploy/nginx.chenmo.conf` | Nginx 反代模板 |
| `deploy/chenmo.service` | systemd 服务单元 |
