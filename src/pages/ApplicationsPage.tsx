import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import StatusBadge, { StatusSelect } from '../components/StatusBadge'
import type { ApplicationStatus, DashboardStats, JobApplication, RemindersResponse } from '../types/job'
import { STATUS_OPTIONS } from '../types/job'
import {
  checkApiHealth,
  fetchApplications,
  fetchDashboard,
  fetchReminders,
  matchScoreColor,
  updateApplication,
} from '../utils/jobApi'

export default function ApplicationsPage() {
  const [apps, setApps] = useState<JobApplication[]>([])
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [reminders, setReminders] = useState<RemindersResponse | null>(null)
  const [filter, setFilter] = useState<ApplicationStatus | 'all'>('all')
  const [loading, setLoading] = useState(true)
  const [apiOnline, setApiOnline] = useState<boolean | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const online = await checkApiHealth()
    setApiOnline(online)
    if (!online) {
      setLoading(false)
      return
    }
    try {
      const [appRes, dash, reminderRes] = await Promise.all([
        fetchApplications(),
        fetchDashboard(),
        fetchReminders(),
      ])
      setApps(appRes.applications)
      setStats(dash)
      setReminders(reminderRes)
    } catch {
      /* ignore */
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const handleStatusChange = async (app: JobApplication, status: ApplicationStatus) => {
    try {
      const { application } = await updateApplication(app.id, {
        status,
        appliedAt: status === 'applied' && !app.appliedAt ? new Date().toISOString() : app.appliedAt,
      })
      setApps((prev) => prev.map((a) => (a.id === app.id ? { ...a, ...application } : a)))
    } catch {
      /* ignore */
    }
  }

  const filtered =
    filter === 'all' ? apps : apps.filter((a) => a.status === filter)

  return (
    <main className="px-4 py-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">应聘跟踪</h1>
            <p className="mt-1 text-sm text-slate-500">管理投递状态、优先级与下一步行动</p>
          </div>
          <Link
            to="/assistant"
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            导入新岗位
          </Link>
        </div>

        {apiOnline === false && (
          <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            请先运行 <code className="rounded bg-amber-100 px-1">npm run dev:all</code>
          </div>
        )}

        {reminders && reminders.total > 0 && (
          <div className="mb-6 space-y-3">
            {reminders.overdue.length > 0 && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-4">
                <p className="text-sm font-medium text-rose-800">
                  ⚠️ 逾期提醒（{reminders.overdue.length}）
                </p>
                <ul className="mt-2 space-y-1">
                  {reminders.overdue.map((r) => (
                    <li key={r.applicationId} className="text-sm text-rose-700">
                      <Link to={`/jobs/${r.jobId}`} className="hover:underline">
                        {r.company} · {r.jobTitle}
                      </Link>
                      {r.nextAction && ` — ${r.nextAction}`}
                      <span className="text-rose-500">（逾期 {Math.abs(r.daysUntil)} 天）</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {reminders.upcoming.length > 0 && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                <p className="text-sm font-medium text-amber-800">
                  📅 即将到期（3 天内 · {reminders.upcoming.length}）
                </p>
                <ul className="mt-2 space-y-1">
                  {reminders.upcoming.map((r) => (
                    <li key={r.applicationId} className="text-sm text-amber-800">
                      <Link to={`/jobs/${r.jobId}`} className="hover:underline">
                        {r.company} · {r.jobTitle}
                      </Link>
                      {r.nextAction && ` — ${r.nextAction}`}
                      <span className="text-amber-600">
                        （{r.daysUntil === 0 ? '今天' : `${r.daysUntil} 天后`}）
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {stats && (
          <div className="mb-6 grid gap-3 sm:grid-cols-4 lg:grid-cols-7">
            {STATUS_OPTIONS.map((s) => (
              <button
                key={s.value}
                type="button"
                onClick={() => setFilter(s.value)}
                className={`rounded-xl border p-3 text-left transition ${
                  filter === s.value ? 'border-blue-400 bg-blue-50' : 'border-slate-200 bg-white'
                }`}
              >
                <p className="text-xs text-slate-400">{s.label}</p>
                <p className="text-xl font-bold text-slate-900">{stats.byStatus[s.value] ?? 0}</p>
              </button>
            ))}
            <button
              type="button"
              onClick={() => setFilter('all')}
              className={`rounded-xl border p-3 text-left ${
                filter === 'all' ? 'border-blue-400 bg-blue-50' : 'border-slate-200 bg-white'
              }`}
            >
              <p className="text-xs text-slate-400">全部</p>
              <p className="text-xl font-bold text-slate-900">{stats.totalApplications}</p>
            </button>
          </div>
        )}

        {loading ? (
          <p className="text-center text-sm text-slate-500">加载中…</p>
        ) : filtered.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center">
            <p className="text-slate-600">暂无应聘记录</p>
            <Link to="/jobs" className="mt-2 inline-block text-sm text-blue-600 hover:underline">
              去岗位监控添加 →
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((app) => (
              <div
                key={app.id}
                className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <Link
                      to={`/jobs/${app.jobId}`}
                      className="text-lg font-semibold text-slate-900 hover:text-blue-700"
                    >
                      {app.jobTitle}
                    </Link>
                    <p className="text-sm text-slate-500">{app.company}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {app.variant && (
                      <span
                        className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${matchScoreColor(app.variant.matchScore)}`}
                      >
                        匹配 {app.variant.matchScore}%
                      </span>
                    )}
                    <StatusBadge status={app.status} />
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <StatusSelect
                    value={app.status}
                    onChange={(s) => handleStatusChange(app, s)}
                    className="text-xs"
                  />
                  {app.nextAction && (
                    <span className="text-xs text-slate-500">{app.nextAction}</span>
                  )}
                  {app.nextActionDate && (
                    <span className="text-xs text-slate-400">
                      提醒 {new Date(app.nextActionDate).toLocaleDateString('zh-CN')}
                    </span>
                  )}
                  {app.appliedAt && (
                    <span className="text-xs text-slate-400">
                      投递于 {new Date(app.appliedAt).toLocaleDateString('zh-CN')}
                    </span>
                  )}
                  <Link
                    to={`/jobs/${app.jobId}`}
                    className="ml-auto text-sm text-blue-600 hover:underline"
                  >
                    简历 / 投递包 →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
