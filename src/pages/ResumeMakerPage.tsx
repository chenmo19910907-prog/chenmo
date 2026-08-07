import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useResume } from '../context/ResumeContext'
import { useAccessMode } from '../context/AccessModeContext'
import { createResumeFromJd } from '../utils/jobApi'
import ProfileSelector from '../components/ProfileSelector'
import type { ResumeProfile } from '../types/job'

export default function ResumeMakerPage() {
  const { resume } = useResume()
  const { publicSiteUrl } = useAccessMode()
  const navigate = useNavigate()
  const [jdText, setJdText] = useState('')
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null)
  const [screenshotBase64, setScreenshotBase64] = useState<string | null>(null)
  const [profile, setProfile] = useState<ResumeProfile>('business-expert')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleScreenshot = (file: File | null) => {
    if (!file) {
      setScreenshotPreview(null)
      setScreenshotBase64(null)
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      setScreenshotPreview(result)
      setScreenshotBase64(result)
    }
    reader.readAsDataURL(file)
  }

  const handleSubmit = async () => {
    if (!jdText.trim()) {
      setError('请粘贴招聘 JD')
      return
    }
    setLoading(true)
    setError('')
    try {
      const { variant } = await createResumeFromJd({
        jdText,
        screenshotBase64: screenshotBase64 ?? undefined,
        resume,
        profile,
      })
      navigate(`/resumes/${variant.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : '生成失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="px-4 py-8">
      <div className="mx-auto max-w-3xl">
        <Link to="/" className="text-sm text-blue-600 hover:underline">
          ← 返回个人介绍
        </Link>

        <header className="mt-6">
          <h1 className="text-2xl font-bold text-slate-900">简历制作</h1>
          <p className="mt-2 text-slate-600">
            上传公司招聘信息截图并粘贴 JD，系统将根据岗位生成定制简历。生成的简历将附上
            {publicSiteUrl ? (
              <span className="font-medium text-blue-700"> {publicSiteUrl} </span>
            ) : (
              ' 此外网主页地址 '
            )}
            供招聘方查看。
          </p>
        </header>

        <div className="mt-8 space-y-6 rounded-2xl bg-white p-6 shadow-lg">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              招聘信息截图（可选）
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleScreenshot(e.target.files?.[0] ?? null)}
              className="block w-full text-sm text-slate-600"
            />
            {screenshotPreview && (
              <img
                src={screenshotPreview}
                alt="招聘截图预览"
                className="mt-3 max-h-48 rounded-lg border border-slate-200 object-contain"
              />
            )}
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              招聘 JD <span className="text-rose-500">*</span>
            </label>
            <textarea
              value={jdText}
              onChange={(e) => setJdText(e.target.value)}
              rows={12}
              placeholder="粘贴 Boss / 猎聘 / 官网 JD 全文…"
              className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <ProfileSelector value={profile} onChange={setProfile} />

          {error && (
            <p className="rounded-lg bg-rose-50 px-4 py-2 text-sm text-rose-700">{error}</p>
          )}

          <button
            type="button"
            disabled={loading}
            onClick={() => void handleSubmit()}
            className="w-full rounded-lg bg-blue-600 py-3 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? '生成中…' : '生成定制简历'}
          </button>
        </div>
      </div>
    </main>
  )
}
