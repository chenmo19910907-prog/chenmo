import { useState } from 'react'
import { useResume } from '../context/ResumeContext'
import TemplateSelector from './TemplateSelector'
import { exportToWord } from '../utils/exportDocx'
import { exportResumeJson, importResumeJson, saveResume } from '../utils/storage'
import { loadResumeTemplateId, saveResumeTemplateId } from '../utils/resumeTemplateStorage'
import type { ResumeTemplateId } from '../templates'

export default function Toolbar() {
  const { resume, setResume, showMessage, handleSave, handleReset, handleRefresh, refreshing, fileInputRef } =
    useResume()
  const [templateId, setTemplateId] = useState<ResumeTemplateId>(() => loadResumeTemplateId())

  const handleTemplateChange = (nextTemplateId: ResumeTemplateId) => {
    setTemplateId(nextTemplateId)
    saveResumeTemplateId(nextTemplateId)
  }

  const handleExportWord = async () => {
    try {
      await exportToWord(resume, { templateId })
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
    <div className="border-b border-slate-200 bg-white">
      <div className="mx-auto max-w-5xl space-y-3 px-4 py-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-slate-800">导出模版</p>
            <p className="text-xs text-slate-500">导出 Word 时使用所选样式</p>
          </div>
          <TemplateSelector layout="compact" value={templateId} onChange={handleTemplateChange} />
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
        <button
          type="button"
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          onClick={handleSave}
        >
          保存
        </button>
        <button
          type="button"
          className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100 disabled:opacity-50"
          onClick={() => void handleRefresh()}
          disabled={refreshing}
        >
          {refreshing ? '更新中…' : '更新'}
        </button>
        <button
          type="button"
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          onClick={() => void handleExportWord()}
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
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          className="hidden"
          onChange={handleImportJson}
        />
        </div>
      </div>
    </div>
  )
}
