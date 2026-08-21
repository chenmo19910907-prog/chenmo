import { useMemo } from 'react'
import EditableSection from './EditableSection'
import { useYaahlanPlatform } from '../hooks/useYaahlanPlatform'
import { useAccessMode } from '../context/AccessModeContext'
import type { WorkDetail, WorkExperience } from '../types/resume'
import {
  linesToList,
  listToLines,
  parseOverviewWithPoints,
  parseProjects,
  parseWorkHeader,
  serializeOverviewWithPoints,
  serializeProjects,
  serializeWorkHeader,
} from '../utils/sectionText'
import { getWorkDisplayCompany } from '../utils/workDisplay'
import { resolveWorkHeaderDisplay } from '../utils/workHeaderDisplay'
import { polishWorkForWeb } from '../utils/polishWorkForWeb'
import { polishWebText } from '../utils/readableResumeText'

const DEFAULT_PLATFORM_SUMMARY =
  '陌陌阶段核心成果：使用 Cursor 从零搭建业务智能工具平台 Agent，聚合知识库、AI 用例生成、造数验收、抓包回归与测试报告能力，供研发、产品、测试全项目使用。'

function PlatformDemoLinks() {
  const { isLocal } = useAccessMode()
  const platformInfo = useYaahlanPlatform()
  const links = platformInfo.demoLinks ?? []
  if (links.length === 0) return null

  return (
    <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-sm font-medium text-slate-800">
        {isLocal ? '本地演示链接' : '在线演示链接'}
        <span className="ml-1 font-normal text-slate-500">（PC 端查看正确排版）</span>
      </p>
      <ul className="mt-3 space-y-3">
        {links.map((link) => (
          <li key={link.url}>
            <a
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block rounded-lg border border-violet-200 bg-white px-4 py-3 transition hover:border-violet-400 hover:shadow-sm"
            >
              <span className="font-medium text-violet-700">{link.label}</span>
              {link.description && (
                <span className="mt-1 block text-sm text-slate-600">{link.description}</span>
              )}
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}

function SectionTitle({ title }: { title: string }) {
  return (
    <h2 className="mb-4 border-b-2 border-blue-600 pb-2 text-lg font-semibold text-blue-800">
      {title}
    </h2>
  )
}

function WorkHeaderView({
  startDate,
  endDate,
  company,
  position,
  tagline,
  teamInfo,
}: {
  startDate: string
  endDate: string
  company: string
  position: string
  tagline?: string
  teamInfo?: string
}) {
  const header = resolveWorkHeaderDisplay({ position, tagline, teamInfo })

  return (
    <>
      <p className="text-sm text-blue-200">
        {startDate} — {endDate}
      </p>
      <h1 className="mt-2 text-3xl font-bold md:text-4xl">{company}</h1>
      <p className="mt-2 text-lg text-blue-100">{position}</p>
      {header.showTagline && (
        <p className="mt-4 max-w-2xl leading-relaxed text-blue-50">{header.tagline}</p>
      )}
      {header.showTeamInfo && (
        <p className="mt-4 inline-block rounded-full bg-white/15 px-4 py-1 text-sm">
          {header.teamInfo}
        </p>
      )}
    </>
  )
}

function BusinessBackgroundView({
  overview,
  points,
}: {
  overview: string
  points: string[]
}) {
  return (
    <>
      <p className="leading-relaxed text-slate-700">{overview}</p>
      {points.length > 0 && (
        <ul className="mt-4 list-disc space-y-2 pl-5 text-slate-700">
          {points.map((point, index) => (
            <li key={`bp-${index}`}>{point}</li>
          ))}
        </ul>
      )}
    </>
  )
}

function ListSectionView({ items, className = 'text-slate-700' }: { items: string[]; className?: string }) {
  return (
    <ul className={`list-disc space-y-2 pl-5 ${className}`}>
      {items.map((item, index) => (
        <li key={`li-${index}`}>{item}</li>
      ))}
    </ul>
  )
}

function ProjectsView({
  projects,
}: {
  projects: { name: string; description: string; highlights?: string[] }[]
}) {
  return (
    <div className="space-y-6">
      {projects.map((project, index) => (
        <div key={`project-${index}`} className="rounded-xl border border-slate-200 p-5">
          <h3 className="font-semibold text-slate-900">{project.name}</h3>
          <p className="mt-2 text-slate-700">{project.description}</p>
          {project.highlights && project.highlights.length > 0 && (
            <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-600">
              {project.highlights.map((item, hi) => (
                <li key={`ph-${index}-${hi}`}>{item}</li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </div>
  )
}

interface WorkDetailContentProps {
  work: WorkExperience
  editable?: boolean
  onWorkChange?: (work: WorkExperience) => void
  /** 从个人介绍进入时保留（历史参数，当前未使用） */
  fromHome?: boolean
}

export default function WorkDetailContent({
  work,
  editable = false,
  onWorkChange,
}: WorkDetailContentProps) {
  const displayWork = useMemo(() => polishWorkForWeb(work), [work])
  const detail = displayWork.detail
  const canEdit = editable && !!onWorkChange

  const updateWork = (updater: (current: WorkExperience) => WorkExperience) => {
    onWorkChange?.(updater(work))
  }

  const updateDetail = (updater: (current: WorkDetail) => WorkDetail) => {
    if (!detail) return
    updateWork((current) => ({
      ...current,
      detail: updater(current.detail!),
    }))
  }

  const platformSummary = detail?.platformAgentSummary ?? polishWebText(DEFAULT_PLATFORM_SUMMARY)
  const displayCompany = getWorkDisplayCompany(work)

  return (
    <>
      <section className="overflow-visible rounded-2xl bg-gradient-to-br from-blue-700 to-blue-900 p-8 text-white shadow-lg md:p-10">
        <EditableSection
          editable={canEdit}
          title="编辑工作概要"
          bleed={8}
          hint="第一块三行：时间、公司、职位；后续块依次为标语、团队信息"
          getDraft={() =>
          serializeWorkHeader({
            startDate: work.startDate,
            endDate: work.endDate,
            company: displayCompany,
            position: work.position,
            tagline: detail?.tagline,
            teamInfo: detail?.teamInfo,
          })
        }
        onSave={(draft) => {
          const parsed = parseWorkHeader(draft)
          updateWork((current) => ({
            ...current,
            startDate: parsed.startDate,
            endDate: parsed.endDate,
            displayCompany: parsed.company,
            position: parsed.position,
            detail: current.detail
              ? {
                  ...current.detail,
                  tagline: parsed.tagline || current.detail.tagline,
                  teamInfo: parsed.teamInfo || current.detail.teamInfo,
                }
              : current.detail,
          }))
        }}
        renderPreview={(draft) => {
          const parsed = parseWorkHeader(draft)
          return (
            <WorkHeaderView
              startDate={parsed.startDate}
              endDate={parsed.endDate}
              company={parsed.company}
              position={parsed.position}
              tagline={parsed.tagline}
              teamInfo={parsed.teamInfo}
            />
          )
        }}
      >
        <WorkHeaderView
          startDate={work.startDate}
          endDate={work.endDate}
          company={displayCompany}
          position={work.position}
          tagline={detail?.tagline}
          teamInfo={detail?.teamInfo}
        />
        </EditableSection>
      </section>

      <div className="mt-8 overflow-visible rounded-2xl bg-white p-8 shadow-lg md:p-10">
        {detail ? (
          <>
            <section className="mb-10">
              <SectionTitle title="业务背景" />
              <EditableSection
                editable={canEdit}
                title="编辑业务背景"
                bleed={8}
                hint="概述与要点列表用 --- 分隔；要点每行一条"
                getDraft={() =>
                  serializeOverviewWithPoints(detail.businessOverview, detail.businessPoints)
                }
                onSave={(draft) => {
                  const parsed = parseOverviewWithPoints(draft)
                  updateDetail((current) => ({
                    ...current,
                    businessOverview: parsed.overview,
                    businessPoints: parsed.points,
                  }))
                }}
                renderPreview={(draft) => {
                  const parsed = parseOverviewWithPoints(draft)
                  return (
                    <BusinessBackgroundView
                      overview={parsed.overview}
                      points={parsed.points}
                    />
                  )
                }}
              >
                <BusinessBackgroundView
                  overview={detail.businessOverview}
                  points={detail.businessPoints}
                />
              </EditableSection>
            </section>

            <section className="mb-10">
              <SectionTitle title="工作职责" />
              <EditableSection
                editable={canEdit}
                title="编辑工作职责"
                bleed={8}
                hint="每行一条职责"
                getDraft={() => listToLines(detail.responsibilities)}
                onSave={(draft) =>
                  updateDetail((current) => ({
                    ...current,
                    responsibilities: linesToList(draft),
                  }))
                }
                renderPreview={(draft) => (
                  <ListSectionView items={linesToList(draft)} />
                )}
              >
                <ListSectionView items={detail.responsibilities} />
              </EditableSection>
            </section>

            {detail.projects.length > 0 && (
              <section className="mb-10">
                <SectionTitle title="代表项目" />
                <EditableSection
                  editable={canEdit}
                  title="编辑代表项目"
                  bleed={8}
                  hint="每个项目以 ## 标题 开头；描述下方用 - 开头写亮点"
                  getDraft={() => serializeProjects(detail.projects)}
                  onSave={(draft) =>
                    updateDetail((current) => ({
                      ...current,
                      projects: parseProjects(draft),
                    }))
                  }
                  renderPreview={(draft) => (
                    <ProjectsView projects={parseProjects(draft)} />
                  )}
                >
                  <ProjectsView projects={detail.projects} />
                </EditableSection>
              </section>
            )}

            <section className="mb-10">
              <SectionTitle title="工作成果" />
              <EditableSection
                editable={canEdit}
                title="编辑工作成果"
                bleed={8}
                hint="每行一条成果"
                getDraft={() => listToLines(detail.achievements)}
                onSave={(draft) =>
                  updateDetail((current) => ({
                    ...current,
                    achievements: linesToList(draft),
                  }))
                }
                renderPreview={(draft) => (
                  <ListSectionView items={linesToList(draft)} />
                )}
              >
                <ListSectionView items={detail.achievements} />
              </EditableSection>
            </section>

            {work.id === 'work-0' && (
              <section className="mb-10 last:mb-0">
                <SectionTitle title="Yaahlan 智能工具平台 Agent" />
                <EditableSection
                  editable={canEdit}
                  title="编辑平台介绍"
                  bleed={8}
                  hint="平台介绍段落"
                  getDraft={() => platformSummary}
                  onSave={(draft) =>
                    updateDetail((current) => ({
                      ...current,
                      platformAgentSummary: draft.trim(),
                    }))
                  }
                  renderPreview={(draft) => (
                    <p className="leading-relaxed text-slate-700">{polishWebText(draft.trim())}</p>
                  )}
                >
                  <p className="leading-relaxed text-slate-700">{platformSummary}</p>
                </EditableSection>
                <PlatformDemoLinks />
              </section>
            )}
          </>
        ) : (
          <>
            <section className="mb-10">
              <SectionTitle title="工作概述" />
              <EditableSection
                editable={canEdit}
                title="编辑工作概述"
                bleed={8}
                getDraft={() => work.description}
                onSave={(draft) =>
                  updateWork((current) => ({ ...current, description: draft.trim() }))
                }
                renderPreview={(draft) => (
                  <p className="text-slate-700">{polishWebText(draft.trim())}</p>
                )}
              >
                <p className="text-slate-700">{displayWork.description}</p>
              </EditableSection>
            </section>

            {displayWork.highlights.length > 0 && (
              <section className="mb-10 last:mb-0">
                <SectionTitle title="工作亮点" />
                <EditableSection
                  editable={canEdit}
                  title="编辑工作亮点"
                  bleed={8}
                  hint="每行一条亮点"
                  getDraft={() => listToLines(work.highlights)}
                  onSave={(draft) =>
                    updateWork((current) => ({
                      ...current,
                      highlights: linesToList(draft),
                    }))
                  }
                  renderPreview={(draft) => (
                    <ListSectionView items={linesToList(draft).map(polishWebText)} />
                  )}
                >
                  <ListSectionView items={displayWork.highlights} />
                </EditableSection>
              </section>
            )}
          </>
        )}
      </div>
    </>
  )
}
