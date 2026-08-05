import type { OptimizeMeta } from '../types/job'

interface OptimizePanelProps {
  meta: OptimizeMeta
}

export default function OptimizePanel({ meta }: OptimizePanelProps) {
  return (
    <aside className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="text-base font-semibold text-slate-900">优化分析</h3>
      <p className="mt-2 text-sm text-slate-500">
        目标：{meta.company} · {meta.jobTitle}
        {meta.profileLabel && (
          <span className="ml-2 rounded bg-blue-50 px-2 py-0.5 text-xs text-blue-700">
            {meta.profileLabel}
          </span>
        )}
      </p>

      <div className="mt-4">
        <div className="flex items-end gap-2">
          <span className="text-3xl font-bold text-blue-700">{meta.matchScore}</span>
          <span className="pb-1 text-sm text-slate-500">/ 100 匹配度</span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-blue-600 transition-all"
            style={{ width: `${Math.min(100, meta.matchScore)}%` }}
          />
        </div>
      </div>

      {meta.matchedKeywords.length > 0 && (
        <div className="mt-5">
          <h4 className="text-xs font-medium uppercase tracking-wide text-slate-400">
            已匹配关键词
          </h4>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {meta.matchedKeywords.slice(0, 12).map((kw) => (
              <span
                key={kw}
                className="rounded-md bg-emerald-50 px-2 py-0.5 text-xs text-emerald-700"
              >
                {kw}
              </span>
            ))}
          </div>
        </div>
      )}

      {meta.missingKeywords.length > 0 && (
        <div className="mt-4">
          <h4 className="text-xs font-medium uppercase tracking-wide text-slate-400">
            待补充关键词
          </h4>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {meta.missingKeywords.slice(0, 10).map((kw) => (
              <span
                key={kw}
                className="rounded-md bg-amber-50 px-2 py-0.5 text-xs text-amber-700"
              >
                {kw}
              </span>
            ))}
          </div>
        </div>
      )}

      {meta.suggestions.length > 0 && (
        <div className="mt-5">
          <h4 className="text-xs font-medium uppercase tracking-wide text-slate-400">
            优化建议
          </h4>
          <ul className="mt-2 space-y-2">
            {meta.suggestions.map((s, i) => (
              <li key={i} className="text-sm leading-relaxed text-slate-600">
                · {s}
              </li>
            ))}
          </ul>
        </div>
      )}

      <p className="mt-4 text-xs text-slate-400">
        优化时间：{new Date(meta.optimizedAt).toLocaleString('zh-CN')}
      </p>
    </aside>
  )
}
