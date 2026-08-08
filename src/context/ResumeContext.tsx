import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import type { Resume } from '../types/resume'
import { loadResume, mergeResumeSkillGroups, resetResume, saveResume } from '../utils/storage'
import { shouldSyncWebsite } from '../utils/publicSiteUrl'
import { applyProfileToResume, applyPublicSiteUrl } from '../utils/resumeSync'
import { fetchMasterResume } from '../utils/jobApi'
import { useAccessMode } from './AccessModeContext'

interface ResumeContextValue {
  resume: Resume
  setResume: (resume: Resume) => void
  updateResume: (updater: (resume: Resume) => Resume) => void
  message: string
  showMessage: (text: string) => void
  handleSave: () => void
  handleReset: () => void
  handleRefresh: () => Promise<void>
  refreshing: boolean
  fileInputRef: React.RefObject<HTMLInputElement | null>
}

const ResumeContext = createContext<ResumeContextValue | null>(null)

export function ResumeProvider({ children }: { children: React.ReactNode }) {
  const { publicSiteUrl } = useAccessMode()
  const [resume, setResume] = useState<Resume>(() => loadResume())
  const [message, setMessage] = useState('')
  const [refreshing, setRefreshing] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const showMessage = useCallback((text: string) => {
    setMessage(text)
    setTimeout(() => setMessage(''), 2500)
  }, [])

  useEffect(() => {
    if (!publicSiteUrl) return
    setResume((prev) => {
      if (!shouldSyncWebsite(prev.basicInfo.website, publicSiteUrl)) return prev
      const next = applyPublicSiteUrl(prev, publicSiteUrl, { force: true })
      saveResume(next)
      return next
    })
  }, [publicSiteUrl])

  const handleSave = () => {
    saveResume(resume)
    showMessage('已保存到浏览器本地')
  }

  const updateResume = useCallback((updater: (current: Resume) => Resume) => {
    setResume((prev) => {
      const next = updater(prev)
      saveResume(next)
      return next
    })
  }, [])

  const handleReset = () => {
    if (window.confirm('确定恢复为默认示例数据？当前编辑内容将丢失。')) {
      setResume(resetResume())
      showMessage('已恢复默认数据')
    }
  }

  const handleRefresh = async () => {
    if (
      !window.confirm('将根据最新主简历与个人介绍更新当前内容，未保存的修改将丢失。确定继续？')
    ) {
      return
    }

    setRefreshing(true)
    try {
      const master = await fetchMasterResume()
      const next = applyPublicSiteUrl(
        mergeResumeSkillGroups(applyProfileToResume(master)),
        publicSiteUrl,
        { force: true },
      )
      setResume(next)
      saveResume(next)
      showMessage('已根据最新主简历与个人介绍更新')
    } catch (error) {
      console.error('更新简历失败:', error)
      showMessage(error instanceof Error ? error.message : '更新失败，请重试')
    } finally {
      setRefreshing(false)
    }
  }

  return (
    <ResumeContext.Provider
      value={{
        resume,
        setResume,
        updateResume,
        message,
        showMessage,
        handleSave,
        handleReset,
        handleRefresh,
        refreshing,
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
