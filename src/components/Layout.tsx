import { Link, Outlet, useLocation } from 'react-router-dom'

const navItems = [
  { to: '/', label: '简历概览' },
  { to: '/works', label: '工作经历' },
  { to: '/jobs', label: '岗位监控' },
  { to: '/applications', label: '应聘跟踪' },
  { to: '/assistant', label: '求职助手' },
  { to: '/edit', label: '编辑' },
]

export default function Layout() {
  const location = useLocation()

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-4 py-4">
          <Link to="/" className="group">
            <h1 className="text-xl font-bold text-slate-900 group-hover:text-blue-700">
              陈墨 · 工作简历
            </h1>
            <p className="text-sm text-slate-500">记录、浏览与导出你的职业履历</p>
          </Link>

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
                  className={`rounded-md px-4 py-1.5 text-sm font-medium transition ${
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
        </div>
      </header>

      <Outlet />
    </div>
  )
}
