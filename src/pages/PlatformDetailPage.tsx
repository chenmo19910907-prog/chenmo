import { Link, useLocation } from 'react-router-dom'
import { RESTORE_SCROLL_STATE } from '../components/ScrollToTop'
import { useYaahlanPlatform } from '../hooks/useYaahlanPlatform'

export default function PlatformDetailPage() {
  const location = useLocation()
  const platform = useYaahlanPlatform()
  const fromHome = (location.state as { from?: string } | null)?.from === 'home'

  return (
    <main className="px-4 py-8">
      <article className="mx-auto max-w-3xl">
        <Link
          to={fromHome ? '/' : '/works/work-0'}
          state={fromHome ? RESTORE_SCROLL_STATE : undefined}
          className="mb-6 inline-block text-sm text-blue-600 hover:underline"
        >
          {fromHome ? '← 返回个人介绍' : '← 返回陌陌工作详情'}
        </Link>

        <header className="rounded-2xl bg-gradient-to-br from-violet-700 to-blue-900 p-8 text-white shadow-lg md:p-10">
          <p className="text-sm text-violet-200">Yaahlan · 智能测试平台</p>
          <h1 className="mt-2 text-3xl font-bold md:text-4xl">{platform.title}</h1>
          <p className="mt-4 leading-relaxed text-violet-50">{platform.summary}</p>
        </header>

        <div className="mt-8 space-y-8 rounded-2xl bg-white p-8 shadow-lg md:p-10">
          {platform.sections.map((section) => (
            <section key={section.title}>
              <h2 className="mb-4 border-b-2 border-violet-600 pb-2 text-lg font-semibold text-violet-900">
                {section.title}
              </h2>
              <p className="leading-relaxed text-slate-700">{section.content}</p>
              {section.bullets && section.bullets.length > 0 && (
                <ul className="mt-4 list-disc space-y-2 pl-5 text-slate-700">
                  {section.bullets.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              )}
              {section.links && section.links.length > 0 && (
                <div className="mt-4 space-y-3">
                  {section.links.map((link) => (
                    <div
                      key={`${link.label}-${link.url}`}
                      className="rounded-xl border border-slate-200 p-4 transition hover:border-violet-300 hover:bg-violet-50/50"
                    >
                      {link.url.startsWith('http') ? (
                        <a
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium text-violet-700 hover:underline"
                        >
                          {link.label} →
                        </a>
                      ) : (
                        <Link
                          to={link.url}
                          className="font-medium text-violet-700 hover:underline"
                        >
                          {link.label} →
                        </Link>
                      )}
                      {link.description && (
                        <p className="mt-1 text-sm text-slate-500">{link.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>
          ))}
        </div>
      </article>
    </main>
  )
}
