import { Link } from 'react-router-dom'
import type { ApplicationStatus, JobPosting } from '../types/job'
import { matchScoreColor } from '../utils/jobApi'
import { SOURCE_LABELS, getMatchTier, sourceBadgeClass } from '../utils/jobFilters'
import StatusBadge from './StatusBadge'

interface JobCardProps {
  job: JobPosting
  matchScore?: number
  hasVariant?: boolean
  applicationStatus?: ApplicationStatus
  onToggleOutsourcing?: (job: JobPosting, next: boolean) => void
}

const TIER_LABEL = {
  high: '高匹配',
  medium: '中匹配',
  low: '低匹配',
  unknown: '未分析',
} as const

export default function JobCard({
  job,
  matchScore,
  hasVariant,
  applicationStatus,
  onToggleOutsourcing,
}: JobCardProps) {
  const tier = getMatchTier(matchScore)

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-300 hover:shadow-md">
      <Link to={`/jobs/${job.id}`} className="block">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-lg font-semibold text-slate-900">{job.title}</h3>
            <p className="mt-1 text-sm text-slate-500">{job.company}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {typeof matchScore === 'number' && (
              <span
                className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${matchScoreColor(matchScore)}`}
              >
                {TIER_LABEL[tier]} {matchScore}%
              </span>
            )}
            {tier === 'unknown' && !hasVariant && (
              <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-xs text-slate-500">
                未分析
              </span>
            )}
            {hasVariant && (
              <span className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                已优化
              </span>
            )}
            {applicationStatus && applicationStatus !== 'watching' && (
              <StatusBadge status={applicationStatus} />
            )}
            <span
              className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${sourceBadgeClass(job.source)}`}
            >
              {SOURCE_LABELS[job.source]}
            </span>
            {job.isOutsourcing && (
              <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700">
                可能外包
              </span>
            )}
          </div>
        </div>

        {job.description && (
          <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-slate-600">
            {job.description}
          </p>
        )}

        <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-slate-400">
          <span>更新于 {new Date(job.fetchedAt).toLocaleDateString('zh-CN')}</span>
          {job.outsourcingReason && job.isOutsourcing && (
            <span className="text-amber-600">{job.outsourcingReason}</span>
          )}
          {job.url && (
            <a
              href={job.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              查看原文 →
            </a>
          )}
        </div>
      </Link>

      {onToggleOutsourcing && (
        <div className="mt-3 border-t border-slate-100 pt-3">
          <button
            type="button"
            onClick={() => onToggleOutsourcing(job, !job.isOutsourcing)}
            className="text-xs text-slate-500 hover:text-blue-600"
          >
            {job.isOutsourcing ? '标记为正职' : '标记为可能外包'}
            {job.isOutsourcingManual && ' · 已手动标注'}
          </button>
        </div>
      )}
    </div>
  )
}
