import { createContext, useCallback, useContext, useRef, useState } from 'react'
import type { Resume } from '../types/resume'
import { loadResume, resetResume, saveResume } from '../utils/storage'

interface ResumeContextValue {
  resume: Resume
  setResume: (resume: Resume) => void
  message: string
  showMessage: (text: string) => void
  handleSave: () => void
  handleReset: () => void
  fileInputRef: React.RefObject<HTMLInputElement | null>
}

const ResumeContext = createContext<ResumeContextValue | null>(null)

export function ResumeProvider({ children }: { children: React.ReactNode }) {
  const [resume, setResume] = useState<Resume>(() => loadResume())
  const [message, setMessage] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const showMessage = useCallback((text: string) => {
    setMessage(text)
    setTimeout(() => setMessage(''), 2500)
  }, [])

  const handleSave = () => {
    saveResume(resume)
    showMessage('已保存到浏览器本地')
  }

  const handleReset = () => {
    if (window.confirm('确定恢复为默认示例数据？当前编辑内容将丢失。')) {
      setResume(resetResume())
      showMessage('已恢复默认数据')
    }
  }

  return (
    <ResumeContext.Provider
      value={{
        resume,
        setResume,
        message,
        showMessage,
        handleSave,
        handleReset,
        fileInputRef,
      }}
    >
      {children}
      {message && (
        <div className="fixed right-4 top-20 z-20 rounded-lg bg-slate-900 px-4 py-2 text-sm text-white shadow-lg">
          {message}
        </div>
      )}
    </ResumeContext.Provider>
  )
}

export function useResume() {
  const ctx = useContext(ResumeContext)
  if (!ctx) throw new Error('useResume must be used within ResumeProvider')
  return ctx
}
