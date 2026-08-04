import type { JobPosting } from '../types/job'

export type MatchTierFilter = 'all' | 'high' | 'medium' | 'low'
export type OutsourcingFilter = 'all' | 'direct' | 'outsourcing'
export type SourceFilter = 'all' | JobPosting['source']

export function getMatchTier(score?: number): 'high' | 'medium' | 'low' | 'unknown' {
  if (typeof score !== 'number' || Number.isNaN(score)) return 'unknown'
  if (score >= 75) return 'high'
  if (score >= 50) return 'medium'
  return 'low'
}

export const MATCH_TIER_OPTIONS: {
  value: MatchTierFilter
  label: string
  color: string
}[] = [
  { value: 'all', label: '全部匹配', color: 'border-slate-200 text-slate-600' },
  { value: 'high', label: '高匹配 ≥75%', color: 'border-emerald-300 text-emerald-700 bg-emerald-50' },
  { value: 'medium', label: '中匹配 50-74%', color: 'border-amber-300 text-amber-700 bg-amber-50' },
  { value: 'low', label: '低匹配 <50%', color: 'border-rose-300 text-rose-700 bg-rose-50' },
]

export const OUTSOURCING_FILTER_OPTIONS: {
  value: OutsourcingFilter
  label: string
}[] = [
  { value: 'all', label: '全部类型' },
  { value: 'direct', label: '正职 / 甲方' },
  { value: 'outsourcing', label: '可能外包' },
]

export const SOURCE_LABELS: Record<JobPosting['source'], string> = {
  manual: '手动导入',
  career_page: '官网',
  boss: 'Boss直聘',
  liepin: '猎聘',
}

export const SOURCE_FILTER_OPTIONS: { value: SourceFilter; label: string }[] = [
  { value: 'all', label: '全部渠道' },
  { value: 'career_page', label: '官网' },
  { value: 'boss', label: 'Boss直聘' },
  { value: 'liepin', label: '猎聘' },
  { value: 'manual', label: '手动' },
]

export function sourceBadgeClass(source: JobPosting['source']): string {
  switch (source) {
    case 'boss':
      return 'border-teal-200 bg-teal-50 text-teal-700'
    case 'liepin':
      return 'border-orange-200 bg-orange-50 text-orange-700'
    case 'career_page':
      return 'border-indigo-200 bg-indigo-50 text-indigo-700'
    default:
      return 'border-slate-200 bg-slate-50 text-slate-500'
  }
}

export function filterJobs(
  jobs: JobPosting[],
  options: {
    search?: string
    tier?: MatchTierFilter
    outsourcing?: OutsourcingFilter
    source?: SourceFilter
    matchScoreByJobId?: Map<string, number>
  },
): JobPosting[] {
  const q = options.search?.trim().toLowerCase() ?? ''

  return jobs.filter((job) => {
    if (q) {
      const hit =
        job.title.toLowerCase().includes(q) ||
        job.company.toLowerCase().includes(q) ||
        job.description?.toLowerCase().includes(q)
      if (!hit) return false
    }

    if (options.tier && options.tier !== 'all') {
      const score = options.matchScoreByJobId?.get(job.id)
      const tier = getMatchTier(score)
      if (options.tier === 'low') {
        if (tier !== 'low' && tier !== 'unknown') return false
      } else if (tier !== options.tier) {
        return false
      }
    }

    if (options.outsourcing === 'direct' && job.isOutsourcing) return false
    if (options.outsourcing === 'outsourcing' && !job.isOutsourcing) return false

    if (options.source && options.source !== 'all' && job.source !== options.source) {
      return false
    }

    return true
  })
}

export function countByTier(
  jobs: JobPosting[],
  matchScoreByJobId: Map<string, number>,
): Record<MatchTierFilter, number> {
  const counts = { all: jobs.length, high: 0, medium: 0, low: 0 }
  for (const job of jobs) {
    const tier = getMatchTier(matchScoreByJobId.get(job.id))
    if (tier === 'high') counts.high++
    else if (tier === 'medium') counts.medium++
    else counts.low++
  }
  return counts
}
