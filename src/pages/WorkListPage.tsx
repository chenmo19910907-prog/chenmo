import { Link } from 'react-router-dom'
import { useResume } from '../context/ResumeContext'
import WorkExperienceCard from '../components/WorkExperienceCard'

export default function WorkListPage() {
  const { resume } = useResume()
  const works = [...resume.workExperiences].sort((a, b) => {
    if (a.featured && !b.featured) return -1
    if (!a.featured && b.featured) return 1
    return 0
  })

  return (
    <main className="px-4 py-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-slate-900">工作经历</h2>
          <p className="mt-2 max-w-2xl text-slate-600">
            每段经历都有独立页面，介绍业务背景、职责范围、代表项目与工作成果。点击卡片查看详情。
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          {works.map((work) => (
            <WorkExperienceCard key={work.id} work={work} featured={work.featured} />
          ))}
        </div>

        <div className="mt-8 text-center">
          <Link to="/" className="text-sm text-blue-600 hover:underline">
            ← 返回个人介绍
          </Link>
        </div>
      </div>
    </main>
  )
}
