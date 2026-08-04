import type { ApplicationStatus } from '../types/job'
import { STATUS_OPTIONS } from '../types/job'

interface StatusBadgeProps {
  status: ApplicationStatus
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const opt = STATUS_OPTIONS.find((s) => s.value === status) ?? STATUS_OPTIONS[0]
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${opt.color}`}>
      {opt.label}
    </span>
  )
}

export function StatusSelect({
  value,
  onChange,
  className = '',
}: {
  value: ApplicationStatus
  onChange: (v: ApplicationStatus) => void
  className?: string
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as ApplicationStatus)}
      className={`rounded-lg border border-slate-300 px-3 py-2 text-sm ${className}`}
    >
      {STATUS_OPTIONS.map((s) => (
        <option key={s.value} value={s.value}>
          {s.label}
        </option>
      ))}
    </select>
  )
}
