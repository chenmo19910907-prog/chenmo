import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import ApplyPackPanel from '../components/ApplyPackPanel'
import OptimizePanel from '../components/OptimizePanel'
import ProfileSelector from '../components/ProfileSelector'
import ResumeView from '../components/ResumeView'
import StatusBadge, { StatusSelect } from '../components/StatusBadge'
import { useResume } from '../context/ResumeContext'
import type {
  ApplicationStatus,
  JobApplication,
  JobPosting,
  ResumeProfile,
  ResumeVariant,
} from '../types/job'
import { exportToWord } from '../utils/exportDocx'
import {
  addInterviewNote,
  checkApiHealth,
  createApplication,
  deleteInterviewNote,
  deleteJob,
  fetchApplications,
  fetchJobs,
  fetchVariants,
  optimizeForJob,
  updateApplication,
} from '../utils/jobApi'

type Tab = 'resume' | 'apply' | 'track'

export default function JobDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { resume, showMessage } = useResume()
  const [job, setJob] = useState<JobPosting | null>(null)
  const [variant, setVariant] = useState<ResumeVariant | null>(null)
  const [application, setApplication] = useState<JobApplication | null>(null)
  const [profile, setProfile] = useState<ResumeProfile>('business-expert')
  const [optimizing, setOptimizing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [viewMode, setViewMode] = useState<'optimized' | 'original'>('optimized')
  const [tab, setTab] = useState<Tab>('resume')
  const [noteRound, setNoteRound] = useState('')
  const [noteContent, setNoteContent] = useState('')
  const [savingNote, setSavingNote] = useState(false)
  const [nextAction, setNextAction] = useState('')
  const [nextActionDate, setNextActionDate] = useState('')

  const load = useCallback(async () => {
    if (!id) return
    setLoading(true)
    setError('')

    const online = await checkApiHealth()
    if (!online) {
      setError('求职助手服务未启动，请先运行 npm run server')
      setLoading(false)
      return
    }

    try {
      const [jobStore, variantStore, appStore] = await Promise.all([
        fetchJobs(),
        fetchVariants(),
        fetchApplications(),
      ])
      const found = (jobStore.jobs ?? []).find((j) => j.id === id) ?? null
      setJob(found)
      const existing = (variantStore.variants ?? []).find((v) => v.jobId === id) ?? null
      setVariant(existing)
      if (!existing && found) setViewMode('original')

      let app = (appStore.applications ?? []).find((a) => a.jobId === id) ?? null
      if (!app && found) {
        const res = await createApplication(id)
        app = res.application
      }
      setApplication(app)
      if (app?.profile) setProfile(app.profile)
      else if (existing?.meta?.profile) setProfile(existing.meta.profile)
      if (app) {
        setNextAction(app.nextAction ?? '')
        setNextActionDate(app.nextActionDate?.slice(0, 10) ?? '')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载失败')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    load()
  }, [load])

  const handleOptimize = async () => {
    if (!id) return
    setOptimizing(true)
    setError('')
    try {
      const result = await optimizeForJob(id, resume, profile)
      setVariant(result.variant)
      setViewMode('optimized')
      showMessage(`已生成定制简历（${profile}），匹配度 ${result.variant.matchScore}%`)
    } catch (err) {
      setError(err instanceof Error ? err.message : '优化失败')
    } finally {
      setOptimizing(false)
    }
  }

  const handleStatusChange = async (status: ApplicationStatus) => {
    if (!application) return
    try {
      const patch: Partial<JobApplication> = {
        status,
        profile,
        appliedAt:
          status === 'applied' && !application.appliedAt
            ? new Date().toISOString()
            : application.appliedAt,
      }
      const { application: updated } = await updateApplication(application.id, patch)
      setApplication(updated)
      showMessage('状态已更新')
    } catch {
      showMessage('更新失败')
    }
  }

  const handleSaveTracking = async () => {
    if (!application) return
    try {
      const { application: updated } = await updateApplication(application.id, {
        nextAction,
        nextActionDate: nextActionDate || null,
        notes: application.notes,
      })
      setApplication(updated)
      showMessage('跟踪信息已保存')
    } catch {
      showMessage('保存失败')
    }
  }

  const handleAddNote = async () => {
    if (!application || !noteContent.trim()) return
    setSavingNote(true)
    try {
      const { application: updated } = await addInterviewNote(application.id, {
        round: noteRound,
        content: noteContent,
      })
      setApplication(updated)
      setNoteRound('')
      setNoteContent('')
      showMessage('面试笔记已添加')
    } catch {
      showMessage('添加失败')
    } finally {
      setSavingNote(false)
    }
  }

  const handleDeleteNote = async (noteId: string) => {
    if (!application) return
    try {
      const { application: updated } = await deleteInterviewNote(application.id, noteId)
      setApplication(updated)
      showMessage('笔记已删除')
    } catch {
      showMessage('删除失败')
    }
  }

  const handleExport = async () => {
    const data = viewMode === 'optimized' && variant ? variant.resume : resume
    try {
      const suffix = variant ? `-${variant.company}-${variant.jobTitle}` : ''
      await exportToWord(data, `${resume.basicInfo.name}${suffix}-定制简历.docx`)
      showMessage('Word 已导出')
    } catch {
      showMessage('导出失败')
    }
  }

  const handleDelete = async () => {
    if (!id || !window.confirm('确定删除该岗位？')) return
    try {
      await deleteJob(id)
      window.location.href = '/jobs'
    } catch (err) {
      setError(err instanceof Error ? err.message : '删除失败')
    }
  }

  if (loading) {
    return <main className="px-4 py-8 text-center text-sm text-slate-500">加载中…</main>
  }

  if (!job) {
    return (
      <main className="px-4 py-8 text-center">
        <p className="text-slate-600">岗位不存在</p>
        <Link to="/jobs" className="mt-4 inline-block text-blue-600 hover:underline">
          返回岗位列表
        </Link>
      </main>
    )
  }

  const displayResume = viewMode === 'optimized' && variant ? variant.resume : resume
  const tabs: { id: Tab; label: string }[] = [
    { id: 'resume', label: '定制简历' },
    { id: 'apply', label: '投递包' },
    { id: 'track', label: '跟踪' },
  ]

  return (
    <main className="px-4 py-8">
      <div className="mx-auto max-w-6xl">
        <Link to="/jobs" className="text-sm text-slate-500 hover:text-blue-600">
          ← 返回岗位列表
        </Link>

        <header className="mt-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold text-slate-900">{job.title}</h1>
                {application && <StatusBadge status={application.status} />}
              </div>
              <p className="mt-1 text-slate-500">{job.company}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleOptimize}
                disabled={optimizing}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {optimizing ? '优化中…' : variant ? '重新优化' : '生成定制简历'}
              </button>
              <button
                type="button"
                onClick={handleExport}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                导出 Word
              </button>
              {job.source === 'manual' && (
                <button
                  type="button"
                  onClick={handleDelete}
                  className="rounded-lg px-4 py-2 text-sm font-medium text-rose-600 hover:bg-rose-50"
                >
                  删除
                </button>
              )}
            </div>
          </div>

          <div className="mt-4">
            <p className="mb-2 text-xs text-slate-500">求职方向</p>
            <ProfileSelector value={profile} onChange={setProfile} />
          </div>
        </header>

        {error && (
          <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
            {error}
          </div>
        )}

        <div className="mt-4 flex gap-2 border-b border-slate-200">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`border-b-2 px-4 py-2 text-sm font-medium ${
                tab === t.id
                  ? 'border-blue-600 text-blue-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'resume' && (
          <>
            {variant && (
              <div className="mt-4 flex gap-2">
                <button
                  type="button"
                  onClick={() => setViewMode('optimized')}
                  className={`rounded-lg px-4 py-2 text-sm font-medium ${
                    viewMode === 'optimized'
                      ? 'bg-blue-600 text-white'
                      : 'border border-slate-300 text-slate-600'
                  }`}
                >
                  定制版 ({variant.matchScore}%)
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('original')}
                  className={`rounded-lg px-4 py-2 text-sm font-medium ${
                    viewMode === 'original'
                      ? 'bg-slate-800 text-white'
                      : 'border border-slate-300 text-slate-600'
                  }`}
                >
                  原版简历
                </button>
              </div>
            )}
            <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
              <ResumeView resume={displayResume} />
              {variant && viewMode === 'optimized' && (
                <OptimizePanel meta={variant.meta} />
              )}
            </div>
          </>
        )}

        {tab === 'apply' && id && (
          <div className="mt-6">
            {!variant && (
              <p className="mb-4 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
                建议先生成定制简历，投递包将基于 JD 匹配结果生成。
              </p>
            )}
            <ApplyPackPanel
              jobId={id}
              resume={resume}
              profile={profile}
              onProfileChange={setProfile}
              showMessage={showMessage}
            />
          </div>
        )}

        {tab === 'track' && application && (
          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-6">
              <h3 className="font-semibold text-slate-900">投递状态</h3>
              <div>
                <label className="text-xs text-slate-500">状态</label>
                <StatusSelect
                  value={application.status}
                  onChange={handleStatusChange}
                  className="mt-1 w-full"
                />
              </div>
              {application.appliedAt && (
                <p className="text-sm text-slate-600">
                  投递时间：{new Date(application.appliedAt).toLocaleString('zh-CN')}
                </p>
              )}
              <div>
                <label className="text-xs text-slate-500">下一步行动</label>
                <input
                  type="text"
                  value={nextAction}
                  onChange={(e) => setNextAction(e.target.value)}
                  placeholder="如：跟进 HR、准备二面"
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-slate-500">提醒日期</label>
                <input
                  type="date"
                  value={nextActionDate}
                  onChange={(e) => setNextActionDate(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
              <button
                type="button"
                onClick={handleSaveTracking}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                保存跟踪
              </button>
              <Link
                to="/applications"
                className="inline-block text-sm text-blue-600 hover:underline"
              >
                查看全部应聘跟踪 →
              </Link>
            </div>

            <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-6">
              <h3 className="font-semibold text-slate-900">面试复盘笔记</h3>
              {(application.interviewNotes ?? []).length === 0 ? (
                <p className="text-sm text-slate-500">暂无笔记，面试后可记录题目与反思</p>
              ) : (
                <ul className="space-y-3">
                  {(application.interviewNotes ?? []).map((note) => (
                    <li key={note.id} className="rounded-lg border border-slate-100 p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-medium text-slate-900">
                            {note.round} · {note.date}
                          </p>
                          <p className="mt-1 whitespace-pre-wrap text-sm text-slate-600">
                            {note.content}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteNote(note.id)}
                          className="text-xs text-rose-500 hover:text-rose-700"
                        >
                          删除
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              <div className="space-y-2 border-t border-slate-100 pt-4">
                <input
                  type="text"
                  value={noteRound}
                  onChange={(e) => setNoteRound(e.target.value)}
                  placeholder="轮次（如：一面、HR面）"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
                <textarea
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  placeholder="记录面试题目、回答反思、待补知识点…"
                  rows={4}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
                <button
                  type="button"
                  disabled={savingNote || !noteContent.trim()}
                  onClick={handleAddNote}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  {savingNote ? '保存中…' : '添加笔记'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
