import { Link } from 'react-router-dom'
import type { Resume } from '../types/resume'

interface ResumeViewProps {
  resume: Resume
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

export default function ResumeView({ resume }: ResumeViewProps) {
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
      <header className="mb-8 border-b border-slate-200 pb-8 text-center">
        <h1 className="text-3xl font-bold text-slate-900 md:text-4xl">
          {basicInfo.name}
        </h1>
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

      <Section title="个人简介">
        <p className="leading-relaxed text-slate-700">{resume.summary}</p>
      </Section>

      {resume.workExperiences.length > 0 && (
        <Section title="工作经历">
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
        </Section>
      )}

      {resume.projectExperiences.length > 0 && (
        <Section title="项目经历">
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
        </Section>
      )}

      {resume.educations.length > 0 && (
        <Section title="学历">
          <div className="space-y-2">
            {resume.educations.map((edu) => (
              <div
                key={edu.id}
                className={
                  edu.deemphasized
                    ? 'text-xs text-slate-400'
                    : 'text-sm text-slate-600'
                }
              >
                <span className={edu.deemphasized ? '' : 'font-medium text-slate-800'}>
                  {edu.school}
                </span>
                {edu.major && (
                  <>
                    <span className="mx-1.5 text-slate-400">·</span>
                    <span className={edu.deemphasized ? '' : 'text-slate-700'}>
                      {edu.major}
                    </span>
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
        </Section>
      )}

      {resume.skillGroups.length > 0 && (
        <Section title="专业技能">
          <div className="space-y-3">
            {resume.skillGroups.map((group) => (
              <div key={group.id}>
                <span className="font-medium text-slate-900">
                  {group.category}：
                </span>
                <span className="text-slate-700">{group.items.join('、')}</span>
              </div>
            ))}
          </div>
        </Section>
      )}

      {resume.selfEvaluation && resume.selfEvaluation.length > 0 && (
        <Section title="自我评价">
          <ul className="list-disc space-y-1 pl-5 text-slate-700">
            {resume.selfEvaluation.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        </Section>
      )}
    </article>
  )
}
