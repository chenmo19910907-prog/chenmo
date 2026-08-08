import { Link, Navigate, useLocation, useNavigate, useParams } from 'react-router-dom'
import WorkDetailContent from '../components/WorkDetailContent'
import { RESTORE_SCROLL_STATE } from '../components/ScrollToTop'
import { useAccessMode } from '../context/AccessModeContext'
import { useResume } from '../context/ResumeContext'
import { replaceWork } from '../utils/workExperience'

export default function WorkListPage() {
  const { id } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const { resume, updateResume } = useResume()
  const { isLocal } = useAccessMode()
  const works = resume.workExperiences
  const fromHome = (location.state as { from?: string } | null)?.from === 'home'

  if (works.length === 0) {
    return (
      <main className="px-4 py-8">
        <p className="text-center text-slate-500">暂无工作经历</p>
      </main>
    )
  }

  const activeId = id && works.some((work) => work.id === id) ? id : works[0].id
  const activeWork = works.find((work) => work.id === activeId)

  if (!id || id !== activeId) {
    return <Navigate to={`/works/${activeId}`} replace state={location.state} />
  }

  const selectTab = (workId: string) => {
    if (workId !== activeId) {
      navigate(`/works/${workId}`)
    }
  }

  if (fromHome && activeWork) {
    return (
      <main className={`px-4 py-8 ${isLocal ? 'overflow-x-visible pr-14' : ''}`}>
        <div className="mx-auto max-w-5xl overflow-visible">
          <Link
            to="/"
            state={RESTORE_SCROLL_STATE}
            className="mb-6 inline-block text-sm text-blue-600 hover:underline"
          >
            ← 返回个人介绍
          </Link>

          <article>
            <WorkDetailContent
              work={activeWork}
              fromHome
              editable={isLocal}
              onWorkChange={(nextWork) =>
                updateResume((current) => replaceWork(current, nextWork))
              }
            />
          </article>
        </div>
      </main>
    )
  }

  return (
    <main className={`px-4 py-8 ${isLocal ? 'overflow-x-visible pr-14' : ''}`}>
      <div className="mx-auto max-w-5xl overflow-visible">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-slate-900">全部经历</h2>
          <p className="mt-2 max-w-2xl text-slate-600">
            切换下方标签查看各段工作的业务背景、职责范围、代表项目与工作成果。
          </p>
        </div>

        <nav
          className="mb-8 flex gap-1 overflow-x-auto rounded-xl border border-slate-200 bg-slate-50 p-1"
          aria-label="工作经历"
        >
          {works.map((work) => {
            const active = work.id === activeId
            const label = work.company
            return (
              <button
                key={work.id}
                type="button"
                onClick={() => selectTab(work.id)}
                className={`shrink-0 whitespace-nowrap rounded-lg px-4 py-2.5 text-sm font-medium transition ${
                  active
                    ? 'bg-white text-blue-700 shadow-sm'
                    : 'text-slate-600 hover:bg-white/60 hover:text-slate-900'
                }`}
              >
                {label}
              </button>
            )
          })}
        </nav>

        {activeWork && (
          <article>
            <WorkDetailContent
              work={activeWork}
              editable={isLocal}
              onWorkChange={(nextWork) =>
                updateResume((current) => replaceWork(current, nextWork))
              }
            />
          </article>
        )}

        <div className="mt-8 text-center">
          <Link
            to="/"
            state={RESTORE_SCROLL_STATE}
            className="text-sm text-blue-600 hover:underline"
          >
            ← 返回个人介绍
          </Link>
        </div>
      </div>
    </main>
  )
}
