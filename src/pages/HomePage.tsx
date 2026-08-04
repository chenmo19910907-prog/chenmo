import { Link } from 'react-router-dom'
import { useResume } from '../context/ResumeContext'
import ResumeView from '../components/ResumeView'
import Toolbar from '../components/Toolbar'

export default function HomePage() {
  const { resume } = useResume()

  return (
    <>
      <Toolbar />
      <main className="px-4 py-8">
        <ResumeView resume={resume} />
        <div className="mx-auto mt-6 max-w-3xl text-center">
        <Link
          to="/works/work-3"
          className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-5 py-2.5 text-sm font-medium text-blue-700 hover:bg-blue-100"
        >
          查看核心经历：帧趣科技 →
        </Link>
        <Link
          to="/works"
          className="ml-3 inline-flex items-center gap-2 text-sm text-slate-500 hover:text-blue-600"
        >
          全部工作经历
        </Link>
        </div>
      </main>
    </>
  )
}
