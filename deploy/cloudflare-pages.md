# Cloudflare Pages 部署指南

用 **Cloudflare Pages** 托管简历站点：**免费、固定域名、自动 HTTPS**，适合对外展示个人主页和定制简历链接。

> 应聘助手（岗位抓取、简历制作、LLM 等）仍建议在本机或阿里云运行；Pages 只负责**对外展示**。

---

## 能做什么 / 不能做什么

| 功能 | Pages 上 |
|------|----------|
| 个人主页 `/` | ✅ |
| 作品页 `/works` | ✅ |
| 定制简历 `/r/:id` | ✅（构建时导出静态 JSON） |
| 简历制作、岗位管理 | ❌（本机专属，外网会自动隐藏） |

---

## 方案 A：Git 自动部署（推荐）

### 1. 代码推到 GitHub

确保仓库在 GitHub（如 `chenmo19910907-prog/chenmo`）。

### 2. Cloudflare 创建 Pages 项目

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 左侧 **Workers & Pages** → **Create** → **Pages** → **Connect to Git**
3. 选择你的 GitHub 仓库
4. 构建设置：

| 项 | 值 |
|----|-----|
| Framework preset | Vite |
| Build command | `npm run build:pages` |
| Build output directory | `dist` |
| Node.js version | 22（Environment variables → `NODE_VERSION` = `22`） |

5. **Save and Deploy**

首次部署完成后会得到固定地址：

```text
https://chenmo.pages.dev
```

（实际名称以控制台为准，**不会变**。）

### 3. 绑定自己的域名（可选）

1. Pages 项目 → **Custom domains** → **Set up a custom domain**
2. 输入域名，如 `resume.chenmo.com`
3. 若域名已在 Cloudflare：自动添加 DNS
4. 若域名在阿里云：把域名 **NS** 改到 Cloudflare（或用 CNAME 到 `xxx.pages.dev`）

绑定后访问：`https://resume.chenmo.com`（**固定不变**）。

### 4. 写入简历里的个人网站

```bash
bash scripts/setup-local-domain.sh https://你的pages域名
```

---

## 方案 B：本机命令行直接发布

不连 GitHub，用 Wrangler 上传 `dist`：

```bash
cd /Users/chenmo/PycharmProjects/chenmo-main
npm run build:pages
npx wrangler pages deploy dist --project-name=chenmo
```

首次会提示登录 Cloudflare。`project-name` 决定 `https://chenmo.pages.dev` 这类地址。

---

## 日常更新流程

改完简历或生成新定制简历后：

```bash
npm run build:pages    # 导出 variants + 构建前端
# Git 推送后 Pages 自动重建；或 wrangler pages deploy dist
```

`build:pages` 会把 `server/data/variants.json` 里的定制简历导出到 `public/variants/*.json`，外网 `/r/:id` 才能访问。

---

## 与阿里云方案怎么选

| | Cloudflare Pages | 阿里云轻量 |
|--|------------------|------------|
| 费用 | **免费** | ~60–100 元/年 |
| 固定地址 | `xxx.pages.dev` 或自有域名 | 固定公网 IP |
| 国内访问速度 | 一般（边缘节点） | 更快 |
| 完整后端 API | ❌ | ✅ |
| 本机要开机 | ❌ | ❌ |

**建议**：对外展示用 **Pages**；需要完整应聘助手 API 时，本机或阿里云跑 `server`，两者可并存。

---

## 常见问题

**构建失败 `npm ci`？**  
在 Pages 设置里把 Build command 改为 `npm install && npm run build:pages`。

**`/r/xxx` 404？**  
先在本机生成定制简历，再执行 `npm run build:pages` 并重新部署。

**刷新后路由 404？**  
已配置 `public/_redirects`，SPA 会回退到 `index.html`。
