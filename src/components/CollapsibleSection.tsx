import { useState } from 'react'

interface CollapsibleSectionProps {
  title: string
  subtitle?: string
  defaultOpen?: boolean
  children: React.ReactNode
  className?: string
}

export default function CollapsibleSection({
  title,
  subtitle,
  defaultOpen = false,
  children,
  className = '',
}: CollapsibleSectionProps) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <section className={`mb-6 overflow-hidden rounded-xl border border-slate-200 bg-white ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-slate-50"
      >
        <div className="min-w-0">
          <h2 className="text-sm font-medium text-slate-700">{title}</h2>
          {subtitle && <p className="mt-0.5 truncate text-xs text-slate-500">{subtitle}</p>}
        </div>
        <span className="shrink-0 text-xs text-slate-400">{open ? '收起 ▲' : '展开 ▼'}</span>
      </button>
      {open && <div className="border-t border-slate-100 px-4 py-4">{children}</div>}
    </section>
  )
}
