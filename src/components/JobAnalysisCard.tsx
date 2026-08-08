import { useMemo, useState } from 'react'
import type { JobAnalysis } from '../types/job'
import { resolveJobAnalysisDisplay } from '../utils/companyBackground'

interface JobAnalysisCardProps {
  analysis: JobAnalysis
  onReanalyze?: () => void
  reanalyzing?: boolean
}

const MATCH_TIER_LABEL: Record<JobAnalysis['matchTier'], string> = {
  high: '高匹配',
  medium: '中等匹配',
  low: '偏低',
  unknown: '待补充 JD',
}

const OUTSOURCING_LABEL: Record<NonNullable<JobAnalysis['outsourcingConfidence']>, string> = {
  likely: '高度疑似外包',
  possible: '可能外包/驻场',
  direct: '倾向直招',
}

function getCompanyBackground(analysis: JobAnalysis): string[] {
  return analysis.companyBackground?.length
    ? analysis.companyBackground
    : analysis.companyBrief?.trim()
      ? [analysis.companyBrief.trim()]
      : []
}

export default function JobAnalysisCard({
  analysis,
  onReanalyze,
  reanalyzing = false,
}: JobAnalysisCardProps) {
  const [open, setOpen] = useState(false)
  const display = useMemo(() => resolveJobAnalysisDisplay(analysis), [analysis])

  const outsourcingLabel = display.isOutsourcing
    ? OUTSOURCING_LABEL[display.outsourcingConfidence ?? 'possible']
    : OUTSOURCING_LABEL.direct

  const companyBackground = getCompanyBackground(display)
  const actionableSuggestions = display.suggestions

  return (
    <section className="mb-6 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        className="flex w-full items-start justify-between gap-3 px-4 py-3 text-left hover:bg-slate-50"
      >
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-medium text-slate-700">岗位与公司分析</h2>
          <p className="mt-0.5 truncate text-xs text-slate-500">
            {analysis.company} · {analysis.title} · 匹配度 {display.matchScore}%
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
              {MATCH_TIER_LABEL[display.matchTier]}
            </span>
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                display.isOutsourcing
                  ? 'bg-amber-50 text-amber-700'
                  : 'bg-emerald-50 text-emerald-700'
              }`}
            >
              {outsourcingLabel}
            </span>
            {display.profileLabel && (
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                {display.profileLabel}
              </span>
            )}
          </div>
        </div>
        <span className="shrink-0 pt-1 text-xs text-slate-400">{open ? '收起 ▲' : '展开 ▼'}</span>
      </button>

      {open && (
        <div className="border-t border-slate-100 px-4 py-4">
          {onReanalyze && (
            <div className="mb-4 flex justify-end">
              <button
                type="button"
                onClick={onReanalyze}
                disabled={reanalyzing}
                className="rounded-lg border border-slate-300 px-3 py-1 text-xs text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                {reanalyzing ? '分析中…' : '重新分析'}
              </button>
            </div>
          )}

          {companyBackground.length > 0 && (
            <div>
              <h3 className="text-xs font-medium uppercase tracking-wide text-slate-400">公司背景</h3>
              <div className="mt-2 space-y-2">
                {companyBackground.map((paragraph, index) => (
                  <p key={index} className="text-sm leading-relaxed text-slate-700">
                    {paragraph}
                  </p>
                ))}
              </div>
              {display.industryGuess && (
                <p className="mt-3 text-sm text-slate-500">
                  行业方向：{display.industryGuess}
                </p>
              )}
            </div>
          )}

          {display.isOutsourcing && display.outsourcingReason && (
            <p className="mt-4 text-sm text-amber-700">外包信号：{display.outsourcingReason}</p>
          )}

          {display.employmentAdvice && (
            <p className="mt-4 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700">
              {display.employmentAdvice}
            </p>
          )}

          {actionableSuggestions.length > 0 && (
            <div className="mt-4">
              <h3 className="text-xs font-medium uppercase tracking-wide text-slate-400">投递建议</h3>
              <ul className="mt-2 space-y-2">
                {actionableSuggestions.map((item, index) => (
                  <li key={index} className="text-sm leading-relaxed text-slate-600">
                    · {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

        </div>
      )}
    </section>
  )
}
