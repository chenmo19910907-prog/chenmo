import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import ResumeView from '../components/ResumeView'
import { fetchPublicVariant } from '../utils/jobApi'
import type { ResumeVariant } from '../types/job'

/** 外网可访问的定制简历页（/r/:id），不含简历制作等本机功能 */
export default function PublicResumePage() {
  const { id } = useParams()
  const [variant, setVariant] = useState<ResumeVariant | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!id) return
    void (async () => {
      try {
        const data = await fetchPublicVariant(id)
        setVariant(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : '加载失败')
      } finally {
        setLoading(false)
      }
    })()
  }, [id])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 text-slate-500">
        加载中…
      </div>
    )
  }

  if (error || !variant) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-100 px-4">
        <p className="text-slate-600">{error || '简历不存在或已失效'}</p>
        <Link to="/" className="mt-4 text-blue-600 hover:underline">
          返回个人主页
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4">
          <Link to="/" className="text-lg font-bold text-slate-900 hover:text-blue-700">
            {variant.resume.basicInfo.name}
          </Link>
          <span className="text-sm text-slate-500">定制简历 · 外网预览</span>
        </div>
      </header>

      <main className="px-4 py-8">
        <div className="mx-auto max-w-3xl">
          <div className="mb-6 rounded-xl bg-white p-4 text-sm text-slate-600 shadow-sm">
            <p>
              应聘岗位：<strong>{variant.company}</strong> · {variant.jobTitle}
            </p>
            {variant.profileSiteUrl && (
              <p className="mt-2">
                了解更多：
                <a href={variant.profileSiteUrl} className="ml-1 text-blue-600 hover:underline">
                  个人主页
                </a>
              </p>
            )}
          </div>
          <ResumeView resume={variant.resume} />
        </div>
      </main>
    </div>
  )
}
