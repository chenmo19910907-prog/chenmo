import { Link, Navigate, useParams } from 'react-router-dom'
import { useResume } from '../context/ResumeContext'

function DetailSection({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <section className="mb-10">
      <h2 className="mb-4 border-b-2 border-blue-600 pb-2 text-lg font-semibold text-blue-800">
        {title}
      </h2>
      {children}
    </section>
  )
}

export default function WorkDetailPage() {
  const { id } = useParams()
  const { resume } = useResume()
  const work = resume.workExperiences.find((item) => item.id === id)

  if (!work) {
    return <Navigate to="/works" replace />
  }

  const detail = work.detail
  const currentIndex = resume.workExperiences.findIndex((item) => item.id === id)
  const prev = currentIndex > 0 ? resume.workExperiences[currentIndex - 1] : null
  const next =
    currentIndex < resume.workExperiences.length - 1
      ? resume.workExperiences[currentIndex + 1]
      : null

  return (
    <main className="px-4 py-8">
      <article className="mx-auto max-w-3xl">
        <Link
          to="/works"
          className="mb-6 inline-block text-sm text-blue-600 hover:underline"
        >
          ← 全部工作经历
        </Link>

        <header className="rounded-2xl bg-gradient-to-br from-blue-700 to-blue-900 p-8 text-white shadow-lg md:p-10">
          <p className="text-sm text-blue-100">
            {work.startDate} — {work.endDate}
          </p>
          <h1 className="mt-2 text-3xl font-bold md:text-4xl">{work.company}</h1>
          <p className="mt-2 text-lg text-blue-100">{work.position}</p>
          {detail?.tagline && (
            <p className="mt-4 max-w-2xl leading-relaxed text-blue-50">
              {detail.tagline}
            </p>
          )}
          {detail?.teamInfo && (
            <p className="mt-4 inline-block rounded-full bg-white/15 px-4 py-1 text-sm">
              {detail.teamInfo}
            </p>
          )}
        </header>

        <div className="mt-8 rounded-2xl bg-white p-8 shadow-lg md:p-10">
          {detail ? (
            <>
              <DetailSection title="业务背景">
                <p className="leading-relaxed text-slate-700">
                  {detail.businessOverview}
                </p>
                {detail.businessPoints.length > 0 && (
                  <ul className="mt-4 list-disc space-y-2 pl-5 text-slate-700">
                    {detail.businessPoints.map((point) => (
                      <li key={point}>{point}</li>
                    ))}
                  </ul>
                )}
              </DetailSection>

              <DetailSection title="工作职责">
                <ul className="list-disc space-y-2 pl-5 text-slate-700">
                  {detail.responsibilities.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </DetailSection>

              {detail.projects.length > 0 && (
                <DetailSection title="代表项目">
                  <div className="space-y-6">
                    {detail.projects.map((project) => (
                      <div
                        key={project.name}
                        className="rounded-xl border border-slate-200 p-5"
                      >
                        <h3 className="font-semibold text-slate-900">
                          {project.name}
                        </h3>
                        <p className="mt-2 text-slate-700">{project.description}</p>
                        {project.highlights && project.highlights.length > 0 && (
                          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-600">
                            {project.highlights.map((item) => (
                              <li key={item}>{item}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                </DetailSection>
              )}

              <DetailSection title="工作成果">
                <ul className="list-disc space-y-2 pl-5 text-slate-700">
                  {detail.achievements.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </DetailSection>

              {detail.tools.length > 0 && (
                <DetailSection title="使用工具">
                  <div className="flex flex-wrap gap-2">
                    {detail.tools.map((tool) => (
                      <span
                        key={tool}
                        className="rounded-full bg-blue-50 px-3 py-1 text-sm text-blue-700"
                      >
                        {tool}
                      </span>
                    ))}
                  </div>
                </DetailSection>
              )}
            </>
          ) : (
            <>
              <DetailSection title="工作概述">
                <p className="text-slate-700">{work.description}</p>
              </DetailSection>
              {work.highlights.length > 0 && (
                <DetailSection title="工作亮点">
                  <ul className="list-disc space-y-2 pl-5 text-slate-700">
                    {work.highlights.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </DetailSection>
              )}
            </>
          )}
        </div>

        <nav className="mt-8 flex flex-wrap justify-between gap-4 border-t border-slate-200 pt-6">
          {prev ? (
            <Link
              to={`/works/${prev.id}`}
              className="text-sm text-blue-600 hover:underline"
            >
              ← {prev.company}
            </Link>
          ) : (
            <span />
          )}
          {next ? (
            <Link
              to={`/works/${next.id}`}
              className="text-sm text-blue-600 hover:underline"
            >
              {next.company} →
            </Link>
          ) : (
            <span />
          )}
        </nav>
      </article>
    </main>
  )
}
