import { readFileSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { enrichJob, getMatchTier } from './jobClassifier.mjs'
import { getProfileLabel } from './profileWeights.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const companyProfiles = JSON.parse(
  readFileSync(path.join(__dirname, '../../src/data/companyProfiles.json'), 'utf8'),
)

function matchCompanyProfile(company = '') {
  const normalized = company.trim().toLowerCase()
  if (!normalized || normalized === '未命名公司') return null
  return (
    companyProfiles.find((profile) =>
      profile.patterns.some((pattern) => normalized.includes(pattern.toLowerCase())),
    ) ?? null
  )
}

function hasKnownCompanyHint(company = '') {
  return Boolean(matchCompanyProfile(company))
}

function lookupCompanyHint(company = '') {
  const matched = matchCompanyProfile(company)
  if (matched) {
    return {
      brief: matched.brief,
      background: matched.background ?? [matched.brief],
      industry: matched.industry,
    }
  }

  if (!company || company === '未命名公司') {
    return { brief: '', background: [], industry: '' }
  }

  let industry = '互联网 / 软件'
  if (/游戏|互娱|娱乐/.test(company)) industry = '游戏 / 娱乐'
  if (/科技|网络|信息/.test(company)) industry = '科技互联网'

  const brief = `${company}：公开信息有限，建议通过官网或招聘平台公司页进一步了解主营业务与团队情况。`
  return {
    brief,
    background: [
      brief,
      `行业方向初步判断为「${industry}」。可关注该公司近期招聘岗位类型、产品形态与融资动态，以辅助判断是否匹配个人方向。`,
    ],
    industry,
  }
}

function buildSearchLinks(company = '') {
  if (!company || company === '未命名公司') return []
  const query = encodeURIComponent(company)
  return [
    { label: '百度搜索', url: `https://www.baidu.com/s?wd=${query}` },
    { label: '企查查', url: `https://www.qcc.com/web/search?key=${query}` },
    { label: 'Boss 搜公司', url: `https://www.zhipin.com/web/geek/job?query=${query}` },
  ]
}

function buildEmploymentAdvice(enrichedJob) {
  if (enrichedJob.isOutsourcing) {
    if (enrichedJob.outsourcingConfidence === 'likely') {
      return '高度疑似外包/人力服务岗位，投递前务必确认：甲方公司、用工性质、是否直签、驻场地点与项目周期。'
    }
    return '存在外包或驻场可能，建议面试时追问编制归属、项目团队结构与转正机会。'
  }
  return '当前判断更接近甲方直招或自有团队岗位，仍建议在面试中确认汇报线与项目归属。'
}

function buildMatchAdvice(matchScore, profileLabel) {
  if (matchScore >= 75) {
    return `【${profileLabel}】匹配度较高，可优先投递；建议附带定制简历与个人主页链接。`
  }
  if (matchScore >= 50) {
    return `【${profileLabel}】匹配度中等，已按岗位方向重排经历；可投递，但面试需补强 JD 中的缺口项。`
  }
  if (matchScore > 0) {
    return `【${profileLabel}】匹配度偏低，建议评估岗位方向是否与语音房社交/测试管理优势一致。`
  }
  return `【${profileLabel}】当前缺少有效 JD 文本，匹配度无法准确计算；建议补充 JD 或确认截图识别结果。`
}

function filterRedundantSuggestions(analysis, employmentAdvice) {
  const redundant = new Set()
  if (employmentAdvice) redundant.add(employmentAdvice)
  if (analysis.companyBrief) redundant.add(`公司背景：${analysis.companyBrief}`)
  if (analysis.industryGuess) redundant.add(`行业判断：${analysis.industryGuess}`)

  return (analysis.suggestions ?? []).filter((item) => {
    if (redundant.has(item)) return false
    if (item.startsWith('公司背景：') || item.startsWith('行业判断：')) return false
    if (item.includes('截图识别') || item.includes('已合并 JD 文本与截图')) return false
    return true
  })
}

/** 为历史缓存补全公司背景字段，并清理投递建议中的重复项 */
export function enrichJobAnalysis(analysis) {
  if (!analysis) return analysis

  const { brief, background, industry } = lookupCompanyHint(analysis.company)
  const employmentAdvice = analysis.employmentAdvice || buildEmploymentAdvice({ isOutsourcing: analysis.isOutsourcing, outsourcingConfidence: analysis.outsourcingConfidence })
  const companyBackground = hasKnownCompanyHint(analysis.company)
    ? background
    : analysis.companyBackground?.length
      ? analysis.companyBackground
      : background

  return {
    ...analysis,
    companyBrief: brief || analysis.companyBrief,
    companyBackground,
    industryGuess: industry || analysis.industryGuess,
    employmentAdvice,
    suggestions: filterRedundantSuggestions(analysis, employmentAdvice),
  }
}

