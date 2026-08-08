import { Link } from 'react-router-dom'
import EditableSection from './EditableSection'
import type { WorkExperience } from '../types/resume'
import { parseWorkCard, serializeWorkCard } from '../utils/sectionText'
import { getWorkDisplayCompany } from '../utils/workDisplay'

interface WorkExperienceCardProps {
  work: WorkExperience
  featured?: boolean
  editable?: boolean
  onWorkChange?: (work: WorkExperience) => void
}

function CardPreview({
  startDate,
  endDate,
  company,
  position,
  summary,
  tools,
}: {
  startDate: string
  endDate: string
  company: string
  position: string
  summary: string
  tools: string[]
}) {
  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-blue-600">
            {startDate} — {endDate}
          </p>
          <h3 className="mt-1 text-xl font-bold text-slate-900">{company}</h3>
          <p className="mt-1 text-slate-600">{position}</p>
        </div>
      </div>
      <p className="mt-4 line-clamp-3 text-sm leading-relaxed text-slate-600">{summary}</p>
      {tools.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {tools.map((tool) => (
            <span
              key={tool}
              className="rounded-full bg-slate-50 px-2.5 py-0.5 text-xs text-slate-600"
            >
              {tool}
            </span>
          ))}
        </div>
      )}
    </>
  )
}

export default function WorkExperienceCard({
  work,
  featured = false,
  editable = false,
  onWorkChange,
}: WorkExperienceCardProps) {
  const summary = work.detail?.tagline ?? work.description
  const tools = work.detail?.tools?.slice(0, 4) ?? []
  const canEdit = editable && !!onWorkChange
  const displayCompany = getWorkDisplayCompany(work)

  const getDraft = () =>
    serializeWorkCard({
      startDate: work.startDate,
      endDate: work.endDate,
      company: displayCompany,
      position: work.position,
      summary,
      tools,
    })

  const applyDraft = (draft: string) => {
    const parsed = parseWorkCard(draft)
    onWorkChange?.({
      ...work,
      startDate: parsed.startDate,
      endDate: parsed.endDate,
      displayCompany: parsed.company,
      position: parsed.position,
      description: work.detail ? work.description : parsed.summary,
      detail: work.detail
        ? {
            ...work.detail,
            tagline: parsed.summary,
            tools:
              parsed.tools.length > 0
                ? [
                    ...parsed.tools,
                    ...work.detail.tools.slice(parsed.tools.length),
                  ]
                : work.detail.tools,
          }
        : work.detail,
    })
  }

  return (
    <article
      className={`group relative block overflow-visible rounded-2xl border bg-white p-6 shadow-sm transition hover:border-blue-200 hover:shadow-md ${
        featured ? 'border-blue-300 ring-2 ring-blue-100 md:col-span-2' : 'border-slate-200'
      }`}
    >
      <div className="mb-3 flex justify-end">
        <Link
          to={`/works/${work.id}`}
          state={{ from: 'home' }}
          className="rounded-full bg-blue-600 px-4 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
        >
          详情
        </Link>
      </div>

      <EditableSection
        editable={canEdit}
        title={`编辑 ${displayCompany}`}
        getDraft={getDraft}
        onSave={applyDraft}
        hint="依次为时间、公司、职位；空行后为概述；可选「工具：A、B、C」"
        renderPreview={(draft) => <CardPreview {...parseWorkCard(draft)} />}
      >
        <CardPreview
          startDate={work.startDate}
          endDate={work.endDate}
          company={displayCompany}
          position={work.position}
          summary={summary}
          tools={tools}
        />
      </EditableSection>
    </article>
  )
}
