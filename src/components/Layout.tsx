import { Link, Outlet, useLocation } from 'react-router-dom'
import { useAccessMode } from '../context/AccessModeContext'

const publicNav = [{ to: '/', label: '个人介绍' }]

const localNav = [
  { to: '/resume-maker', label: '简历制作' },
  { to: '/resumes', label: '已生成简历' },
  { to: '/works', label: '全部经历' },
  { to: '/assistant', label: '求职助手' },
  { to: '/edit', label: '编辑简历' },
]

export default function Layout() {
  const location = useLocation()
  const { isLocal, loading } = useAccessMode()

  const navItems = isLocal ? [...publicNav, ...localNav] : publicNav

  return (
    <div className="min-h-screen bg-slate-100">
      {isLocal && (
        <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur">
          <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-4 py-4">
            <Link to="/" className="group">
              <h1 className="text-xl font-bold text-slate-900 group-hover:text-blue-700">
                陈墨
              </h1>
              <p className="text-sm text-slate-500">个人介绍 · 本机模式</p>
            </Link>

            {!loading && (
              <nav className="flex flex-wrap gap-1 rounded-lg border border-slate-200 bg-slate-50 p-1">
                {navItems.map((item) => {
                  const active =
                    item.to === '/'
                      ? location.pathname === '/'
                      : location.pathname.startsWith(item.to)
                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                        active
                          ? 'bg-white text-blue-700 shadow-sm'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {item.label}
                    </Link>
                  )
                })}
              </nav>
            )}
          </div>
        </header>
      )}

      <Outlet />
    </div>
  )
}