/**
 * @param {object} job
 * @param {object} meta optimize meta
 * @param {{ profileLabel?: string, extractionSource?: string }} [options]
 */
export function buildJobAnalysis(job, meta, options = {}) {
  const enrichedJob = enrichJob(job)
  const { brief, background, industry } = lookupCompanyHint(enrichedJob.company)
  const profileLabel = options.profileLabel ?? getProfileLabel(meta?.profile)
  const employmentAdvice = buildEmploymentAdvice(enrichedJob)
  const suggestions = []

  suggestions.push(buildMatchAdvice(meta?.matchScore ?? 0, profileLabel))

  if (enrichedJob.isOutsourcing) {
    suggestions.push(
      `外包风险提示：${enrichedJob.outsourcingReason || '检测到外包相关信号'}。可优先确认是否为项目制外派。`,
    )
  }

  for (const item of meta?.suggestions ?? []) {
    if (!suggestions.includes(item)) suggestions.push(item)
  }

  return {
    company: enrichedJob.company,
    title: enrichedJob.title,
    matchScore: meta?.matchScore ?? 0,
    matchTier: getMatchTier(meta?.matchScore),
    profile: meta?.profile,
    profileLabel,
    isOutsourcing: enrichedJob.isOutsourcing,
    outsourcingConfidence: enrichedJob.outsourcingConfidence,
    outsourcingReason: enrichedJob.outsourcingReason,
    companyBrief: brief,
    companyBackground: background,
    industryGuess: industry,
    employmentAdvice,
    suggestions,
    searchLinks: buildSearchLinks(enrichedJob.company),
    analyzedAt: new Date().toISOString(),
    extractionSource: options.extractionSource ?? 'jd',
  }
}

export function mergeParsedJobInfo(primary, secondary, options = {}) {
  const merged = { ...primary }
  if (!secondary) return merged

  const pick = (a, b, fallback = '') => {
    const left = (a ?? '').trim()
    const right = (b ?? '').trim()
    if (!left || left === '未命名公司' || left === '未命名岗位') return right || fallback
    if (!right || right === '未命名公司' || right === '未命名岗位') return left || fallback
    return left.length >= right.length ? left : right
  }

  const scoreTitle = (value) => {
    const text = (value ?? '').trim()
    if (!text || text === '未命名岗位') return -5
    if (/^\d+[）).、]\s*/.test(text)) return -10
    if (/^\d{1,2}[A-Za-z]{3}\.\d{4}$/.test(text)) return -3
    if (/^.{8,}[，,。；;]/.test(text) && /参与|承担|推动|梳理|制定|建立|优化|协调/.test(text)) {
      return -8
    }
    if (/组长/.test(text)) return 10
    if (/工程师/.test(text)) return 8
    if (/测试|开发|经理|总监|专员|专家/.test(text)) return 5
    if (/主管|招聘|猎头/i.test(text)) return 1
    if (text.length <= 20) return 2
    return 0
  }

  const pickTitle = (a, b) => (scoreTitle(a) >= scoreTitle(b) ? (a ?? '').trim() : (b ?? '').trim())

  const pickSection = (a, b) => {
    const left = (a ?? '').trim()
    const right = (b ?? '').trim()
    if (!left) return right
    if (!right) return left
    if (left.includes(right)) return left
    if (right.includes(left)) return right
    return left.length >= right.length ? left : right
  }

  const joinSection = (a, b) => {
    const left = (a ?? '').trim()
    const right = (b ?? '').trim()
    if (!left) return right
    if (!right) return left
    if (left.includes(right)) return left
    if (right.includes(left)) return right
    return `${left}\n\n${right}`
  }

  merged.company = pick(primary.company, secondary.company, '未命名公司')
  merged.title = pickTitle(primary.title, secondary.title) || '未命名岗位'
  const mergeSection = options.concatSections ? joinSection : pickSection
  merged.description = mergeSection(primary.description, secondary.description)
  merged.requirements = mergeSection(primary.requirements, secondary.requirements)
  if (secondary.salary && !merged.salary) merged.salary = secondary.salary
  if (secondary.location && !merged.location) merged.location = secondary.location
  return merged
}
