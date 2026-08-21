#!/usr/bin/env node
/**
 * 从 auto-generate-testcase 知识库提取陈墨在陌陌/Yaahlan 阶段的工作数据，
 * 总结后更新 chenmo-main 简历中 work-0（挚文集团·陌陌）的简介与详情。
 *
 * 用法：
 *   node scripts/sync-momo-work-from-kb.mjs
 *   TESTCASE_KB_ROOT=/path/to/auto-generate-testcase node scripts/sync-momo-work-from-kb.mjs
 */
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '..')
const RESUME_PATH = path.join(ROOT, 'src/data/resume.json')
const WORK_ID = 'work-0'

const KB_ROOT =
  process.env.TESTCASE_KB_ROOT?.trim() ||
  path.resolve(ROOT, '../auto-generate-testcase')

const OWNER = process.env.KB_OWNER_NAME?.trim() || '陈墨'

async function readDirMd(dir) {
  try {
    const names = await fs.readdir(dir)
    return names.filter((name) => name.endsWith('.md') && name !== 'README.md').length
  } catch {
    return 0
  }
}

async function countOwnerBugs(bugKbDir) {
  const counts = []
  let total = 0
  try {
    const files = await fs.readdir(bugKbDir)
    for (const file of files) {
      if (!file.endsWith('.md')) continue
      const content = await fs.readFile(path.join(bugKbDir, file), 'utf-8')
      const pattern = new RegExp(`提交\\s*${OWNER}`, 'g')
      const matchCount = content.match(pattern)?.length ?? 0
      if (matchCount > 0) {
        counts.push({ module: file.replace(/\.md$/, ''), count: matchCount })
        total += matchCount
      }
    }
  } catch (error) {
    throw new Error(`读取 bug-kb 失败: ${error instanceof Error ? error.message : error}`)
  }
  counts.sort((a, b) => b.count - a.count)
  const meaningful = counts.filter((item) => item.module !== '其他')
  return { total, topModules: meaningful.slice(0, 6) }
}

async function extractTestcaseDesignStats(documentsDir) {
  const stats = []
  try {
    const files = await fs.readdir(documentsDir)
    for (const file of files) {
      if (!file.endsWith('.md')) continue
      const content = await fs.readFile(path.join(documentsDir, file), 'utf-8')
      if (!content.includes(OWNER)) continue

      const caseMatches = [
        ...content.matchAll(/用例条数(\d+)条，实际执行(\d+)条，执行率([\d.]+)%/g),
      ]
      if (caseMatches.length === 0) {
        if (/设计人[：:]\s*陈墨/.test(content)) {
          stats.push({
            doc: file.replace(/\.md$/, ''),
            designed: null,
            executed: null,
            rate: null,
            note: '主导用例设计',
          })
        }
        continue
      }

      for (const match of caseMatches) {
        stats.push({
          doc: file.replace(/\.md$/, ''),
          designed: Number(match[1]),
          executed: Number(match[2]),
          rate: Number(match[3]),
        })
      }
    }
  } catch {
    return { stats: [], totalDesigned: 0, avgRate: null }
  }

  const withCounts = stats.filter((item) => item.designed != null)
  const totalDesigned = withCounts.reduce((sum, item) => sum + item.designed, 0)
  const totalExecuted = withCounts.reduce((sum, item) => sum + item.executed, 0)
  const avgRate =
    withCounts.length > 0
      ? Math.round((totalExecuted / totalDesigned) * 1000) / 10
      : null

  return { stats, totalDesigned, avgRate }
}

function formatModuleList(modules) {
  return modules.map((item) => `${item.module}（${item.count}）`).join('、')
}

function formatModuleNames(modules) {
  return modules.map((item) => item.module).join('、')
}

