import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { deleteVariant, fetchVariants } from '../utils/jobApi'
import type { ResumeVariant } from '../types/job'

export default function GeneratedResumeListPage() {
  const [variants, setVariants] = useState<ResumeVariant[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    void (async () => {
      try {
        const store = await fetchVariants()
        setVariants(
          [...(store.variants ?? [])].sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
          ),
        )
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const handleDelete = async (variant: ResumeVariant) => {
    const label = `${variant.company} · ${variant.jobTitle}`
    if (!window.confirm(`确定删除「${label}」吗？此操作不可恢复。`)) return

    setDeletingId(variant.id)
    try {
      await deleteVariant(variant.id)
      setVariants((current) => current.filter((item) => item.id !== variant.id))
    } catch (error) {
      window.alert(error instanceof Error ? error.message : '删除失败')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <main className="px-4 py-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">已生成简历</h1>
            <p className="mt-2 text-slate-600">根据招聘 JD 生成的定制简历列表（本机可见）</p>
          </div>
          <Link
            to="/resume-maker"
            className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
          >
            + 新建简历
          </Link>
        </div>

        {loading ? (
          <p className="text-slate-500">加载中…</p>
        ) : variants.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
            <p className="text-slate-500">暂无生成记录</p>
            <Link
              to="/resume-maker"
              className="mt-4 inline-block text-sm text-blue-600 hover:underline"
            >
              去制作第一份简历 →
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {variants.map((variant) => (
              <article
                key={variant.id}
                className="flex flex-wrap gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                {variant.screenshotUrl && (
                  <img
                    src={variant.screenshotUrl}
                    alt="招聘截图"
                    className="h-24 w-24 shrink-0 rounded-lg border border-slate-200 object-cover"
                  />
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <h2 className="text-lg font-bold text-slate-900">
                        {variant.company} · {variant.jobTitle}
                      </h2>
                      <p className="mt-1 text-sm text-slate-500">
                        匹配度 {variant.matchScore}% ·{' '}
                        {new Date(variant.createdAt).toLocaleString('zh-CN')}
                      </p>
                    </div>
                    <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
                      {variant.matchScore}%
                    </span>
                  </div>
                  {variant.jdSummary && (
                    <p className="mt-3 line-clamp-2 text-sm text-slate-600">
                      {variant.jdSummary}
                    </p>
                  )}
                  <div className="mt-4 flex flex-wrap gap-3">
                    <Link
                      to={`/resumes/${variant.id}`}
                      className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                    >
                      详情
                    </Link>
                    {variant.publicUrl && (
                      <a
                        href={variant.publicUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                      >
                        外网预览
                      </a>
                    )}
                    <button
                      type="button"
                      onClick={() => void handleDelete(variant)}
                      disabled={deletingId === variant.id}
                      className="rounded-lg border border-rose-200 px-4 py-2 text-sm text-rose-600 hover:bg-rose-50 disabled:opacity-50"
                    >
                      {deletingId === variant.id ? '删除中…' : '删除'}
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
