import EditableSection from './EditableSection'
import { formatWebsiteDisplayUrl } from '../utils/publicSiteUrl'
import type { Resume, WorkExperience } from '../types/resume'
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
} from '../utils/resumeEditText'
import { cleanResumeSummary, normalizeDisplayTitle } from '../utils/cleanResumeSummary'
import { getWorkDisplayCompany } from '../utils/workDisplay'
import { toReadableResumeText, splitSummaryParagraphs } from '../utils/readableResumeText'

interface ResumeViewProps {
  resume: Resume
  editable?: boolean
  onResumeChange?: (resume: Resume) => void
}

const MAX_WORK_HIGHLIGHTS = 5

function Section({
  title,
  children,
  className = '',
}: {
  title: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <section className={`mb-9 last:mb-0 ${className}`}>
      <h2 className="mb-4 border-l-[3px] border-blue-600 pl-3 text-[13px] font-bold uppercase tracking-[0.18em] text-slate-800">
        {title}
      </h2>
      {children}
    </section>
  )
}

function ContactRow({ items }: { items: { label: string; value: string }[] }) {
  if (items.length === 0) return null
  return (
    <div className="mt-4 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[13px] text-slate-500">
      {items.map((item, index) => (
        <span key={item.label} className="inline-flex items-center gap-3">
          {index > 0 && <span className="text-slate-300" aria-hidden>·</span>}
          <span>
            <span className="text-slate-400">{item.label}</span> {item.value}
          </span>
        </span>
      ))}
    </div>
  )
}

function WebsiteCta({ url }: { url?: string }) {
  if (!url?.trim()) return null

  return (
    <p className="mt-3 text-center text-[13px] text-slate-500">
      更多项目与作品见个人主页：
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="ml-1 text-blue-600 underline decoration-blue-200 underline-offset-2 hover:text-blue-700"
      >
        {formatWebsiteDisplayUrl(url)}
      </a>
    </p>
  )
}

function BulletList({ items, className = '' }: { items: string[]; className?: string }) {
  if (items.length === 0) return null
  return (
    <ul className={`space-y-2 ${className}`}>
      {items.map((item, index) => (
        <li key={index} className="flex gap-2.5 text-[14px] leading-relaxed text-slate-600">
          <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500/70" aria-hidden />
          <span>{toReadableResumeText(item)}</span>
        </li>
      ))}
    </ul>
  )
}

function SummaryPreview({ text }: { text: string }) {
  const paragraphs = splitSummaryParagraphs(
    toReadableResumeText(cleanResumeSummary(text)),
  )

  return (
    <div className="space-y-3">
      {paragraphs.map((paragraph, index) => (
        <p key={index} className="text-[14px] leading-relaxed text-slate-600">
          {paragraph}
        </p>
      ))}
    </div>
  )
}

function WorkExperienceBlock({ work }: { work: WorkExperience }) {
  const highlights = work.highlights.slice(0, MAX_WORK_HIGHLIGHTS)
  const roleSummary = work.description?.trim()
    ? toReadableResumeText(work.description.trim())
    : ''

  return (
    <article className="relative border-l border-slate-200 pl-4">
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-[15px] font-semibold text-slate-900">
              {getWorkDisplayCompany(work)}
            </h3>
            {work.featured && (
              <span className="rounded bg-blue-50 px-1.5 py-0.5 text-[11px] font-medium text-blue-700">
                核心
              </span>
            )}
          </div>
          <p className="mt-0.5 text-[13px] text-slate-500">{work.position}</p>
        </div>
        <time className="shrink-0 text-[12px] tabular-nums text-slate-400">
          {work.startDate} — {work.endDate}
        </time>
      </div>

      {roleSummary && (
        <p className="mt-2 text-[14px] leading-relaxed text-slate-600">{roleSummary}</p>
      )}

      {highlights.length > 0 && (
        <div className="mt-2.5">
          <BulletList items={highlights} />
        </div>
      )}
    </article>
  )
}

function WorkListPreview({ resume }: { resume: Resume }) {
  if (resume.workExperiences.length === 0) return null
  return (
    <div className="space-y-7">
      {resume.workExperiences.map((work) => (
        <WorkExperienceBlock key={work.id} work={work} />
      ))}
    </div>
  )
}

