import { Link } from 'react-router-dom'
import profileData from '../data/profile.json'
import { useAccessMode } from '../context/AccessModeContext'
import { useResume } from '../context/ResumeContext'
import WorkExperienceCard from '../components/WorkExperienceCard'
import type { PersonalProfile } from '../types/profile'

const profile = profileData as PersonalProfile

export default function HomePage() {
  const { resume } = useResume()
  const { isLocal } = useAccessMode()

  const works = [...resume.workExperiences].sort((a, b) => {
    if (a.featured && !b.featured) return -1
    if (!a.featured && b.featured) return 1
    return 0
  })

  const contacts = [
    { label: '电话', value: profile.contact.phone },
    { label: '邮箱', value: profile.contact.email },
    { label: '地点', value: profile.contact.location },
    { label: '学历', value: profile.contact.degree },
  ].filter((item) => item.value)

  return (
    <main className="px-4 py-8">
      <div className="mx-auto max-w-5xl space-y-10">
        {/* 个人介绍 Hero */}
        <section className="rounded-2xl bg-gradient-to-br from-slate-900 to-blue-900 p-8 text-white shadow-xl md:p-12">
          <p className="text-sm text-blue-200">个人介绍</p>
          <h1 className="mt-2 text-4xl font-bold md:text-5xl">{profile.name}</h1>
          <p className="mt-3 text-xl text-blue-100">{profile.title}</p>
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-blue-50/90">
            {profile.tagline}
          </p>
          <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm text-blue-100/80">
            {contacts.map((item) => (
              <span key={item.label}>
                {item.label}：{item.value}
              </span>
            ))}
          </div>
        </section>

        {/* 关于我 */}
        <section className="rounded-2xl bg-white p-8 shadow-lg">
          <h2 className="text-2xl font-bold text-slate-900">关于我</h2>
          <div className="mt-4 space-y-4 leading-relaxed text-slate-700">
            {profile.about.map((paragraph) => (
              <p key={paragraph.slice(0, 24)}>{paragraph}</p>
            ))}
          </div>
        </section>

        {/* 核心标签 */}
        <section className="grid gap-4 md:grid-cols-3">
          {profile.highlights.map((item) => (
            <div
              key={item.title}
              className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <h3 className="font-semibold text-blue-800">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                {item.description}
              </p>
            </div>
          ))}
        </section>

        {/* 本机专属：简历制作入口 */}
        {isLocal && (
          <section className="rounded-2xl border-2 border-dashed border-amber-300 bg-amber-50 p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-amber-900">简历制作（本机专属）</h2>
                <p className="mt-1 text-sm text-amber-800/80">
                  上传招聘截图、粘贴 JD，一键生成定制简历并附外网主页链接
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link
                  to="/resume-maker"
                  className="rounded-lg bg-amber-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-amber-700"
                >
                  制作简历
                </Link>
                <Link
                  to="/resumes"
                  className="rounded-lg border border-amber-400 bg-white px-5 py-2.5 text-sm font-medium text-amber-800 hover:bg-amber-100"
                >
                  已生成列表
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* 工作经历 */}
        <section>
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-slate-900">工作经历</h2>
            <p className="mt-2 text-slate-600">
              每段经历附有概述，点击「详情」查看完整工作内容、阶段成果与代表项目。
            </p>
          </div>
          <div className="grid gap-5 md:grid-cols-2">
            {works.map((work) => (
              <WorkExperienceCard key={work.id} work={work} featured={work.featured} />
            ))}
          </div>
        </section>
      </div>
    </main>
  )
}
