import {
  CLASSIC_LAYOUT_OPTIONS,
  LAYOUT_COLOR_OPTIONS,
  PREMIUM_LAYOUT_OPTIONS,
  getDefaultTemplateForLayout,
  getLayoutColorOptions,
  getTemplateLayout,
  isTemplateInLayout,
  type LayoutTemplateOption,
  type ResumeLayoutId,
  type ResumeTemplateId,
} from '../templates'

function LayoutPreview({
  layout,
  className = 'h-7 w-9 shrink-0',
}: {
  layout: ResumeLayoutId
  className?: string
}) {
  switch (layout) {
    case 'sidebar':
      return (
        <svg viewBox="0 0 40 28" className={className} aria-hidden>
          <rect width="40" height="28" rx="2" fill="#f8fafc" stroke="#e2e8f0" />
          <rect width="13" height="28" rx="2" fill="#0f172a" />
          <rect x="16" y="4" width="20" height="2" rx="1" fill="#cbd5e1" />
          <rect x="16" y="9" width="16" height="1.5" rx="0.75" fill="#e2e8f0" />
          <rect x="16" y="13" width="18" height="1.5" rx="0.75" fill="#e2e8f0" />
        </svg>
      )
    case 'timeline':
      return (
        <svg viewBox="0 0 40 28" className={className} aria-hidden>
          <rect width="40" height="28" rx="2" fill="#fff" stroke="#e2e8f0" />
          <rect x="5" y="4" width="18" height="2.5" rx="1" fill="#0f172a" />
          <line x1="8" y1="12" x2="8" y2="24" stroke="#cbd5e1" strokeWidth="1" />
          <circle cx="8" cy="12" r="2.5" fill="#fff" stroke="#0f172a" strokeWidth="1.5" />
          <circle cx="8" cy="19" r="2.5" fill="#fff" stroke="#0f172a" strokeWidth="1.5" />
          <rect x="13" y="10" width="20" height="1.5" rx="0.75" fill="#94a3b8" />
        </svg>
      )
    case 'magazine':
      return (
        <svg viewBox="0 0 40 28" className={className} aria-hidden>
          <rect width="40" height="28" rx="2" fill="#faf9f7" stroke="#e7e5e4" />
          <rect width="40" height="9" fill="#292524" />
          <rect x="5" y="13" width="8" height="1.5" rx="0.75" fill="#a8a29e" />
          <rect x="15" y="12" width="20" height="3" rx="1" fill="#fff" stroke="#e7e5e4" />
        </svg>
      )
    case 'executive':
      return (
        <svg viewBox="0 0 40 28" className={className} aria-hidden>
          <rect width="40" height="28" rx="2" fill="#faf8f5" stroke="#e7e5e4" />
          <line x1="8" y1="8" x2="32" y2="8" stroke="#d6d3d1" />
          <rect x="14" y="11" width="12" height="2.5" rx="1" fill="#292524" />
          <line x1="8" y1="18" x2="32" y2="18" stroke="#d6d3d1" />
          <rect x="10" y="21" width="20" height="1" rx="0.5" fill="#e7e5e4" />
        </svg>
      )
    case 'folio':
      return (
        <svg viewBox="0 0 40 28" className={className} aria-hidden>
          <rect width="40" height="28" rx="2" fill="#fff" stroke="#e7e5e4" />
          <rect width="12" height="28" rx="2" fill="#f5f5f4" />
          <rect x="15" y="5" width="14" height="2" rx="1" fill="#d6d3d1" />
          <rect x="15" y="10" width="20" height="1.5" rx="0.75" fill="#e7e5e4" />
          <rect x="15" y="14" width="18" height="1.5" rx="0.75" fill="#e7e5e4" />
        </svg>
      )
    case 'ledger':
      return (
        <svg viewBox="0 0 40 28" className={className} aria-hidden>
          <rect width="40" height="28" rx="2" fill="#fff" stroke="#e2e8f0" />
          <rect width="40" height="8" fill="#0f172a" />
          <rect x="4" y="12" width="7" height="1" fill="#94a3b8" />
          <rect x="13" y="11" width="22" height="3" rx="1" fill="#f8fafc" stroke="#e2e8f0" />
        </svg>
      )
    case 'atelier':
      return (
        <svg viewBox="0 0 40 28" className={className} aria-hidden>
          <rect width="40" height="28" rx="2" fill="#fff" stroke="#e7e5e4" />
          <rect x="8" y="5" width="24" height="1" fill="#d6d3d1" />
          <rect x="10" y="8" width="10" height="2" rx="0.5" fill="#292524" />
          <rect x="8" y="14" width="24" height="0.5" fill="#e7e5e4" />
          <rect x="8" y="18" width="20" height="1" rx="0.5" fill="#e7e5e4" />
        </svg>
      )
    default:
      return (
        <svg viewBox="0 0 40 28" className={className} aria-hidden>
          <rect width="40" height="28" rx="2" fill="#fff" stroke="#e2e8f0" />
          <rect x="12" y="4" width="16" height="2.5" rx="1" fill="#1e293b" />
          <rect x="8" y="10" width="24" height="1" fill="#e2e8f0" />
          <rect x="5" y="14" width="3" height="6" rx="0.5" fill="#2563eb" />
          <rect x="10" y="14" width="22" height="1.5" rx="0.75" fill="#cbd5e1" />
        </svg>
      )
  }
}