function EducationListPreview({ resume }: { resume: Resume }) {
  const educations = visibleEducations(resume.educations)
  if (educations.length === 0) return null
  return (
    <div className="space-y-2">
      {educations.map((edu) => (
        <div
          key={edu.id}
          className="rounded-lg bg-slate-50 px-3 py-2 text-[14px]"
        >
          <span className="font-medium text-slate-800">
            {edu.school}
            {edu.major && <span className="font-normal text-slate-500"> · {edu.major}</span>}
            {edu.degree && <span className="font-normal text-slate-500"> · {edu.degree}</span>}
          </span>
        </div>
      ))}
    </div>
  )
}

function ResumeHeader({ resume }: { resume: Resume }) {
  const { basicInfo } = resume
  const contacts = [
    { label: '电话', value: basicInfo.phone },
    { label: '邮箱', value: basicInfo.email },
    { label: '地点', value: basicInfo.location },
    { label: '学历', value: basicInfo.degree },
  ].filter((item): item is { label: string; value: string } => Boolean(item.value))

  return (
    <header className="border-b border-slate-100 pb-7 text-center">
      <h1 className="text-[28px] font-bold tracking-tight text-slate-900 md:text-[32px]">
        {basicInfo.name}
      </h1>
      <p className="mt-1.5 text-[15px] font-medium text-slate-500">
        {normalizeDisplayTitle(basicInfo.title)}
      </p>
      <ContactRow items={contacts} />
      <WebsiteCta url={basicInfo.website} />
    </header>
  )
}

export default function ResumeView({ resume, editable = false, onResumeChange }: ResumeViewProps) {
  const patchResume = (patch: Partial<Resume>) => {
    onResumeChange?.({ ...resume, ...patch })
  }

  return (
    <article className="mx-auto max-w-[780px] rounded-xl bg-white px-8 py-10 shadow-sm ring-1 ring-slate-200/80 md:px-12 md:py-12">
      <EditableSection
        editable={editable}
        title="编辑基本信息"
        hint="第一行姓名，第二行职位；下方为联系方式，格式「标签：内容」。"
        className="mb-8"
        getDraft={() => serializeResumeBasicInfo(resume.basicInfo)}
        onSave={(draft) =>
          patchResume({ basicInfo: parseResumeBasicInfo(draft, resume.basicInfo) })
        }
        renderPreview={(draft) => (
          <ResumeHeader
            resume={{ ...resume, basicInfo: parseResumeBasicInfo(draft, resume.basicInfo) }}
          />
        )}
      >
        <ResumeHeader resume={resume} />
      </EditableSection>

      <Section title="个人简介">
        <EditableSection
          editable={editable}
          title="编辑个人简介"
          hint="每行一条要点，空行分段；建议涵盖平台能力、履历与核心业绩"
          getDraft={() => resume.summary}
          onSave={(draft) => patchResume({ summary: draft.trim() })}
          renderPreview={(draft) => <SummaryPreview text={draft} />}
        >
          <SummaryPreview text={resume.summary} />
        </EditableSection>
      </Section>

      {resume.workExperiences.length > 0 && (
        <Section title="工作经历">
          <EditableSection
            editable={editable}
            title="编辑工作经历"
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
              />
            )}
          >
            <WorkListPreview resume={resume} />
          </EditableSection>
        </Section>
      )}

      {resume.educations.length > 0 && (editable || visibleEducations(resume.educations).length > 0) && (
        <Section title="学历" className="mt-4">
          <EditableSection
            editable={editable}
            title="编辑学历"
            hint="每行：学校 | 专业 | 学历 | 开始 | 结束；暂不展示的行首加 *（去掉 * 即恢复显示）"
            getDraft={() => serializeResumeEducations(resume.educations)}
            onSave={(draft) =>
              patchResume({
                educations: parseResumeEducations(draft, resume.educations),
              })
            }
            renderPreview={(draft) => (
              <EducationListPreview
                resume={{
                  ...resume,
                  educations: parseResumeEducations(draft, resume.educations),
                }}
              />
            )}
          >
            <EducationListPreview resume={resume} />
          </EditableSection>
        </Section>
      )}

      {resume.selfEvaluation && resume.selfEvaluation.length > 0 && (
        <Section title="自我评价" className="mt-4">
          <EditableSection
            editable={editable}
            title="编辑自我评价"
            hint="每行一条评价。"
            getDraft={() => listToLines(resume.selfEvaluation ?? [])}
            onSave={(draft) => patchResume({ selfEvaluation: linesToList(draft) })}
            renderPreview={(draft) => <BulletList items={linesToList(draft)} className="pl-4" />}
          >
            <BulletList items={resume.selfEvaluation} className="pl-4" />
          </EditableSection>
        </Section>
      )}
    </article>
  )
}
