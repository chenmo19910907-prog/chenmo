import EditableSection from '../components/EditableSection'
import { useAccessMode } from '../context/AccessModeContext'
import { useProfile } from '../context/ProfileContext'
import { useResume } from '../context/ResumeContext'
import WorkExperienceCard from '../components/WorkExperienceCard'
import type { SkillGroup } from '../types/resume'
import {
  parseHero,
  parseLifeSection,
  paragraphsToText,
  serializeHero,
  serializeLifeSection,
  textToParagraphs,
} from '../utils/sectionText'
import {
  parseResumeSkillGroups,
  serializeResumeSkillGroups,
} from '../utils/resumeEditText'
import { replaceWork } from '../utils/workExperience'
import { polishWebText } from '../utils/readableResumeText'
import type { ProfileHighlight } from '../types/profile'

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
      <p className="mt-4 max-w-2xl text-lg leading-relaxed text-blue-50/90">
        {polishWebText(tagline)}
      </p>
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

function ProfileHighlights({ items }: { items: ProfileHighlight[] }) {
  if (items.length === 0) return null

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {items.map((item) => (
        <div
          key={item.title}
          className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <h3 className="font-semibold text-blue-800">{item.title}</h3>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">{polishWebText(item.description)}</p>
        </div>
      ))}
    </div>
  )
}

function SkillGroupsPreview({ groups }: { groups: SkillGroup[] }) {
  if (groups.length === 0) return null

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {groups.map((group) => (
        <div
          key={group.id}
          className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <h3 className="font-semibold text-blue-800">{group.category}</h3>
          <div className="mt-3 flex flex-wrap gap-2">
            {group.items.map((item) => (
              <span
                key={item}
                className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-700"
              >
                {polishWebText(item)}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function LifeSectionPreview({
  hobbies,
  lifeAbout,
}: {
  hobbies: string[]
  lifeAbout: string
}) {
  return (
    <div className="space-y-4">
      {hobbies.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {hobbies.map((hobby) => (
            <span
              key={hobby}
              className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700"
            >
              {hobby}
            </span>
          ))}
        </div>
      )}
      {lifeAbout && <p className="leading-relaxed text-slate-600">{polishWebText(lifeAbout)}</p>}
    </div>
  )
}

const HIDDEN_HOME_SKILL_IDS = new Set(['skill-2', 'skill-6'])
const SECTION_HEADING = 'text-2xl font-bold text-slate-900'
/** 仅标题左内边距；卡片/网格保持全宽不缩进 */
const SECTION_HEADING_INSET = 'pl-3 md:pl-4 text-2xl font-bold text-slate-900'

export default function HomePage() {
  const { profile, updateProfile } = useProfile()
  const { resume, updateResume } = useResume()
  const { isLocal } = useAccessMode()

  const works = resume.workExperiences
  const webSkillGroups = resume.skillGroups.filter(
    (group) => !HIDDEN_HOME_SKILL_IDS.has(group.id),
  )

  const heroDraft = () => serializeHero(profile)
  const aboutDraft = () => paragraphsToText(profile.about)
  const skillsDraft = () => serializeResumeSkillGroups(resume.skillGroups)
  const lifeDraft = () =>
    serializeLifeSection({
      hobbies: profile.hobbies ?? [],
      lifeAbout: profile.lifeAbout,
    })

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
          <h2 className={SECTION_HEADING}>关于我</h2>
          <EditableSection
            editable={isLocal}
            title="编辑关于我"
            className="mt-4"
            hint="每行一条要点，空行分段；建议涵盖平台能力、履历与核心业绩"
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
                  <p key={`preview-about-${index}`}>{polishWebText(paragraph)}</p>
                ))}
              </div>
            )}
          >
            <div className="space-y-4 leading-relaxed text-slate-700">
              {profile.about.map((paragraph, index) => (
                <p key={`about-${index}`}>{polishWebText(paragraph)}</p>
              ))}
            </div>
          </EditableSection>
        </section>

        {profile.highlights.length > 0 && (
          <section>
            <h2 className={`mb-6 ${SECTION_HEADING_INSET}`}>核心能力</h2>
            <ProfileHighlights items={profile.highlights} />
          </section>
        )}

        <section>
          <h2 className={`mb-6 ${SECTION_HEADING_INSET}`}>工作经历</h2>
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

        {webSkillGroups.length > 0 && (
          <section>
            <h2 className={`mb-6 ${SECTION_HEADING_INSET}`}>专业技能</h2>
            <EditableSection
              editable={isLocal}
              title="编辑专业技能"
              hint="每组第一行分类名，第二行技能项用顿号分隔；多组之间用 --- 分隔。"
              getDraft={skillsDraft}
              onSave={(draft) =>
                updateResume((current) => ({
                  ...current,
                  skillGroups: parseResumeSkillGroups(draft, current.skillGroups),
                }))
              }
              renderPreview={(draft) => (
                <SkillGroupsPreview
                  groups={parseResumeSkillGroups(draft, resume.skillGroups).filter(
                    (group) => !HIDDEN_HOME_SKILL_IDS.has(group.id),
                  )}
                />
              )}
            >
              <SkillGroupsPreview groups={webSkillGroups} />
            </EditableSection>
          </section>
        )}

        <section className="rounded-2xl bg-white p-8 shadow-lg">
          <h2 className={SECTION_HEADING}>生活与兴趣</h2>
          <EditableSection
            editable={isLocal}
            title="编辑生活与兴趣"
            className="mt-4"
            hint="第一行写爱好：摄影、游戏（逗号分隔）；空行后可写一段生活描述"
            getDraft={lifeDraft}
            onSave={(draft) => {
              const parsed = parseLifeSection(draft)
              updateProfile((current) => ({
                ...current,
                hobbies: parsed.hobbies,
                lifeAbout: parsed.lifeAbout,
              }))
            }}
            renderPreview={(draft) => <LifeSectionPreview {...parseLifeSection(draft)} />}
          >
            <LifeSectionPreview
              hobbies={profile.hobbies ?? []}
              lifeAbout={profile.lifeAbout ?? ''}
            />
          </EditableSection>
        </section>
      </div>
    </main>
  )
}
