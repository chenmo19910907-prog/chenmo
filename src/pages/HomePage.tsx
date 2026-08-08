import EditableSection from '../components/EditableSection'
import { useAccessMode } from '../context/AccessModeContext'
import { useProfile } from '../context/ProfileContext'
import { useResume } from '../context/ResumeContext'
import WorkExperienceCard from '../components/WorkExperienceCard'
import {
  parseHero,
  parseHighlights,
  paragraphsToText,
  serializeHero,
  serializeHighlights,
  textToParagraphs,
} from '../utils/sectionText'
import { replaceWork } from '../utils/workExperience'

function HeroPreview({
  name,
  title,
  tagline,
  contact,
}: {
  name: string
  title: string
  tagline: string
  contact: { phone?: string; email?: string; location?: string; degree?: string }
}) {
  const items = [
    { label: '电话', value: contact.phone },
    { label: '邮箱', value: contact.email },
    { label: '地点', value: contact.location },
    { label: '学历', value: contact.degree },
  ].filter((item) => item.value)

  return (
    <>
      <p className="text-sm text-blue-200">个人介绍</p>
      <h1 className="mt-2 text-4xl font-bold md:text-5xl">{name}</h1>
      <p className="mt-3 text-xl text-blue-100">{title}</p>
      <p className="mt-4 max-w-2xl text-lg leading-relaxed text-blue-50/90">{tagline}</p>
      {items.length > 0 && (
        <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm text-blue-100/80">
          {items.map((item) => (
            <span key={item.label}>
              {item.label}：{item.value}
            </span>
          ))}
        </div>
      )}
    </>
  )
}

export default function HomePage() {
  const { profile, updateProfile } = useProfile()
  const { resume, updateResume } = useResume()
  const { isLocal } = useAccessMode()

  const works = resume.workExperiences

  const heroDraft = () => serializeHero(profile)
  const aboutDraft = () => paragraphsToText(profile.about)
  const highlightsDraft = () => serializeHighlights(profile.highlights)

  return (
    <main className={`px-4 py-8 ${isLocal ? 'overflow-x-visible pr-14' : ''}`}>
      <div className="mx-auto max-w-5xl space-y-10 overflow-visible">
        <EditableSection
          editable={isLocal}
          title="编辑个人介绍"
          className="rounded-2xl bg-gradient-to-br from-slate-900 to-blue-900 p-8 text-white shadow-xl md:p-12"
          hint="前三行依次为姓名、职位、标语；空行后每行一条联系方式（电话：、邮箱：…）"
          getDraft={heroDraft}
          onSave={(draft) => {
            const parsed = parseHero(draft)
            updateProfile((current) => ({
              ...current,
              name: parsed.name,
              title: parsed.title,
              tagline: parsed.tagline,
              contact: { ...current.contact, ...parsed.contact },
            }))
          }}
          renderPreview={(draft) => <HeroPreview {...parseHero(draft)} />}
        >
          <HeroPreview
            name={profile.name}
            title={profile.title}
            tagline={profile.tagline}
            contact={profile.contact}
          />
        </EditableSection>

        <section className="rounded-2xl bg-white p-8 shadow-lg">
          <h2 className="text-2xl font-bold text-slate-900">关于我</h2>
          <EditableSection
            editable={isLocal}
            title="编辑关于我"
            className="mt-4"
            hint="段落之间用空行分隔"
            getDraft={aboutDraft}
            onSave={(draft) =>
              updateProfile((current) => ({
                ...current,
                about: textToParagraphs(draft),
              }))
            }
            renderPreview={(draft) => (
              <div className="space-y-4 leading-relaxed text-slate-700">
                {textToParagraphs(draft).map((paragraph, index) => (
                  <p key={`preview-about-${index}`}>{paragraph}</p>
                ))}
              </div>
            )}
          >
            <div className="space-y-4 leading-relaxed text-slate-700">
              {profile.about.map((paragraph, index) => (
                <p key={`about-${index}`}>{paragraph}</p>
              ))}
            </div>
          </EditableSection>
        </section>

        <section>
          <h2 className="mb-4 text-2xl font-bold text-slate-900">核心标签</h2>
          <EditableSection
            editable={isLocal}
            title="编辑核心标签"
            hint="每个标签占一块：第一行标题，后续行描述；标签之间用 --- 分隔"
            getDraft={highlightsDraft}
            onSave={(draft) =>
              updateProfile((current) => ({
                ...current,
                highlights: parseHighlights(draft),
              }))
            }
            renderPreview={(draft) => (
              <div className="grid gap-4 md:grid-cols-3">
                {parseHighlights(draft).map((item, index) => (
                  <div
                    key={`preview-highlight-${index}`}
                    className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
                  >
                    <h3 className="font-semibold text-blue-800">{item.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-slate-600">
                      {item.description}
                    </p>
                  </div>
                ))}
              </div>
            )}
          >
            <div className="grid gap-4 md:grid-cols-3">
              {profile.highlights.map((item, index) => (
                <div
                  key={`highlight-${index}`}
                  className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <h3 className="font-semibold text-blue-800">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </EditableSection>
        </section>

        <section>
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-slate-900">工作经历</h2>
            <p className="mt-2 text-slate-600">
              每段经历附有概述，点击「详情」查看完整工作内容、阶段成果与代表项目。
            </p>
          </div>
          <div className="grid gap-5 md:grid-cols-2">
            {works.map((work, index) => (
              <WorkExperienceCard
                key={work.id}
                work={work}
                featured={index === 0}
                editable={isLocal}
                onWorkChange={(nextWork) =>
                  updateResume((current) => replaceWork(current, nextWork))
                }
              />
            ))}
          </div>
        </section>
      </div>
    </main>
  )
}
