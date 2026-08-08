import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

interface EditableSectionProps {
  editable?: boolean
  getDraft: () => string
  onSave: (draft: string) => void
  renderPreview: (draft: string) => React.ReactNode
  children: React.ReactNode
  className?: string
  editButtonClassName?: string
  hint?: string
  title?: string
}

export default function EditableSection({
  editable = false,
  getDraft,
  onSave,
  renderPreview,
  children,
  className = '',
  editButtonClassName = '',
  hint,
  title = '编辑内容',
}: EditableSectionProps) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')

  useEffect(() => {
    if (!editing) return
    setDraft(getDraft())
  }, [editing, getDraft])

  useEffect(() => {
    if (!editing) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setDraft(getDraft())
        setEditing(false)
      }
    }
    window.addEventListener('keydown', onKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [editing, getDraft])

  if (!editable) {
    return <div className={className}>{children}</div>
  }

  const startEdit = () => {
    setDraft(getDraft())
    setEditing(true)
  }

  const save = () => {
    onSave(draft)
    setEditing(false)
  }

  const cancel = () => {
    setDraft(getDraft())
    setEditing(false)
  }

  return (
    <>
      <div className="relative overflow-visible">
        <div className={className}>{children}</div>
        <button
          type="button"
          onClick={startEdit}
          className={`absolute top-0 z-10 ml-3 whitespace-nowrap rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs text-slate-600 shadow-sm transition hover:border-blue-300 hover:text-blue-700 ${editButtonClassName}`}
          style={{ left: '100%' }}
        >
          编辑
        </button>
      </div>

      {editing &&
        createPortal(
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-[1px]"
            onClick={cancel}
            role="presentation"
          >
            <div
              className="flex max-h-[min(90vh,900px)] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
              onClick={(event) => event.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-label={title}
            >
              <div className="border-b border-slate-200 px-5 py-4">
                <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
                <p className="mt-1 text-sm text-slate-500">
                  在弹窗中编辑，当前页面展示不受影响；保存后才会更新内容。
                </p>
              </div>

              <div className="flex-1 overflow-y-auto px-5 py-4">
                <textarea
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  rows={Math.min(14, Math.max(6, draft.split('\n').length + 2))}
                  className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 font-mono text-sm leading-relaxed text-slate-800 shadow-inner focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
                {hint && <p className="mt-2 text-xs text-slate-500">{hint}</p>}

                <div className="mt-5">
                  <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">
                    样式预览
                  </p>
                  <div className={`overflow-hidden rounded-xl border border-slate-200 ${className || 'bg-white p-4'}`}>
                    {renderPreview(draft)}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-200 px-5 py-4">
                <button
                  type="button"
                  onClick={cancel}
                  className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
                >
                  取消
                </button>
                <button
                  type="button"
                  onClick={save}
                  className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                >
                  保存
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  )
}
