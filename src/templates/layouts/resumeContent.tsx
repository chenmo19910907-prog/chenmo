import EditableSection from '../../components/EditableSection'
import { getResumeAvatarDisplayUrl } from '../../utils/resumeAvatar'
import { formatWebsiteDisplayUrl } from '../../utils/publicSiteUrl'
import { useResumeTheme } from '../ResumeThemeContext'
import type { ResumeLayoutId } from '../types'
import type { Resume, WorkExperience } from '../../types/resume'
import {
  linesToList,
  listToLines,
  parseResumeBasicInfo,
  parseResumeEducations,
  parseResumeWorks,
  serializeResumeBasicInfo,
  serializeResumeEducations,
  serializeResumeWorks,
  visibleEducations,
  getResumeContactItems,
  mergeEducationsPatch,
} from '../../utils/resumeEditText'
import { cleanResumeSummary, normalizeDisplayTitle } from '../../utils/cleanResumeSummary'
import { getWorkDisplayCompany } from '../../utils/workDisplay'
import { toReadableResumeText, splitSummaryParagraphs } from '../../utils/readableResumeText'
import { RESUME_WEBSITE_CTA } from '../../utils/resumeExportStandards'

export const MAX_WORK_HIGHLIGHTS = 5

export interface ResumeContentProps {
  resume: Resume
  editable: boolean
  onResumeChange?: (resume: Resume) => void
}

export function useResumePatch(
  resume: Resume,
  onResumeChange?: (resume: Resume) => void,
) {
  return (patch: Partial<Resume>) => {
    onResumeChange?.({ ...resume, ...patch })
  }
}

export function ContactRow({
  items,
  vertical = false,
}: {
  items: { label: string; value: string }[]
  vertical?: boolean
}) {
  const theme = useResumeTheme()
  if (items.length === 0) return null

  if (vertical) {
    return (
      <div className={theme.contact}>
        {items.map((item) => (
          <p key={item.label} className="flex gap-2">
            <span className={theme.contactLabel}>{item.label}</span>
            <span>{item.value}</span>
          </p>
        ))}
      </div>
    )
  }

  return (
    <div className={theme.contact}>
      {items.map((item, index) => (
        <span key={item.label} className="inline-flex items-center gap-3">
          {index > 0 && <span className={theme.contactDot} aria-hidden>·</span>}
          <span>
            <span className={theme.contactLabel}>{item.label}</span> {item.value}
          </span>
        </span>
      ))}
    </div>
  )
}

export function ResumeAvatar({
  src,
  layout,
}: {
  src: string
  layout: ResumeLayoutId
}) {
  const classByLayout: Record<ResumeLayoutId, string> = {
    standard: 'mx-auto mb-4 h-20 w-20 rounded-full ring-2 ring-slate-100',
    sidebar: 'mb-5 h-24 w-24 rounded-full ring-2 ring-white/20',
    timeline: 'h-[72px] w-[72px] shrink-0 rounded-full ring-2 ring-slate-200',
    magazine: 'mx-auto mb-4 h-[88px] w-[88px] rounded-full border-2 border-amber-200/30',
    executive: 'mx-auto mb-5 h-[88px] w-[88px] rounded-full ring-2 ring-stone-200/80',
    folio: 'mb-5 h-20 w-20 rounded-full ring-2 ring-stone-200',
    ledger: 'mx-auto mb-4 h-[80px] w-[80px] rounded-full border-2 border-white/20',
    atelier: 'mb-5 h-[72px] w-[72px] rounded-full ring-1 ring-stone-300',
  }

  return (
    <img
      src={src}
      alt=""
      className={`object-cover ${classByLayout[layout]}`}
    />
  )
}

export function WebsiteCta({ url }: { url?: string }) {
  const theme = useResumeTheme()
  if (!url?.trim()) return null

  return (
    <p className={`mt-3 text-[13px] ${theme.body}`}>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className={theme.link}
      >
        {RESUME_WEBSITE_CTA}
        {formatWebsiteDisplayUrl(url)}
      </a>
    </p>
  )
}

