import { useResume } from '../context/ResumeContext'
import ResumeEditor from '../components/ResumeEditor'
import Toolbar from '../components/Toolbar'

export default function EditPage() {
  const { resume, setResume } = useResume()

  return (
    <>
      <Toolbar />
      <main className="px-4 py-8">
        <ResumeEditor resume={resume} onChange={setResume} />
      </main>
    </>
  )
}
