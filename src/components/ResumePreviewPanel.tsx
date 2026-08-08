import ResumeView from './ResumeView'
import TemplateSelector from './TemplateSelector'
import { loadProfile } from '../utils/storage'
import { getResumeAvatarDisplayUrl, resolveProfileAvatarUrl } from '../utils/resumeAvatar'
import type { Resume } from '../types/resume'
import type { ResumeTemplateId } from '../templates'

function AvatarToggle({
  checked,
  previewUrl,
  onChange,
}: {
  checked: boolean
  previewUrl?: string
  onChange: (checked: boolean) => void
}) {
  return (
    <div className="flex items-center gap-2.5">
      <div
        className={`relative h-10 w-10 shrink-0 overflow-hidden rounded-full ring-2 transition ${
          checked ? 'ring-blue-200' : 'ring-slate-200'
        }`}
      >
        {previewUrl ? (
          <img src={previewUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-slate-100 text-[10px] text-slate-400">
            无
          </div>
        )}
        {!checked && <div className="absolute inset-0 bg-white/45" aria-hidden />}
      </div>

      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-slate-800">展示头像</span>
          <button
            type="button"
            role="switch"
            aria-checked={checked}
            aria-label={checked ? '关闭头像展示' : '开启头像展示'}
            onClick={() => onChange(!checked)}
            className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${
              checked ? 'bg-blue-600' : 'bg-slate-300'
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
                checked ? 'translate-x-4' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
        <p className="mt-0.5 text-[11px] text-slate-500">在简历页眉显示个人照片</p>
      </div>
    </div>
  )
}

export default function ResumePreviewPanel({
  resume,
  templateId,
  onTemplateChange,
  editable = false,
  onResumeChange,
}: {
  resume: Resume
  templateId: ResumeTemplateId
  onTemplateChange: (templateId: ResumeTemplateId) => void
  editable?: boolean
  onResumeChange?: (resume: Resume) => void
}) {
  const showAvatar = Boolean(resume.basicInfo.showAvatar)
  const avatarPreviewUrl = getResumeAvatarDisplayUrl({
    ...resume.basicInfo,
    showAvatar: true,
  })

  const handleShowAvatarChange = (nextShow: boolean) => {
    if (!onResumeChange) return

    const profileAvatar = resolveProfileAvatarUrl(loadProfile())
    const nextBasicInfo = {
      ...resume.basicInfo,
      showAvatar: nextShow,
      avatarUrl: resume.basicInfo.avatarUrl?.trim() || profileAvatar,
    }

    onResumeChange({
      ...resume,
      basicInfo: nextBasicInfo,
    })
  }

  return (
    <div className={`space-y-4 ${editable ? 'overflow-visible pr-14' : ''}`}>
      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 bg-slate-50/50 px-3 py-2.5 sm:px-4">
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-slate-900">简历模版</h3>
            <p className="mt-0.5 text-xs leading-snug text-slate-500">
              清简通栏可选配色；经典与高级共 8 种版式，各含 4 套配色
            </p>
          </div>

          {onResumeChange && (
            <div className="shrink-0 rounded-lg border border-slate-200 bg-white px-3 py-2">
              <AvatarToggle
                checked={showAvatar}
                previewUrl={avatarPreviewUrl}
                onChange={handleShowAvatarChange}
              />
            </div>
          )}
        </div>

        <div className="p-3 sm:p-3.5">
          <TemplateSelector
            value={templateId}
            onChange={onTemplateChange}
            layout="panel"
          />
        </div>
      </section>

      <ResumeView
        resume={resume}
        templateId={templateId}
        editable={editable}
        onResumeChange={onResumeChange}
      />
    </div>
  )
}
