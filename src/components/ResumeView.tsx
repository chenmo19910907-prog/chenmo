import { Link } from 'react-router-dom'
import EditableSection from './EditableSection'
import type { Resume } from '../types/resume'
import {
  linesToList,
  listToLines,
  parseResumeBasicInfo,
  parseResumeEducations,
  parseResumeProjects,
  parseResumeSkillGroups,
  parseResumeWorks,
  serializeResumeBasicInfo,
  serializeResumeEducations,
  serializeResumeProjects,
  serializeResumeSkillGroups,
  serializeResumeWorks,
} from '../utils/resumeEditText'

interface ResumeViewProps {
  resume: Resume
  editable?: boolean
  onResumeChange?: (resume: Resume) => void
}

function Section({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <section className="mb-8">
      <h2 className="mb-4 border-b-2 border-blue-600 pb-2 text-lg font-semibold text-blue-800">
        {title}
      </h2>
      {children}
    </section>
  )
}

function BasicInfoPreview({ resume }: { resume: Resume }) {
  const { basicInfo } = resume
  const contacts = [
    { label: '电话', value: basicInfo.phone },
    { label: '邮箱', value: basicInfo.email },
    { label: '地点', value: basicInfo.location },
    { label: '学历', value: basicInfo.degree },
    { label: '网站', value: basicInfo.website, href: basicInfo.website },
  ].filter((item) => item.value)

  return (
    <header className="border-b border-slate-200 pb-4 text-center">
      <h1 className="text-2xl font-bold text-slate-900">{basicInfo.name}</h1>
      <p className="mt-1 text-slate-600">{basicInfo.title}</p>
      <div className="mt-3 flex flex-wrap justify-center gap-x-3 gap-y-1 text-sm text-slate-500">
        {contacts.map((item) =>
          item.href ? (
            <span key={item.label}>
              {item.label}：{item.value}
            </span>
          ) : (
            <span key={item.label}>
              {item.label}：{item.value}
            </span>
          ),
        )}
      </div>
    </header>
  )
}

