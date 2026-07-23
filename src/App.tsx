import { useCallback, useRef, useState } from 'react'
import type { Resume } from './types/resume'
import ResumeEditor from './components/ResumeEditor'
import ResumeView from './components/ResumeView'
import { exportToWord } from './utils/exportDocx'
import {
  exportResumeJson,
  importResumeJson,
  loadResume,
  resetResume,
  saveResume,
} from './utils/storage'

type Tab = 'view' | 'edit'

function App() {
  const [tab, setTab] = useState<Tab>('view')
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

  const handleExportWord = async () => {
    try {
      await exportToWord(resume)
      showMessage('Word 文件已导出')
    } catch (error) {
      console.error('导出 Word 失败:', error)
      showMessage('导出失败，请重试')
    }
  }

  const handleExportJson = () => {
    exportResumeJson(resume)
    showMessage('JSON 文件已导出')
  }

  const handleImportJson = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const imported = await importResumeJson(file)
      setResume(imported)
      saveResume(imported)
      showMessage('JSON 导入成功')
    } catch (error) {
      console.error('导入失败:', error)
      showMessage(error instanceof Error ? error.message : '导入失败')
    }
    e.target.value = ''
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-4 py-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900">陈默 · 工作简历</h1>
            <p className="text-sm text-slate-500">记录、浏览与导出你的职业履历</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex rounded-lg border border-slate-200 bg-slate-50 p-1">
              <button
                type="button"
                className={`rounded-md px-4 py-1.5 text-sm font-medium transition ${
                  tab === 'view'
                    ? 'bg-white text-blue-700 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                onClick={() => setTab('view')}
              >
                浏览
              </button>
              <button
                type="button"
                className={`rounded-md px-4 py-1.5 text-sm font-medium transition ${
                  tab === 'edit'
                    ? 'bg-white text-blue-700 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                onClick={() => setTab('edit')}
              >
                编辑
              </button>
            </div>

            <button
              type="button"
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              onClick={handleSave}
            >
              保存
            </button>
            <button
              type="button"
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              onClick={handleExportWord}
            >
              导出 Word
            </button>
            <button
              type="button"
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              onClick={handleExportJson}
            >
              导出 JSON
            </button>
            <button
              type="button"
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              onClick={() => fileInputRef.current?.click()}
            >
              导入 JSON
            </button>
            <button
              type="button"
              className="rounded-lg px-4 py-2 text-sm font-medium text-slate-500 hover:text-red-600"
              onClick={handleReset}
            >
              重置
            </button>
          </div>
        </div>
      </header>

      {message && (
        <div className="fixed right-4 top-20 z-20 rounded-lg bg-slate-900 px-4 py-2 text-sm text-white shadow-lg">
          {message}
        </div>
      )}

      <main className="px-4 py-8">
        {tab === 'view' ? (
          <ResumeView resume={resume} />
        ) : (
          <ResumeEditor resume={resume} onChange={setResume} />
        )}
      </main>

      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        className="hidden"
        onChange={handleImportJson}
      />
    </div>
  )
}

export default App
