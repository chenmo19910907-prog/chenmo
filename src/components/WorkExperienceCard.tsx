import { Link } from 'react-router-dom'
import type { WorkExperience } from '../types/resume'

interface WorkExperienceCardProps {
  work: WorkExperience
  featured?: boolean
}

export default function WorkExperienceCard({
  work,
  featured = false,
}: WorkExperienceCardProps) {
  const tagline = work.detail?.tagline ?? work.description

  return (
    <article
      className={`group block rounded-2xl border bg-white p-6 shadow-sm transition hover:border-blue-200 hover:shadow-md ${
        featured ? 'border-blue-300 ring-2 ring-blue-100 md:col-span-2' : 'border-slate-200'
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-blue-600">
            {work.startDate} — {work.endDate}
          </p>
          <h3 className="mt-1 text-xl font-bold text-slate-900 group-hover:text-blue-700">
            {work.company}
          </h3>
          <p className="mt-1 text-slate-600">{work.position}</p>
        </div>
        <Link
          to={`/works/${work.id}`}
          className="rounded-full bg-blue-600 px-4 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
        >
          详情
        </Link>
      </div>

      <p className="mt-4 line-clamp-3 text-sm leading-relaxed text-slate-600">{tagline}</p>

      {work.detail?.tools && work.detail.tools.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {work.detail.tools.slice(0, 4).map((tool) => (
            <span
              key={tool}
              className="rounded-full bg-slate-50 px-2.5 py-0.5 text-xs text-slate-600"
            >
              {tool}
            </span>
          ))}
        </div>
      )}
    </article>
  )
}
