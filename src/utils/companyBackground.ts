import companyProfiles from '../data/companyProfiles.json'
import type { JobAnalysis } from '../types/job'

interface CompanyProfile {
  patterns: string[]
  brief: string
  background: string[]
  industry: string
}

function matchCompanyProfile(company: string): CompanyProfile | null {
  const normalized = company.trim().toLowerCase()
  if (!normalized || normalized === '未命名公司') return null

  for (const profile of companyProfiles as CompanyProfile[]) {
    if (
      profile.patterns.some((pattern) => normalized.includes(pattern.toLowerCase()))
    ) {
      return profile
    }
  }
  return null
}

function guessIndustry(company: string): string {
  if (/游戏|互娱|娱乐/.test(company)) return '游戏 / 娱乐'
  if (/科技|网络|信息/.test(company)) return '科技互联网'
  return '互联网 / 软件'
}

export function lookupCompanyBackground(company: string): {
  brief: string
  background: string[]
  industry: string
} {
  const matched = matchCompanyProfile(company)
  if (matched) {
    return {
      brief: matched.brief,
      background: matched.background,
      industry: matched.industry,
    }
  }

  const industry = guessIndustry(company)
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

function filterRedundantSuggestions(analysis: JobAnalysis): string[] {
  const redundant = new Set<string>()
  if (analysis.employmentAdvice) redundant.add(analysis.employmentAdvice)
  if (analysis.companyBrief) redundant.add(`公司背景：${analysis.companyBrief}`)
  if (analysis.industryGuess) redundant.add(`行业判断：${analysis.industryGuess}`)

  return (analysis.suggestions ?? []).filter((item) => {
    if (redundant.has(item)) return false
    if (item.startsWith('公司背景：') || item.startsWith('行业判断：')) return false
    if (item.includes('截图识别') || item.includes('已合并 JD 文本与截图')) return false
    return true
  })
}

/** 补全岗位分析中的公司背景与投递建议，兼容历史缓存数据 */
export function resolveJobAnalysisDisplay(analysis: JobAnalysis): JobAnalysis {
  const { brief, background, industry } = lookupCompanyBackground(analysis.company)
  const matched = matchCompanyProfile(analysis.company)
  const companyBackground =
    matched?.background ??
    (analysis.companyBackground?.length ? analysis.companyBackground : background)

  return {
    ...analysis,
    companyBrief: matched ? brief : analysis.companyBrief || brief,
    companyBackground,
    industryGuess: industry || analysis.industryGuess,
    suggestions: filterRedundantSuggestions({
      ...analysis,
      companyBrief: matched ? brief : analysis.companyBrief,
      industryGuess: industry || analysis.industryGuess,
    }),
  }
}
