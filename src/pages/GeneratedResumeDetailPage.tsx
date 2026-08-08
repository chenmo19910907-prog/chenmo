import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import EditableSection from '../components/EditableSection'
import ResumeView from '../components/ResumeView'
import { exportToWord } from '../utils/exportDocx'
import { fetchVariantById, updateVariant } from '../utils/jobApi'
import { getResumePublicUrl } from '../utils/accessMode'
import { parseVariantMeta, serializeVariantMeta } from '../utils/resumeEditText'
import type { Resume } from '../types/resume'
import type { ResumeVariant } from '../types/job'

export default function GeneratedResumeDetailPage() {
  const { id } = useParams()
  const [variant, setVariant] = useState<ResumeVariant | null>(null)
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    void (async () => {
      try {
        const data = await fetchVariantById(id)
        setVariant(data)
      } finally {
        setLoading(false)
      }
    })()
  }, [id])

  const persistVariant = async (
    patch: Partial<Pick<ResumeVariant, 'resume' | 'company' | 'jobTitle' | 'jdSummary'>>,
  ) => {
    if (!id) return
    setSaving(true)
    setSaveError(null)
    try {
      const updated = await updateVariant(id, patch)
      setVariant(updated)
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : '保存失败')
      throw error
    } finally {
      setSaving(false)
    }
  }

  const handleResumeChange = async (resume: Resume) => {
    setVariant((current) => (current ? { ...current, resume } : current))
    await persistVariant({ resume })
  }

  const handleMetaSave = async (draft: string) => {
    const meta = parseVariantMeta(draft)
    setVariant((current) =>
      current
        ? {
            ...current,
            company: meta.company,
            jobTitle: meta.jobTitle,
            jdSummary: meta.jdSummary,
          }
        : current,
    )
    await persistVariant(meta)
  }

  const handleDownload = async () => {
    if (!variant) return
    setDownloading(true)
    try {
      const suffix = variant.company ? `-${variant.company}` : ''
      await exportToWord(variant.resume, `${variant.resume.basicInfo.name}${suffix}-定制简历.docx`)
    } finally {
      setDownloading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-slate-500">
        加载中…
      </div>
    )
  }

  if (!variant) {
    return (
      <main className="px-4 py-8 text-center">
        <p className="text-slate-500">简历不存在</p>
        <Link to="/resumes" className="mt-4 inline-block text-blue-600 hover:underline">
          返回列表
        </Link>
      </main>
    )
  }

  const publicUrl = variant.publicUrl || (id ? getResumePublicUrl(id) : '')

  return (
    <main className="px-4 py-8">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <Link to="/resumes" className="text-sm text-blue-600 hover:underline">
            ← 已生成简历列表
          </Link>
          <div className="flex items-center gap-3">
            {saving && <span className="text-sm text-slate-500">保存中…</span>}
            {saveError && <span className="text-sm text-rose-600">{saveError}</span>}
            <button
              type="button"
              onClick={() => void handleDownload()}
              disabled={downloading}
              className="rounded-lg bg-emerald-600 px-5 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              {downloading ? '导出中…' : '下载 Word 简历'}
            </button>
          </div>
        </div>

        <EditableSection
          editable
          title="编辑岗位信息"
          hint="第一行公司，第二行职位；第三行起为 JD 摘要（可选）。"
          className="mb-6 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900"
          getDraft={() =>
            serializeVariantMeta({
              company: variant.company,
              jobTitle: variant.jobTitle,
              jdSummary: variant.jdSummary,
            })
          }
          onSave={(draft) => void handleMetaSave(draft)}
          renderPreview={(draft) => {
            const meta = parseVariantMeta(draft)
            return (
              <div className="text-sm text-blue-900">
                <p className="font-medium">
                  {meta.company} · {meta.jobTitle}（匹配度 {variant.matchScore}%）
                </p>
                {meta.jdSummary && <p className="mt-2 whitespace-pre-wrap">{meta.jdSummary}</p>}
              </div>
            )
          }}
        >
          <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
            <p className="font-medium">
              {variant.company} · {variant.jobTitle}（匹配度 {variant.matchScore}%）
            </p>
            {variant.jdSummary && (
              <p className="mt-2 whitespace-pre-wrap text-blue-800">{variant.jdSummary}</p>
            )}
            {publicUrl && (
              <p className="mt-2">
                外网分享链接：
                <a
                  href={publicUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-1 underline"
                >
                  {publicUrl}
                </a>
              </p>
            )}
            {variant.profileSiteUrl && (
              <p className="mt-1">
                个人主页：{' '}
                <a
                  href={variant.profileSiteUrl}
                  className="underline"
                  target="_blank"
                  rel="noreferrer"
                >
                  {variant.profileSiteUrl}
                </a>
              </p>
            )}
          </div>
        </EditableSection>

        {variant.screenshotUrl && (
          <div className="mb-6">
            <p className="mb-2 text-sm font-medium text-slate-600">招聘信息截图</p>
            <img
              src={variant.screenshotUrl}
              alt="招聘截图"
              className="max-h-64 rounded-lg border border-slate-200"
            />
          </div>
        )}

        <ResumeView
          resume={variant.resume}
          editable
          onResumeChange={(resume) => void handleResumeChange(resume)}
        />
      </div>
    </main>
  )
}