function WorkListPreview({ resume, withLinks }: { resume: Resume; withLinks?: boolean }) {
  if (resume.workExperiences.length === 0) return null
  return (
    <div className="space-y-4">
      {resume.workExperiences.map((work) => (
        <div key={work.id}>
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h3 className="font-semibold text-slate-900">
              {withLinks ? (
                <span className="text-blue-700">{work.company}</span>
              ) : (
                work.company
              )}
              {work.featured && (
                <span className="ml-2 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                  核心经历
                </span>
              )}
              <span className="mx-2 text-slate-400">·</span>
              {work.position}
            </h3>
            <span className="text-sm text-slate-500">
              {work.startDate} - {work.endDate}
            </span>
          </div>
          <p className="mt-1 text-slate-700">{work.description}</p>
          {work.highlights.length > 0 && (
            <ul className="mt-1 list-disc space-y-0.5 pl-5 text-slate-700">
              {work.highlights.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </div>
  )
}

function ProjectListPreview({ resume }: { resume: Resume }) {
  if (resume.projectExperiences.length === 0) return null
  return (
    <div className="space-y-4">
      {resume.projectExperiences.map((project) => (
        <div key={project.id}>
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h3 className="font-semibold text-slate-900">
              {project.name}
              <span className="mx-2 text-slate-400">·</span>
              {project.role}
            </h3>
            <span className="text-sm text-slate-500">
              {project.startDate} - {project.endDate}
            </span>
          </div>
          <p className="mt-1 text-slate-700">{project.description}</p>
          {project.techStack.length > 0 && (
            <div className="mt-1 flex flex-wrap gap-1">
              {project.techStack.map((tech) => (
                <span
                  key={tech}
                  className="rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-700"
                >
                  {tech}
                </span>
              ))}
            </div>
          )}
          {project.highlights.length > 0 && (
            <ul className="mt-1 list-disc space-y-0.5 pl-5 text-slate-700">
              {project.highlights.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </div>
  )
}

function EducationListPreview({ resume }: { resume: Resume }) {
  if (resume.educations.length === 0) return null
  return (
    <div className="space-y-1">
      {resume.educations.map((edu) => (
        <div
          key={edu.id}
          className={edu.deemphasized ? 'text-xs text-slate-400' : 'text-sm text-slate-600'}
        >
          <span className={edu.deemphasized ? '' : 'font-medium text-slate-800'}>
            {edu.school}
          </span>
          {edu.major && (
            <>
              <span className="mx-1.5 text-slate-400">·</span>
              <span>{edu.major}</span>
            </>
          )}
          {(edu.startDate || edu.endDate) && (
            <span className="ml-2 text-slate-400">
              {edu.startDate}
              {edu.startDate && edu.endDate && ' - '}
              {edu.endDate}
            </span>
          )}
        </div>
      ))}
    </div>
  )
}

function SkillListPreview({ resume }: { resume: Resume }) {
  if (resume.skillGroups.length === 0) return null
  return (
    <div className="space-y-2">
      {resume.skillGroups.map((group) => (
        <div key={group.id}>
          <span className="font-medium text-slate-900">{group.category}：</span>
          <span className="text-slate-700">{group.items.join('、')}</span>
        </div>
      ))}
    </div>
  )
}

export default function ResumeView({ resume, editable = false, onResumeChange }: ResumeViewProps) {
  const patchResume = (patch: Partial<Resume>) => {
    onResumeChange?.({ ...resume, ...patch })
  }

  const { basicInfo } = resume
  const contacts = [
    { label: '电话', value: basicInfo.phone },
    { label: '邮箱', value: basicInfo.email },
    { label: '地点', value: basicInfo.location },
    { label: '学历', value: basicInfo.degree },
    { label: '网站', value: basicInfo.website, href: basicInfo.website },
  ].filter((item) => item.value)

  return (
    <article className="mx-auto max-w-3xl rounded-2xl bg-white p-8 shadow-lg md:p-12">
      <EditableSection
        editable={editable}
        title="编辑基本信息"
        hint="第一行姓名，第二行职位；下方为联系方式，格式「标签：内容」。"
        getDraft={() => serializeResumeBasicInfo(resume.basicInfo)}
        onSave={(draft) =>
          patchResume({ basicInfo: parseResumeBasicInfo(draft, resume.basicInfo) })
        }
        renderPreview={(draft) => (
          <BasicInfoPreview
            resume={{ ...resume, basicInfo: parseResumeBasicInfo(draft, resume.basicInfo) }}
          />
        )}
      >
        <header className="mb-8 border-b border-slate-200 pb-8 text-center">
          <h1 className="text-3xl font-bold text-slate-900 md:text-4xl">{basicInfo.name}</h1>
          <p className="mt-2 text-lg text-slate-600">{basicInfo.title}</p>
          <div className="mt-4 flex flex-wrap justify-center gap-x-4 gap-y-2 text-sm text-slate-500">
            {contacts.map((item) =>
              item.href ? (
                <a
                  key={item.label}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-blue-600 hover:underline"
                >
                  {item.label}：{item.value}
                </a>
              ) : (
                <span key={item.label}>
                  {item.label}：{item.value}
                </span>
              ),
            )}
          </div>
        </header>
      </EditableSection>

      <Section title="个人简介">
        <EditableSection
          editable={editable}
          title="编辑个人简介"
          getDraft={() => resume.summary}
          onSave={(draft) => patchResume({ summary: draft.trim() })}
          renderPreview={(draft) => (
            <p className="leading-relaxed text-slate-700">{draft}</p>
          )}
        >
          <p className="leading-relaxed text-slate-700">{resume.summary}</p>
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
            <div className="space-y-6">
              {resume.workExperiences.map((work) => (
                <div key={work.id}>
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <h3 className="font-semibold text-slate-900">
                      <Link
                        to={`/works/${work.id}`}
                        className="hover:text-blue-700 hover:underline"
                      >
                        {work.company}
                      </Link>
                      {work.featured && (
                        <span className="ml-2 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                          核心经历
                        </span>
                      )}
                      <span className="mx-2 text-slate-400">·</span>
                      {work.position}
                    </h3>
                    <span className="text-sm text-slate-500">
                      {work.startDate} - {work.endDate}
                    </span>
                  </div>
                  <p className="mt-2 text-slate-700">{work.description}</p>
                  {work.highlights.length > 0 && (
                    <ul className="mt-2 list-disc space-y-1 pl-5 text-slate-700">
                      {work.highlights.map((item, index) => (
                        <li key={index}>{item}</li>
                      ))}
                    </ul>
                  )}
                  <Link
                    to={`/works/${work.id}`}
                    className="mt-2 inline-block text-sm text-blue-600 hover:underline"
                  >
                    查看详细介绍 →
                  </Link>
                </div>
              ))}
            </div>
          </EditableSection>
        </Section>
      )}

      {resume.projectExperiences.length > 0 && (
        <Section title="项目经历">
          <EditableSection
            editable={editable}
            title="编辑项目经历"
            hint="每条以 ## id | 项目名 | 角色 | 开始 | 结束 开头；技术栈一行「技术：a、b」；要点以 - 开头。"
            getDraft={() => serializeResumeProjects(resume.projectExperiences)}
            onSave={(draft) =>
              patchResume({
                projectExperiences: parseResumeProjects(draft, resume.projectExperiences),
              })
            }
            renderPreview={(draft) => (
              <ProjectListPreview
                resume={{
                  ...resume,
                  projectExperiences: parseResumeProjects(draft, resume.projectExperiences),
                }}
              />
            )}
          >
            <div className="space-y-6">
              {resume.projectExperiences.map((project) => (
                <div key={project.id}>
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <h3 className="font-semibold text-slate-900">
                      {project.name}
                      <span className="mx-2 text-slate-400">·</span>
                      {project.role}
                    </h3>
                    <span className="text-sm text-slate-500">
                      {project.startDate} - {project.endDate}
                    </span>
                  </div>
                  <p className="mt-2 text-slate-700">{project.description}</p>
                  {project.techStack.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {project.techStack.map((tech) => (
                        <span
                          key={tech}
                          className="rounded-full bg-blue-50 px-3 py-0.5 text-xs text-blue-700"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                  )}
                  {project.highlights.length > 0 && (
                    <ul className="mt-2 list-disc space-y-1 pl-5 text-slate-700">
                      {project.highlights.map((item, index) => (
                        <li key={index}>{item}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </EditableSection>
        </Section>
      )}

      {resume.educations.length > 0 && (
        <Section title="学历">
          <EditableSection
            editable={editable}
            title="编辑学历"
            hint="每行：学校 | 专业 | 学历 | 开始 | 结束；弱化展示的行首加 * "
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

      {resume.skillGroups.length > 0 && (
        <Section title="专业技能">
          <EditableSection
            editable={editable}
            title="编辑专业技能"
            hint="每组第一行分类名，第二行技能项用顿号分隔；多组之间用 --- 分隔。"
            getDraft={() => serializeResumeSkillGroups(resume.skillGroups)}
            onSave={(draft) =>
              patchResume({
                skillGroups: parseResumeSkillGroups(draft, resume.skillGroups),
              })
            }
            renderPreview={(draft) => (
              <SkillListPreview
                resume={{
                  ...resume,
                  skillGroups: parseResumeSkillGroups(draft, resume.skillGroups),
                }}
              />
            )}
          >
            <SkillListPreview resume={resume} />
          </EditableSection>
        </Section>
      )}

      {resume.selfEvaluation && resume.selfEvaluation.length > 0 && (
        <Section title="自我评价">
          <EditableSection
            editable={editable}
            title="编辑自我评价"
            hint="每行一条评价。"
            getDraft={() => listToLines(resume.selfEvaluation ?? [])}
            onSave={(draft) => patchResume({ selfEvaluation: linesToList(draft) })}
            renderPreview={(draft) => (
              <ul className="list-disc space-y-1 pl-5 text-slate-700">
                {linesToList(draft).map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            )}
          >
            <ul className="list-disc space-y-1 pl-5 text-slate-700">
              {resume.selfEvaluation.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </EditableSection>
        </Section>
      )}
    </article>
  )
}
