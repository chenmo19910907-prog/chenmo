# 外网访问方案（唯一推荐）

此前 natapp / cpolar / Cloudflare Tunnel / 本机穿透等方案**已全部废弃**。

## 新方案：阿里云轻量服务器

把简历站点部署到阿里云，使用**固定公网 IP** 对外提供服务。

```
访客 → http://你的公网IP:3456 → 阿里云轻量实例 → Node 服务
```

### 为什么只保留这一种

| 问题 | 旧方案 | 新方案 |
|------|--------|--------|
| 地址会变 | natapp 免费版 | 公网 IP 永久不变 |
| 依赖本机开机 | 本机 + 穿透 | 云服务器 7×24 运行 |
| 家宽无公网入站 | 域名 A 记录无效 | 不依赖你家宽带 |
| 方案太多难维护 | 五六套脚本并存 | 一套部署 + 一套同步 |

### 费用

- 轻量服务器：**约 60–100 元/年**（新用户活动可能更低）
- 域名（可选）：首年约 10 元起；**大陆服务器绑域名需 ICP 备案**

### 三步上线

**1. 购买实例**

1. 打开 [阿里云轻量应用服务器](https://swas.console.aliyun.com/)
2. 镜像：**Ubuntu 22.04**，套餐 2核2G
3. 记下**公网 IP**，设置 root 密码
4. **防火墙**放行：`22`、`3456`（有备案域名时再加 `80`、`443`）

**2. 一键部署（在本机 Mac 执行）**

```bash
cd /Users/chenmo/PycharmProjects/chenmo-main
ALIYUN_HOST=root@你的公网IP bash scripts/deploy-aliyun.sh
```

或双击 **`一键部署阿里云.command`**。

**3. 写入简历外网地址**

```bash
bash scripts/setup-local-domain.sh http://你的公网IP:3456
```

验证：`http://你的公网IP:3456/api/health` 应返回 `{"ok":true,...}`

### 日常更新代码

改完代码后从本机同步到服务器：

```bash
VPS_HOST=root@你的公网IP bash scripts/sync-to-vps.sh
```

### 以后加域名（可选）

域名备案通过后：

```bash
ALIYUN_HOST=root@你的公网IP ALIYUN_DOMAIN=resume.你的域名.com bash scripts/deploy-aliyun.sh
```

访问变为 `https://resume.你的域名.com`。

---

详细步骤见 [aliyun.md](./aliyun.md)。
