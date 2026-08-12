import { useEffect, useRef, useState } from 'react'
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
  const fileInputRef = useRef<HTMLInputElement>(null)
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

  const appendScreenshotFiles = (files: File[]) => {
    if (!files.length) return

    const remaining = MAX_SCREENSHOTS - screenshots.length
    if (remaining <= 0) {
      setError(`最多上传 ${MAX_SCREENSHOTS} 张截图`)
      return
    }

    const selected = files.slice(0, remaining)
    void (async () => {
      try {
        const compressed = await Promise.all(selected.map((file) => compressImageFile(file)))
        setScreenshots((prev) => [
          ...prev,
          ...compressed.map((data, index) => ({
            id: crypto.randomUUID(),
            name: selected[index].name || `粘贴图片-${index + 1}`,
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

  const handlePaste = (event: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = event.clipboardData?.items
    if (!items?.length) return

    const imageFiles = Array.from(items)
      .filter((item) => item.type.startsWith('image/'))
      .map((item) => item.getAsFile())
      .filter((file): file is File => file !== null)

    if (imageFiles.length === 0) return

    event.preventDefault()
    appendScreenshotFiles(imageFiles)
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
            在同一输入区粘贴 JD 或截图（至少一项），也可选择本地图片；系统将根据岗位自动判断优化方向并生成定制简历。生成的简历将附上
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
            <label
              htmlFor="resume-maker-input"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              招聘信息（JD 文本 / 截图，至少填一项）
            </label>
            <div className="overflow-hidden rounded-lg border border-slate-300 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500">
              {screenshots.length > 0 && (
                <div className="grid gap-3 border-b border-slate-200 bg-slate-50 p-3 sm:grid-cols-2">
                  {screenshots.map((item) => (
                    <div
                      key={item.id}
                      className="relative overflow-hidden rounded-lg border border-slate-200 bg-white"
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
                        className="max-h-40 w-full object-contain"
                      />
                      <p className="truncate px-2 py-1 text-xs text-slate-500">{item.name}</p>
                    </div>
                  ))}
                </div>
              )}
              <textarea
                id="resume-maker-input"
                value={jdText}
                onChange={(e) => setJdText(e.target.value)}
                onPaste={handlePaste}
                rows={12}
                placeholder="粘贴 Boss / 猎聘 / 官网 JD 全文，或在输入框内直接粘贴招聘截图…"
                className="w-full resize-y border-0 px-4 py-3 text-sm focus:outline-none"
              />
              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 bg-slate-50 px-3 py-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700 hover:border-blue-300 hover:text-blue-700"
                >
                  选择图片
                </button>
                <p className="text-xs text-slate-500">
                  支持粘贴截图或一次选择多张，最多 {MAX_SCREENSHOTS} 张，上传前自动压缩
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => {
                    if (e.target.files?.length) {
                      appendScreenshotFiles(Array.from(e.target.files))
                    }
                    e.target.value = ''
                  }}
                  className="hidden"
                />
              </div>
            </div>
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