function buildWorkContent(kbSummary) {
  const {
    bugTotal,
    topBugModules,
    testcaseKbCount,
    prdKbCount,
    bugKbCount,
    familyDesigned,
    familyAvgRate,
    designDocs,
  } = kbSummary

  const topBugNames = formatModuleNames(topBugModules)
  const familyText = '主导家族改版、主题房等大版本用例设计'

  const description =
    '在挚文集团负责海外 Yaahlan 语音房产品测试，主攻 PK、跨房、礼物、房间活动、主题房、家族、上麦等玩法质量把关，以及 Google Play、App Store 海外发版验收。' +
    `深度覆盖 ${topBugNames} 等核心模块的缺陷闭环；${familyText}。` +
    '同期使用 Cursor 从零独立搭建业务智能工具平台 Agent，将 testcase/prd/bug/verified 知识库与 AI 用例、MOA 造数、抓包回归等平台化，供研发、产品、测试全项目使用。'

  const highlights = [
    `深度覆盖 ${topBugNames} 等房间玩法与营收模块的缺陷闭环`,
    '主导家族改版、主题房等大版本用例设计',
    '使用 Cursor 从零独立搭建业务智能工具平台 Agent，整合知识库、AI 用例、MOA 造数、抓包回归与报告输出，已纳入团队日常测试工作流',
    '担任团队房间玩法业务测试核心担当，参与海外 Google Play、App Store 发版与多语言、RTL 本地化验证',
  ]

  const designDocNames = [
    ...new Set(
      designDocs
        .map((item) => item.doc)
        .filter((name) => name.includes('家族') || name.includes('主题房')),
    ),
  ]
  const designDocText =
    designDocNames.length > 0
      ? `主导 ${designDocNames.join('、')} 等版本用例设计`
      : '主导家族改版、主题房等大版本用例设计'

  return {
    description,
    highlights,
    detail: {
      tagline: '房间玩法业务专家 · 知识库沉淀 · 平台搭建者',
      teamInfo: '房间玩法负责人 · 知识库维护 · 平台搭建者',
      businessOverview:
        `Yaahlan 是陌陌海外语音房聊天产品，与帧趣「撕歌」同属语音房 + K 歌 + 游戏 + 送礼社交赛道。我主攻房间玩法业务（PK、跨房、礼物、房间活动、主题房、家族、上麦机制）质量把关，` +
        `重点覆盖 ${topBugNames} 等模块的缺陷闭环。` +
        '在家族改版、主题房等版本中主导大版本用例设计。' +
        '基于玩法与活动测试痛点，使用 Cursor 从零独立搭建「业务智能工具平台 Agent」，将 testcase/prd/bug/verified 知识库、AI 用例生成、MOA 造数、Tunnel 抓包、ADB 自动化与测试报告等平台化，供研发/产品/测试全项目调用。',
      businessPoints: [
        `缺陷闭环：覆盖 ${topBugNames} 等核心玩法模块`,
        `用例设计：${designDocText}`,
        '平台搭建：Cursor Agent Skills + 钉钉 MCP + Python，打通 PRD 解析 → 知识库补全 → 用例生成 → 造数验收',
        '验收能力：MOA 造数、Tunnel 抓包、ADB 录制脚本、P0 自动回归与 HTML 报告',
        '海外发版：Google Play / App Store 提审、多语言与 RTL 本地化验证',
      ],
      responsibilities: [
        '负责房间玩法业务测试：PK、跨房、礼物、房间活动、主题房、家族、上麦及关联商业化场景',
        '跟进缺陷全生命周期，覆盖房间玩法核心模块并推动研发闭环',
        '维护 testcase/prd/bug/verified 知识库，将房间玩法经验沉淀为可复用规则与模板',
        '使用 Cursor 从零设计并搭建业务智能工具平台 Agent，持续迭代知识库、造数、抓包与自动化能力',
        '构建 AI 用例生成链路：钉钉 PRD → Agent Skills 解析 → 规则/知识库补全 → 结构化用例输出',
        '参与海外发版与玩法/活动方案评审，输出质量风险判断并推动缺陷闭环',
      ],
      achievements: [
        `深度覆盖 ${topBugNames} 等核心模块的缺陷闭环`,
        '家族改版、主题房等大版本用例设计',
        '使用 Cursor 从零搭建业务智能工具平台 Agent，从业余探索演进为项目正式提效工具',
        '四类知识库支撑 AI 用例生成与历史缺陷预防，显著缩短活动/发版用例设计周期',
        '成为团队房间玩法业务测试核心担当，形成「懂业务 → 测玩法 → 沉淀规则 → Agent 提效」闭环',
      ],
      projects: [
        {
          name: '房间玩法业务测试（核心）',
          description:
            '团队内房间玩法业务测试担当，覆盖 PK、跨房、礼物、房间活动、主题房、家族、上麦等链路与营收场景。',
          highlights: [
            `重点覆盖 ${topBugNames} 等玩法与营收模块`,
            '家族改版、主题房等大版本主导用例设计',
            '深度理解语音房 PK/跨房/送礼/活动规则，覆盖正向、异常、边界与多角色场景',
            '重点关注礼物链路、榜单结算、活动规则等营收场景的质量风险',
          ],
        },
        {
          name: '业务智能工具平台 Agent（Cursor 从零搭建）',
          description:
            '陌陌阶段核心成果：从房间玩法测试痛点出发，使用 Cursor 从零独立搭建端到端智能测试平台，供研发/产品/测试全项目使用。',
          highlights: [
            'AI 用例：钉钉 PRD → prd-review 审查 → 规则/知识库补全 → testcase-to-excel 自动写入',
            '真机验收：ADB 录制脚本 + Midscene AI 视觉自动化 + P0 autotest 与 HTML 报告',
            '落地推广：策划主讲 Keynote 对内演示，推动研发团队了解并使用平台能力',
          ],
        },
        {
          name: '海外发版与本地化',
          description: '参与 Yaahlan 海外渠道发版前的质量确认及多地区本地化验证。',
          highlights: [
            '跟进 Google Play / App Store 提审与内测发版',
            '验证活动、支付、广告等商业化功能在海外环境下的表现',
            '覆盖阿拉伯语等多语言、RTL 布局等本地化场景',
          ],
        },
      ],
    },
  }
}

