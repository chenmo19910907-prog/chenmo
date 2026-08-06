# 陈墨 · 工作简历

一个轻量级的工作简历管理工具，支持网页浏览、在线编辑、本地保存、导出 Word，以及 **应聘助手**（岗位监控 + JD 定制 + 投递跟踪）。

## 功能

### 简历管理
- **浏览**：以清晰排版展示完整简历
- **编辑**：在线修改基本信息、工作经历、项目经历、教育背景、专业技能
- **保存**：数据自动存储在浏览器 localStorage
- **导出 Word**：一键生成 `.docx` 文件，方便投递
- **导入/导出 JSON**：备份或迁移简历数据

### 应聘助手
- **岗位监控**：定时抓取目标公司招聘页 + Boss 直聘 + 手动导入 JD
- **JD 智能解析**：Boss / 猎聘整段粘贴，自动拆分公司/岗位/职责/要求
- **定向优化简历**：业务专家 / 平台测开 / 管理组长 三种方向重排亮点
- **投递包**：自动生成求职信、1 分钟自我介绍、面试预测题与回答要点
- **LLM 深度润色**：配置 OpenAI 兼容 API 后可一键润色求职信/自我介绍
- **应聘跟踪**：观望 → 待投递 → 已投递 → 面试中 → Offer / 拒绝
- **面试复盘笔记**：每轮面试记录题目与反思
- **投递提醒**：设置 nextActionDate，逾期/3天内自动提醒
- **定制版导出**：针对每个岗位导出匹配 Word 简历

## 快速开始

```bash
npm install
npm run dev:all    # 前端 + API（推荐）
npm run dev        # 仅前端
npm run server     # 仅 API
npm run build
```

## 使用流程

1. **求职助手** → 粘贴 JD → 智能解析 → 选择方向（默认业务专家）→ 预览 / 导入
2. **岗位详情** → 生成定制简历 → **投递包** 复制求职信 / 自我介绍 → **跟踪** 更新状态
3. **应聘跟踪** → 看板筛选各阶段岗位 → 点击进入详情继续准备

## API 端点

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/jobs/parse-jd` | 解析粘贴的 JD 文本 |
| POST | `/api/optimize` | 生成定制简历（支持 `profile`） |
| POST | `/api/assist/cover-letter` | 求职信 + 自我介绍 |
| POST | `/api/assist/interview-prep` | 面试准备 |
| POST | `/api/assist/polish` | LLM 润色求职信/自我介绍 |
| POST | `/api/jobs/refresh-boss` | 单独抓取 Boss 直聘 |
| GET | `/api/llm/status` | LLM 配置状态 |
| GET | `/api/boss/status` | Boss 抓取状态 |
| GET | `/api/reminders` | 投递提醒（逾期/即将到期） |
| POST | `/api/applications/:id/interview-notes` | 添加面试笔记 |
| GET/PATCH | `/api/applications` | 应聘跟踪 |
| GET | `/api/dashboard` | 看板统计 |

## 求职方向（profile）

| 值 | 说明 |
|----|------|
| `business-expert` | 业务专家（默认）：突出撕歌/陌陌玩法与业务共建 |
| `platform` | 平台测开：突出智能工具 Agent 体系 |
| `management` | 管理组长：突出带团队与交付经验 |

## 数据文件

| 路径 | 说明 |
|------|------|
| `src/data/resume.json` | 默认简历 |
| `server/data/jobs.json` | 岗位库 |
| `server/data/variants.json` | 定制简历版本 |
| `server/data/applications.json` | 应聘跟踪 |
| `server/config/job-monitor.json` | 监控配置 |
| `server/config/llm.json` | LLM 润色配置（复制 llm.example.json） |
| `server/config/boss.json` | Boss 直聘 Cookie（复制 boss.example.json） |

## LLM / Boss 配置

**LLM 润色**（可选）：
```bash
cp server/config/llm.example.json server/config/llm.json
# 编辑 apiKey、model，设置 enabled: true
# 或 export CHENMO_LLM_API_KEY=sk-...
```

**Boss 直聘抓取**（可选）：
```bash
cp server/config/boss.example.json server/config/boss.json
npx playwright install chromium
# 登录 zhipin.com 后复制 Cookie 到 boss.json
```

## 技术栈

- React + TypeScript + Vite + Tailwind CSS
- Express + node-cron + cheerio（应聘助手 API）
- docx + file-saver（Word 导出）