function cardState(active: boolean, premium = false) {
  if (active) {
    return premium
      ? 'border-amber-600 bg-amber-50/70 ring-1 ring-amber-200/80'
      : 'border-blue-500 bg-blue-50/80 ring-1 ring-blue-200/70'
  }
  return premium
    ? 'border-stone-200 bg-gradient-to-br from-white to-amber-50/30 hover:border-amber-200'
    : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60'
}

function TemplateCard({
  option,
  value,
  onChange,
}: {
  option: LayoutTemplateOption
  value: ResumeTemplateId
  onChange: (templateId: ResumeTemplateId) => void
}) {
  const active = isTemplateInLayout(value, option.layout)
  const currentInLayout = active ? value : option.defaultTemplateId
  const premium = option.tier === 'premium'

  return (
    <div className={`rounded-lg border p-2.5 transition ${cardState(active, premium)}`}>
      <button
        type="button"
        onClick={() => onChange(currentInLayout)}
        className="flex w-full items-start gap-2.5 text-left"
      >
        <LayoutPreview layout={option.layout} />
        <span className="min-w-0">
          <span className="flex items-center gap-1.5">
            <span className="block text-sm font-semibold text-slate-900">{option.label}</span>
            {premium && (
              <span className="rounded bg-amber-100 px-1 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-amber-800">
                高级
              </span>
            )}
          </span>
          <span className="mt-0.5 block text-[11px] leading-snug text-slate-500">
            {option.description}
          </span>
        </span>
      </button>
      <div className="mt-2">
        <ColorSwatches layout={option.layout} value={value} onChange={onChange} />
      </div>
    </div>
  )
}

function LayoutOptionGrid({
  options,
  value,
  onChange,
  className = '',
}: {
  options: LayoutTemplateOption[]
  value: ResumeTemplateId
  onChange: (templateId: ResumeTemplateId) => void
  className?: string
}) {
  return (
    <div className={`grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-4 ${className}`}>
      {options.map((option) => (
        <TemplateCard key={option.id} option={option} value={value} onChange={onChange} />
      ))}
    </div>
  )
}

