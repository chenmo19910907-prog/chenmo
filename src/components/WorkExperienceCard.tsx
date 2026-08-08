import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import EditableSection from './EditableSection'
import type { WorkExperience } from '../types/resume'
import { parseWorkCard, serializeWorkCard } from '../utils/sectionText'
import { getWorkDisplayCompany } from '../utils/workDisplay'
import { getWorkCardSummary } from '../utils/workWebDisplay'
import { polishWorkForWeb } from '../utils/polishWorkForWeb'

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
  highlights,
}: {
  startDate: string
  endDate: string
  company: string
  position: string
  summary: string
  highlights: string[]
}) {
  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="text-xl font-bold text-slate-900">{company}</h3>
          <p className="mt-1 text-slate-600">{position}</p>
        </div>
        <time className="shrink-0 text-xs tabular-nums text-slate-400">
          {startDate} — {endDate}
        </time>
      </div>
      <p className="mt-4 text-sm leading-relaxed text-slate-700">{summary}</p>
      {highlights.length > 0 && (
        <ul className="mt-3 space-y-1.5 border-l-2 border-blue-100 pl-3 text-sm leading-relaxed text-slate-600">
          {highlights.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
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
  const displayWork = useMemo(() => polishWorkForWeb(work), [work])
  const summary = getWorkCardSummary(displayWork)
  const previewHighlights = displayWork.highlights.slice(0, featured ? 3 : 2)
  const canEdit = editable && !!onWorkChange
  const displayCompany = getWorkDisplayCompany(work)

  const getDraft = () =>
    serializeWorkCard({
      startDate: work.startDate,
      endDate: work.endDate,
      company: displayCompany,
      position: work.position,
      summary,
      tools: [],
    })

  const applyDraft = (draft: string) => {
    const parsed = parseWorkCard(draft)
    onWorkChange?.({
      ...work,
      startDate: parsed.startDate,
      endDate: parsed.endDate,
      displayCompany: parsed.company,
      position: parsed.position,
      description: parsed.summary,
    })
  }

  return (
    <article
      className={`group relative overflow-visible rounded-2xl border bg-white p-6 pb-14 shadow-sm transition hover:border-blue-200 hover:shadow-md ${
        featured ? 'border-blue-300 ring-2 ring-blue-100 md:col-span-2' : 'border-slate-200'
      }`}
    >
      <EditableSection
        editable={canEdit}
        title={`编辑 ${displayCompany}`}
        getDraft={getDraft}
        onSave={applyDraft}
        hint="依次为时间、公司、职位；空行后为卡片概述（可多段）"
        renderPreview={(draft) => <CardPreview {...parseWorkCard(draft)} highlights={[]} />}
      >
        <CardPreview
          startDate={work.startDate}
          endDate={work.endDate}
          company={displayCompany}
          position={work.position}
          summary={summary}
          highlights={previewHighlights}
        />
      </EditableSection>

      <Link
        to={`/works/${work.id}`}
        state={{ from: 'home' }}
        className="absolute bottom-6 right-6 rounded-full bg-blue-600 px-4 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
      >
        详情
      </Link>
    </article>
  )
}
