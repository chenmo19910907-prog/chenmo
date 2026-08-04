import type { ResumeProfile } from '../types/job'
import { PROFILE_OPTIONS } from '../types/job'

export default function ProfileSelector({
  value,
  onChange,
  className = '',
}: {
  value: ResumeProfile
  onChange: (v: ResumeProfile) => void
  className?: string
}) {
  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {PROFILE_OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
            value === opt.value
              ? 'bg-blue-600 text-white'
              : 'border border-slate-300 text-slate-600 hover:bg-slate-50'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}
