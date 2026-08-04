import { useEffect, useState } from 'react'
import type { InterviewPrep, ResumeProfile } from '../types/job'
import type { Resume } from '../types/resume'
import {
  copyToClipboard,
  fetchLlmStatus,
  generateCoverLetter,
  generateInterviewPrep,
  polishAssist,
} from '../utils/jobApi'

interface ApplyPackPanelProps {
  jobId: string
  resume: Resume
  profile: ResumeProfile
  onProfileChange: (p: ResumeProfile) => void
  showMessage: (text: string) => void
}

export default function ApplyPackPanel({
  jobId,
  resume,
  profile,
  onProfileChange,
  showMessage,
}: ApplyPackPanelProps) {
  const [tab, setTab] = useState<'letter' | 'intro' | 'interview'>('letter')
  const [coverLetter, setCoverLetter] = useState('')
  const [selfIntro, setSelfIntro] = useState('')
  const [prep, setPrep] = useState<InterviewPrep | null>(null)
  const [loading, setLoading] = useState(false)
  const [polishing, setPolishing] = useState<'letter' | 'intro' | null>(null)
  const [llmEnabled, setLlmEnabled] = useState(false)

  useEffect(() => {
    fetchLlmStatus()
      .then((s) => setLlmEnabled(s.enabled))
      .catch(() => setLlmEnabled(false))
  }, [])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    Promise.all([
      generateCoverLetter(jobId, resume, profile),
      generateInterviewPrep(jobId, resume, profile),
    ])
      .then(([letterRes, prepRes]) => {
        if (cancelled) return
        setCoverLetter(letterRes.coverLetter)
        setSelfIntro(letterRes.selfIntro)
        setPrep(prepRes.prep)
      })
      .catch(() => {
        if (!cancelled) showMessage('生成投递包失败')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [jobId, resume, profile, showMessage])

  const handleCopy = async (text: string, label: string) => {
    try {
      await copyToClipboard(text)
      showMessage(`${label}已复制`)
    } catch {
      showMessage('复制失败')
    }
  }

  const handlePolish = async (type: 'cover-letter' | 'self-intro') => {
    const draft = type === 'cover-letter' ? coverLetter : selfIntro
    if (!draft.trim()) return
    setPolishing(type === 'cover-letter' ? 'letter' : 'intro')
    try {
      const { polished } = await polishAssist(jobId, draft, type, profile)
      if (type === 'cover-letter') setCoverLetter(polished)
      else setSelfIntro(polished)
      showMessage('LLM 润色完成')
    } catch (err) {
      showMessage(err instanceof Error ? err.message : '润色失败')
    } finally {
      setPolishing(null)
    }
  }

  const tabs = [
    { id: 'letter' as const, label: '求职信' },
    { id: 'intro' as const, label: '1分钟自我介绍' },
    { id: 'interview' as const, label: '面试准备' },
  ]

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-base font-semibold text-slate-900">投递包</h3>
        <div className="flex gap-1 rounded-lg border border-slate-200 p-1">
          {(['business-expert', 'platform', 'management'] as ResumeProfile[]).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => onProfileChange(p)}
              className={`rounded-md px-2 py-1 text-xs ${
                profile === p ? 'bg-blue-600 text-white' : 'text-slate-600'
              }`}
            >
              {p === 'business-expert' ? '业务' : p === 'platform' ? '平台' : '管理'}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 flex gap-2 border-b border-slate-100 pb-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`text-sm font-medium ${
              tab === t.id ? 'text-blue-600' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="mt-4 text-sm text-slate-500">生成中…</p>
      ) : (
        <div className="mt-4">
          {tab === 'letter' && (
            <>
              <pre className="max-h-80 overflow-auto whitespace-pre-wrap rounded-lg bg-slate-50 p-4 text-sm leading-relaxed text-slate-700">
                {coverLetter}
              </pre>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => handleCopy(coverLetter, '求职信')}
                  className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
                >
                  复制求职信
                </button>
                {llmEnabled && (
                  <button
                    type="button"
                    disabled={polishing === 'letter'}
                    onClick={() => handlePolish('cover-letter')}
                    className="rounded-lg border border-violet-300 bg-violet-50 px-3 py-1.5 text-sm text-violet-700 hover:bg-violet-100 disabled:opacity-50"
                  >
                    {polishing === 'letter' ? '润色中…' : '✨ LLM 深度润色'}
                  </button>
                )}
              </div>
            </>
          )}
          {tab === 'intro' && (
            <>
              <pre className="whitespace-pre-wrap rounded-lg bg-slate-50 p-4 text-sm leading-relaxed text-slate-700">
                {selfIntro}
              </pre>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => handleCopy(selfIntro, '自我介绍')}
                  className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
                >
                  复制自我介绍
                </button>
                {llmEnabled && (
                  <button
                    type="button"
                    disabled={polishing === 'intro'}
                    onClick={() => handlePolish('self-intro')}
                    className="rounded-lg border border-violet-300 bg-violet-50 px-3 py-1.5 text-sm text-violet-700 hover:bg-violet-100 disabled:opacity-50"
                  >
                    {polishing === 'intro' ? '润色中…' : '✨ LLM 深度润色'}
                  </button>
                )}
              </div>
            </>
          )}
          {tab === 'interview' && prep && (
            <div className="space-y-4">
              <p className="text-xs text-slate-500">
                匹配度 {prep.matchScore}% · {prep.questions.length} 个预测问题
              </p>
              {prep.generalTips.map((tip, i) => (
                <p key={i} className="text-sm text-amber-800 bg-amber-50 rounded-lg px-3 py-2">
                  💡 {tip}
                </p>
              ))}
              {prep.questions.map((q, i) => (
                <div key={i} className="rounded-lg border border-slate-100 p-3">
                  <p className="text-sm font-medium text-slate-900">
                    Q{i + 1}. {q.question}
                  </p>
                  <ul className="mt-2 space-y-1">
                    {q.hints.map((h, j) => (
                      <li key={j} className="text-sm text-slate-600">
                        · {h}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
