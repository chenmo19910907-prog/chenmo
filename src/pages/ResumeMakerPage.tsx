import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useResume } from '../context/ResumeContext'
import { useAccessMode } from '../context/AccessModeContext'
import { createResumeFromJd, detectProfile } from '../utils/jobApi'
import { compressImageFile } from '../utils/imageCompress'

interface ScreenshotItem {
  id: string
  name: string
  preview: string
  base64: string
}

const MAX_SCREENSHOTS = 9

export default function ResumeMakerPage() {
  const { resume } = useResume()
  const { publicSiteUrl } = useAccessMode()
  const navigate = useNavigate()
  const [jdText, setJdText] = useState('')
  const [screenshots, setScreenshots] = useState<ScreenshotItem[]>([])
  const [detectedLabel, setDetectedLabel] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const text = jdText.trim()
    if (!text) {
      setDetectedLabel('')
      return
    }

    const timer = window.setTimeout(() => {
      void detectProfile(text)
        .then((result) => {
          setDetectedLabel(result.label)
        })
        .catch(() => {
          setDetectedLabel('')
        })
    }, 400)

    return () => window.clearTimeout(timer)
  }, [jdText])

  const handleScreenshots = (files: FileList | null) => {
    if (!files?.length) return

    const remaining = MAX_SCREENSHOTS - screenshots.length
    if (remaining <= 0) {
      setError(`最多上传 ${MAX_SCREENSHOTS} 张截图`)
      return
    }

    const selected = Array.from(files).slice(0, remaining)
    void (async () => {
      try {
        const compressed = await Promise.all(selected.map((file) => compressImageFile(file)))
        setScreenshots((prev) => [
          ...prev,
          ...compressed.map((data, index) => ({
            id: crypto.randomUUID(),
            name: selected[index].name,
            preview: data.preview,
            base64: data.base64,
          })),
        ])
        setError('')
      } catch {
        setError('图片处理失败，请换一张截图重试')
      }
    })()
  }

  const removeScreenshot = (id: string) => {
    setScreenshots((prev) => prev.filter((item) => item.id !== id))
  }

  const handleSubmit = async () => {
    if (!jdText.trim() && screenshots.length === 0) {
      setError('请至少上传一张招聘截图或粘贴 JD')
      return
    }
    setLoading(true)
    setError('')
    try {
      const { variant } = await createResumeFromJd({
        jdText,
        screenshotsBase64: screenshots.map((item) => item.base64),
        resume,
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
        <Link to="/resumes" className="mb-6 inline-block text-sm text-blue-600 hover:underline">
          ← 已生成简历列表
        </Link>
        <header>
          <h1 className="text-2xl font-bold text-slate-900">简历制作</h1>
          <p className="mt-2 text-slate-600">
            上传招聘截图或粘贴 JD（至少填写一项），系统将根据岗位自动判断优化方向并生成定制简历。生成的简历将附上
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
              招聘信息截图（可选，可多选）
            </label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => {
                handleScreenshots(e.target.files)
                e.target.value = ''
              }}
              className="block w-full text-sm text-slate-600"
            />
            <p className="mt-1 text-xs text-slate-500">
              支持一次选择多张图片，最多 {MAX_SCREENSHOTS} 张；上传前会自动压缩以加快提交
            </p>
            {screenshots.length > 0 && (
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {screenshots.map((item) => (
                  <div
                    key={item.id}
                    className="relative overflow-hidden rounded-lg border border-slate-200 bg-slate-50"
                  >
                    <button
                      type="button"
                      onClick={() => removeScreenshot(item.id)}
                      className="absolute right-2 top-2 z-10 rounded-full bg-slate-900/70 px-2 py-0.5 text-xs text-white hover:bg-slate-900"
                    >
                      移除
                    </button>
                    <img
                      src={item.preview}
                      alt={item.name}
                      className="max-h-56 w-full object-contain"
                    />
                    <p className="truncate px-2 py-1 text-xs text-slate-500">{item.name}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              招聘 JD（可选）
            </label>
            <textarea
              value={jdText}
              onChange={(e) => setJdText(e.target.value)}
              rows={12}
              placeholder="粘贴 Boss / 猎聘 / 官网 JD 全文…"
              className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {detectedLabel && (
            <p className="rounded-lg bg-blue-50 px-4 py-3 text-sm text-blue-800">
              系统识别优化方向：
              <span className="ml-1 font-medium">{detectedLabel}</span>
              <span className="mt-1 block text-xs text-blue-600/80">
                根据 JD 岗位标题与任职要求自动判断，无需手动选择
              </span>
            </p>
          )}

          {error && (
            <p className="rounded-lg bg-rose-50 px-4 py-2 text-sm text-rose-700">{error}</p>
          )}

          <button
            type="button"
            disabled={loading}
            onClick={() => void handleSubmit()}
            className="w-full rounded-lg bg-blue-600 py-3 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {loading
              ? '生成中…'
              : detectedLabel
                ? `按「${detectedLabel}」生成定制简历`
                : '生成定制简历'}
          </button>
        </div>
      </div>
    </main>
  )
}
