/** 定向优化：不同求职方向的工作经历权重 */

export const PROFILE_CONFIG = {
  'business-expert': {
    label: '业务专家',
    workBoost: ['work-0', 'work-3', 'work-4'],
    workPenalty: ['work-1'],
    highlightKeywords: [
      '语音房',
      'K 歌',
      'PK',
      '跨房',
      '送礼',
      '活动',
      '上麦',
      '玩法',
      '业务',
      '质量负责人',
      '年流水',
      '海外',
      'Google Play',
    ],
  },
  platform: {
    label: '平台 / 测开',
    workBoost: ['work-0', 'work-3'],
    workPenalty: ['work-1'],
    highlightKeywords: [
      '平台',
      'Agent',
      'Python',
      '脚本',
      '自动化',
      'AI',
      'MOA',
      '工具',
      'MCP',
      'ADB',
      '知识库',
    ],
  },
  management: {
    label: '管理 / 组长',
    workBoost: ['work-2', 'work-3', 'work-0'],
    workPenalty: ['work-1'],
    highlightKeywords: [
      '组长',
      '负责人',
      '团队',
      '管理',
      '带领',
      '交付',
      '客户',
      '计划',
      '协调',
    ],
  },
}

/**
 * 按 profile 对工作经历排序加权
 * @param {object[]} workExperiences
 * @param {string} profile
 * @param {string[]} keywords
 */
export function sortWorkByProfile(workExperiences, profile, keywords) {
  const cfg = PROFILE_CONFIG[profile] ?? PROFILE_CONFIG['business-expert']
  const boost = new Set(cfg.workBoost)
  const penalty = new Set(cfg.workPenalty)

  return [...workExperiences].sort((a, b) => {
    const scoreA = scoreWork(a, boost, penalty, cfg.highlightKeywords, keywords)
    const scoreB = scoreWork(b, boost, penalty, cfg.highlightKeywords, keywords)
    return scoreB - scoreA
  })
}

function scoreWork(work, boost, penalty, profileKw, jdKw) {
  let score = 0
  if (boost.has(work.id)) score += 10
  if (penalty.has(work.id)) score -= 5
  const text = JSON.stringify(work).toLowerCase()
  for (const kw of profileKw) {
    if (text.includes(kw.toLowerCase())) score += 2
  }
  for (const kw of jdKw) {
    if (text.includes(kw.toLowerCase())) score += 1
  }
  return score
}

export function getProfileLabel(profile) {
  return PROFILE_CONFIG[profile]?.label ?? PROFILE_CONFIG['business-expert'].label
}

function parseWorkMonth(value) {
  if (!value || value === '至今') return 999912
  const [year, month] = String(value).split('-').map(Number)
  return (year || 0) * 100 + (month || 0)
}

/** 工作经历按结束时间倒序（至今优先），同结束时间再比开始时间 */
export function sortWorkChronologically(workExperiences) {
  return [...workExperiences].sort((a, b) => {
    const endDiff = parseWorkMonth(b.endDate) - parseWorkMonth(a.endDate)
    if (endDiff !== 0) return endDiff
    return parseWorkMonth(b.startDate) - parseWorkMonth(a.startDate)
  })
}
