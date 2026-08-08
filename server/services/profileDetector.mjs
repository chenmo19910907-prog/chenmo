import { getProfileLabel, PROFILE_CONFIG } from './profileWeights.mjs'

const PROFILE_DETECT_KEYWORDS = {
  'business-expert': [
    '业务专家',
    '业务测试',
    '功能测试',
    '玩法',
    '语音房',
    '语聊',
    'K 歌',
    'K歌',
    '社交',
    '直播',
    '送礼',
    '活动运营',
    '商业化',
    '营收',
    '海外手游',
    '游戏测试',
    '质量专家',
    '业务理解',
    '产品测试',
    '用户体验',
  ],
  platform: [
    '测开',
    '测试开发',
    '测试工程师',
    '自动化测试',
    '自动化',
    '测试平台',
    '工具平台',
    '平台开发',
    '工程效率',
    '测试工具',
    '脚本',
    'Python',
    'CI/CD',
    '持续集成',
    'SDET',
    'ADB',
    'Midscene',
    'Agent',
    'MCP',
    '知识库',
    'AI 用例',
    '造数',
    '抓包',
    'MOA',
    'Cursor',
  ],
  management: [
    '测试组长',
    '质量负责人',
    '测试负责人',
    '组长',
    '主管',
    'Team Lead',
    'team lead',
    '带领团队',
    '团队管理',
    '管理经验',
    '人员管理',
    '排期',
    '任务分配',
    '交付',
    '客户对接',
    '统筹',
    '组建团队',
    '管理岗',
    'lead',
    'manager',
  ],
}

const TITLE_WEIGHT = 4
const REQUIREMENT_WEIGHT = 2

/**
 * 根据 JD / 岗位标题判断简历优化方向
 * @param {string} text
 * @returns {{ profile: string, label: string, scores: Record<string, number> }}
 */
export function detectResumeProfile(text = '') {
  const source = String(text).trim()
  const lower = source.toLowerCase()
  const scores = {
    'business-expert': 0,
    platform: 0,
    management: 0,
  }

  for (const [profile, keywords] of Object.entries(PROFILE_DETECT_KEYWORDS)) {
    const cfg = PROFILE_CONFIG[profile]
    const allKeywords = [...new Set([...(cfg?.highlightKeywords ?? []), ...keywords])]
    for (const kw of allKeywords) {
      if (!kw) continue
      const pattern = kw.toLowerCase()
      if (lower.includes(pattern)) {
        scores[profile] += kw.length >= 4 ? 2 : 1
      }
    }
  }

  const titleLine = source.split('\n').map((line) => line.trim()).find(Boolean) ?? ''
  boostByPatterns(titleLine, scores, TITLE_WEIGHT)

  const reqSection = source.match(/(?:任职要求|岗位要求|职位要求|任职资格)[：:\s]*([\s\S]*?)(?:\n\n|$)/i)
  if (reqSection?.[1]) {
    boostByPatterns(reqSection[1], scores, REQUIREMENT_WEIGHT)
  }

  if (/测试组长|质量负责人|团队管理|带领.{0,6}团队|1年以上.{0,4}管理/.test(source)) {
    scores.management += 5
  }
  if (/测开|测试开发|自动化.{0,4}测试|测试平台|工具平台|SDET/i.test(source)) {
    scores.platform += 4
  }
  if (/业务.{0,4}(专家|测试)|玩法|语音房|社交业务|游戏测试/.test(source)) {
    scores['business-expert'] += 3
  }

  const ranked = Object.entries(scores).sort((a, b) => b[1] - a[1])
  const [profile] = ranked[0]?.[1] > 0 ? ranked[0] : ['business-expert', 0]

  return {
    profile,
    label: getProfileLabel(profile),
    scores,
  }
}

function boostByPatterns(text, scores, weight) {
  const lower = text.toLowerCase()
  for (const [profile, keywords] of Object.entries(PROFILE_DETECT_KEYWORDS)) {
    for (const kw of keywords) {
      if (lower.includes(kw.toLowerCase())) {
        scores[profile] += weight
      }
    }
  }
}