function ColorSwatches({
  layout,
  value,
  onChange,
  compact = false,
}: {
  layout: ResumeLayoutId
  value: ResumeTemplateId
  onChange: (templateId: ResumeTemplateId) => void
  compact?: boolean
}) {
  const active = isTemplateInLayout(value, layout)
  const colors = getLayoutColorOptions(layout)

  return (
    <div className={`flex flex-wrap gap-1 ${compact ? '' : 'border-t border-slate-200/70 pt-2'}`}>
      {colors.map((option) => {
        const selected = value === option.id
        return (
          <button
            key={option.id}
            type="button"
            title={option.label}
            onClick={() => onChange(option.id)}
            className={`inline-flex items-center gap-1 rounded-md border transition ${
              compact ? 'px-1.5 py-0.5 text-[10px]' : 'px-1.5 py-0.5 text-[10px]'
            } ${
              selected
                ? 'border-blue-600 bg-white font-medium text-blue-800'
                : active
                  ? 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300'
                  : 'border-transparent bg-slate-50/80 text-slate-500 hover:border-slate-200'
            }`}
          >
            <span className={`h-2 w-2 shrink-0 rounded-full ${option.swatchClass}`} aria-hidden />
            <span className="truncate">{option.label}</span>
          </button>
        )
      })}
    </div>
  )
}

function CompactTemplateSelector({
  value,
  onChange,
  className = '',
}: {
  value: ResumeTemplateId
  onChange: (templateId: ResumeTemplateId) => void
  className?: string
}) {
  const activeLayout = getTemplateLayout(value)

  return (
    <div className={`flex min-w-0 flex-wrap items-center gap-1.5 ${className}`}>
      {[...CLASSIC_LAYOUT_OPTIONS, ...PREMIUM_LAYOUT_OPTIONS].map((option) => {
        const active = activeLayout === option.layout
        const currentInLayout = isTemplateInLayout(value, option.layout)
          ? value
          : option.defaultTemplateId

        return (
          <div
            key={option.id}
            className={`inline-flex max-w-full items-center overflow-hidden rounded-lg border text-xs transition ${cardState(active)}`}
          >
            <button
              type="button"
              onClick={() => onChange(currentInLayout)}
              className="inline-flex items-center gap-1.5 px-2 py-1.5"
            >
              <LayoutPreview layout={option.layout} className="h-5 w-7" />
              <span className="font-medium whitespace-nowrap">{option.label}</span>
            </button>
            {active && (
              <div className="flex items-center gap-0.5 border-l border-blue-200/80 px-1.5 py-1">
                {getLayoutColorOptions(option.layout).map((color) => {
                  const selected = value === color.id
                  return (
                    <button
                      key={color.id}
                      type="button"
                      title={color.label}
                      onClick={() => onChange(color.id)}
                      className={`rounded-full p-0.5 transition ${
                        selected ? 'ring-1 ring-blue-500 ring-offset-1' : 'hover:ring-1 hover:ring-slate-300'
                      }`}
                    >
                      <span className={`block h-3 w-3 rounded-full ${color.swatchClass}`} aria-hidden />
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

function PanelTemplateSelector({
  value,
  onChange,
  className = '',
}: {
  value: ResumeTemplateId
  onChange: (templateId: ResumeTemplateId) => void
  className?: string
}) {
  return (
    <LayoutOptionGrid
      className={className}
      options={[...CLASSIC_LAYOUT_OPTIONS, ...PREMIUM_LAYOUT_OPTIONS]}
      value={value}
      onChange={onChange}
    />
  )
}

export default function TemplateSelector({
  value,
  onChange,
  layout = 'panel',
  className = '',
}: {
  value: ResumeTemplateId
  onChange: (templateId: ResumeTemplateId) => void
  layout?: 'compact' | 'panel'
  className?: string
}) {
  if (layout === 'compact') {
    return <CompactTemplateSelector value={value} onChange={onChange} className={className} />
  }

  return <PanelTemplateSelector value={value} onChange={onChange} className={className} />
}

// re-export for tests / external use
export { LAYOUT_COLOR_OPTIONS, getDefaultTemplateForLayout }
