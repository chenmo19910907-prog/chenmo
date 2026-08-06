import { Navigate } from 'react-router-dom'
import { useAccessMode } from '../context/AccessModeContext'

export default function LocalOnly({ children }: { children: React.ReactNode }) {
  const { isLocal, loading } = useAccessMode()

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-slate-500">
        加载中…
      </div>
    )
  }

  if (!isLocal) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}