export function BulletList({ items, className = '' }: { items: string[]; className?: string }) {
  const theme = useResumeTheme()
  if (items.length === 0) return null

  return (
    <ul className={`space-y-2 ${className}`}>
      {items.map((item, index) => (
        <li key={index} className={`flex gap-2.5 ${theme.body}`}>
          <span className={theme.bullet} aria-hidden />
          <span>{toReadableResumeText(item)}</span>
        </li>
      ))}
    </ul>
  )
}

export function SummaryPreview({ text }: { text: string }) {
  const theme = useResumeTheme()
  const paragraphs = splitSummaryParagraphs(
    toReadableResumeText(cleanResumeSummary(text)),
  )

  return (
    <div className="space-y-3">
      {paragraphs.map((paragraph, index) => (
        <p key={index} className={theme.body}>
          {paragraph}
        </p>
      ))}
    </div>
  )
}

export function WorkExperienceBlock({
  work,
  layout,
  isLast = false,
}: {
  work: WorkExperience
  layout: ResumeLayoutId
  isLast?: boolean
}) {
  const theme = useResumeTheme()
  const highlights = work.highlights.slice(0, MAX_WORK_HIGHLIGHTS)
  const roleSummary = work.description?.trim()
    ? toReadableResumeText(work.description.trim())
    : ''

  const header = (
    <div
      className={
        layout === 'timeline'
          ? 'flex flex-col gap-1 md:flex-row md:items-start md:justify-between'
          : 'flex flex-wrap items-start justify-between gap-x-4 gap-y-1'
      }
    >
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className={theme.workCompany}>{getWorkDisplayCompany(work)}</h3>
          {work.featured && <span className={theme.featuredBadge}>核心</span>}
        </div>
        <p className={theme.workPosition}>{work.position}</p>
      </div>
      <time className={theme.workDate}>
        {work.startDate} — {work.endDate}
      </time>
    </div>
  )

  const body = (
    <>
      {roleSummary && <p className={`mt-2 ${theme.body}`}>{roleSummary}</p>}
      {highlights.length > 0 && (
        <div className="mt-2.5">
          <BulletList items={highlights} />
        </div>
      )}
    </>
  )

  if (layout === 'timeline') {
    return (
      <article className={`${theme.workBorder} group`}>
        <span className={theme.timelineDot} aria-hidden />
        {!isLast && <span className={theme.timelineRail} aria-hidden />}
        {header}
        {body}
      </article>
    )
  }

  return (
    <article className={theme.workBorder}>
      {header}
      {body}
    </article>
  )
}

export function WorkListPreview({
  resume,
  layout,
}: {
  resume: Resume
  layout: ResumeLayoutId
}) {
  if (resume.workExperiences.length === 0) return null
  const spacing =
    layout === 'magazine' || layout === 'ledger'
      ? 'space-y-5'
      : layout === 'executive' || layout === 'atelier'
        ? 'space-y-8'
        : 'space-y-7'

  return (
    <div className={spacing}>
      {resume.workExperiences.map((work, index) => (
        <WorkExperienceBlock
          key={work.id}
          work={work}
          layout={layout}
          isLast={index === resume.workExperiences.length - 1}
        />
      ))}
    </div>
  )
}

export function EducationListPreview({
  resume,
  compact = false,
}: {
  resume: Resume
  compact?: boolean
}) {
  const theme = useResumeTheme()
  const educations = visibleEducations(resume.educations)
  if (educations.length === 0) return null

  return (
    <div className={compact ? 'space-y-3' : 'space-y-2'}>
      {educations.map((edu) => (
        <div key={edu.id} className={theme.educationCard}>
          <span className={theme.educationSchool}>
            {edu.school}
            {edu.major && <span className={theme.educationMeta}> · {edu.major}</span>}
            {edu.degree && <span className={theme.educationMeta}> · {edu.degree}</span>}
          </span>
        </div>
      ))}
    </div>
  )
}