async function main() {
  const bugKbDir = path.join(KB_ROOT, 'bug-kb')
  const documentsDir = path.join(KB_ROOT, 'documents')
  const testcaseKbDir = path.join(KB_ROOT, 'testcase-kb')
  const prdKbDir = path.join(KB_ROOT, 'prd-kb')

  const [{ total: bugTotal, topModules }, designStats, testcaseKbCount, prdKbCount, bugKbCount] =
    await Promise.all([
      countOwnerBugs(bugKbDir),
      extractTestcaseDesignStats(documentsDir),
      readDirMd(testcaseKbDir),
      readDirMd(prdKbDir),
      readDirMd(bugKbDir),
    ])

  const familyStats = designStats.stats.filter((item) => item.doc.includes('家族'))
  const familyDesigned = familyStats.reduce((sum, item) => sum + (item.designed ?? 0), 0)
  const familyExecuted = familyStats.reduce((sum, item) => sum + (item.executed ?? 0), 0)
  const familyAvgRate =
    familyDesigned > 0 ? Math.round((familyExecuted / familyDesigned) * 1000) / 10 : designStats.avgRate

  const kbSummary = {
    bugTotal,
    topBugModules: topModules,
    testcaseKbCount,
    prdKbCount,
    bugKbCount,
    familyDesigned,
    familyAvgRate,
    designDocs: designStats.stats,
  }

  const generated = buildWorkContent(kbSummary)

  const resumeRaw = await fs.readFile(RESUME_PATH, 'utf-8')
  const resume = JSON.parse(resumeRaw)
  const workIndex = resume.workExperiences.findIndex((work) => work.id === WORK_ID)
  if (workIndex < 0) {
    throw new Error(`未找到工作经历 ${WORK_ID}`)
  }

  const current = resume.workExperiences[workIndex]
  resume.workExperiences[workIndex] = {
    ...current,
    description: generated.description,
    highlights: generated.highlights,
    detail: {
      ...current.detail,
      ...generated.detail,
      tools: current.detail?.tools ?? [],
      platformAgentSummary: current.detail?.platformAgentSummary,
    },
  }

  await fs.writeFile(RESUME_PATH, `${JSON.stringify(resume, null, 2)}\n`, 'utf-8')

  console.log('已从知识库同步陌陌工作简介与详情 → src/data/resume.json')
  console.log(`知识库路径: ${KB_ROOT}`)
  console.log(`缺陷提交: ${bugTotal} 条`)
  console.log(`用例设计（家族相关）: ${familyDesigned} 条`)
  console.log(`TOP 缺陷模块: ${formatModuleList(topModules)}`)
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
