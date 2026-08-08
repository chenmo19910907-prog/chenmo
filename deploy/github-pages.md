# GitHub Pages 部署指南

固定外网地址（推送代码后自动更新）：

```text
https://chenmo19910907-prog.github.io/chenmo/
```

定制简历分享链接示例：

```text
https://chenmo19910907-prog.github.io/chenmo/r/<简历ID>
```

> 国内多数网络可直接访问，偶发较慢；无需翻墙。完整应聘助手 API 仍在本机运行。

---

## 一次性开通（约 3 分钟）

### 1. 推送代码到 GitHub

确保仓库：`github.com/chenmo19910907-prog/chenmo`

```bash
cd /Users/chenmo/PycharmProjects/chenmo-main
git add .
git commit -m "feat: add GitHub Pages deployment"
git push origin master
```

### 2. 在 GitHub 开启 Pages

1. 打开 https://github.com/chenmo19910907-prog/chenmo/settings/pages
2. **Build and deployment** → Source 选 **GitHub Actions**
3. 保存后，到 **Actions** 页查看 `Deploy GitHub Pages` 工作流是否成功（约 2–3 分钟）

### 3. 写入简历个人网站

```bash
bash scripts/setup-local-domain.sh https://chenmo19910907-prog.github.io/chenmo
```

---

## 日常更新

改完简历或生成新定制简历后：

```bash
git add .
git commit -m "chore: update resume"
git push
```

GitHub Actions 会自动 `build:gh-pages` 并发布。

本地可先验证构建：

```bash
npm run build:gh-pages
npx vite preview --base /chenmo/
# 打开 http://localhost:4173/chenmo/
```

---

## 能做什么 / 不能做什么

| 功能 | GitHub Pages |
|------|--------------|
| 个人主页 `/chenmo/` | ✅ |
| 作品页 | ✅ |
| 定制简历 `/chenmo/r/:id` | ✅（构建时导出 JSON） |
| 简历制作、岗位管理 | ❌（本机专属） |

---

## 绑定自定义域名（可选）

1. 仓库 **Settings → Pages → Custom domain**，填如 `resume.chenmo.com`
2. 在域名 DNS 添加 CNAME → `chenmo19910907-prog.github.io`
3. 更新本机：

```bash
bash scripts/setup-local-domain.sh https://resume.chenmo.com
```

---

## 文件说明

| 文件 | 作用 |
|------|------|
| `.github/workflows/github-pages.yml` | 推送后自动构建部署 |
| `scripts/build-github-pages.sh` | 本地/CI 构建脚本 |
| `scripts/export-variants-for-pages.mjs` | 导出定制简历静态 JSON |
| `vite.config.ts` | `GITHUB_PAGES=true` 时使用 `/chenmo/` 前缀 |

---

## 常见问题

**打开是空白页？**  
确认访问地址带 `/chenmo/` 后缀，不是仓库根路径。

**刷新子路由 404？**  
构建脚本已复制 `404.html`，重新 push 触发部署即可。

**定制简历链接失效？**  
先在本机生成简历，再 `git push`（会重新导出 `public/variants/`）。