export function ResumeHeader({
  resume,
  verticalContact = false,
}: {
  resume: Resume
  verticalContact?: boolean
}) {
  const theme = useResumeTheme()
  const { basicInfo } = resume
  const avatarSrc = getResumeAvatarDisplayUrl(basicInfo)
  const contacts = getResumeContactItems(resume)

  const identity = (
    <>
      <h1 className={theme.name}>{basicInfo.name}</h1>
      <p className={theme.subtitle}>{normalizeDisplayTitle(basicInfo.title)}</p>
    </>
  )

  return (
    <header className={theme.header}>
      {theme.layout === 'timeline' && avatarSrc ? (
        <div className="mb-4 flex items-start gap-5">
          <ResumeAvatar src={avatarSrc} layout="timeline" />
          <div className="min-w-0 flex-1">{identity}</div>
        </div>
      ) : (
        <>
          {avatarSrc && <ResumeAvatar src={avatarSrc} layout={theme.layout} />}
          {identity}
        </>
      )}
      <ContactRow items={contacts} vertical={verticalContact} />
      <WebsiteCta url={basicInfo.website} />
    </header>
  )
}

export function Section({
  title,
  children,
  className = '',
  magazine = false,
  ledger = false,
}: {
  title: string
  children: React.ReactNode
  className?: string
  magazine?: boolean
  ledger?: boolean
}) {
  const theme = useResumeTheme()
  const titleClass = magazine || ledger
    ? (theme.sectionTitleMagazine ?? theme.sectionTitle)
    : theme.sectionTitle

  if (theme.layout === 'executive') {
    return (
      <section className={`mb-10 last:mb-0 ${className}`}>
        <div className="mb-5 flex items-center gap-4">
          <span className="h-px flex-1 bg-stone-300/70" aria-hidden />
          <h2 className={titleClass}>{title}</h2>
          <span className="h-px flex-1 bg-stone-300/70" aria-hidden />
        </div>
        {children}
      </section>
    )
  }

  if (magazine || ledger || theme.layout === 'ledger') {
    return (
      <section className={`mb-10 grid grid-cols-[88px_1fr] gap-x-6 last:mb-0 md:grid-cols-[108px_1fr] md:gap-x-8 ${className}`}>
        <h2 className={titleClass}>{title}</h2>
        <div>{children}</div>
      </section>
    )
  }

  return (
    <section className={`mb-9 last:mb-0 ${className}`}>
      <h2 className={titleClass}>{title}</h2>
      {children}
    </section>
  )
}

export function EditableHeader({
  resume,
  editable,
  patchResume,
  verticalContact = false,
  className = 'mb-8',
  bleed = 8,
}: {
  resume: Resume
  editable: boolean
  patchResume: (patch: Partial<Resume>) => void
  verticalContact?: boolean
  className?: string
  bleed?: number
}) {
  return (
    <EditableSection
      editable={editable}
      title="编辑基本信息"
      bleed={bleed}
      hint="第一行姓名，第二行职位；下方为联系方式，格式「标签：内容」。"
      className={className}
      getDraft={() => serializeResumeBasicInfo(resume.basicInfo)}
      onSave={(draft) =>
        patchResume({ basicInfo: parseResumeBasicInfo(draft, resume.basicInfo) })
      }
      renderPreview={(draft) => (
        <ResumeHeader
          resume={{ ...resume, basicInfo: parseResumeBasicInfo(draft, resume.basicInfo) }}
          verticalContact={verticalContact}
        />
      )}
    >
      <ResumeHeader resume={resume} verticalContact={verticalContact} />
    </EditableSection>
  )
}

