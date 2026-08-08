import { useResumeTheme } from '../ResumeThemeContext'
import {
  EditableEducation,
  EditableHeader,
  EditableSelfEvaluation,
  EditableSummary,
  EditableWork,
  useResumePatch,
  type ResumeContentProps,
} from './resumeContent'

export function ExecutiveResumeLayout({
  resume,
  editable,
  onResumeChange,
}: ResumeContentProps) {
  const theme = useResumeTheme()
  const patchResume = useResumePatch(resume, onResumeChange)

  return (
    <div className="relative w-full overflow-visible">
      <article className={theme.article}>
        <EditableHeader resume={resume} editable={editable} patchResume={patchResume} bleed={0} />
        <EditableSummary resume={resume} editable={editable} patchResume={patchResume} />
        <EditableWork
          resume={resume}
          editable={editable}
          patchResume={patchResume}
          layout="executive"
        />
        <EditableEducation resume={resume} editable={editable} patchResume={patchResume} />
        <EditableSelfEvaluation resume={resume} editable={editable} patchResume={patchResume} />
      </article>
    </div>
  )
}
