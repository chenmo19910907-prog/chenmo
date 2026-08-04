import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import JobCard from '../components/JobCard'
import type { JobApplication, JobPosting, JobStore, ResumeVariant } from '../types/job'
import {
  OUTSOURCING_FILTER_OPTIONS,
  MATCH_TIER_OPTIONS,
  SOURCE_FILTER_OPTIONS,
  countByTier,
  filterJobs,
  type MatchTierFilter,
  type OutsourcingFilter,
  type SourceFilter,
} from '../utils/jobFilters'
import {
  checkApiHealth,
  fetchApplications,
  fetchJobs,
  fetchVariants,
  formatRefreshTime,
  refreshJobs,
  updateJob,
} from '../utils/jobApi'

export default function JobsPage() {
  const [store, setStore] = useState<JobStore | null>(null)
  const [variants, setVariants] = useState<ResumeVariant[]>([])
  const [applications, setApplications] = useState<JobApplication[]>([])
  const [apiOnline, setApiOnline] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [tierFilter, setTierFilter] = useState<MatchTierFilter>('all')
  const [outsourcingFilter, setOutsourcingFilter] = useState<OutsourcingFilter>('all')
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>('all')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    const online = await checkApiHealth()
    setApiOnline(online)

    if (!online) {
      setLoading(false)
      return
    }

    try {
      const [jobData, variantData, appData] = await Promise.all([
        fetchJobs(),
        fetchVariants(),
        fetchApplications(),
      ])
      setStore(jobData)
      setVariants(variantData.variants ?? [])
      setApplications(appData.applications ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载失败')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const handleRefresh = async () => {
    setRefreshing(true)
    setError('')
    try {
      const result = await refreshJobs()
      setStore(result.store)
      const variantData = await fetchVariants()
      setVariants(variantData.variants ?? [])
      const appData = await fetchApplications()
      setApplications(appData.applications ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : '刷新失败')
    } finally {
      setRefreshing(false)
    }
  }

  const handleToggleOutsourcing = async (job: JobPosting, next: boolean) => {
    try {
      const { job: updated } = await updateJob(job.id, { isOutsourcing: next })
      setStore((prev) =>
        prev
          ? {
              ...prev,
              jobs: (prev.jobs ?? []).map((j) => (j.id === job.id ? updated : j)),
            }
          : prev,
      )
    } catch {
      setError('标注更新失败')
    }
  }

  const variantByJob = useMemo(() => new Map(variants.map((v) => [v.jobId, v])), [variants])
  const appByJob = useMemo(() => new Map(applications.map((a) => [a.jobId, a])), [applications])
  const matchScoreByJobId = useMemo(
    () =>
      new Map(
        variants.map((v) => [v.jobId, v.matchScore] as [string, number]),
      ),
    [variants],
  )

  const allJobs = store?.jobs ?? []
  const tierCounts = useMemo(
    () => countByTier(allJobs, matchScoreByJobId),
    [allJobs, matchScoreByJobId],
  )
  const outsourcingCount = allJobs.filter((j) => j.isOutsourcing).length

  const filteredJobs = useMemo(
    () =>
      filterJobs(allJobs, {
        search,
        tier: tierFilter,
        outsourcing: outsourcingFilter,
        source: sourceFilter,
        matchScoreByJobId,
      }),
    [allJobs, search, tierFilter, outsourcingFilter, sourceFilter, matchScoreByJobId],
  )

  return (
    <main className="px-4 py-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">岗位监控</h1>
            <p className="mt-1 text-sm text-slate-500">
              多渠道抓取 · 高中低匹配筛选 · 外包岗位标注
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              to="/assistant"
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              导入 JD
            </Link>
            <Link
              to="/applications"
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              应聘跟踪
            </Link>
            <button
              type="button"
              disabled={!apiOnline || refreshing}
              onClick={handleRefresh}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {refreshing ? '刷新中…' : '立即刷新'}
            </button>
          </div>
        </div>

        {apiOnline === false && (
          <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            <p className="font-medium">求职助手服务未启动</p>
            <p className="mt-1">
              请在项目目录运行 <code className="rounded bg-amber-100 px-1">npm run server</code>{' '}
              或 <code className="rounded bg-amber-100 px-1">npm run dev:all</code>
              ，然后刷新本页。
            </p>
          </div>
        )}

        {error && (
          <div className="mb-6 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
            {error}
          </div>
        )}

        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-xs text-slate-400">监控岗位</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{allJobs.length}</p>
          </div>
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4">
            <p className="text-xs text-emerald-600">高匹配</p>
            <p className="mt-1 text-2xl font-bold text-emerald-700">{tierCounts.high}</p>
          </div>
          <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4">
            <p className="text-xs text-amber-600">中匹配</p>
            <p className="mt-1 text-2xl font-bold text-amber-700">{tierCounts.medium}</p>
          </div>
          <div className="rounded-xl border border-rose-200 bg-rose-50/50 p-4">
            <p className="text-xs text-rose-600">低/未分析</p>
            <p className="mt-1 text-2xl font-bold text-rose-700">{tierCounts.low}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-xs text-slate-400">可能外包</p>
            <p className="mt-1 text-2xl font-bold text-amber-700">{outsourcingCount}</p>
            <p className="mt-1 text-xs text-slate-400">
              刷新 {formatRefreshTime(store?.lastRefreshAt)}
            </p>
          </div>
        </div>

        {store?.lastRefreshErrors && store.lastRefreshErrors.length > 0 && (
          <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-800">
            部分渠道抓取失败：{store.lastRefreshErrors.join('；')}
          </div>
        )}

        <div className="mb-4 space-y-3">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索公司或岗位…"
            className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
          />

          <div className="flex flex-wrap gap-2">
            <span className="self-center text-xs text-slate-400">匹配度</span>
            {MATCH_TIER_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setTierFilter(opt.value)}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                  tierFilter === opt.value
                    ? opt.color
                    : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                }`}
              >
                {opt.label}
                {opt.value !== 'all' && (
                  <span className="ml-1 opacity-70">
                    ({tierCounts[opt.value as keyof typeof tierCounts]})
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            <span className="self-center text-xs text-slate-400">类型</span>
            {OUTSOURCING_FILTER_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setOutsourcingFilter(opt.value)}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                  outsourcingFilter === opt.value
                    ? 'border-amber-300 bg-amber-50 text-amber-700'
                    : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            <span className="self-center text-xs text-slate-400">渠道</span>
            {SOURCE_FILTER_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setSourceFilter(opt.value)}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                  sourceFilter === opt.value
                    ? 'border-blue-300 bg-blue-50 text-blue-700'
                    : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <p className="text-center text-sm text-slate-500">加载中…</p>
        ) : filteredJobs.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center">
            <p className="text-slate-600">暂无符合筛选条件的岗位</p>
            <p className="mt-2 text-sm text-slate-400">
              调整筛选条件，或点击「立即刷新」抓取更多渠道
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            <p className="text-xs text-slate-400">
              显示 {filteredJobs.length} / {allJobs.length} 条
            </p>
            {filteredJobs.map((job) => {
              const variant = variantByJob.get(job.id)
              const app = appByJob.get(job.id)
              return (
                <JobCard
                  key={job.id}
                  job={job}
                  matchScore={variant?.matchScore}
                  hasVariant={Boolean(variant)}
                  applicationStatus={app?.status}
                  onToggleOutsourcing={handleToggleOutsourcing}
                />
              )
            })}
          </div>
        )}
      </div>
    </main>
  )
}