export function EditableSummary({
  resume,
  editable,
  patchResume,
  magazine = false,
  ledger = false,
}: {
  resume: Resume
  editable: boolean
  patchResume: (patch: Partial<Resume>) => void
  magazine?: boolean
  ledger?: boolean
}) {
  return (
    <Section title="个人简介" magazine={magazine} ledger={ledger}>
      <EditableSection
        editable={editable}
        title="编辑个人简介"
        bleed={8}
        hint="每行一条要点，空行分段；建议涵盖平台能力、履历与核心业绩"
        getDraft={() => resume.summary}
        onSave={(draft) => patchResume({ summary: draft.trim() })}
        renderPreview={(draft) => <SummaryPreview text={draft} />}
      >
        <SummaryPreview text={resume.summary} />
      </EditableSection>
    </Section>
  )
}

export function EditableWork({
  resume,
  editable,
  patchResume,
  layout,
  magazine = false,
  ledger = false,
}: {
  resume: Resume
  editable: boolean
  patchResume: (patch: Partial<Resume>) => void
  layout: ResumeLayoutId
  magazine?: boolean
  ledger?: boolean
}) {
  if (resume.workExperiences.length === 0) return null

  return (
    <Section title="工作经历" magazine={magazine} ledger={ledger}>
      <EditableSection
        editable={editable}
        title="编辑工作经历"
        bleed={8}
        hint="每条以 ## id | 公司 | 职位 | 开始 | 结束 开头，要点以 - 开头；多条经历之间空一行。"
        getDraft={() => serializeResumeWorks(resume.workExperiences)}
        onSave={(draft) =>
          patchResume({
            workExperiences: parseResumeWorks(draft, resume.workExperiences),
          })
        }
        renderPreview={(draft) => (
          <WorkListPreview
            resume={{
              ...resume,
              workExperiences: parseResumeWorks(draft, resume.workExperiences),
            }}
            layout={layout}
          />
        )}
      >
        <WorkListPreview resume={resume} layout={layout} />
      </EditableSection>
    </Section>
  )
}

export function EditableEducation({
  resume,
  editable,
  patchResume,
  magazine = false,
  ledger = false,
  compact = false,
}: {
  resume: Resume
  editable: boolean
  patchResume: (patch: Partial<Resume>) => void
  magazine?: boolean
  ledger?: boolean
  compact?: boolean
}) {
  if (resume.educations.length === 0) return null
  if (!editable && visibleEducations(resume.educations).length === 0) return null

  return (
    <Section title="学历" className="mt-4" magazine={magazine} ledger={ledger}>
      <EditableSection
        editable={editable}
        title="编辑学历"
        bleed={8}
        hint="每行：学校 | 专业 | 学历 | 开始 | 结束；暂不展示的行首加 *（去掉 * 即恢复显示）"
        getDraft={() => serializeResumeEducations(resume.educations)}
        onSave={(draft) =>
          patchResume(
            mergeEducationsPatch(resume, parseResumeEducations(draft, resume.educations)),
          )
        }
        renderPreview={(draft) => (
          <EducationListPreview
            resume={{
              ...resume,
              educations: parseResumeEducations(draft, resume.educations),
            }}
            compact={compact}
          />
        )}
      >
        <EducationListPreview resume={resume} compact={compact} />
      </EditableSection>
    </Section>
  )
}

export function EditableSelfEvaluation({
  resume,
  editable,
  patchResume,
  magazine = false,
  ledger = false,
}: {
  resume: Resume
  editable: boolean
  patchResume: (patch: Partial<Resume>) => void
  magazine?: boolean
  ledger?: boolean
}) {
  if (!resume.selfEvaluation || resume.selfEvaluation.length === 0) return null

  return (
    <Section title="自我评价" className="mt-4" magazine={magazine} ledger={ledger}>
      <EditableSection
        editable={editable}
        title="编辑自我评价"
        bleed={8}
        hint="每行一条评价。"
        getDraft={() => listToLines(resume.selfEvaluation ?? [])}
        onSave={(draft) => patchResume({ selfEvaluation: linesToList(draft) })}
        renderPreview={(draft) => <BulletList items={linesToList(draft)} className="pl-4" />}
      >
        <BulletList items={resume.selfEvaluation} className="pl-4" />
      </EditableSection>
    </Section>
  )
}
