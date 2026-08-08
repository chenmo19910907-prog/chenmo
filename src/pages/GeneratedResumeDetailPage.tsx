import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import EditableSection from '../components/EditableSection'
import ResumePreviewPanel from '../components/ResumePreviewPanel'
import { exportToWord } from '../utils/exportDocx'
import { analyzeVariant, fetchMasterResume, fetchVariantById, refreshVariant, updateVariant } from '../utils/jobApi'
import { getResumePublicUrl } from '../utils/accessMode'
import { getVariantScreenshotUrls } from '../utils/variantScreenshots'
import { shouldSyncWebsite } from '../utils/publicSiteUrl'
import { applyProfileToResume, applyPublicSiteUrl } from '../utils/resumeSync'
import { parseVariantMeta, serializeVariantMeta } from '../utils/resumeEditText'
import { loadResumeTemplateId, saveResumeTemplateId } from '../utils/resumeTemplateStorage'
import { useAccessMode } from '../context/AccessModeContext'
import { useModuleEditable } from '../context/EditModeContext'
import JobAnalysisCard from '../components/JobAnalysisCard'
import CollapsibleSection from '../components/CollapsibleSection'
import type { Resume } from '../types/resume'
import type { ResumeVariant } from '../types/job'
import {
  DEFAULT_RESUME_TEMPLATE_ID,
  resolveResumeTemplateId,
  type ResumeTemplateId,
} from '../templates'

export default function GeneratedResumeDetailPage() {
  const { id } = useParams()
  const { publicSiteUrl } = useAccessMode()
  const moduleEditable = useModuleEditable()
  const [variant, setVariant] = useState<ResumeVariant | null>(null)
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [templateId, setTemplateId] = useState<ResumeTemplateId>(DEFAULT_RESUME_TEMPLATE_ID)

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

  useEffect(() => {
    if (!variant) return
    setTemplateId(resolveResumeTemplateId(variant.templateId ?? loadResumeTemplateId()))
  }, [variant?.id, variant?.templateId])

  const persistVariant = async (
    patch: Partial<
      Pick<ResumeVariant, 'resume' | 'company' | 'jobTitle' | 'jdSummary' | 'templateId'>
    >,
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

  const handleTemplateChange = (nextTemplateId: ResumeTemplateId) => {
    setTemplateId(nextTemplateId)
    saveResumeTemplateId(nextTemplateId)
    if (!id) return
    void persistVariant({ templateId: nextTemplateId }).catch(() => {
      /* saveError 已在 persistVariant 内处理 */
    })
  }

  useEffect(() => {
    if (!id || !variant || !publicSiteUrl) return
    if (!shouldSyncWebsite(variant.resume.basicInfo.website, publicSiteUrl)) return

    const nextResume = applyPublicSiteUrl(variant.resume, publicSiteUrl, { force: true })
    setVariant((current) => (current ? { ...current, resume: nextResume } : current))
    void updateVariant(id, { resume: nextResume })
      .then(setVariant)
      .catch((error) => {
        setSaveError(error instanceof Error ? error.message : '保存失败')
      })
  }, [id, publicSiteUrl, variant?.id, variant?.resume.basicInfo.website])

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
      await exportToWord(variant.resume, {
        filename: `${variant.resume.basicInfo.name}${suffix}-定制简历.docx`,
        templateId,
      })
    } finally {
      setDownloading(false)
    }
  }

  const handleRefresh = async () => {
    if (!id || !variant) return
    if (
      !window.confirm(
        '将根据最新主简历与个人介绍重新生成定制简历，当前手动修改的内容将被覆盖。确定继续？',
      )
    ) {
      return
    }

    setRefreshing(true)
    setSaveError(null)
    try {
      const master = await fetchMasterResume()
      const base = applyPublicSiteUrl(applyProfileToResume(master), publicSiteUrl, { force: true })
      const updated = await refreshVariant(id, base, variant.meta?.profile)
      setVariant(updated)
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : '更新失败')
    } finally {
      setRefreshing(false)
    }
  }

  const handleAnalyze = async () => {
    if (!id) return
    setAnalyzing(true)
    setSaveError(null)
    try {
      const updated = await analyzeVariant(id)
      setVariant(updated)
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : '分析失败')
    } finally {
      setAnalyzing(false)
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
  const screenshotUrls = getVariantScreenshotUrls(variant)

  return (
    <main className={`px-4 py-8 ${moduleEditable ? 'overflow-x-visible pr-14' : ''}`}>
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
              onClick={() => void handleRefresh()}
              disabled={refreshing}
              className="rounded-lg border border-blue-200 bg-blue-50 px-5 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100 disabled:opacity-50"
            >
              {refreshing ? '更新中…' : '更新'}
            </button>
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

        <CollapsibleSection
          title={`${variant.company} · ${variant.jobTitle}`}
          subtitle={`匹配度 ${variant.matchScore}% · 点击展开查看 JD 与链接`}
          defaultOpen={false}
        >
          <EditableSection
            editable={moduleEditable}
            title="编辑岗位信息"
            hint="第一行公司，第二行职位；第三行起为 JD 摘要（可选）。"
            className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900"
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
            <div className="text-sm text-blue-900">
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
        </CollapsibleSection>

        {variant.jobAnalysis ? (
          <JobAnalysisCard
            analysis={variant.jobAnalysis}
            onReanalyze={() => void handleAnalyze()}
            reanalyzing={analyzing}
          />
        ) : (
          <div className="mb-6 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">
            <p>尚未生成岗位分析。</p>
            <button
              type="button"
              onClick={() => void handleAnalyze()}
              disabled={analyzing}
              className="mt-3 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {analyzing ? '分析中…' : '立即分析公司与岗位'}
            </button>
          </div>
        )}

        {screenshotUrls.length > 0 && (
          <CollapsibleSection
            title="招聘信息截图"
            subtitle={`共 ${screenshotUrls.length} 张，点击展开查看`}
            defaultOpen={false}
          >
            <div className="grid gap-3 sm:grid-cols-2">
              {screenshotUrls.map((url, index) => (
                <img
                  key={url}
                  src={url}
                  alt={`招聘截图 ${index + 1}`}
                  className="max-h-64 w-full rounded-lg border border-slate-200 object-contain"
                />
              ))}
            </div>
          </CollapsibleSection>
        )}

        <ResumePreviewPanel
          resume={variant.resume}
          templateId={templateId}
          onTemplateChange={handleTemplateChange}
          editable={moduleEditable}
          onResumeChange={(resume) => void handleResumeChange(resume)}
        />
      </div>
    </main>
  )
}
