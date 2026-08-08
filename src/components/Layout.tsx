import { Link, Outlet, useLocation } from 'react-router-dom'
import { RESTORE_SCROLL_STATE } from './ScrollToTop'
import { useAccessMode } from '../context/AccessModeContext'
import { EditModeProvider, useEditMode } from '../context/EditModeContext'
import { getPublicPreviewUrl } from '../utils/accessMode'

const publicNav = [{ to: '/', label: '个人介绍' }]

const localNav = [
  { to: '/works', label: '全部经历' },
  { to: '/resumes', label: '已生成简历' },
  { to: '/edit', label: '编辑简历' },
]

export default function Layout() {
  return (
    <EditModeProvider>
      <LayoutShell />
    </EditModeProvider>
  )
}

function LayoutShell() {
  const location = useLocation()
  const { isLocal, loading } = useAccessMode()
  const { canEdit, isEditing, toggleEditing } = useEditMode()

  const navItems = isLocal ? [...publicNav, ...localNav] : publicNav

  return (
    <div className="min-h-screen bg-slate-100">
      {isLocal && (
        <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur">
          <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-4 py-4">
            <Link to="/" state={RESTORE_SCROLL_STATE} className="group">
              <h1 className="text-xl font-bold text-slate-900 group-hover:text-blue-700">
                陈墨
              </h1>
              <p className="text-sm text-slate-500">个人介绍 · 本机模式</p>
            </Link>

            {!loading && (
              <div className="flex flex-wrap items-center gap-3">
                {canEdit && (
                  <button
                    type="button"
                    onClick={toggleEditing}
                    className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                      isEditing
                        ? 'border border-blue-600 bg-blue-600 text-white hover:bg-blue-700'
                        : 'border border-slate-300 bg-white text-slate-700 hover:border-blue-300 hover:text-blue-700'
                    }`}
                  >
                    {isEditing ? '完成编辑' : '编辑'}
                  </button>
                )}
                <a
                  href={getPublicPreviewUrl('/')}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-600 transition hover:border-blue-200 hover:text-blue-700"
                >
                  外网预览
                </a>
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
                      state={item.to === '/' ? RESTORE_SCROLL_STATE : undefined}
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
              </div>
            )}
          </div>
        </header>
      )}

      <Outlet />
    </div>
  )
}
